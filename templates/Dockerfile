# Étape 1 : Construction de l'application React avec Bun
FROM oven/bun:alpine as build

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de dépendances
# Bun utilise bun.lock (ou bun.lockb)
COPY package.json bun.lock* ./

# Installer les dépendances avec Bun
RUN bun install --frozen-lockfile

# Copier le reste des fichiers du projet
COPY . .

# Définir les arguments de build pour Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

# Construire l'application pour la production avec Bun
RUN bun run build

# Étape 2 : Serveur Nginx pour servir les fichiers statiques
FROM nginx:alpine

# Copier les fichiers de build depuis l'étape précédente vers le répertoire de Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Copier la configuration Nginx personnalisée
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer Nginx
CMD ["nginx", "-g", "daemon off;"]
