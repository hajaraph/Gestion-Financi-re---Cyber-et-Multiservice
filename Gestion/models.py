from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone
from simple_history.models import HistoricalRecords
import uuid

# Create your models here.

class ParametreEntreprise(models.Model):
    """
    Modèle pour stocker les paramètres généraux de l'entreprise.
    Conçu comme un singleton pour n'avoir qu'une seule instance.
    """
    nom_entreprise = models.CharField(max_length=255, default="Mon Cyber")
    address = models.CharField(max_length=255, blank=True)
    contact = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    logo = models.ImageField(upload_to='company_logos/', blank=True, null=True)
    default_currency = models.CharField(max_length=10, default="Ar", help_text="Devise par défaut (ex: Ar, EUR, USD)")
    default_stock_alert_threshold = models.DecimalField(
        max_digits=10, decimal_places=2, default=5,
        help_text="Seuil d'alerte de stock par défaut pour les nouveaux produits"
    )
    # Ajoutez d'autres paramètres généraux ici si nécessaire

    class Meta:
        verbose_name = "Paramètres de l'entreprise"
        verbose_name_plural = "Paramètres de l'entreprise"

    def __str__(self):
        return f"Paramètres de {self.nom_entreprise}"

    def save(self, *args, **kwargs):
        # Assure qu'il n'y a qu'une seule instance de ce modèle
        if ParametreEntreprise.objects.exists() and not self.pk:
            raise ValidationError("Il ne peut y avoir qu'une seule instance de ParametreEntreprise.")
        super().save(*args, **kwargs)

    @classmethod
    def load(cls):
        """Charge l'instance unique de CompanySettings, ou en crée une si elle n'existe pas."""
        if not cls.objects.exists():
            cls.objects.create()
        return cls.objects.get()


class CategorieService(models.Model):
    """Catégories de services du cyber (Internet, Multiservice, etc.)"""
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)

    def __str__(self):
        return self.nom

    class Meta:
        verbose_name = "Catégorie de service"
        verbose_name_plural = "Catégories de services"

class Transaction(models.Model):
    """Modèle principal pour toutes les transactions financières"""
    TYPE_CHOICES = [
        ('RECETTE', 'Recette'),
        ('DEPENSE', 'Dépense'),
    ]

    # Informations de base
    type_transaction = models.CharField(max_length=10, choices=TYPE_CHOICES)
    montant = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    description = models.TextField()
    date_transaction = models.DateTimeField(default=timezone.now)

    # Relations
    categorie_service = models.ForeignKey(
        CategorieService,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )
    utilisateur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='transactions'
    )

    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    # Historisation
    history = HistoricalRecords()

    def __str__(self):
        return f"{self.get_type_transaction_display()} - {self.montant} Ar - {self.date_transaction.strftime('%d/%m/%Y')}"

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ['-date_transaction']


class Depense(models.Model):
    """Modèle pour les dépenses du cyber"""
    CATEGORIES_DEPENSE = [
        ('ELECTRICITE', 'Électricité'),
        ('INTERNET', 'Connexion Internet'),
        ('MAINTENANCE', 'Maintenance équipements'),
        ('FOURNITURES', 'Fournitures de bureau'),
        ('SALAIRE', 'Salaires'),
        ('LOYER', 'Loyer'),
        ('AUTRE', 'Autre dépense'),
    ]

    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='depense'
    )
    categorie_depense = models.CharField(max_length=15, choices=CATEGORIES_DEPENSE)
    fournisseur = models.CharField(max_length=100, blank=True)
    numero_facture = models.CharField(max_length=50, blank=True)
    date_echeance = models.DateField(null=True, blank=True)

    def __str__(self):
        return f"Dépense {self.get_categorie_depense_display()} - {self.transaction.montant} FCFA"

    class Meta:
        verbose_name = "Dépense"
        verbose_name_plural = "Dépenses"


