# 📖 Livres dont vous êtes le héros - Éditeur et Jeu

Une plateforme web complète pour créer et jouer des "livres dont vous êtes le héros" interactifs avec des mécaniques de jeu avancées.

## 🎯 Fonctionnalités

### ✍️ Éditeur d'histoires
- **Création d'histoires** : Interface intuitive pour créer des histoires interactives
- **Gestion des pages** : Éditeur de pages avec contenu riche et images
- **Système de choix avancé** : Choix avec conditions, tests de dés, et mécaniques d'échec
- **Upload d'images** : Ajout d'images pour illustrer chaque page
- **Prévisualisation éditeur** : Mode de test pour naviguer librement dans l'histoire
- **Gestion du statut** : Marquer les histoires comme terminées ou en cours
- **Suppression sécurisée** : Suppression complète avec confirmation

### 🎮 Système de jeu
- **Sessions de jeu** : Sauvegarde automatique de la progression
- **Système de stats** : Gestion des PV, Force, Dextérité, Intelligence
- **Tests de compétences** : Lancers de dés avec conditions de réussite/échec
- **Inventaire** : Système de gestion des objets
- **Mécaniques d'échec** : Différents types d'échecs (combat, piège, puzzle, social)
- **Historique** : Suivi de la progression du joueur

## 🛠️ Technologies utilisées

- **Frontend** : Next.js 15, React, TypeScript, Tailwind CSS
- **Backend** : Next.js API Routes, Prisma ORM
- **Base de données** : SQLite
- **Authentification** : Sessions sécurisées
- **Upload** : Système de fichiers local

## 🚀 Installation

1. **Cloner le projet**
   ```bash
   git clone [votre-repo]
   cd gamebook-site
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer la base de données**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. **Lancer le serveur de développement**
   ```bash
   npm run dev
   ```

5. **Accéder à l'application**
   - Ouvrir [http://localhost:3000](http://localhost:3000)

## 🎲 Mécaniques de jeu

### Tests de compétences
- **Dés + Stat vs Difficulté** : Le joueur lance un dé, ajoute sa statistique et compare au seuil
- **Types de stats** : Force, Dextérité, Intelligence
- **Gestion d'échecs** : Différents types d'échecs avec conséquences spécifiques

### Types d'échecs
- **Combat** : Perte de PV, redirection vers page d'échec
- **Piège** : Dégâts et/ou redirection
- **Puzzle** : Blocage ou pénalité
- **Social** : Conséquences narratives

## 📁 Structure du projet

```
src/
├── app/                    # Pages Next.js App Router
│   ├── api/               # API Routes
│   ├── editor/            # Interface éditeur
│   ├── game-menu/         # Menu principal du jeu
│   └── stories/           # Pages des histoires
├── components/            # Composants React
│   ├── GameClient.tsx     # Interface de jeu
│   ├── PageEditor.tsx     # Éditeur de pages
│   └── EditorPreview.tsx  # Prévisualisation éditeur
├── lib/                   # Utilitaires
└── prisma/               # Schéma de base de données
```
