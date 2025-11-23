from django.contrib import admin
from .models import (
    CategorieService, Transaction, Depense,
    TarifService, ServicePersonnalise, PalierRemise,
    Permission, Role, ProfilUtilisateur
)

@admin.register(CategorieService)
class CategorieServiceAdmin(admin.ModelAdmin):
    list_display = ['nom', 'description', 'actif']
    list_filter = ['actif']
    search_fields = ['nom']

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ['type_transaction', 'montant', 'description', 'date_transaction', 'utilisateur']
    list_filter = ['type_transaction', 'date_transaction'] # 'categorie_service' supprimé
    search_fields = ['description']
    date_hierarchy = 'date_transaction'

@admin.register(Depense)
class DepenseAdmin(admin.ModelAdmin):
    list_display = ['transaction', 'categorie_depense', 'fournisseur', 'numero_facture']
    list_filter = ['categorie_depense']
    search_fields = ['fournisseur', 'numero_facture']

@admin.register(TarifService)
class TarifServiceAdmin(admin.ModelAdmin):
    list_display = ['nom_service', 'categorie', 'prix_unitaire', 'unite_mesure', 'actif']
    list_filter = ['categorie', 'actif']
    search_fields = ['nom_service']

class HasRemiseFilter(admin.SimpleListFilter):
    title = 'Remise appliquée'
    parameter_name = 'has_remise'

    def lookups(self, request, model_admin):
        return (
            ('yes', 'Avec remise'),
            ('no', 'Sans remise'),
        )

    def queryset(self, request, queryset):
        if self.value() == 'yes':
            return queryset.filter(remise_appliquee__isnull=False)
        if self.value() == 'no':
            return queryset.filter(remise_appliquee__isnull=True)
        return None


@admin.register(ServicePersonnalise)
class ServicePersonnaliseAdmin(admin.ModelAdmin):
    list_display = ['transaction', 'tarif_service', 'quantite', 'get_prix_unitaire_original', 'get_prix_unitaire_utilise', 'remise_appliquee']
    list_filter = ['tarif_service__categorie', HasRemiseFilter]
    search_fields = ['tarif_service__nom_service']

    def get_prix_unitaire_original(self, obj):
        return obj.tarif_service.prix_unitaire
    get_prix_unitaire_original.short_description = "Prix Unitaire Original"
    get_prix_unitaire_original.admin_order_field = 'tarif_service__prix_unitaire'

    def get_prix_unitaire_utilise(self, obj):
        return obj.prix_unitaire_negocie if obj.prix_unitaire_negocie is not None else obj.tarif_service.prix_unitaire
    get_prix_unitaire_utilise.short_description = "Prix Unitaire Utilisé"
    # Pas de admin_order_field direct car c'est une logique conditionnelle

@admin.register(PalierRemise)
class PalierRemiseAdmin(admin.ModelAdmin):
    list_display = ['tarif_service', 'quantite_minimum', 'type_remise', 'valeur_remise', 'actif']
    list_filter = ['type_remise', 'actif', 'tarif_service__categorie']
    search_fields = ['tarif_service__nom_service']

@admin.register(Permission)
class PermissionAdmin(admin.ModelAdmin):
    list_display = ['nom', 'code_permission', 'module', 'actif']
    list_filter = ['module', 'actif']
    search_fields = ['nom', 'code_permission']

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['nom', 'description', 'couleur', 'actif']
    list_filter = ['actif']
    search_fields = ['nom']
    filter_horizontal = ['permissions']

@admin.register(ProfilUtilisateur)
class ProfilUtilisateurAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'actif', 'date_creation']
    list_filter = ['role', 'actif', 'date_creation']
    search_fields = ['user__username', 'user__email']
    filter_horizontal = ['permissions_supplementaires', 'permissions_refusees']
