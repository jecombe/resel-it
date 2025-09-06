# Base image
FROM node:20

# Dossier de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install


# Copier le reste du code
COPY . .

# Exposer le port
EXPOSE 3000

# Commande par défaut
CMD ["npm", "run", "dev"]