class TarifService(models.Model):
    """Modèle pour gérer les tarifs de chaque service de manière flexible"""
    CATEGORIES_SERVICE = [
        ('INTERNET', 'Services Internet'),
        ('MULTISERVICE', 'Multiservices'),
        ('VENTE', 'Vente de produits'),
        ('AUTRE', 'Autres services'),
    ]

    # Informations principales
    nom_service = models.CharField(max_length=100, unique=True, help_text="Nom unique du service")
    categorie = models.CharField(max_length=15, choices=CATEGORIES_SERVICE)
    prix_unitaire = models.DecimalField(max_digits=8, decimal_places=2, help_text="Prix en Ariary")
    unite_mesure = models.CharField(
        max_length=50,
        default='unité',
        help_text="Unité de mesure (page, heure, pièce, etc.)"
    )
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    code_service = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        help_text="Code unique pour identifier le service"
    )
    produits_consommes = models.ManyToManyField(
        'Produit',
        through='ConsommationService',
        related_name='services_consommateurs',
        blank=True
    )

    # Historisation
    history = HistoricalRecords()

    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        # Générer automatiquement un code si non fourni
        if not self.code_service:
            # Créer un code basé sur le nom du service
            import re
            code_base = re.sub(r'[^a-zA-Z0-9]', '_', self.nom_service.upper())
            self.code_service = code_base[:20]

            # S'assurer que le code est unique
            counter = 1
            original_code = self.code_service
            while TarifService.objects.filter(code_service=self.code_service).exists():
                self.code_service = f"{original_code}_{counter}"
                counter += 1

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nom_service} - {self.prix_unitaire} Ar/{self.unite_mesure}"

    class Meta:
        verbose_name = "Tarif de service"
        verbose_name_plural = "Tarifs des services"
        ordering = ['categorie', 'nom_service']


class ConsommationService(models.Model):
    """Table intermédiaire pour lier un service aux produits qu'il consomme."""
    tarif_service = models.ForeignKey(TarifService, on_delete=models.CASCADE)
    produit = models.ForeignKey('Produit', on_delete=models.CASCADE)
    quantite = models.DecimalField(max_digits=10, decimal_places=4, help_text="Quantité de produit consommée pour UNE unité du service.")

    class Meta:
        unique_together = ('tarif_service', 'produit')
        verbose_name = "Consommation de produit par service"
        verbose_name_plural = "Consommations de produits par service"


class PalierRemise(models.Model):
    """Modèle pour gérer les paliers de remise selon la quantité"""
    tarif_service = models.ForeignKey(
        TarifService,
        on_delete=models.CASCADE,
        related_name='paliers_remise'
    )
    quantite_minimum = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Quantité minimum pour bénéficier de cette remise"
    )
    type_remise = models.CharField(
        max_length=15,
        choices=[
            ('POURCENTAGE', 'Pourcentage'),
            ('MONTANT_FIXE', 'Montant fixe'),
            ('PRIX_UNITAIRE', 'Nouveau prix unitaire')
        ],
        default='POURCENTAGE'
    )
    valeur_remise = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Valeur de la remise (%, montant ou nouveau prix)"
    )
    description = models.CharField(
        max_length=200,
        blank=True,
        help_text="Description de l'offre (ex: 'Remise volume pour impression')"
    )
    actif = models.BooleanField(default=True)
    date_debut = models.DateField(null=True, blank=True)
    date_fin = models.DateField(null=True, blank=True)

    def calculer_prix_unitaire(self, prix_original):
        """Calcule le nouveau prix unitaire avec la remise"""
        if self.type_remise == 'POURCENTAGE':
            return prix_original * (1 - self.valeur_remise / 100)
        elif self.type_remise == 'MONTANT_FIXE':
            return max(0, prix_original - self.valeur_remise)
        elif self.type_remise == 'PRIX_UNITAIRE':
            return self.valeur_remise
        return prix_original

    def est_valide(self):
        """Vérifie si la remise est valide selon les dates"""
        from django.utils import timezone
        aujourd_hui = timezone.now().date()

        if self.date_debut and aujourd_hui < self.date_debut:
            return False
        if self.date_fin and aujourd_hui > self.date_fin:
            return False
        return self.actif

    def __str__(self):
        if self.type_remise == 'POURCENTAGE':
            remise_str = f"{self.valeur_remise}%"
        elif self.type_remise == 'MONTANT_FIXE':
            remise_str = f"-{self.valeur_remise} Ar"
        else:
            remise_str = f"{self.valeur_remise} Ar/unité"

        return f"{self.tarif_service.nom_service} - {self.quantite_minimum}+ : {remise_str}"

    class Meta:
        verbose_name = "Palier de remise"
        verbose_name_plural = "Paliers de remise"
        ordering = ['tarif_service', 'quantite_minimum']
        unique_together = ['tarif_service', 'quantite_minimum']


