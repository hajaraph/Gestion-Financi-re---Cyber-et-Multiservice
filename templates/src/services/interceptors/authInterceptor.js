/**
 * Intercepteur pour gérer l'authentification
 * Ajoute automatiquement le token d'authentification aux requêtes sortantes
 */

export const setupAuthInterceptor = (apiClient) => {
  return apiClient.interceptors.request.use(
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
};
