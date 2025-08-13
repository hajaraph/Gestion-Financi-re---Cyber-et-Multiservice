import React, { useState, useEffect } from 'react';
import { tarifAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';

const TarifsPage = () => {
  const [tarifs, setTarifs] = useState([]);
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
  const [formData, setFormData] = useState({
    nom_service: '',
    categorie: '',
    prix_unitaire: '',
    unite_mesure: '',
    description: '',
    type_papier: '', // Nouveau champ pour les multiservices
    actif: true
  });

  const categories = [
    { value: 'INTERNET', label: 'Services Internet' },
    { value: 'MULTISERVICE', label: 'Multiservices (Impression, Photocopie, etc.)' },
    { value: 'VENTE', label: 'Vente de produits' },
    { value: 'AUTRE', label: 'Autres services' }
  ];

  const typesPapier = [
    { value: 'A4', label: 'A4' },
    { value: 'A3', label: 'A3' },
    { value: 'BRISTOL', label: 'Bristol' },
    { value: 'AUTRE', label: 'Autre type' }
  ];

  const unitesMesure = [
    { value: 'heure', label: 'Heure' },
    { value: 'minute', label: 'Minute' },
    { value: 'page', label: 'Page' },
    { value: 'document', label: 'Document' },
    { value: 'pièce', label: 'Pièce' },
    { value: 'unité', label: 'Unité' },
    { value: 'forfait', label: 'Forfait' },
    { value: 'rame', label: 'Rame' },
    { value: 'copie', label: 'Copie' },
    { value: 'scan', label: 'Scan' },
    { value: 'autre', label: 'Autre' }
  ];

  useEffect(() => {
    loadTarifs();
  }, []);

  const loadTarifs = async () => {
    setLoading(true);
    try {
      const result = await tarifAPI.getAll();
      if (result.success) {
        setTarifs(result.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tarifs:', error);
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
        await loadTarifs();
        resetForm();
        setShowModal(false);

        const message = editingTarif
          ? 'Tarif modifié avec succès!'
          : 'Tarif créé avec succès!';

        showNotification(message, 'success');

      } else {
        // Gérer les erreurs de validation du serveur
        if (result.error && typeof result.error === 'object') {
          setErrors(result.error);
        } else {
          setErrors({ general: result.error });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      setErrors({ general: 'Une erreur inattendue s\'est produite' });
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
      type_papier: tarif.type_papier || '', // Prendre en compte le type de papier
      actif: tarif.actif
    });
    setShowModal(true);
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
        await loadTarifs();
        showNotification('Tarif supprimé avec succès!', 'success');
      } else {
        showNotification(result.error, 'error');
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

  const resetForm = () => {
    setFormData({
      nom_service: '',
      categorie: '',
      prix_unitaire: '',
      unite_mesure: '',
      description: '',
      type_papier: '', // Réinitialiser le type de papier
      actif: true
    });
    setEditingTarif(null);
  };

  const importDefaultTarifs = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir importer les tarifs par défaut ? Cela ajoutera de nouveaux tarifs.')) {
      return;
    }

    try {
      setLoading(true);
      const result = await tarifAPI.importDefaults();
      if (result.success) {
        await loadTarifs();
        showNotification(result.message || 'Tarifs par défaut importés avec succès !', 'success');
      } else {
        showNotification('Erreur lors de l\'importation: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Erreur lors de l\'importation:', error);
      showNotification('Erreur lors de l\'importation des tarifs par défaut', 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredTarifs = tarifs.filter(tarif => {
    const matchesSearch = tarif.nom_service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || tarif.categorie === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryLabel = (category) => {
    return categories.find(cat => cat.value === category)?.label || category;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' Ar';
  };

  return (
    <div className="p-6 relative">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${
          notification.type === 'success' 
            ? 'bg-green-500 text-white' 
            : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Tarifs des Services</h1>
        <p className="text-gray-600">Gérez les prix de vos services du cyber café</p>
      </div>

      {/* Actions et filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher un service..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filtre par catégorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Toutes les catégories</option>
            {categories.map(category => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <button
            onClick={importDefaultTarifs}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            Importer par défaut
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau tarif
          </button>
        </div>
      </div>

      {/* Tableau des tarifs */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Catégorie</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix unitaire</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTarifs.map((tarif) => (
                  <tr key={tarif.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{tarif.nom_service}</div>
                        {tarif.description && (
                          <div className="text-sm text-gray-500">{tarif.description}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {getCategoryLabel(tarif.categorie)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatPrice(tarif.prix_unitaire)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {tarif.unite_mesure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        tarif.actif 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {tarif.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(tarif)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Modifier le tarif"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeleteClick(tarif)}
                          className="text-red-600 hover:text-red-900"
                          title="Supprimer le tarif"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
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

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingTarif ? 'Modifier le tarif' : 'Nouveau tarif'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setErrors({});
                }}
                className="text-gray-400 hover:text-gray-600"
                disabled={isSubmitting}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Message d'erreur général */}
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <span className="text-red-600 text-sm">{errors.general}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom du service *
                </label>
                <input
                  type="text"
                  required
                  value={formData.nom_service}
                  onChange={(e) => {
                    setFormData({...formData, nom_service: e.target.value});
                    if (errors.nom_service) setErrors({...errors, nom_service: ''});
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                    ${errors.nom_service ? 'border-red-400 bg-red-50' : 'border-gray-300'}
                  `}
                  placeholder="Ex: Internet 1 heure"
                  disabled={isSubmitting}
                />
                {errors.nom_service && (
                  <span className="text-red-600 text-xs mt-1 block">{errors.nom_service}</span>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Catégorie *
                </label>
                <select
                  required
                  value={formData.categorie}
                  onChange={(e) => {
                    setFormData({...formData, categorie: e.target.value});
                    if (errors.categorie) setErrors({...errors, categorie: ''});
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                    ${errors.categorie ? 'border-red-400 bg-red-50' : 'border-gray-300'}
                  `}
                  disabled={isSubmitting}
                >
                  <option value="">Sélectionner une catégorie</option>
                  {categories.map(category => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.categorie && (
                  <span className="text-red-600 text-xs mt-1 block">{errors.categorie}</span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix unitaire (Ar) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.prix_unitaire}
                    onChange={(e) => {
                      setFormData({...formData, prix_unitaire: e.target.value});
                      if (errors.prix_unitaire) setErrors({...errors, prix_unitaire: ''});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                      ${errors.prix_unitaire ? 'border-red-400 bg-red-50' : 'border-gray-300'}
                    `}
                    placeholder="500"
                    disabled={isSubmitting}
                  />
                  {errors.prix_unitaire && (
                    <span className="text-red-600 text-xs mt-1 block">{errors.prix_unitaire}</span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unité de mesure *
                  </label>
                  <select
                    required
                    value={formData.unite_mesure}
                    onChange={(e) => {
                      setFormData({...formData, unite_mesure: e.target.value});
                      if (errors.unite_mesure) setErrors({...errors, unite_mesure: ''});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                      ${errors.unite_mesure ? 'border-red-400 bg-red-50' : 'border-gray-300'}
                    `}
                    disabled={isSubmitting}
                  >
                    <option value="">Sélectionner une unité</option>
                    {unitesMesure.map(unite => (
                      <option key={unite.value} value={unite.value}>
                        {unite.label}
                      </option>
                    ))}
                  </select>
                  {errors.unite_mesure && (
                    <span className="text-red-600 text-xs mt-1 block">{errors.unite_mesure}</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description optionnelle du service"
                  disabled={isSubmitting}
                />
              </div>

              {/* Champ pour le type de papier, visible uniquement pour les multiservices */}
              {formData.categorie === 'MULTISERVICE' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de papier
                  </label>
                  <select
                    value={formData.type_papier}
                    onChange={(e) => {
                      setFormData({...formData, type_papier: e.target.value});
                      if (errors.type_papier) setErrors({...errors, type_papier: ''});
                    }}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors
                      ${errors.type_papier ? 'border-red-400 bg-red-50' : 'border-gray-300'}
                    `}
                    disabled={isSubmitting}
                  >
                    <option value="">Sélectionner un type de papier</option>
                    {typesPapier.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {errors.type_papier && (
                    <span className="text-red-600 text-xs mt-1 block">{errors.type_papier}</span>
                  )}
                </div>
              )}

              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.actif}
                    onChange={(e) => setFormData({...formData, actif: e.target.checked})}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="ml-2 text-sm text-gray-700">Service actif</span>
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setErrors({});
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2
                    ${isSubmitting 
                      ? 'opacity-70 cursor-not-allowed' 
                      : 'hover:bg-blue-700'
                    }
                  `}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Sauvegarde...</span>
                    </>
                  ) : (
                    editingTarif ? 'Modifier' : 'Créer'
                  )}
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
    </div>
  );
};

export default TarifsPage;
