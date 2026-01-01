/// Modèles de données pour le Dashboard
library;

/// Helper pour parser une valeur qui peut être un nombre ou une chaîne
double parseDouble(dynamic value) {
  if (value == null) return 0.0;
  if (value is num) return value.toDouble();
  if (value is String) {
    return double.tryParse(value) ?? 0.0;
  }
  return 0.0;
}

/// Helper pour parser un entier qui peut être un nombre ou une chaîne
int parseInt(dynamic value) {
  if (value == null) return 0;
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) {
    // Essayer d'abord comme int, sinon comme double puis convertir
    final intVal = int.tryParse(value);
    if (intVal != null) return intVal;
    final doubleVal = double.tryParse(value);
    if (doubleVal != null) return doubleVal.toInt();
    return 0;
  }
  return 0;
}

/// Helper pour parser un booléen qui peut être un booléen, un entier (0/1) ou une chaîne
bool parseBool(dynamic value) {
  if (value == null) return false;
  if (value is bool) return value;
  if (value is int) return value != 0;
  if (value is String) {
    final s = value.toLowerCase();
    return s == 'true' || s == '1' || s == 'yes' || s == 'on';
  }
  return false;
}

/// Statistique principale avec variation
class StatistiqueItem {
  final double valeur;
  final double? variation;

  StatistiqueItem({required this.valeur, this.variation});

  factory StatistiqueItem.fromJson(Map<String, dynamic> json) {
    return StatistiqueItem(
      valeur: parseDouble(json['valeur']),
      variation: json['variation'] != null
          ? parseDouble(json['variation'])
          : null,
    );
  }
}

/// Statistiques principales du dashboard
class StatistiquesPrincipales {
  final StatistiqueItem recettesJour;
  final StatistiqueItem sessionsInternet;
  final StatistiqueItem documentsImprimes;
  final StatistiqueItem depensesJour;

  StatistiquesPrincipales({
    required this.recettesJour,
    required this.sessionsInternet,
    required this.documentsImprimes,
    required this.depensesJour,
  });

  factory StatistiquesPrincipales.fromJson(Map<String, dynamic> json) {
    return StatistiquesPrincipales(
      recettesJour: StatistiqueItem.fromJson(json['recettes_jour'] ?? {}),
      sessionsInternet: StatistiqueItem.fromJson(
        json['sessions_internet'] ?? {},
      ),
      documentsImprimes: StatistiqueItem.fromJson(
        json['documents_imprimes'] ?? {},
      ),
      depensesJour: StatistiqueItem.fromJson(json['depenses_jour'] ?? {}),
    );
  }
}

/// Service populaire
class ServicePopulaire {
  final String nomService;
  final double totalMontant;
  final int nombreUtilisations;

  ServicePopulaire({
    required this.nomService,
    required this.totalMontant,
    required this.nombreUtilisations,
  });

  factory ServicePopulaire.fromJson(Map<String, dynamic> json) {
    return ServicePopulaire(
      nomService:
          json['tarif_service__nom_service']?.toString() ?? 'Service inconnu',
      totalMontant: parseDouble(json['total_montant']),
      nombreUtilisations: parseInt(json['nombre_utilisations']),
    );
  }
}

/// Activité récente (transaction)
class ActiviteRecente {
  final int id;
  final String description;
  final double montant;
  final String typeTransaction;
  final String categorieServiceNom;
  final DateTime dateTransaction;

  ActiviteRecente({
    required this.id,
    required this.description,
    required this.montant,
    required this.typeTransaction,
    required this.categorieServiceNom,
    required this.dateTransaction,
  });

  factory ActiviteRecente.fromJson(Map<String, dynamic> json) {
    return ActiviteRecente(
      id: parseInt(json['id']),
      description: json['description']?.toString() ?? '',
      montant: parseDouble(json['montant']),
      typeTransaction: json['type_transaction']?.toString() ?? 'RECETTE',
      categorieServiceNom: json['categorie_service_nom']?.toString() ?? '',
      dateTransaction:
          DateTime.tryParse(json['date_transaction']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  bool get isRecette => typeTransaction == 'RECETTE';
}

/// Résumé financier
class ResumeFinancier {
  final double totalRecettes;
  final double totalDepenses;
  final double beneficeNet;

  ResumeFinancier({
    required this.totalRecettes,
    required this.totalDepenses,
    required this.beneficeNet,
  });

  factory ResumeFinancier.fromJson(Map<String, dynamic> json) {
    return ResumeFinancier(
      totalRecettes: parseDouble(json['total_recettes']),
      totalDepenses: parseDouble(json['total_depenses']),
      beneficeNet: parseDouble(json['benefice_net']),
    );
  }
}

/// Modèle complet des statistiques du Dashboard
class DashboardStats {
  final StatistiquesPrincipales statistiquesPrincipales;
  final List<ServicePopulaire> servicesPopulaires;
  final List<ActiviteRecente> activiteRecente;
  final ResumeFinancier resumeFinancier;

  DashboardStats({
    required this.statistiquesPrincipales,
    required this.servicesPopulaires,
    required this.activiteRecente,
    required this.resumeFinancier,
  });

  factory DashboardStats.fromJson(Map<String, dynamic> json) {
    return DashboardStats(
      statistiquesPrincipales: StatistiquesPrincipales.fromJson(
        json['statistiques_principales'] ?? {},
      ),
      servicesPopulaires:
          (json['services_populaires'] as List<dynamic>?)
              ?.map((e) => ServicePopulaire.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      activiteRecente:
          (json['activite_recente'] as List<dynamic>?)
              ?.map((e) => ActiviteRecente.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      resumeFinancier: ResumeFinancier.fromJson(json['resume_financier'] ?? {}),
    );
  }

  /// Calcul du total des revenus des services populaires
  double get totalRevenueServices {
    return servicesPopulaires.fold(0.0, (sum, s) => sum + s.totalMontant);
  }
}
