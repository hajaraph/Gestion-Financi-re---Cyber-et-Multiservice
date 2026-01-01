import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';

/// Résultat d'une requête API
class ApiResponse<T> {
  final bool success;
  final T? data;
  final String? error;
  final int? statusCode;

  ApiResponse({required this.success, this.data, this.error, this.statusCode});
}

/// Service de base pour les requêtes API
class ApiService {
  String? _token;

  /// Définir le token d'authentification
  void setToken(String? token) {
    _token = token;
  }

  /// Obtenir le token actuel
  String? get token => _token;

  /// Headers communs pour les requêtes
  Map<String, String> get _headers {
    final headers = {'Content-Type': 'application/json'};
    if (_token != null) {
      headers['Authorization'] = 'Token $_token';
    }
    return headers;
  }

  /// Effectuer une requête GET
  Future<ApiResponse<dynamic>> get(String endpoint) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final response = await http
          .get(uri, headers: _headers)
          .timeout(ApiConfig.requestTimeout);
      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(success: false, error: _parseError(e));
    }
  }

  /// Effectuer une requête POST
  Future<ApiResponse<dynamic>> post(String endpoint, {dynamic body}) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final response = await http
          .post(
            uri,
            headers: _headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.requestTimeout);
      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(success: false, error: _parseError(e));
    }
  }

  /// Effectuer une requête PATCH
  Future<ApiResponse<dynamic>> patch(String endpoint, {dynamic body}) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final response = await http
          .patch(
            uri,
            headers: _headers,
            body: body != null ? jsonEncode(body) : null,
          )
          .timeout(ApiConfig.requestTimeout);
      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(success: false, error: _parseError(e));
    }
  }

  /// Effectuer une requête DELETE
  Future<ApiResponse<dynamic>> delete(String endpoint) async {
    try {
      final uri = Uri.parse('${ApiConfig.baseUrl}$endpoint');
      final response = await http
          .delete(uri, headers: _headers)
          .timeout(ApiConfig.requestTimeout);
      return _handleResponse(response);
    } catch (e) {
      return ApiResponse(success: false, error: _parseError(e));
    }
  }

  /// Traiter la réponse HTTP
  ApiResponse<dynamic> _handleResponse(http.Response response) {
    final statusCode = response.statusCode;

    try {
      final dynamic data = response.body.isNotEmpty
          ? jsonDecode(response.body)
          : null;

      if (statusCode >= 200 && statusCode < 300) {
        return ApiResponse(success: true, data: data, statusCode: statusCode);
      } else {
        String errorMsg = 'Une erreur est survenue.';
        if (data is Map<String, dynamic>) {
          errorMsg = _parseErrorFromData(data);
        } else if (data is String) {
          errorMsg = data;
        }

        return ApiResponse(
          success: false,
          data: data,
          error: errorMsg,
          statusCode: statusCode,
        );
      }
    } catch (e) {
      return ApiResponse(
        success: false,
        error: 'Erreur de parsing: ${response.body}',
        statusCode: statusCode,
      );
    }
  }

  /// Parser le message d'erreur depuis les données
  String _parseErrorFromData(Map<String, dynamic> data) {
    if (data.containsKey('error')) {
      return data['error'].toString();
    }
    if (data.containsKey('detail')) {
      return data['detail'].toString();
    }
    if (data.containsKey('non_field_errors')) {
      final errors = data['non_field_errors'];
      if (errors is List && errors.isNotEmpty) {
        return errors.first.toString();
      }
    }
    // Chercher le premier message d'erreur
    for (var key in data.keys) {
      final value = data[key];
      if (value is List && value.isNotEmpty) {
        return '$key: ${value.first}';
      } else if (value is String) {
        return '$key: $value';
      }
    }
    return 'Une erreur est survenue.';
  }

  /// Parser une exception en message d'erreur
  String _parseError(dynamic e) {
    if (e.toString().contains('SocketException') ||
        e.toString().contains('Connection refused')) {
      return 'Impossible de se connecter au serveur. Vérifiez votre connexion.';
    }
    if (e.toString().contains('TimeoutException')) {
      return 'Le serveur met trop de temps à répondre.';
    }
    return 'Une erreur est survenue: ${e.toString()}';
  }
}

/// Instance globale du service API
final apiService = ApiService();
