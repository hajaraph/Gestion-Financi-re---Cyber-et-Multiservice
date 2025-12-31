---
description: Passer de Node.js (npm) à Bun pour le frontend React
---
Ce workflow permet de migrer le projet frontend vers Bun pour une exécution et une gestion des dépendances plus rapides.

1. **Installer Bun sur Windows** (si ce n'est pas déjà fait) :
   Exécutez cette commande dans un terminal PowerShell :
   ```powershell
   powershell -c "irm bun.sh/install.ps1 | iex"
   ```

2. **Supprimer les anciens fichiers de verrouillage** :
// turbo
   ```powershell
   Remove-Item d:\Cyber\Finance\templates\package-lock.json -Force
   ```

3. **Installer les dépendances avec Bun** :
   ```powershell
   cd d:\Cyber\Finance\templates
   bun install
   ```

4. **Lancer le serveur de développement** :
   ```powershell
   bun run dev
   ```

5. **Utiliser Bun pour les commandes futures** :
   Utilisez `bun add <package>` au lieu de `npm install <package>`.