class ServicePersonnalise(models.Model):
    """Modèle pour gérer les services personnalisés avec tarification flexible"""
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='service_personnalise'
    )
    tarif_service = models.ForeignKey(
        TarifService,
        on_delete=models.PROTECT,
        related_name='utilisations',
        help_text="Service utilisé"
    )
    quantite = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=1,
        help_text="Quantité ou durée du service"
    )
    prix_unitaire_original = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Prix unitaire original du tarif"
    )
    prix_unitaire_utilise = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Prix unitaire utilisé après remises"
    )
    remise_appliquee = models.ForeignKey(
        PalierRemise,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='utilisations',
        help_text="Remise appliquée si applicable"
    )
    details_supplementaires = models.TextField(
        blank=True,
        help_text="Détails spécifiques à cette utilisation du service"
    )
    usage_interne = models.BooleanField(
        default=False,
        help_text="Cochez si ce service est pour un usage interne (pas de recette, mais déstockage)"
    )

    def save(self, *args, **kwargs):
        # Stocker le prix original
        if not self.prix_unitaire_original:
            self.prix_unitaire_original = self.tarif_service.prix_unitaire

        # Si usage interne, le prix utilisé est 0
        if self.usage_interne:
            self.prix_unitaire_utilise = 0
            self.remise_appliquee = None
        # Sinon, calculer la remise applicable
        elif not self.prix_unitaire_utilise or self.prix_unitaire_utilise == self.prix_unitaire_original:
            prix_avec_remise, remise_appliquee = self.calculer_prix_avec_remise()
            self.prix_unitaire_utilise = prix_avec_remise
            self.remise_appliquee = remise_appliquee

        # Calculer et mettre à jour le montant de la transaction
        montant_total = self.quantite * self.prix_unitaire_utilise
        self.transaction.montant = montant_total
        
        # Si usage interne, on peut changer le type de transaction ou ajouter une note
        if self.usage_interne:
            self.transaction.description = f"[USAGE INTERNE] {self.transaction.description}"
            
        self.transaction.save()

        super().save(*args, **kwargs)

    def calculer_prix_avec_remise(self):
        """Calcule le prix avec la meilleure remise applicable"""
        remises_valides = self.tarif_service.paliers_remise.filter(
            quantite_minimum__lte=self.quantite,
            actif=True
        ).order_by('-quantite_minimum')

        for remise in remises_valides:
            if remise.est_valide():
                prix_avec_remise = remise.calculer_prix_unitaire(self.prix_unitaire_original)
                return prix_avec_remise, remise

        return self.prix_unitaire_original, None

    @property
    def montant_total(self):
        return self.quantite * self.prix_unitaire_utilise

    @property
    def montant_remise(self):
        """Montant total de la remise"""
        if self.remise_appliquee:
            economie_unitaire = self.prix_unitaire_original - self.prix_unitaire_utilise
            return economie_unitaire * self.quantite
        return 0

    @property
    def pourcentage_remise(self):
        """Pourcentage de remise obtenu"""
        if self.prix_unitaire_original > 0:
            return ((self.prix_unitaire_original - self.prix_unitaire_utilise) / self.prix_unitaire_original) * 100
        return 0

    def __str__(self):
        remise_str = f" (remise: {self.pourcentage_remise:.1f}%)" if self.remise_appliquee else ""
        usage_str = " [INTERNE]" if self.usage_interne else ""
        return f"{self.tarif_service.nom_service} x{self.quantite} - {self.montant_total} Ar{remise_str}{usage_str}"

    class Meta:
        verbose_name = "Service personnalisé"
        verbose_name_plural = "Services personnalisés"


