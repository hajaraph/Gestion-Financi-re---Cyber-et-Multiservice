import 'dashboard_models.dart';

/// Modèle de tarif de service
class TarifService {
  final int id;
  final String nomService;
  final double prixUnitaire;
  final String? description;
  final String? categorieNom;
  final String? categorie;
  final String? uniteMesure;
  final bool actif;
  final List<Consommation> consommations;
  final List<PalierRemise> paliersRemise;
  final int totalPaliers;

  TarifService({
    required this.id,
    required this.nomService,
    required this.prixUnitaire,
    this.description,
    this.categorieNom,
    this.categorie,
    this.uniteMesure,
    this.actif = true,
    this.consommations = const [],
    this.paliersRemise = const [],
    this.totalPaliers = 0,
  });

  /// Calcule le prix unitaire avec remise selon la quantité
  /// Logique identique à calculatePriceWithDiscounts dans Multiservice.jsx
  double calculerPrixAvecRemise(int quantite) {
    if (paliersRemise.isEmpty) return prixUnitaire;

    // Filtrer les paliers valides (actifs et quantité >= seuil)
    final paliersValides =
        paliersRemise.where((p) => p.actif && quantite >= p.qteSeuil).toList()
          ..sort((a, b) => b.qteSeuil.compareTo(a.qteSeuil)); // Tri décroissant

    if (paliersValides.isEmpty) return prixUnitaire;

    // Prendre le meilleur palier (le plus avantageux = qteSeuil le plus élevé)
    final bestPalier = paliersValides.first;

    switch (bestPalier.typeRemise) {
      case 'POURCENTAGE':
        return prixUnitaire * (1 - bestPalier.valeurRemise / 100);
      case 'MONTANT_FIXE':
        final nouveauPrix = prixUnitaire - bestPalier.valeurRemise;
        return nouveauPrix > 0 ? nouveauPrix : 0;
      case 'PRIX_UNITAIRE':
        return bestPalier.valeurRemise;
      default:
        return prixUnitaire;
    }
  }

  factory TarifService.fromJson(Map<String, dynamic> json) {
    return TarifService(
      id: parseInt(json['id']),
      nomService: json['nom_service']?.toString() ?? '',
      prixUnitaire: parseDouble(json['prix_unitaire']),
      description: json['description']?.toString(),
      categorieNom: json['categorie_nom']?.toString(),
      categorie: json['categorie']?.toString(),
      uniteMesure: json['unite_mesure']?.toString(),
      actif: json['actif'] ?? true,
      totalPaliers: parseInt(json['nombre_paliers']),
      consommations:
          (json['consommations'] as List<dynamic>?)
              ?.map((e) => Consommation.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      paliersRemise:
          (json['paliers_remise'] as List<dynamic>?)
              ?.map((e) => PalierRemise.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

/// Consommation de produit par un service
class Consommation {
  final int produitId;
  final String produitNom;
  final double quantite;
  final double produitStock;

  Consommation({
    required this.produitId,
    required this.produitNom,
    required this.quantite,
    required this.produitStock,
  });

  factory Consommation.fromJson(Map<String, dynamic> json) {
    return Consommation(
      produitId: parseInt(json['produit']),
      produitNom: json['produit_nom']?.toString() ?? '',
      quantite: parseDouble(json['quantite']),
      produitStock: parseDouble(json['produit_stock'] ?? 0),
    );
  }
}

class PalierRemise {
  final int? id;
  final int qteSeuil;
  final double valeurRemise;
  final String typeRemise;
  final bool actif;

  PalierRemise({
    this.id,
    required this.qteSeuil,
    required this.valeurRemise,
    this.typeRemise = 'PRIX_UNITAIRE',
    this.actif = true,
  });

  factory PalierRemise.fromJson(Map<String, dynamic> json) {
    return PalierRemise(
      id: parseInt(json['id']),
      qteSeuil: parseInt(json['quantite_minimum'] ?? json['seuil_quantite']),
      valeurRemise: parseDouble(
        json['valeur_remise'] ?? json['nouveau_prix_unitaire'],
      ),
      typeRemise: json['type_remise']?.toString() ?? 'PRIX_UNITAIRE',
      actif: json['actif'] ?? true,
    );
  }
}

/// Ligne de vente groupée
class LigneVenteGroupee {
  final int? id;
  final int tarifServiceId;
  final String? tarifServiceNom;
  final int quantite;
  final double prixUnitaire;
  final bool usageInterne;

  LigneVenteGroupee({
    this.id,
    required this.tarifServiceId,
    this.tarifServiceNom,
    required this.quantite,
    required this.prixUnitaire,
    this.usageInterne = false,
  });

  factory LigneVenteGroupee.fromJson(Map<String, dynamic> json) {
    return LigneVenteGroupee(
      id: parseInt(json['id']),
      tarifServiceId: parseInt(json['tarif_service_id']),
      tarifServiceNom: json['tarif_service_nom']?.toString(),
      quantite: parseInt(json['quantite']),
      prixUnitaire: parseDouble(json['prix_unitaire']),
      usageInterne: json['usage_interne'] ?? false,
    );
  }

  Map<String, dynamic> toJson() => {
    'tarif_service_id': tarifServiceId,
    'quantite': quantite,
    'prix_unitaire': prixUnitaire,
    'usage_interne': usageInterne,
  };

  double get sousTotal => usageInterne ? 0 : quantite * prixUnitaire;
}

/// Transaction associée à une vente groupée
class TransactionVenteGroupee {
  final double montant;
  final DateTime dateTransaction;

  TransactionVenteGroupee({
    required this.montant,
    required this.dateTransaction,
  });

  factory TransactionVenteGroupee.fromJson(Map<String, dynamic> json) {
    return TransactionVenteGroupee(
      montant: parseDouble(json['montant']),
      dateTransaction:
          DateTime.tryParse(json['date_transaction']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

/// Modèle de vente groupée
class VenteGroupee {
  final int id;
  final String? clientNom;
  final String? commentaire;
  final List<LigneVenteGroupee> lignes;
  final TransactionVenteGroupee transaction;
  final DateTime dateCreation;

  VenteGroupee({
    required this.id,
    this.clientNom,
    this.commentaire,
    required this.lignes,
    required this.transaction,
    required this.dateCreation,
  });

  factory VenteGroupee.fromJson(Map<String, dynamic> json) {
    return VenteGroupee(
      id: parseInt(json['id']),
      clientNom: json['client_nom']?.toString(),
      commentaire: json['commentaire']?.toString(),
      lignes:
          (json['lignes'] as List<dynamic>?)
              ?.map(
                (e) => LigneVenteGroupee.fromJson(e as Map<String, dynamic>),
              )
              .toList() ??
          [],
      transaction: TransactionVenteGroupee.fromJson(json['transaction'] ?? {}),
      dateCreation:
          DateTime.tryParse(json['date_creation']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

/// Stats des ventes groupées
class VenteGroupeeStats {
  final double totalVendu;
  final int nombreVentes;
  final String serviceTop;

  VenteGroupeeStats({
    required this.totalVendu,
    required this.nombreVentes,
    required this.serviceTop,
  });

  factory VenteGroupeeStats.fromJson(Map<String, dynamic> json) {
    return VenteGroupeeStats(
      totalVendu: parseDouble(json['totalVendu']),
      nombreVentes: parseInt(json['nombreVentes']),
      serviceTop: json['serviceTop']?.toString() ?? 'N/A',
    );
  }
}
