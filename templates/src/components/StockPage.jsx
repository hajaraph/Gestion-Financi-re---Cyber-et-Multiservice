import React, { useEffect, useState, useCallback } from 'react';
import { stockAPI } from '../services/api';
import NotificationIcon from './common/NotificationIcon';
import TableLoader from './common/TableLoader';
import EmptyState from './common/EmptyState';
import { FaPlus, FaBalanceScale, FaDollarSign, FaHistory, FaTimes, FaSearch } from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useStockAlert } from '../context/StockAlertContext';
import Pagination from './common/Pagination';

const StockPage = () => {
  useDocumentTitle('Gestion des Stocks');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const { refreshAlerts } = useStockAlert();

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  // Stats state
  const [stats, setStats] = useState({
    totalValeurAchat: 0,
    totalValeurVente: 0,
    ruptures: 0,
    reappro: 0
  });

  const [showEntryModal, setShowEntryModal] = useState(false);
  const [isSubmittingEntry, setIsSubmittingEntry] = useState(false);
  const [entryErrors, setEntryErrors] = useState({});
  const [currentStock, setCurrentStock] = useState(null);
  const [entryForm, setEntryForm] = useState({
    quantite_achat: '',
    prix_total_achat: '',
    fournisseur: '',
    numero_facture: '',
    commentaire: '',
  });

  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [adjustmentErrors, setAdjustmentErrors] = useState({});
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantite: '',
    type_ajustement: 'AUGMENTATION',
    commentaire: '',
  });

  const [showRevaluationModal, setShowRevaluationModal] = useState(false);
  const [isSubmittingRevaluation, setIsSubmittingRevaluation] = useState(false);
  const [revaluationErrors, setRevaluationErrors] = useState({});
  const [revaluationForm, setRevaluationForm] = useState({
    nouveau_prix_achat_moyen: '',
    commentaire: '',
  });

  // State for history modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadStocks = useCallback(async (page, searchQuery = '') => {
    setLoading(true);
    try {
      const result = await stockAPI.getAll({
        page: page,
        page_size: itemsPerPage,
        search: searchQuery
      });

      if (result.success) {
        if (result.data.results) {
          setStocks(result.data.results);
          setTotalItems(result.data.count);
        } else {
          setStocks(result.data);
          setTotalItems(result.data.length);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage]);

  const loadStats = useCallback(async () => {
    const result = await stockAPI.getStats();
    if (result.success) {
      setStats(result.data);
    }
  }, []);

  // Initial load for stats
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  // Handle debounced search update
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1); // Reset to first page when search changes
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  // Re-load data when page or debounced search changes
  useEffect(() => {
    loadStocks(currentPage, debouncedSearch);
  }, [loadStocks, currentPage, debouncedSearch]);

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };



  // filteredStocks and client-side stats calculation removed

  const openHistoryModal = async (stock) => {
    setCurrentStock(stock);
    setShowHistoryModal(true);
    setLoadingHistory(true);
    const result = await stockAPI.getHistory(stock.id);
    if (result.success) {
      setHistory(result.data.results || result.data); // Handle paginated or direct response
    } else {
      notify("Erreur lors du chargement de l'historique.", 'error');
    }
    setLoadingHistory(false);
  };

  // ... (other modal and handler functions remain the same)
  const openEntryModal = (stock) => {
    setCurrentStock(stock);
    setEntryForm({ quantite_achat: '', prix_total_achat: '', fournisseur: '', numero_facture: '', commentaire: '' });
    setEntryErrors({});
    setShowEntryModal(true);
  };

  const handleRecordEntry = async (e) => {
    e.preventDefault();
    if (!currentStock) return;
    setIsSubmittingEntry(true);
    setEntryErrors({});
    try {
      const payload = { produit_id: currentStock.produit_id, ...entryForm };
      const result = await stockAPI.recordEntry(payload);
      if (result.success) {
        await loadStocks(currentPage, search);
        await refreshAlerts();
        loadStats();
        setShowEntryModal(false);
        notify('Entrée de stock enregistrée avec succès');
      } else {
        const err = result.error;
        if (err && typeof err === 'object') setEntryErrors(err);
        else setEntryErrors({ general: err });
      }
    } finally {
      setIsSubmittingEntry(false);
    }
  };

  const openAdjustmentModal = (stock) => {
    setCurrentStock(stock);
    setAdjustmentForm({ quantite: '', type_ajustement: 'AUGMENTATION', commentaire: '' });
    setAdjustmentErrors({});
    setShowAdjustmentModal(true);
  };

  const handleAdjustment = async (e) => {
    e.preventDefault();
    if (!currentStock) return;
    setIsSubmittingAdjustment(true);
    setAdjustmentErrors({});
    try {
      const payload = {
        quantite: parseFloat(adjustmentForm.quantite),
        type_ajustement: adjustmentForm.type_ajustement,
        commentaire: adjustmentForm.commentaire,
      };
      const result = await stockAPI.adjustStock(currentStock.id, payload);
      if (result.success) {
        await loadStocks(currentPage, search);
        await refreshAlerts();
        loadStats();
        setShowAdjustmentModal(false);
        notify('Ajustement de stock enregistré avec succès');
      } else {
        const err = result.error;
        if (err && typeof err === 'object') setAdjustmentErrors(err);
        else setAdjustmentErrors({ general: err });
      }
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const openRevaluationModal = (stock) => {
    setCurrentStock(stock);
    setRevaluationForm({ nouveau_prix_achat_moyen: stock.prix_achat_moyen || '', commentaire: '' });
    setRevaluationErrors({});
    setShowRevaluationModal(true);
  };

  const handleRevaluation = async (e) => {
    e.preventDefault();
    if (!currentStock) return;
    setIsSubmittingRevaluation(true);
    setRevaluationErrors({});
    try {
      const payload = {
        nouveau_prix_achat_moyen: parseFloat(revaluationForm.nouveau_prix_achat_moyen),
        commentaire: revaluationForm.commentaire,
      };
      const result = await stockAPI.revalueStockPrice(currentStock.id, payload);
      if (result.success) {
        await loadStocks(currentPage, search);
        await refreshAlerts();
        loadStats();
        setShowRevaluationModal(false);
        notify('Prix d\'achat moyen réévalué avec succès');
      } else {
        const err = result.error;
        if (err && typeof err === 'object') setRevaluationErrors(err);
        else setRevaluationErrors({ general: err });
      }
    } finally {
      setIsSubmittingRevaluation(false);
    }
  };

  const renderStockListItem = (stock) => (
    <tr key={stock.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{stock.nom_produit}</div>
        <div className="text-sm text-gray-500">{stock.code_produit}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${stock.etat === 'EN_STOCK' ? 'bg-green-100 text-green-800' :
          stock.etat === 'LIMITE' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
          }`}>
          {stock.etat?.replace('_', ' ')}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-800">
        {parseFloat(stock.quantite_actuelle).toLocaleString()} {stock.unite_mesure_produit}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
        {parseFloat(stock.quantite_minimale).toLocaleString()} {stock.unite_mesure_produit}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-800">
        {(stock.valeur_stock_vente || 0).toLocaleString('fr-FR')} Ar
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end gap-2">
          <button onClick={() => openHistoryModal(stock)} className="text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer" title="Historique du stock">
            <FaHistory />
          </button>
          <button onClick={() => openEntryModal(stock)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1 cursor-pointer" title="Ajouter au stock">
            <FaPlus />
          </button>
          <button onClick={() => openAdjustmentModal(stock)} className="text-purple-600 hover:text-purple-900 flex items-center gap-1 cursor-pointer" title="Ajuster le stock">
            <FaBalanceScale />
          </button>
          <button onClick={() => openRevaluationModal(stock)} className="text-green-600 hover:text-green-900 flex items-center gap-1 cursor-pointer" title="Réévaluer le prix moyen">
            <FaDollarSign />
          </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-6">
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

      <div className="mb-6 lg:mb-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gestion des Stocks</h1>
        <p className="text-gray-600 text-sm sm:text-base">Suivez et gérez les quantités de vos produits.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Valeur d'achat</div>
          <div className="text-2xl font-black text-gray-900">{(stats.totalValeurAchat || 0).toLocaleString('fr-FR')} Ar</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Valeur de vente</div>
          <div className="text-2xl font-black text-green-600">{(stats.totalValeurVente || 0).toLocaleString('fr-FR')} Ar</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">En rupture</div>
          <div className="text-2xl font-black text-red-600">{stats.ruptures}</div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">À réapprovisionner</div>
          <div className="text-2xl font-black text-yellow-600">{stats.reappro}</div>
        </div>
      </div>

      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group max-w-md">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher un produit en stock..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          />
        </div>
        <button
          onClick={() => loadStocks(currentPage, search)}
          className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl hover:bg-gray-50 shadow-sm flex items-center justify-center gap-2 transition-all transform active:scale-95 font-bold"
        >
          Actualiser
        </button>
      </div>

      {loading ? (
        <TableLoader message="Chargement du stock..." />
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">État</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qté Actuelle</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qté Minimale</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valeur Vente</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">{stocks.map(renderStockListItem)}</tbody>
            </table>
          </div>

          {/* Version Mobile */}
          <div className="sm:hidden divide-y divide-gray-100">
            {stocks.map(stock => (
              <div key={stock.id} className="p-4 active:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-bold text-gray-900">{stock.nom_produit}</p>
                    <p className="text-[10px] text-gray-400 uppercase font-medium">{stock.code_produit}</p>
                  </div>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${stock.etat === 'EN_STOCK' ? 'bg-green-100 text-green-700' :
                    stock.etat === 'LIMITE' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                    }`}>
                    {stock.etat?.replace('_', ' ')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-xl">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Quantité</p>
                    <p className="text-sm font-black text-gray-900">{parseFloat(stock.quantite_actuelle).toLocaleString()} {stock.unite_mesure_produit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Valeur</p>
                    <p className="text-sm font-black text-blue-600">{(stock.valeur_stock_vente || 0).toLocaleString('fr-FR')} Ar</p>
                  </div>
                </div>

                <div className="flex justify-around items-center border-t border-gray-50 pt-3">
                  <button onClick={() => openHistoryModal(stock)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><FaHistory size={18} /></button>
                  <button onClick={() => openEntryModal(stock)} className="p-2 text-blue-500 hover:text-blue-600 transition-colors"><FaPlus size={18} /></button>
                  <button onClick={() => openAdjustmentModal(stock)} className="p-2 text-purple-500 hover:text-purple-600 transition-colors"><FaBalanceScale size={18} /></button>
                  <button onClick={() => openRevaluationModal(stock)} className="p-2 text-green-500 hover:text-green-600 transition-colors"><FaDollarSign size={18} /></button>
                </div>
              </div>
            ))}
          </div>
          {stocks.length === 0 && <EmptyState message="Aucun stock trouvé" />}

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => setCurrentPage(page)}
            onPerPageChange={(value) => {
              setItemsPerPage(value);
              setCurrentPage(1);
            }}
          />
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Historique du stock: {currentStock?.nom_produit}</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-gray-400 hover:text-gray-600"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="overflow-y-auto p-6">
              {loadingHistory ? <p>Chargement de l'historique...</p> : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Motif</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Quantité</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock Avant</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Stock Après</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {history.map(m => (
                      <tr key={m.id}>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{new Date(m.date_mouvement).toLocaleString('fr-FR')}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{m.type_mouvement_display}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{m.motif_display}</td>
                        <td className={`px-4 py-2 whitespace-nowrap text-sm text-right font-bold ${m.type_mouvement === 'ENTREE' ? 'text-green-600' : 'text-red-600'}`}>
                          {m.type_mouvement === 'ENTREE' ? '+' : '-'}{parseFloat(m.quantite).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{parseFloat(m.quantite_avant).toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm text-right">{parseFloat(m.quantite_apres).toLocaleString()}</td>
                        <td className="px-4 py-2 whitespace-nowrap text-sm">{m.utilisateur_nom || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {history.length === 0 && !loadingHistory && <p className="text-center py-4">Aucun mouvement trouvé pour ce produit.</p>}
            </div>
          </div>
        </div>
      )}

      {/* Other modals (Entry, Adjustment, Revaluation) remain unchanged */}
      {showEntryModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter au Stock: {currentStock?.nom_produit}</h3>
              <button onClick={() => setShowEntryModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmittingEntry}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRecordEntry} className="p-6 space-y-4">
              {entryErrors.general && <p className="text-red-500 text-sm mt-2">{entryErrors.general}</p>}
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                Vous achetez en <span className="font-bold">{currentStock?.unite_achat_symbole || 'unité'}</span>. Le stock sera mis à jour en <span className="font-bold">{currentStock?.unite_mesure_produit || 'unité'}</span>.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantité Achetée ({currentStock?.unite_achat_symbole})</label>
                  <input type="number" required value={entryForm.quantite_achat} onChange={(e) => setEntryForm({ ...entryForm, quantite_achat: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                  {entryErrors.quantite_achat && <p className="text-red-500 text-xs mt-1">{entryErrors.quantite_achat}</p>}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix Total (Ar)</label>
                  <input type="number" required value={entryForm.prix_total_achat} onChange={(e) => setEntryForm({ ...entryForm, prix_total_achat: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                  {entryErrors.prix_total_achat && <p className="text-red-500 text-xs mt-1">{entryErrors.prix_total_achat}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fournisseur (Optionnel)</label>
                <input type="text" value={entryForm.fournisseur} onChange={(e) => setEntryForm({ ...entryForm, fournisseur: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">N° Facture (Optionnel)</label>
                <input type="text" value={entryForm.numero_facture} onChange={(e) => setEntryForm({ ...entryForm, numero_facture: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 bg-gray-50/50 p-8 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEntryModal(false)}
                  className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm active:scale-95"
                  disabled={isSubmittingEntry}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEntry}
                  className="px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl disabled:opacity-50 font-bold transition-all transform active:scale-95"
                >
                  {isSubmittingEntry ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Ajuster Stock: {currentStock?.nom_produit}</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmittingAdjustment}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleAdjustment} className="p-6 space-y-4">
              {adjustmentErrors.general && <p className="text-red-500 text-sm mt-2">{adjustmentErrors.general}</p>}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Type d'ajustement</label>
                <select value={adjustmentForm.type_ajustement} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type_ajustement: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none">
                  <option value="AUGMENTATION">Augmentation (+)</option>
                  <option value="DIMINUTION">Diminution (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantité ({currentStock?.unite_mesure_produit})</label>
                <input type="number" required min="0" value={adjustmentForm.quantite} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantite: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                {adjustmentErrors.quantite && <p className="text-red-500 text-xs mt-1">{adjustmentErrors.quantite}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Commentaire (Optionnel)</label>
                <textarea value={adjustmentForm.commentaire} onChange={(e) => setAdjustmentForm({ ...adjustmentForm, commentaire: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none h-24 resize-none" />
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 bg-gray-50/50 p-8 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAdjustmentModal(false)}
                  className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm active:scale-95"
                  disabled={isSubmittingAdjustment}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl disabled:opacity-50 font-bold transition-all transform active:scale-95"
                >
                  {isSubmittingAdjustment ? 'Ajustement...' : 'Ajuster'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRevaluationModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Réévaluer Prix Moyen: {currentStock?.nom_produit}</h3>
              <button onClick={() => setShowRevaluationModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmittingRevaluation}><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <form onSubmit={handleRevaluation} className="p-6 space-y-4">
              {revaluationErrors.general && <p className="text-red-500 text-sm mt-2">{revaluationErrors.general}</p>}
              <p className="text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">Prix d'achat moyen actuel: <span className="font-bold text-blue-600">{currentStock?.prix_achat_moyen} Ar</span></p>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nouveau Prix d'Achat Moyen (Ar)</label>
                <input type="number" required min="0" step="0.01" value={revaluationForm.nouveau_prix_achat_moyen} onChange={(e) => setRevaluationForm({ ...revaluationForm, nouveau_prix_achat_moyen: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                {revaluationErrors.nouveau_prix_achat_moyen && <p className="text-red-500 text-xs mt-1">{revaluationErrors.nouveau_prix_achat_moyen}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Commentaire (Optionnel)</label>
                <textarea value={revaluationForm.commentaire} onChange={(e) => setRevaluationForm({ ...revaluationForm, commentaire: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none h-24 resize-none" />
              </div>
              <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 bg-gray-50/50 p-8 mt-6">
                <button
                  type="button"
                  onClick={() => setShowRevaluationModal(false)}
                  className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm active:scale-95"
                  disabled={isSubmittingRevaluation}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRevaluation}
                  className="px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl disabled:opacity-50 font-bold transition-all transform active:scale-95"
                >
                  {isSubmittingRevaluation ? 'Réévaluation...' : 'Réévaluer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockPage;
