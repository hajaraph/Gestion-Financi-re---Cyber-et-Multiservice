import React, { useEffect, useState } from 'react';
import { produitAPI, categorieProduitAPI, uniteMesureAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';

const emptyForm = {
  designation: '',
  categorie: '',
  unite_mesure: '',
  prix_vente: '',
  description: '',
  actif: true,
  unite_achat: '',
  quantite_par_unite_achat: 1,
};

const ProduitsPage = () => {
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [unites, setUnites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [produitsResult, categoriesResult, unitesResult] = await Promise.all([
        produitAPI.getAll(),
        categorieProduitAPI.getAll(),
        uniteMesureAPI.getAll(),
      ]);
      if (produitsResult.success) setProduits(produitsResult.data);
      if (categoriesResult.success) setCategories(categoriesResult.data);
      if (unitesResult.success) setUnites(unitesResult.data);
    } finally {
      setLoading(false);
    }
  };

  const filtered = produits.filter(p =>
    p.designation?.toLowerCase().includes(search.toLowerCase()) ||
    p.reference?.toLowerCase().includes(search.toLowerCase())
  );

  const notify = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  };

  const openEdit = (prod) => {
    setEditing(prod);
    setForm({
      designation: prod.designation || '',
      categorie: prod.categorie || '',
      unite_mesure: prod.unite_mesure || '',
      prix_vente: prod.prix_vente || '',
      description: prod.description || '',
      actif: prod.actif,
      unite_achat: prod.unite_achat || '',
      quantite_par_unite_achat: prod.quantite_par_unite_achat || 1,
    });
    setErrors({});
    setShowModal(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    try {
      const payload = { 
        ...form,
        prix_vente: form.prix_vente || 0,
        unite_achat: form.unite_achat || null, // Envoyer null si vide
       };
      const result = editing
        ? await produitAPI.update(editing.id, payload)
        : await produitAPI.create(payload);

      if (result.success) {
        await load();
        setShowModal(false);
        notify(editing ? 'Produit modifié avec succès' : 'Produit créé avec succès');
      } else {
        const err = result.error;
        if (err && typeof err === 'object') setErrors(err);
        else setErrors({ general: err });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (prod) => {
    setToDelete(prod);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      const result = await produitAPI.delete(toDelete.id);
      if (result.success) {
        await load();
        notify('Produit supprimé');
      } else {
        notify(result.error || 'Erreur lors de la suppression', 'error');
      }
    } finally {
      setShowDeleteModal(false);
      setToDelete(null);
    }
  };

  return (
    <div className="p-6 relative">
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg animate-slide-up ${
          notification.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          <div className="flex items-center gap-2">
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Produits</h1>
        <p className="text-gray-600">Enregistrer et gérer les produits</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Rechercher par désignation ou référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex gap-2">
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouveau produit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des produits...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Référence</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Désignation</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unité</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Prix vente</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.reference}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{p.designation}</div>
                      {p.description && <div className="text-sm text-gray-500">{p.description}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.unite_mesure_symbole || p.unite_mesure}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{new Intl.NumberFormat('fr-FR').format(p.prix_vente || 0)} Ar</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${p.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-900" title="Modifier le produit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => requestDelete(p)} className="text-red-600 hover:text-red-900" title="Supprimer le produit">
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

            {filtered.length === 0 && (
              <div className="p-8 text-center text-gray-500">Aucun produit trouvé</div>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Modifier le produit' : 'Nouveau produit'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={onSubmit} className="p-6 space-y-4">
              {errors.general && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <span className="text-red-600 text-sm">{errors.general}</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Désignation *</label>
                <input
                  type="text"
                  required
                  value={form.designation}
                  onChange={(e) => setForm({ ...form, designation: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.designation ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                  placeholder="Ex: Rame de papier A4"
                  disabled={isSubmitting}
                />
                {errors.designation && <span className="text-red-600 text-xs mt-1 block">{errors.designation}</span>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                  <select
                    required
                    value={form.categorie}
                    onChange={(e) => setForm({ ...form, categorie: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.categorie ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    disabled={isSubmitting}
                  >
                    <option value="">Sélectionner...</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nom}</option>
                    ))}
                  </select>
                  {errors.categorie && <span className="text-red-600 text-xs mt-1 block">{errors.categorie}</span>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prix de vente (Ar) *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.prix_vente}
                    onChange={(e) => setForm({ ...form, prix_vente: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.prix_vente ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                  {errors.prix_vente && <span className="text-red-600 text-xs mt-1 block">{errors.prix_vente}</span>}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="text-md font-semibold text-gray-800 mb-2">Gestion des Unités</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unité de Stock (de base) *</label>
                        <select
                            required
                            value={form.unite_mesure}
                            onChange={(e) => setForm({ ...form, unite_mesure: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.unite_mesure ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            disabled={isSubmitting}
                        >
                            <option value="">Sélectionner...</option>
                            {unites.map(unite => (
                            <option key={unite.id} value={unite.id}>{unite.nom} ({unite.symbole})</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Ex: Feuille, Pièce, Bouteille</p>
                        {errors.unite_mesure && <span className="text-red-600 text-xs mt-1 block">{errors.unite_mesure}</span>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Unité d'Achat</label>
                        <select
                            value={form.unite_achat}
                            onChange={(e) => setForm({ ...form, unite_achat: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.unite_achat ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            disabled={isSubmitting}
                        >
                            <option value="">(Aucune)</option>
                            {unites.map(unite => (
                            <option key={unite.id} value={unite.id}>{unite.nom} ({unite.symbole})</option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-500 mt-1">Ex: Rame, Paquet, Carton</p>
                        {errors.unite_achat && <span className="text-red-600 text-xs mt-1 block">{errors.unite_achat}</span>}
                    </div>
                </div>
                {form.unite_achat && (
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Facteur de Conversion *</label>
                        <input
                            type="number"
                            min="1"
                            required
                            value={form.quantite_par_unite_achat}
                            onChange={(e) => setForm({ ...form, quantite_par_unite_achat: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.quantite_par_unite_achat ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                            placeholder="Ex: 500"
                            disabled={isSubmitting}
                        />
                        <p className="text-xs text-gray-500 mt-1">Combien d'unités de stock dans 1 unité d'achat ? (Ex: 500 feuilles dans 1 rame)</p>
                        {errors.quantite_par_unite_achat && <span className="text-red-600 text-xs mt-1 block">{errors.quantite_par_unite_achat}</span>}
                    </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Description optionnelle"
                  disabled={isSubmitting}
                />
              </div>

              <div className="flex items-center">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={form.actif}
                      onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      disabled={isSubmitting}
                    />
                    <span className="ml-2 text-sm text-gray-700">Produit actif</span>
                  </label>
                </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 ${isSubmitting ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700'}`}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Sauvegarde...' : (editing ? 'Modifier' : 'Créer')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Supprimer le produit "${toDelete?.designation}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default ProduitsPage;
