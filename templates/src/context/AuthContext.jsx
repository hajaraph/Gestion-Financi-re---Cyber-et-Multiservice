import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI, profilAPI } from '../services/api';
import { apiClient } from '../services/api';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadUserProfile = React.useCallback(async () => {
    const profileResult = await profilAPI.getMyProfile();
    if (profileResult.success) {
      const fullUser = {
        ...profileResult.data,
        permissions: profileResult.data.permissions_effectives || [],
      };
      setUser(fullUser);
      setIsAuthenticated(true);
      return true;
    }
    // Si le profil ne peut être chargé, on déconnecte
    logout();
    return false;
  }, []);

  useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;
        const response = await authAPI.verifyToken();
        if (response.success) {
          // Token valide, on charge le profil complet
          await loadUserProfile();
        } else {
          // Token invalide
          logout();
        }
      }
      setIsLoading(false);
    };
    verifyUser();
  }, [loadUserProfile]);

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      if (response.success) {
        const { token } = response.data;
        localStorage.setItem('token', token);
        apiClient.defaults.headers.common['Authorization'] = `Token ${token}`;

        // Après la connexion, charger le profil complet
        const profileLoaded = await loadUserProfile();
        if (profileLoaded) {
          return { success: true };
        } else {
          return { success: false, error: "Impossible de charger le profil utilisateur." };
        }
      } else {
        return { success: false, error: response.error };
      }
      // eslint-disable-next-line no-unused-vars
    } catch (error) {
      return { success: false, error: 'Une erreur est survenue lors de la connexion.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser: loadUserProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};
