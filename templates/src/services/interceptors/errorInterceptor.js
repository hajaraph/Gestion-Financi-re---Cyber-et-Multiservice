/**
 * Intercepteur pour gérer les erreurs globales
 * Gère les erreurs de réponse et les redirections en cas d'erreur 401
 */

export const setupErrorInterceptor = (apiClient) => {
  return apiClient.interceptors.response.use(
    (response) => {
      return response;
    },
    (error) => {
      const status = error.response?.status;
      const originalRequest = error.config || {};
      const url = originalRequest.url || '';

      if (status === 401) {
        const isLoginCall = url.includes('/auth/login/');
        const isVerifyTokenCall = url.includes('/auth/verify-token/');
        const hasToken = !!localStorage.getItem('authToken');

        // Ne rediriger que si on a un token (session en cours) et que ce n'est pas un appel d'auth.
        if (!isLoginCall && !isVerifyTokenCall && hasToken) {
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          window.location.href = '/';
        }
      }
      //
      // // Log des erreurs pour le débogage
      // console.error('API Error :', error.response?.data || error.message);

      return Promise.reject(error);
    }
  );
};
