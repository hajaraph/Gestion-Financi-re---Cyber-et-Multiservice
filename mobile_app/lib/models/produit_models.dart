import 'dashboard_models.dart';

/// Modèle de catégorie de produit
class CategorieProduit {
  final int id;
  final String nom;

  CategorieProduit({required this.id, required this.nom});

  factory CategorieProduit.fromJson(Map<String, dynamic> json) {
    return CategorieProduit(
      id: parseInt(json['id']),
      nom: json['nom']?.toString() ?? '',
    );
  }
}

/// Modèle d'unité de mesure
class UniteMesure {
  final int id;
  final String nom;
  final String symbole;

  UniteMesure({required this.id, required this.nom, required this.symbole});

  factory UniteMesure.fromJson(Map<String, dynamic> json) {
    return UniteMesure(
      id: parseInt(json['id']),
      nom: json['nom']?.toString() ?? '',
      symbole: json['symbole']?.toString() ?? '',
    );
  }
}

/// Modèle de produit
class Produit {
  final int id;
  final String designation;
  final String? reference;
  final int? categorieId;
  final String? categorieNom;
  final double prixVente;
  final int? uniteMesureId;
  final String? uniteMesureSymbole;
  final int? uniteAchatId;
  final String? uniteAchatSymbole;
  final double quantiteParUniteAchat;
  final StockInfo stock;
  final bool actif;
  final String description;

  Produit({
    required this.id,
    required this.designation,
    this.reference,
    this.categorieId,
    this.categorieNom,
    required this.prixVente,
    this.uniteMesureId,
    this.uniteMesureSymbole,
    this.uniteAchatId,
    this.uniteAchatSymbole,
    this.quantiteParUniteAchat = 1.0,
    required this.stock,
    this.actif = true,
    this.description = '',
  });

  factory Produit.fromJson(Map<String, dynamic> json) {
    return Produit(
      id: parseInt(json['id']),
      designation: json['designation']?.toString() ?? '',
      reference: json['reference']?.toString(),
      categorieId: json['categorie'] != null
          ? parseInt(json['categorie'])
          : null,
      categorieNom: json['categorie_nom']?.toString(),
      prixVente: parseDouble(json['prix_vente']),
      uniteMesureId: json['unite_mesure'] != null
          ? parseInt(json['unite_mesure'])
          : null,
      uniteMesureSymbole: json['unite_mesure_symbole']?.toString(),
      uniteAchatId: json['unite_achat'] != null
          ? parseInt(json['unite_achat'])
          : null,
      uniteAchatSymbole: json['unite_achat_symbole']?.toString(),
      quantiteParUniteAchat: parseDouble(
        json['quantite_par_unite_achat'] ?? 1.0,
      ),
      stock: StockInfo.fromJson(json['stock'] ?? {}),
      actif: parseBool(json['actif'] ?? true),
      description: json['description']?.toString() ?? '',
    );
  }
}

/// Infos de stock d'un produit
class StockInfo {
  final double quantiteActuelle;
  final double quantiteMinimale;

  StockInfo({required this.quantiteActuelle, required this.quantiteMinimale});

  factory StockInfo.fromJson(Map<String, dynamic> json) {
    return StockInfo(
      quantiteActuelle: parseDouble(json['quantite_actuelle']),
      quantiteMinimale: parseDouble(json['quantite_minimale']),
    );
  }

  bool get isLowStock => quantiteActuelle <= quantiteMinimale;
}

/// Modèle de vente de produit
class VenteProduit {
  final int id;
  final String produitDesignation;
  final int quantite;
  final double prixUnitaire;
  final bool usageInterne;
  final TransactionInfo transaction;

  VenteProduit({
    required this.id,
    required this.produitDesignation,
    required this.quantite,
    required this.prixUnitaire,
    required this.usageInterne,
    required this.transaction,
  });

  factory VenteProduit.fromJson(Map<String, dynamic> json) {
    return VenteProduit(
      id: parseInt(json['id']),
      produitDesignation: json['produit_designation']?.toString() ?? '',
      quantite: parseInt(json['quantite']),
      prixUnitaire: parseDouble(json['prix_unitaire']),
      usageInterne: json['usage_interne'] ?? false,
      transaction: TransactionInfo.fromJson(json['transaction'] ?? {}),
    );
  }

  double get totalMontant => usageInterne ? 0 : quantite * prixUnitaire;
}

/// Infos de transaction
class TransactionInfo {
  final DateTime dateTransaction;

  TransactionInfo({required this.dateTransaction});

  factory TransactionInfo.fromJson(Map<String, dynamic> json) {
    return TransactionInfo(
      dateTransaction:
          DateTime.tryParse(json['date_transaction']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}
