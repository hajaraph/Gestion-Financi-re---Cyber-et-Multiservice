import '../config/api_config.dart';
import '../models/user_models.dart';
import 'api_service.dart';

class UserService {
  Future<ProfilResult> getProfils({
    int page = 1,
    int pageSize = 20,
    String? search,
  }) async {
    try {
      String endpoint =
          '${ApiConfig.profilsEndpoint}?page=$page&page_size=$pageSize';
      if (search != null && search.isNotEmpty) {
        endpoint += '&search=${Uri.encodeQueryComponent(search)}';
      }

      final response = await apiService.get(endpoint);

      if (response.success && response.data != null) {
        final data = response.data!;
        if (data is Map<String, dynamic> && data.containsKey('results')) {
          final List<dynamic> results = data['results'];
          return ProfilResult(
            success: true,
            profils: results.map((json) => UserProfile.fromJson(json)).toList(),
            count: data['count'] ?? results.length,
          );
        } else if (data is List) {
          return ProfilResult(
            success: true,
            profils: data.map((json) => UserProfile.fromJson(json)).toList(),
            count: data.length,
          );
        }
      }
      return ProfilResult(success: false, error: response.error);
    } catch (e) {
      return ProfilResult(success: false, error: e.toString());
    }
  }

  Future<RoleResult> getRoles() async {
    try {
      final response = await apiService.get(ApiConfig.rolesEndpoint);
      if (response.success && response.data != null) {
        final data = response.data!;
        final List<dynamic> results = data is List
            ? data
            : data['results'] ?? [];
        return RoleResult(
          success: true,
          roles: results.map((json) => Role.fromJson(json)).toList(),
        );
      }
      return RoleResult(success: false, error: response.error);
    } catch (e) {
      return RoleResult(success: false, error: e.toString());
    }
  }

  Future<PermissionResult> getPermissions() async {
    try {
      final response = await apiService.get(ApiConfig.permissionsEndpoint);
      if (response.success && response.data != null) {
        final data = response.data!;
        final List<dynamic> results = data is List
            ? data
            : data['results'] ?? [];
        return PermissionResult(
          success: true,
          permissions: results
              .map((json) => Permission.fromJson(json))
              .toList(),
        );
      }
      return PermissionResult(success: false, error: response.error);
    } catch (e) {
      return PermissionResult(success: false, error: e.toString());
    }
  }

  Future<bool> createUserProfile(Map<String, dynamic> data) async {
    try {
      final response = await apiService.post(
        ApiConfig.profilsEndpoint,
        body: data,
      );
      return response.success;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateUserProfile(int id, Map<String, dynamic> data) async {
    try {
      final response = await apiService.patch(
        '${ApiConfig.profilsEndpoint}$id/',
        body: data,
      );
      return response.success;
    } catch (e) {
      return false;
    }
  }

  Future<bool> deleteUserProfile(int id) async {
    try {
      final response = await apiService.delete(
        '${ApiConfig.profilsEndpoint}$id/',
      );
      return response.success;
    } catch (e) {
      return false;
    }
  }

  Future<Map<String, dynamic>> initializePermissions() async {
    try {
      final response = await apiService.post(
        '${ApiConfig.permissionsEndpoint}initialiser_permissions/',
      );
      if (response.success && response.data != null) {
        return {'success': true, 'message': response.data!['message']};
      }
      return {'success': false, 'error': response.error};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }

  Future<Map<String, dynamic>> createDefaultRoles() async {
    try {
      final response = await apiService.post(
        '${ApiConfig.rolesEndpoint}creer_roles_defaut/',
      );
      if (response.success && response.data != null) {
        return {'success': true, 'message': response.data!['message']};
      }
      return {'success': false, 'error': response.error};
    } catch (e) {
      return {'success': false, 'error': e.toString()};
    }
  }
}

final userService = UserService();
