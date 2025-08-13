import React, { useState, useEffect } from 'react';
import {
  FaPrint,
  FaCopy,
  FaBook,
  FaShieldAlt,
  FaCamera,
  FaCog,
  FaWifi,
  FaCubes
} from 'react-icons/fa';
import { transactionAPI, tarifAPI, recetteInternetAPI, recetteMultiserviceAPI } from '../services/api';

const RecettesPage = () => {
  const [recettes, setRecettes] = useState([]);
  const [tarifs, setTarifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [notification, setNotification] = useState(null);
  const [formData, setFormData] = useState({
    service_type: 'INTERNET',
    montant: '',
    description: '',
    quantite: 1, // utilisé aussi comme nombre de pages pour impression/photocopie
    // Pour Internet
    type_forfait: 'HEURE',
    duree_minutes: '',
    poste_utilise: '',
    // Pour Multiservices
    type_service: 'IMPRESSION',
    type_papier: 'A4_NB',
    papier_personnalise: '',
    details: ''
  });

  const serviceTypes = [
    {
      value: 'INTERNET',
      label: 'Services Internet',
      icon: <FaWifi className="w-5 h-5" />
    },
    {
      value: 'MULTISERVICE',
      label: 'Multiservices',
      icon: <FaCubes className="w-5 h-5" />
    }
  ];

  const forfaitsInternet = [
    { value: 'HEURE', label: 'À l\'heure' },
    { value: 'JOURNEE', label: 'Forfait journée' },
    { value: 'SEMAINE', label: 'Forfait semaine' },
    { value: 'MOIS', label: 'Forfait mensuel' }
  ];

  const typesPapier = [
    { value: 'A4_NB', label: 'A4 Noir et Blanc' },
    { value: 'A4_COULEUR', label: 'A4 Couleur' },
    { value: 'A3_NB', label: 'A3 Noir et Blanc' },
    { value: 'A3_COULEUR', label: 'A3 Couleur' },
    { value: 'AUTRE', label: 'Autre type' }
  ];

  const servicesMulti = [
    { value: 'IMPRESSION', label: 'Impression', icon: <FaPrint className="w-4 h-4" /> },
    { value: 'PHOTOCOPIE', label: 'Photocopie', icon: <FaCopy className="w-4 h-4" /> },
    { value: 'RELIURE', label: 'Reliure', icon: <FaBook className="w-4 h-4" /> },
    { value: 'PLASTIFICATION', label: 'Plastification', icon: <FaShieldAlt className="w-4 h-4" /> },
    { value: 'SCAN', label: 'Numérisation', icon: <FaCamera className="w-4 h-4" /> },
    { value: 'AUTRE', label: 'Autre service', icon: <FaCog className="w-4 h-4" /> }
  ];

  const dateFilters = [
    { value: 'today', label: 'Aujourd\'hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois' },
    { value: 'all', label: 'Toutes les dates' }
  ];

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadRecettes(),
        loadTarifs()
      ]);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecettes = async () => {
    try {
      const result = await transactionAPI.getAll({ type_transaction: 'RECETTE' });
      if (result.success) {
        setRecettes(result.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des recettes:', error);
    }
  };

  const loadTarifs = async () => {
    try {
      const result = await tarifAPI.getAll();
      if (result.success) {
        setTarifs(result.data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des tarifs:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const calculateAmount = () => {
    if (!selectedService) return 0;
    const tarif = tarifs.find(t => t.nom_service === selectedService);
    if (!tarif) return 0;

    const qty = Number(formData.quantite) || 1; // pages si impression/photocopie
    return Number(tarif.prix_unitaire) * qty;
  };

  const handleServiceChange = (serviceName) => {
    setSelectedService(serviceName);
    // Déduire automatiquement type_service selon le nom du tarif
    const lower = (serviceName || '').toLowerCase();
    let ts = formData.type_service;
    if (lower.includes('photocopie')) ts = 'PHOTOCOPIE';
    else if (lower.includes('impression')) ts = 'IMPRESSION';
    setFormData(prev => ({ ...prev, type_service: ts }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const montant = formData.montant || calculateAmount();
      const tarif = tarifs.find(t => t.nom_service === selectedService);
      const prixUnitaire = tarif ? tarif.prix_unitaire : 0;

      let result;
      if (formData.service_type === 'INTERNET') {
        // créer via endpoint RecetteInternet
        result = await recetteInternetAPI.create({
          type_forfait: formData.type_forfait,
          duree_minutes: parseInt(formData.duree_minutes) || 0,
          poste_utilise: formData.poste_utilise,
          montant: montant,
          description: formData.description || `Internet - ${formData.type_forfait}`
        });
      } else if (formData.service_type === 'MULTISERVICE') {
        // construire payload multiservice
        const isPrint = ['IMPRESSION', 'PHOTOCOPIE'].includes(formData.type_service);
        const payload = {
          type_service: formData.type_service,
          quantite: parseInt(formData.quantite) || 1,
          prix_unitaire: Number(prixUnitaire) || 0,
          details: formData.details,
          description: formData.description || `${formData.type_service} - ${selectedService}`,
          utiliser_tarif_defaut: false
        };
        if (isPrint) {
          payload.type_papier = formData.type_papier;
          if (formData.type_papier === 'AUTRE') {
            payload.papier_personnalise = formData.papier_personnalise || '';
          }
        }
        result = await recetteMultiserviceAPI.create(payload);
      } else {
        // fallback: créer transaction simple (au cas où)
        result = await transactionAPI.create({
          type_transaction: 'RECETTE',
          montant,
          description: formData.description || selectedService
        });
      }

      if (result.success) {
        await loadRecettes();
        resetForm();
        setShowModal(false);
        showNotification('Recette enregistrée avec succès!', 'success');
      } else {
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

  const resetForm = () => {
    setFormData({
      service_type: 'INTERNET',
      montant: '',
      description: '',
      quantite: 1,
      type_forfait: 'HEURE',
      duree_minutes: '',
      poste_utilise: '',
      type_service: 'IMPRESSION',
      type_papier: 'A4_NB',
      papier_personnalise: '',
      details: ''
    });
    setSelectedService('');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('fr-FR').format(price) + ' Ar';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredRecettes = recettes.filter(recette => {
    return recette.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getTarifsByCategory = (category) => {
    return tarifs.filter(tarif => {
      switch (category) {
        case 'INTERNET':
          return tarif.categorie === 'INTERNET';
        case 'MULTISERVICE':
          return tarif.categorie === 'MULTISERVICE';
        default:
          return true;
      }
    });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Enregistrement des Recettes</h1>
        <p className="text-gray-600">Gérez l'argent entrant de votre cyber café</p>
      </div>

      {/* Actions et filtres */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          {/* Recherche */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher une recette..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filtre par date */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateFilters.map(filter => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {/* Bouton d'action */}
        <button
          onClick={() => {
            resetForm();
            setShowModal(true);
          }}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle recette
        </button>
      </div>

      {/* Tableau des recettes */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement des recettes...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date/Heure</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Utilisateur</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecettes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center">
                        <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        <p>Aucune recette trouvée</p>
                        <p className="text-sm text-gray-400 mt-1">Commencez par enregistrer votre première recette</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredRecettes.map((recette) => (
                    <tr key={recette.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(recette.date_transaction)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {recette.type_transaction_display}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {recette.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatPrice(recette.montant)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {recette.utilisateur_nom || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">
                          Voir
                        </button>
                        <button className="text-red-600 hover:text-red-900">
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal pour nouvelle recette */}
      {showModal && (
        <div className="fixed inset-0 bg-transparent backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            {/* Header du modal */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Nouvelle Recette
                  </h3>
                </div>
                <button
                  onClick={() => setShowModal(false)}
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
              {/* Erreur générale */}
              {errors.general && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <span className="text-red-600 text-sm">{errors.general}</span>
                </div>
              )}

              {/* Formulaire */}
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Type de service */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Type de service *
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {serviceTypes.map(type => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, service_type: type.value }))}
                        className={`p-4 text-left border-2 rounded-xl transition-all duration-200 ${
                          formData.service_type === type.value
                            ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${
                            formData.service_type === type.value 
                              ? 'bg-blue-100 text-blue-600' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {type.icon}
                          </div>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {type.value === 'INTERNET' ? 'Forfaits et connexions' : 'Impression, photocopie, scan...'}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sélection du service */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Service
                  </label>
                  <select
                    value={selectedService}
                    onChange={(e) => handleServiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  >
                    <option value="">Sélectionner un service</option>
                    {getTarifsByCategory(formData.service_type).map(tarif => (
                      <option key={tarif.id} value={tarif.nom_service}>
                        {tarif.nom_service} - {formatPrice(tarif.prix_unitaire)}/{tarif.unite_mesure}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Champs spécifiques selon le type de service */}
                {formData.service_type === 'INTERNET' && (
                  <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      Détails Internet
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Type de forfait
                        </label>
                        <select
                          value={formData.type_forfait}
                          onChange={(e) => setFormData(prev => ({ ...prev, type_forfait: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          {forfaitsInternet.map(forfait => (
                            <option key={forfait.value} value={forfait.value}>
                              {forfait.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Durée (minutes)
                        </label>
                        <input
                          type="number"
                          value={formData.duree_minutes}
                          onChange={(e) => setFormData(prev => ({ ...prev, duree_minutes: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Poste utilisé
                      </label>
                      <input
                        type="text"
                        value={formData.poste_utilise}
                        onChange={(e) => setFormData(prev => ({ ...prev, poste_utilise: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Ex: Poste 1, Poste A..."
                      />
                    </div>
                  </div>
                )}

                {formData.service_type === 'MULTISERVICE' && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                      Détails Multiservice
                    </h4>

                    {/* Sélecteur du type de service multiservice */}
                    <div className="grid grid-cols-3 gap-2">
                      {servicesMulti.map(s => (
                        <button
                          key={s.value}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, type_service: s.value }))}
                          className={`px-3 py-2 text-sm rounded-lg border ${formData.type_service === s.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 hover:bg-gray-50'}`}
                        >
                          <span className="mr-1">{s.icon}</span>{s.label}
                        </button>
                      ))}
                    </div>

                    {/* Bloc Impression/Photocopie */}
                    {['IMPRESSION', 'PHOTOCOPIE'].includes(formData.type_service) && (
                      <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg border border-blue-200">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de papier
                          </label>
                          <select
                            value={formData.type_papier}
                            onChange={(e) => setFormData(prev => ({ ...prev, type_papier: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            {typesPapier.map(type => (
                              <option key={type.value} value={type.value}>
                                {type.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Pages*
                          </label>
                          <input
                            type="number"
                            value={formData.quantite}
                            onChange={(e) => setFormData(prev => ({ ...prev, quantite: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            min="1"
                            required
                          />
                        </div>
                        {formData.type_papier === 'AUTRE' && (
                          <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nom du papier
                            </label>
                            <input
                              type="text"
                              value={formData.papier_personnalise}
                              onChange={(e) => setFormData(prev => ({ ...prev, papier_personnalise: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              placeholder="Ex: Bristol 160g, Photo 200g..."
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Quantité pour autres multiservices */}
                    {!['IMPRESSION', 'PHOTOCOPIE'].includes(formData.type_service) && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Quantité
                        </label>
                        <input
                          type="number"
                          value={formData.quantite}
                          onChange={(e) => setFormData(prev => ({ ...prev, quantite: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          min="1"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Détails supplémentaires
                      </label>
                      <textarea
                        value={formData.details}
                        onChange={(e) => setFormData(prev => ({ ...prev, details: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="2"
                        placeholder="Informations complémentaires..."
                      />
                    </div>
                  </div>
                )}

                {/* Montant calculé */}
                {selectedService && (
                  <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-green-900 flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Montant calculé:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        {formatPrice(calculateAmount())}
                      </span>
                    </div>
                  </div>
                )}

                {/* Montant manuel */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant personnalisé (optionnel)
                  </label>
                  <input
                    type="number"
                    value={formData.montant}
                    onChange={(e) => setFormData(prev => ({ ...prev, montant: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Laissez vide pour utiliser le montant calculé"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Si vous entrez un montant ici, il remplacera le calcul automatique
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows="3"
                    placeholder="Description de la transaction..."
                  />
                </div>
              </form>
            </div>

            {/* Footer du modal */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 rounded-b-xl">
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  disabled={isSubmitting}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Enregistrer
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecettesPage;

