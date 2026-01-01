import '../config/api_config.dart';
import '../models/stock_models.dart';
import 'api_service.dart';

class StockService {
  /// Récupérer la liste des stocks
  Future<StockListResult> getStocks({String search = ''}) async {
    String url = ApiConfig.stocksEndpoint;
    if (search.isNotEmpty) {
      url += '?search=${Uri.encodeQueryComponent(search)}';
    }

    final response = await apiService.get(url);

    if (response.success && response.data != null) {
      try {
        List<dynamic> results;
        final data = response.data;
        if (data is Map<String, dynamic> && data.containsKey('results')) {
          results = data['results'];
        } else if (data is List) {
          results = data;
        } else {
          results = [data]; // Au cas où
        }

        final stocks = results
            .map((e) => StockItem.fromJson(e as Map<String, dynamic>))
            .toList();

        return StockListResult(success: true, stocks: stocks);
      } catch (e) {
        return StockListResult(
          success: false,
          stocks: [],
          error: 'Erreur de parsing: $e',
        );
      }
    } else {
      return StockListResult(
        success: false,
        stocks: [],
        error: response.error ?? 'Erreur inconnue',
      );
    }
  }

  /// Récupérer les statistiques de stock
  Future<StockStatsResult> getStats() async {
    final url = '${ApiConfig.stocksEndpoint}stats/';
    final response = await apiService.get(url);

    if (response.success && response.data != null) {
      try {
        final stats = StockStats.fromJson(
          response.data as Map<String, dynamic>,
        );
        return StockStatsResult(success: true, stats: stats);
      } catch (e) {
        return StockStatsResult(
          success: false,
          error: 'Erreur de parsing stats: $e',
        );
      }
    } else {
      return StockStatsResult(success: false, error: response.error);
    }
  }

  /// Récupérer l'historique d'un stock
  Future<StockHistoryResult> getHistory(int stockId) async {
    final url = '${ApiConfig.stocksEndpoint}$stockId/historique/';
    final response = await apiService.get(url);

    if (response.success && response.data != null) {
      try {
        List<dynamic> results;
        final data = response.data;
        if (data is Map<String, dynamic> && data.containsKey('results')) {
          results = data['results'];
        } else if (data is List) {
          results = data;
        } else {
          results = [];
        }

        final history = results
            .map((e) => StockHistoryItem.fromJson(e as Map<String, dynamic>))
            .toList();

        return StockHistoryResult(success: true, history: history);
      } catch (e) {
        return StockHistoryResult(
          success: false,
          history: [],
          error: 'Erreur de parsing historique: $e',
        );
      }
    } else {
      return StockHistoryResult(
        success: false,
        history: [],
        error: response.error,
      );
    }
  }

  /// Enregistrer une entrée de stock
  Future<StockOperationResult> recordEntry({
    required int produitId,
    required double quantiteAchat,
    required double prixTotalAchat,
    String? fournisseur,
    String? numeroFacture,
    String? commentaire,
  }) async {
    final url = '${ApiConfig.stocksEndpoint}enregistrer_entree/';
    final payload = {
      'produit_id': produitId,
      'quantite_achat': quantiteAchat,
      'prix_total_achat': prixTotalAchat,
      'fournisseur': fournisseur,
      'numero_facture': numeroFacture,
      'commentaire': commentaire,
    };

    final response = await apiService.post(url, body: payload);

    if (response.success) {
      return StockOperationResult(success: true);
    } else {
      return StockOperationResult(success: false, error: response.error);
    }
  }

  /// Ajuster le stock
  Future<StockOperationResult> adjustStock({
    required int stockId,
    required double quantite,
    required String typeAjustement, // AUGMENTATION, DIMINUTION
    String? commentaire,
  }) async {
    final url = '${ApiConfig.stocksEndpoint}$stockId/ajuster_stock/';
    final payload = {
      'quantite': quantite,
      'type_ajustement': typeAjustement,
      'commentaire': commentaire,
    };

    final response = await apiService.post(url, body: payload);

    if (response.success) {
      return StockOperationResult(success: true);
    } else {
      return StockOperationResult(success: false, error: response.error);
    }
  }

  /// Réévaluer le prix moyen
  Future<StockOperationResult> revalueStockPrice({
    required int stockId,
    required double nouveauPrix,
    String? commentaire,
  }) async {
    final url = '${ApiConfig.stocksEndpoint}$stockId/revaluer_prix_moyen/';
    final payload = {
      'nouveau_prix_moyen': nouveauPrix,
      'commentaire': commentaire,
    };
    final response = await apiService.post(url, body: payload);

    if (response.success) {
      return StockOperationResult(success: true);
    } else {
      return StockOperationResult(success: false, error: response.error);
    }
  }
}

final stockService = StockService();
