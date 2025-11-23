import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

const Sidebar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Fonction pour vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permissionCode) => {
    // Si l'utilisateur est superuser, il a toutes les permissions
    if (user?.is_superuser) {
      return true;
    }
    // Vérifier si l'objet user et ses permissions existent
    return user?.permissions?.includes(permissionCode);
  };

  // Menu basé sur vos modèles Django de gestion de cyber café
  const menuItems = [
    {
      id: 'dashboard',
      name: 'Tableau de Bord',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 22 21">
          <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z"/>
          <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z"/>
        </svg>
      ),
      path: '/dashboard',
      description: 'Vue d\'ensemble des activités',
      permission: null // Aucune permission spécifique requise pour le tableau de bord
    },
    {
      id: 'vente-produits',
      name: 'Vente Directe',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm-2 5V6a2 2 0 114 0v1H8z"/>
        </svg>
      ),
      path: '/vente-produits',
      description: 'Enregistrer la vente de produits',
      permission: 'add_recette'
    },
    {
      id: 'multiservices',
      name: 'Multiservices',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
        </svg>
      ),
      path: '/multiservices',
      description: 'Photocopie, reliure, plastification, scan',
      permission: 'add_recette'
    },
    {
      id: 'depenses',
      name: 'Dépenses',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
        </svg>
      ),
      path: '/depenses',
      description: 'Électricité, maintenance, fournitures',
      permission: 'view_depense'
    },
    {
      id: 'tarifs',
      name: 'Tarifs Services',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H7zM14 9a1 1 0 10-2 0v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
        </svg>
      ),
      path: '/tarifs',
      description: 'Gestion des prix et tarifs',
      permission: 'view_tarif'
    },
    {
      id: 'utilisateurs',
      name: 'Utilisateurs',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"/>
        </svg>
      ),
      path: '/utilisateurs',
      description: 'Gestion des profils utilisateurs',
      permission: 'manage_users'
    },
    {
      id: 'stock',
      name: 'Gestion des Stocks',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
        </svg>
      ),
      path: '/stock',
      description: 'Gestion des stocks et inventaire',
      permission: 'view_produit'
    },
    {
      id: 'produits',
      name: 'Produits',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v9a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2V5a2 2 0 00-2-2H4zm2 4h8a1 1 0 010 2H6a1 1 0 110-2zm0 4h6a1 1 0 010 2H6a1 1 0 110-2z" clipRule="evenodd"/>
        </svg>
      ),
      path: '/produits',
      description: 'Enregistrer et gérer les produits',
      permission: 'view_produit' // CORRECTION: Changé de 'manage_produits' à 'view_produit'
    },
    {
      id: 'parametres',
      name: 'Paramètres',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd"/>
        </svg>
      ),
      path: '/parametres',
      description: 'Configuration du système',
      permission: 'manage_system'
    },
  ];

  const getInitials = (firstName, lastName, username) => {
    if (firstName && lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    return user?.username || 'Utilisateur';
  };

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };

  const handleCancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleMenuClick = (path) => {
    navigate(path);
  };

  // Déterminer le menu actif basé sur l'URL actuelle
  const getActiveMenu = () => {
    const currentPath = location.pathname;
    const activeItem = menuItems.find(item => item.path === currentPath);
    return activeItem ? activeItem.id : 'dashboard';
  };

  return (
    <div className={`z-40 h-screen transition-all duration-300 ${isOpen ? 'w-64' : 'w-16'} bg-gray-900 text-white flex flex-col`}>
      {/* Header avec bouton toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isOpen && (
          <h2 className="text-xl font-bold text-blue-400">Cyber Café</h2>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-800 transition-colors"
          title={isOpen ? 'Réduire le menu' : 'Agrandir le menu'}
        >
          {isOpen ? '←' : '→'}
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="mt-8">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            // Afficher l'élément de menu seulement si l'utilisateur a la permission requise
            if (item.permission && !hasPermission(item.permission)) {
              return null;
            }

            const isActive = getActiveMenu() === item.id;

            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.path)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors group relative
                    ${isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'hover:bg-gray-800 text-gray-300 hover:text-white'
                    }
                  `}
                  title={!isOpen ? item.name : ''}
                >
                  <span className={`flex-shrink-0 transition-colors ${
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                  }`}>
                    {item.icon}
                  </span>
                  {isOpen && (
                    <div className="ml-3 flex-1 min-w-0 text-left">
                      <span className={`font-medium block truncate ${
                        isActive ? 'text-white' : ''
                      }`}>
                        {item.name}
                      </span>
                      <span className={`text-xs block truncate ${
                        isActive ? 'text-blue-100' : 'text-gray-400'
                      }`}>
                        {item.description}
                      </span>
                    </div>
                  )}
                  {!isOpen && (
                    <div className="absolute left-16 bg-gray-800 text-white px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-300">{item.description}</div>
                    </div>
                  )}
                  {/* Indicateur visuel pour le menu actif */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-300 rounded-r-full"></div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer utilisateur enrichi */}
      <div className="mt-auto p-4">
        <div className="flex items-center p-3 rounded-lg bg-gray-800 border border-gray-700">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {getInitials(user?.first_name, user?.last_name, user?.username)}
            </div>
            {/* Indicateur de connexion */}
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-full"></div>
            </div>
          </div>
          {isOpen && (
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white truncate">{getDisplayName()}</p>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {user?.is_superuser ? 'Admin' : (user?.role_nom || 'Utilisateur')}
                </span>
              </div>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                <span className="text-xs text-green-400">En ligne</span>
              </div>
            </div>
          )}
          {isOpen && (
            <button
              className="ml-2 p-1 rounded hover:bg-gray-700 transition-colors"
              title="Déconnexion"
              onClick={handleLogoutClick}
            >
              <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Modal de confirmation de déconnexion */}
      <ConfirmModal
        isOpen={showLogoutModal}
        onClose={handleCancelLogout}
        onConfirm={handleConfirmLogout}
        title="Confirmer la déconnexion"
        message={`${getDisplayName()}, êtes-vous sûr de vouloir vous déconnecter de l'application ?`}
        confirmText="Se déconnecter"
        cancelText="Annuler"
        type="warning"
      />
    </div>
  );
};

export default Sidebar;
