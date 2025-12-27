from django.test import TestCase
from django.contrib.auth.models import User
from decimal import Decimal
from Gestion.models import (
    Produit, Stock, CategorieProduit, UniteMesure,
    TarifService, ServicePersonnalise, PalierRemise, Transaction,
    ProfilUtilisateur, Role, Permission
)
from datetime import date, timedelta
from django.utils import timezone

class StockModelTest(TestCase):
    def setUp(self):
        self.unite, _ = UniteMesure.objects.get_or_create(nom="Unité", defaults={"symbole": "u"})
        self.categorie, _ = CategorieProduit.objects.get_or_create(nom="Test Categorie")
        self.produit = Produit.objects.create(
            designation="Produit Test",
            unite_mesure=self.unite,
            categorie=self.categorie,
            prix_vente=1000
        )
        # Le stock est créé automatiquement via le signal post_save ou dans le viewset/serializer normalement,
        # mais ici dans le test du modèle il faut vérifier comment il est créé.
        # Dans serializers.py ProduitSerializer.create() on crée le stock.
        # Vérifions si le modèle Produit a un signal. Non, pas de signal pour Stock dans models.py du Produit.
        # Donc on le crée manuellement ici pour le test du modèle Stock.
        if not hasattr(self.produit, 'stock'):
            self.stock = Stock.objects.create(produit=self.produit)
        else:
            self.stock = self.produit.stock

    def test_stock_state_updates(self):
        """Test que l'état du stock se met à jour en fonction de la quantité"""
        self.stock.quantite_minimale = 10
        
        # Test 1: En Stock
        self.stock.quantite_actuelle = 20
        self.stock.save()
        self.assertEqual(self.stock.etat, 'EN_STOCK')

        # Test 2: Limite
        self.stock.quantite_actuelle = 10
        self.stock.save()
        self.assertEqual(self.stock.etat, 'LIMITE')

        self.stock.quantite_actuelle = 5
        self.stock.save()
        self.assertEqual(self.stock.etat, 'LIMITE')

        # Test 3: Rupture
        self.stock.quantite_actuelle = 0
        self.stock.save()
        self.assertEqual(self.stock.etat, 'RUPTURE')

        self.stock.quantite_actuelle = -1
        self.stock.save()
        self.assertEqual(self.stock.etat, 'RUPTURE')

