import '../config/api_config.dart';
import '../models/produit_models.dart';
import 'api_service.dart';

/// Service pour la gestion des produits et ventes
class VenteProduitService {
  /// Récupérer la liste des produits en stock
  Future<ProduitsResult> getProduits({String? search}) async {
    String endpoint =
        '${ApiConfig.produitsEndpoint}?en_stock=true&actif=true&page_size=50';
    if (search != null && search.isNotEmpty) {
      endpoint += '&search=$search';
    }

    final response = await apiService.get(endpoint);

    if (response.success && response.data != null) {
      try {
        final data = response.data!;
        final results =
            data['results'] as List<dynamic>? ?? (data is List ? data : [data]);
        final produits = results
            .map((e) => Produit.fromJson(e as Map<String, dynamic>))
            .toList();
        return ProduitsResult(success: true, produits: produits);
      } catch (e) {
        return ProduitsResult(
          success: false,
          error: 'Erreur lors du parsing des produits: $e',
        );
      }
    }

    return ProduitsResult(
      success: false,
      error: response.error ?? 'Impossible de charger les produits.',
    );
  }

  /// Récupérer l'historique des ventes
  Future<VentesResult> getVentes({int page = 1, int pageSize = 10}) async {
    final endpoint =
        '${ApiConfig.ventesProduitsEndpoint}?page=$page&page_size=$pageSize';
    final response = await apiService.get(endpoint);

    if (response.success && response.data != null) {
      try {
        final data = response.data!;
        final results =
            data['results'] as List<dynamic>? ?? (data is List ? data : [data]);
        final ventes = results
            .map((e) => VenteProduit.fromJson(e as Map<String, dynamic>))
            .toList();
        final totalCount = data['count'] ?? ventes.length;
        return VentesResult(
          success: true,
          ventes: ventes,
          totalCount: totalCount,
        );
      } catch (e) {
        return VentesResult(
          success: false,
          error: 'Erreur lors du parsing des ventes: $e',
        );
      }
    }

    return VentesResult(
      success: false,
      error: response.error ?? 'Impossible de charger les ventes.',
    );
  }

  /// Créer une nouvelle vente
  Future<CreateVenteResult> createVente({
    required int produitId,
    required int quantite,
    required double prixUnitaire,
    bool usageInterne = false,
  }) async {
    final response = await apiService.post(
      ApiConfig.ventesProduitsEndpoint,
      body: {
        'produit': produitId,
        'quantite': quantite,
        'prix_unitaire': prixUnitaire,
        'usage_interne': usageInterne,
      },
    );

    if (response.success) {
      return CreateVenteResult(success: true);
    }

    return CreateVenteResult(
      success: false,
      error: response.error ?? 'Erreur lors de la création de la vente.',
    );
  }
}

/// Résultat de récupération des produits
class ProduitsResult {
  final bool success;
  final List<Produit> produits;
  final String? error;

  ProduitsResult({required this.success, this.produits = const [], this.error});
}

/// Résultat de récupération des ventes
class VentesResult {
  final bool success;
  final List<VenteProduit> ventes;
  final int totalCount;
  final String? error;

  VentesResult({
    required this.success,
    this.ventes = const [],
    this.totalCount = 0,
    this.error,
  });
}

/// Résultat de création de vente
class CreateVenteResult {
  final bool success;
  final String? error;

  CreateVenteResult({required this.success, this.error});
}

/// Instance globale du service
final venteProduitService = VenteProduitService();
