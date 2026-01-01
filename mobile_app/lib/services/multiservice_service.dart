import '../config/api_config.dart';
import '../models/multiservice_models.dart';
import 'api_service.dart';

/// Service pour la gestion des multiservices (tarifs et ventes groupées)
class MultiserviceService {
  /// Récupérer la liste des tarifs avec pagination et recherche
  Future<TarifsResult> getTarifs({
    int page = 1,
    int pageSize = 20,
    String? search,
    bool? actif,
  }) async {
    String endpoint =
        '${ApiConfig.tarifsEndpoint}?page=$page&page_size=$pageSize';
    if (search != null && search.isNotEmpty) {
      endpoint += '&search=${Uri.encodeQueryComponent(search)}';
    }
    if (actif != null) endpoint += '&actif=${actif ? 1 : 0}';

    final response = await apiService.get(endpoint);

    if (response.success && response.data != null) {
      try {
        final data = response.data!;
        final results =
            data['results'] as List<dynamic>? ?? (data is List ? data : [data]);
        final tarifs = results
            .map((e) => TarifService.fromJson(e as Map<String, dynamic>))
            .toList();
        final totalCount = data['count'] ?? tarifs.length;

        return TarifsResult(
          success: true,
          tarifs: tarifs,
          totalCount: totalCount,
        );
      } catch (e) {
        return TarifsResult(
          success: false,
          error: 'Erreur lors du parsing des tarifs: $e',
        );
      }
    }

    return TarifsResult(
      success: false,
      error: response.error ?? 'Impossible de charger les tarifs.',
    );
  }

  /// Créer un nouveau tarif
  Future<bool> createTarif(Map<String, dynamic> data) async {
    final response = await apiService.post(
      ApiConfig.tarifsEndpoint,
      body: data,
    );
    return response.success;
  }

  /// Mettre à jour un tarif
  Future<bool> updateTarif(int id, Map<String, dynamic> data) async {
    final response = await apiService.patch(
      '${ApiConfig.tarifsEndpoint}$id/',
      body: data,
    );
    return response.success;
  }

  /// Supprimer un tarif
  Future<ApiResponse<dynamic>> deleteTarif(int id) async {
    return await apiService.delete('${ApiConfig.tarifsEndpoint}$id/');
  }

  /// Importer les tarifs par défaut
  Future<bool> importTarifsDefaut() async {
    final response = await apiService.post(
      '${ApiConfig.tarifsEndpoint}import_tarifs_defaut/',
    );
    return response.success;
  }

  /// --- Paliers de Remise ---

  /// Récupérer les paliers d'un tarif
  Future<PaliersResult> getPaliers(int tarifId) async {
    final response = await apiService.get(
      '${ApiConfig.paliersRemiseEndpoint}?tarif_service=$tarifId',
    );
    if (response.success && response.data != null) {
      final List<dynamic> data = response.data is List
          ? response.data
          : (response.data['results'] ?? []);
      final paliers = data.map((e) => PalierRemise.fromJson(e)).toList();
      return PaliersResult(success: true, paliers: paliers);
    }
    return PaliersResult(
      success: false,
      error: response.error ?? 'Impossible de charger les paliers.',
    );
  }

  /// Ajouter un palier
  Future<CreatePalierResult> createPalier(Map<String, dynamic> data) async {
    final response = await apiService.post(
      ApiConfig.paliersRemiseEndpoint,
      body: data,
    );
    return CreatePalierResult(success: response.success, error: response.error);
  }

  /// Supprimer un palier
  Future<bool> deletePalier(int id) async {
    final response = await apiService.delete(
      '${ApiConfig.paliersRemiseEndpoint}$id/',
    );
    return response.success;
  }

  /// --- Ventes Groupées ---

  /// Récupérer l'historique des ventes groupées
  Future<VentesGroupeesResult> getVentesGroupees({
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async {
    String endpoint =
        '${ApiConfig.ventesGroupeesEndpoint}?page=$page&page_size=$pageSize';
    if (search != null && search.isNotEmpty) {
      endpoint += '&search=${Uri.encodeQueryComponent(search)}';
    }
    final response = await apiService.get(endpoint);

    if (response.success && response.data != null) {
      try {
        final data = response.data!;
        final results =
            data['results'] as List<dynamic>? ?? (data is List ? data : [data]);
        final ventes = results
            .map((e) => VenteGroupee.fromJson(e as Map<String, dynamic>))
            .toList();
        final totalCount = data['count'] ?? ventes.length;
        return VentesGroupeesResult(
          success: true,
          ventes: ventes,
          totalCount: totalCount,
        );
      } catch (e) {
        return VentesGroupeesResult(
          success: false,
          error: 'Erreur lors du parsing des ventes: $e',
        );
      }
    }

    return VentesGroupeesResult(
      success: false,
      error: response.error ?? 'Impossible de charger les ventes.',
    );
  }

  /// Récupérer les stats des ventes groupées
  Future<VenteGroupeeStats?> getStats() async {
    final endpoint = '${ApiConfig.ventesGroupeesEndpoint}stats/';
    final response = await apiService.get(endpoint);

    if (response.success && response.data != null) {
      try {
        return VenteGroupeeStats.fromJson(response.data!);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  /// Créer une nouvelle vente groupée
  Future<CreateVenteGroupeeResult> createVenteGroupee({
    String? clientNom,
    String? commentaire,
    required List<LigneVenteGroupee> lignes,
  }) async {
    final response = await apiService.post(
      ApiConfig.ventesGroupeesEndpoint,
      body: {
        'client_nom': clientNom ?? '',
        'commentaire': commentaire ?? '',
        'lignes': lignes.map((l) => l.toJson()).toList(),
      },
    );

    if (response.success) {
      return CreateVenteGroupeeResult(success: true);
    }

    return CreateVenteGroupeeResult(
      success: false,
      error: response.error ?? 'Erreur lors de la création de la vente.',
    );
  }
}

/// Résultat de récupération des tarifs
class TarifsResult {
  final bool success;
  final List<TarifService> tarifs;
  final int totalCount;
  final String? error;

  TarifsResult({
    required this.success,
    this.tarifs = const [],
    this.totalCount = 0,
    this.error,
  });
}

/// Résultat de récupération des ventes groupées
class VentesGroupeesResult {
  final bool success;
  final List<VenteGroupee> ventes;
  final int totalCount;
  final String? error;

  VentesGroupeesResult({
    required this.success,
    this.ventes = const [],
    this.totalCount = 0,
    this.error,
  });
}

/// Résultat de création de vente groupée
class CreateVenteGroupeeResult {
  final bool success;
  final String? error;

  CreateVenteGroupeeResult({required this.success, this.error});
}

class PaliersResult {
  final bool success;
  final List<PalierRemise> paliers;
  final String? error;

  PaliersResult({required this.success, this.paliers = const [], this.error});
}

class CreatePalierResult {
  final bool success;
  final String? error;

  CreatePalierResult({required this.success, this.error});
}

/// Instance globale du service
final multiserviceService = MultiserviceService();
