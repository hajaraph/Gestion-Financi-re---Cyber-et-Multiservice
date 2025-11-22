from django.contrib.auth.models import User
from rest_framework import serializers
from .models import (
    CategorieService, Transaction,
    RecetteInternet, RecetteMultiservice, Depense, TypePapier,
    TarifService, VenteProduit, ServicePersonnalise, PalierRemise,
    Permission, Role, ProfilUtilisateur, Stock, MouvementStock, Produit, CategorieProduit, UniteMesure
)


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


class RecetteInternetSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer()
    type_forfait_display = serializers.CharField(source='get_type_forfait_display', read_only=True)

    class Meta:
        model = RecetteInternet
        fields = [
            'id', 'transaction', 'type_forfait', 'type_forfait_display',
            'duree_minutes', 'poste_utilise'
        ]

    def create(self, validated_data):
        transaction_data = validated_data.pop('transaction')
        transaction_data['type_transaction'] = 'RECETTE'
        transaction = Transaction.objects.create(**transaction_data)
        recette_internet = RecetteInternet.objects.create(
            transaction=transaction,
            **validated_data
        )
        return recette_internet


class RecetteMultiserviceSerializer(serializers.ModelSerializer):
    transaction = TransactionSerializer()
    type_service_display = serializers.CharField(source='get_type_service_display', read_only=True)
    type_papier_nom = serializers.CharField(source='type_papier.nom', read_only=True)
    type_papier_prix = serializers.DecimalField(source='type_papier.prix_unitaire', max_digits=6, decimal_places=2,
                                                read_only=True)
    type_papier = serializers.PrimaryKeyRelatedField(queryset=TypePapier.objects.all(), allow_null=True, required=False)

    class Meta:
        model = RecetteMultiservice
        fields = [
            'id', 'transaction', 'type_service', 'type_service_display',
            'quantite', 'prix_unitaire', 'type_papier', 'type_papier_nom', 'type_papier_prix',
            'papier_personnalise', 'details'
        ]

    def create(self, validated_data):
        transaction_data = validated_data.pop('transaction')
        transaction_data['type_transaction'] = 'RECETTE'
        transaction = Transaction.objects.create(**transaction_data)
        recette_multiservice = RecetteMultiservice.objects.create(
            transaction=transaction,
            **validated_data
        )
        return recette_multiservice


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


# Serializers simplifiés pour les créations rapides
class RecetteInternetCreateSerializer(serializers.ModelSerializer):
    montant = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField(max_length=255)
    categorie_service = serializers.PrimaryKeyRelatedField(
        queryset=CategorieService.objects.all(),
        required=False,
        allow_null=True
    )

    class Meta:
        model = RecetteInternet
        fields = [
            'type_forfait', 'duree_minutes', 'poste_utilise',
            'montant', 'description', 'categorie_service'
        ]

    def create(self, validated_data):
        # Extraire les données de transaction
        transaction_data = {
            'type_transaction': 'RECETTE',
            'montant': validated_data.pop('montant'),
            'description': validated_data.pop('description'),
            'categorie_service': validated_data.pop('categorie_service', None)
        }

        # Créer la transaction
        transaction = Transaction.objects.create(**transaction_data)

        # Créer la recette internet
        recette_internet = RecetteInternet.objects.create(
            transaction=transaction,
            **validated_data
        )
        return recette_internet


class DepenseCreateSerializer(serializers.ModelSerializer):
    montant = serializers.DecimalField(max_digits=10, decimal_places=2)
    description = serializers.CharField(max_length=255)

    class Meta:
        model = Depense
        fields = [
            'categorie_depense', 'fournisseur', 'numero_facture',
            'date_echeance', 'montant', 'description'
        ]

    def create(self, validated_data):
        # Extraire les données de transaction
        transaction_data = {
            'type_transaction': 'DEPENSE',
            'montant': validated_data.pop('montant'),
            'description': validated_data.pop('description')
        }

        # Créer la transaction
        transaction = Transaction.objects.create(**transaction_data)

        # Créer la dépense
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


class TarifServiceSerializer(serializers.ModelSerializer):
    categorie_display = serializers.CharField(source='get_categorie_display', read_only=True)
    type_papier_display = serializers.CharField(source='get_type_papier_display', read_only=True)
    paliers_remise = PalierRemiseSerializer(many=True, read_only=True)
    nombre_paliers = serializers.SerializerMethodField()

    class Meta:
        model = TarifService
        fields = [
            'id', 'nom_service', 'categorie', 'categorie_display', 'prix_unitaire',
            'unite_mesure', 'type_papier', 'type_papier_display', 'description', 'actif', 'code_service',
            'date_creation', 'date_modification', 'paliers_remise', 'nombre_paliers'
        ]
        read_only_fields = ['code_service']

    @staticmethod
    def get_nombre_paliers(obj):
        return obj.paliers_remise.filter(actif=True).count()


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


