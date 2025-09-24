# Déploiement du Système d'Édition d'Histoires Interactives

## Préparation pour Git Remote

### 1. Créer un dépôt distant
```bash
# Sur GitHub, GitLab ou autre plateforme Git
# Créer un nouveau repository (par exemple: mon-editeur-histoires)
```

### 2. Ajouter le remote et pousser
```bash
# Ajouter l'origine distante
git remote add origin https://github.com/VOTRE_USERNAME/VOTRE_REPO.git

# Pousser le code
git branch -M main
git push -u origin main
```

## Installation sur un Nouveau Système

### 1. Cloner le projet
```bash
git clone https://github.com/VOTRE_USERNAME/VOTRE_REPO.git
cd VOTRE_REPO
```

### 2. Installation des dépendances
```bash
npm install
```

### 3. Configuration de l'environnement
```bash
# Copier le fichier d'exemple d'environnement
cp .env.example .env

# Éditer .env avec vos configurations :
# DATABASE_URL="file:./prisma/dev.db"
# SESSION_SECRET="votre-secret-session-tres-long-et-securise"
```

### 4. Configuration de la base de données
```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# (Optionnel) Ajouter des données de test
npx prisma db seed
```

### 5. Lancement
```bash
# Développement
npm run dev

# Production
npm run build
npm start
```

## Structure du Projet Versionnée

### Fichiers inclus dans Git :
- Code source complet (src/, prisma/schema.prisma, etc.)
- Configuration (package.json, next.config.js, tailwind.config.js)
- Documentation (README.md, DEPLOYMENT.md)
- Migrations de base de données

### Fichiers exclus du versioning :
- Base de données SQLite (*.db, *.db-journal)
- Variables d'environnement (.env*)
- Dossier uploads (public/uploads/)
- node_modules et fichiers de build
- Fichiers IDE et système

## Fonctionnalités Déployées

✅ **Éditeur Complet d'Histoires**
- Création/édition de pages avec contenu riche
- Système de choix avec mécaniques avancées (combat, pièges, etc.)
- Upload et gestion d'images par page

✅ **Mécaniques de Jeu Avancées**
- Gestion des échecs (combat, piège, puzzle, social)
- Système de points de vie et statistiques
- Navigation conditionnelle entre pages

✅ **Modes de Prévisualisation**
- Mode éditeur : test libre de la cohérence de l'histoire
- Mode jeu : expérience complète avec règles et contraintes

✅ **Gestion des Histoires**
- Statut de publication (brouillon/publié)
- Suppression sécurisée avec nettoyage
- Interface utilisateur intuitive

✅ **Système d'Authentification**
- Sessions sécurisées
- Gestion multi-utilisateurs
- Contrôle d'accès aux histoires

## Notes de Version

**Version Initiale (v1.0.0)**
- Système complet d'édition d'histoires interactives
- Toutes les fonctionnalités demandées implémentées
- Prêt pour déploiement en production

## Support

Pour toute question ou problème :
1. Vérifier que toutes les dépendances sont installées
2. S'assurer que la base de données est correctement migrée
3. Vérifier les permissions sur le dossier uploads
4. Consulter les logs de l'application en cas d'erreur