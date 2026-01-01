import '../config/api_config.dart';
import '../models/dashboard_models.dart';
import 'api_service.dart';

/// Service pour récupérer les données du Dashboard
class DashboardService {
  static const int _maxRetries = 2;

  /// Récupérer les statistiques du dashboard avec retry automatique
  /// [period] peut être 'today', 'week' ou 'month'
  Future<DashboardResult> getStats({String period = 'today'}) async {
    final endpoint = '${ApiConfig.dashboardStatsEndpoint}?period=$period';

    // Essayer plusieurs fois en cas d'erreur de connexion
    for (int attempt = 0; attempt <= _maxRetries; attempt++) {
      final response = await apiService.get(endpoint);

      if (response.success && response.data != null) {
        try {
          final stats = DashboardStats.fromJson(response.data!);
          return DashboardResult(success: true, stats: stats);
        } catch (e) {
          return DashboardResult(
            success: false,
            error: 'Erreur lors du parsing des données: $e',
          );
        }
      }

      // Si c'est une erreur de connexion et qu'on peut réessayer
      final isConnectionError =
          response.error != null &&
          (response.error!.contains('connexion') ||
              response.error!.contains('Connection') ||
              response.error!.contains('timeout') ||
              response.error!.contains('closed'));

      if (isConnectionError && attempt < _maxRetries) {
        // Attendre un peu avant de réessayer
        await Future.delayed(Duration(milliseconds: 500 * (attempt + 1)));
        continue;
      }

      // Erreur finale
      return DashboardResult(
        success: false,
        error: response.error ?? 'Impossible de charger les statistiques.',
      );
    }

    return DashboardResult(
      success: false,
      error:
          'Impossible de charger les statistiques après plusieurs tentatives.',
    );
  }
}

/// Résultat de la récupération des stats
class DashboardResult {
  final bool success;
  final DashboardStats? stats;
  final String? error;

  DashboardResult({required this.success, this.stats, this.error});
}

/// Instance globale du service Dashboard
final dashboardService = DashboardService();
