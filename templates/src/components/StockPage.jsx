import React, { useEffect, useState } from 'react';
import { stockAPI } from '../services/api';

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

  const filteredStocks = stocks.filter(stock =>
    stock.produit?.designation?.toLowerCase().includes(search.toLowerCase()) ||
    stock.produit?.reference?.toLowerCase().includes(search.toLowerCase())
  );

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
        produit_id: currentStock.produit.id,
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

  const renderStockListItem = (stock) => (
    <tr key={stock.id} className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{stock.produit?.designation}</div>
        <div className="text-sm text-gray-500">{stock.produit?.reference}</div>
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
        {parseFloat(stock.quantite_actuelle).toLocaleString()} ({stock.produit?.unite_mesure_symbole})
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">
        {parseFloat(stock.quantite_minimale).toLocaleString()} ({stock.produit?.unite_mesure_symbole})
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-800">
        {(stock.valeur_stock_vente || 0).toLocaleString('fr-FR')} Ar
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onClick={() => openEntryModal(stock)} className="text-blue-600 hover:text-blue-900">
          + Ajouter au stock
        </button>
      </td>
    </tr>
  );

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.message}
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
        <div className="text-center py-10">Chargement...</div>
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
        </div>
      )}

      {showEntryModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">Ajouter au Stock: {currentStock?.produit?.designation}</h3>
              <button onClick={() => setShowEntryModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmittingEntry}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleRecordEntry} className="p-6 space-y-4">
              {entryErrors.general && <p className="text-red-500 text-sm mt-2">{entryErrors.general}</p>}
              <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  Vous achetez en <span className="font-bold">{currentStock?.produit?.unite_achat_nom || 'unité'}</span>. Le stock sera mis à jour en <span className="font-bold">{currentStock?.produit?.unite_mesure_nom || 'unité'}</span>.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantité Achetée ({currentStock?.produit?.unite_achat_symbole})</label>
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
    </div>
  );
};

export default StockPage;