class Permission(models.Model):
    """Modèle pour gérer les permissions personnalisées"""
    ACTIONS = [
        # Gestion des transactions
        ('view_transaction', 'Voir les transactions'),
        ('add_transaction', 'Ajouter des transactions'),
        ('change_transaction', 'Modifier les transactions'),
        ('delete_transaction', 'Supprimer les transactions'),

        # Gestion des recettes
        ('view_recette', 'Voir les recettes'),
        ('add_recette', 'Ajouter des recettes'),
        ('change_recette', 'Modifier les recettes'),
        ('delete_recette', 'Supprimer les recettes'),

        # Gestion des dépenses
        ('view_depense', 'Voir les dépenses'),
        ('add_depense', 'Ajouter des dépenses'),
        ('change_depense', 'Modifier les dépenses'),
        ('delete_depense', 'Supprimer les dépenses'),

        # Gestion des tarifs
        ('view_tarif', 'Voir les tarifs'),
        ('change_tarif', 'Modifier les tarifs'),
        ('manage_remise', 'Gérer les remises'),

        # Gestion des produits et stocks
        ('view_produit', 'Voir les produits et stocks'),
        ('manage_produits', 'Gérer les produits (créer, modifier, supprimer)'),
        ('manage_stock', 'Gérer les stocks (mouvements, ajustements)'),

        # Rapports et statistiques
        ('view_rapport_journalier', 'Voir rapport journalier'),
        ('view_rapport_mensuel', 'Voir rapport mensuel'),
        ('view_statistiques', 'Voir les statistiques'),
        ('export_data', 'Exporter les données'),

        # Administration
        ('manage_users', 'Gérer les utilisateurs'),
        ('manage_permissions', 'Gérer les permissions'),
        ('manage_system', 'Gérer le système'),
    ]

    code_permission = models.CharField(max_length=50, choices=ACTIONS, unique=True)
    nom = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    module = models.CharField(max_length=50, help_text="Module concerné (transaction, recette, etc.)")
    actif = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.nom} ({self.code_permission})"

    class Meta:
        verbose_name = "Permission"
        verbose_name_plural = "Permissions"
        ordering = ['module', 'code_permission']


class Role(models.Model):
    """Modèle pour définir des rôles avec ensemble de permissions"""
    ROLES_PREDEFINIS = [
        ('ADMIN', 'Administrateur'),
        ('MANAGER', 'Gestionnaire'),
        ('CAISSIER', 'Caissier'),
        ('OPERATEUR', 'Opérateur'),
        ('LECTEUR', 'Lecteur seul'),
    ]

    nom = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    permissions = models.ManyToManyField(Permission, related_name='roles', blank=True)
    actif = models.BooleanField(default=True)
    couleur = models.CharField(max_length=7, default='#007bff', help_text="Couleur hexadécimale pour l'interface")

    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.nom

    @property
    def nombre_permissions(self):
        return self.permissions.filter(actif=True).count()

    class Meta:
        verbose_name = "Rôle"
        verbose_name_plural = "Rôles"
        ordering = ['nom']


