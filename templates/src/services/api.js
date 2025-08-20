import axios from 'axios';

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

// Intercepteur pour ajouter automatiquement le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les réponses et les erreurs
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Gestion globale des erreurs
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      window.location.href = '/'; // Rediriger vers la page de connexion
    }

    // Log des erreurs pour le debugging
    console.error('API Error:', error.response?.data || error.message);

    return Promise.reject(error);
  }
);

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
  logout: async () => {
    try {
      await apiClient.post('/auth/logout/');
      return { success: true };
    } catch {
      // Même en cas d'erreur, on considère la déconnexion locale comme réussie
      return { success: true };
    }
  },

  // Vérification du token
  verifyToken: async () => {
    try {
      const response = await apiClient.get('/auth/verify-token/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Token invalide'
      };
    }
  },

  // Inscription (optionnelle)
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register/', userData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de l\'inscription'
      };
    }
  }
};

// Services pour les transactions
export const transactionAPI = {
  // Récupérer toutes les transactions
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/transactions/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des transactions'
      };
    }
  },

  // Créer une nouvelle transaction
  create: async (transactionData) => {
    try {
      const response = await apiClient.post('/api/transactions/', transactionData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création de la transaction'
      };
    }
  },

  // Résumé journalier
  getDailySummary: async () => {
    try {
      const response = await apiClient.get('/api/transactions/resume_journalier/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération du résumé'
      };
    }
  },

  // Résumé mensuel
  getMonthlySummary: async () => {
    try {
      const response = await apiClient.get('/api/transactions/resume_mensuel/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération du résumé mensuel'
      };
    }
  }
};

// Services pour les recettes Internet
export const recetteInternetAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/recettes-internet/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des recettes Internet'
      };
    }
  },

  create: async (recetteData) => {
    try {
      const response = await apiClient.post('/api/recettes-internet/', recetteData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création de la recette Internet'
      };
    }
  },

  getStats: async () => {
    try {
      const response = await apiClient.get('/api/recettes-internet/statistiques_forfaits/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des statistiques'
      };
    }
  }
};

// Services pour les recettes d'impression
export const recetteImpressionAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/recettes-impression/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des recettes d\'impression'
      };
    }
  },

  create: async (recetteData) => {
    try {
      const response = await apiClient.post('/api/recettes-impression/', recetteData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création de la recette d\'impression'
      };
    }
  }
};

// Services pour les recettes multiservices
export const recetteMultiserviceAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/recettes-multiservice/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des recettes multiservice'
      };
    }
  },

  create: async (recetteData) => {
    try {
      const response = await apiClient.post('/api/recettes-multiservice/', recetteData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création de la recette multiservice'
      };
    }
  }
};

// Services pour les dépenses
export const depenseAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/depenses/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des dépenses'
      };
    }
  },

  create: async (depenseData) => {
    try {
      const response = await apiClient.post('/api/depenses/', depenseData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création de la dépense'
      };
    }
  },

  getStatsByCategory: async () => {
    try {
      const response = await apiClient.get('/api/depenses/par_categorie/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des statistiques par catégorie'
      };
    }
  }
};

// Services pour les tarifs
export const tarifAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/tarifs/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des tarifs'
      };
    }
  },

  create: async (tarifData) => {
    try {
      const response = await apiClient.post('/api/tarifs/', tarifData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création du tarif'
      };
    }
  },

  update: async (id, tarifData) => {
    try {
      const response = await apiClient.put(`/api/tarifs/${id}/`, tarifData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la modification du tarif'
      };
    }
  },

  delete: async (id) => {
    try {
      await apiClient.delete(`/api/tarifs/${id}/`);
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la suppression du tarif'
      };
    }
  },

  getByCategory: async () => {
    try {
      const response = await apiClient.get('/api/tarifs/par_categorie/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des tarifs par catégorie'
      };
    }
  },

  getAvailableCodes: async () => {
    try {
      const response = await apiClient.get('/api/tarifs/codes_disponibles/');
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des codes disponibles'
      };
    }
  },

  importDefaults: async () => {
    try {
      const response = await apiClient.post('/api/tarifs/import_tarifs_defaut/');
      return {
        success: true,
        data: response.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de l\'importation des tarifs par défaut'
      };
    }
  },

  duplicate: async (id, nouveauNom) => {
    try {
      const response = await apiClient.post(`/api/tarifs/${id}/dupliquer/`, {
        nouveau_nom: nouveauNom
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la duplication du tarif'
      };
    }
  }
};

// Services pour les services personnalisés
export const servicePersonnaliseAPI = {
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/services-personnalises/', { params });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la récupération des services personnalisés'
      };
    }
  },

  create: async (serviceData) => {
    try {
      const response = await apiClient.post('/api/services-personnalises/', serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création du service personnalisé'
      };
    }
  },

  createQuick: async (serviceData) => {
    try {
      const response = await apiClient.post('/api/services-personnalises/service_rapide/', serviceData);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Erreur lors de la création du service rapide'
      };
    }
  }
};

// Services pour la gestion des stocks
export const stockAPI = {
  // Récupérer tous les stocks
  getAll: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/stocks/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching stocks:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Récupérer un stock par ID
  getById: async (id) => {
    try {
      const response = await apiClient.get(`/api/stocks/${id}/`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error fetching stock ${id}:`, error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Créer un nouveau produit en stock
  createProduct: async (productData) => {
    try {
      const response = await apiClient.post('/api/stocks/', productData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating stock product:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Mettre à jour un produit en stock
  updateProduct: async (id, productData) => {
    try {
      const response = await apiClient.patch(`/api/stocks/${id}/`, productData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error updating stock product ${id}:`, error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Supprimer un produit du stock
  deleteProduct: async (id) => {
    try {
      await apiClient.delete(`/api/stocks/${id}/`);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting stock product ${id}:`, error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Créer un mouvement de stock
  createMovement: async (movementData) => {
    try {
      const response = await apiClient.post('/api/mouvements-stock/', movementData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error creating stock movement:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Récupérer l'historique des mouvements de stock
  getMovementHistory: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/mouvements-stock/', { params });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Récupérer les statistiques de stock
  getStats: async () => {
    try {
      const response = await apiClient.get('/api/stocks/stats/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error fetching stock stats:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Générer un rapport de stock
  generateReport: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/stocks/generate-report/', { 
        params,
        responseType: 'blob' 
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error generating stock report:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  },

  // Vérifier les alertes de stock (rupture, seuil bas)
  checkStockAlerts: async () => {
    try {
      const response = await apiClient.get('/api/stocks/check-alerts/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Error checking stock alerts:', error);
      return { success: false, error: error.response?.data || error.message };
    }
  }
};

// Export de l'instance Axios pour des cas spéciaux
export { apiClient };

export default {
  auth: authAPI,
  transactions: transactionAPI,
  recettesInternet: recetteInternetAPI,
  recettesImpression: recetteImpressionAPI,
  recettesMultiservice: recetteMultiserviceAPI,
  depenses: depenseAPI,
  tarifs: tarifAPI,
  servicesPersonnalises: servicePersonnaliseAPI,
  client: apiClient,
};
