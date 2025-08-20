import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import TarifsPage from './components/TarifsPage';
import RecettesPage from './components/RecettesPage';
import StockPage from './components/StockPage';
import { authAPI } from './services/api';

// Composants de pages (à créer)
const InternetPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Services Internet</h1><p>Gestion des forfaits Internet</p></div>;
const MultiservicesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Multiservices</h1><p>Photocopie, reliure, plastification</p></div>;
const DepensesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Dépenses</h1><p>Gestion des dépenses</p></div>;
const CategoriesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Catégories Services</h1><p>Types de services</p></div>;
const UtilisateursPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Utilisateurs</h1><p>Gestion des profils</p></div>;
const ParametresPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Paramètres</h1><p>Configuration système</p></div>;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Vérifier si l'utilisateur est déjà connecté au chargement de l'application
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('authToken');

      if (token) {
        // Utiliser le service API centralisé pour vérifier le token
        const result = await authAPI.verifyToken();

        if (result.success && result.data.valid) {
          // Token valide, connecter l'utilisateur
          setIsAuthenticated(true);
          setUser(result.data.user);
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
  const handleLogin = (userData) => {
    // Vérifier que les données utilisateur sont valides
    if (userData && userData.token) {
      // Sauvegarder les informations d'authentification
      localStorage.setItem('authToken', userData.token);
      localStorage.setItem('userData', JSON.stringify(userData));

      // Mettre à jour l'état
      setIsAuthenticated(true);
      setUser(userData);
      return true;
    }
    return false;
  };

  // Fonction de déconnexion
  const handleLogout = async () => {
    const rememberUser = localStorage.getItem('rememberUser');

    // Utiliser le service API centralisé pour la déconnexion
    await authAPI.logout();

    // Supprimer les données d'authentification
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');

    // Garder le nom d'utilisateur si "rester connecté" était coché
    if (!rememberUser) {
      localStorage.removeItem('rememberUser');
    }

    // Mettre à jour l'état
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
          // Afficher le formulaire de connexion
          <Login onLogin={handleLogin} />
        ) : (
          // Interface principale avec routage
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={
              <MainLayout>
                <Dashboard user={user} />
              </MainLayout>
            } />
            <Route path="/recettes" element={
              <MainLayout>
                <RecettesPage />
              </MainLayout>
            } />
            <Route path="/internet" element={
              <MainLayout>
                <InternetPage />
              </MainLayout>
            } />
            <Route path="/multiservices" element={
              <MainLayout>
                <MultiservicesPage />
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
            <Route path="/categories" element={
              <MainLayout>
                <CategoriesPage />
              </MainLayout>
            } />
            <Route path="/utilisateurs" element={
              <MainLayout>
                <UtilisateursPage />
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
