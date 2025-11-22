# API de Gestion Financière - Cyber et Multiservice

## Vue d'ensemble
Cette API REST permet de gérer les recettes et dépenses d'un cyber café et centre multiservice, ainsi que les stocks, les produits, les tarifs et les paramètres de l'entreprise.

## Endpoints de l'API

### Base URL
- Développement: `http://localhost:8000/api/`

### Endpoints principaux

#### 1. Authentification
- **POST** `/auth/login/` - Connexion de l'utilisateur. Retourne un token d'authentification.
- **POST** `/auth/logout/` - Déconnexion de l'utilisateur (invalide le token).
- **GET** `/auth/verify-token/` - Vérifie la validité du token actuel.
- **POST** `/auth/register/` - Enregistrement d'un nouvel utilisateur (si activé).

#### 2. Catégories de services
- **GET** `/api/categories/` - Liste toutes les catégories de services.
- **POST** `/api/categories/` - Créer une nouvelle catégorie de service.
- **GET** `/api/categories/{id}/` - Détails d'une catégorie de service.
- **PUT/PATCH** `/api/categories/{id}/` - Modifier une catégorie de service.
- **DELETE** `/api/categories/{id}/` - Supprimer une catégorie de service.

#### 3. Transactions générales
- **GET** `/api/transactions/` - Liste toutes les transactions.
- **GET** `/api/transactions/?type=RECETTE` - Filtrer par type (RECETTE/DEPENSE).
- **GET** `/api/transactions/?date_debut=2024-01-01&date_fin=2024-12-31` - Filtrer par période.
- **GET** `/api/transactions/resume_journalier/` - Résumé financier du jour.
- **GET** `/api/transactions/resume_mensuel/` - Résumé financier du mois.

#### 4. Dépenses
- **GET** `/api/depenses/` - Liste des dépenses.
- **POST** `/api/depenses/` - Enregistrer une nouvelle dépense.
- **GET** `/api/depenses/{id}/` - Détails d'une dépense.
- **PUT/PATCH** `/api/depenses/{id}/` - Modifier une dépense.
- **DELETE** `/api/depenses/{id}/` - Supprimer une dépense.
- **GET** `/api/depenses/par_categorie/` - Statistiques par catégorie de dépense.
- **GET** `/api/depenses/categories/` - Liste des catégories de dépenses disponibles.

**Exemple de création d'une dépense :**
```json
{
    "transaction": {
        "description": "Facture électricité janvier 2024",
        "montant": 25000
    },
    "categorie_depense": "ELECTRICITE",
    "fournisseur": "JIRAMA",
    "numero_facture": "FAC-2024-001"
}
```

#### 5. Tarifs des Services
- **GET** `/api/tarifs/` - Liste tous les tarifs de services.
- **POST** `/api/tarifs/` - Créer un nouveau tarif.
- **GET** `/api/tarifs/{id}/` - Détails d'un tarif.
- **PUT/PATCH** `/api/tarifs/{id}/` - Modifier un tarif.
- **DELETE** `/api/tarifs/{id}/` - Supprimer un tarif.
- **GET** `/api/tarifs/par_categorie/` - Récupérer les services groupés par catégorie.
- **POST** `/api/tarifs/import_tarifs_defaut/` - Importer des tarifs par défaut.

**Exemple de création d'un tarif avec consommations :**
```json
{
    "nom_service": "Impression A4 N&B",
    "categorie": "IMPRESSION",
    "prix_unitaire": 100.00,
    "unite_mesure": "page",
    "description": "Impression laser noir et blanc sur papier A4",
    "actif": true,
    "consommations_write": [
        {
            "produit_id": 1,
            "quantite": 1
        }
    ]
}
```

#### 6. Produits
- **GET** `/api/produits/` - Liste tous les produits.
- **POST** `/api/produits/` - Créer un nouveau produit.
- **GET** `/api/produits/{id}/` - Détails d'un produit.
- **PUT/PATCH** `/api/produits/{id}/` - Modifier un produit.
- **DELETE** `/api/produits/{id}/` - Supprimer un produit.
- **GET** `/api/produits/statistiques/` - Statistiques générales sur les produits.
- **GET** `/api/produits/produits_par_categorie/` - Liste des produits groupés par catégorie.

**Exemple de création d'un produit :**
```json
{
    "designation": "Rame de papier A4",
    "reference": "PAP-A4-001",
    "description": "Rame de 500 feuilles de papier A4 80g",
    "categorie": 1,
    "prix_vente": 2500.00,
    "unite_mesure": 1,
    "unite_achat": 2,
    "quantite_par_unite_achat": 500,
    "actif": true
}
```

