import React, { useState, useEffect } from 'react';
import { 
  FaBox, 
  FaBoxOpen, 
  FaPlus,
  FaSearch,
  FaExchangeAlt
} from 'react-icons/fa';
import { stockAPI } from '../services/api';

const StockPage = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [alertFilter, setAlertFilter] = useState('all');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  
  const [movementForm, setMovementForm] = useState({
    type_mouvement: 'ENTREE',
    quantite: '',
    en_unites: false,
    motif: 'ACHAT',
    prix_unitaire: '',
    commentaire: '',
    numero_facture: ''
  });

  const generateProductCode = (productName) => {
    if (!productName) return '';
    
    // Prendre les 3 premières lettres du premier mot
    const firstWord = productName.trim().split(' ')[0].toUpperCase().substring(0, 3);
    
    // Prendre la première lettre de chaque mot suivant
    const otherLetters = productName
      .split(' ')
      .slice(1)
      .map(word => word.charAt(0).toUpperCase())
      .join('');
    
    // Ajouter un timestamp pour l'unicité
    const timestamp = new Date().getTime().toString().slice(-4);
    
    return `${firstWord}${otherLetters}${timestamp}`.toUpperCase();
  };

  const [productForm, setProductForm] = useState({
    nom_produit: '',
    code_produit: '',
    quantite_actuelle: 0,
    quantite_minimale: 10,
    quantite_par_paquet: 1,
    est_vendu_unite: false,
    unite_mesure: 'unité',
    prix_unitaire_achat: '',
    prix_unitaire_vente: '',
    description: ''
  });
  
  const handleProductNameChange = (e) => {
    const newName = e.target.value;
    setProductForm(prev => {
      const newCode = generateProductCode(newName);
      return {
        ...prev,
        nom_produit: newName,
        code_produit: newCode
      };
    });
  };

  // Fetch stocks data
  useEffect(() => {
    let isMounted = true;

    const fetchStocks = async () => {
      try {
        const response = await stockAPI.getAll();
        if (isMounted) {
          setStocks(response.data);
        }
      } catch (error) {
        console.error('Error fetching stocks:', error);
        showNotification('Erreur lors du chargement des stocks', 'error');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    // Gestion de la promesse avec .then() et .catch()
    fetchStocks()
      .then(() => {
        // Callback optionnel après le succès
      })
      .catch((error) => {
        // Gestion des erreurs déjà faite dans fetchStocks
        // Cette partie est optionnelle, car on gère déjà les erreurs dans le try/catch
        console.error('Error in fetchStocks promise chain:', error);
      });
  }, []);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleMovementSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const quantite = parseFloat(movementForm.quantite);
      const en_unites = movementForm.en_unites && selectedStock.est_vendu_unite;
      
      // Vérifier si on a assez de stock pour une sortie
      if (movementForm.type_mouvement === 'SORTIE' || movementForm.type_mouvement === 'PERTE') {
        const quantiteDisponible = en_unites 
          ? selectedStock.quantite_actuelle * selectedStock.quantite_par_paquet
          : selectedStock.quantite_actuelle;
          
        if (quantite > quantiteDisponible) {
          showNotification(`Stock insuffisant. Quantité disponible: ${quantiteDisponible} ${en_unites ? 'unité(s)' : selectedStock.unite_mesure}`, 'error');
          return;
        }
      }
      
      const movementData = {
        ...movementForm,
        stock: selectedStock.id,
        quantite: quantite,
        en_unites: en_unites,
        prix_unitaire: parseFloat(movementForm.prix_unitaire) || 
          (movementForm.type_mouvement === 'ENTREE' 
            ? selectedStock.prix_unitaire_achat 
            : selectedStock.prix_unitaire_vente)
      };
      
      await stockAPI.createMovement(movementData);
      showNotification('Mouvement enregistré avec succès');
      setShowMovementModal(false);
      
      // Mettre à jour le stock localement pour éviter un rechargement complet
      const updatedStocks = stocks.map(stock => {
        if (stock.id === selectedStock.id) {
          const quantiteMouvement = en_unites 
            ? quantite / selectedStock.quantite_par_paquet 
            : quantite;
            
          const newQuantite = movementForm.type_mouvement === 'ENTREE'
            ? parseFloat(stock.quantite_actuelle) + quantiteMouvement
            : parseFloat(stock.quantite_actuelle) - quantiteMouvement;
            
          return { ...stock, quantite_actuelle: Math.max(0, newQuantite) };
        }
        return stock;
      });
      
      setStocks(updatedStocks);
    } catch (error) {
      console.error('Error creating movement:', error);
      showNotification('Erreur lors de l\'enregistrement du mouvement', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const productData = {
        ...productForm,
        quantite_actuelle: parseFloat(productForm.quantite_actuelle),
        quantite_minimale: parseFloat(productForm.quantite_minimale),
        quantite_par_paquet: parseInt(productForm.quantite_par_paquet) || 1,
        est_vendu_unite: productForm.est_vendu_unite || false,
        prix_unitaire_achat: parseFloat(productForm.prix_unitaire_achat),
        prix_unitaire_vente: parseFloat(productForm.prix_unitaire_vente)
      };
      
      await stockAPI.createProduct(productData);
      showNotification('Produit ajouté avec succès');
      setShowProductModal(false);
      // Refresh stocks data
      const response = await stockAPI.getAll();
      setStocks(response.data);
    } catch (error) {
      console.error('Error creating product:', error);
      showNotification('Erreur lors de l\'ajout du produit', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.nom_produit.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.code_produit.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (alertFilter === 'rupture') {
      return matchesSearch && stock.quantite_actuelle <= 0;
    } else if (alertFilter === 'reappro') {
      return matchesSearch && stock.quantite_actuelle > 0 && 
             stock.quantite_actuelle <= stock.quantite_minimale;
    }
    
    return matchesSearch;
  });

  const stats = stocks.reduce((acc, stock) => {
    acc.totalValeurAchat += stock.quantite_actuelle * stock.prix_unitaire_achat;
    acc.totalValeurVente += stock.quantite_actuelle * stock.prix_unitaire_vente;
    if (stock.quantite_actuelle <= 0) acc.ruptures++;
    if (stock.quantite_actuelle > 0 && stock.quantite_actuelle <= stock.quantite_minimale) acc.reappro++;
    return acc;
  }, { totalValeurAchat: 0, totalValeurVente: 0, ruptures: 0, reappro: 0 });

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestion des Stocks</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowProductModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center"
          >
            <FaPlus className="mr-2" /> Nouveau Produit
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Valeur d'achat</div>
          <div className="text-2xl font-bold">{(stats.totalValeurAchat || 0).toFixed(2)} Ar</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-gray-500 text-sm">Valeur de vente</div>
          <div className="text-2xl font-bold text-green-600">{(stats.totalValeurVente || 0).toFixed(2)} Ar</div>
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Rechercher un produit..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-2">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={alertFilter}
              onChange={(e) => setAlertFilter(e.target.value)}
            >
              <option value="all">Tous les produits</option>
              <option value="rupture">En rupture</option>
              <option value="reappro">À réapprovisionner</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stocks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Produit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock actuel</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Seuil min</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix d'achat</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix de vente</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Chargement des données...
                  </td>
                </tr>
              ) : filteredStocks.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-4 text-center text-gray-500">
                    Aucun produit trouvé
                  </td>
                </tr>
              ) : (
                filteredStocks.map((stock) => (
                  <tr key={stock.id} className={stock.quantite_actuelle <= 0 ? 'bg-red-50' : 
                                             stock.quantite_actuelle <= stock.quantite_minimale ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-blue-100 rounded-full">
                          {stock.quantite_actuelle <= 0 ? (
                            <FaBoxOpen className="h-5 w-5 text-red-500" />
                          ) : (
                            <FaBox className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{stock.nom_produit}</div>
                          <div className="text-sm text-gray-500">{stock.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.code_produit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        stock.quantite_actuelle <= 0 ? 'bg-red-100 text-red-800' :
                        stock.quantite_actuelle <= stock.quantite_minimale ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {stock.quantite_actuelle} {stock.unite_mesure}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.quantite_minimale} {stock.unite_mesure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stock.est_vendu_unite ? (
                        <>
                          {stock.quantite_actuelle * stock.quantite_par_paquet} unités
                          <span className="text-gray-400 text-xs ml-1">
                            ({stock.quantite_actuelle} paquet{stock.quantite_actuelle > 1 ? 's' : ''} x {stock.quantite_par_paquet})
                          </span>
                        </>
                      ) : (
                        `${stock.quantite_actuelle} ${stock.unite_mesure}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {typeof stock.prix_unitaire_achat === 'number' ? stock.prix_unitaire_achat.toFixed(2) : '0.00'} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {typeof stock.prix_unitaire_vente === 'number' ? stock.prix_unitaire_vente.toFixed(2) : '0.00'} €
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedStock(stock);
                          setMovementForm({
                            ...movementForm,
                            prix_unitaire: stock.prix_unitaire_achat
                          });
                          setShowMovementModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        title="Ajouter un mouvement"
                      >
                        <FaExchangeAlt className="inline" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Movement Modal */}
      {showMovementModal && selectedStock && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header du modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FaExchangeAlt className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {movementForm.type_mouvement === 'ENTREE' ? 'Entrée' : 'Sortie'} de stock - {selectedStock.nom_produit}
                  </h3>
                </div>
                <button
                  onClick={() => setShowMovementModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Corps du modal */}
            <div className="px-6 py-4">
              
              <form onSubmit={handleMovementSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produit
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={selectedStock.nom_produit}
                    disabled
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type de mouvement
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      value={movementForm.type_mouvement}
                      onChange={(e) => setMovementForm({...movementForm, type_mouvement: e.target.value})}
                    >
                      <option value="ENTREE">Entrée</option>
                      <option value="SORTIE">Sortie</option>
                      <option value="AJUSTEMENT">Ajustement</option>
                    </select>
                  </div>
                  
                  <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">
                      Quantité
                    </label>
                    {selectedStock?.est_vendu_unite && (
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 mr-2">En unités</span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={movementForm.en_unites}
                            onChange={(e) => setMovementForm({...movementForm, en_unites: e.target.checked})}
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      step={movementForm.en_unites ? "1" : "0.01"}
                      min="0"
                      className="w-full pl-3 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={movementForm.quantite}
                      onChange={(e) => setMovementForm({...movementForm, quantite: e.target.value})}
                      required
                    />
                    <span className="absolute right-3 top-2 text-sm text-gray-500">
                      {movementForm.en_unites ? 'unité(s)' : selectedStock?.unite_mesure || 'unité'}
                    </span>
                  </div>
                  {selectedStock?.est_vendu_unite && movementForm.en_unites && movementForm.quantite > 0 && (
                    <p className="mt-1 text-xs text-gray-500">
                      = {selectedStock && selectedStock.quantite_par_paquet > 0 ? (movementForm.quantite / selectedStock.quantite_par_paquet).toFixed(2) : '0.00'} paquet(s)
                    </p>
                  )}
                </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motif
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={movementForm.motif}
                    onChange={(e) => setMovementForm({...movementForm, motif: e.target.value})}
                  >
                    <option value="ACHAT">Achat fournisseur</option>
                    <option value="VENTE">Vente client</option>
                    <option value="RETOUR">Retour client</option>
                    <option value="PERTE">Perte/Casse</option>
                    <option value="INVENTAIRE">Inventaire</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix unitaire ({selectedStock.prix_unitaire_achat} € par défaut)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={movementForm.prix_unitaire}
                    onChange={(e) => setMovementForm({...movementForm, prix_unitaire: e.target.value})}
                    placeholder={selectedStock.prix_unitaire_achat}
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Commentaire (optionnel)
                  </label>
                  <textarea
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    value={movementForm.commentaire}
                    onChange={(e) => setMovementForm({...movementForm, commentaire: e.target.value})}
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowMovementModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* New Product Modal */}

      {/* New Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header du modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FaPlus className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Nouveau Produit</h3>
                </div>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                  disabled={isSubmitting}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Corps du modal */}
            <div className="p-6">
              <form onSubmit={handleProductSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom du produit <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={productForm.nom_produit}
                      onChange={handleProductNameChange}
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Code produit
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-gray-50"
                        value={productForm.code_produit}
                        onChange={(e) => setProductForm({...productForm, code_produit: e.target.value})}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setProductForm(prev => ({
                          ...prev,
                          code_produit: generateProductCode(prev.nom_produit)
                        }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:text-blue-800"
                        title="Régénérer le code"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock initial
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={productForm.quantite_actuelle}
                      onChange={(e) => setProductForm({...productForm, quantite_actuelle: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Seuil d'alerte
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={productForm.quantite_minimale}
                      onChange={(e) => setProductForm({...productForm, quantite_minimale: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center mb-1">
                      <input
                        type="checkbox"
                        id="est_vendu_unite"
                        checked={productForm.est_vendu_unite}
                        onChange={(e) => setProductForm({...productForm, est_vendu_unite: e.target.checked})}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="est_vendu_unite" className="ml-2 block text-sm font-medium text-gray-700">
                        Vendu à l'unité
                      </label>
                    </div>
                    {productForm.est_vendu_unite && (
                      <div className="mt-2">
                        <label htmlFor="quantite_par_paquet" className="block text-sm font-medium text-gray-700 mb-1">
                          Unités par paquet
                        </label>
                        <input
                          type="number"
                          id="quantite_par_paquet"
                          min="1"
                          value={productForm.quantite_par_paquet}
                          onChange={(e) => setProductForm({...productForm, quantite_par_paquet: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unité de mesure
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      value={productForm.unite_mesure}
                      onChange={(e) => setProductForm({...productForm, unite_mesure: e.target.value})}
                    >
                      <option value="unité">Unité</option>
                      <option value="kg">Kilogramme (kg)</option>
                      <option value="g">Gramme (g)</option>
                      <option value="L">Litre (L)</option>
                      <option value="mL">Millilitre (mL)</option>
                      <option value="m">Mètre (m)</option>
                      <option value="cm">Centimètre (cm)</option>
                      <option value="mm">Millimètre (mm)</option>
                      <option value="paquet">Paquet</option>
                      <option value="carton">Carton</option>
                      <option value="boîte">Boîte</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix d'achat {productForm.est_vendu_unite ? 'par unité' : 'par paquet'} (HT)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        value={productForm.prix_unitaire_achat}
                        onChange={(e) => setProductForm({...productForm, prix_unitaire_achat: parseFloat(e.target.value) || 0})}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">Ar</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Prix de vente {productForm.est_vendu_unite ? 'par unité' : 'par paquet'} (TTC)
                    </label>
                    <div className="relative rounded-md shadow-sm">
                      <input
                        type="number"
                        step="0.01"
                        min={productForm.prix_unitaire_achat || '0'}
                        className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        value={productForm.prix_unitaire_vente}
                        onChange={(e) => setProductForm({...productForm, prix_unitaire_vente: parseFloat(e.target.value) || 0})}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">Ar</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (optionnel)
                  </label>
                  <textarea
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    value={productForm.description}
                    onChange={(e) => setProductForm({...productForm, description: e.target.value})}
                    placeholder="Description du produit..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  >
                    {isSubmitting ? 'Création...' : 'Créer le produit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Notification */}
      {notification && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );
};

export default StockPage;