class ProfilUtilisateur(models.Model):
    """Extension du modèle User avec permissions personnalisées"""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profil')
    role = models.ForeignKey(Role, on_delete=models.SET_NULL, null=True, blank=True)
    permissions_supplementaires = models.ManyToManyField(
        Permission,
        related_name='utilisateurs_supplementaires',
        blank=True,
        help_text="Permissions en plus de celles du rôle"
    )
    permissions_refusees = models.ManyToManyField(
        Permission,
        related_name='utilisateurs_refuses',
        blank=True,
        help_text="Permissions explicitement refusées même si dans le rôle"
    )

    # Informations complémentaires
    telephone = models.CharField(max_length=20, blank=True)
    poste = models.CharField(max_length=100, blank=True)
    actif = models.BooleanField(default=True)

    # Restrictions temporelles
    heure_debut_travail = models.TimeField(null=True, blank=True)
    heure_fin_travail = models.TimeField(null=True, blank=True)
    jours_travail = models.CharField(
        max_length=20,
        default='1,2,3,4,5,6,7',
        help_text="Jours de la semaine (1=Lundi, 7=Dimanche) séparés par des virgules"
    )

    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    derniere_connexion = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.role.nom if self.role else 'Sans rôle'}"

    def clean(self):
        """Valide le format de jours_travail (nombres 1..7 séparés par des virgules)."""
        jours_str = self.jours_travail or ''
        try:
            jours = [int(j) for j in jours_str.split(',') if j.strip()]
        except ValueError:
            raise ValidationError({
                'error': "Format invalide. Utilisez des nombres 1 à 7 séparés par des virgules (ex: '1,2,3,4,5')."
            })

        if not jours:
            raise ValidationError({'error': "Veuillez indiquer au moins un jour de travail."})

        if not all(1 <= j <= 7 for j in jours):
            raise ValidationError({'jours_travail': "Les jours de travail doivent être compris entre 1 et 7."})

    def save(self, *args, **kwargs):
        # Valider avant sauvegarde pour attraper les erreurs utilisateur
        self.full_clean()
        super().save(*args, **kwargs)

    def a_permission(self, code_permission):
        """Vérifie si l'utilisateur a une permission spécifique"""
        # Vérifier si la permission est explicitement refusée
        if self.permissions_refusees.filter(code_permission=code_permission, actif=True).exists():
            return False

        # Vérifier les permissions supplémentaires
        if self.permissions_supplementaires.filter(code_permission=code_permission, actif=True).exists():
            return True

        # Vérifier les permissions du rôle
        if self.role and self.role.permissions.filter(code_permission=code_permission, actif=True).exists():
            return True

        return False

    def obtenir_toutes_permissions(self):
        """Retourne toutes les permissions effectives de l'utilisateur"""
        permissions = set()

        # Permissions du rôle
        if self.role:
            role_permissions = self.role.permissions.filter(actif=True).values_list('code_permission', flat=True)
            permissions.update(role_permissions)

        # Permissions supplémentaires
        supp_permissions = self.permissions_supplementaires.filter(actif=True).values_list('code_permission', flat=True)
        permissions.update(supp_permissions)

        # Retirer les permissions refusées
        permissions_refusees = self.permissions_refusees.filter(actif=True).values_list('code_permission', flat=True)
        permissions -= set(permissions_refusees)

        return list(permissions)

    def peut_travailler_maintenant(self):
        """Vérifie si l'utilisateur peut travailler à l'heure actuelle"""
        from django.utils import timezone

        maintenant = timezone.now()
        jour_semaine = maintenant.weekday() + 1  # Django: 0=Lundi, Python: 1=Lundi

        # Vérifier le jour de travail
        jours_autorises = [int(j) for j in self.jours_travail.split(',') if j.strip()]
        if jour_semaine not in jours_autorises:
            return False

        # Vérifier les heures de travail
        if self.heure_debut_travail and self.heure_fin_travail:
            heure_actuelle = maintenant.time()
            if not (self.heure_debut_travail <= heure_actuelle <= self.heure_fin_travail):
                return False

        return True

    class Meta:
        verbose_name = "Profil utilisateur"
        verbose_name_plural = "Profils utilisateurs"

@receiver(post_save, sender=User)
def creer_profil_utilisateur(sender, instance, created, **kwargs):
    """Créer automatiquement un profil utilisateur lors de la création d'un User"""
    if created:
        ProfilUtilisateur.objects.create(user=instance)

@receiver(post_save, sender=User)
def sauvegarder_profil_utilisateur(sender, instance, **kwargs):
    """Sauvegarder le profil utilisateur"""
    if hasattr(instance, 'profil'):
        instance.profil.save()


class CategorieProduit(models.Model):
    """Catégorie pour classer les produits (Papier, Fournitures, etc.)"""
    nom = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Catégorie de produit"
        verbose_name_plural = "Catégories de produits"
        ordering = ['nom']

    def __str__(self):
        return self.nom


class UniteMesure(models.Model):
    """Unités de mesure pour les produits (kg, l, pièce, rame, etc.)"""
    nom = models.CharField(max_length=20, unique=True)
    symbole = models.CharField(max_length=10)
    description = models.TextField(blank=True)

    class Meta:
        verbose_name = "Unité de mesure"
        verbose_name_plural = "Unités de mesure"

    def __str__(self):
        return f"{self.nom} ({self.symbole})"


