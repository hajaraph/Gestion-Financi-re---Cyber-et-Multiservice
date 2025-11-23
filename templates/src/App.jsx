import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import TarifsPage from './components/TarifsPage';
import StockPage from './components/StockPage';
import { authAPI, profilAPI } from './services/api'; // Import de profilAPI
import ProduitsPage from './components/ProduitsPage';
import VenteProduitPage from './components/VenteProduitPage';
import Multiservice from './components/Multiservice';
import DepensesPage from './components/DepensesPage';
import ParametresPage from './components/ParametresPage';
import UserManagementPage from './components/UserManagementPage'; // Import du nouveau composant

// Composants de pages (à créer)
const CategoriesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Catégories Services</h1><p>Types de services</p></div>;


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fonction pour charger le profil utilisateur complet
  const loadUserProfile = async () => {
    const profileResult = await profilAPI.getMyProfile();
    if (profileResult.success) {
      // CORRECTION : Utiliser directement les données du profil et ajouter un champ 'permissions' pour la commodité
      const fullUser = {
        ...profileResult.data, // Contient déjà username, email, is_superuser, role, etc.
        permissions: profileResult.data.permissions_effectives, // Simplifier l'accès aux permissions
      };
      setUser(fullUser);
      return fullUser;
    }
    return null;
  };

  // Vérifier si l'utilisateur est déjà connecté au chargement de l'application
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        const result = await authAPI.verifyToken();

        if (result.success && result.data.valid) {
          // Token valide, charger le profil utilisateur complet
          const fullUser = await loadUserProfile();
          if (fullUser) {
            setIsAuthenticated(true);
          } else {
            // Échec du chargement du profil, déconnecter
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // Token invalide, nettoyer le localStorage
          localStorage.removeItem('authToken');
          localStorage.removeItem('userData');
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        // Pas de token, vérifier si "rester connecté" était coché
        const rememberUser = localStorage.getItem('rememberUser');
        if (rememberUser) {
          setIsAuthenticated(false);
          setUser(null);
        }
      }

      setIsLoading(false);
    };

    // Simuler un délai de vérification d'authentification
    setTimeout(checkAuthStatus, 500);
  }, []);

  // Fonction appelée lors de la tentative de connexion
  const handleLogin = async (userData) => {
    try {
      if (userData && userData.token) {
        localStorage.setItem('authToken', userData.token);
        localStorage.setItem('userData', JSON.stringify(userData));

        // Après une connexion réussie, charger le profil complet
        const fullUser = await loadUserProfile();
        if (fullUser) {
          setIsAuthenticated(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      return false;
    }
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    const rememberUser = localStorage.getItem('rememberUser');

    await authAPI.logout();

    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');

    if (!rememberUser) {
      localStorage.removeItem('rememberUser');
    }

    setIsAuthenticated(false);
    setUser(null);
  };

  // Layout principal avec sidebar
  const MainLayout = ({ children }) => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      <Sidebar user={user} onLogout={handleLogout} />
      <main className="flex-1 p-4 overflow-auto min-h-screen">
        {children}
      </main>
    </div>
  );

  // Affichage du loader pendant la vérification d'authentification
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner animate-spin"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="app">
        {!isAuthenticated ? (
          <Login onLogin={handleLogin} />
        ) : (
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <MainLayout>
                <Dashboard user={user} />
              </MainLayout>
            } />
            <Route path="/vente-produits" element={
              <MainLayout>
                <VenteProduitPage />
              </MainLayout>
            } />
            <Route path="/multiservices" element={
              <MainLayout>
                <Multiservice />
              </MainLayout>
            } />
            <Route path="/depenses" element={
              <MainLayout>
                <DepensesPage />
              </MainLayout>
            } />
            <Route path="/tarifs" element={
              <MainLayout>
                <TarifsPage />
              </MainLayout>
            } />
            <Route path="/stock" element={
              <MainLayout>
                <StockPage />
              </MainLayout>
            } />
            <Route path="/produits" element={
              <MainLayout>
                <ProduitsPage />
              </MainLayout>
            } />
            <Route path="/categories" element={
              <MainLayout>
                <CategoriesPage />
              </MainLayout>
            } />
            <Route path="/utilisateurs" element={
              <MainLayout>
                <UserManagementPage user={user} />
              </MainLayout>
            } />
            <Route path="/parametres" element={
              <MainLayout>
                <ParametresPage />
              </MainLayout>
            } />
            {/* Route de fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;
