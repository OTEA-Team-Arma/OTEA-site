# Guide d'installation OTEA-site & OTEA_sentinelle (Docker)

Ce guide explique comment déployer le site web OTEA et le script Python OTEA_sentinelle.py dans des conteneurs Docker séparés sur un serveur Linux.

---

## 1. Déploiement du site web (Apache + PHP)

### a. Créez un fichier `Dockerfile` à la racine du projet :
```
FROM php:8.2-apache
COPY . /var/www/html/
RUN a2enmod rewrite
RUN chown -R www-data:www-data /var/www/html
EXPOSE 80
```

### b. Construisez l'image Docker :
```sh
docker build -t otea-site .
```

### c. Lancez le conteneur :
```sh
docker run -d -p 8080:80 --name otea-site otea-site
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