class Produit(models.Model):

    # Identification
    designation = models.CharField(max_length=200)
    reference = models.CharField(max_length=50, unique=True, default=uuid.uuid4, editable=False)
    description = models.TextField(blank=True)

    # Catégorisation
    categorie = models.ForeignKey(
        CategorieProduit,
        on_delete=models.SET_NULL,
        null=True,
        related_name='produits',
        verbose_name="Catégorie"
    )
    prix_vente = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Prix de vente unitaire par défaut"
    )
    marge_minimale = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=10,
        help_text="Marge minimale en pourcentage"
    )

    # Unité de base (pour le stock)
    unite_mesure = models.ForeignKey(
        UniteMesure,
        on_delete=models.PROTECT,
        related_name='produits',
        verbose_name="Unité de mesure (stock)",
        help_text="Unité de base pour la gestion du stock (ex: feuille, ml)"
    )

    # Unité d'achat (pour les entrées de stock)
    unite_achat = models.ForeignKey(
        UniteMesure,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='produits_achetes',
        verbose_name="Unité d'achat",
        help_text="Unité utilisée lors de l'achat (ex: rame, bouteille)"
    )
    quantite_par_unite_achat = models.DecimalField(
        max_digits=10, decimal_places=2, default=1,
        help_text="Facteur de conversion (ex: 500 si 1 rame = 500 feuilles)"
    )

    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    actif = models.BooleanField(default=True)

    class Meta:
        verbose_name = "Produit"
        verbose_name_plural = "Produits"
        ordering = ['designation']


class TypePapier(models.Model):
    """Modèle pour gérer dynamiquement les types de papier"""
    nom = models.CharField(max_length=50, unique=True, help_text="Nom du type de papier (ex: A4 N&B, A3 Couleur)")
    code = models.CharField(max_length=20, unique=True, help_text="Code unique (ex: A4_NB, A3_COULEUR)")
    prix_unitaire = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="Prix par page/unité")
    description = models.TextField(blank=True, help_text="Description optionnelle")
    actif = models.BooleanField(default=True, help_text="Type de papier disponible")
    produit_associe = models.ForeignKey(
        'Produit',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='types_papier'
    )

    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom} ({self.prix_unitaire} Ar)"

    class Meta:
        verbose_name = "Type de papier"
        verbose_name_plural = "Types de papier"
        ordering = ['nom']


class Stock(models.Model):
    """Modèle pour gérer les stocks de produits/matières premières"""
    ETAT_STOCK = [
        ('EN_STOCK', 'En stock'),
        ('RUPTURE', 'Rupture de stock'),
        ('COMMANDE', 'En commande'),
        ('LIMITE', 'Stock limité'),
    ]

    produit = models.OneToOneField(
        Produit,
        on_delete=models.CASCADE,
        related_name='stock'
    )

    # Quantités
    quantite_actuelle = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Quantité actuellement en stock (en unité de base)"
    )
    quantite_minimale = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Seuil d'alerte pour réapprovisionnement (en unité de base)"
    )
    quantite_maximale = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Capacité maximale de stockage (en unité de base)"
    )

    # Coût
    prix_achat_moyen = models.DecimalField(
        max_digits=10, decimal_places=2, default=0,
        help_text="Prix d'achat moyen pondéré par unité de base"
    )

    # État
    etat = models.CharField(
        max_length=20,
        choices=ETAT_STOCK,
        default='EN_STOCK',
        help_text="État actuel du stock"
    )

    # Métadonnées
    derniere_mise_a_jour = models.DateTimeField(auto_now=True)
    commentaire = models.TextField(blank=True)

    # Historisation
    history = HistoricalRecords()

    def save(self, *args, **kwargs):
        # Mise à jour automatique de l'état du stock
        if self.quantite_actuelle <= 0:
            self.etat = 'RUPTURE'
        elif self.quantite_actuelle <= self.quantite_minimale:
            self.etat = 'LIMITE'
        else:
            self.etat = 'EN_STOCK'
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Stock de {self.produit.designation}: {self.quantite_actuelle} {self.produit.unite_mesure.symbole}"

    class Meta:
        verbose_name = "Stock"
        verbose_name_plural = "Stocks"
        ordering = ['produit__designation']

