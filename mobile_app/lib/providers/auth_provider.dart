import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';

/// Provider pour la gestion de l'authentification
/// Équivalent du AuthContext React
class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isAuthenticated = false;
  bool _isLoading = true;
  String? _error;

  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  static const String _tokenKey = 'auth_token';
  static const String _rememberUserKey = 'remember_user';

  // Getters
  User? get user => _user;
  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Initialisation - Vérifier si l'utilisateur est déjà connecté
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await _storage.read(key: _tokenKey);
      if (token != null) {
        // Vérifier la validité du token
        final isValid = await authService.verifyToken(token);
        if (isValid) {
          // Charger le profil utilisateur
          final profileResult = await authService.loadUserProfile();
          if (profileResult.success && profileResult.user != null) {
            _user = profileResult.user;
            _isAuthenticated = true;
          } else {
            await _clearAuthData();
          }
        } else {
          await _clearAuthData();
        }
      }
    } catch (e) {
      await _clearAuthData();
    }

    _isLoading = false;
    notifyListeners();
  }

  /// Connexion utilisateur
  Future<bool> login({
    required String username,
    required String password,
    bool rememberMe = false,
  }) async {
    _error = null;
    _isLoading = true;
    notifyListeners();

    try {
      final result = await authService.login(username, password);

      if (result.success && result.token != null && result.user != null) {
        // Sauvegarder le token
        await _storage.write(key: _tokenKey, value: result.token);
        
        // Sauvegarder le nom d'utilisateur si "se souvenir"
        if (rememberMe) {
          await _storage.write(key: _rememberUserKey, value: username);
        } else {
          await _storage.delete(key: _rememberUserKey);
        }

        _user = result.user;
        _isAuthenticated = true;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = result.error ?? 'Échec de la connexion.';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _error = 'Une erreur est survenue lors de la connexion.';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Déconnexion
  Future<void> logout() async {
    try {
      await authService.logout();
    } catch (_) {}
    
    await _clearAuthData();
    notifyListeners();
  }

  /// Récupérer le nom d'utilisateur mémorisé
  Future<String?> getRememberedUsername() async {
    return await _storage.read(key: _rememberUserKey);
  }

  /// Effacer les données d'authentification
  Future<void> _clearAuthData() async {
    await _storage.delete(key: _tokenKey);
    apiService.setToken(null);
    _user = null;
    _isAuthenticated = false;
  }

  /// Effacer l'erreur
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
