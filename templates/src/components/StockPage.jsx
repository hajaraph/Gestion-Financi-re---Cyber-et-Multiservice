import React, {useEffect, useState} from 'react';
import {stockAPI} from '../services/api';
import NotificationIcon from './common/NotificationIcon';
import {FaBalanceScale, FaPlus} from 'react-icons/fa'; // Ajout de FaMinus et FaBalanceScale

const StockPage = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState('');
  
  // State for the entry modal
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

  // State for the adjustment modal
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);
  const [adjustmentErrors, setAdjustmentErrors] = useState({});
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantite: '',
    type_ajustement: 'AUGMENTATION', // 'AUGMENTATION' or 'DIMINUTION'
    commentaire: '',
  });

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    setLoading(true);
    try {
      const result = await stockAPI.getAll();
      if (result.success) {
        setStocks(result.data);
      } else {
        notify(result.error || 'Erreur de chargement', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredStocks = stocks.filter(stock => {
    const designation = stock.nom_produit?.toLowerCase() || '';
    const reference = stock.code_produit?.toLowerCase() || '';
    const searchTerm = search.toLowerCase();
    return designation.includes(searchTerm) || reference.includes(searchTerm);
  });

  const stats = stocks.reduce((acc, stock) => {
    acc.totalValeurAchat += Number(stock.valeur_stock_achat || 0);
    acc.totalValeurVente += Number(stock.valeur_stock_vente || 0);
    if (parseFloat(stock.quantite_actuelle) <= 0) {
      acc.ruptures++;
    }
    if (parseFloat(stock.quantite_actuelle) > 0 && parseFloat(stock.quantite_actuelle) <= parseFloat(stock.quantite_minimale)) {
      acc.reappro++;
    }
    return acc;
  }, { totalValeurAchat: 0, totalValeurVente: 0, ruptures: 0, reappro: 0 });


  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const openEntryModal = (stock) => {
    setCurrentStock(stock);
    setEntryForm({
      quantite_achat: '',
      prix_total_achat: '',
      fournisseur: '',
      numero_facture: '',
      commentaire: '',
    });
    setEntryErrors({});
    setShowEntryModal(true);
  };

  const handleRecordEntry = async (e) => {
    e.preventDefault();
    if (!currentStock) return;
    setIsSubmittingEntry(true);
    setEntryErrors({});
    try {
      const payload = {
        produit_id: currentStock.produit_id,
        ...entryForm,
      };
      const result = await stockAPI.recordEntry(payload);
      if (result.success) {
        await loadStocks();
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
    setAdjustmentForm({
      quantite: '',
      type_ajustement: 'AUGMENTATION',
      commentaire: '',
    });
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
        await loadStocks();
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

  const renderStockListItem = (stock) => (
    <tr key={stock.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{stock.nom_produit}</div>
        <div className="text-sm text-gray-500">{stock.code_produit}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
            stock.etat === 'EN_STOCK' ? 'bg-green-100 text-green-800' : 
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
            <button onClick={() => openEntryModal(stock)} className="text-blue-600 hover:text-blue-900 flex items-center gap-1" title="Ajouter au stock">
                <FaPlus /> Ajouter au stock
            </button>
            <button onClick={() => openAdjustmentModal(stock)} className="text-purple-600 hover:text-purple-900 flex items-center gap-1" title="Ajuster le stock">
                <FaBalanceScale /> Ajuster
            </button>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${
          notification.type === 'success' ? 'bg-green-500' : notification.type === 'info' ? 'bg-blue-500' : notification.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
        } text-white`}>
          <NotificationIcon type={notification.type} />
          <span>{notification.message}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Stocks</h1>
        <p className="text-gray-600">Suivez et gérez les quantités de vos produits.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Valeur d'achat</div>
          <div className="text-2xl font-bold">{(stats.totalValeurAchat || 0).toLocaleString('fr-FR')} Ar</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Valeur de vente</div>
          <div className="text-2xl font-bold text-green-600">{(stats.totalValeurVente || 0).toLocaleString('fr-FR')} Ar</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">En rupture</div>
          <div className="text-2xl font-bold text-red-600">{stats.ruptures}</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">À réapprovisionner</div>
          <div className="text-2xl font-bold text-yellow-600">{stats.reappro}</div>
        </div>
      </div>

      <div className="mb-6 flex justify-between items-center">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
        />
      </div>

      {loading ? (
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des stocks...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStocks.map(renderStockListItem)}
            </tbody>
          </table>
          {filteredStocks.length === 0 && (
            <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Aucun stock trouvé</p>
            </div>
          )}
        </div>
      )}

      {showEntryModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
                  <label className="block text-sm font-medium text-gray-700">Quantité Achetée ({currentStock?.unite_achat_symbole})</label>
                  <input
                    type="number"
                    required
                    value={entryForm.quantite_achat}
                    onChange={(e) => setEntryForm({ ...entryForm, quantite_achat: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                    {entryErrors.quantite_achat && <p className="text-red-500 text-xs mt-1">{entryErrors.quantite_achat}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Prix Total d'Achat (Ar)</label>
                  <input
                    type="number"
                    required
                    value={entryForm.prix_total_achat}
                    onChange={(e) => setEntryForm({ ...entryForm, prix_total_achat: e.target.value })}
                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                  />
                  {entryErrors.prix_total_achat && <p className="text-red-500 text-xs mt-1">{entryErrors.prix_total_achat}</p>}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Fournisseur (Optionnel)</label>
                <input
                  type="text"
                  value={entryForm.fournisseur}
                  onChange={(e) => setEntryForm({ ...entryForm, fournisseur: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">N° Facture (Optionnel)</label>
                <input
                  type="text"
                  value={entryForm.numero_facture}
                  onChange={(e) => setEntryForm({ ...entryForm, numero_facture: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowEntryModal(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={isSubmittingEntry}>Annuler</button>
                <button type="submit" disabled={isSubmittingEntry} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">
                  {isSubmittingEntry ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Ajuster Stock: {currentStock?.nom_produit}</h3>
              <button onClick={() => setShowAdjustmentModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmittingAdjustment}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleAdjustment} className="p-6 space-y-4">
              {adjustmentErrors.general && <p className="text-red-500 text-sm mt-2">{adjustmentErrors.general}</p>}
              <div>
                <label className="block text-sm font-medium text-gray-700">Type d'ajustement</label>
                <select
                  value={adjustmentForm.type_ajustement}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type_ajustement: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="AUGMENTATION">Augmentation (+)</option>
                  <option value="DIMINUTION">Diminution (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Quantité ({currentStock?.unite_mesure_produit})</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={adjustmentForm.quantite}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, quantite: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
                {adjustmentErrors.quantite && <p className="text-red-500 text-xs mt-1">{adjustmentErrors.quantite}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Commentaire (Optionnel)</label>
                <textarea
                  value={adjustmentForm.commentaire}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, commentaire: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowAdjustmentModal(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={isSubmittingAdjustment}>Annuler</button>
                <button type="submit" disabled={isSubmittingAdjustment} className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg disabled:opacity-50">
                  {isSubmittingAdjustment ? 'Ajustement...' : 'Ajuster'}
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
