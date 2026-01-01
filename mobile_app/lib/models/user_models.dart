import 'dashboard_models.dart';

class UserProfile {
  final int id;
  final String username;
  final String email;
  final String firstName;
  final String lastName;
  final String? telephone;
  final String? poste;
  final bool actif;
  final int? role;
  final String? roleNom;
  final String? heureDebutTravail;
  final String? heureFinTravail;
  final String joursTravail;
  final List<int> permissionsSupplementaires;
  final List<int> permissionsRefusees;

  UserProfile({
    required this.id,
    required this.username,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.telephone,
    this.poste,
    required this.actif,
    this.role,
    this.roleNom,
    this.heureDebutTravail,
    this.heureFinTravail,
    required this.joursTravail,
    required this.permissionsSupplementaires,
    required this.permissionsRefusees,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'],
      username: json['username'] ?? '',
      email: json['email'] ?? '',
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      telephone: json['telephone'],
      poste: json['poste'],
      actif: parseBool(json['actif']),
      role: json['role'],
      roleNom: json['role_nom'],
      heureDebutTravail: json['heure_debut_travail'],
      heureFinTravail: json['heure_fin_travail'],
      joursTravail: json['jours_travail'] ?? '1,2,3,4,5',
      permissionsSupplementaires: List<int>.from(
        json['permissions_supplementaires'] ?? [],
      ),
      permissionsRefusees: List<int>.from(json['permissions_refusees'] ?? []),
    );
  }

  String get displayName => '$firstName $lastName'.trim().isNotEmpty
      ? '$firstName $lastName'
      : username;
}

class Role {
  final int id;
  final String nom;
  final String? description;
  final List<int> permissionsIds;

  Role({
    required this.id,
    required this.nom,
    this.description,
    required this.permissionsIds,
  });

  factory Role.fromJson(Map<String, dynamic> json) {
    return Role(
      id: json['id'] ?? 0,
      nom: json['nom'] ?? json['name'] ?? 'Inconnu',
      description: json['description'],
      permissionsIds: List<int>.from(
        json['permissions'] ?? json['permissions_ids'] ?? [],
      ),
    );
  }
}

class Permission {
  final int id;
  final String nom;
  final String code;
  final String? description;

  Permission({
    required this.id,
    required this.nom,
    required this.code,
    this.description,
  });

  factory Permission.fromJson(Map<String, dynamic> json) {
    return Permission(
      id: json['id'] ?? 0,
      nom: json['nom'] ?? json['name'] ?? json['label'] ?? 'Sans nom',
      code: json['code'] ?? json['codename'] ?? '',
      description: json['description'],
    );
  }
}

class ProfilResult {
  final bool success;
  final List<UserProfile> profils;
  final int count;
  final String? error;

  ProfilResult({
    required this.success,
    this.profils = const [],
    this.count = 0,
    this.error,
  });
}

class RoleResult {
  final bool success;
  final List<Role> roles;
  final String? error;

  RoleResult({required this.success, this.roles = const [], this.error});
}

class PermissionResult {
  final bool success;
  final List<Permission> permissions;
  final String? error;

  PermissionResult({
    required this.success,
    this.permissions = const [],
    this.error,
  });
}
