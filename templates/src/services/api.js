import axios from 'axios';
import { setupAuthInterceptor, setupErrorInterceptor } from './interceptors';

// Configuration de base d'Axios
// IMPORTANT : On laisse baseURL vide.
// Ainsi, les requêtes seront relatives au domaine actuel (ex: http://localhost/...)
// C'est Nginx (sur le port 80) qui recevra ces requêtes et les redirigera vers le backend (port 8000)
// grâce aux règles "location /api/" et "location /auth/" définies dans nginx.conf.
const API_BASE_URL = '';

// Créer une instance Axios avec configuration par défaut
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 secondes
  headers: {
    'Content-Type': 'application/json',
  },
});

// Configuration des intercepteurs
setupAuthInterceptor(apiClient);
setupErrorInterceptor(apiClient);

// Fonction utilitaire pour gérer les réponses API
const handleApiResponse = async (request) => {
  try {
    const response = await request();
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || error.response?.data?.detail || 'Une erreur est survenue.',
      statusCode: error.response?.status,
    };
  }
};

// Services d'authentification
// Nginx redirige /auth/ vers le backend
export const authAPI = {
  login: async (credentials) => handleApiResponse(() => apiClient.post('/auth/login/', credentials)),
  logout: async () => handleApiResponse(() => apiClient.post('/auth/logout/')),
  verifyToken: async () => handleApiResponse(() => apiClient.get('/auth/verify-token/')),
};

// Services pour les permissions
// Nginx redirige /api/ vers le backend
export const permissionAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/permissions/', { params })),
  create: async (data) => handleApiResponse(() => apiClient.post('/api/permissions/', data)),
  update: async (id, data) => handleApiResponse(() => apiClient.put(`/api/permissions/${id}/`, data)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/permissions/${id}/`)),
  initializePermissions: async () => handleApiResponse(() => apiClient.post('/api/permissions/initialiser_permissions/')),
};

// Services pour les rôles
export const roleAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/roles/', { params })),
  create: async (data) => handleApiResponse(() => apiClient.post('/api/roles/', data)),
  update: async (id, data) => handleApiResponse(() => apiClient.put(`/api/roles/${id}/`, data)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/roles/${id}/`)),
  createDefaultRoles: async () => handleApiResponse(() => apiClient.post('/api/roles/creer_roles_defaut/')),
};

// Services pour les profils utilisateurs
export const profilAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/profils/', { params })),
  create: async (data) => handleApiResponse(() => apiClient.post('/api/profils/', data)),
  update: async (id, data) => handleApiResponse(() => apiClient.put(`/api/profils/${id}/`, data)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/profils/${id}/`)),
  getMyProfile: async () => handleApiResponse(() => apiClient.get('/api/profils/mon_profil/')),
};

// Services pour les transactions
export const transactionAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/transactions/', { params })),
  create: async (transactionData) => handleApiResponse(() => apiClient.post('/api/transactions/', transactionData)),
};

// Services pour les recettes Internet
export const recetteInternetAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/recettes-internet/', { params })),
  create: async (recetteData) => handleApiResponse(() => apiClient.post('/api/recettes-internet/', recetteData)),
};

// Services pour les recettes d'impression
export const recetteImpressionAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/recettes-impression/', { params })),
  create: async (recetteData) => handleApiResponse(() => apiClient.post('/api/recettes-impression/', recetteData)),
};

// Services pour les recettes multiservices
export const recetteMultiserviceAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/recettes-multiservice/', { params })),
  create: async (recetteData) => handleApiResponse(() => apiClient.post('/api/recettes-multiservice/', recetteData)),
};

// Services pour les dépenses
export const depenseAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/depenses/', { params })),
  create: async (payload) => handleApiResponse(() => apiClient.post('/api/depenses/', payload)),
  update: async (id, payload) => handleApiResponse(() => apiClient.put(`/api/depenses/${id}/`, payload)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/depenses/${id}/`)),
  getCategories: async () => handleApiResponse(() => apiClient.get('/api/depenses/categories/')),
};