class ServicePricingTest(TestCase):
    def setUp(self):
        self.tarif = TarifService.objects.create(
            nom_service="Impression Test",
            categorie="IMPRESSION",
            prix_unitaire=100,
            unite_mesure="page",
            code_service="IMP_TEST"
        )
        
        # Créer des paliers de remise
        PalierRemise.objects.create(
            tarif_service=self.tarif,
            quantite_minimum=10,
            type_remise='POURCENTAGE',
            valeur_remise=10 # 10%
        )
        PalierRemise.objects.create(
            tarif_service=self.tarif,
            quantite_minimum=50,
            type_remise='PRIX_UNITAIRE',
            valeur_remise=80 # 80 Ar l'unité
        )

    def test_pricing_no_remise(self):
        # 5 pages, pas de remise
        transaction = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test"
        )
        service = ServicePersonnalise.objects.create(
            transaction=transaction,
            tarif_service=self.tarif,
            quantite=5
        )
        # Refresh from db to get calculated values
        service.refresh_from_db()
        
        self.assertEqual(service.prix_unitaire_utilise, 100)
        self.assertEqual(service.montant_total, 500)
        self.assertIsNone(service.remise_appliquee)

    def test_pricing_remise_pourcentage(self):
        # 10 pages, 10% de remise -> 90 Ar/page
        transaction = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test"
        )
        service = ServicePersonnalise.objects.create(
            transaction=transaction,
            tarif_service=self.tarif,
            quantite=10
        )
        service.refresh_from_db()

        self.assertEqual(service.prix_unitaire_utilise, 90) # 100 - 10%
        self.assertEqual(service.montant_total, 900)
        self.assertIsNotNone(service.remise_appliquee)
        self.assertEqual(service.remise_appliquee.valeur_remise, 10)

    def test_pricing_remise_fixe(self):
        # 50 pages, prix fixe 80 Ar
        transaction = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test"
        )
        service = ServicePersonnalise.objects.create(
            transaction=transaction,
            tarif_service=self.tarif,
            quantite=50
        )
        service.refresh_from_db()

        self.assertEqual(service.prix_unitaire_utilise, 80)
        self.assertEqual(service.montant_total, 4000) # 50 * 80

    def test_pricing_remise_montant_fixe(self):
        """Test avec remise de montant fixe (100 - 30 = 70 Ar)"""
        # Créer un palier avec montant fixe
        PalierRemise.objects.create(
            tarif_service=self.tarif,
            quantite_minimum=20,
            type_remise='MONTANT_FIXE',
            valeur_remise=30  # -30 Ar
        )
        
        transaction = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test montant fixe"
        )
        service = ServicePersonnalise.objects.create(
            transaction=transaction,
            tarif_service=self.tarif,
            quantite=20
        )
        service.refresh_from_db()

        self.assertEqual(service.prix_unitaire_utilise, 70)  # 100 - 30
        self.assertEqual(service.montant_total, 1400)  # 20 * 70
        self.assertIsNotNone(service.remise_appliquee)

    def test_cas_utilisateur_100_vers_70(self):
        """Test du cas spécifique: 100 MGA → 70 MGA à partir de 10 impressions"""
        # Créer un nouveau tarif pour ce test
        tarif_impression = TarifService.objects.create(
            nom_service="Impression A4",
            categorie="IMPRESSION",
            prix_unitaire=100,
            unite_mesure="page",
            code_service="IMP_A4"
        )
        
        # Créer le palier: à partir de 10, prix devient 70 Ar
        PalierRemise.objects.create(
            tarif_service=tarif_impression,
            quantite_minimum=10,
            type_remise='PRIX_UNITAIRE',
            valeur_remise=70,
            description="Remise volume pour impression"
        )
        
        # Test 1: Moins de 10 pages → prix normal 100 Ar
        transaction1 = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test 5 pages"
        )
        service1 = ServicePersonnalise.objects.create(
            transaction=transaction1,
            tarif_service=tarif_impression,
            quantite=5
        )
        service1.refresh_from_db()
        
        self.assertEqual(service1.prix_unitaire_utilise, 100)
        self.assertEqual(service1.montant_total, 500)  # 5 * 100
        self.assertIsNone(service1.remise_appliquee)
        
        # Test 2: Exactement 10 pages → prix réduit 70 Ar
        transaction2 = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test 10 pages"
        )
        service2 = ServicePersonnalise.objects.create(
            transaction=transaction2,
            tarif_service=tarif_impression,
            quantite=10
        )
        service2.refresh_from_db()
        
        self.assertEqual(service2.prix_unitaire_utilise, 70)
        self.assertEqual(service2.montant_total, 700)  # 10 * 70
        self.assertIsNotNone(service2.remise_appliquee)
        self.assertEqual(service2.montant_remise, 300)  # Économie de 30 Ar par page * 10
        
        # Test 3: Plus de 10 pages → prix réduit 70 Ar
        transaction3 = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test 25 pages"
        )
        service3 = ServicePersonnalise.objects.create(
            transaction=transaction3,
            tarif_service=tarif_impression,
            quantite=25
        )
        service3.refresh_from_db()
        
        self.assertEqual(service3.prix_unitaire_utilise, 70)
        self.assertEqual(service3.montant_total, 1750)  # 25 * 70
        self.assertEqual(service3.montant_remise, 750)  # Économie de 30 Ar par page * 25

    def test_paliers_multiples_meilleur_prix(self):
        """Test que le meilleur palier (le plus élevé) est appliqué"""
        # Créer un tarif avec plusieurs paliers
        tarif_multi = TarifService.objects.create(
            nom_service="Service Multi-Paliers",
            categorie="MULTISERVICE",
            prix_unitaire=100,
            unite_mesure="unité",
            code_service="MULTI_TEST"
        )
        
        # Palier 1: 10+ → 10% de réduction (90 Ar)
        PalierRemise.objects.create(
            tarif_service=tarif_multi,
            quantite_minimum=10,
            type_remise='POURCENTAGE',
            valeur_remise=10
        )
        
        # Palier 2: 50+ → 30% de réduction (70 Ar)
        PalierRemise.objects.create(
            tarif_service=tarif_multi,
            quantite_minimum=50,
            type_remise='POURCENTAGE',
            valeur_remise=30
        )
        
        # Palier 3: 100+ → prix fixe 50 Ar
        PalierRemise.objects.create(
            tarif_service=tarif_multi,
            quantite_minimum=100,
            type_remise='PRIX_UNITAIRE',
            valeur_remise=50
        )
        
        # Test avec 60 unités → doit appliquer le palier 50+ (70 Ar)
        transaction = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test 60 unités"
        )
        service = ServicePersonnalise.objects.create(
            transaction=transaction,
            tarif_service=tarif_multi,
            quantite=60
        )
        service.refresh_from_db()
        
        self.assertEqual(service.prix_unitaire_utilise, 70)
        self.assertEqual(service.montant_total, 4200)  # 60 * 70
        self.assertEqual(service.remise_appliquee.quantite_minimum, 50)

    def test_palier_avec_dates_validite(self):
        """Test des paliers avec dates de validité"""
        from datetime import timedelta
        from django.utils import timezone
        
        tarif_promo = TarifService.objects.create(
            nom_service="Service Promo",
            categorie="MULTISERVICE",
            prix_unitaire=100,
            unite_mesure="unité",
            code_service="PROMO_TEST"
        )
        
        # Palier expiré (date_fin dans le passé)
        PalierRemise.objects.create(
            tarif_service=tarif_promo,
            quantite_minimum=5,
            type_remise='POURCENTAGE',
            valeur_remise=50,
            date_debut=timezone.now().date() - timedelta(days=30),
            date_fin=timezone.now().date() - timedelta(days=1),
            actif=True
        )
        
        # Palier valide
        PalierRemise.objects.create(
            tarif_service=tarif_promo,
            quantite_minimum=10,
            type_remise='POURCENTAGE',
            valeur_remise=20,
            date_debut=timezone.now().date() - timedelta(days=1),
            date_fin=timezone.now().date() + timedelta(days=30),
            actif=True
        )
        
        transaction = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test promo"
        )
        service = ServicePersonnalise.objects.create(
            transaction=transaction,
            tarif_service=tarif_promo,
            quantite=10
        )
        service.refresh_from_db()
        
        # Doit appliquer le palier valide (20% de réduction)
        self.assertEqual(service.prix_unitaire_utilise, 80)  # 100 - 20%
        self.assertEqual(service.remise_appliquee.valeur_remise, 20)

    def test_palier_inactif_non_applique(self):
        """Test qu'un palier inactif n'est pas appliqué"""
        tarif_inactif = TarifService.objects.create(
            nom_service="Service Inactif",
            categorie="MULTISERVICE",
            prix_unitaire=100,
            unite_mesure="unité",
            code_service="INACTIF_TEST"
        )
        
        # Palier inactif
        PalierRemise.objects.create(
            tarif_service=tarif_inactif,
            quantite_minimum=5,
            type_remise='POURCENTAGE',
            valeur_remise=50,
            actif=False  # Inactif
        )
        
        transaction = Transaction.objects.create(
            type_transaction='RECETTE', montant=0, description="Test inactif"
        )
        service = ServicePersonnalise.objects.create(
            transaction=transaction,
            tarif_service=tarif_inactif,
            quantite=10
        )
        service.refresh_from_db()
        
        # Aucune remise ne doit être appliquée
        self.assertEqual(service.prix_unitaire_utilise, 100)
        self.assertIsNone(service.remise_appliquee)

class PermissionTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        # Profil créé automatiquement via signal
        self.profil = self.user.profil
        
        self.perm_view = Permission.objects.create(
            code_permission='view_test', nom='View', module='test'
        )
        self.perm_edit = Permission.objects.create(
            code_permission='edit_test', nom='Edit', module='test'
        )
        
        self.role = Role.objects.create(nom='TestRole')
        self.role.permissions.add(self.perm_view)
        
        self.profil.role = self.role
        self.profil.save()

    def test_role_permission(self):
        # Doit avoir view_test via le role
        self.assertTrue(self.profil.a_permission('view_test'))
        # Ne doit pas avoir edit_test
        self.assertFalse(self.profil.a_permission('edit_test'))

    def test_supp_permission(self):
        # Ajouter edit_test en supp
        self.profil.permissions_supplementaires.add(self.perm_edit)
        self.assertTrue(self.profil.a_permission('edit_test'))

    def test_refuse_permission(self):
        # Refuser view_test explicitement
        self.profil.permissions_refusees.add(self.perm_view)
        # Meme si dans le role, doit etre refusé
        self.assertFalse(self.profil.a_permission('view_test'))
