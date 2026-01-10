import feedparser
import json
import time
import requests
import re
from datetime import datetime, timedelta

# --- CONFIGURATION ---
RSS_URL = "https://otea.forum-pro.fr/feed/?f=15"
JSON_FILE = "mission.json"
# COLLE TON URL DE WEBHOOK DISCORD CI-DESSOUS

# Définir l'URL du webhook Discord
DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1458222414151422045/7s4NMg5FFOPj1NYqXEo-VGmALaKj9-23Ate5XeM5CQeI6wxbvgSo_LOYsgcaXUcIyj17"
CHECK_INTERVAL = 60 

def send_to_discord(title, summary, link, published):
    # Nettoyage du HTML pour un affichage propre sur Discord
    clean_text = re.sub('<[^<]+?>', '', summary)
    if len(clean_text) > 500:
        clean_text = clean_text[:500] + "..."

    # Formatage de la date
    try:
        date_obj = datetime(*published[:6])
        date_str = date_obj.strftime('%A %d %B %Y à %Hh%M')
    except Exception:
        date_str = "Date inconnue"

    payload = {
        "content": "🚨 @everyone **NOUVEL ORDRE DE MISSION REÇU** 🚨",
        "embeds": [{
            "title": f"📑 {title}",
            "url": link,
            "description": f"**CONTENU DU BRIEFING :**\n\n{clean_text}\n\n**Date de publication :** {date_str}",
            "color": 65280,
            "footer": {
                "text": f"Système de transmission OTEA v2.1 | Publié le {date_str}"
            }
        }]
    }
    try:
        requests.post(DISCORD_WEBHOOK_URL, json=payload)
        print("--- [DISCORD] Notification envoyée avec succès.")
    except Exception as e:
        print(f"--- [ERROR] Échec de l'envoi Discord : {e}")

def update_mission_json(title, summary, published):
    clean_description = re.sub('<[^<]+?>', '', summary)
    # Extraction de la date depuis le titre (formats acceptés : 06/01/2026, 06-01-2026, 6/1/2026, etc.)
    date_match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', title)
    if date_match:
        jour, mois, annee = date_match.groups()
        date_str = f"{int(jour):02d}/{int(mois):02d}/{annee}"
    else:
        # fallback sur la date du RSS si non trouvée dans le titre
        try:
            date_obj = datetime(*published[:6])
            date_str = date_obj.strftime('%d/%m/%Y')
        except Exception:
            date_str = "Date inconnue"
    try:
        heure_str = date_obj.strftime('%Hh%M')
    except Exception:
        heure_str = "21H00"
    global latest_entry
    try:
        lien_briefing = latest_entry.link
    except Exception:
        lien_briefing = ""
    data = {
        "titre": title,
        "description": clean_description,
        "date": date_str,
        "heure": heure_str,
        "lienBriefing": lien_briefing,
        "status": "MISSION ACTIVE"
    }
    with open(JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print(f"--- [SYNC] HUD mis à jour : {title} ({date_str} {heure_str})")

def monitor_forum():
    print(f"--- [OTEA] Sentinel v2.1 lancée.")
    print(f"--- [INFO] Surveillance active sur : {RSS_URL}")
    while True:
        try:
            feed = feedparser.parse(RSS_URL)
            print(f"[DEBUG] Nombre d'entrées RSS : {len(feed.entries)}")
            # Détermination de la semaine courante (lundi à dimanche)
            today = datetime.today()
            jour_semaine = today.weekday()  # 0 = lundi
            debut_semaine = today.replace(hour=0, minute=0, second=0, microsecond=0) - timedelta(days=jour_semaine)
            fin_semaine = debut_semaine + timedelta(days=6, hours=23, minutes=59, seconds=59)

            missions_semaine = []
            mission_vendredi = None
            for entry in feed.entries:
                date_match = re.search(r'(\d{1,2})[/-](\d{1,2})[/-](\d{4})', entry.title)
                if date_match:
                    jour, mois, annee = date_match.groups()
                    try:
                        date_mission = datetime(int(annee), int(mois), int(jour))
                    except Exception:
                        continue
                    if debut_semaine <= date_mission <= fin_semaine:
                        missions_semaine.append((date_mission, entry))
                        if date_mission.weekday() == 4:  # 4 = vendredi
                            mission_vendredi = (date_mission, entry)
            # On mémorise l'ID de la mission envoyée pour ne pas spammer Discord
            try:
                with open('last_mission_id.txt', 'r') as f:
                    last_mission_id = f.read().strip()
            except Exception:
                last_mission_id = ""

            mission_to_send = None
            mission_id = ""
            if mission_vendredi:
                mission_to_send = mission_vendredi[1]
                mission_id = getattr(mission_to_send, 'id', mission_to_send.title)
                print(f"[DEBUG] Mission du vendredi trouvée : {mission_to_send.title}")
            elif missions_semaine:
                missions_semaine.sort(reverse=True)
                mission_to_send = missions_semaine[0][1]
                mission_id = getattr(mission_to_send, 'id', mission_to_send.title)
                print(f"[DEBUG] Mission la plus récente de la semaine : {mission_to_send.title}")

            if mission_to_send:
                globals()['latest_entry'] = mission_to_send
                update_mission_json(mission_to_send.title, mission_to_send.summary, mission_to_send.published_parsed)
                if mission_id != last_mission_id:
                    send_to_discord(mission_to_send.title, mission_to_send.summary, mission_to_send.link, mission_to_send.published_parsed)
                    with open('last_mission_id.txt', 'w') as f:
                        f.write(mission_id)
            else:
                print("[DEBUG] Aucune mission trouvée pour cette semaine. Mode stand-by.")
                # Générer un mission.json stand-by
                data = {
                    "titre": "Aucune mission prévue",
                    "description": "Aucune opération planifiée pour cette semaine. Consultez le forum pour plus d'informations.",
                    "date": "",
                    "heure": "",
                    "lienBriefing": "",
                    "status": "STAND-BY"
                }
                with open(JSON_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, indent=4, ensure_ascii=False)
            time.sleep(CHECK_INTERVAL)
        except Exception as e:
            print(f"--- [ERROR] Erreur lors de la lecture du flux : {e}")
            time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    monitor_forum()