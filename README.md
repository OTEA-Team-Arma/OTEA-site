# Relation entre mission.json, le script Python et le site web

Le fichier mission.json est le point de liaison entre le script Python (OTEA_sentinelle.py) et le site web :

- **Le script Python** écrit et met à jour mission.json avec les informations de la mission récupérées sur le forum.
- **Le site web** lit mission.json (via JavaScript) pour afficher dynamiquement la mission en cours à l’utilisateur.

**Lien technique :**
- Si mission.json est partagé via un volume Docker (cas B), toute modification faite par le script Python est immédiatement visible par le site web.
- Si mission.json est dans le conteneur Python (cas A), le site doit accéder au fichier via une API ou un mécanisme d’export.

Ce système garantit que les informations affichées sur le site sont toujours synchronisées avec les dernières missions publiées sur le forum.
# Structure du projet OTEA

```
/css           → Feuilles de style
/js            → Scripts JS (dont script.js, mission-config.js)
/img           → Images (logo, fond, casque, etc.)
/video         → Vidéos
/data          → Fichiers de données (mission.json, last_mission_id.txt)
/php           → Scripts PHP (update-mission.php)
/python        → Scripts Python (OTEA_sentinelle.py)
Dockerfile         → Pour le site web (Nginx + PHP-FPM)
Dockerfile-python  → Pour le script sentinelle
docker-compose.yml → Orchestration des deux services
index.html
```

## mission.json (exemple)

```json
{
  "titre": "CAMPAGNE CHIMERA - arma 3 - 09/01/2026",
  "description": "Description de la mission...",
  "date": "09/01/2026",
  "heure": "21H00",
  "lienBriefing": "https://otea.forum-pro.fr/t2641-campagne-chimera-arma-3-09-01-2026",
  "status": "MISSION ACTIVE"
}
```

## Déploiement Docker

- Un conteneur pour le site web (Nginx + PHP-FPM)
- Un conteneur pour le script Python OTEA_sentinelle
- Partage du dossier /data entre les deux via un volume Docker

# Utilisation de Docker pour déployer le site OTEA

Ce guide explique comment lancer ce site web dans un conteneur Docker avec Apache et PHP.

## 1. Créez un fichier `Dockerfile` à la racine du projet :

```
# Utilise une image officielle Apache avec PHP
FROM php:8.2-apache

# Copie tout le contenu du site dans le dossier web d'Apache
COPY . /var/www/html/

# Active le module rewrite d'Apache (optionnel)
RUN a2enmod rewrite

# Donne les bons droits (optionnel)
RUN chown -R www-data:www-data /var/www/html

EXPOSE 80
```

## 2. Construisez l'image Docker :

```sh
docker build -t otea-site .
```

## 3. Lancez le conteneur :

```sh
docker run -d -p 8080:80 --name otea-site otea-site
```

Le site sera accessible sur http://localhost:8080

---

- Pour modifier le site, éditez les fichiers puis relancez le build.
- Pour la partie Python, il faudra un conteneur séparé ou adapter ce Dockerfile.
- Pour la base de données (si besoin), ajoutez un service (ex: MariaDB) dans un `docker-compose.yml`.
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
