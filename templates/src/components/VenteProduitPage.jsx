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
      const totalApresRemise = Math.max(0, (selectedProduit.prix_vente * quantite) - remise);
      const payload = {
        produit: selectedProduit.id,
        quantite: quantite,
        prix_unitaire: totalApresRemise / quantite, // Envoyer le prix unitaire effectif
      };
      const result = await venteProduitAPI.create(payload);
      if (result.success) {
        notify('Vente enregistrée avec succès!');
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
    <div className="p-6 w-full"> {/* Animation retirée ici, car PageWrapper s'en charge */}
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
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300"> {/* Animation pour l'overlay */}
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-in zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"> {/* Animation pour la modale */}
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
                <label className="block text-sm font-medium text-gray-700">Quantité</label>
                <input
                  type="number"
                  value={quantite}
                  onChange={(e) => setQuantite(e.target.value)}
                  min="1"
                  max={selectedProduit.stock.quantite_actuelle}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Réduction (Ar)</label>
                <input
                  type="number"
                  value={remise}
                  onChange={(e) => setRemise(parseFloat(e.target.value) || 0)}
                  min="0"
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg text-red-600 font-semibold"
                  placeholder="Montant à déduire..."
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-lg text-right space-y-1">
                <div className="text-sm text-gray-500">Sous-total: {(selectedProduit.prix_vente * quantite).toLocaleString('fr-FR')} Ar</div>
                {remise > 0 && <div className="text-sm text-red-500">Remise: -{remise.toLocaleString('fr-FR')} Ar</div>}
                <div className="text-2xl font-bold text-blue-600">
                  Total: {Math.max(0, (selectedProduit.prix_vente * quantite) - remise).toLocaleString('fr-FR')} Ar
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowConfirmModal(false)} className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors" disabled={isSubmitting}>
                  Annuler
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50">
                  {isSubmitting ? 'Enregistrement...' : 'Valider la Vente'}
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
