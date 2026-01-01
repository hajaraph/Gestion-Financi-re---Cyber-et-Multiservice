import 'dashboard_models.dart';

/// Modèle d'élément de stock
class StockItem {
  final int id;
  final int produitId;
  final String nomProduit;
  final String? codeProduit;
  final String etat; // EN_STOCK, LIMITE, RUPTURE
  final double quantiteActuelle;
  final double quantiteMinimale;
  final String? uniteMesureProduit;
  final double? valeurStockVente;
  final double? prixAchatMoyen;
  final String? uniteAchatSymbole;
  final double quantiteParUniteAchat;

  StockItem({
    required this.id,
    required this.produitId,
    required this.nomProduit,
    this.codeProduit,
    required this.etat,
    required this.quantiteActuelle,
    required this.quantiteMinimale,
    this.uniteMesureProduit,
    this.valeurStockVente,
    this.prixAchatMoyen,
    this.uniteAchatSymbole,
    this.quantiteParUniteAchat = 1.0,
  });

  factory StockItem.fromJson(Map<String, dynamic> json) {
    return StockItem(
      id: parseInt(json['id']),
      produitId: parseInt(json['produit_id']),
      nomProduit: json['nom_produit']?.toString() ?? 'Inconnu',
      codeProduit: json['code_produit']?.toString(),
      etat: json['etat']?.toString() ?? 'UNKNOWN',
      quantiteActuelle: parseDouble(json['quantite_actuelle']),
      quantiteMinimale: parseDouble(json['quantite_minimale']),
      uniteMesureProduit: json['unite_mesure_produit']?.toString(),
      valeurStockVente: parseDouble(json['valeur_stock_vente']),
      prixAchatMoyen: parseDouble(json['prix_achat_moyen']),
      uniteAchatSymbole: json['unite_achat_symbole']?.toString(),
      quantiteParUniteAchat: parseDouble(
        json['quantite_par_unite_achat'] ?? 1.0,
      ),
    );
  }

  String get etatDisplay => etat.replaceAll('_', ' ');
}

/// Statistiques de stock
class StockStats {
  final double totalValeurAchat;
  final double totalValeurVente;
  final int ruptures;
  final int reappro;

  StockStats({
    required this.totalValeurAchat,
    required this.totalValeurVente,
    required this.ruptures,
    required this.reappro,
  });

  factory StockStats.fromJson(Map<String, dynamic> json) {
    return StockStats(
      totalValeurAchat: parseDouble(json['totalValeurAchat']),
      totalValeurVente: parseDouble(json['totalValeurVente']),
      ruptures: parseInt(json['ruptures']),
      reappro: parseInt(json['reappro']),
    );
  }
}

/// Modèle d'historique de stock
class StockHistoryItem {
  final int id;
  final DateTime dateMouvement;
  final String typeMouvement; // ENTREE, SORTIE, AJUSTEMENT...
  final String typeMouvementDisplay;
  final String motifDisplay;
  final double quantite;
  final double quantiteAvant;
  final double quantiteApres;
  final String? utilisateurNom;

  StockHistoryItem({
    required this.id,
    required this.dateMouvement,
    required this.typeMouvement,
    required this.typeMouvementDisplay,
    required this.motifDisplay,
    required this.quantite,
    required this.quantiteAvant,
    required this.quantiteApres,
    this.utilisateurNom,
  });

  factory StockHistoryItem.fromJson(Map<String, dynamic> json) {
    return StockHistoryItem(
      id: parseInt(json['id']),
      dateMouvement:
          DateTime.tryParse(json['date_mouvement']?.toString() ?? '') ??
          DateTime.now(),
      typeMouvement: json['type_mouvement']?.toString() ?? '',
      typeMouvementDisplay: json['type_mouvement_display']?.toString() ?? '',
      motifDisplay: json['motif_display']?.toString() ?? '',
      quantite: parseDouble(json['quantite']),
      quantiteAvant: parseDouble(json['quantite_avant']),
      quantiteApres: parseDouble(json['quantite_apres']),
      utilisateurNom: json['utilisateur_nom']?.toString(),
    );
  }
}

/// Résultat de la requête de stocks
class StockListResult {
  final bool success;
  final List<StockItem> stocks;
  final String? error;

  StockListResult({required this.success, required this.stocks, this.error});
}

/// Résultat générique
class StockOperationResult {
  final bool success;
  final String? error;

  StockOperationResult({required this.success, this.error});
}

class StockStatsResult {
  final bool success;
  final StockStats? stats;
  final String? error;

  StockStatsResult({required this.success, this.stats, this.error});
}

class StockHistoryResult {
  final bool success;
  final List<StockHistoryItem> history;
  final String? error;

  StockHistoryResult({
    required this.success,
    required this.history,
    this.error,
  });
}