// Services pour les tarifs
export const tarifAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/tarifs/', { params })),
  create: async (tarifData) => handleApiResponse(() => apiClient.post('/api/tarifs/', tarifData)),
  update: async (id, tarifData) => handleApiResponse(() => apiClient.put(`/api/tarifs/${id}/`, tarifData)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/tarifs/${id}/`)),
};

// Services pour les services personnalisés
export const servicePersonnaliseAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/services-personnalises/', { params })),
  create: async (serviceData) => handleApiResponse(() => apiClient.post('/api/services-personnalises/', serviceData)),
};

// Services pour la gestion des stocks
export const stockAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/stocks/', { params })),
  getHistory: async (id) => handleApiResponse(() => apiClient.get(`/api/stocks/${id}/historique/`)),
  update: async (id, data) => handleApiResponse(() => apiClient.patch(`/api/stocks/${id}/`, data)),
  recordEntry: async (data) => handleApiResponse(() => apiClient.post('/api/stocks/enregistrer_entree/', data)),
  adjustStock: async (id, payload) => handleApiResponse(() => apiClient.post(`/api/stocks/${id}/ajuster_stock/`, payload)),
  revalueStockPrice: async (id, payload) => handleApiResponse(() => apiClient.post(`/api/stocks/${id}/revaluer_prix_moyen/`, payload)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/stocks/${id}/`)),
  getStockAlerts: async () => handleApiResponse(() => apiClient.get('/api/stock-alerts/')),
};

// Services pour les produits (liste pour listes déroulantes)
export const produitAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/produits/', { params })),
  create: async (payload) => handleApiResponse(() => apiClient.post('/api/produits/', payload)),
  update: async (id, payload) => handleApiResponse(() => apiClient.put(`/api/produits/${id}/`, payload)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/produits/${id}/`)),
};

export const categorieProduitAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/categorie-produits/', { params })),
};

export const uniteMesureAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/unite-mesures/', { params })),
};

export const venteProduitAPI = {
  create: async (payload) => handleApiResponse(() => apiClient.post('/api/vente-produits/', payload)),
  getTodaysSales: async () => handleApiResponse(() => apiClient.get('/api/vente-produits/ventes_du_jour/')),
};

export const venteGroupeeAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/ventes-groupees/', { params })),
  create: async (payload) => handleApiResponse(() => apiClient.post('/api/ventes-groupees/', payload)),
  printInvoice: async (id) => handleApiResponse(() => apiClient.get(`/api/ventes-groupees/${id}/imprimer_facture/`, { responseType: 'blob' })),
};

export const parametresEntrepriseAPI = {
  get: async () => handleApiResponse(() => apiClient.get('/api/parametres-entreprise/')),
  update: async (data) => handleApiResponse(() => apiClient.put('/api/parametres-entreprise/', data)),
};

export const dashboardAPI = {
    getStats: async (params = {}) => handleApiResponse(() => apiClient.get('/api/dashboard-stats/', { params })),
};

// Export de l'instance Axios pour des cas spéciaux
export { apiClient };

export default {
  auth: authAPI,
  permissions: permissionAPI,
  roles: roleAPI,
  profils: profilAPI,
  transactions: transactionAPI,
  recettesInternet: recetteInternetAPI,
  recettesImpression: recetteImpressionAPI,
  recettesMultiservice: recetteMultiserviceAPI,
  depenses: depenseAPI,
  tarifs: tarifAPI,
  servicesPersonnalises: servicePersonnaliseAPI,
  produits: produitAPI,
  categorieProduits: categorieProduitAPI,
  uniteMesures: uniteMesureAPI,
  stock: stockAPI,
  venteProduit: venteProduitAPI,
  venteGroupee: venteGroupeeAPI,
  parametresEntreprise: parametresEntrepriseAPI,
  dashboard: dashboardAPI,
  client: apiClient,
};
