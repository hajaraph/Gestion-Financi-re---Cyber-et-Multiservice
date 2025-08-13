from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

# Create your models here.

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

class TypeTransaction(models.Model):
    """Types de transactions (Recette/Dépense)"""
    TYPES = [
        ('RECETTE', 'Recette'),
        ('DEPENSE', 'Dépense'),
    ]

    nom = models.CharField(max_length=50, choices=TYPES, unique=True)
    description = models.TextField(blank=True)

    def __str__(self):
        return self.get_nom_display()

    class Meta:
        verbose_name = "Type de transaction"
        verbose_name_plural = "Types de transactions"

class Transaction(models.Model):
    """Modèle principal pour toutes les transactions financières"""
    TYPE_CHOICES = [
        ('RECETTE', 'Recette'),
        ('DEPENSE', 'Dépense'),
    ]

    # Informations de base
    type_transaction = models.CharField(max_length=10, choices=TYPE_CHOICES)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
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

    def __str__(self):
        return f"{self.get_type_transaction_display()} - {self.montant} FCFA - {self.date_transaction.strftime('%d/%m/%Y')}"

    class Meta:
        verbose_name = "Transaction"
        verbose_name_plural = "Transactions"
        ordering = ['-date_transaction']

class RecetteInternet(models.Model):
    """Modèle spécifique pour les recettes Internet"""
    FORFAITS = [
        ('HEURE', 'À l\'heure'),
        ('JOURNEE', 'Forfait journée'),
        ('SEMAINE', 'Forfait semaine'),
        ('MOIS', 'Forfait mensuel'),
    ]

    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='recette_internet'
    )
    type_forfait = models.CharField(max_length=10, choices=FORFAITS)
    duree_minutes = models.IntegerField(help_text="Durée en minutes")
    poste_utilise = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return f"Internet {self.get_type_forfait_display()} - {self.transaction.montant} FCFA"

    class Meta:
        verbose_name = "Recette Internet"
        verbose_name_plural = "Recettes Internet"

