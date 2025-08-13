# API de Gestion Financière - Cyber et Multiservice

## Vue d'ensemble
Cette API REST permet de gérer les recettes et dépenses d'un cyber café et centre multiservice.

## Endpoints de l'API

### Base URL
- Développement: `http://localhost:8000/api/`

### Endpoints principaux

#### 1. Catégories de services
- **GET** `/api/categories/` - Liste toutes les catégories
- **POST** `/api/categories/` - Créer une nouvelle catégorie
- **GET** `/api/categories/{id}/` - Détails d'une catégorie
- **PUT/PATCH** `/api/categories/{id}/` - Modifier une catégorie
- **DELETE** `/api/categories/{id}/` - Supprimer une catégorie

#### 2. Transactions générales
- **GET** `/api/transactions/` - Liste toutes les transactions
- **GET** `/api/transactions/?type=RECETTE` - Filtrer par type (RECETTE/DEPENSE)
- **GET** `/api/transactions/?date_debut=2024-01-01&date_fin=2024-12-31` - Filtrer par période
- **GET** `/api/transactions/resume_journalier/` - Résumé financier du jour
- **GET** `/api/transactions/resume_mensuel/` - Résumé financier du mois

#### 3. Recettes Internet
- **GET** `/api/recettes-internet/` - Liste des recettes Internet
- **POST** `/api/recettes-internet/` - Enregistrer une nouvelle recette Internet
- **GET** `/api/recettes-internet/statistiques_forfaits/` - Statistiques par type de forfait

**Exemple de création d'une recette Internet :**
```json
{
    "type_forfait": "HEURE",
    "duree_minutes": 60,
    "poste_utilise": "PC-01",
    "montant": 500,
    "description": "Navigation Internet 1h"
}
```

#### 4. Recettes Impression
- **GET** `/api/recettes-impression/` - Liste des recettes d'impression
- **POST** `/api/recettes-impression/` - Enregistrer une nouvelle recette d'impression

#### 5. Recettes Multiservice
- **GET** `/api/recettes-multiservice/` - Liste des recettes multiservice
- **POST** `/api/recettes-multiservice/` - Enregistrer une nouvelle recette multiservice

#### 6. Dépenses
- **GET** `/api/depenses/` - Liste des dépenses
- **POST** `/api/depenses/` - Enregistrer une nouvelle dépense
- **GET** `/api/depenses/par_categorie/` - Statistiques par catégorie de dépense

**Exemple de création d'une dépense :**
```json
{
    "categorie_depense": "ELECTRICITE",
    "fournisseur": "CIE",
    "numero_facture": "FAC-2024-001",
    "montant": 25000,
    "description": "Facture électricité janvier 2024"
}
```

## Types de données

### Types de forfaits Internet
- `HEURE` - À l'heure
- `JOURNEE` - Forfait journée
- `SEMAINE` - Forfait semaine
- `MOIS` - Forfait mensuel

### Types de papier (Impression)
- `A4_NB` - A4 Noir et Blanc
- `A4_COULEUR` - A4 Couleur
- `A3_NB` - A3 Noir et Blanc
- `A3_COULEUR` - A3 Couleur

### Services multiservice
- `PHOTOCOPIE` - Photocopie
- `RELIURE` - Reliure
- `PLASTIFICATION` - Plastification
- `SCAN` - Numérisation
- `AUTRE` - Autre service

### Catégories de dépenses
- `ELECTRICITE` - Électricité
- `INTERNET` - Connexion Internet
- `MAINTENANCE` - Maintenance équipements
- `FOURNITURES` - Fournitures de bureau
- `SALAIRE` - Salaires
- `LOYER` - Loyer
- `AUTRE` - Autre dépense

## Administration
Accès à l'interface d'administration Django : `http://localhost:8000/admin/`

## Démarrage rapide

1. **Créer un superutilisateur :**
```bash
python manage.py createsuperuser
```

2. **Démarrer le serveur :**
```bash
python manage.py runserver
```

3. **Tester l'API :**
- Naviguer vers `http://localhost:8000/api/`
- Utiliser l'interface de navigation DRF (Django REST Framework)

## Exemples d'utilisation

### Enregistrer une session Internet
```bash
curl -X POST http://localhost:8000/api/recettes-internet/ \
  -H "Content-Type: application/json" \
  -d '{
    "type_forfait": "HEURE",
    "duree_minutes": 120,
    "poste_utilise": "PC-02",
    "montant": 1000,
    "description": "Navigation 2h client étudiant"
  }'
```

### Consulter le résumé du jour
```bash
curl http://localhost:8000/api/transactions/resume_journalier/
```

### Enregistrer une dépense
```bash
curl -X POST http://localhost:8000/api/depenses/ \
  -H "Content-Type: application/json" \
  -d '{
    "categorie_depense": "MAINTENANCE",
    "fournisseur": "TechService",
    "montant": 15000,
    "description": "Réparation imprimante"
  }'
```

## Pagination
L'API utilise la pagination par défaut (20 éléments par page).
Utiliser les paramètres `page` pour naviguer : `/api/transactions/?page=2`

## Filtrage
- Filtrer les transactions par type : `?type=RECETTE` ou `?type=DEPENSE`
- Filtrer par date : `?date_debut=2024-01-01&date_fin=2024-01-31`