class MouvementStock(models.Model):
    """Modèle pour tracer tous les mouvements de stock"""
    TYPE_MOUVEMENT_CHOICES = [
        ('ENTREE', 'Entrée de stock'),
        ('SORTIE', 'Sortie de stock'),
        ('AJUSTEMENT', 'Ajustement d\'inventaire'),
        ('PERTE', 'Perte/Détérioration'),
        ('RETOUR', 'Retour de marchandise'),
    ]

    MOTIF_CHOICES = [
        ('ACHAT', 'Achat de marchandise'),
        ('VENTE', 'Vente/Utilisation'),
        ('IMPRESSION', 'Consommation pour impression'),
        ('PHOTOCOPIE', 'Consommation pour photocopie'),
        ('UTILISATION_SERVICE', 'Utilisation pour un service'),
        ('INVENTAIRE', 'Correction d\'inventaire'),
        ('DETERIORATION', 'Détérioration du produit'),
        ('VOL', 'Vol/Perte'),
        ('RETOUR_CLIENT', 'Retour client'),
        ('RETOUR_FOURNISSEUR', 'Retour fournisseur'),
        ('AUTRE', 'Autre motif'),
    ]

    stock = models.ForeignKey(
        Stock,
        on_delete=models.CASCADE,
        related_name='mouvements'
    )
    prix_achat_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Prix d'achat unitaire (pour les entrées en stock)"
    )
    prix_vente_unitaire = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Prix de vente unitaire (pour les sorties de stock)"
    )
    marge = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Marge en pourcentage"
    )
    type_mouvement = models.CharField(max_length=15, choices=TYPE_MOUVEMENT_CHOICES)
    motif = models.CharField(max_length=20, choices=MOTIF_CHOICES)

    # Quantités
    quantite = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Quantité du mouvement (en unité de base)"
    )
    quantite_avant = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Quantité en stock avant le mouvement"
    )
    quantite_apres = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Quantité en stock après le mouvement"
    )

    # Prix et valeur
    prix_unitaire = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        default=0,
        help_text="Prix unitaire pour ce mouvement (en unité de base)"
    )
    valeur_totale = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        help_text="Valeur totale du mouvement"
    )

    # Relations optionnelles
    transaction = models.ForeignKey(
        'Transaction',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mouvements_stock',
        help_text="Transaction associée si applicable"
    )
    utilisateur = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='mouvements_stock'
    )

    # Informations complémentaires
    numero_facture = models.CharField(max_length=50, blank=True, help_text="N° facture d'achat/vente")
    fournisseur = models.CharField(max_length=100, blank=True, help_text="Fournisseur pour les achats")
    commentaire = models.TextField(blank=True, help_text="Commentaire/Remarques")

    # Métadonnées
    date_mouvement = models.DateTimeField(default=timezone.now)
    date_creation = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Calculer la valeur totale automatiquement
        self.valeur_totale = abs(self.quantite) * self.prix_unitaire

        # Enregistrer d'abord le mouvement
        super().save(*args, **kwargs)

        # Mettre à jour le stock
        if self.type_mouvement in ['ENTREE', 'RETOUR']:
            self.stock.quantite_actuelle = self.quantite_apres
            if self.type_mouvement == 'ENTREE':
                self.stock.date_derniere_entree = self.date_mouvement
        elif self.type_mouvement in ['SORTIE', 'PERTE']:
            self.stock.quantite_actuelle = self.quantite_apres
            if self.type_mouvement == 'SORTIE':
                self.stock.date_derniere_sortie = self.date_mouvement
        elif self.type_mouvement == 'AJUSTEMENT':
            self.stock.quantite_actuelle = self.quantite_apres

        self.stock.save()

    def __str__(self):
        signe = "+" if self.type_mouvement in ['ENTREE', 'RETOUR'] else "-"
        return f"{self.stock.produit.designation} - {signe}{self.quantite} {self.stock.produit.unite_mesure.symbole} ({self.get_motif_display()})"

    class Meta:
        verbose_name = "Mouvement de stock"
        verbose_name_plural = "Mouvements de stock"
        ordering = ['-date_mouvement']

