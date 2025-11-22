from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from rest_framework import viewsets, status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from datetime import datetime
from django.db.models import QuerySet
from .models import (
    CategorieService, Transaction,
    RecetteInternet, RecetteMultiservice, Depense, TypePapier,
    TarifService, ServicePersonnalise, PalierRemise, Permission, Role, ProfilUtilisateur,
    Stock, MouvementStock, Produit, CategorieProduit, UniteMesure, VenteProduit
)
from .serializers import (
    CategorieServiceSerializer, TransactionSerializer,
    RecetteInternetSerializer, RecetteMultiserviceSerializer,
    DepenseSerializer, RecetteInternetCreateSerializer, DepenseCreateSerializer,
    TarifServiceSerializer, TypePapierSerializer,
    ServicePersonnaliseSerializer, ServicePersonnaliseCreateSerializer, ServiceRapideSerializer,
    PalierRemiseSerializer, PermissionSerializer, RoleSerializer, ProfilUtilisateurSerializer,
    RoleCreateSerializer, PermissionCheckSerializer, ProfilUtilisateurCreateSerializer,
    ServiceRapideAvecRemiseSerializer, RecetteMultiserviceCreateSerializer,
    StockSerializer, MouvementStockSerializer, MouvementStockCreateSerializer,
    ProduitSerializer, CategorieProduitSerializer, UniteMesureSerializer, EntreeStockSerializer,
    VenteProduitSerializer, VenteProduitCreateSerializer
)

# Permissions personnalisées pour l'API
from rest_framework.permissions import BasePermission, IsAuthenticated, AllowAny
import json


def filter_by_date_range(
        queryset: QuerySet,
        request,
        date_field: str,
        date_format: str = '%Y-%m-%d'
) -> QuerySet:
    date_debut = request.query_params.get('date_debut')
    date_fin = request.query_params.get('date_fin')

    if date_debut:
        date_debut = datetime.strptime(date_debut, date_format)
        queryset = queryset.filter(**{f"{date_field}__gte": date_debut})

    if date_fin:
        date_fin = datetime.strptime(date_fin, date_format)
        queryset = queryset.filter(**{f"{date_field}__lte": date_fin})

    return queryset


class CustomPermission(BasePermission):
    """Classe de permission personnalisée basée sur notre système de permissions"""

    def __init__(self, required_permission=None):
        self.required_permission = required_permission

    def has_permission(self, request, view):
        # Vérifier si l'utilisateur est authentifié
        if not request.user or not request.user.is_authenticated:
            return False

        # Le super-utilisateur a tous les droits
        if request.user.is_superuser:
            return True

        # Vérifier si l'utilisateur a un profil
        if not hasattr(request.user, 'profil'):
            return False

        profil = request.user.profil

        # Vérifier si le profil est actif
        if not profil.actif:
            return False

        # Le rôle Administrateur a tous les droits
        if profil.role and profil.role.nom == 'Administrateur':
            return True

        # Vérifier les restrictions temporelles
        if not profil.peut_travailler_maintenant():
            return False

        # Si pas de permission spécifique requise, autoriser
        if not self.required_permission:
            return True

        # Vérifier la permission spécifique
        return profil.a_permission(self.required_permission)

def permission_required(permission_code):
    """Décorateur pour spécifier la permission requise pour une vue"""
    def decorator(cls):
        cls.permission_classes = [lambda: CustomPermission(permission_code)]
        return cls
    return decorator

