from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    CategorieService, Transaction,
    Depense, TypePapier,
    TarifService, VenteProduit, ServicePersonnalise, PalierRemise,
    Permission, Role, ProfilUtilisateur, Stock, MouvementStock, Produit, CategorieProduit, UniteMesure,
    VenteGroupee, LigneDeVente, ConsommationService,
    ParametreEntreprise # Import the new model
)


# New Serializer for CompanySettings
class ParametreEntrepriseSerializer(serializers.ModelSerializer):
    class Meta:
        model = ParametreEntreprise
        fields = '__all__'


class CategorieServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieService
        fields = '__all__'


class TransactionSerializer(serializers.ModelSerializer):
    utilisateur_nom = serializers.CharField(source='utilisateur.username', read_only=True)
    categorie_service_nom = serializers.CharField(source='categorie_service.nom', read_only=True)
    type_transaction_display = serializers.CharField(source='get_type_transaction_display', read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'type_transaction', 'type_transaction_display', 'montant',
            'description', 'date_transaction', 'categorie_service',
            'categorie_service_nom', 'utilisateur', 'utilisateur_nom',
            'date_creation', 'date_modification'
        ]

class TransactionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer pour la création de transactions, n'incluant que les champs modifiables.
    """
    class Meta:
        model = Transaction
        fields = ['montant', 'description']


class DepenseSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer()
    categorie_depense_display = serializers.CharField(source='get_categorie_depense_display', read_only=True)

    class Meta:
        model = Depense
        fields = [
            'id', 'transaction', 'categorie_depense', 'categorie_depense_display',
            'fournisseur', 'numero_facture', 'date_echeance'
        ]

    def create(self, validated_data):
        transaction_data = validated_data.pop('transaction')
        transaction_data['type_transaction'] = 'DEPENSE'
        transaction = Transaction.objects.create(**transaction_data)
        depense = Depense.objects.create(
            transaction=transaction,
            **validated_data
        )
        return depense


class DepenseCreateSerializer(serializers.ModelSerializer):
    # Utiliser le TransactionCreateSerializer pour le champ transaction imbriqué
    transaction = TransactionCreateSerializer()

    class Meta:
        model = Depense
        fields = [
            'categorie_depense', 'fournisseur', 'numero_facture',
            'date_echeance', 'transaction' # 'transaction' est maintenant un champ imbriqué
        ]

    def create(self, validated_data):
        # Extraire les données de transaction imbriquées
        transaction_data = validated_data.pop('transaction')
        
        # Assurer que le type de transaction est 'DEPENSE'
        transaction_data['type_transaction'] = 'DEPENSE'
        
        # Récupérer l'utilisateur de la requête si disponible
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None
        if user and user.is_authenticated:
            transaction_data['utilisateur'] = user
        
        # Créer la transaction
        transaction = Transaction.objects.create(**transaction_data)

        # Créer la dépense, en la liant à la transaction nouvellement créée
        depense = Depense.objects.create(
            transaction=transaction,
            **validated_data
        )
        return depense


class PalierRemiseSerializer(serializers.ModelSerializer):
    type_remise_display = serializers.CharField(source='get_type_remise_display', read_only=True)
    tarif_service_nom = serializers.CharField(source='tarif_service.nom_service', read_only=True)
    est_valide = serializers.ReadOnlyField()

    class Meta:
        model = PalierRemise
        fields = [
            'id', 'tarif_service', 'tarif_service_nom', 'quantite_minimum',
            'type_remise', 'type_remise_display', 'valeur_remise', 'description',
            'actif', 'date_debut', 'date_fin', 'est_valide'
        ]

class ConsommationServiceSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.designation', read_only=True)
    produit_stock = serializers.DecimalField(source='produit.stock.quantite_actuelle', max_digits=10, decimal_places=2, read_only=True, default=0)

    class Meta:
        model = ConsommationService
        fields = ['produit', 'produit_nom', 'produit_stock', 'quantite']

class ConsommationServiceWriteSerializer(serializers.Serializer):
    produit_id = serializers.IntegerField()
    quantite = serializers.DecimalField(max_digits=10, decimal_places=4)

class TarifServiceSerializer(serializers.ModelSerializer):
    categorie_display = serializers.CharField(source='get_categorie_display', read_only=True)
    # type_papier_display = serializers.CharField(source='get_type_papier_display', read_only=True) # Supprimé
    paliers_remise = PalierRemiseSerializer(many=True, read_only=True)
    nombre_paliers = serializers.SerializerMethodField()
    consommations = ConsommationServiceSerializer(source='consommationservice_set', many=True, read_only=True)
    consommations_write = ConsommationServiceWriteSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = TarifService
        fields = [
            'id', 'nom_service', 'categorie', 'categorie_display', 'prix_unitaire',
            'unite_mesure', 'description', 'actif', 'code_service', # 'type_papier' supprimé
            'consommations', 'consommations_write',
            'date_creation', 'date_modification', 'paliers_remise', 'nombre_paliers'
        ]
        read_only_fields = ['code_service']

    @staticmethod
    def get_nombre_paliers(obj):
        return obj.paliers_remise.filter(actif=True).count()

    @staticmethod
    def _handle_consommations(tarif_service, consommations_data):
        # Supprimer les anciennes consommations
        ConsommationService.objects.filter(tarif_service=tarif_service).delete()
        # Créer les nouvelles
        for conso_data in consommations_data:
            ConsommationService.objects.create(
                tarif_service=tarif_service,
                produit_id=conso_data['produit_id'],
                quantite=conso_data['quantite']
            )

    def create(self, validated_data):
        consommations_data = validated_data.pop('consommations_write', [])
        tarif_service = TarifService.objects.create(**validated_data)
        self._handle_consommations(tarif_service, consommations_data)
        return tarif_service

    def update(self, instance, validated_data):
        consommations_data = validated_data.pop('consommations_write', None)
        instance = super().update(instance, validated_data)
        if consommations_data is not None:
            self._handle_consommations(instance, consommations_data)
        return instance


class VenteProduitSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer()
    montant_total = serializers.SerializerMethodField()
    produit_designation = serializers.CharField(source='produit.designation', read_only=True)

    class Meta:
        model = VenteProduit
        fields = [
            'id', 'transaction', 'produit', 'produit_designation',
            'quantite', 'prix_unitaire', 'montant_total'
        ]

    @staticmethod
    def get_montant_total(obj):
        return obj.quantite * obj.prix_unitaire

    def create(self, validated_data):
        transaction_data = validated_data.pop('transaction')
        transaction_data['type_transaction'] = 'RECETTE'
        transaction_data['montant'] = validated_data['quantite'] * validated_data['prix_unitaire']
        transaction = Transaction.objects.create(**transaction_data)
        vente_produit = VenteProduit.objects.create(
            transaction=transaction,
            **validated_data
        )
        return vente_produit


class VenteProduitCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = VenteProduit
        fields = [
            'produit', 'quantite', 'prix_unitaire',
            'transaction'
        ]
        extra_kwargs = {
            'transaction': {'read_only': True},
            'prix_unitaire': {'required': True}
        }

    def validate(self, data):
        """
        Validation personnalisée pour la vente de produit.
        Vérifie que le stock est suffisant et que le prix est valide.
        """
        produit = data.get('produit')
        quantite = data.get('quantite', 0)
        prix_unitaire = data.get('prix_unitaire')

        # Vérifier que le produit a un stock associé
        if not hasattr(produit, 'stock'):
            raise serializers.ValidationError({
                'produit': "Ce produit n'a pas de stock associé"
            })

        # Vérifier le stock disponible
        stock = produit.stock
        if quantite > stock.quantite_actuelle:
            raise serializers.ValidationError({
                'quantite': f"Stock insuffisant. Quantité disponible : {stock.quantite_actuelle} {produit.unite_mesure.symbole}"
            })

        # Vérifier que le prix est cohérent avec le prix de vente du produit
        if prix_unitaire <= 0:
            raise serializers.ValidationError({
                'prix_unitaire': "Le prix unitaire doit être supérieur à 0"
            })

        return data

    def create(self, validated_data):
        """
        Crée une vente de produit avec la transaction associée.
        """
        # Récupérer l'utilisateur de la requête
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None

        # Créer la transaction associée
        transaction = Transaction.objects.create(
            type_transaction='RECETTE',
            montant=validated_data['quantite'] * validated_data['prix_unitaire'],
            description=f"Vente de {validated_data['produit'].designation}",
            utilisateur=user,
            categorie_service=CategorieService.objects.get_or_create(
                nom='VENTE_PRODUIT',
                defaults={'description': 'Vente de produits'}
            )[0]
        )

        # Créer la vente de produit
        vente = VenteProduit.objects.create(
            transaction=transaction,
            produit=validated_data['produit'],
            quantite=validated_data['quantite'],
            prix_unitaire=validated_data['prix_unitaire']
        )

        return vente


class ServicePersonnaliseSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer()
    tarif_service_nom = serializers.CharField(source='tarif_service.nom_service', read_only=True)
    tarif_service_unite = serializers.CharField(source='tarif_service.unite_mesure', read_only=True)
    montant_total = serializers.ReadOnlyField()
    montant_remise = serializers.ReadOnlyField()
    pourcentage_remise = serializers.ReadOnlyField()
    remise_appliquee_description = serializers.CharField(source='remise_appliquee.description', read_only=True)

    class Meta:
        model = ServicePersonnalise
        fields = [
            'id', 'transaction', 'tarif_service', 'tarif_service_nom',
            'tarif_service_unite', 'quantite', 'prix_unitaire_original',
            'prix_unitaire_utilise', 'montant_total', 'montant_remise',
            'pourcentage_remise', 'remise_appliquee', 'remise_appliquee_description',
            'details_supplementaires', 'usage_interne'
        ]

    def create(self, validated_data):
        transaction_data = validated_data.pop('transaction')
        transaction_data['type_transaction'] = 'RECETTE'
        transaction = Transaction.objects.create(**transaction_data)
        service_personnalise = ServicePersonnalise.objects.create(
            transaction=transaction,
            **validated_data
        )
        return service_personnalise


class ServicePersonnaliseCreateSerializer(serializers.ModelSerializer):
    tarif_service_id = serializers.IntegerField(write_only=True)
    description = serializers.CharField(max_length=255, required=False)
    montant_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    montant_remise = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    pourcentage_remise = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    prix_unitaire_final = serializers.DecimalField(max_digits=8, decimal_places=2, read_only=True)

    class Meta:
        model = ServicePersonnalise
        fields = [
            'tarif_service_id', 'quantite', 'details_supplementaires',
            'description', 'montant_total', 'montant_remise', 'pourcentage_remise',
            'prix_unitaire_final', 'usage_interne'
        ]

    @staticmethod
    def validate_tarif_service_id(value):
        try:
            tarif = TarifService.objects.get(id=value, actif=True)
            return tarif
        except TarifService.DoesNotExist:
            raise serializers.ValidationError("Service non trouvé ou inactif")

    def create(self, validated_data):
        tarif_service = validated_data.pop('tarif_service_id')
        usage_interne = validated_data.get('usage_interne', False)

        # Générer description automatique si non fournie
        description = validated_data.pop('description', '')
        if not description:
            description = f"{tarif_service.nom_service} x{validated_data['quantite']} {tarif_service.unite_mesure}"
        
        if usage_interne:
            description = f"[USAGE INTERNE] {description}"

        # Créer transaction temporaire pour calculer les remises
        transaction_temp = Transaction(
            type_transaction='RECETTE',
            montant=0,  # Sera calculé automatiquement
            description=description
        )
        transaction_temp.save()

        # Créer service personnalisé (le save() calculera automatiquement les remises)
        service_personnalise = ServicePersonnalise.objects.create(
            transaction=transaction_temp,
            tarif_service=tarif_service,
            **validated_data
        )

        return service_personnalise


class ServiceRapideSerializer(serializers.Serializer):
    """Serializer pour créer rapidement un service avec calcul automatique"""
    code_service = serializers.CharField(max_length=20)
    quantite = serializers.DecimalField(max_digits=8, decimal_places=2, default=1)
    description_personnalisee = serializers.CharField(max_length=255, required=False)
    prix_personnalise = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)

    @staticmethod
    def validate_code_service(value):
        try:
            tarif = TarifService.objects.get(code_service=value, actif=True)
            return tarif
        except TarifService.DoesNotExist:
            raise serializers.ValidationError(f"Service avec le code '{value}' non trouvé ou inactif")

    def create(self, validated_data):
        tarif_service = validated_data['code_service']
        quantite = validated_data['quantite']
        prix_unitaire = validated_data.get('prix_personnalise', tarif_service.prix_unitaire)

        # Description
        description = validated_data.get('description_personnalisee',
                                         f"{tarif_service.nom_service} x{quantite} {tarif_service.unite_mesure}")

        # Montant total
        montant_total = quantite * prix_unitaire

        # Créer transaction
        transaction = Transaction.objects.create(
            type_transaction='RECETTE',
            montant=montant_total,
            description=description
        )

        # Créer service personnalisé
        service = ServicePersonnalise.objects.create(
            transaction=transaction,
            tarif_service=tarif_service,
            quantite=quantite,
            prix_unitaire_utilise=prix_unitaire,
            details_supplementaires=validated_data.get('description_personnalisee', '')
        )

        return {
            'id': service.id,
            'transaction_id': transaction.id,
            'service': tarif_service.nom_service,
            'quantite': quantite,
            'prix_unitaire': prix_unitaire,
            'montant_total': montant_total,
            'description': description
        }


class ServiceRapideAvecRemiseSerializer(serializers.Serializer):
    """Serializer pour créer rapidement un service avec calcul automatique des remises"""
    code_service = serializers.CharField(max_length=20)
    quantite = serializers.DecimalField(max_digits=8, decimal_places=2, default=1)
    description_personnalisee = serializers.CharField(max_length=255, required=False)
    forcer_prix = serializers.DecimalField(max_digits=8, decimal_places=2, required=False)
    ignorer_remises = serializers.BooleanField(default=False)
    usage_interne = serializers.BooleanField(default=False)

    @staticmethod
    def validate_code_service(value):
        try:
            tarif = TarifService.objects.get(code_service=value, actif=True)
            return tarif
        except TarifService.DoesNotExist:
            raise serializers.ValidationError(f"Service avec le code '{value}' non trouvé ou inactif")

    def create(self, validated_data):
        tarif_service = validated_data['code_service']
        quantite = validated_data['quantite']
        ignorer_remises = validated_data.get('ignorer_remises', False)
        usage_interne = validated_data.get('usage_interne', False)

        # Description
        description = validated_data.get('description_personnalisee',
                                         f"{tarif_service.nom_service} x{quantite} {tarif_service.unite_mesure}")
        if usage_interne:
            description = f"[USAGE INTERNE] {description}"

        # Créer transaction
        transaction = Transaction.objects.create(
            type_transaction='RECETTE',
            montant=0,  # Sera calculé automatiquement
            description=description
        )

        # Créer service personnalisé
        service_data = {
            'transaction': transaction,
            'tarif_service': tarif_service,
            'quantite': quantite,
            'usage_interne': usage_interne,
        }

        # Forcer un prix spécifique si demandé
        if 'forcer_prix' in validated_data:
            service_data['prix_unitaire_utilise'] = validated_data['forcer_prix']

        service = ServicePersonnalise.objects.create(**service_data)

        # Calculer les remises si pas ignorées et pas de prix forcé
        if not ignorer_remises and 'forcer_prix' not in validated_data:
            service.save()  # Déclenchera le calcul automatique des remises

        return {
            'id': service.id,
            'transaction_id': transaction.id,
            'service': tarif_service.nom_service,
            'quantite': float(quantite),
            'prix_unitaire_original': float(service.prix_unitaire_original),
            'prix_unitaire_final': float(service.prix_unitaire_utilise),
            'montant_total': float(service.montant_total),
            'montant_remise': float(service.montant_remise),
            'pourcentage_remise': float(service.pourcentage_remise),
            'remise_appliquee': service.remise_appliquee.description if service.remise_appliquee else None,
            'description': description,
            'usage_interne': usage_interne,
        }


class PermissionSerializer(serializers.ModelSerializer):
    code_permission_display = serializers.CharField(source='get_code_permission_display', read_only=True)

    class Meta:
        model = Permission
        fields = [
            'id', 'code_permission', 'code_permission_display', 'nom',
            'description', 'module', 'actif'
        ]


class RoleSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    nombre_permissions = serializers.ReadOnlyField()
    nombre_utilisateurs = serializers.SerializerMethodField()

    class Meta:
        model = Role
        fields = [
            'id', 'nom', 'description', 'permissions', 'actif', 'couleur',
            'nombre_permissions', 'nombre_utilisateurs', 'date_creation', 'date_modification'
        ]

    @staticmethod
    def get_nombre_utilisateurs(obj):
        return obj.profilutilisateur_set.filter(actif=True).count()


class ProfilUtilisateurSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    is_superuser = serializers.BooleanField(source='user.is_superuser', read_only=True) # Ajout de is_superuser
    role_nom = serializers.CharField(source='role.nom', read_only=True)
    permissions_effectives = serializers.SerializerMethodField()
    peut_travailler = serializers.ReadOnlyField(source='peut_travailler_maintenant')

    class Meta:
        model = ProfilUtilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'is_superuser', # Ajout de is_superuser
            'role', 'role_nom', 'permissions_supplementaires', 'permissions_refusees',
            'telephone', 'poste', 'actif', 'heure_debut_travail', 'heure_fin_travail',
            'jours_travail', 'permissions_effectives', 'peut_travailler',
            'date_creation', 'derniere_connexion'
        ]

    @staticmethod
    def get_permissions_effectives(obj):
        return obj.obtenir_toutes_permissions()


class RoleCreateSerializer(serializers.ModelSerializer):
    permissions_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = Role
        fields = ['nom', 'description', 'couleur', 'permissions_ids']

    def create(self, validated_data):
        permissions_ids = validated_data.pop('permissions_ids', [])
        role = Role.objects.create(**validated_data)

        if permissions_ids:
            permissions = Permission.objects.filter(id__in=permissions_ids, actif=True)
            role.permissions.set(permissions)

        return role


class ProfilUtilisateurCreateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True, min_length=8)
    email = serializers.EmailField(write_only=True)
    first_name = serializers.CharField(write_only=True, required=False)
    last_name = serializers.CharField(write_only=True, required=False)
    permissions_supplementaires_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    permissions_refusees_ids = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )

    class Meta:
        model = ProfilUtilisateur
        fields = [
            'username', 'password', 'email', 'first_name', 'last_name',
            'role', 'permissions_supplementaires_ids', 'permissions_refusees_ids',
            'telephone', 'poste', 'heure_debut_travail', 'heure_fin_travail',
            'jours_travail'
        ]

    @staticmethod
    def validate_username(value):
        # Vérifie si un utilisateur avec ce nom d'utilisateur existe déjà
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Un utilisateur avec ce nom d'utilisateur existe déjà.")
        return value

    def create(self, validated_data):
        # Extraire les données utilisateur
        user_data = {
            'username': validated_data.pop('username'),
            'email': validated_data.pop('email'),
            'first_name': validated_data.pop('first_name', ''),
            'last_name': validated_data.pop('last_name', ''),
        }
        password = validated_data.pop('password')

        # Extraire les permissions
        permissions_supp_ids = validated_data.pop('permissions_supplementaires_ids', [])
        permissions_ref_ids = validated_data.pop('permissions_refusees_ids', [])

        # Créer l'utilisateur
        user = User.objects.create_user(password=password, **user_data)

        # Créer/Mettre à jour le profil
        profil = ProfilUtilisateur.objects.get(user=user)
        for key, value in validated_data.items():
            setattr(profil, key, value)
        profil.save()

        # Assigner les permissions
        if permissions_supp_ids:
            permissions_supp = Permission.objects.filter(id__in=permissions_supp_ids, actif=True)
            profil.permissions_supplementaires.set(permissions_supp)

        if permissions_ref_ids:
            permissions_ref = Permission.objects.filter(id__in=permissions_ref_ids, actif=True)
            profil.permissions_refusees.set(permissions_ref)

        return profil


class PermissionCheckSerializer(serializers.Serializer):
    """Serializer pour vérifier les permissions d'un utilisateur"""
    user_id = serializers.IntegerField()
    permission_code = serializers.CharField(max_length=50)

    @staticmethod
    def validate_user_id(value):
        try:
            user = User.objects.get(id=value)
            return user
        except User.DoesNotExist:
            raise serializers.ValidationError("Utilisateur non trouvé")

    @staticmethod
    def validate_permission_code(value):
        if not Permission.objects.filter(code_permission=value, actif=True).exists():
            raise serializers.ValidationError("Permission non trouvée")
        return value


class CategorieProduitSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategorieProduit
        fields = '__all__'


class UniteMesureSerializer(serializers.ModelSerializer):
    class Meta:
        model = UniteMesure
        fields = '__all__'


class ProduitSerializer(serializers.ModelSerializer):
    """ Serializer pour la gestion des produits """
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    unite_mesure_nom = serializers.CharField(source='unite_mesure.nom', read_only=True)
    unite_mesure_symbole = serializers.CharField(source='unite_mesure.symbole', read_only=True)
    unite_achat_nom = serializers.CharField(source='unite_achat.nom', read_only=True, allow_null=True)
    unite_achat_symbole = serializers.CharField(source='unite_achat.symbole', read_only=True, allow_null=True)

    categorie = serializers.PrimaryKeyRelatedField(queryset=CategorieProduit.objects.all(), allow_null=True)
    unite_mesure = serializers.PrimaryKeyRelatedField(queryset=UniteMesure.objects.all())
    unite_achat = serializers.PrimaryKeyRelatedField(queryset=UniteMesure.objects.all(), allow_null=True, required=False)

    # Ajout du sérialiseur de stock
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Produit
        fields = [
            'id', 'designation', 'reference', 'description', 'actif',
            'categorie', 'categorie_nom', 'prix_vente', 'marge_minimale',
            'unite_mesure', 'unite_mesure_nom', 'unite_mesure_symbole',
            'unite_achat', 'unite_achat_nom', 'unite_achat_symbole',
            'quantite_par_unite_achat',
            'stock',  # Inclure stock ici
            'date_creation', 'date_modification',
        ]
        read_only_fields = ['reference', 'date_creation', 'date_modification']

    @staticmethod
    def get_stock(obj):
        try:
            return StockSerializer(obj.stock).data
        except Stock.DoesNotExist:
            return None

    def create(self, validated_data):
        produit = Produit.objects.create(**validated_data)
        # Assurez-vous que le stock est créé avec le produit
        Stock.objects.create(produit=produit)
        return produit


