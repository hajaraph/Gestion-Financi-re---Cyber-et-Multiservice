import React, { useState, useEffect } from 'react';
import { tarifAPI, produitAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';
import PaliersRemiseModal from './PaliersRemiseModal';
import NotificationIcon from './common/NotificationIcon';
import { FaPlus, FaTrash, FaEdit, FaPercentage } from 'react-icons/fa';
import useDocumentTitle from '../hooks/useDocumentTitle';

const TarifsPage = () => {
  useDocumentTitle('Gestion des Tarifs');
  const [tarifs, setTarifs] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTarif, setEditingTarif] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
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

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [tarifsResult, produitsResult] = await Promise.all([
        tarifAPI.getAll(),
        produitAPI.getAll({ actif: 'true' })
      ]);
      if (tarifsResult.success) setTarifs(tarifsResult.data);
      if (produitsResult.success) setProduits(produitsResult.data);
    } catch (error) {
      console.error('Erreur de chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const result = editingTarif
        ? await tarifAPI.update(editingTarif.id, formData)
        : await tarifAPI.create(formData);

      if (result.success) {
        await loadInitialData();
        setShowModal(false);
        showNotification(editingTarif ? 'Tarif modifié!' : 'Tarif créé!', 'success');
      } else {
        setErrors(result.error || { general: 'Une erreur est survenue.' });
      }
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
        await loadInitialData();
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

  const filteredTarifs = tarifs.filter(tarif =>
    tarif.nom_service.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === '' || tarif.categorie === selectedCategory)
  );

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

      <div className="mb-6 flex justify-between items-center">
        <input type="text" placeholder="Rechercher..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full max-w-md pl-10 pr-4 py-2 border border-gray-300 rounded-lg" />
        <button onClick={() => { resetForm(); setShowModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"><FaPlus /> Nouveau tarif</button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des tarifs...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                {filteredTarifs.map(tarif => (
                  <tr key={tarif.id}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{tarif.nom_service}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {tarif.consommations.map(c => `${c.produit_nom} (x${c.quantite})`).join(', ') || 'Aucun'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">{tarif.prix_unitaire} Ar</td>
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
            {filteredTarifs.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <p>Aucun tarif trouvé</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
              <h3 className="text-lg font-semibold text-gray-900">{editingTarif ? 'Modifier le tarif' : 'Nouveau tarif'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du service *</label>
                <input type="text" required value={formData.nom_service} onChange={e => setFormData({ ...formData, nom_service: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                  <select required value={formData.categorie} onChange={e => setFormData({ ...formData, categorie: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Sélectionner...</option>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix unitaire (Ar) *</label>
                  <input type="number" required value={formData.prix_unitaire} onChange={e => setFormData({ ...formData, prix_unitaire: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unité de mesure *</label>
                <select required value={formData.unite_mesure} onChange={e => setFormData({ ...formData, unite_mesure: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                  <option value="">Sélectionner...</option>
                  {unitesMesure.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
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

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Annuler</button>
                <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50">{isSubmitting ? 'Sauvegarde...' : 'Sauvegarder'}</button>
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
