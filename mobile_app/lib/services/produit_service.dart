import '../config/api_config.dart';
import '../models/produit_models.dart';
import 'api_service.dart';

/// Service pour la gestion administrative des produits
class ProduitService {
  /// Récupérer la liste des produits (avec filtres administratifs)
  Future<ProduitsResult> getProduits({
    String? search,
    int? categorieId,
    bool? actif,
  }) async {
    String endpoint = '${ApiConfig.produitsEndpoint}?page_size=500';
    if (search != null && search.isNotEmpty) {
      endpoint += '&search=${Uri.encodeQueryComponent(search)}';
    }
    if (categorieId != null) {
      endpoint += '&categorie=$categorieId';
    }
    if (actif != null) {
      endpoint += '&actif=${actif ? 1 : 0}';
    }

    final response = await apiService.get(endpoint);

    if (response.success && response.data != null) {
      try {
        final data = response.data!;
        dynamic results;
        if (data is Map<String, dynamic> && data.containsKey('results')) {
          results = data['results'];
        } else if (data is List) {
          results = data;
        } else {
          results = [data];
        }

        final produits = (results as List)
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

  /// Récupérer les détails d'un produit
  Future<ProduitDetailResult> getProduit(int id) async {
    final response = await apiService.get('${ApiConfig.produitsEndpoint}$id/');

    if (response.success && response.data != null) {
      try {
        final produit = Produit.fromJson(response.data!);
        return ProduitDetailResult(success: true, produit: produit);
      } catch (e) {
        return ProduitDetailResult(
          success: false,
          error: 'Erreur parsing produit: $e',
        );
      }
    }

    return ProduitDetailResult(
      success: false,
      error: response.error ?? 'Produit non trouvé',
    );
  }

  /// Créer un produit
  Future<ProduitDetailResult> createProduit(Map<String, dynamic> data) async {
    final response = await apiService.post(
      ApiConfig.produitsEndpoint,
      body: data,
    );

    if (response.success && response.data != null) {
      try {
        final produit = Produit.fromJson(response.data!);
        return ProduitDetailResult(success: true, produit: produit);
      } catch (e) {
        return ProduitDetailResult(
          success: false,
          error: 'Erreur création produit: $e',
        );
      }
    }

    return ProduitDetailResult(
      success: false,
      error: response.error ?? 'Erreur lors de la création',
    );
  }

  /// Mettre à jour un produit
  Future<ProduitDetailResult> updateProduit(
    int id,
    Map<String, dynamic> data,
  ) async {
    final response = await apiService.patch(
      '${ApiConfig.produitsEndpoint}$id/',
      body: data,
    );

    if (response.success && response.data != null) {
      try {
        final produit = Produit.fromJson(response.data!);
        return ProduitDetailResult(success: true, produit: produit);
      } catch (e) {
        return ProduitDetailResult(
          success: false,
          error: 'Erreur modification produit: $e',
        );
      }
    }

    return ProduitDetailResult(
      success: false,
      error: response.error ?? 'Erreur lors de la modification',
    );
  }

  /// Supprimer un produit
  Future<bool> deleteProduit(int id) async {
    final response = await apiService.delete(
      '${ApiConfig.produitsEndpoint}$id/',
    );
    return response.success;
  }

  /// Récupérer les catégories
  Future<CategoriesResult> getCategories() async {
    final response = await apiService.get(ApiConfig.categoriesProduitsEndpoint);

    if (response.success && response.data != null) {
      try {
        final data = response.data!;
        dynamic results;
        if (data is Map<String, dynamic> && data.containsKey('results')) {
          results = data['results'];
        } else if (data is List) {
          results = data;
        } else {
          results = [data];
        }

        final categories = (results as List)
            .map((e) => CategorieProduit.fromJson(e as Map<String, dynamic>))
            .toList();
        return CategoriesResult(success: true, categories: categories);
      } catch (e) {
        return CategoriesResult(success: false, error: 'Erreur categories: $e');
      }
    }

    return CategoriesResult(
      success: false,
      error: response.error ?? 'Erreur categories',
    );
  }

  /// Récupérer les unités de mesure
  Future<UnitesResult> getUnitesMesure() async {
    final response = await apiService.get(ApiConfig.unitesMesureEndpoint);

    if (response.success && response.data != null) {
      try {
        final data = response.data!;
        dynamic results;
        if (data is Map<String, dynamic> && data.containsKey('results')) {
          results = data['results'];
        } else if (data is List) {
          results = data;
        } else {
          results = [data];
        }

        final unites = (results as List)
            .map((e) => UniteMesure.fromJson(e as Map<String, dynamic>))
            .toList();
        return UnitesResult(success: true, unites: unites);
      } catch (e) {
        return UnitesResult(success: false, error: 'Erreur unités: $e');
      }
    }

    return UnitesResult(
      success: false,
      error: response.error ?? 'Erreur unités',
    );
  }
}

class ProduitsResult {
  final bool success;
  final List<Produit> produits;
  final String? error;

  ProduitsResult({required this.success, this.produits = const [], this.error});
}

class ProduitDetailResult {
  final bool success;
  final Produit? produit;
  final String? error;

  ProduitDetailResult({required this.success, this.produit, this.error});
}

class CategoriesResult {
  final bool success;
  final List<CategorieProduit> categories;
  final String? error;

  CategoriesResult({
    required this.success,
    this.categories = const [],
    this.error,
  });
}

class UnitesResult {
  final bool success;
  final List<UniteMesure> unites;
  final String? error;

  UnitesResult({required this.success, this.unites = const [], this.error});
}

final produitService = ProduitService();
