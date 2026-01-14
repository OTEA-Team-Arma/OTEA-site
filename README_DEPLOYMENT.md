# Guide de Déploiement OTEA-site et OTEA_sentinelle (Docker)

Ce guide explique comment déployer le site web OTEA, configurer les certificats SSL/TLS avec Let's Encrypt, et orchestrer le script Python OTEA_sentinelle dans des conteneurs Docker.

---

## Table des matières

1. [Structure du projet](#structure-du-projet)
2. [Format mission.json](#format-missionjson)
3. [Déploiement du site web (Nginx + PHP-FPM)](#déploiement-du-site-web-nginx--php-fpm)
4. [Configuration HTTPS avec Let's Encrypt](#configuration-https-avec-lets-encrypt)
5. [Organisation des conteneurs et volumes](#organisation-des-conteneurs-et-volumes)
6. [Déploiement du script Python](#déploiement-du-script-python)
7. [Conseils et bonnes pratiques](#conseils-et-bonnes-pratiques)

---

## Structure du projet

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

---

## Format mission.json

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

---

## Déploiement du site web (Nginx + PHP-FPM)

### a. Créez deux fichiers à la racine du projet :

#### `Dockerfile`
```dockerfile
FROM nginx:1.25-alpine AS nginx
FROM php:8.2-fpm-alpine AS php

# Copie le code source dans les deux images
WORKDIR /var/www/html
COPY . /var/www/html

# Prépare Nginx
FROM nginx:1.25-alpine
COPY --from=php /var/www/html /var/www/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### `nginx.conf` (Version HTTP uniquement)
```
events {}
http {
	server {
		listen 80;
		server_name _;
		root /var/www/html;
		index index.php index.html;

		location / {
			try_files $uri $uri/ =404;
		}

		location ~ \.php$ {
			fastcgi_pass   php:9000;
			fastcgi_index  index.php;
			fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
			include        fastcgi_params;
		}
	}
}
```

### b. Créez un fichier `docker-compose.yml` (version HTTP) :
```yaml
version: '3.8'
services:
	nginx:
		build: .
		ports:
			- "8080:80"
		depends_on:
			- php
		volumes:
			- .:/var/www/html
		networks:
			- otea-net
	php:
		image: php:8.2-fpm-alpine
		volumes:
			- .:/var/www/html
		networks:
			- otea-net
networks:
	otea-net:
		driver: bridge
```

### c. Lancez le site :
```sh
docker-compose up -d
```

Le site sera accessible sur `http://localhost:8080`

---

## Configuration HTTPS avec Let's Encrypt

### Prérequis
- Un **domaine public** pointant vers votre serveur (ex: otea.fr)
- Accès SSH au serveur Linux
- Port **443** ouvert sur votre pare-feu

### Installation de Certbot et Let's Encrypt

```sh
# Sur le serveur Linux, installez Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Générez le certificat (remplacez par votre domaine)
sudo certbot certonly --standalone -d otea.fr -d www.otea.fr
```

Les certificats seront créés dans `/etc/letsencrypt/live/otea.fr/`

### Mettez à jour le `nginx.conf` pour HTTPS

```
events {}
http {
	# Redirection HTTP → HTTPS
	server {
		listen 80;
		server_name otea.fr www.otea.fr;
		return 301 https://$server_name$request_uri;
	}

	# Configuration HTTPS
	server {
		listen 443 ssl http2;
		server_name otea.fr www.otea.fr;
		root /var/www/html;
		index index.php index.html;

		# Certificats Let's Encrypt
		ssl_certificate /etc/letsencrypt/live/otea.fr/fullchain.pem;
		ssl_certificate_key /etc/letsencrypt/live/otea.fr/privkey.pem;

		# Configuration SSL/TLS
		ssl_protocols TLSv1.2 TLSv1.3;
		ssl_ciphers HIGH:!aNULL:!MD5;
		ssl_prefer_server_ciphers on;

		location / {
			try_files $uri $uri/ =404;
		}

		location ~ \.php$ {
			fastcgi_pass   php:9000;
			fastcgi_index  index.php;
			fastcgi_param  SCRIPT_FILENAME $document_root$fastcgi_script_name;
			include        fastcgi_params;
		}
	}
}
```

### Mettez à jour le `docker-compose.yml` pour HTTPS

```yaml
version: '3.8'
services:
	nginx:
		build: .
		ports:
			- "80:80"       # HTTP
			- "443:443"     # HTTPS
		depends_on:
			- php
		volumes:
			- .:/var/www/html
			- /etc/letsencrypt:/etc/letsencrypt:ro  # Monter les certificats
		networks:
			- otea-net
	php:
		image: php:8.2-fpm-alpine
		volumes:
			- .:/var/www/html
		networks:
			- otea-net
	python:
		build:
			context: .
			dockerfile: Dockerfile-python
		volumes:
			- .:/app
		networks:
			- otea-net
networks:
	otea-net:
		driver: bridge
```

### Renouvellement automatique du certificat

```sh
# Ajoutez une tâche cron pour renouveler le certificat tous les 60 jours
sudo crontab -e

# Ajoutez la ligne:
0 0 1 * * certbot renew --quiet && docker restart nginx
```

### Lancez avec HTTPS activé

```sh
docker-compose down
docker-compose up -d
```

Le site sera maintenant accessible en **HTTPS** sur `https://otea.fr`

---

## Organisation des conteneurs et volumes

### Cas A : mission.json dans le Docker Python (Sentinelle)

- Le fichier mission.json est stocké à l'intérieur du conteneur Python.
- OTEA_sentinelle.py lit et écrit directement mission.json.
- Le site web ne peut pas accéder à mission.json sauf si on expose ce fichier via une API ou un volume partagé.

**Avantages :**
- Sécurité : le fichier n'est pas accessible directement depuis l'extérieur.
- Simplicité pour le script Python.

**Inconvénients :**
- Le site web doit utiliser une API ou un mécanisme pour lire mission.json.
- Moins flexible pour la synchronisation directe.

**Exemple Dockerfile-python :**
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY python/OTEA_sentinelle.py ./
COPY data/mission.json ./data/mission.json
RUN pip install feedparser requests
CMD ["python", "OTEA_sentinelle.py"]
```

### Cas B : mission.json en dehors du Docker Python (volume partagé) - RECOMMANDÉ

- Le fichier mission.json est stocké sur l'hôte (serveur) dans un dossier partagé (ex : ./data).
- Les deux conteneurs (site web et sentinelle) accèdent au même fichier via un volume Docker.

**Avantages :**
- Synchronisation directe et instantanée entre le site et le script Python.
- Facile à sauvegarder ou à modifier depuis l'hôte.

**Inconvénients :**
- Le fichier est accessible depuis l'extérieur (selon configuration).
- Il faut bien configurer les volumes dans docker-compose.

**Exemple docker-compose.yml :**
```yaml
services:
	nginx:
		# ...config...
		volumes:
			- .:/var/www/html
			- ./data:/var/www/html/data
	php:
		# ...config...
		volumes:
			- ./data:/var/www/html/data
	python:
		# ...config...
		volumes:
			- ./data:/app/data
```

---

## Déploiement du script Python

### a. Créez un fichier `Dockerfile-python` à la racine du projet :
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY python/OTEA_sentinelle.py ./
COPY data/mission.json ./data/mission.json
RUN pip install feedparser requests
CMD ["python", "OTEA_sentinelle.py"]
```

### b. Le fichier `docker-compose.yml` inclut maintenant le service Python :

Voir la section "Configuration HTTPS avec Let's Encrypt" ci-dessus pour le docker-compose.yml complet.

### c. Lancez tous les services ensemble :
```sh
docker-compose up -d
```

Le site web et le script Python tourneront simultanément dans des conteneurs séparés.

---

## Conseils et bonnes pratiques

- **Cas recommandé** : Privilégiez le **Cas B** (volume partagé) pour un site dynamique et synchronisé.
- **Sécurité** : Pour un usage isolé ou sécurisé, utilisez le **Cas A**.
- **Persistance** : Utilisez un volume Docker pour persister mission.json entre les redémarrages.
- **Base de données** : Pour la persistance avancée, ajoutez un service dans le docker-compose.yml (MariaDB, PostgreSQL, etc.).
- **Script Python automatisé** : Voir la section systemd du README principal pour relancer le script Python automatiquement.
- **HTTPS** : Vérifiez que votre domaine pointe bien vers le serveur avant de générer le certificat.
- **Renouvellement certificat** : Let's Encrypt renouvelle les certificats tous les 90 jours. La tâche cron le fait automatiquement.
- **Vérification certificat** : Pour vérifier votre certificat : `sudo certbot certificates`
- **Renouvellement manuel** : `sudo certbot renew --force-renewal`

---

## Dépannage

### Le conteneur Nginx ne démarre pas
```sh
docker-compose logs nginx
```

### Vérifier les logs Python
```sh
docker-compose logs python
```

### Redémarrer tous les services
```sh
docker-compose restart
```

### Supprimer et recréer les conteneurs
```sh
docker-compose down
docker-compose up -d
```

---

Pour toute question, consultez le README principal ou contactez l'équipe OTEA.