class StockSerializer(serializers.ModelSerializer):
    """Serializer pour la gestion des stocks aligné avec le modèle Stock/Produit"""
    # produit = ProduitSerializer(read_only=True) # Supprimé pour éviter la récursion

    # Champs exposés pour compatibilité frontend
    produit_id = serializers.IntegerField(source='produit.id', read_only=True) # Ajout de ce champ
    nom_produit = serializers.CharField(source='produit.designation', read_only=True, allow_null=True, default=None)
    code_produit = serializers.CharField(source='produit.reference', read_only=True, allow_null=True, default=None)
    description_produit = serializers.CharField(source='produit.description', read_only=True, allow_null=True, default=None)
    unite_mesure_produit = serializers.CharField(source='produit.unite_mesure.symbole', read_only=True, allow_null=True, default=None)
    prix_unitaire_vente_produit = serializers.DecimalField(source='produit.prix_vente', max_digits=10, decimal_places=2,
                                                           read_only=True, allow_null=True, default=None)

    # Champs calculés
    valeur_stock_achat = serializers.SerializerMethodField()
    valeur_stock_vente = serializers.SerializerMethodField()
    est_en_rupture = serializers.SerializerMethodField()
    necessite_reapprovisionnement = serializers.SerializerMethodField()

    class Meta:
        model = Stock
        fields = [
            'id', 'produit_id', # Inclure produit_id ici
            'nom_produit', 'code_produit', 'description_produit',
            'quantite_actuelle', 'quantite_minimale', 'quantite_maximale',
            'prix_achat_moyen', 'etat', 'derniere_mise_a_jour', 'commentaire',
            'unite_mesure_produit', 'prix_unitaire_vente_produit',
            'valeur_stock_achat', 'valeur_stock_vente',
            'est_en_rupture', 'necessite_reapprovisionnement'
        ]

    @staticmethod
    def get_valeur_stock_achat(obj):
        # Utilise le prix d'achat moyen du stock
        return obj.prix_achat_moyen * obj.quantite_actuelle if obj.prix_achat_moyen and obj.quantite_actuelle else 0

    @staticmethod
    def get_valeur_stock_vente(obj):
        # Utilise le prix de vente du produit associé
        return obj.produit.prix_vente * obj.quantite_actuelle if obj.produit and obj.produit.prix_vente and obj.quantite_actuelle else 0

    @staticmethod
    def get_est_en_rupture(obj):
        return obj.quantite_actuelle <= 0

    @staticmethod
    def get_necessite_reapprovisionnement(obj):
        return obj.quantite_minimale >= obj.quantite_actuelle > 0


