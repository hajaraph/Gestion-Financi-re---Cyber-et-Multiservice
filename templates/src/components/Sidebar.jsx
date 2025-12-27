import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';
import { useStockAlert } from '../context/StockAlertContext';
import { FaBell, FaExclamationTriangle, FaTimesCircle, FaCheckCircle } from 'react-icons/fa'; // Ajout d'icônes
import Portal from './common/Portal'; // Importer le composant Portal

const Sidebar = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showStockAlerts, setShowStockAlerts] = useState(false);
  const [alertsPosition, setAlertsPosition] = useState({ top: 0, left: 0 });
  const navigate = useNavigate();
  const location = useLocation();
  const { alerts, totalAlerts } = useStockAlert();
  const alertsDropdownRef = useRef(null); // Renommé pour plus de clarté
  const bellIconRef = useRef(null); // Référence pour l'icône de cloche

  // Calculer la position du dropdown
  const calculateAlertsPosition = () => {
    if (bellIconRef.current) {
      const rect = bellIconRef.current.getBoundingClientRect();
      // Positionner le bord gauche du dropdown avec le bord gauche de l'icône de cloche
      setAlertsPosition({
        top: rect.bottom + window.scrollY + 10, // 10px en dessous de l'icône
        left: rect.left + window.scrollX, // Aligner le bord gauche du dropdown avec le bord gauche de l'icône
      });
    }
  };

  // Recalculer la position si la sidebar est ouverte/fermée ou si la fenêtre est redimensionnée
  useEffect(() => {
    if (showStockAlerts) {
      calculateAlertsPosition();
    }
    const handleResize = () => {
      if (showStockAlerts) calculateAlertsPosition();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen, showStockAlerts]);

  // Fermer le dropdown si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (alertsDropdownRef.current && !alertsDropdownRef.current.contains(event.target) && bellIconRef.current && !bellIconRef.current.contains(event.target)) {
        setShowStockAlerts(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleBellClick = () => {
    if (!showStockAlerts) {
      calculateAlertsPosition();
    }
    setShowStockAlerts(prev => !prev);
  };

  const hasPermission = (permissionCode) => {
    if (user?.is_superuser) return true;
    return user?.permissions?.includes(permissionCode);
  };

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Tableau de Bord',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 22 21">
          <path d="M16.975 11H10V4.025a1 1 0 0 0-1.066-.998 8.5 8.5 0 1 0 9.039 9.039.999.999 0 0 0-1-1.066h.002Z" />
          <path d="M12.5 0c-.157 0-.311.01-.565.027A1 1 0 0 0 11 1.02V10h8.975a1 1 0 0 0 1-.935c.013-.188.028-.374.028-.565A8.51 8.51 0 0 0 12.5 0Z" />
        </svg>
      ),
      path: '/dashboard',
      description: 'Vue d\'ensemble des activités',
      permission: null
    },
    {
      id: 'vente-produits',
      name: 'Vente Directe',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm-2 5V6a2 2 0 114 0v1H8z" />
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
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
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
          <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
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
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H7zM14 9a1 1 0 10-2 0v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd" />
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
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
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
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
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
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v9a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2V5a2 2 0 00-2-2H4zm2 4h8a1 1 0 010 2H6a1 1 0 110-2zm0 4h6a1 1 0 010 2H6a1 1 0 110-2z" clipRule="evenodd" />
        </svg>
      ),
      path: '/produits',
      description: 'Enregistrer et gérer les produits',
      permission: 'view_produit'
    },
    {
      id: 'parametres',
      name: 'Paramètres',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
      ),
      path: '/parametres',
      description: 'Configuration du système',
      permission: 'manage_system'
    },
  ];

  const getInitials = (firstName, lastName, username) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return username ? username.charAt(0).toUpperCase() : 'U';
  };

  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) return `${user.first_name} ${user.last_name}`;
    return user?.username || 'Utilisateur';
  };

  const handleLogoutClick = () => setShowLogoutModal(true);
  const handleConfirmLogout = () => {
    setShowLogoutModal(false);
    onLogout();
  };
  const handleCancelLogout = () => setShowLogoutModal(false);
  const handleMenuClick = (path) => navigate(path);
  const getActiveMenu = () => menuItems.find(item => item.path === location.pathname)?.id || 'dashboard';

  return (
    <div className={`z-40 h-screen transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'} bg-gray-900 text-white flex flex-col`}>
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        {isOpen && <h2 className="text-xl font-bold text-blue-400">Cyber Café</h2>}
        <div className="flex items-center gap-2">
          <div className="relative">
            <button ref={bellIconRef} onClick={handleBellClick} className="p-2 rounded-lg hover:bg-gray-800 relative">
              <FaBell className="w-5 h-5" />
              {totalAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">{totalAlerts}</span>
              )}
            </button>
            {showStockAlerts && (
              <Portal>
                <div
                  ref={alertsDropdownRef}
                  style={{ top: `${alertsPosition.top}px`, left: `${alertsPosition.left}px` }}
                  className="absolute w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl z-50 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200"
                >
                  <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white flex items-center">
                      <FaBell className="mr-2 text-blue-500" /> Alertes de Stock
                    </h3>
                    <button onClick={() => setShowStockAlerts(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-2">
                    {totalAlerts === 0 ? (
                      <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400 flex flex-col items-center">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3">
                          <FaCheckCircle className="text-green-500 w-6 h-6" />
                        </div>
                        <span className="font-medium">Tout est en ordre !</span>
                        <span className="text-xs mt-1">Aucune alerte de stock.</span>
                      </div>
                    ) : (
                      <>
                        {alerts.ruptures.length > 0 && (
                          <div className="mb-2">
                            <div className="flex items-center px-4 py-2 text-sm font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-gray-700">
                              <FaTimesCircle className="mr-2" /> Ruptures de Stock ({alerts.ruptures.length})
                            </div>
                            {alerts.ruptures.map(item => (
                              <div key={item.id} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <span>{item.nom_produit}</span>
                                <span className="font-bold text-red-500">0 {item.unite_mesure_produit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {alerts.seuils_bas.length > 0 && (
                          <div>
                            <div className="flex items-center px-4 py-2 text-sm font-semibold text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-gray-700">
                              <FaExclamationTriangle className="mr-2" /> Seuils Bas Atteints ({alerts.seuils_bas.length})
                            </div>
                            {alerts.seuils_bas.map(item => (
                              <div key={item.id} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                                <span>{item.nom_produit}</span>
                                <span className="font-bold text-yellow-500">{parseFloat(item.quantite_actuelle).toLocaleString()} {item.unite_mesure_produit}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => {
                        setShowStockAlerts(false);
                        navigate('/stock');
                      }}
                      className="w-full bg-blue-50 hover:bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30 text-sm font-bold py-2.5 rounded-xl transition-all"
                    >
                      Voir toutes les alertes
                    </button>
                  </div>
                </div>
              </Portal>
            )}
          </div>
          <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg hover:bg-gray-800" title={isOpen ? 'Réduire' : 'Agrandir'}>
            {isOpen ? '←' : '→'}
          </button>
        </div>
      </div>

      <nav className="flex-grow mt-8 overflow-y-auto">
        <ul className="space-y-2 px-4">
          {menuItems.map((item) => {
            if (item.permission && !hasPermission(item.permission)) return null;
            const isActive = getActiveMenu() === item.id;
            return (
              <li key={item.id}>
                <button
                  onClick={() => handleMenuClick(item.path)}
                  className={`w-full flex items-center p-3 rounded-lg transition-colors group relative ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-gray-800 text-gray-300 hover:text-white'}`}
                  title={!isOpen ? item.name : ''}
                >
                  <span className={`flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}>{item.icon}</span>
                  {isOpen && (
                    <div className="ml-3 flex-1 min-w-0 text-left">
                      <span className="font-medium block truncate">{item.name}</span>
                      <span className={`text-xs block truncate ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>{item.description}</span>
                    </div>
                  )}
                  {!isOpen && (
                    <div className="absolute left-full ml-4 bg-gray-800 text-white px-3 py-2 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-300">{item.description}</div>
                    </div>
                  )}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-300 rounded-r-full"></div>}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center p-2 rounded-lg bg-gray-800">
          <div className="relative flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {getInitials(user?.first_name, user?.last_name, user?.username)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-gray-800 rounded-full"></div>
          </div>
          {isOpen && (
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{getDisplayName()}</p>
              <p className="text-xs text-green-400">En ligne</p>
            </div>
          )}
          {isOpen && (
            <button className="ml-2 p-1 rounded hover:bg-gray-700" title="Déconnexion" onClick={handleLogoutClick}>
              <svg className="w-4 h-4 text-gray-400 hover:text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <ConfirmModal isOpen={showLogoutModal} onClose={handleCancelLogout} onConfirm={handleConfirmLogout} title="Confirmer la déconnexion" message={`${getDisplayName()}, êtes-vous sûr de vouloir vous déconnecter ?`} confirmText="Se déconnecter" cancelText="Annuler" type="warning" />
    </div>
  );
};

export default Sidebar;
