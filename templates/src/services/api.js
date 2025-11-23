import axios from 'axios';
import { setupAuthInterceptor, setupErrorInterceptor } from './interceptors';

// Configuration de base d'Axios
const API_BASE_URL = 'http://127.0.0.1:8000';

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
      error: error.response?.data || error.message,
      statusCode: error.response?.status,
    };
  }
};

// Services d'authentification
export const authAPI = {
  // Connexion
  login: async (credentials) => {
    try {
      const response = await apiClient.post('/auth/login/', credentials);

      // Vérifier si la réponse est valide
      if (!response.data || !response.data.token) {
        return {
          success: false,
          error: 'Réponse invalide du serveur'
        };
      }

      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      // Gestion détaillée des erreurs
      if (error.response) {
        // Erreur avec réponse du serveur (4xx, 5xx)
        const errorMessage = error.response.data?.error ||
                           error.response.data?.detail ||
                           'Erreur de connexion';
        return {
          success: false,
          error: errorMessage
        };
      } else if (error.request) {
        // Pas de réponse du serveur
        return {
          success: false,
          error: 'Impossible de se connecter au serveur. Vérifiez votre connexion.'
        };
      }

      // Erreur inattendue
      return {
        success: false,
        error: 'Une erreur inattendue est survenue.'
      };
    }
  },

  // Déconnexion
  logout: async () => handleApiResponse(() => apiClient.post('/auth/logout/')),

  // Vérification du token
  verifyToken: async () => handleApiResponse(() => apiClient.get('/auth/verify-token/')),

  // Inscription (optionnelle)
  register: async (userData) => handleApiResponse(() => apiClient.post('/auth/register/', userData)),
};

// Services pour les permissions
export const permissionAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/permissions/', { params })),
  getById: async (id) => handleApiResponse(() => apiClient.get(`/api/permissions/${id}/`)),
  create: async (data) => handleApiResponse(() => apiClient.post('/api/permissions/', data)),
  update: async (id, data) => handleApiResponse(() => apiClient.put(`/api/permissions/${id}/`, data)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/permissions/${id}/`)),
  initializePermissions: async () => handleApiResponse(() => apiClient.post('/api/permissions/initialiser_permissions/')),
  getPermissionsByModule: async () => handleApiResponse(() => apiClient.get('/api/permissions/par_module/')),
};

// Services pour les rôles
export const roleAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/roles/', { params })),
  getById: async (id) => handleApiResponse(() => apiClient.get(`/api/roles/${id}/`)),
  create: async (data) => handleApiResponse(() => apiClient.post('/api/roles/', data)),
  update: async (id, data) => handleApiResponse(() => apiClient.put(`/api/roles/${id}/`, data)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/roles/${id}/`)),
  createDefaultRoles: async () => handleApiResponse(() => apiClient.post('/api/roles/creer_roles_defaut/')),
  duplicateRole: async (id, newName) => handleApiResponse(() => apiClient.post(`/api/roles/${id}/dupliquer/`, { nouveau_nom: newName })),
};

// Services pour les profils utilisateurs
export const profilAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/profils/', { params })),
  getById: async (id) => handleApiResponse(() => apiClient.get(`/api/profils/${id}/`)),
  create: async (data) => handleApiResponse(() => apiClient.post('/api/profils/', data)),
  update: async (id, data) => handleApiResponse(() => apiClient.put(`/api/profils/${id}/`, data)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/profils/${id}/`)),
  checkPermission: async (userId, permissionCode) => handleApiResponse(() => apiClient.post('/api/profils/verifier_permission/', { user_id: userId, permission_code: permissionCode })),
  modifyPermissions: async (id, data) => handleApiResponse(() => apiClient.post(`/api/profils/${id}/modifier_permissions/`, data)),
  getMyProfile: async () => handleApiResponse(() => apiClient.get('/api/profils/mon_profil/')),
};

// Services pour les transactions
export const transactionAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/transactions/', { params })),
  create: async (transactionData) => handleApiResponse(() => apiClient.post('/api/transactions/', transactionData)),
  getDailySummary: async () => handleApiResponse(() => apiClient.get('/api/transactions/resume_journalier/')),
  getMonthlySummary: async () => handleApiResponse(() => apiClient.get('/api/transactions/resume_mensuel/')),
};

// Services pour les recettes Internet
export const recetteInternetAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/recettes-internet/', { params })),
  create: async (recetteData) => handleApiResponse(() => apiClient.post('/api/recettes-internet/', recetteData)),
  getStats: async () => handleApiResponse(() => apiClient.get('/api/recettes-internet/statistiques_forfaits/')),
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
  getStatsByCategory: async () => handleApiResponse(() => apiClient.get('/api/depenses/par_categorie/')),
  getCategories: async () => handleApiResponse(() => apiClient.get('/api/depenses/categories/')),
};

// Services pour les tarifs
export const tarifAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/tarifs/', { params })),
  create: async (tarifData) => handleApiResponse(() => apiClient.post('/api/tarifs/', tarifData)),
  update: async (id, tarifData) => handleApiResponse(() => apiClient.put(`/api/tarifs/${id}/`, tarifData)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/tarifs/${id}/`)),
  getByCategory: async () => handleApiResponse(() => apiClient.get('/api/tarifs/par_categorie/')),
  getAvailableCodes: async () => handleApiResponse(() => apiClient.get('/api/tarifs/codes_disponibles/')),
  importDefaults: async () => handleApiResponse(() => apiClient.post('/api/tarifs/import_tarifs_defaut/')),
  duplicate: async (id, nouveauNom) => handleApiResponse(() => apiClient.post(`/api/tarifs/${id}/dupliquer/`, { nouveau_nom: nouveauNom })),
};

// Services pour les services personnalisés
export const servicePersonnaliseAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/services-personnalises/', { params })),
  create: async (serviceData) => handleApiResponse(() => apiClient.post('/api/services-personnalises/', serviceData)),
  createQuick: async (serviceData) => handleApiResponse(() => apiClient.post('/api/services-personnalises/service_rapide/', serviceData)),
};

// Services pour la gestion des stocks
export const stockAPI = {
  getAll: async (params = {}) => handleApiResponse(() => apiClient.get('/api/stocks/', { params })),
  getHistory: async (id) => handleApiResponse(() => apiClient.get(`/api/stocks/${id}/historique/`)), // Ajouté
  update: async (id, data) => handleApiResponse(() => apiClient.patch(`/api/stocks/${id}/`, data)),
  recordEntry: async (data) => handleApiResponse(() => apiClient.post('/api/stocks/enregistrer_entree/', data)),
  adjustStock: async (id, payload) => handleApiResponse(() => apiClient.post(`/api/stocks/${id}/ajuster_stock/`, payload)),
  revalueStockPrice: async (id, payload) => handleApiResponse(() => apiClient.post(`/api/stocks/${id}/revaluer_prix_moyen/`, payload)),
  delete: async (id) => handleApiResponse(() => apiClient.delete(`/api/stocks/${id}/`)),
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
  partialUpdate: async (data) => handleApiResponse(() => apiClient.patch('/api/parametres-entreprise/', data)),
};

// Export de l'instance Axios pour des cas spéciaux
export { apiClient };

export default {
  auth: authAPI,
  permissions: permissionAPI, // NOUVEAU
  roles: roleAPI,             // NOUVEAU
  profils: profilAPI,         // NOUVEAU
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
  client: apiClient,
};
