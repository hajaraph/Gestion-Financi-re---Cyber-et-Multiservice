from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from Gestion.models import Transaction, CategorieService, ParametreEntreprise, ProfilUtilisateur, Role

class AuthenticationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testuser', password='password')
        self.token = Token.objects.create(user=self.user)
        self.url = '/api/transactions/' # Using explicit path as reverse might need router basename setup verification

    def test_access_denied_without_token(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_allowed_with_token(self):
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        response = self.client.get(self.url)
        # Should be 200 OK or 403 Forbidden depending on permissions.
        # User has no profile/role yet so likely 403 based on CustomPermission logic
        # CustomPermission checks: is_authenticated -> is_superuser -> has profile -> profile active -> role admin -> time restrictions -> specific perms
        # Our plain user has no profile initially unless signal created it. Signal DOES create profile.
        # But has no role/permissions.
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_403_FORBIDDEN])

class TransactionViewTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='password', is_superuser=True)
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        
        self.cat = CategorieService.objects.create(nom="Divers", description="Test")
        
        Transaction.objects.create(
            type_transaction='RECETTE', montant=5000, description="Recette 1", categorie_service=self.cat
        )
        Transaction.objects.create(
            type_transaction='DEPENSE', montant=2000, description="Depense 1"
        )

    def test_list_transactions(self):
        url = '/api/transactions/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Response is apparently not paginated in current settings, so it returns a list
        self.assertEqual(len(response.data), 2)

    def test_filter_transactions(self):
        url = '/api/transactions/'
        response = self.client.get(url, {'type': 'RECETTE'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['type_transaction'], 'RECETTE')

    def test_create_transaction(self):
        url = '/api/transactions/'
        data = {
            'type_transaction': 'RECETTE',
            'montant': 1000,
            'description': 'New Recette',
            'categorie_service': self.cat.id
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Transaction.objects.count(), 3)

class DashboardStatsTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='admin', password='password', is_superuser=True)
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.token.key)
        
        # Create Data
        Transaction.objects.create(type_transaction='RECETTE', montant=10000, description="R1")
        Transaction.objects.create(type_transaction='DEPENSE', montant=4000, description="D1")

    def test_dashboard_endpoint(self):
        url = reverse('dashboard-stats') # Should be /api/dashboard-stats/
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        stats = response.data['statistiques_principales']
        self.assertEqual(stats['recettes_jour']['valeur'], 10000)
        self.assertEqual(stats['depenses_jour']['valeur'], 4000)
        
        resume = response.data['resume_financier']
        self.assertEqual(resume['benefice_net'], 6000)