class EntreeStockSerializer(serializers.Serializer):
    """Serializer pour enregistrer une nouvelle entrée de stock (achat)"""
    produit_id = serializers.IntegerField()
    quantite_achat = serializers.DecimalField(max_digits=10, decimal_places=2)
    prix_total_achat = serializers.DecimalField(max_digits=10, decimal_places=2)
    fournisseur = serializers.CharField(max_length=100, required=False, allow_blank=True)
    numero_facture = serializers.CharField(max_length=50, required=False, allow_blank=True)
    commentaire = serializers.CharField(required=False, allow_blank=True)

    @staticmethod
    def validate_produit_id(value):
        if not Produit.objects.filter(pk=value).exists():
            raise serializers.ValidationError("Produit non trouvé.")
        return value


class MouvementStockSerializer(serializers.ModelSerializer):
    """Serializer pour les mouvements de stock"""
    stock_nom = serializers.CharField(source='stock.produit.designation', read_only=True)
    stock_unite = serializers.CharField(source='stock.produit.unite_mesure.symbole', read_only=True)
    type_mouvement_display = serializers.CharField(source='get_type_mouvement_display', read_only=True)
    motif_display = serializers.CharField(source='get_motif_display', read_only=True)
    utilisateur_nom = serializers.CharField(source='utilisateur.username', read_only=True)

    class Meta:
        model = MouvementStock
        fields = [
            'id', 'stock', 'stock_nom', 'stock_unite', 'type_mouvement', 'type_mouvement_display',
            'motif', 'motif_display', 'quantite', 'quantite_avant', 'quantite_apres',
            'prix_unitaire', 'valeur_totale', 'transaction', 'utilisateur', 'utilisateur_nom',
            'numero_facture', 'fournisseur', 'commentaire', 'date_mouvement', 'date_creation'
        ]
        read_only_fields = ['date_creation', 'valeur_totale']


