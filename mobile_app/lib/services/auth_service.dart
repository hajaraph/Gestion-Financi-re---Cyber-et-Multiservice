import '../config/api_config.dart';
import '../models/user_model.dart';
import 'api_service.dart';

/// Service d'authentification
class AuthService {
  /// Connexion utilisateur
  Future<AuthResult> login(String username, String password) async {
    final response = await apiService.post(
      ApiConfig.loginEndpoint,
      body: {'username': username, 'password': password},
    );

    if (response.success && response.data != null) {
      final token = response.data!['token'] as String?;
      if (token != null) {
        // Sauvegarder le token
        apiService.setToken(token);

        // Charger le profil utilisateur
        final profileResult = await loadUserProfile();
        if (profileResult.success && profileResult.user != null) {
          return AuthResult(
            success: true,
            token: token,
            user: profileResult.user,
          );
        } else {
          return AuthResult(
            success: false,
            error:
                profileResult.error ??
                'Impossible de charger le profil utilisateur.',
          );
        }
      }
    }

    // Extraire le message d'erreur du backend
    String errorMessage = 'Identifiants incorrects.';

    if (response.error != null) {
      errorMessage = response.error!;
    } else if (response.data != null && response.data is Map) {
      final data = response.data as Map<String, dynamic>;
      // Essayer différents champs d'erreur possibles
      if (data.containsKey('message')) {
        errorMessage = data['message'].toString();
      } else if (data.containsKey('error')) {
        errorMessage = data['error'].toString();
      } else if (data.containsKey('detail')) {
        errorMessage = data['detail'].toString();
      } else if (data.containsKey('non_field_errors')) {
        final errors = data['non_field_errors'];
        if (errors is List && errors.isNotEmpty) {
          errorMessage = errors.first.toString();
        }
      }
    }

    return AuthResult(success: false, error: errorMessage);
  }

  /// Charger le profil utilisateur
  Future<ProfileResult> loadUserProfile() async {
    final response = await apiService.get(ApiConfig.myProfileEndpoint);

    if (response.success && response.data != null) {
      try {
        final user = User.fromJson(response.data!);
        return ProfileResult(success: true, user: user);
      } catch (e) {
        return ProfileResult(
          success: false,
          error: 'Erreur lors du parsing du profil.',
        );
      }
    }

    return ProfileResult(
      success: false,
      error: response.error ?? 'Impossible de charger le profil.',
    );
  }

  /// Vérifier la validité du token
  Future<bool> verifyToken(String token) async {
    apiService.setToken(token);
    final response = await apiService.get(ApiConfig.verifyTokenEndpoint);
    return response.success;
  }

  /// Déconnexion
  Future<void> logout() async {
    await apiService.post(ApiConfig.logoutEndpoint);
    apiService.setToken(null);
  }
}

/// Résultat de l'authentification
class AuthResult {
  final bool success;
  final String? token;
  final User? user;
  final String? error;

  AuthResult({required this.success, this.token, this.user, this.error});
}

/// Résultat du chargement de profil
class ProfileResult {
  final bool success;
  final User? user;
  final String? error;

  ProfileResult({required this.success, this.user, this.error});
}

/// Instance globale du service d'authentification
final authService = AuthService();
