# Guide d'installation OTEA-site & OTEA_sentinelle (Docker)

Ce guide explique comment déployer le site web OTEA et le script Python OTEA_sentinelle.py dans des conteneurs Docker séparés sur un serveur Linux.

---


## 1. Déploiement du site web (Nginx + PHP-FPM)

### a. Créez deux fichiers à la racine du projet :

#### `Dockerfile`
```
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

#### `nginx.conf`
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

### b. Créez un fichier `docker-compose.yml` :
```
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

Le site sera accessible sur http://localhost:8080

---

## 2. Déploiement du script Python OTEA_sentinelle.py

### a. Créez un fichier `Dockerfile-python` à la racine du projet :
```
FROM python:3.11-slim
WORKDIR /app
COPY OTEA_sentinelle.py mission.json ./
RUN pip install feedparser requests
CMD ["python", "OTEA_sentinelle.py"]
```

### b. Construisez l'image Docker :
```sh
docker build -f Dockerfile-python -t otea-sentinelle .
```

### c. Lancez le conteneur :
```sh
docker run -d --name otea-sentinelle otea-sentinelle
```

---

## 3. Conseils
- Les deux conteneurs sont indépendants et peuvent tourner sur le même serveur.
- Pour la persistance de mission.json, utilisez un volume Docker si besoin.
- Pour la base de données, ajoutez un service dans un `docker-compose.yml`.
- Pour relancer le script Python automatiquement, voir la section systemd du README principal.

---

Pour toute question, consultez le README principal ou contactez l'équipe OTEA.
