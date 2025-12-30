import { useState, useEffect, useCallback } from 'react';
import { tarifAPI, produitAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';
import PaliersRemiseModal from './PaliersRemiseModal';
import NotificationIcon from './common/NotificationIcon';
import TableLoader from './common/TableLoader';
import EmptyState from './common/EmptyState';
import { FaPlus, FaTrash, FaEdit, FaPercentage, FaDownload, FaSearch } from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';

import Pagination from './common/Pagination';

const TarifsPage = () => {
  useDocumentTitle('Gestion des Tarifs');
  const [tarifs, setTarifs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTarif, setEditingTarif] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tarifToDelete, setTarifToDelete] = useState(null);
  const [showPaliersModal, setShowPaliersModal] = useState(false);
  const [selectedTarif, setSelectedTarif] = useState(null);
  const [formData, setFormData] = useState({
    nom_service: '',
    categorie: '',
    prix_unitaire: '',
    unite_mesure: '',
    description: '',
    actif: true,
    consommations_write: []
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalItems, setTotalItems] = useState(0);

  const categories = [
    { value: 'INTERNET', label: 'Services Internet' },
    { value: 'MULTISERVICE', label: 'Multiservices' },
    { value: 'VENTE', label: 'Vente de produits' },
    { value: 'AUTRE', label: 'Autres services' }
  ];

  const unitesMesure = [
    { value: 'heure', label: 'Heure' },
    { value: 'page', label: 'Page' },
    { value: 'document', label: 'Document' },
    { value: 'pièce', label: 'Pièce' },
    { value: 'unité', label: 'Unité' },
  ];

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const loadData = useCallback(async (page, searchQuery = '') => {
    setLoading(true);
    try {
      const result = await tarifAPI.getAll({
        page: page,
        page_size: itemsPerPage,
        search: searchQuery
      });
      if (result.success) {
        if (result.data.results) {
          setTarifs(result.data.results);
          setTotalItems(result.data.count);
        } else {
          setTarifs(result.data);
          setTotalItems(result.data.length);
        }
      } else {
        showNotification('Erreur de chargement des tarifs', 'error');
      }
    } catch (error) {
      console.error('Erreur de chargement:', error);
      showNotification('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [itemsPerPage, showNotification]);

  const loadProduits = useCallback(async () => {
    const produitsResult = await produitAPI.getAll({ actif: 'true' });
    if (produitsResult.success) {
      const data = produitsResult.data.results || produitsResult.data;
      setProduits(data);
    }
  }, []);

  useEffect(() => {
    loadData(1, '');
    loadProduits();
  }, [loadData, loadProduits]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      loadData(1, searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = editingTarif
        ? await tarifAPI.update(editingTarif.id, formData)
        : await tarifAPI.create(formData);

      if (result.success) {
        await loadData(currentPage, searchTerm);
        setShowModal(false);
        showNotification(editingTarif ? 'Tarif modifié!' : 'Tarif créé!', 'success');
      } else {
        showNotification(result.error?.general || 'Une erreur est survenue.', 'error');
      }
    } catch (error) {
      console.error(error);
      showNotification('Erreur réseau ou serveur.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (tarif) => {
    setEditingTarif(tarif);
    setFormData({
      nom_service: tarif.nom_service,
      categorie: tarif.categorie,
      prix_unitaire: tarif.prix_unitaire,
      unite_mesure: tarif.unite_mesure,
      description: tarif.description || '',
      actif: tarif.actif,
      consommations_write: tarif.consommations.map(c => ({ produit_id: c.produit, quantite: c.quantite }))
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      nom_service: '',
      categorie: '',
      prix_unitaire: '',
      unite_mesure: '',
      description: '',
      actif: true,
      consommations_write: []
    });
    setEditingTarif(null);
  };

  const handleConsommationChange = (index, field, value) => {
    const newConsommations = [...formData.consommations_write];
    if (field === 'produit_id') {
      newConsommations[index][field] = parseInt(value, 10);
    } else {
      newConsommations[index][field] = value;
    }
    setFormData({ ...formData, consommations_write: newConsommations });
  };

  const addConsommation = () => {
    if (produits.length > 0) {
      setFormData({
        ...formData,
        consommations_write: [
          ...formData.consommations_write,
          { produit_id: produits[0].id, quantite: 1 }
        ]
      });
    }
  };

  const removeConsommation = (index) => {
    const newConsommations = formData.consommations_write.filter((_, i) => i !== index);
    setFormData({ ...formData, consommations_write: newConsommations });
  };

  const handleDeleteClick = (tarif) => {
    setTarifToDelete(tarif);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!tarifToDelete) return;

    try {
      const result = await tarifAPI.delete(tarifToDelete.id);
      if (result.success) {
        await loadData(currentPage, searchTerm);
        showNotification('Tarif supprimé avec succès!', 'success');
      } else {
        // Gérer spécifiquement le cas du ProtectedError (code 409)
        if (result.statusCode === 409) {
          const serviceName = tarifToDelete.nom_service;
          showNotification(`"${serviceName}" est déjà consommé par des clients et ne peut pas être supprimé.`, 'warning');
        } else {
          showNotification(result.error?.detail || 'Erreur lors de la suppression.', 'error');
        }
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      showNotification('Erreur lors de la suppression', 'error');
    } finally {
      setShowDeleteModal(false);
      setTarifToDelete(null);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setTarifToDelete(null);
  };

  const handleManageRemises = (tarif) => {
    setSelectedTarif(tarif);
    setShowPaliersModal(true);
  };

  const handleImportTarifs = async () => {
    if (window.confirm("Voulez-vous importer les tarifs standards par défaut ?")) {
      setLoading(true);
      try {
        const result = await tarifAPI.importTarifsDefaut();
        if (result.success) {
          showNotification(result.data.message);
          await loadData(currentPage, searchTerm);
        } else {
          showNotification(result.error || "Erreur lors de l'importation.", 'error');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="p-6">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-500' : notification.type === 'info' ? 'bg-blue-500' : notification.type === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
          } text-white`}>
          <NotificationIcon type={notification.type} />
          <span>{notification.message}</span>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Tarifs des Services</h1>
        <p className="text-gray-600">Gérez les prix et les produits consommés par vos services.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
        <div className="flex-1 relative group max-w-md">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher un service (nom)..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleImportTarifs}
            className="px-4 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-all transform active:scale-95 font-bold flex items-center gap-2"
            title="Importer les tarifs standards"
          >
            <FaDownload /> Importer
          </button>
          <button
            onClick={() => { resetForm(); setShowModal(true); }}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 font-bold"
          >
            <FaPlus /> Nouveau Tarif
          </button>
        </div>
      </div>

      {loading ? (
        <TableLoader message="Chargement des tarifs..." />
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produits Consommés</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Prix</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tarifs.map(tarif => (
                <tr key={tarif.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{tarif.nom_service}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {tarif.consommations.map(c => `${c.produit_nom} (x${c.quantite})`).join(', ') || 'Aucun'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div>{tarif.prix_unitaire} Ar</div>
                    {tarif.nombre_paliers > 0 && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-normal">
                        {tarif.nombre_paliers} palier(s) remise
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleManageRemises(tarif)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Gérer les remises"
                      >
                        <FaPercentage />
                      </button>
                      <button onClick={() => handleEdit(tarif)} className="text-blue-600 hover:text-blue-900" title="Modifier le tarif">
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeleteClick(tarif)} className="text-red-600 hover:text-red-900" title="Supprimer le tarif">
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tarifs.length === 0 && (
            <EmptyState message="Aucun tarif trouvé" />
          )}

          <Pagination
            currentPage={currentPage}
            totalItems={totalItems}
            itemsPerPage={itemsPerPage}
            onPageChange={(page) => {
              setCurrentPage(page);
              loadData(page, searchTerm);
            }}
          />
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">{editingTarif ? 'Modifier le tarif' : 'Nouveau tarif'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du service *</label>
                <input type="text" required value={formData.nom_service} onChange={e => setFormData({ ...formData, nom_service: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catégorie *</label>
                  <select required value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none">
                    <option value="">Sélectionner...</option>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prix unitaire (Ar) *</label>
                  <input type="number" required value={formData.prix_unitaire} onChange={e => setFormData({ ...formData, prix_unitaire: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Unité de mesure *</label>
                <select required value={formData.unite_mesure} onChange={e => setFormData({ ...formData, unite_mesure: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none">
                  <option value="">Sélectionner...</option>
                  {unitesMesure.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none min-h-[100px]" />
              </div>

              <div className="pt-4 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold mb-2 text-gray-800">Produits Consommés (Recette)</h4>
                <div className="space-y-2">
                  {formData.consommations_write.map((conso, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select value={conso.produit_id} onChange={e => handleConsommationChange(index, 'produit_id', e.target.value)} className="flex-grow px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        {produits.map(p => <option key={p.id} value={p.id}>{p.designation}</option>)}
                      </select>
                      <input type="number" placeholder="Qté" step="0.01" value={conso.quantite} onChange={e => handleConsommationChange(index, 'quantite', e.target.value)} className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={() => removeConsommation(index)} className="p-2 text-red-500 hover:bg-red-100 rounded-full"><FaTrash /></button>
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addConsommation} className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1"><FaPlus size={12} /> Ajouter un produit à la recette</button>
              </div>

              <div className="flex items-center">
                <input type="checkbox" id="actif" checked={formData.actif} onChange={e => setFormData({ ...formData, actif: e.target.checked })} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <label htmlFor="actif" className="ml-2 text-sm text-gray-700">Service actif</label>
              </div>

              <div className="flex justify-end gap-4 pt-8 border-t border-gray-100 bg-gray-50/50 p-8 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-8 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-bold transition-all shadow-sm active:scale-95"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-xl disabled:opacity-50 font-bold transition-all transform active:scale-95"
                >
                  {isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Êtes-vous sûr de vouloir supprimer le tarif "${tarifToDelete?.nom_service}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />

      {/* Modal de gestion des paliers de remise */}
      <PaliersRemiseModal
        isOpen={showPaliersModal}
        onClose={() => setShowPaliersModal(false)}
        tarif={selectedTarif}
      />
    </div>
  );
};

export default TarifsPage;