class MouvementStockCreateSerializer(serializers.ModelSerializer):
    """Serializer pour créer des mouvements de stock"""
    mettre_a_jour_stock = serializers.BooleanField(default=True, write_only=True)

    class Meta:
        model = MouvementStock
        fields = [
            'stock', 'type_mouvement', 'motif', 'quantite',
            'prix_unitaire', 'numero_facture', 'fournisseur', 'commentaire',
            'mettre_a_jour_stock'
        ]

    def create(self, validated_data):
        validated_data.pop('mettre_a_jour_stock', True)
        stock = validated_data['stock']

        # Enregistrer la quantité avant mouvement
        validated_data['quantite_avant'] = stock.quantite_actuelle

        # Calculer la nouvelle quantité selon le type de mouvement
        if validated_data['type_mouvement'] in ['ENTREE', 'RETOUR']:
            nouvelle_quantite = stock.quantite_actuelle + validated_data['quantite']
        elif validated_data['type_mouvement'] in ['SORTIE', 'PERTE']:
            nouvelle_quantite = stock.quantite_actuelle - validated_data['quantite']
        else:  # AJUSTEMENT
            nouvelle_quantite = validated_data['quantite']  # Quantité absolue

        validated_data['quantite_apres'] = nouvelle_quantite

        # Créer le mouvement
        mouvement = MouvementStock.objects.create(**validated_data)

        return mouvement


