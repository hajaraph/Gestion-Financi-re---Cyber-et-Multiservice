import React, { useState, useEffect, useMemo } from 'react';
import { tarifAPI, venteGroupeeAPI } from '../services/api';
import NotificationIcon from './common/NotificationIcon';
import { FaPlus, FaTrash, FaSave, FaBoxOpen, FaPrint, FaSearch, FaTimes } from 'react-icons/fa'; // Import de FaTimes et FaSearch
import useDocumentTitle from '../hooks/useDocumentTitle';

const FormulaireVente = ({ onClose, onSave, tarifs, isSubmitting }) => {
    const [lignes, setLignes] = useState([]);
    const [clientNom, setClientNom] = useState('');
    const [commentaire, setCommentaire] = useState('');
    const [total, setTotal] = useState(0);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const newTotal = lignes.reduce((acc, ligne) => {
            // Si usage interne, le montant est 0
            if (ligne.usage_interne) return acc;
            return acc + (ligne.quantite * ligne.prix_unitaire);
        }, 0);
        setTotal(newTotal);
    }, [lignes]);

    const calculatePriceWithDiscounts = (tarifId, qte) => {
        const tarif = tarifs.find(t => t.id === parseInt(tarifId));
        if (!tarif) return 0;

        const originalPrice = parseFloat(tarif.prix_unitaire);
        if (!tarif.paliers_remise || tarif.paliers_remise.length === 0) return originalPrice;

        // Filtrer les paliers valides (quantité ok et actif)
        const paliersValides = tarif.paliers_remise
            .filter(p => p.actif && parseFloat(qte) >= parseFloat(p.quantite_minimum))
            .sort((a, b) => b.quantite_minimum - a.quantite_minimum);

        if (paliersValides.length === 0) return originalPrice;

        const bestPalier = paliersValides[0];

        if (bestPalier.type_remise === 'POURCENTAGE') {
            return originalPrice * (1 - parseFloat(bestPalier.valeur_remise) / 100);
        } else if (bestPalier.type_remise === 'MONTANT_FIXE') {
            return Math.max(0, originalPrice - parseFloat(bestPalier.valeur_remise));
        } else if (bestPalier.type_remise === 'PRIX_UNITAIRE') {
            return parseFloat(bestPalier.valeur_remise);
        }
        return originalPrice;
    };

    const handleAddLigne = () => {
        if (tarifs.length > 0) {
            const defaultTarif = tarifs[0];
            setLignes([...lignes, {
                id: Date.now(),
                tarif_service_id: defaultTarif.id,
                nom_service: defaultTarif.nom_service,
                quantite: 1,
                prix_unitaire_original: defaultTarif.prix_unitaire,
                prix_unitaire: defaultTarif.prix_unitaire,
                remise_manuelle: 0,
                consommations: defaultTarif.consommations,
                usage_interne: false, // Nouveau champ
            }]);
        }
    };

    const handleLigneChange = (id, field, value) => {
        const newLignes = lignes.map(ligne => {
            if (ligne.id === id) {
                const updatedLigne = { ...ligne };
                if (field === 'tarif_service_id') {
                    const selectedTarif = tarifs.find(t => t.id === parseInt(value));
                    if (selectedTarif) {
                        updatedLigne.tarif_service_id = selectedTarif.id;
                        updatedLigne.nom_service = selectedTarif.nom_service;
                        updatedLigne.prix_unitaire_original = selectedTarif.prix_unitaire;
                        updatedLigne.prix_unitaire = calculatePriceWithDiscounts(selectedTarif.id, updatedLigne.quantite);
                        updatedLigne.consommations = selectedTarif.consommations;
                    }
                } else if (field === 'quantite') {
                    updatedLigne.quantite = parseFloat(value) || 0;
                    updatedLigne.prix_unitaire = calculatePriceWithDiscounts(updatedLigne.tarif_service_id, updatedLigne.quantite);
                } else if (field === 'usage_interne') {
                    updatedLigne.usage_interne = value;
                    // Si usage interne, on peut visuellement mettre le prix à 0 ou le garder pour info mais ne pas le compter
                } else {
                    updatedLigne[field] = parseFloat(value) || 0;
                }
                return updatedLigne;
            }
            return ligne;
        });
        setLignes(newLignes);
    };

    const handleRemoveLigne = (id) => {
        setLignes(lignes.filter(ligne => ligne.id !== id));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        if (lignes.length === 0) {
            setErrors({ general: 'Veuillez ajouter au moins un service.' });
            return;
        }

        const invalidLine = lignes.find(l => l.quantite <= 0);
        if (invalidLine) {
            setErrors({ general: `La quantité pour le service "${invalidLine.nom_service}" doit être supérieure à zéro.` });
            return;
        }

        const stockErrors = {};
        let hasError = false;
        lignes.forEach(ligne => {
            ligne.consommations.forEach(conso => {
                const quantiteNecessaire = conso.quantite * ligne.quantite;
                if (conso.produit_stock < quantiteNecessaire) {
                    stockErrors[ligne.id] = `Stock insuffisant pour ${conso.produit_nom} (dispo: ${conso.produit_stock}, requis: ${quantiteNecessaire})`;
                    hasError = true;
                }
            });
        });

        if (hasError) {
            setErrors({ stock: stockErrors });
            return;
        }

        const payload = {
            client_nom: clientNom,
            commentaire: commentaire,
            lignes: lignes.map(l => ({
                tarif_service_id: l.tarif_service_id,
                quantite: l.quantite,
                prix_unitaire: l.usage_interne ? 0 : l.prix_unitaire,
                usage_interne: l.usage_interne,
            })),
        };
        onSave(payload);
    };

    return (
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
                <h3 className="text-xl font-bold text-gray-900">Nouvelle Vente Groupée</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={isSubmitting}>
                    <FaTimes size={24} />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-6 space-y-4">
                {errors.general && <div className="bg-red-100 text-red-700 p-3 rounded-lg text-center">{errors.general}</div>}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom du client</label>
                        <input type="text" value={clientNom} onChange={(e) => setClientNom(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">Commentaire</label>
                        <input type="text" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none" />
                    </div>
                </div>

                <div className="pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-semibold">Services</h4>
                        <button type="button" onClick={handleAddLigne} className="px-3 py-1 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-1"><FaPlus size={12} /> Ajouter</button>
                    </div>
                    <div className="space-y-4">
                        {lignes.map((ligne) => (
                            <div key={ligne.id} className={`p-4 rounded-xl border mb-4 transition-all ${errors.stock?.[ligne.id] ? 'bg-red-50 border-red-300 shadow-sm' : 'bg-white border-gray-200 hover:border-blue-300 shadow-sm'}`}>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                                    <div className="md:col-span-4">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Service</label>
                                        <select
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                                            value={ligne.tarif_service_id}
                                            onChange={(e) => handleLigneChange(ligne.id, 'tarif_service_id', e.target.value)}
                                        >
                                            {tarifs.map(t => <option key={t.id} value={t.id}>{t.nom_service}</option>)}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Quantité</label>
                                        <input
                                            type="number"
                                            min="0.01"
                                            step="0.01"
                                            placeholder="Qté"
                                            value={ligne.quantite}
                                            onChange={(e) => handleLigneChange(ligne.id, 'quantite', e.target.value)}
                                            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${errors.stock?.[ligne.id] ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Prix Unit.</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={ligne.prix_unitaire}
                                                onChange={(e) => handleLigneChange(ligne.id, 'prix_unitaire', e.target.value)}
                                                disabled={ligne.usage_interne}
                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${ligne.usage_interne ? 'bg-gray-100 text-gray-400' : ligne.prix_unitaire < (ligne.prix_unitaire_original || ligne.prix_unitaire) ? 'bg-purple-50 text-purple-700 font-bold border-purple-200' : 'bg-white border-gray-300'}`}
                                            />
                                            {!ligne.usage_interne && ligne.prix_unitaire < (ligne.prix_unitaire_original || ligne.prix_unitaire) && (
                                                <span className="absolute -top-4 right-0 text-[10px] text-purple-400 font-bold line-through">
                                                    {(ligne.prix_unitaire_original || ligne.prix_unitaire).toLocaleString()} Ar
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="md:col-span-2 flex items-center justify-center">
                                        <label className="flex items-center gap-2 cursor-pointer mt-6">
                                            <input
                                                type="checkbox"
                                                checked={ligne.usage_interne}
                                                onChange={(e) => handleLigneChange(ligne.id, 'usage_interne', e.target.checked)}
                                                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                                            />
                                            <span className="text-xs font-medium text-gray-600">Usage Interne</span>
                                        </label>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Sous-total</label>
                                        <div className={`px-3 py-2 border border-gray-200 rounded-xl font-bold text-right ${ligne.usage_interne ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-800'}`}>
                                            {ligne.usage_interne ? '0' : (ligne.quantite * ligne.prix_unitaire).toLocaleString('fr-FR')} Ar
                                        </div>
                                    </div>
                                    <div className="md:col-span-12 flex justify-end pb-1">
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveLigne(ligne.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Supprimer la ligne"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                </div>

                                {ligne.consommations && ligne.consommations.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-x-4 gap-y-1">
                                        {ligne.consommations.map((conso, idx) => {
                                            const qteRequise = conso.quantite * ligne.quantite;
                                            const stockInsuffisant = conso.produit_stock < qteRequise;
                                            return (
                                                <div key={idx} className={`text-[11px] flex items-center gap-1.5 ${stockInsuffisant ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                    <FaBoxOpen className={stockInsuffisant ? 'text-red-500' : 'text-gray-400'} size={12} />
                                                    {conso.produit_nom}: {qteRequise.toFixed(2)} (Stock: {conso.produit_stock})
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {errors.stock?.[ligne.id] && (
                                    <p className="text-red-600 text-[11px] mt-2 font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse"></span>
                                        {errors.stock[ligne.id]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </form >

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 -mx-6 -mb-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="text-2xl font-bold text-blue-600">
                        Total: {total.toLocaleString('fr-FR')} Ar
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button type="button" onClick={onClose} className="flex-1 md:flex-none px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-all" disabled={isSubmitting}>
                            Annuler
                        </button>
                        <button type="submit" className="flex-1 md:flex-none px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 font-bold flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-50" disabled={isSubmitting}>
                            <FaSave /> {isSubmitting ? 'Enregistrement...' : 'Enregistrer la Vente'}
                        </button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Multiservice;
