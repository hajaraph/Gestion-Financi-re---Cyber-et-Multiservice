import React, { useState, useEffect } from 'react';
import { depenseAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';
import NotificationIcon from './common/NotificationIcon'; // Import du composant centralisé
import { FaPlus, FaEdit, FaTrash, FaSearch, FaTimes } from 'react-icons/fa'; // Import de FaTimes
import useDocumentTitle from '../hooks/useDocumentTitle';

const DepensesPage = () => {
    useDocumentTitle('Gestion des Dépenses');
    const [depenses, setDepenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingDepense, setEditingDepense] = useState(null);
    const [errors, setErrors] = useState({});
    const [searchTerm, setSearchTerm] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [toDelete, setToDelete] = useState(null);

    const emptyForm = {
        description: '',
        montant: '',
        categorie_depense: 'AUTRE',
        fournisseur: '',
        numero_facture: '',
    };
    const [form, setForm] = useState(emptyForm);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [depensesResult, categoriesResult] = await Promise.all([
                depenseAPI.getAll(),
                depenseAPI.getCategories()
            ]);
            if (depensesResult.success) {
                setDepenses(depensesResult.data);
            } else {
                notify('Erreur de chargement des dépenses.', 'error');
            }
            if (categoriesResult.success) {
                // Tri côté client pour s'assurer que la liste est toujours alphabétique
                const sortedCategories = categoriesResult.data.sort((a, b) => a.label.localeCompare(b.label));
                setCategories(sortedCategories);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadInitialData();
    }, []);

    const notify = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 4000);
    };

    const openCreateModal = () => {
        setEditingDepense(null);
        setForm(emptyForm);
        setErrors({});
        setShowModal(true);
    };

    const openEditModal = (depense) => {
        setEditingDepense(depense);
        setForm({
            description: depense.transaction.description,
            montant: depense.transaction.montant,
            categorie_depense: depense.categorie_depense,
            fournisseur: depense.fournisseur || '',
            numero_facture: depense.numero_facture || '',
        });
        setErrors({});
        setShowModal(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        const payload = {
            transaction: {
                description: form.description,
                montant: form.montant,
            },
            categorie_depense: form.categorie_depense,
            fournisseur: form.fournisseur,
            numero_facture: form.numero_facture,
        };

        const result = editingDepense
            ? await depenseAPI.update(editingDepense.id, payload)
            : await depenseAPI.create(payload);

        if (result.success) {
            notify(editingDepense ? 'Dépense modifiée!' : 'Dépense ajoutée!', 'success');
            setShowModal(false);
            await loadInitialData();
        } else {
            setErrors(result.error || { general: 'Une erreur est survenue.' });
        }
        setIsSubmitting(false);
    };

    const requestDelete = (depense) => {
        setToDelete(depense);
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        const result = await depenseAPI.delete(toDelete.id);
        if (result.success) {
            notify('Dépense supprimée.', 'success');
            await loadInitialData();
        } else {
            notify(result.error || 'Erreur lors de la suppression.', 'error');
        }
        setShowDeleteModal(false);
        setToDelete(null);
    };

    const filteredDepenses = depenses.filter(d =>
        d.transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.fournisseur && d.fournisseur.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="p-6">
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

            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">Gestion des Dépenses</h1>
                <p className="text-gray-600">Suivez toutes les sorties d'argent.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative group">
                    <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Rechercher une dépense (motif)..."
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={openCreateModal}
                    className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all transform active:scale-95 font-bold"
                >
                    <FaPlus /> Nouvelle Dépense
                </button>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                    <p className="text-gray-500 font-medium">Chargement des dépenses...</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catégorie</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Montant</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredDepenses.map(d => (
                                <tr key={d.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(d.transaction.date_transaction).toLocaleDateString('fr-FR')}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900">{d.transaction.description}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{d.categorie_depense_display}</td>
                                    <td className="px-6 py-4 text-right text-sm font-bold text-red-600">{d.transaction.montant.toLocaleString('fr-FR')} Ar</td>
                                    <td className="px-6 py-4 text-right text-sm">
                                        <button onClick={() => openEditModal(d)} className="p-2 text-blue-600 hover:bg-blue-100 rounded-full"><FaEdit /></button>
                                        <button onClick={() => requestDelete(d)} className="p-2 text-red-600 hover:bg-red-100 rounded-full"><FaTrash /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredDepenses.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p>Aucune dépense trouvée</p>
                        </div>
                    )}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">{editingDepense ? 'Modifier la Dépense' : 'Nouvelle Dépense'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Description *</label>
                                <input type="text" required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Montant (Ar) *</label>
                                    <input type="number" required min="0" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Catégorie *</label>
                                    <select required value={form.categorie_depense} onChange={e => setForm({ ...form, categorie_depense: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none">
                                        {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Fournisseur</label>
                                    <input type="text" value={form.fournisseur} onChange={e => setForm({ ...form, fournisseur: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">N° Facture</label>
                                    <input type="text" value={form.numero_facture} onChange={e => setForm({ ...form, numero_facture: e.target.value })} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 mt-6 bg-gray-50/50 p-6 -mx-6 -mb-6 text-right">
                                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all" disabled={isSubmitting}>Annuler</button>
                                <button type="submit" disabled={isSubmitting} className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:opacity-50 font-bold transition-all transform active:scale-95">{isSubmitting ? 'Enregistrement...' : 'Enregistrer'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} onConfirm={confirmDelete} title="Confirmer la suppression" message={`Supprimer la dépense "${toDelete?.transaction.description}" ?`} type="danger" />
        </div>
    );
};

export default DepensesPage;
