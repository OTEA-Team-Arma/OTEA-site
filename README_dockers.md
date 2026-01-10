# Organisation des Dockers et du fichier mission.json

Ce guide explique comment organiser les conteneurs Docker pour le site OTEA et le script Python OTEA_sentinelle, et où placer le fichier mission.json selon deux scénarios.

---

## Cas A : mission.json dans le Docker Python (Sentinelle)

- Le fichier mission.json est stocké à l’intérieur du conteneur Python.
- OTEA_sentinelle.py lit et écrit directement mission.json.
- Le site web ne peut pas accéder à mission.json sauf si on expose ce fichier via une API ou un volume partagé.

**Avantages :**
- Sécurité : le fichier n’est pas accessible directement depuis l’extérieur.
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

---

## Cas B : mission.json en dehors du Docker Python (volume partagé)

- Le fichier mission.json est stocké sur l’hôte (serveur) dans un dossier partagé (ex : ./data).
- Les deux conteneurs (site web et sentinelle) accèdent au même fichier via un volume Docker.

**Avantages :**
- Synchronisation directe et instantanée entre le site et le script Python.
- Facile à sauvegarder ou à modifier depuis l’hôte.

**Inconvénients :**
- Le fichier est accessible depuis l’extérieur (selon configuration).
- Il faut bien configurer les volumes dans docker-compose.

**Exemple docker-compose.yml :**
```yaml
services:
  nginx:
    # ...config...
    volumes:
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

## Recommandation

- Pour un site dynamique et synchronisé, privilégiez le **Cas B** (volume partagé).
- Pour un usage isolé ou sécurisé, utilisez le **Cas A**.

Adaptez la structure selon vos besoins et la politique de sécurité de votre serveur.
