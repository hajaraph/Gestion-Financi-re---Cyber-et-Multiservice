#!/bin/sh

# Appliquer les migrations de base de données
echo "Application des migrations..."
python manage.py makemigrations
python manage.py migrate

# Démarrer le serveur
echo "Démarrage du serveur..."
exec "$@"
