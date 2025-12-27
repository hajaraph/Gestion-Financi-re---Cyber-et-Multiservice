from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from Gestion.models import Permission, Role, TarifService, ProfilUtilisateur

class DataInitializationTest(APITestCase):
    """
    Test pour vérifier les fonctionnalités d'importation/initialisation
    des données par défaut (Permissions, Rôles, Tarifs).
    """
    def setUp(self):
        # Créer un super-utilisateur pour passer les CustomPermissions
        self.user = User.objects.create_superuser(username='admin', password='password', email='admin@test.com')
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)

    def test_initialiser_permissions(self):
        """Vérifie que la fonction d'initialisation crée bien les permissions de base"""
        # S'assurer qu'au départ il n'y a pas de permissions (ou très peu)
        # Note: Certaines peuvent être créées par des signaux si implémentés
        initial_count = Permission.objects.count()
        
        url = '/api/permissions/initialiser_permissions/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('permissions créées', response.data['message'])
        
        # Vérifier qu'on a maintenant des permissions
        self.assertGreater(Permission.objects.count(), initial_count)
        # Vérifier une permission spécifique définie dans Permission.ACTIONS
        self.assertTrue(Permission.objects.filter(code_permission='add_transaction').exists())

    def test_creer_roles_defaut(self):
        """Vérifie la création des rôles par défaut (Administrateur, Caissier, etc.)"""
        # On initialise d'abord les permissions car les rôles en ont besoin
        self.client.post('/api/permissions/initialiser_permissions/')
        
        url = '/api/roles/creer_roles_defaut/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('rôles créés', response.data['message'])
        
        # Vérifier que les rôles clés existent
        self.assertTrue(Role.objects.filter(nom='Administrateur').exists())
        self.assertTrue(Role.objects.filter(nom='Caissier').exists())
        
        # Vérifier que l'Administrateur a bien toutes les permissions
        admin_role = Role.objects.get(nom='Administrateur')
        self.assertEqual(admin_role.permissions.count(), Permission.objects.count())

    def test_import_tarifs_defaut(self):
        """Vérifie l'importation de la liste des tarifs standards (Internet, Impression, etc.)"""
        url = '/api/tarifs/import_tarifs_defaut/'
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tarifs créés', response.data['message'])
        
        # Vérifier la présence de certains services phares
        self.assertTrue(TarifService.objects.filter(nom_service='Internet 1 heure').exists())
        self.assertTrue(TarifService.objects.filter(nom_service__icontains='Impression A4').exists())
        
        # Vérifier qu'on a bien importé autour de 11 tarifs (selon la liste dans views.py)
        self.assertGreaterEqual(TarifService.objects.count(), 10)

    def test_idempotence_initialization(self):
        """Vérifie que lancer l'initialisation plusieurs fois ne crée pas de doublons"""
        # Premier passage
        self.client.post('/api/permissions/initialiser_permissions/')
        self.client.post('/api/roles/creer_roles_defaut/')
        self.client.post('/api/tarifs/import_tarifs_defaut/')
        
        count_perms = Permission.objects.count()
        count_roles = Role.objects.count()
        count_tarifs = TarifService.objects.count()
        
        # Second passage
        self.client.post('/api/permissions/initialiser_permissions/')
        self.client.post('/api/roles/creer_roles_defaut/')
        self.client.post('/api/tarifs/import_tarifs_defaut/')
        
        # Les compteurs ne doivent pas avoir changé
        self.assertEqual(Permission.objects.count(), count_perms)
        self.assertEqual(Role.objects.count(), count_roles)
        self.assertEqual(TarifService.objects.count(), count_tarifs)
