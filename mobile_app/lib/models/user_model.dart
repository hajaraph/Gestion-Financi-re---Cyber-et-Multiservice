/// Modèle utilisateur
class User {
  final int id;
  final String username;
  final String? firstName;
  final String? lastName;
  final String? email;
  final bool isActive;
  final bool isSuperuser;
  final String? roleNom;
  final List<String> permissions;

  User({
    required this.id,
    required this.username,
    this.firstName,
    this.lastName,
    this.email,
    this.isActive = true,
    this.isSuperuser = false,
    this.roleNom,
    this.permissions = const [],
  });

  /// Création depuis JSON (réponse API)
  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] ?? 0,
      username: json['username'] ?? '',
      firstName: json['first_name'],
      lastName: json['last_name'],
      email: json['email'],
      isActive: json['is_active'] ?? true,
      isSuperuser: json['is_superuser'] ?? false,
      roleNom: json['role_nom'],
      permissions: List<String>.from(json['permissions_effectives'] ?? []),
    );
  }

  /// Conversion en JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'username': username,
      'first_name': firstName,
      'last_name': lastName,
      'email': email,
      'is_active': isActive,
      'is_superuser': isSuperuser,
      'role_nom': roleNom,
      'permissions_effectives': permissions,
    };
  }

  /// Nom d'affichage complet
  String get displayName {
    if (firstName != null &&
        lastName != null &&
        firstName!.isNotEmpty &&
        lastName!.isNotEmpty) {
      return '$firstName $lastName';
    }
    return username;
  }

  /// Initiales pour l'avatar
  String get initials {
    if (firstName != null &&
        lastName != null &&
        firstName!.isNotEmpty &&
        lastName!.isNotEmpty) {
      return '${firstName![0]}${lastName![0]}'.toUpperCase();
    }
    return username.isNotEmpty ? username[0].toUpperCase() : 'U';
  }

  /// Vérifier si l'utilisateur a une permission
  bool hasPermission(String permissionCode) {
    if (isSuperuser) return true;
    return permissions.contains(permissionCode);
  }
}
