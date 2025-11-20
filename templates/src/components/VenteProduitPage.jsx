import React, { useState, useEffect } from 'react';
import { produitAPI, venteProduitAPI } from '../services/api';

const VenteProduitPage = () => {
  const [produits, setProduits] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduit, setSelectedProduit] = useState(null);
  const [quantite, setQuantite] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const fetchProduits = async () => {
      const result = await produitAPI.getAll({ en_stock: 'true' });
      if (result.success) {
        setProduits(result.data);
      }
    };
    fetchProduits();
  }, []);

  const filteredProduits = produits.filter(p =>
    p.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVente = async () => {
    if (!selectedProduit || quantite <= 0) {
      notify('Veuillez sélectionner un produit et une quantité valide.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        produit: selectedProduit.id,
        quantite: quantite,
        prix_unitaire: selectedProduit.prix_vente,
      };
      const result = await venteProduitAPI.create(payload);
      if (result.success) {
        notify('Vente enregistrée avec succès!');
        setSelectedProduit(null);
        setQuantite(1);
        // Optionnel: rafraîchir la liste des produits pour mettre à jour le stock visible
      } else {
        notify(result.error?.quantite || result.error?.detail || 'Erreur lors de la vente.', 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.message}
        </div>
      )}
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Point de Vente Directe</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Colonne de sélection des produits */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">1. Sélectionner un Produit</h2>
          <input
            type="text"
            placeholder="Rechercher un produit en stock..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full mb-4 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <div className="max-h-96 overflow-y-auto">
            {filteredProduits.map(p => (
              <div
                key={p.id}
                onClick={() => setSelectedProduit(p)}
                className={`p-3 rounded-lg cursor-pointer mb-2 ${selectedProduit?.id === p.id ? 'bg-blue-600 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                <p className="font-semibold">{p.designation}</p>
                <p className="text-sm">{p.prix_vente.toLocaleString('fr-FR')} Ar - Stock: {p.quantite_stock} {p.unite_mesure_symbole}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Colonne de confirmation de la vente */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">2. Confirmer la Vente</h2>
          {selectedProduit ? (
            <div className="space-y-4">
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
                  max={selectedProduit.quantite_stock}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div className="text-2xl font-bold text-right">
                Total: {(selectedProduit.prix_vente * quantite).toLocaleString('fr-FR')} Ar
              </div>
              <button
                onClick={handleVente}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isSubmitting ? 'Enregistrement...' : 'Valider la Vente'}
              </button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-16">
              <p>Veuillez sélectionner un produit dans la liste de gauche.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VenteProduitPage;
