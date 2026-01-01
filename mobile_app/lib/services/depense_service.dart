import '../models/depense_models.dart';
import '../config/api_config.dart';
import 'api_service.dart';

/// Service pour la gestion des dépenses
class DepenseService {
  /// Récupérer toutes les dépenses avec pagination et recherche
  Future<DepensesListResult> getDepenses({
    int page = 1,
    int? pageSize,
    String? search,
  }) async {
    try {
      String query = '?page=$page';
      if (pageSize != null) query += '&page_size=$pageSize';
      if (search != null && search.isNotEmpty) {
        query += '&search=${Uri.encodeQueryComponent(search)}';
      }

      final response = await apiService.get(
        '${ApiConfig.depensesEndpoint}$query',
      );

      if (response.success) {
        final List<dynamic> results = response.data['results'] ?? response.data;
        final count = response.data['count'] ?? results.length;

        final depenses = results.map((json) => Depense.fromJson(json)).toList();

        return DepensesListResult(
          success: true,
          depenses: depenses,
          count: count,
        );
      }
      return DepensesListResult(success: false, error: response.error);
    } catch (e) {
      return DepensesListResult(success: false, error: e.toString());
    }
  }

  /// Récupérer les catégories de dépenses
  Future<CategoriesDepenseResult> getCategories() async {
    try {
      final response = await apiService.get(
        '${ApiConfig.depensesEndpoint}categories/',
      );

      if (response.success) {
        final List<dynamic> data = response.data;
        final categories = data
            .map((json) => CategorieDepense.fromJson(json))
            .toList();
        return CategoriesDepenseResult(success: true, categories: categories);
      }
      return CategoriesDepenseResult(success: false, error: response.error);
    } catch (e) {
      return CategoriesDepenseResult(success: false, error: e.toString());
    }
  }

  /// Créer une dépense
  Future<DepenseOperationResult> createDepense(
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await apiService.post(
        ApiConfig.depensesEndpoint,
        body: data,
      );

      if (response.success) {
        return DepenseOperationResult(
          success: true,
          depense: Depense.fromJson(response.data),
        );
      }
      return DepenseOperationResult(success: false, error: response.error);
    } catch (e) {
      return DepenseOperationResult(success: false, error: e.toString());
    }
  }

  /// Mettre à jour une dépense
  Future<DepenseOperationResult> updateDepense(
    int id,
    Map<String, dynamic> data,
  ) async {
    try {
      final response = await apiService.patch(
        '${ApiConfig.depensesEndpoint}$id/',
        body: data,
      );

      if (response.success) {
        return DepenseOperationResult(
          success: true,
          depense: Depense.fromJson(response.data),
        );
      }
      return DepenseOperationResult(success: false, error: response.error);
    } catch (e) {
      return DepenseOperationResult(success: false, error: e.toString());
    }
  }

  /// Supprimer une dépense
  Future<bool> deleteDepense(int id) async {
    try {
      final response = await apiService.delete(
        '${ApiConfig.depensesEndpoint}$id/',
      );
      return response.success;
    } catch (e) {
      return false;
    }
  }
}

/// Instance globale du service de dépenses
final depenseService = DepenseService();
