import React, { useState, useEffect } from 'react';
import { palierRemiseAPI } from '../services/api';
import { FaPlus, FaTrash, FaEdit, FaTimes, FaPercentage, FaMoneyBillWave, FaTag } from 'react-icons/fa';
import NotificationIcon from './common/NotificationIcon';

const PaliersRemiseModal = ({ isOpen, onClose, tarif }) => {
    const [paliers, setPaliers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [editingPalier, setEditingPalier] = useState(null);
    const [notification, setNotification] = useState(null);
    const [formData, setFormData] = useState({
        quantite_minimum: '',
        type_remise: 'POURCENTAGE',
        valeur_remise: '',
        description: '',
        actif: true,
        date_debut: '',
        date_fin: ''
    });

    useEffect(() => {
        if (isOpen && tarif) {
            loadPaliers();
        }
    }, [isOpen, tarif]);

    const loadPaliers = async () => {
        setLoading(true);
        try {
            const result = await palierRemiseAPI.getByTarif(tarif.id);
            if (result.success) {
                setPaliers(result.data);
            }
        } catch (error) {
            console.error('Erreur de chargement des paliers:', error);
        } finally {
            setLoading(false);
        }
    };

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const resetForm = () => {
        setFormData({
            quantite_minimum: '',
            type_remise: 'POURCENTAGE',
            valeur_remise: '',
            description: '',
            actif: true,
            date_debut: '',
            date_fin: ''
        });
        setEditingPalier(null);
        setShowForm(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            ...formData,
            tarif_service: tarif.id,
            date_debut: formData.date_debut || null,
            date_fin: formData.date_fin || null
        };

        try {
            const result = editingPalier
                ? await palierRemiseAPI.update(editingPalier.id, payload)
                : await palierRemiseAPI.create(payload);

            if (result.success) {
                await loadPaliers();
                resetForm();
                showNotification(editingPalier ? 'Palier modifié!' : 'Palier créé!', 'success');
            } else {
                showNotification('Erreur lors de la sauvegarde', 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la sauvegarde', 'error');
        }
    };

    const handleEdit = (palier) => {
        setEditingPalier(palier);
        setFormData({
            quantite_minimum: palier.quantite_minimum,
            type_remise: palier.type_remise,
            valeur_remise: palier.valeur_remise,
            description: palier.description || '',
            actif: palier.actif,
            date_debut: palier.date_debut || '',
            date_fin: palier.date_fin || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (palierId) => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce palier de remise ?')) return;

        try {
            const result = await palierRemiseAPI.delete(palierId);
            if (result.success) {
                await loadPaliers();
                showNotification('Palier supprimé!', 'success');
            } else {
                showNotification('Erreur lors de la suppression', 'error');
            }
        } catch (error) {
            console.error('Erreur:', error);
            showNotification('Erreur lors de la suppression', 'error');
        }
    };

    const getRemiseDisplay = (palier) => {
        if (palier.type_remise === 'POURCENTAGE') {
            return `${palier.valeur_remise}% de réduction`;
        } else if (palier.type_remise === 'MONTANT_FIXE') {
            return `-${palier.valeur_remise} Ar`;
        } else {
            return `${palier.valeur_remise} Ar/unité`;
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'POURCENTAGE':
                return <FaPercentage className="text-blue-500" />;
            case 'MONTANT_FIXE':
                return <FaMoneyBillWave className="text-green-500" />;
            case 'PRIX_UNITAIRE':
                return <FaTag className="text-purple-500" />;
            default:
                return null;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Paliers de Remise</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Service: <span className="font-semibold">{tarif?.nom_service}</span> ({tarif?.prix_unitaire} Ar/{tarif?.unite_mesure})
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <FaTimes size={24} />
                    </button>
                </div>

                {/* Notification */}
                {notification && (
                    <div className={`mx-6 mt-4 px-4 py-3 rounded-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                        <NotificationIcon type={notification.type} />
                        <span>{notification.message}</span>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {/* Liste des paliers */}
                    {!showForm && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-gray-800">Paliers configurés</h4>
                                <button
                                    onClick={() => setShowForm(true)}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                                >
                                    <FaPlus /> Ajouter un palier
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-gray-600">Chargement...</p>
                                </div>
                            ) : paliers.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-lg">
                                    <FaTag className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                                    <p className="text-gray-500">Aucun palier de remise configuré</p>
                                    <p className="text-sm text-gray-400 mt-2">
                                        Ajoutez des paliers pour offrir des réductions selon la quantité
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {paliers.map((palier) => (
                                        <div
                                            key={palier.id}
                                            className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {getTypeIcon(palier.type_remise)}
                                                        <h5 className="font-semibold text-gray-900">
                                                            À partir de {palier.quantite_minimum} {tarif.unite_mesure}(s)
                                                        </h5>
                                                        {!palier.actif && (
                                                            <span className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                                                                Inactif
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-lg font-bold text-blue-600 mb-1">
                                                        {getRemiseDisplay(palier)}
                                                    </p>
                                                    {palier.description && (
                                                        <p className="text-sm text-gray-600 mb-2">{palier.description}</p>
                                                    )}
                                                    {(palier.date_debut || palier.date_fin) && (
                                                        <p className="text-xs text-gray-500">
                                                            Valide du {palier.date_debut || '...'} au {palier.date_fin || '...'}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleEdit(palier)}
                                                        className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <FaEdit />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(palier.id)}
                                                        className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <FaTrash />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Formulaire d'ajout/modification */}
                    {showForm && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="text-lg font-semibold text-gray-800">
                                    {editingPalier ? 'Modifier le palier' : 'Nouveau palier'}
                                </h4>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-gray-500 hover:text-gray-700"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Quantité minimum *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        step="0.01"
                                        value={formData.quantite_minimum}
                                        onChange={(e) => setFormData({ ...formData, quantite_minimum: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder={`Ex: 10 ${tarif.unite_mesure}(s)`}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Type de remise *
                                    </label>
                                    <select
                                        required
                                        value={formData.type_remise}
                                        onChange={(e) => setFormData({ ...formData, type_remise: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="POURCENTAGE">Pourcentage (%)</option>
                                        <option value="MONTANT_FIXE">Montant fixe (Ar)</option>
                                        <option value="PRIX_UNITAIRE">Nouveau prix unitaire (Ar)</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Valeur de la remise *
                                </label>
                                <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={formData.valeur_remise}
                                    onChange={(e) => setFormData({ ...formData, valeur_remise: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder={
                                        formData.type_remise === 'POURCENTAGE'
                                            ? 'Ex: 30 (pour 30%)'
                                            : formData.type_remise === 'MONTANT_FIXE'
                                                ? 'Ex: 30 (pour -30 Ar)'
                                                : 'Ex: 70 (nouveau prix 70 Ar)'
                                    }
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {formData.type_remise === 'POURCENTAGE' && 'Pourcentage de réduction (ex: 30 pour 30%)'}
                                    {formData.type_remise === 'MONTANT_FIXE' && 'Montant à déduire du prix original'}
                                    {formData.type_remise === 'PRIX_UNITAIRE' && 'Nouveau prix unitaire fixe'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <input
                                    type="text"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Remise volume pour impression"
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de début (optionnel)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date_debut}
                                        onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Date de fin (optionnel)
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date_fin}
                                        onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="actif"
                                    checked={formData.actif}
                                    onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                                <label htmlFor="actif" className="ml-2 text-sm text-gray-700">
                                    Palier actif
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    {editingPalier ? 'Modifier' : 'Créer'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        Fermer
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaliersRemiseModal;