class VenteProduit(models.Model):
    """Modèle pour la vente directe de produits (papier, enveloppes, etc.)"""
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='vente_produit'
    )
    produit = models.ForeignKey(
        Produit,
        on_delete=models.PROTECT,
        related_name='ventes',
        help_text="Produit vendu"
    )
    quantite = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        help_text="Quantité vendue"
    )
    prix_unitaire = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        help_text="Prix unitaire de vente"
    )
    usage_interne = models.BooleanField(
        default=False,
        help_text="Cochez si ce produit est pour un usage interne (pas de recette, mais déstockage)"
    )

    def clean(self):
        """Validation personnalisée"""
        if self.produit and self.quantite:
            stock = self.produit.stock
            if not stock:
                raise ValidationError("Ce produit n'a pas de stock associé")
            if self.quantite > stock.quantite_actuelle:
                raise ValidationError(
                    f"Stock insuffisant. Quantité disponible : {stock.quantite_actuelle} {self.produit.unite_mesure.symbole}"
                )

    def save(self, *args, **kwargs):
        # Validation avant sauvegarde
        self.clean()

        # Si usage interne, le prix unitaire est 0
        if self.usage_interne:
            self.prix_unitaire = 0

        # Calcul automatique du montant total
        self.transaction.montant = self.quantite * self.prix_unitaire
        
        if self.usage_interne:
            self.transaction.description = f"[USAGE INTERNE] {self.transaction.description}"
            
        self.transaction.save()

        # Créer un mouvement de stock
        if not self.pk:  # Seulement à la création
            stock = self.produit.stock
            MouvementStock.objects.create(
                stock=stock,
                type_mouvement='SORTIE',
                motif='VENTE',
                quantite=self.quantite,
                quantite_avant=stock.quantite_actuelle,
                quantite_apres=stock.quantite_actuelle - self.quantite,
                prix_unitaire=self.prix_unitaire,
                transaction=self.transaction,
                utilisateur=self.transaction.utilisateur,
                commentaire=f"Vente directe - {self.produit.designation}"
            )

        super().save(*args, **kwargs)

    def __str__(self):
        return f"Vente {self.produit.designation} x{self.quantite} {self.produit.unite_mesure.symbole}"

    class Meta:
        verbose_name = "Vente de produit"
        verbose_name_plural = "Ventes de produits"

class VenteGroupee(models.Model):
    """Représente une vente groupée de plusieurs services ou produits à un client."""
    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='vente_groupee'
    )
    client_nom = models.CharField(max_length=100, blank=True, help_text="Nom du client (optionnel)")
    commentaire = models.TextField(blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Vente groupée #{self.id} - {self.transaction.montant} Ar"

    class Meta:
        verbose_name = "Vente Groupée"
        verbose_name_plural = "Ventes Groupées"
        ordering = ['-date_creation']

class LigneDeVente(models.Model):
    """Détail d'un service ou produit dans une vente groupée."""
    vente = models.ForeignKey(
        VenteGroupee,
        on_delete=models.CASCADE,
        related_name='lignes'
    )
    tarif_service = models.ForeignKey(
        TarifService,
        on_delete=models.PROTECT,
        help_text="Le service ou produit vendu"
    )
    quantite = models.DecimalField(max_digits=10, decimal_places=2, default=1)
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2, help_text="Prix unitaire au moment de la vente")
    montant_total = models.DecimalField(max_digits=10, decimal_places=2)
    description = models.CharField(max_length=255, blank=True, help_text="Description additionnelle (ex: format papier)")
    usage_interne = models.BooleanField(
        default=False,
        help_text="Cochez si cette ligne est pour un usage interne (pas de recette, mais déstockage)"
    )

    def save(self, *args, **kwargs):
        # Si usage interne, le prix unitaire et le montant total sont 0
        if self.usage_interne:
            self.prix_unitaire = 0
            self.montant_total = 0
        else:
            # Calculer le montant total de la ligne
            self.montant_total = self.quantite * self.prix_unitaire
        super().save(*args, **kwargs)

    def __str__(self):
        usage_str = " [INTERNE]" if self.usage_interne else ""
        return f"{self.tarif_service.nom_service} x {self.quantite}{usage_str}"

    class Meta:
        verbose_name = "Ligne de Vente"
        verbose_name_plural = "Lignes de Vente"
