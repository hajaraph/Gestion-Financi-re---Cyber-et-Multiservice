import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Sidebar from './components/Sidebar';
import TarifsPage from './components/TarifsPage';
import StockPage from './components/StockPage';
import ProduitsPage from './components/ProduitsPage';
import VenteProduitPage from './components/VenteProduitPage';
import Multiservice from './components/Multiservice';
import DepensesPage from './components/DepensesPage';
import ParametresPage from './components/ParametresPage';
import UserManagementPage from './components/UserManagementPage';
import ConfirmModal from './components/ConfirmModal';
import { AuthProvider, useAuth } from './context/AuthContext';
import { StockAlertProvider } from './context/StockAlertContext';
import PageWrapper from './components/common/PageWrapper';
import { FaBars } from 'react-icons/fa'; // Ajout de l'icône hamburger
import { useState } from 'react';

// Composants de pages (à créer)
const CategoriesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Catégories Services</h1><p>Types de services</p></div>;

const AppContent = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  // Layout principal avec sidebar
  const MainLayout = ({ children }) => {
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

    const getDisplayName = () => {
      if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
      return user?.username || 'Utilisateur';
    };

    return (
      <div className="h-screen w-full bg-gray-50 dark:bg-gray-900 flex flex-col lg:flex-row overflow-hidden">
        {/* Header Mobile */}
        <header className="lg:hidden bg-gray-900 text-white p-4 flex items-center justify-between shadow-md z-30">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileOpen(true)}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FaBars className="w-6 h-6 text-blue-400" />
            </button>
            <h1 className="text-xl font-bold text-blue-400">Cyber Café</h1>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg active:scale-95 transition-transform"
            title="Déconnexion"
          >
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </button>
        </header>

        <Sidebar
          user={user}
          onLogout={() => setShowLogoutModal(true)}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />
        <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 relative h-full">
          {children}
        </main>

        <ConfirmModal
          isOpen={showLogoutModal}
          onClose={() => setShowLogoutModal(false)}
          onConfirm={() => {
            setShowLogoutModal(false);
            logout();
          }}
          title="Confirmer la déconnexion"
          message={`${getDisplayName()}, êtes-vous sûr de vouloir vous déconnecter ?`}
          confirmText="Se déconnecter"
          cancelText="Annuler"
          type="warning"
        />
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner animate-spin"></div>
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="app">
      {!isAuthenticated ? (
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      ) : (
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<MainLayout><PageWrapper><Dashboard /></PageWrapper></MainLayout>} />
          <Route path="/vente-produits" element={<MainLayout><PageWrapper><VenteProduitPage /></PageWrapper></MainLayout>} />
          <Route path="/multiservices" element={<MainLayout><PageWrapper><Multiservice /></PageWrapper></MainLayout>} />
          <Route path="/depenses" element={<MainLayout><PageWrapper><DepensesPage /></PageWrapper></MainLayout>} />
          <Route path="/tarifs" element={<MainLayout><PageWrapper><TarifsPage /></PageWrapper></MainLayout>} />
          <Route path="/stock" element={<MainLayout><PageWrapper><StockPage /></PageWrapper></MainLayout>} />
          <Route path="/produits" element={<MainLayout><PageWrapper><ProduitsPage /></PageWrapper></MainLayout>} />
          <Route path="/categories" element={<MainLayout><PageWrapper><CategoriesPage /></PageWrapper></MainLayout>} />
          <Route path="/utilisateurs" element={<MainLayout><PageWrapper><UserManagementPage user={user} /></PageWrapper></MainLayout>} />
          <Route path="/parametres" element={<MainLayout><PageWrapper><ParametresPage /></PageWrapper></MainLayout>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      )}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <StockAlertProvider>
          <AppContent />
        </StockAlertProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