class RecetteMultiserviceCreateSerializer(serializers.ModelSerializer):
    """
    Sérialiseur pour la création d'une recette multiservice (impression, photocopie, etc.)
    Gère la création de la transaction associée et la mise à jour du stock si nécessaire.
    """
    montant_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    description = serializers.CharField(max_length=255, required=False)
    utiliser_tarif_defaut = serializers.BooleanField(default=True, write_only=True)

    # Champs spécifiques pour impression/photocopie
    type_papier = serializers.PrimaryKeyRelatedField(
        queryset=TypePapier.objects.all(),
        required=False,
        allow_null=True,
        help_text="Type de papier utilisé (requis pour impression/photocopie)"
    )
    papier_personnalise = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Détail du papier si 'Autre type' est sélectionné"
    )

    class Meta:
        model = RecetteMultiservice
        fields = [
            'type_service', 'quantite', 'prix_unitaire', 'details',
            'type_papier', 'papier_personnalise',
            'montant_total', 'description', 'utiliser_tarif_defaut'
        ]
        extra_kwargs = {
            'prix_unitaire': {'required': True},
            'quantite': {'min_value': 1}
        }

    def validate(self, data):
        """
        Validation personnalisée pour la recette multiservice.
        Vérifie les champs requis selon le type de service.
        """
        type_service = data.get('type_service')
        type_papier = data.get('type_papier')

        # Pour les services d'impression et photocopie, le type de papier est requis
        if type_service in ['IMPRESSION', 'PHOTOCOPIE'] and not type_papier:
            raise serializers.ValidationError({
                'type_papier': "Ce champ est requis pour les services d'impression et photocopie"
            })

        # Si aucun type_papier mais papier_personnalise fourni, ok. Sinon, si type_papier est None pour impression/photocopie, déjà géré.
        # Si un type_papier est fourni, papier_personnalise est ignoré.

        return data

    def create(self, validated_data):
        """
        Crée une recette multiservice avec la transaction associée.
        La mise à jour du stock est gérée par la méthode save() du modèle RecetteMultiservice.
        """
        validated_data.pop('verifier_stock', True)
        validated_data.pop('forcer_creation', False)

        # Récupérer l'utilisateur de la requête
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None

        # Créer la transaction
        description = f"{validated_data['type_service']} x{validated_data['quantite']}"
        type_papier_obj = validated_data.get('type_papier')

        prix_unitaire = validated_data.get('prix_unitaire', 0)  # Use prix_unitaire from validated_data if provided
        if type_papier_obj and prix_unitaire == 0:  # Fallback to type_papier's price if not provided in validated_data
            prix_unitaire = type_papier_obj.prix_unitaire

        if type_papier_obj:
            description += f" - {type_papier_obj.nom}"

        montant_total = validated_data['quantite'] * prix_unitaire

        transaction = Transaction.objects.create(
            type_transaction='RECETTE',
            montant=montant_total,
            description=description,
            utilisateur=user,  # Assign user to transaction
            categorie_service=CategorieService.objects.get_or_create(
                nom='MULTISERVICE',
                defaults={'description': 'Services multiservices (impression, photocopie, etc.)'}
            )[0]
        )

        # Créer la recette multiservice
        validated_data[
            'prix_unitaire'] = prix_unitaire  # Ensure prix_unitaire is in validated_data for RecetteMultiservice.create
        recette = RecetteMultiservice.objects.create(
            transaction=transaction,
            **validated_data
        )

        # Le mouvement de stock est géré par la méthode save() du modèle RecetteMultiservice

        return recette


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
            'details_supplementaires'
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
            'prix_unitaire_final'
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

        # Générer description automatique si non fournie
        description = validated_data.pop('description', '')
        if not description:
            description = f"{tarif_service.nom_service} x{validated_data['quantite']} {tarif_service.unite_mesure}"

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

        # Description
        description = validated_data.get('description_personnalisee',
                                         f"{tarif_service.nom_service} x{quantite} {tarif_service.unite_mesure}")

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
            'description': description
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
    role_nom = serializers.CharField(source='role.nom', read_only=True)
    permissions_effectives = serializers.SerializerMethodField()
    peut_travailler = serializers.ReadOnlyField(source='peut_travailler_maintenant')

    class Meta:
        model = ProfilUtilisateur
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
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
    # unite_achat_nom = serializers.CharField(source='unite_achat.nom', read_only=True) # Removed as unite_achat is not in the model

    categorie = serializers.PrimaryKeyRelatedField(queryset=CategorieProduit.objects.all(), allow_null=True)
    unite_mesure = serializers.PrimaryKeyRelatedField(queryset=UniteMesure.objects.all())
    # unite_achat = serializers.PrimaryKeyRelatedField(queryset=UniteMesure.objects.all(), allow_null=True) # Removed as unite_achat is not in the model

    # Ajout du sérialiseur de stock
    stock = serializers.SerializerMethodField()

    class Meta:
        model = Produit
        fields = [
            'id', 'designation', 'reference', 'description', 'actif',
            'categorie', 'categorie_nom', 'prix_vente', 'marge_minimale',
            'unite_mesure', 'unite_mesure_nom', 'unite_mesure_symbole',
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


class RecetteMultiserviceAvecStockSerializer(serializers.ModelSerializer):
    """Serializer spécialisé pour les recettes multiservice avec gestion automatique du stock"""
    verifier_stock = serializers.BooleanField(default=True, write_only=True)
    forcer_creation = serializers.BooleanField(default=False, write_only=True)

    class Meta:
        model = RecetteMultiservice
        fields = [
            'type_service', 'quantite', 'type_papier', 'details',
            'verifier_stock', 'forcer_creation'
        ]

    def validate(self, data):
        # Vérifier le stock si c'est une impression/photocopie
        if data['type_service'] in ['IMPRESSION', 'PHOTOCOPIE'] and data.get('verifier_stock', True):
            type_papier = data.get('type_papier')
            quantite = data.get('quantite', 0)

            if type_papier and type_papier.produit_associe and hasattr(type_papier.produit_associe, 'stock'):
                stock = type_papier.produit_associe.stock
                if stock.quantite_actuelle < quantite and not data.get('forcer_creation', False):
                    raise serializers.ValidationError({
                        'stock': f'Stock insuffisant pour {type_papier.nom}. '
                                 f'Disponible: {stock.quantite_actuelle} {stock.produit.unite_mesure.symbole}, '
                                 f'Demandé: {quantite} {stock.produit.unite_mesure.symbole}'
                    })
            elif type_papier and data['type_service'] in ['IMPRESSION',
                                                          'PHOTOCOPIE'] and not type_papier.produit_associe:
                raise serializers.ValidationError({
                    'type_papier': f"Le type de papier '{type_papier.nom}' n'a pas de produit associé pour la gestion de stock."
                })

        return data

    def create(self, validated_data):
        """
        Crée une recette multiservice avec la transaction associée.
        La mise à jour du stock est gérée par la méthode save() du modèle RecetteMultiservice.
        """
        validated_data.pop('verifier_stock', True)
        validated_data.pop('forcer_creation', False)

        # Récupérer l'utilisateur de la requête
        request = self.context.get('request')
        user = request.user if request and hasattr(request, 'user') else None

        # Créer la transaction
        description = f"{validated_data['type_service']} x{validated_data['quantite']}"
        type_papier_obj = validated_data.get('type_papier')

        prix_unitaire = validated_data.get('prix_unitaire', 0)  # Use prix_unitaire from validated_data if provided
        if type_papier_obj and prix_unitaire == 0:  # Fallback to type_papier's price if not provided in validated_data
            prix_unitaire = type_papier_obj.prix_unitaire

        if type_papier_obj:
            description += f" - {type_papier_obj.nom}"

        montant_total = validated_data['quantite'] * prix_unitaire

        transaction = Transaction.objects.create(
            type_transaction='RECETTE',
            montant=montant_total,
            description=description,
            utilisateur=user,  # Assign user to transaction
            categorie_service=CategorieService.objects.get_or_create(
                nom='MULTISERVICE',
                defaults={'description': 'Services multiservices (impression, photocopie, etc.)'}
            )[0]
        )

        # Créer la recette multiservice
        validated_data[
            'prix_unitaire'] = prix_unitaire  # Ensure prix_unitaire is in validated_data for RecetteMultiservice.create
        recette = RecetteMultiservice.objects.create(
            transaction=transaction,
            **validated_data
        )

        # Le mouvement de stock est géré par la méthode save() du modèle RecetteMultiservice

        return recette


class TypePapierSerializer(serializers.ModelSerializer):
    """Serializer pour les types de papier dynamiques"""

    class Meta:
        model = TypePapier
        fields = [
            'id', 'nom', 'code', 'prix_unitaire', 'description',
            'actif', 'date_creation', 'date_modification'
        ]
        read_only_fields = ['date_creation', 'date_modification']