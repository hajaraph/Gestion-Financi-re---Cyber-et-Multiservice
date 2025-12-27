import { useState, useEffect } from 'react';
import api from '../services/api'; // Assurez-vous que le chemin est correct
import { toast } from 'react-toastify'; // Pour les notifications
import useDocumentTitle from '../hooks/useDocumentTitle';

const ParametresPage = () => {
  useDocumentTitle('Paramètres');
  const [parametres, setParametres] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchParametres();
  }, []);

  const fetchParametres = async () => {
    setLoading(true);
    setError(null);
    const result = await api.parametresEntreprise.get();
    if (result.success) {
      setParametres(result.data);
      setFormData(result.data); // Initialiser les données du formulaire avec les données récupérées
    } else {
      setError(result.error || 'Erreur lors du chargement des paramètres.');
      toast.error(result.error || 'Erreur lors du chargement des paramètres.');
    }
    setLoading(false);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEditToggle = () => {
    setIsEditing(prev => !prev);
    if (isEditing) { // Si on quitte le mode édition, réinitialiser les données du formulaire aux valeurs originales
      setFormData(parametres);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    // Convertir le seuil d'alerte en nombre si ce n'est pas déjà fait
    const dataToSave = {
      ...formData,
      default_stock_alert_threshold: parseFloat(formData.default_stock_alert_threshold)
    };

    const result = await api.parametresEntreprise.update(dataToSave); // Utilisation de update pour un remplacement complet
    if (result.success) {
      setParametres(result.data);
      setFormData(result.data);
      setIsEditing(false);
      toast.success('Paramètres mis à jour avec succès !');
    } else {
      setError(result.error || 'Erreur lors de la sauvegarde des paramètres.');
      toast.error(result.error || 'Erreur lors de la sauvegarde des paramètres.');
    }
    setIsSaving(false);
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Chargement des paramètres...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">Erreur: {error}</div>;
  }

  if (!parametres) {
    return <div className="p-6 text-gray-600">Aucun paramètre trouvé.</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Paramètres de l'Entreprise</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Nom de l'entreprise */}
          <div>
            <label htmlFor="nom_entreprise" className="block text-sm font-medium text-gray-700">Nom de l'entreprise</label>
            <input
              type="text"
              name="nom_entreprise"
              id="nom_entreprise"
              value={formData.nom_entreprise || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:bg-gray-100 p-2"
            />
          </div>

          {/* Adresse */}
          <div>
            <label htmlFor="address" className="block text-sm font-medium text-gray-700">Adresse</label>
            <input
              type="text"
              name="address"
              id="address"
              value={formData.address || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:bg-gray-100 p-2"
            />
          </div>

          {/* Contact */}
          <div>
            <label htmlFor="contact" className="block text-sm font-medium text-gray-700">Contact</label>
            <input
              type="text"
              name="contact"
              id="contact"
              value={formData.contact || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:bg-gray-100 p-2"
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:bg-gray-100 p-2"
            />
          </div>

          {/* Devise par défaut */}
          <div>
            <label htmlFor="default_currency" className="block text-sm font-medium text-gray-700">Devise par défaut</label>
            <input
              type="text"
              name="default_currency"
              id="default_currency"
              value={formData.default_currency || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:bg-gray-100 p-2"
            />
          </div>

          {/* Seuil d'alerte de stock par défaut */}
          <div>
            <label htmlFor="default_stock_alert_threshold" className="block text-sm font-medium text-gray-700">Seuil d'alerte stock par défaut</label>
            <input
              type="number"
              name="default_stock_alert_threshold"
              id="default_stock_alert_threshold"
              value={formData.default_stock_alert_threshold || ''}
              onChange={handleChange}
              disabled={!isEditing}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50 disabled:bg-gray-100 p-2"
            />
          </div>

          {/* Logo (simplifié pour l'instant, juste affichage ou placeholder) */}
          {/* Pour le logo, il faudrait un input de type file et gérer l'upload, ce qui est plus complexe.
              Pour l'instant, on peut juste afficher l'URL si elle existe. */}
          {formData.logo && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Logo actuel</label>
              <img src={formData.logo} alt="Logo de l'entreprise" className="mt-1 h-20 w-auto object-contain" />
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-4">
          {!isEditing ? (
            <button
              type="button"
              onClick={handleEditToggle}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Modifier
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={handleEditToggle}
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                disabled={isSaving}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                disabled={isSaving}
              >
                {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </>
          )}
        </div>
      </form>
    </div>
  );
};

export default ParametresPage;
