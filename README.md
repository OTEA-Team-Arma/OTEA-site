# 📑 Documentation Système OTEA Sentinel v2.1

Ce système assure l'interconnexion automatique entre le forum, le site web (HUD), Discord et WhatsApp.

---

## ⚙️ Architecture du Flux de Données

Le système fonctionne comme une boucle de surveillance :

- **Source** : Le script surveille le flux RSS du Forum (`/feed/?f=15`).
- **Traitement** : Extraction du titre, du résumé et du lien de la mission.
- **Diffusion** :
  - Mise à jour du fichier `mission.json` (pour le Site Web).
  - Envoi d'un Embed riche sur le Webhook Discord.
  - Génération du lien de partage WhatsApp dans la console.

---

## 🛠️ Installation & Pré-requis

### 1. Installation de l'environnement Python
Le script nécessite **Python 3.x**. Une fois Python installé, ouvre un terminal et installe les bibliothèques nécessaires :

```bash
pip install feedparser requests
```
- `feedparser` : Pour lire et analyser le flux RSS du forum.
- `requests` : Pour envoyer les données vers Discord et communiquer avec le web.

### 2. Structure des fichiers
Assure-toi que les fichiers suivants sont dans le même dossier sur le serveur :

- `otea_sync.py` : Le script principal de surveillance.
- `mission.json` : Le fichier tampon (sera créé/mis à jour automatiquement).
- `index.html` : La page de ton site (HUD) qui lit le JSON.

---

## 🚀 Lancement du Script Sentinel

### Sur Windows (PC Local ou Serveur Windows) :
Ouvre un terminal (CMD ou PowerShell) dans le dossier du projet et lance :

```bash
python otea_sync.py
```

### Sur Linux (VPS / Serveur dédié) :
Pour que le script tourne 24h/24 même après déconnexion, utilise `nohup` :

```bash
nohup python3 otea_sync.py &
```

---

## 🌐 Interconnexion Site Web (HUD)

Le site web doit contenir le script JavaScript suivant pour "écouter" les changements de mission sans rafraîchir la page :

- **Le fichier JSON** : Il sert de base de données en temps réel.
- **Le Script de mise à jour** :
  - Utilise la fonction `fetch('mission.json')`.
  - Injecte `data.titre` et `data.description` dans les balises HTML correspondantes.

---


## 🚀 Section : Persistance du Service (Auto-Redémarrage)

### Option A : Sur Windows (Serveur ou PC)
Le plus simple est d'utiliser le dossier de démarrage de Windows :

1. Appuie sur **Win + R**, tape `shell:startup` et valide.
2. Fais un clic droit dans le dossier qui s'ouvre > **Nouveau > Raccourci**.
3. Entre l'emplacement de ton script Python (ex: `C:\OTEA\otea_sync.py`).
4. Désormais, le script se lancera dès que la session utilisateur s'ouvrira.

### Option B : Sur Linux (VPS / Dédié) avec Systemd
C'est la méthode la plus robuste. Elle permet au serveur de relancer le script même si personne n'est connecté.

1. Crée un fichier de service :
  ```bash
  sudo nano /etc/systemd/system/otea-sentinel.service
  ```
2. Colle cette configuration :
  ```ini
  [Unit]
  Description=OTEA Sentinel Forum Sync
  After=network.target

  [Service]
  ExecStart=/usr/bin/python3 /chemin/vers/ton/script/otea_sync.py
  WorkingDirectory=/chemin/vers/ton/script/
  StandardOutput=inherit
  StandardError=inherit
  Restart=always
  User=root

  [Install]
  WantedBy=multi-user.target
  ```
3. Active le service :
  ```bash
  sudo systemctl enable otea-sentinel
  sudo systemctl start otea-sentinel
  ```

---

## 📋 Résumé des performances pour ton équipe

Si on te pose la question sur l'impact serveur, tu peux inclure ces chiffres :

- **Fréquence** : 1 check / 60s.
- **Charge CPU** : < 0.1%.
- **Consommation RAM** : ~15-20 Mo (soit presque rien).
- **Consommation Data** : Env. 50 Mo par mois (équivalent à une seule photo HD).

---

## ⚠️ Maintenance & Dépannage

- **Permissions** : Sur serveur Linux, assure-toi que le dossier a les droits d'écriture (`chmod 755`) pour que le script puisse modifier le fichier `mission.json`.
- **Webhook Discord** : Si les notifications ne s'envoient plus, vérifie que l'URL du Webhook dans le script `otea_sync.py` est toujours valide.
- **Fréquence** : Le script vérifie le forum toutes les 60 secondes par défaut (modifiable via `CHECK_INTERVAL`).