#### 7. Stock
- **GET** `/api/stocks/` - Liste tous les stocks de produits.
- **GET** `/api/stocks/{id}/` - Détails d'un stock.
- **PATCH** `/api/stocks/{id}/` - Modifier un stock (ex: quantité minimale).
- **POST** `/api/stocks/enregistrer_entree/` - Enregistrer une entrée de stock (achat).
- **POST** `/api/stocks/{id}/ajuster_stock/` - Ajuster la quantité d'un stock (augmentation/diminution).
- **GET** `/api/stocks/alertes/` - Récupérer les alertes de stock (ruptures et réapprovisionnements).
- **GET** `/api/stocks/valeurs/` - Calculer les valeurs totales du stock.

**Exemple d'enregistrement d'une entrée de stock :**
```json
{
    "produit_id": 1,
    "quantite_achat": 10,
    "prix_total_achat": 20000,
    "fournisseur": "Grossiste Papeterie",
    "numero_facture": "FA-GP-001",
    "commentaire": "Achat de 10 rames de papier"
}
```

**Exemple d'ajustement de stock :**
```json
{
    "quantite": 5,
    "type_ajustement": "AUGMENTATION",
    "commentaire": "Correction d'inventaire"
}
```
ou
```json
{
    "quantite": 2,
    "type_ajustement": "DIMINUTION",
    "commentaire": "Casse produit"
}
```

#### 8. Ventes de Produits Directes
- **POST** `/api/vente-produits/` - Enregistrer une vente directe de produit.
- **GET** `/api/vente-produits/ventes_du_jour/` - Récupérer les ventes de produits du jour.

#### 9. Ventes Groupées (Multiservices)
- **GET** `/api/ventes-groupees/` - Liste toutes les ventes groupées.
- **POST** `/api/ventes-groupees/` - Créer une nouvelle vente groupée avec plusieurs lignes.
- **GET** `/api/ventes-groupees/{id}/imprimer_facture/` - Générer et télécharger la facture PDF d'une vente groupée.

**Exemple de création d'une vente groupée :**
```json
{
    "client_nom": "Client de passage",
    "commentaire": "Vente de services divers",
    "lignes": [
        {
            "tarif_service_id": 1,
            "quantite": 2,
            "prix_unitaire": 1000
        },
        {
            "tarif_service_id": 3,
            "quantite": 5,
            "prix_unitaire": 50
        }
    ]
}
```

#### 10. Catégories de Produits
- **GET** `/api/categorie-produits/` - Liste toutes les catégories de produits.
- **POST** `/api/categorie-produits/` - Créer une nouvelle catégorie de produit.
- **GET** `/api/categorie-produits/{id}/` - Détails d'une catégorie de produit.
- **PUT/PATCH** `/api/categorie-produits/{id}/` - Modifier une catégorie de produit.
- **DELETE** `/api/categorie-produits/{id}/` - Supprimer une catégorie de produit.

#### 11. Unités de Mesure
- **GET** `/api/unite-mesures/` - Liste toutes les unités de mesure.
- **POST** `/api/unite-mesures/` - Créer une nouvelle unité de mesure.
- **GET** `/api/unite-mesures/{id}/` - Détails d'une unité de mesure.
- **PUT/PATCH** `/api/unite-mesures/{id}/` - Modifier une unité de mesure.
- **DELETE** `/api/unite-mesures/{id}/` - Supprimer une unité de mesure.

#### 12. Paramètres de l'Entreprise
- **GET** `/api/company-settings/` - Récupérer les paramètres de l'entreprise.
- **PUT/PATCH** `/api/company-settings/` - Mettre à jour les paramètres de l'entreprise.

**Exemple de récupération/mise à jour des paramètres :**
```json
{
    "name": "Cyber Alpha",
    "address": "123 Rue Principale",
    "phone": "+261 34 00 123 45",
    "email": "contact@cyberalpha.com",
    "nif": "1234567890",
    "default_currency": "Ar",
    "date_format": "DD/MM/YYYY",
    "language": "fr",
    "default_min_stock_alert": 10
}
```

#### 13. Permissions
- **GET** `/api/permissions/` - Liste toutes les permissions.
- **POST** `/api/permissions/` - Créer une nouvelle permission.
- **GET** `/api/permissions/{id}/` - Détails d'une permission.
- **PUT/PATCH** `/api/permissions/{id}/` - Modifier une permission.
- **DELETE** `/api/permissions/{id}/` - Supprimer une permission.
- **GET** `/api/permissions/par_module/` - Grouper les permissions par module.
- **POST** `/api/permissions/initialiser_permissions/` - Initialiser les permissions par défaut.