class TypePapierSerializer(serializers.ModelSerializer):
    """Serializer pour les types de papier dynamiques"""

    class Meta:
        model = TypePapier
        fields = [
            'id', 'nom', 'code', 'prix_unitaire', 'description',
            'actif', 'date_creation', 'date_modification'
        ]
        read_only_fields = ['date_creation', 'date_modification']

class LigneDeVenteSerializer(serializers.ModelSerializer):
    tarif_service_nom = serializers.CharField(source='tarif_service.nom_service', read_only=True)

    class Meta:
        model = LigneDeVente
        fields = ['id', 'tarif_service', 'tarif_service_nom', 'quantite', 'prix_unitaire', 'montant_total', 'description', 'usage_interne']

class VenteGroupeeSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer(read_only=True)
    lignes = LigneDeVenteSerializer(many=True, read_only=True)

    class Meta:
        model = VenteGroupee
        fields = ['id', 'transaction', 'client_nom', 'commentaire', 'date_creation', 'lignes']

class LigneDeVenteCreateSerializer(serializers.Serializer):
    tarif_service_id = serializers.IntegerField()
    quantite = serializers.DecimalField(max_digits=10, decimal_places=2)
    prix_unitaire = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)
    description = serializers.CharField(max_length=255, required=False, allow_blank=True)
    usage_interne = serializers.BooleanField(default=False)