# ViewSets pour la gestion des permissions
class PermissionViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les permissions"""
    queryset = Permission.objects.all()
    serializer_class = PermissionSerializer
    permission_classes = [lambda: CustomPermission('manage_permissions')]

    def get_queryset(self):
        queryset = Permission.objects.all()

        # Filtrer par module
        module = self.request.query_params.get('module', None)
        if module:
            queryset = queryset.filter(module=module)

        # Filtrer par statut actif
        actif = self.request.query_params.get('actif', None)
        if actif is not None:
            queryset = queryset.filter(actif=actif.lower() == 'true')

        return queryset

    @action(detail=False, methods=['get'])
    def par_module(self, request):
        """Grouper les permissions par module"""
        permissions = Permission.objects.filter(actif=True)
        modules = {}

        for permission in permissions:
            if permission.module not in modules:
                modules[permission.module] = []
            modules[permission.module].append(PermissionSerializer(permission).data)

        return Response(modules)

    @action(detail=False, methods=['post'])
    def initialiser_permissions(self, request):
        """Initialiser les permissions par défaut"""
        permissions_creees = 0

        for code, nom in Permission.ACTIONS:
            module = code.split('_')[1] if '_' in code else 'system'
            permission, created = Permission.objects.get_or_create(
                code_permission=code,
                defaults={
                    'nom': nom,
                    'module': module,
                    'description': f"Permission pour {nom.lower()}",
                    'actif': True
                }
            )
            if created:
                permissions_creees += 1

        return Response({
            'message': f'{permissions_creees} permissions créées',
            'total_permissions': Permission.objects.count()
        })

class RoleViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les rôles"""
    queryset = Role.objects.all()
    permission_classes = [lambda: CustomPermission('manage_permissions')]

    def get_serializer_class(self):
        if self.action == 'create':
            return RoleCreateSerializer
        return RoleSerializer

    @action(detail=False, methods=['post'])
    def creer_roles_defaut(self, request):
        """Créer les rôles par défaut avec permissions appropriées"""
        roles_crees = 0

        # Définition des rôles par défaut
        roles_defaut = {
            'Administrateur': {
                'description': 'Accès complet au système',
                'couleur': '#dc3545',
                'permissions': Permission.objects.all()
            },
            'Gestionnaire': {
                'description': 'Gestion complète sauf administration',
                'couleur': '#ffc107',
                'permissions': Permission.objects.exclude(
                    code_permission__in=['manage_users', 'manage_permissions', 'manage_system']
                )
            },
            'Caissier': {
                'description': 'Transactions et recettes uniquement',
                'couleur': '#28a745',
                'permissions': Permission.objects.filter(
                    code_permission__in=[
                        'view_transaction', 'add_transaction', 'view_recette', 'add_recette',
                        'view_tarif', 'view_rapport_journalier'
                    ]
                )
            },
            'Opérateur': {
                'description': 'Opérations basiques',
                'couleur': '#17a2b8',
                'permissions': Permission.objects.filter(
                    code_permission__in=[
                        'view_transaction', 'add_recette', 'view_tarif'
                    ]
                )
            },
            'Lecteur': {
                'description': 'Consultation uniquement',
                'couleur': '#6c757d',
                'permissions': Permission.objects.filter(
                    code_permission__startswith='view_'
                )
            }
        }

        for nom_role, config in roles_defaut.items():
            role, created = Role.objects.get_or_create(
                nom=nom_role,
                defaults={
                    'description': config['description'],
                    'couleur': config['couleur'],
                    'actif': True
                }
            )

            if created:
                role.permissions.set(config['permissions'])
                roles_crees += 1

        return Response({
            'message': f'{roles_crees} rôles créés',
            'total_roles': Role.objects.count()
        })

    @action(detail=True, methods=['post'])
    def dupliquer(self, request):
        """Dupliquer un rôle avec un nouveau nom"""
        role_original = self.get_object()
        nouveau_nom = request.data.get('nouveau_nom')

        if not nouveau_nom:
            return Response(
                {'error': 'Le nouveau nom est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer une copie
        nouveau_role = Role.objects.create(
            nom=nouveau_nom,
            description=f"Copie de {role_original.nom}",
            couleur=role_original.couleur,
            actif=True
        )
        nouveau_role.permissions.set(role_original.permissions.all())

        serializer = self.get_serializer(nouveau_role)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class ProfilUtilisateurViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les profils utilisateurs"""
    queryset = ProfilUtilisateur.objects.all()
    permission_classes = [lambda: CustomPermission('manage_users')]

    def get_serializer_class(self):
        if self.action == 'create':
            return ProfilUtilisateurCreateSerializer
        return ProfilUtilisateurSerializer

    def get_queryset(self):
        queryset = ProfilUtilisateur.objects.all()

        # Filtrer par rôle
        role_id = self.request.query_params.get('role', None)
        if role_id:
            queryset = queryset.filter(role_id=role_id)

        # Filtrer par statut actif
        actif = self.request.query_params.get('actif', None)
        if actif is not None:
            queryset = queryset.filter(actif=actif.lower() == 'true')

        return queryset

    @action(detail=False, methods=['post'])
    def verifier_permission(self, request):
        """Vérifier si un utilisateur a une permission spécifique"""
        serializer = PermissionCheckSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user_id']
            permission_code = serializer.validated_data['permission_code']

            if hasattr(user, 'profil'):
                a_permission = user.profil.a_permission(permission_code)
                peut_travailler = user.profil.peut_travailler_maintenant()

                return Response({
                    'user': user.username,
                    'permission': permission_code,
                    'autorise': a_permission and peut_travailler,
                    'a_permission': a_permission,
                    'peut_travailler_maintenant': peut_travailler,
                    'permissions_effectives': user.profil.obtenir_toutes_permissions()
                })
            else:
                return Response({
                    'error': 'Utilisateur sans profil'
                }, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def modifier_permissions(self, request):
        """Modifier les permissions d'un utilisateur"""
        profil = self.get_object()

        # Permissions à ajouter/retirer
        ajouter_permissions = request.data.get('ajouter_permissions', [])
        retirer_permissions = request.data.get('retirer_permissions', [])

        # Ajouter permissions supplémentaires
        if ajouter_permissions:
            permissions = Permission.objects.filter(
                id__in=ajouter_permissions,
                actif=True
            )
            profil.permissions_supplementaires.add(*permissions)

        # Ajouter permissions refusées
        if retirer_permissions:
            permissions = Permission.objects.filter(
                id__in=retirer_permissions,
                actif=True
            )
            profil.permissions_refusees.add(*permissions)

        return Response({
            'message': 'Permissions mises à jour',
            'permissions_effectives': profil.obtenir_toutes_permissions()
        })

    @action(detail=False, methods=['get'])
    def mon_profil(self, request):
        """Obtenir le profil de l'utilisateur connecté"""
        if hasattr(request.user, 'profil'):
            serializer = self.get_serializer(request.user.profil)
            return Response(serializer.data)
        else:
            return Response({
                'error': 'Profil non trouvé'
            }, status=status.HTTP_404_NOT_FOUND)

# Create your views here.

class CategorieServiceViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les catégories de services"""
    queryset = CategorieService.objects.all()
    serializer_class = CategorieServiceSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer toutes les transactions"""
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer

    def get_queryset(self):
        queryset = Transaction.objects.all()

        # Filtrage par type de transaction
        type_transaction = self.request.query_params.get('type', None)
        if type_transaction:
            queryset = queryset.filter(type_transaction=type_transaction)

        # Filtrage par date
        queryset = filter_by_date_range(queryset, self.request, 'date_transaction')

        return queryset

    @staticmethod
    def _calculer_resume_financier(filtre_date):
        """Méthode utilitaire pour calculer le résumé financier"""
        # Recettes
        recettes = Transaction.objects.filter(
            type_transaction='RECETTE',
            **filtre_date
        ).aggregate(total=Sum('montant'))['total'] or 0

        # Dépenses
        depenses = Transaction.objects.filter(
            type_transaction='DEPENSE',
            **filtre_date
        ).aggregate(total=Sum('montant'))['total'] or 0

        # Bénéfice
        benefice = recettes - depenses

        # Nombre total de transactions
        nombre_transactions = Transaction.objects.filter(**filtre_date).count()

        return {
            'recettes_total': recettes,
            'depenses_total': depenses,
            'benefice_net': benefice,
            'nombre_transactions': nombre_transactions
        }

    @action(detail=False, methods=['get'])
    def resume_journalier(self, request):
        """Résumé des transactions du jour"""
        aujourd_hui = timezone.now().date()
        filtre_date = {'date_transaction__date': aujourd_hui}

        resume = self._calculer_resume_financier(filtre_date)
        resume['date'] = aujourd_hui

        return Response(resume)

    @action(detail=False, methods=['get'])
    def resume_mensuel(self, request):
        """Résumé des transactions du mois"""
        maintenant = timezone.now()
        debut_mois = maintenant.replace(day=1)
        filtre_date = {'date_transaction__gte': debut_mois}

        resume = self._calculer_resume_financier(filtre_date)
        resume['mois'] = maintenant.strftime('%Y-%m')

        return Response(resume)

class RecetteInternetViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les recettes Internet"""
    queryset = RecetteInternet.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return RecetteInternetCreateSerializer
        return RecetteInternetSerializer

    @action(detail=False, methods=['get'])
    def statistiques_forfaits(self, request):
        """Statistiques des forfaits Internet"""
        stats = {}
        for forfait_code, forfait_nom in RecetteInternet.FORFAITS:
            total = RecetteInternet.objects.filter(
                type_forfait=forfait_code
            ).aggregate(
                total_montant=Sum('transaction__montant'),
                nombre_ventes=Count('id')
            )

            stats[forfait_code] = {
                'nom': forfait_nom,
                'total_montant': total['total_montant'] or 0,
                'nombre_ventes': total['nombre_ventes'] or 0
            }

        return Response(stats)


class RecetteMultiserviceViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les recettes multiservice"""
    queryset = RecetteMultiservice.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return RecetteMultiserviceCreateSerializer
        return RecetteMultiserviceSerializer


class DepenseViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les dépenses"""
    queryset = Depense.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return DepenseCreateSerializer
        return DepenseSerializer

    @action(detail=False, methods=['get'])
    def par_categorie(self, request):
        """Statistiques des dépenses par catégorie"""
        stats = {}
        for categorie_code, categorie_nom in Depense.CATEGORIES_DEPENSE:
            total = Depense.objects.filter(
                categorie_depense=categorie_code
            ).aggregate(
                total_montant=Sum('transaction__montant'),
                nombre_depenses=Count('id')
            )

            stats[categorie_code] = {
                'nom': categorie_nom,
                'total_montant': total['total_montant'] or 0,
                'nombre_depenses': total['nombre_depenses'] or 0
            }

        return Response(stats)

class TarifServiceViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les tarifs des services"""
    queryset = TarifService.objects.all()
    serializer_class = TarifServiceSerializer

    def get_queryset(self):
        queryset = TarifService.objects.all()

        # Filtrer par statut actif
        actif = self.request.query_params.get('actif', None)
        if actif is not None:
            queryset = queryset.filter(actif=actif.lower() == 'true')

        # Filtrer par catégorie
        categorie = self.request.query_params.get('categorie', None)
        if categorie:
            queryset = queryset.filter(categorie=categorie.upper())

        # Recherche par nom
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(nom_service__icontains=search)

        return queryset

    @action(detail=False, methods=['get'])
    def par_categorie(self, request):
        """Récupérer les services groupés par catégorie"""
        result = {}
        for categorie_code, categorie_nom in TarifService.CATEGORIES_SERVICE:
            services = TarifService.objects.filter(
                categorie=categorie_code,
                actif=True
            )
            result[categorie_code] = {
                'nom': categorie_nom,
                'services': TarifServiceSerializer(services, many=True).data
            }
        return Response(result)

    @action(detail=False, methods=['get'])
    def codes_disponibles(self, request):
        """Liste des codes de services disponibles"""
        codes = TarifService.objects.filter(actif=True).values(
            'code_service', 'nom_service', 'prix_unitaire', 'unite_mesure'
        )
        return Response(list(codes))

    @action(detail=True, methods=['post'])
    def dupliquer(self, request):
        """Dupliquer un service avec un nouveau nom"""
        tarif_original = self.get_object()
        nouveau_nom = request.data.get('nouveau_nom')

        if not nouveau_nom:
            return Response(
                {'error': 'Le nouveau nom est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer une copie
        nouveau_tarif = TarifService.objects.create(
            nom_service=nouveau_nom,
            categorie=tarif_original.categorie,
            prix_unitaire=tarif_original.prix_unitaire,
            unite_mesure=tarif_original.unite_mesure,
            description=f"Copie de {tarif_original.nom_service}",
            actif=True
        )

        serializer = self.get_serializer(nouveau_tarif)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['post'])
    def import_tarifs_defaut(self, request):
        """Importer les tarifs par défaut pour un cyber"""
        tarifs_defaut = [
            # Services Internet
            {'nom_service': 'Internet 1 heure', 'categorie': 'INTERNET', 'prix_unitaire': 500, 'unite_mesure': 'heure'},
            {'nom_service': 'Internet forfait journée', 'categorie': 'INTERNET', 'prix_unitaire': 2000, 'unite_mesure': 'jour'},

            # Services impression
            {'nom_service': 'Impression A4 N&B', 'categorie': 'IMPRESSION', 'prix_unitaire': 100, 'unite_mesure': 'page'},
            {'nom_service': 'Impression A4 Couleur', 'categorie': 'IMPRESSION', 'prix_unitaire': 300, 'unite_mesure': 'page'},
            {'nom_service': 'Impression A3 N&B', 'categorie': 'IMPRESSION', 'prix_unitaire': 200, 'unite_mesure': 'page'},

            # Multiservices
            {'nom_service': 'Photocopie A4', 'categorie': 'MULTISERVICE', 'prix_unitaire': 50, 'unite_mesure': 'page'},
            {'nom_service': 'Reliure simple', 'categorie': 'MULTISERVICE', 'prix_unitaire': 1000, 'unite_mesure': 'document'},
            {'nom_service': 'Plastification A4', 'categorie': 'MULTISERVICE', 'prix_unitaire': 500, 'unite_mesure': 'page'},
            {'nom_service': 'Saisie de texte', 'categorie': 'MULTISERVICE', 'prix_unitaire': 500, 'unite_mesure': 'page'},

            # Vente de produits
            {'nom_service': 'Papier A4 (rame)', 'categorie': 'VENTE', 'prix_unitaire': 2500, 'unite_mesure': 'rame'},
            {'nom_service': 'Clé USB 8GB', 'categorie': 'VENTE', 'prix_unitaire': 5000, 'unite_mesure': 'pièce'},
        ]

        created_count = 0
        for tarif_data in tarifs_defaut:
            tarif, created = TarifService.objects.get_or_create(
                nom_service=tarif_data['nom_service'],
                defaults=tarif_data
            )
            if created:
                created_count += 1

        return Response({
            'message': f'{created_count} nouveaux tarifs créés sur {len(tarifs_defaut)} proposés'
        })

class ServicePersonnaliseViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les services personnalisés"""
    queryset = ServicePersonnalise.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return ServicePersonnaliseCreateSerializer
        return ServicePersonnaliseSerializer

    @action(detail=False, methods=['post'])
    def service_rapide(self, request):
        """Endpoint pour créer rapidement un service par code (ancien système)"""
        serializer = ServiceRapideSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            return Response(result, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def service_avec_remise(self, request):
        """Endpoint pour créer un service avec calcul automatique des remises"""
        serializer = ServiceRapideAvecRemiseSerializer(data=request.data)
        if serializer.is_valid():
            result = serializer.save()
            return Response(result, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def transactions_avec_remises(self, request):
        """Liste des transactions qui ont bénéficié de remises"""
        services_avec_remises = ServicePersonnalise.objects.filter(
            remise_appliquee__isnull=False
        ).select_related('transaction', 'tarif_service', 'remise_appliquee')

        # Pagination
        page = self.paginate_queryset(services_avec_remises)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(services_avec_remises, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def rapport_remises(self, request):
        """Rapport sur les remises accordées"""
        from django.db.models import Avg

        # Statistiques globales
        services_avec_remises = ServicePersonnalise.objects.filter(
            remise_appliquee__isnull=False
        )

        if not services_avec_remises.exists():
            return Response({
                'message': 'Aucune remise accordée pour le moment'
            })

        # Calculs
        total_economies = sum(service.montant_remise for service in services_avec_remises)
        moyenne_remise = services_avec_remises.aggregate(
            avg_remise=Avg('remise_appliquee__valeur_remise')
        )['avg_remise'] or 0

        # Remises par service
        remises_par_service = {}
        for service in services_avec_remises:
            nom_service = service.tarif_service.nom_service
            if nom_service not in remises_par_service:
                remises_par_service[nom_service] = {
                    'nombre_transactions': 0,
                    'total_economies': 0,
                    'moyenne_quantite': 0
                }

            remises_par_service[nom_service]['nombre_transactions'] += 1
            remises_par_service[nom_service]['total_economies'] += service.montant_remise
            remises_par_service[nom_service]['moyenne_quantite'] += float(service.quantite)

        # Calculer moyennes
        for service_data in remises_par_service.values():
            service_data['moyenne_quantite'] /= service_data['nombre_transactions']

        return Response({
            'periode': 'Depuis le début',
            'nombre_total_remises': services_avec_remises.count(),
            'total_economies_accordees': total_economies,
            'moyenne_pourcentage_remise': round(moyenne_remise, 2),
            'remises_par_service': remises_par_service
        })


class PalierRemiseViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les paliers de remise"""
    queryset = PalierRemise.objects.all()
    serializer_class = PalierRemiseSerializer

    def get_queryset(self):
        queryset = PalierRemise.objects.all()

        # Filtrer par service
        tarif_service_id = self.request.query_params.get('tarif_service', None)
        if tarif_service_id:
            queryset = queryset.filter(tarif_service_id=tarif_service_id)

        # Filtrer par statut actif
        actif = self.request.query_params.get('actif', None)
        if actif is not None:
            queryset = queryset.filter(actif=actif.lower() == 'true')

        return queryset

    @action(detail=False, methods=['post'])
    def creer_paliers_standards(self, request):
        """Créer des paliers de remise standards pour un service"""
        tarif_service_id = request.data.get('tarif_service_id')

        if not tarif_service_id:
            return Response(
                {'error': 'tarif_service_id requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            tarif_service = TarifService.objects.get(id=tarif_service_id)
        except TarifService.DoesNotExist:
            return Response(
                {'error': 'Service non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Paliers standards selon le type de service
        paliers_standards = []

        if tarif_service.categorie == 'IMPRESSION':
            paliers_standards = [
                {'quantite_minimum': 20, 'type_remise': 'POURCENTAGE', 'valeur_remise': 5, 'description': 'Remise 5% à partir de 20 pages'},
                {'quantite_minimum': 50, 'type_remise': 'POURCENTAGE', 'valeur_remise': 10, 'description': 'Remise 10% à partir de 50 pages'},
                {'quantite_minimum': 100, 'type_remise': 'POURCENTAGE', 'valeur_remise': 15, 'description': 'Remise 15% à partir de 100 pages'},
            ]
        elif tarif_service.categorie == 'MULTISERVICE':
            paliers_standards = [
                {'quantite_minimum': 10, 'type_remise': 'POURCENTAGE', 'valeur_remise': 5, 'description': 'Remise 5% à partir de 10 unités'},
                {'quantite_minimum': 25, 'type_remise': 'POURCENTAGE', 'valeur_remise': 10, 'description': 'Remise 10% à partir de 25 unités'},
            ]

        created_count = 0
        for palier_data in paliers_standards:
            palier, created = PalierRemise.objects.get_or_create(
                tarif_service=tarif_service,
                quantite_minimum=palier_data['quantite_minimum'],
                defaults={
                    'type_remise': palier_data['type_remise'],
                    'valeur_remise': palier_data['valeur_remise'],
                    'description': palier_data['description'],
                    'actif': True
                }
            )
            if created:
                created_count += 1

        return Response({
            'message': f'{created_count} paliers créés pour {tarif_service.nom_service}'
        })

    @action(detail=False, methods=['get'])
    def simuler_remise(self, request):
        """Simuler l'application d'une remise pour une quantité donnée"""
        tarif_service_id = request.query_params.get('tarif_service_id')
        quantite = request.query_params.get('quantite')

        if not tarif_service_id or not quantite:
            return Response(
                {'error': 'tarif_service_id et quantite requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            tarif_service = TarifService.objects.get(id=tarif_service_id)
            quantite = float(quantite)
        except (TarifService.DoesNotExist, ValueError):
            return Response(
                {'error': 'Paramètres invalides'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Trouver la meilleure remise applicable
        remises_valides = tarif_service.paliers_remise.filter(
            quantite_minimum__lte=quantite,
            actif=True
        ).order_by('-quantite_minimum')

        prix_original = tarif_service.prix_unitaire
        prix_final = prix_original
        remise_appliquee = None

        for remise in remises_valides:
            if remise.est_valide():
                prix_final = remise.calculer_prix_unitaire(prix_original)
                remise_appliquee = remise
                break

        montant_original = quantite * prix_original
        montant_final = quantite * prix_final
        economie = montant_original - montant_final
        pourcentage_economie = (economie / montant_original * 100) if montant_original > 0 else 0

        return Response({
            'service': tarif_service.nom_service,
            'quantite': quantite,
            'prix_unitaire_original': prix_original,
            'prix_unitaire_final': prix_final,
            'montant_original': montant_original,
            'montant_final': montant_final,
            'economie': economie,
            'pourcentage_economie': round(pourcentage_economie, 2),
            'remise_appliquee': {
                'id': remise_appliquee.id,
                'description': remise_appliquee.description,
                'type_remise': remise_appliquee.get_type_remise_display(),
                'valeur_remise': remise_appliquee.valeur_remise
            } if remise_appliquee else None
        })


class TypePapierViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les types de papier dynamiques"""
    queryset = TypePapier.objects.all()
    serializer_class = TypePapierSerializer

    def get_queryset(self):
        queryset = TypePapier.objects.all()

        # Filtrer par statut actif
        actif = self.request.query_params.get('actif', None)
        if actif is not None:
            queryset = queryset.filter(actif=actif.lower() == 'true')

        # Recherche par nom ou code
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) |
                Q(code__icontains=search)
            )

        return queryset.order_by('nom')

    @action(detail=False, methods=['get'])
    def actifs(self, request):
        """Récupérer uniquement les types de papier actifs"""
        types_actifs = TypePapier.objects.filter(actif=True).order_by('nom')
        serializer = self.get_serializer(types_actifs, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def initialiser_types_base(self, request):
        """Initialiser les types de papier de base"""
        types_base = [
            {'nom': 'A4 Noir et Blanc', 'code': 'A4_NB', 'prix_unitaire': 100.00, 'description': 'Papier A4 standard pour impression noir et blanc'},
            {'nom': 'A4 Couleur', 'code': 'A4_COULEUR', 'prix_unitaire': 250.00, 'description': 'Papier A4 pour impression couleur'},
            {'nom': 'A3 Noir et Blanc', 'code': 'A3_NB', 'prix_unitaire': 200.00, 'description': 'Papier A3 pour impression noir et blanc'},
            {'nom': 'A3 Couleur', 'code': 'A3_COULEUR', 'prix_unitaire': 500.00, 'description': 'Papier A3 pour impression couleur'},
            {'nom': 'Bristol 160g', 'code': 'BRISTOL_160', 'prix_unitaire': 150.00, 'description': 'Papier Bristol 160g pour documents officiels'},
            {'nom': 'Photo 200g', 'code': 'PHOTO_200', 'prix_unitaire': 300.00, 'description': 'Papier photo 200g pour impression de qualité'},
        ]

        created_count = 0
        for type_data in types_base:
            type_papier, created = TypePapier.objects.get_or_create(
                code=type_data['code'],
                defaults=type_data
            )
            if created:
                created_count += 1

        return Response({
            'message': f'{created_count} nouveaux types de papier créés',
            'total': TypePapier.objects.count()
        })

    @action(detail=True, methods=['post'])
    def dupliquer(self, request):
        """Dupliquer un type de papier avec un nouveau code"""
        type_original = self.get_object()
        nouveau_nom = request.data.get('nouveau_nom')
        nouveau_code = request.data.get('nouveau_code')

        if not nouveau_nom or not nouveau_code:
            return Response(
                {'error': 'Le nouveau nom et code sont requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Vérifier l'unicité du code
        if TypePapier.objects.filter(code=nouveau_code).exists():
            return Response(
                {'error': 'Ce code existe déjà'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer une copie
        nouveau_type = TypePapier.objects.create(
            nom=nouveau_nom,
            code=nouveau_code,
            prix_unitaire=type_original.prix_unitaire,
            description=f"Copie de {type_original.nom}",
            actif=True
        )

        serializer = self.get_serializer(nouveau_type)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@permission_required('manage_produits')
class ProduitViewSet(viewsets.ModelViewSet):
    """
    ViewSet pour gérer les produits avec suivi de stock et de prix
    """
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer

    def get_queryset(self):
        """
        Surcharge pour ajouter des filtres personnalisés et des annotations.
        """
        queryset = Produit.objects.select_related('categorie', 'unite_mesure', 'unite_achat', 'stock').all()

        # Filtre par catégorie
        categorie_id = self.request.query_params.get('categorie_id')
        if categorie_id:
            queryset = queryset.filter(categorie_id=categorie_id)

        # Filtre par terme de recherche
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(designation__icontains=search) |
                Q(reference__icontains=search) |
                Q(description__icontains=search)
            )

        # Filtre par statut de stock
        en_stock = self.request.query_params.get('en_stock')
        if en_stock == 'true':
            queryset = queryset.filter(stock__quantite_actuelle__gt=0)
        elif en_stock == 'false':
            queryset = queryset.filter(stock__quantite_actuelle__lte=0)

        # Trier par défaut par désignation
        return queryset.order_by('designation')

    @action(detail=False, methods=['get'])
    def statistiques(self, request):
        """
        Retourne des statistiques sur les produits
        """
        # Compter le nombre total de produits
        total_produits = self.get_queryset().count()

        # Compter les produits en rupture de stock
        produits_rupture = self.get_queryset().filter(stock__quantite_actuelle__lte=0).count()

        # Valeur totale du stock au prix d'achat et de vente
        valeurs = self.get_queryset().aggregate(
            valeur_stock_achat=Sum(F('stock__quantite_actuelle') * F('stock__prix_achat_moyen')),
            valeur_stock_vente=Sum(F('stock__quantite_actuelle') * F('prix_vente'))
        )

        return Response({
            'total_produits': total_produits,
            'produits_rupture': produits_rupture,
            'pourcentage_rupture': (produits_rupture / total_produits * 100) if total_produits > 0 else 0,
            'valeur_stock_achat': valeurs.get('valeur_stock_achat') or 0,
            'valeur_stock_vente': valeurs.get('valeur_stock_vente') or 0,
            'marge_globale': (valeurs.get('valeur_stock_vente') or 0) - (valeurs.get('valeur_stock_achat') or 0)
        })

    @action(detail=True, methods=['get'])
    def mouvements(self, request):
        """
        Liste tous les mouvements de stock pour ce produit
        """
        produit = self.get_object()
        mouvements = MouvementStock.objects.filter(stock__produit=produit).order_by('-date_mouvement')

        page = self.paginate_queryset(mouvements)
        if page is not None:
            serializer = MouvementStockSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = MouvementStockSerializer(mouvements, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mettre_a_jour_prix(self, request):
        """
        Mettre à jour le prix de vente d'un produit
        """
        produit = self.get_object()
        nouveau_prix = request.data.get('nouveau_prix')

        if not nouveau_prix:
            return Response(
                {'error': 'Le champ nouveau_prix est requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            nouveau_prix = float(nouveau_prix)
            if nouveau_prix <= 0:
                raise ValueError("Le prix doit être positif")
        except (ValueError, TypeError):
            return Response(
                {'error': 'Le prix doit être un nombre positif'},
                status=status.HTTP_400_BAD_REQUEST
            )

        ancien_prix = produit.prix_vente
        produit.prix_vente = nouveau_prix
        produit.save()

        return Response({
            'message': f'Prix mis à jour: {ancien_prix} → {nouveau_prix} Ar',
            'produit': ProduitSerializer(produit).data
        })

    @action(detail=False, methods=['get'])
    def produits_par_categorie(self, request):
        """
        Retourne la liste des produits groupés par catégorie
        """
        categories = CategorieProduit.objects.annotate(
            nb_produits=Count('produits')
        ).filter(nb_produits__gt=0).order_by('nom')

        result = []
        for categorie in categories:
            produits = Produit.objects.filter(categorie=categorie).order_by('designation')

            result.append({
                'categorie': CategorieProduitSerializer(categorie).data,
                'produits': ProduitSerializer(produits, many=True).data
            })

        return Response(result)

    @action(detail=True, methods=['get'])
    def historique_prix(self, request):
        """
        Retourne l'historique des prix d'achat pour ce produit
        """
        produit = self.get_object()
        mouvements = MouvementStock.objects.filter(
            stock__produit=produit,
            type_mouvement='ENTREE',
            prix_unitaire__gt=0
        ).order_by('-date_mouvement').values(
            'date_mouvement',
            'prix_unitaire',
            'quantite',
            'fournisseur',
            'numero_facture'
        )

        return Response(mouvements)


@permission_required('manage_stock')
class StockViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les stocks de produits"""
    queryset = Stock.objects.select_related('produit__unite_mesure', 'produit__unite_achat', 'produit__categorie').all()
    serializer_class = StockSerializer

    def get_queryset(self):
        queryset = super().get_queryset()

        # Recherche par désignation produit ou référence
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(produit__designation__icontains=search) |
                Q(produit__reference__icontains=search)
            )

        return queryset.order_by('produit__designation')

    @action(detail=False, methods=['post'], serializer_class=EntreeStockSerializer)
    def enregistrer_entree(self, request):
        """Enregistre une entrée de stock (achat) avec conversion d'unité."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        produit = Produit.objects.get(pk=data['produit_id'])
        stock = produit.stock

        quantite_achat = data['quantite_achat']
        prix_total_achat = data['prix_total_achat']

        # Conversion en unité de base
        quantite_base = quantite_achat * produit.quantite_par_unite_achat
        if quantite_base == 0:
            return Response({'error': 'La quantité résultante ne peut pas être zéro.'}, status=status.HTTP_400_BAD_REQUEST)

        prix_unitaire_base = prix_total_achat / quantite_base

        # Mise à jour du prix d'achat moyen pondéré
        ancienne_valeur_stock = stock.quantite_actuelle * stock.prix_achat_moyen
        nouvelle_valeur_stock = ancienne_valeur_stock + prix_total_achat
        nouvelle_quantite_totale = stock.quantite_actuelle + quantite_base

        stock.prix_achat_moyen = nouvelle_valeur_stock / nouvelle_quantite_totale

        # Création du mouvement de stock
        MouvementStock.objects.create(
            stock=stock,
            type_mouvement='ENTREE',
            motif='ACHAT',
            quantite=quantite_base,
            quantite_avant=stock.quantite_actuelle,
            quantite_apres=nouvelle_quantite_totale,
            prix_unitaire=prix_unitaire_base,
            fournisseur=data.get('fournisseur', ''),
            numero_facture=data.get('numero_facture', ''),
            commentaire=data.get('commentaire', f"Achat de {quantite_achat} {produit.unite_achat.symbole if produit.unite_achat else ''}"),
            utilisateur=request.user
        )

        # Mettre à jour la quantité en stock directement
        stock.quantite_actuelle = nouvelle_quantite_totale
        stock.save()

        return Response(StockSerializer(stock).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def alertes(self, request):
        """Récupérer les alertes de stock (ruptures et réapprovisionnements)"""
        ruptures = Stock.objects.filter(quantite_actuelle__lte=0, produit__actif=True)
        reappros = Stock.objects.filter(
            quantite_actuelle__gt=0,
            quantite_actuelle__lte=F('quantite_minimale'),
            produit__actif=True
        )

        return Response({
            'ruptures_stock': StockSerializer(ruptures, many=True).data,
            'reapprovisionnements': StockSerializer(reappros, many=True).data,
            'nombre_ruptures': ruptures.count(),
            'nombre_reapprovisionnements': reappros.count()
        })

    @action(detail=False, methods=['get'])
    def valeurs(self, request):
        """Calculer les valeurs totales du stock"""
        stocks = Stock.objects.filter(produit__actif=True).annotate(
            valeur_achat=F('quantite_actuelle') * F('prix_achat_moyen'),
            valeur_vente=F('quantite_actuelle') * F('produit__prix_vente')
        )

        agregats = stocks.aggregate(
            valeur_achat_totale=Sum('valeur_achat'),
            valeur_vente_totale=Sum('valeur_vente')
        )

        return Response({
            'valeur_stock_achat': agregats.get('valeur_achat_totale') or 0,
            'valeur_stock_vente': agregats.get('valeur_vente_totale') or 0,
            'marge_potentielle': (agregats.get('valeur_vente_totale') or 0) - (agregats.get('valeur_achat_totale') or 0),
            'nombre_produits': stocks.count()
        })

class MouvementStockViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les mouvements de stock"""
    queryset = MouvementStock.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return MouvementStockCreateSerializer
        return MouvementStockSerializer

    def get_queryset(self):
        queryset = MouvementStock.objects.all()

        # Filtrer par stock
        stock_id = self.request.query_params.get('stock', None)
        if stock_id:
            queryset = queryset.filter(stock_id=stock_id)

        # Filtrer par type de mouvement
        type_mouvement = self.request.query_params.get('type_mouvement', None)
        if type_mouvement:
            queryset = queryset.filter(type_mouvement=type_mouvement)

        # Filtrer par motif
        motif = self.request.query_params.get('motif', None)
        if motif:
            queryset = queryset.filter(motif=motif)

        # Filtrer par date
        queryset = filter_by_date_range(queryset, self.request, 'date_mouvement')

        return queryset.order_by('-date_mouvement')

    @action(detail=False, methods=['get'])
    def resume_mouvements(self, request):
        """Résumé des mouvements de stock"""
        aujourd_hui = timezone.now().date()

        # Mouvements du jour
        mouvements_jour = MouvementStock.objects.filter(
            date_mouvement__date=aujourd_hui
        )

        # Statistiques par type
        entrees_jour = mouvements_jour.filter(type_mouvement='ENTREE').aggregate(
            total=Sum('quantite'), count=Count('id')
        )
        sorties_jour = mouvements_jour.filter(type_mouvement='SORTIE').aggregate(
            total=Sum('quantite'), count=Count('id')
        )

        return Response({
            'date': aujourd_hui,
            'entrees': {
                'quantite_totale': entrees_jour['total'] or 0,
                'nombre_mouvements': entrees_jour['count'] or 0
            },
            'sorties': {
                'quantite_totale': sorties_jour['total'] or 0,
                'nombre_mouvements': sorties_jour['count'] or 0
            },
            'total_mouvements_jour': mouvements_jour.count()
        })

    @action(detail=False, methods=['post'])
    def mouvement_rapide(self, request):
        """Créer rapidement un mouvement de stock"""
        code_produit = request.data.get('code_produit')
        type_mouvement = request.data.get('type_mouvement')
        quantite = request.data.get('quantite')
        motif = request.data.get('motif', 'AUTRE')

        if not all([code_produit, type_mouvement, quantite]):
            return Response(
                {'error': 'code_produit, type_mouvement et quantite requis'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            stock = Stock.objects.get(code_produit=code_produit, actif=True)
            quantite = float(quantite)
        except Stock.DoesNotExist:
            return Response(
                {'error': 'Produit non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError:
            return Response(
                {'error': 'Quantité invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Créer le mouvement via le serializer
        mouvement_data = {
            'stock': stock.id,
            'type_mouvement': type_mouvement,
            'motif': motif,
            'quantite': quantite,
            'prix_unitaire': stock.prix_unitaire_achat,
            'commentaire': request.data.get('commentaire', '')
        }

        serializer = MouvementStockCreateSerializer(data=mouvement_data)
        if serializer.is_valid():
            mouvement = serializer.save()
            return Response(
                MouvementStockSerializer(mouvement).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CategorieProduitViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les catégories de produits"""
    queryset = CategorieProduit.objects.all()
    serializer_class = CategorieProduitSerializer
    permission_classes = [IsAuthenticated]

class UniteMesureViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer les unités de mesure"""
    queryset = UniteMesure.objects.all()
    serializer_class = UniteMesureSerializer
    permission_classes = [IsAuthenticated]

@permission_required('add_recette')
class VenteProduitViewSet(viewsets.ModelViewSet):
    """ViewSet pour gérer la vente directe de produits."""
    queryset = VenteProduit.objects.all()

    def get_serializer_class(self):
        if self.action == 'create':
            return VenteProduitCreateSerializer
        return VenteProduitSerializer

    def get_queryset(self):
        return VenteProduit.objects.select_related('produit', 'transaction', 'produit__stock', 'produit__unite_mesure').order_by('-transaction__date_transaction')

    @action(detail=False, methods=['get'])
    def ventes_du_jour(self, request):
        """Retourne les ventes de produits pour la journée en cours."""
        aujourd_hui = timezone.now().date()
        ventes = VenteProduit.objects.filter(transaction__date_transaction__date=aujourd_hui)
        serializer = self.get_serializer(ventes, many=True)
        return Response(serializer.data)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):

    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        remember_me = data.get('rememberMe', False)

        if not username or not password:
            return Response({
                'error': 'Nom d\'utilisateur et mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Authentification de l'utilisateur
        user = authenticate(username=username, password=password)

        if user is not None:
            if user.is_active:
                login(request, user)

                # Créer ou récupérer le token
                token, created = Token.objects.get_or_create(user=user)

                return Response({
                    'success': True,
                    'message': 'Connexion réussie',
                    'token': token.key,
                    'user': {
                        'id': user.id,
                        'username': user.username,
                        'email': user.email,
                        'first_name': user.first_name,
                        'last_name': user.last_name,
                        'rememberMe': remember_me
                    }
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Compte désactivé'
                }, status=status.HTTP_401_UNAUTHORIZED)
        else:
            return Response({
                'error': 'Nom d\'utilisateur ou mot de passe incorrect'
            }, status=status.HTTP_401_UNAUTHORIZED)

    except Exception as e:
        return Response({
            'error': f'Erreur serveur {e}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Vue de déconnexion
    """
    try:
        # Supprimer le token de l'utilisateur
        token = Token.objects.get(user=request.user)
        token.delete()

        # Déconnexion
        logout(request)

        return Response({
            'success': True,
            'message': 'Déconnexion réussie'
        }, status=status.HTTP_200_OK)

    except Token.DoesNotExist:
        logout(request)
        return Response({
            'success': True,
            'message': 'Déconnexion réussie'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la  {e}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    """
    Vérifier la validité du token
    """
    try:
        return Response({
            'valid': True,
            'user': {
                'id': request.user.id,
                'username': request.user.username,
                'email': request.user.email,
                'first_name': request.user.first_name,
                'last_name': request.user.last_name,
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'valid': False,
            'error': f'Token invalide {e}'
        }, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Vue d'inscription (optionnelle)
    """
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')
        email = data.get('email', '')
        first_name = data.get('first_name', '')
        last_name = data.get('last_name', '')

        if not username or not password:
            return Response({
                'error': 'Nom d\'utilisateur et mot de passe requis'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Vérifier si l'utilisateur existe déjà
        if User.objects.filter(username=username).exists():
            return Response({
                'error': 'Ce nom d\'utilisateur existe déjà'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Créer l'utilisateur
        user = User.objects.create_user(
            username=username,
            password=password,
            email=email,
            first_name=first_name,
            last_name=last_name
        )

        # Créer le token
        token = Token.objects.create(user=user)

        return Response({
            'success': True,
            'message': 'Compte créé avec succès',
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        }, status=status.HTTP_201_CREATED)

    except json.JSONDecodeError:
        return Response({
            'error': 'Format JSON invalide'
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'error': f'Erreur lors de la création du compte {e}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
