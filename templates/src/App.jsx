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
import { AuthProvider, useAuth } from './context/AuthContext';
import { StockAlertProvider } from './context/StockAlertContext';
import PageWrapper from './components/common/PageWrapper'; // Import du PageWrapper

// Composants de pages (à créer)
const CategoriesPage = () => <div className="p-6"><h1 className="text-2xl font-bold">Catégories Services</h1><p>Types de services</p></div>;

const AppContent = () => {
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  // Layout principal avec sidebar
  const MainLayout = ({ children }) => (
    <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900 flex overflow-hidden">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 p-4 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 relative">
        {children}
      </main>
    </div>
  );

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
