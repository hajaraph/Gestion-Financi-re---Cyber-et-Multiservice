import React, { useState, useEffect } from 'react';
import { produitAPI, venteProduitAPI } from '../services/api';
import NotificationIcon from './common/NotificationIcon'; // Import du composant centralisé
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useStockAlert } from '../context/StockAlertContext';
import { FaTimes } from 'react-icons/fa'; // Import de l'icône de fermeture

const VenteProduitPage = () => {
  useDocumentTitle('Vente de Produits');
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [remise, setRemise] = useState(0);
  const [usageInterne, setUsageInterne] = useState(false); // Nouvel état
  const [recentSales, setRecentSales] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const { refreshAlerts } = useStockAlert();

  const fetchProduits = async () => {
    const result = await produitAPI.getAll({ en_stock: 'true', actif: 'true' });
    if (result.success) {
      setProduits(result.data);
    }
  };

  const fetchRecentSales = async () => {
    const result = await venteProduitAPI.getTodaysSales();
    if (result.success) {
      setRecentSales(result.data);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchProduits(), fetchRecentSales()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredProduits = produits.filter(p =>
    p.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openConfirmModal = (produit) => {
    setSelectedProduit(produit);
    setQuantite(1);
    setRemise(0);
    setUsageInterne(false); // Réinitialiser à chaque ouverture
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
        prix_unitaire: usageInterne ? 0 : totalApresRemise / quantite, // Prix unitaire à 0 si usage interne
      };
      const result = await venteProduitAPI.create(payload);
      if (result.success) {
        notify(usageInterne ? 'Consommation interne enregistrée!' : 'Vente enregistrée avec succès!');
        setShowConfirmModal(false);
        await Promise.all([fetchProduits(), fetchRecentSales(), refreshAlerts()]);
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

  const EmptyState = ({ message }) => (
    <div className="text-center text-gray-500 py-8">
      <p>{message}</p>
    </div>
  );

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
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Point de Vente Directe</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Colonne de sélection des produits */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Produits en Stock</h2>
          <input
            type="text"
            placeholder="Rechercher un produit..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="max-h-[60vh] overflow-y-auto">
            {loading ? (
              <p>Chargement...</p>
            ) : filteredProduits.length > 0 ? (
              filteredProduits.map(p => (
                <div
                  key={p.id}
                  onClick={() => openConfirmModal(p)}
                  className="p-3 rounded-lg cursor-pointer mb-2 bg-gray-100 hover:bg-gray-200"
                >
                  <p className="font-semibold">{p.designation}</p>
                  <p className="text-sm text-gray-600">
                    {p.prix_vente.toLocaleString('fr-FR')} Ar -
                    <span className={p.stock.quantite_actuelle <= p.stock.quantite_minimale ? 'font-bold text-red-500' : ''}>
                      Stock: {p.stock.quantite_actuelle} {p.unite_mesure_symbole}
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="Aucun produit en stock ou correspondant à votre recherche." />
            )}
          </div>
        </div>

        {/* Colonne des ventes récentes */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Ventes du Jour</h2>
          <div className="max-h-[70vh] overflow-y-auto">
            {loading ? (
              <p>Chargement...</p>
            ) : recentSales.length > 0 ? (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heure</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Qté</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentSales.map(sale => (
                    <tr key={sale.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sale.produit_designation}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(sale.transaction.date_transaction).toLocaleString('fr-FR', {
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{sale.quantite}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {(sale.quantite * sale.prix_unitaire).toLocaleString('fr-FR')} Ar
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <EmptyState message="Aucune vente enregistrée pour aujourd'hui." />
            )}
          </div>
        </div>
      </div>

      {/* Modal de confirmation de vente */}
      {showConfirmModal && selectedProduit && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Confirmer la Vente</h3>
              <button onClick={() => setShowConfirmModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleVente} className="p-6 space-y-4">
              <div>
                <p className="text-gray-500">Produit</p>
                <p className="text-lg font-bold">{selectedProduit.designation}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Quantité</label>
                <input
                  type="number"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  min="1"
                  max={selectedProduit.stock.quantite_actuelle}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Réduction (Ar)</label>
                <input
                  type="number"
                  value={remise}
                  onChange={(e) => setRemise(parseFloat(e.target.value) || 0)}
                  min="0"
                  disabled={usageInterne}
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none text-red-600 font-bold disabled:bg-gray-200"
                  placeholder="Montant à déduire..."
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="usageInterne"
                  checked={usageInterne}
                  onChange={(e) => setUsageInterne(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="usageInterne" className="ml-2 block text-sm text-gray-900">
                  Usage Interne (Consommation)
                </label>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-right space-y-1">
                <div className="text-sm text-gray-500">Sous-total: {(selectedProduit.prix_vente * quantite).toLocaleString('fr-FR')} Ar</div>
                {remise > 0 && !usageInterne && <div className="text-sm text-red-500">Remise: -{remise.toLocaleString('fr-FR')} Ar</div>}
                <div className="text-2xl font-bold text-blue-600">
                  Total: {usageInterne ? '0' : Math.max(0, (selectedProduit.prix_vente * quantite) - remise).toLocaleString('fr-FR')} Ar
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6 bg-gray-50/50 p-6 -mx-6 -mb-6">
                <button type="button" onClick={() => setShowConfirmModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all" disabled={isSubmitting}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 disabled:opacity-50 font-bold transition-all transform active:scale-95">
                  {isSubmitting ? 'Enregistrement...' : (usageInterne ? 'Valider Consommation' : 'Valider la Vente')}
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