class RecetteMultiservice(models.Model):
    """Modèle pour les services multiservices (impression, photocopie, reliure, etc.)"""
    SERVICES = [
        ('IMPRESSION', 'Impression'),
        ('PHOTOCOPIE', 'Photocopie'),
        ('RELIURE', 'Reliure'),
        ('PLASTIFICATION', 'Plastification'),
        ('SCAN', 'Numérisation'),
        ('AUTRE', 'Autre service'),
    ]

    # Harmonise avec le front (A4/A3 NB ou Couleur) et permet un type personnalisé
    TYPE_PAPIER_CHOICES = [
        ('A4_NB', 'A4 N&B'),
        ('A4_COULEUR', 'A4 Couleur'),
        ('A3_NB', 'A3 N&B'),
        ('A3_COULEUR', 'A3 Couleur'),
        ('BRISTOL', 'Bristol'),
        ('AUTRE', 'Autre type'),
    ]

    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='recette_multiservice'
    )
    type_service = models.CharField(max_length=15, choices=SERVICES)
    # Remarque : pour IMPRESSION/PHOTOCOPIE, quantite correspond au nombre de pages
    quantite = models.IntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=6, decimal_places=2)
    
    # Champs spécifiques pour l'impression/photocopie
    type_papier = models.CharField(
        max_length=20, 
        choices=TYPE_PAPIER_CHOICES, 
        blank=True,
        help_text="Type de papier utilisé (requis pour impression/photocopie)"
    )
    # Champ libre si type_papier == 'AUTRE'
    papier_personnalise = models.CharField(
        max_length=50,
        blank=True,
        help_text="Nom du papier si 'Autre' est sélectionné"
    )
    # Gardé pour compatibilité : si fourni, il sera recopié vers quantite
    nombre_pages = models.IntegerField(
        blank=True, 
        null=True,
        help_text="Nombre de pages (obsolète, utiliser quantite)"
    )
    
    details = models.TextField(blank=True)

    def save(self, *args, **kwargs):
        # Compat : si nombre_pages est fourni, l'utiliser comme quantite (pages)
        if self.nombre_pages and self.nombre_pages > 0:
            self.quantite = self.nombre_pages

        # Pour l'impression et photocopie, quantite est interprétée comme nombre de pages
        if self.type_service in ['IMPRESSION', 'PHOTOCOPIE']:
            self.transaction.montant = (self.quantite or 0) * self.prix_unitaire
        else:
            self.transaction.montant = (self.quantite or 0) * self.prix_unitaire

        self.transaction.save()
        super().save(*args, **kwargs)

    def __str__(self):
        if self.type_service in ['IMPRESSION', 'PHOTOCOPIE']:
            papier = self.get_type_papier_display() if self.type_papier and self.type_papier != 'AUTRE' else (self.papier_personnalise or '')
            suffix = f" {papier}" if papier else ''
            return f"{self.get_type_service_display()} {self.quantite} page(s){suffix}"
        return f"{self.get_type_service_display()} - {self.quantite} unité(s)"

    class Meta:
        verbose_name = "Recette Multiservice"
        verbose_name_plural = "Recettes Multiservice"

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

    TYPE_PAPIER_CHOICES = [
        ('A4', 'A4'),
        ('A3', 'A3'),
        ('BRISTOL', 'Bristol'),
        ('AUTRE', 'Autre type'),
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

    # Informations complémentaires
    type_papier = models.CharField(
        max_length=20,
        choices=TYPE_PAPIER_CHOICES,
        blank=True,
        help_text="Type de papier pour les services d'impression/photocopie"
    )
    description = models.TextField(blank=True)
    actif = models.BooleanField(default=True)
    code_service = models.CharField(
        max_length=20,
        unique=True,
        blank=True,
        help_text="Code unique pour identifier le service"
    )

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

    def save(self, *args, **kwargs):
        # Stocker le prix original
        if not self.prix_unitaire_original:
            self.prix_unitaire_original = self.tarif_service.prix_unitaire

        # Calculer la remise applicable
        if not self.prix_unitaire_utilise or self.prix_unitaire_utilise == self.prix_unitaire_original:
            prix_avec_remise, remise_appliquee = self.calculer_prix_avec_remise()
            self.prix_unitaire_utilise = prix_avec_remise
            self.remise_appliquee = remise_appliquee

        # Calculer et mettre à jour le montant de la transaction
        montant_total = self.quantite * self.prix_unitaire_utilise
        self.transaction.montant = montant_total
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
        return f"{self.tarif_service.nom_service} x{self.quantite} - {self.montant_total} Ar{remise_str}"

    class Meta:
        verbose_name = "Service personnalisé"
        verbose_name_plural = "Services personnalisés"

class VenteProduit(models.Model):
    """Modèle pour la vente de produits (papier, clés USB, etc.)"""
    PRODUITS = [
        ('PAPIER_A4', 'Papier A4 (rame)'),
        ('PAPIER_A3', 'Papier A3 (rame)'),
        ('CLE_USB_8GB', 'Clé USB 8GB'),
        ('CLE_USB_16GB', 'Clé USB 16GB'),
        ('CLE_USB_32GB', 'Clé USB 32GB'),
        ('CD_VIERGE', 'CD vierge'),
        ('DVD_VIERGE', 'DVD vierge'),
        ('CARTOUCHE_ENCRE_NOIR', 'Cartouche encre noire'),
        ('CARTOUCHE_ENCRE_COULEUR', 'Cartouche encre couleur'),
    ]

    transaction = models.OneToOneField(
        Transaction,
        on_delete=models.CASCADE,
        related_name='vente_produit'
    )
    type_produit = models.CharField(max_length=25, choices=PRODUITS)
    quantite = models.IntegerField(default=1)
    prix_unitaire = models.DecimalField(max_digits=8, decimal_places=2)

    def save(self, *args, **kwargs):
        # Calcul automatique du montant total
        self.transaction.montant = self.quantite * self.prix_unitaire
        self.transaction.save()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Vente {self.get_type_produit_display()} x{self.quantite}"

    class Meta:
        verbose_name = "Vente de produit"
        verbose_name_plural = "Ventes de produits"

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

class TypePapier(models.Model):
    """Modèle pour gérer dynamiquement les types de papier"""
    nom = models.CharField(max_length=50, unique=True, help_text="Nom du type de papier (ex: A4 N&B, A3 Couleur)")
    code = models.CharField(max_length=20, unique=True, help_text="Code unique (ex: A4_NB, A3_COULEUR)")
    prix_unitaire = models.DecimalField(max_digits=6, decimal_places=2, default=0, help_text="Prix par page/unité")
    description = models.TextField(blank=True, help_text="Description optionnelle")
    actif = models.BooleanField(default=True, help_text="Type de papier disponible")

    # Métadonnées
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nom} ({self.prix_unitaire} Ar)"

    class Meta:
        verbose_name = "Type de papier"
        verbose_name_plural = "Types de papier"
        ordering = ['nom']
