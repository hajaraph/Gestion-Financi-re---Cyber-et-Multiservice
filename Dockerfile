# Utiliser une image Python officielle basée sur Debian (slim) pour la compatibilité apt-get
# On utilise python:3.12-slim pour correspondre à votre version de développement
FROM python:3.12-slim

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Définir les variables d'environnement
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Installer les dépendances système nécessaires
# build-essential et python3-dev pour compiler certains paquets Python
# libpq-dev pour PostgreSQL (si utilisé plus tard)
# cairo, pango, gdk-pixbuf pour xhtml2pdf/weasyprint si nécessaire
# Ajout de pkg-config et libcairo2-dev pour la compilation de pycairo
RUN apt-get update && apt-get install -y \
    build-essential \
    python3-dev \
    libpq-dev \
    libcairo2 \
    libcairo2-dev \
    pkg-config \
    libpango-1.0-0 \
    libpangocairo-1.0-0 \
    libgdk-pixbuf-2.0-0 \
    libffi-dev \
    shared-mime-info \
    dos2unix \
    && rm -rf /var/lib/apt/lists/*

# Copier le fichier requirements.txt
COPY requirements.txt /app/

# Installer les dépendances Python
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
# Installer gunicorn pour la production
RUN pip install gunicorn

# Copier le reste du code de l'application
COPY . /app/

# Copier le script d'entrypoint
COPY entrypoint.sh /app/
RUN dos2unix /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Collecter les fichiers statiques
RUN python manage.py collectstatic --noinput

# Exposer le port sur lequel l'application va tourner
EXPOSE 8000

# Utiliser le script d'entrypoint avec sh explicitement
ENTRYPOINT ["sh", "/app/entrypoint.sh"]

# Commande pour lancer l'application avec Gunicorn
CMD ["gunicorn", "Finance.wsgi:application", "--bind", "0.0.0.0:8000"]
