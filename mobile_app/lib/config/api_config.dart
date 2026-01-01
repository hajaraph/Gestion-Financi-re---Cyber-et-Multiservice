/// Configuration de l'API
class ApiConfig {
  // URL de base de l'API - À modifier selon l'environnement
  // En développement local avec émulateur Android, utilisez 10.0.2.2
  // En développement local avec appareil physique, utilisez l'IP de votre machine
  static const String baseUrl = 'http://89.88.141.132:8000';

  // Endpoints d'authentification
  static const String loginEndpoint = '/auth/login/';
  static const String logoutEndpoint = '/auth/logout/';
  static const String verifyTokenEndpoint = '/auth/verify-token/';

  // Endpoints de profil
  static const String myProfileEndpoint = '/api/profils/mon_profil/';

  // Endpoint Dashboard
  static const String dashboardStatsEndpoint = '/api/dashboard-stats/';

  // Endpoints Produits
  static const String produitsEndpoint = '/api/produits/';
  static const String categoriesProduitsEndpoint = '/api/categorie-produits/';
  static const String unitesMesureEndpoint = '/api/unite-mesures/';

  // Endpoints Ventes Produits
  static const String ventesProduitsEndpoint = '/api/vente-produits/';

  // Endpoints Tarifs Services
  static const String tarifsEndpoint = '/api/tarifs/';

  // Endpoints Stock
  static const String stocksEndpoint = '/api/stocks/';
  static const String stockAlertsEndpoint = '/api/stock-alerts/';

  // Endpoints Ventes Groupées (Multiservice)
  static const String ventesGroupeesEndpoint = '/api/ventes-groupees/';
  static const String paliersRemiseEndpoint = '/api/paliers-remise/';

  // Endpoints Dépenses
  static const String depensesEndpoint = '/api/depenses/';

  // Endpoints Utilisateurs & Roles
  static const String profilsEndpoint = '/api/profils/';
  static const String rolesEndpoint = '/api/roles/';
  static const String permissionsEndpoint = '/api/permissions/';

  // Timeout pour les requêtes (30 secondes pour les réseaux lents)
  static const Duration requestTimeout = Duration(seconds: 30);
}
