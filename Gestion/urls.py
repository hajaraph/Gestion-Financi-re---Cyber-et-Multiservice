from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

# Router pour les ViewSets
router = DefaultRouter()
router.register(r'categories', views.CategorieServiceViewSet)
router.register(r'transactions', views.TransactionViewSet)
router.register(r'recettes-internet', views.RecetteInternetViewSet)
router.register(r'recettes-multiservice', views.RecetteMultiserviceViewSet)
router.register(r'depenses', views.DepenseViewSet)
router.register(r'tarifs', views.TarifServiceViewSet)
router.register(r'types-papier', views.TypePapierViewSet)
router.register(r'stocks', views.StockViewSet)
router.register(r'mouvements-stock', views.MouvementStockViewSet)
router.register(r'services-personnalises', views.ServicePersonnaliseViewSet)
router.register(r'paliers-remise', views.PalierRemiseViewSet)
router.register(r'permissions', views.PermissionViewSet)
router.register(r'roles', views.RoleViewSet)
router.register(r'profils', views.ProfilUtilisateurViewSet)

# URLs spécifiques pour l'authentification
urlpatterns = [
    # URLs du router DRF
    path('api/', include(router.urls)),

    # URLs d'authentification
    path('auth/login/', views.login_view, name='login'),
    path('auth/logout/', views.logout_view, name='logout'),
    path('auth/verify-token/', views.verify_token, name='verify_token'),
    path('auth/register/', views.register_view, name='register'),
]