#### 14. Rôles
- **GET** `/api/roles/` - Liste tous les rôles.
- **POST** `/api/roles/` - Créer un nouveau rôle.
- **GET** `/api/roles/{id}/` - Détails d'un rôle.
- **PUT/PATCH** `/api/roles/{id}/` - Modifier un rôle.
- **DELETE** `/api/roles/{id}/` - Supprimer un rôle.
- **POST** `/api/roles/creer_roles_defaut/` - Créer les rôles par défaut.
- **POST** `/api/roles/{id}/dupliquer/` - Dupliquer un rôle existant.

#### 15. Profils Utilisateurs
- **GET** `/api/profils/` - Liste tous les profils utilisateurs.
- **POST** `/api/profils/` - Créer un nouveau profil utilisateur.
- **GET** `/api/profils/{id}/` - Détails d'un profil utilisateur.
- **PUT/PATCH** `/api/profils/{id}/` - Modifier un profil utilisateur.
- **DELETE** `/api/profils/{id}/` - Supprimer un profil utilisateur.
- **POST** `/api/profils/verifier_permission/` - Vérifier si un utilisateur a une permission spécifique.
- **POST** `/api/profils/{id}/modifier_permissions/` - Modifier les permissions supplémentaires/refusées d'un profil.
- **GET** `/api/profils/mon_profil/` - Obtenir le profil de l'utilisateur connecté.

## Types de données

### Types de forfaits Internet
- `1H`, `2H`, `3H`, `JOUR`, `NUIT`, `AUTRE`

### Catégories de services
- `INTERNET`, `IMPRESSION`, `MULTISERVICE`, `VENTE`, `AUTRE`

### Catégories de dépenses
- `ELECTRICITE`, `INTERNET`, `MAINTENANCE`, `FOURNITURES`, `SALAIRE`, `LOYER`, `AUTRE`

### Types de mouvements de stock
- `ENTREE`, `SORTIE` (pour `type_mouvement`)
- `ACHAT`, `VENTE`, `AJUSTEMENT`, `PERTE`, `TRANSFERT`, `AUTRE` (pour `motif`)

## Authentification
L'API utilise l'authentification par Token. Pour accéder aux endpoints protégés, incluez le token dans l'en-tête `Authorization` :
`Authorization: Token <votre_token>`

## Gestion des Erreurs
- **400 Bad Request**: Requête invalide (données manquantes ou incorrectes).
- **401 Unauthorized**: Authentification requise ou token invalide.
- **403 Forbidden**: L'utilisateur n'a pas les permissions nécessaires.
- **404 Not Found**: Ressource non trouvée.
- **409 Conflict**: Conflit de données, souvent dû à une tentative de suppression d'une ressource liée (ProtectedError). Le message `detail` fournira plus d'informations.
- **500 Internal Server Error**: Erreur serveur inattendue.

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
curl -X POST http://localhost:8000/api/services-personnalises/service_rapide/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <votre_token>" \
  -d '{
    "code_service": "INTERNET_1H",
    "quantite": 1,
    "client_nom": "Client Internet",
    "description": "Session internet 1 heure"
  }'
```
*(Note: Les services Internet sont gérés via `services-personnalises` en spécifiant le `code_service` approprié.)*

### Consulter le résumé du jour
```bash
curl -H "Authorization: Token <votre_token>" http://localhost:8000/api/transactions/resume_journalier/
```

### Enregistrer une dépense
```bash
curl -X POST http://localhost:8000/api/depenses/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <votre_token>" \
  -d '{
    "transaction": {
        "description": "Achat de fournitures de bureau",
        "montant": 15000
    },
    "categorie_depense": "FOURNITURES",
    "fournisseur": "Bureau Express"
  }'
```

### Ajuster un stock (exemple: stock ID 1)
```bash
curl -X POST http://localhost:8000/api/stocks/1/ajuster_stock/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Token <votre_token>" \
  -d '{
    "quantite": 5,
    "type_ajustement": "AUGMENTATION",
    "commentaire": "Correction d\'inventaire après comptage"
  }'
```

## Pagination
L'API utilise la pagination par défaut (20 éléments par page).
Utiliser les paramètres `page` pour naviguer : `/api/transactions/?page=2`

## Filtrage
- Filtrer les transactions par type : `?type=RECETTE` ou `?type=DEPENSE`
- Filtrer par date : `?date_debut=2024-01-01&date_fin=2024-01-31`
- Filtrer les produits par catégorie ou statut de stock : `/api/produits/?categorie_id=1&en_stock=true`
- Filtrer les stocks par terme de recherche : `/api/stocks/?search=papier`