class VenteGroupeeCreateSerializer(serializers.Serializer):
    client_nom = serializers.CharField(max_length=100, required=False, allow_blank=True)
    commentaire = serializers.CharField(required=False, allow_blank=True)
    lignes = LigneDeVenteCreateSerializer(many=True)

    @staticmethod
    def validate_lignes(lignes_data):
        for i, ligne_data in enumerate(lignes_data):
            try:
                tarif_service = TarifService.objects.prefetch_related('consommationservice_set__produit__stock').get(id=ligne_data['tarif_service_id'])
                for consommation in tarif_service.consommationservice_set.all():
                    stock = consommation.produit.stock
                    quantite_necessaire = consommation.quantite * ligne_data['quantite']
                    if stock.quantite_actuelle < quantite_necessaire:
                        raise serializers.ValidationError(f"Stock insuffisant pour '{consommation.produit.designation}' utilisé dans le service '{tarif_service.nom_service}'. Disponible: {stock.quantite_actuelle}, nécessaire: {quantite_necessaire}.")
            except TarifService.DoesNotExist:
                 raise serializers.ValidationError(f"Le service avec l'ID {ligne_data['tarif_service_id']} n'existe pas.")
        return lignes_data

    def create(self, validated_data):
        lignes_data = validated_data.pop('lignes')
        montant_total = 0
        description_transaction = "Vente groupée: "
        
        lignes_a_creer = []
        for ligne_data in lignes_data:
            tarif_service = TarifService.objects.get(id=ligne_data['tarif_service_id'])
            usage_interne = ligne_data.get('usage_interne', False)
            
            if usage_interne:
                prix_unitaire = 0
                description_transaction += f"[INTERNE] {tarif_service.nom_service} x{ligne_data['quantite']}, "
            else:
                prix_unitaire = ligne_data.get('prix_unitaire', tarif_service.prix_unitaire)
                description_transaction += f"{tarif_service.nom_service} x{ligne_data['quantite']}, "

            quantite = ligne_data['quantite']
            montant_ligne = quantite * prix_unitaire
            montant_total += montant_ligne
            
            ligne_obj = LigneDeVente(
                tarif_service=tarif_service,
                quantite=quantite,
                prix_unitaire=prix_unitaire,
                montant_total=montant_ligne,
                description=ligne_data.get('description', ''),
                usage_interne=usage_interne
            )
            lignes_a_creer.append(ligne_obj)

        transaction = Transaction.objects.create(
            type_transaction='RECETTE',
            montant=montant_total,
            description=description_transaction.strip(', '),
            utilisateur=self.context['request'].user
        )

        vente_groupee = VenteGroupee.objects.create(
            transaction=transaction,
            **validated_data
        )
        
        for ligne in lignes_a_creer:
            ligne.vente = vente_groupee
            ligne.save()
            
            # Décrémenter le stock pour chaque produit consommé
            for consommation in ligne.tarif_service.consommationservice_set.all():
                stock = consommation.produit.stock
                quantite_a_deduire = consommation.quantite * ligne.quantite
                
                quantite_avant_mouvement = stock.quantite_actuelle
                stock.quantite_actuelle -= quantite_a_deduire
                stock.save()

                MouvementStock.objects.create(
                    stock=stock,
                    type_mouvement='SORTIE',
                    motif='UTILISATION_SERVICE',
                    quantite=quantite_a_deduire,
                    quantite_avant=quantite_avant_mouvement,
                    quantite_apres=stock.quantite_actuelle,
                    prix_unitaire=ligne.prix_unitaire,
                    transaction=transaction,
                    utilisateur=self.context['request'].user,
                    commentaire=f"Consommé par service: {ligne.tarif_service.nom_service} (Vente #{vente_groupee.id})"
                )

        return vente_groupee
