import React, { useState, useEffect } from 'react';
import { produitAPI, venteProduitAPI } from '../services/api';
import NotificationIcon from './common/NotificationIcon'; // Import du composant centralisé
import TableLoader from './common/TableLoader';
import EmptyState from './common/EmptyState';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useStockAlert } from '../context/StockAlertContext';
import { FaTimes, FaSearch } from 'react-icons/fa'; // Import de l'icône de fermeture et de recherche

import Pagination from './common/Pagination';

const VenteProduitPage = () => {
  useDocumentTitle('Vente de Produits');
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSales, setLoadingSales] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [remise, setRemise] = useState(0);
  const [usageInterne, setUsageInterne] = useState(false);
  const [recentSales, setRecentSales] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { refreshAlerts } = useStockAlert();

  // Pagination states for Sales History
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Moins d'items pour le POS
  const [totalItems, setTotalItems] = useState(0);

  const fetchProduits = async (search = '') => {
    setLoading(true);
    try {
      const result = await produitAPI.getAll({
        en_stock: 'true',
        actif: 'true',
        search: search,
        page_size: 50 // Augmenté un peu mais sans pagination complexe ici pour garder le POS fluide
      });

      if (result.success) {
        const data = result.data.results || result.data || [];
        setProduits(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentSales = async (page = 1) => {
    setLoadingSales(true);
    try {
      // On utilise l'endpoint paginé par défaut au lieu de ventes_du_jour pour avoir la pagination
      // On pourrait aussi filtrer par date si on voulait rester sur "du jour"
      const result = await venteProduitAPI.getAll({
        page: page,
        page_size: itemsPerPage
      });
      if (result.success) {
        if (result.data.results) {
          setRecentSales(result.data.results);
          setTotalItems(result.data.count);
        } else {
          setRecentSales(result.data);
          setTotalItems(result.data.length);
        }
      }
    } finally {
      setLoadingSales(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProduits(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchRecentSales(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage]);

  const openConfirmModal = (produit) => {
    setSelectedProduit(produit);
    setQuantite(1);
    setRemise(0);
    setUsageInterne(false);
    setShowConfirmModal(true);
  };

  const handleVente = async (e) => {
    e.preventDefault();
    if (!selectedProduit || quantite <= 0) {
      notify('Veuillez sélectionner un produit et une quantité valide.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const totalApresRemise = usageInterne ? 0 : Math.max(0, (selectedProduit.prix_vente * quantite) - remise);
      const payload = {
        produit: selectedProduit.id,
        quantite: quantite,
        prix_unitaire: usageInterne ? 0 : totalApresRemise / quantite,
        usage_interne: usageInterne,
      };
      const result = await venteProduitAPI.create(payload);
      if (result.success) {
        notify(usageInterne ? 'Consommation interne enregistrée!' : 'Vente enregistrée avec succès!');
        setShowConfirmModal(false);
        // Rafraîchir les données
        await Promise.all([
          fetchProduits(searchTerm),
          fetchRecentSales(1),
          refreshAlerts()
        ]);
        setCurrentPage(1);
      } else {
        const errorMessage = result.error?.quantite || result.error?.detail || result.error?.non_field_errors || 'Erreur lors de la vente.';
        notify(errorMessage, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const onPageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-6 w-full">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-md flex items-center justify-between gap-4 transition-all duration-300 transform animate-slide-in-right
          ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'info' ? 'bg-blue-500' : notification.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
          <div className="flex items-center gap-2">
            <NotificationIcon type={notification.type} className="w-5 h-5" />
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-white hover:text-gray-100">
            <FaTimes />
          </button>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Point de Vente Directe</h1>
        <p className="text-gray-600">Vendez des produits instantanément et suivez vos stocks.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colonne de sélection des produits */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[75vh]">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-blue-600 rounded-full"></span>
            Produits en Stock
          </h2>
          <div className="relative group mb-4 max-w-md">
            <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            />
          </div>
          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <TableLoader message="Chargement des produits..." />
            ) : produits.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {produits.map(p => (
                  <div
                    key={p.id}
                    onClick={() => openConfirmModal(p)}
                    className="p-4 rounded-2xl cursor-pointer bg-gray-50 hover:bg-white border-2 border-transparent hover:border-blue-500 hover:shadow-lg transition-all"
                  >
                    <div className="flex flex-col justify-between h-full">
                      <div className="mb-2">
                        <p className="font-bold text-gray-800 line-clamp-2">{p.designation}</p>
                        <p className="text-xs text-gray-500">{p.categorie_nom || p.reference}</p>
                      </div>
                      <div className="flex justify-between items-end">
                        <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full ${p.stock.quantite_actuelle <= p.stock.quantite_minimale ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                          {p.stock.quantite_actuelle} {p.unite_mesure_symbole}
                        </span>
                        <span className="text-blue-600 font-black text-lg">{p.prix_vente.toLocaleString('fr-FR')} Ar</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="Aucun produit trouvé." />
            )}
          </div>
        </div>

        {/* Colonne des ventes récentes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col h-[75vh]">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="w-2 h-6 bg-green-600 rounded-full"></span>
            Historique des Ventes
          </h2>
          <div className="flex-grow overflow-hidden flex flex-col">
            <div className="flex-grow overflow-y-auto custom-scrollbar">
              {loadingSales ? (
                <TableLoader message="Chargement de l'historique..." />
              ) : recentSales.length > 0 ? (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Produit</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Qté</th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {recentSales.map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-4">
                          <p className="text-sm font-bold text-gray-900 line-clamp-1">{sale.produit_designation}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-400">
                              {new Date(sale.transaction.date_transaction).toLocaleTimeString('fr-FR', {
                                hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                            {sale.usage_interne && (
                              <span className="px-1.5 py-0.5 text-[8px] bg-amber-100 text-amber-700 rounded-md font-black uppercase">Interne</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right text-sm text-gray-600 font-medium">
                          {sale.quantite}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <span className={`text-sm font-black ${sale.usage_interne ? 'text-gray-400' : 'text-gray-900'}`}>
                            {sale.usage_interne ? '0' : (sale.quantite * sale.prix_unitaire).toLocaleString('fr-FR')} Ar
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <EmptyState message="Aucune vente récente." />
              )}
            </div>

            <div className="mt-auto pt-4 border-t border-gray-100">
              <Pagination
                currentPage={currentPage}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                compact={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmation de vente */}
      {showConfirmModal && selectedProduit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Nouvelle Vente</h3>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
                disabled={isSubmitting}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleVente} className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <p className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Produit sélectionné</p>
                <p className="text-xl font-black text-blue-900 line-clamp-2">{selectedProduit.designation}</p>
                <p className="text-sm font-medium text-blue-700 mt-1">
                  Prix unit: {selectedProduit.prix_vente.toLocaleString('fr-FR')} Ar | Stock: {selectedProduit.stock.quantite_actuelle} {selectedProduit.unite_mesure_symbole}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Quantité</label>
                  <input
                    type="number"
                    value={quantite}
                    onChange={(e) => setQuantite(e.target.value)}
                    min="1"
                    max={selectedProduit.stock.quantite_actuelle}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none font-bold text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Réduction (Ar)</label>
                  <input
                    type="number"
                    value={remise}
                    onChange={(e) => setRemise(parseFloat(e.target.value) || 0)}
                    min="0"
                    disabled={usageInterne}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-red-600 font-bold text-lg disabled:opacity-50"
                  />
                </div>
              </div>

              <label className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all border-2 ${usageInterne ? 'bg-amber-50 border-amber-500' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                <input
                  type="checkbox"
                  checked={usageInterne}
                  onChange={(e) => setUsageInterne(e.target.checked)}
                  className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="font-bold text-gray-900">Usage Interne</p>
                  <p className="text-xs text-gray-500 italic">Consommation propre (prix = 0 Ar)</p>
                </div>
              </label>

              <div className="bg-gray-900 p-6 rounded-3xl text-white">
                <div className="flex justify-between items-center opacity-60 text-xs mb-1">
                  <span>SOUS-TOTAL</span>
                  <span>{(selectedProduit.prix_vente * quantite).toLocaleString('fr-FR')} Ar</span>
                </div>
                {remise > 0 && !usageInterne && (
                  <div className="flex justify-between items-center text-red-400 text-xs mb-4">
                    <span>REMISE</span>
                    <span>-{remise.toLocaleString('fr-FR')} Ar</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="font-bold">TOTAL À PAYER</span>
                  <span className="text-3xl font-black text-blue-400">
                    {usageInterne ? '0' : Math.max(0, (selectedProduit.prix_vente * quantite) - remise).toLocaleString('fr-FR')} Ar
                  </span>
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 px-4 py-4 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 font-bold transition-all active:scale-95"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-[2] px-4 py-4 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-xl shadow-blue-200 font-black transition-all transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? '...' : (usageInterne ? 'VALIDER INTERNE' : 'VALIDER LA VENTE')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenteProduitPage;
