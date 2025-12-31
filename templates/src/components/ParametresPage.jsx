import { useState, useEffect } from 'react';
import { profilAPI, parametresEntrepriseAPI } from '../services/api';
import { toast } from 'react-toastify';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { useAuth } from '../context/AuthContext';
import { FaBuilding, FaUser, FaShieldAlt, FaPalette, FaChevronRight, FaSave, FaEdit, FaTimes } from 'react-icons/fa';

const ParametresPage = () => {
  useDocumentTitle('Paramètres');
  const { user, refreshUser } = useAuth();
  const [activeTab, setActiveTab] = useState('entreprise');

  // Enterprise States
  const [entrepriseData, setEntrepriseData] = useState({});
  const [loadingEntreprise, setLoadingEntreprise] = useState(true);
  const [isEditingEntreprise, setIsEditingEntreprise] = useState(false);

  // Profile States
  const [profileData, setProfileData] = useState({});
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileErrors, setProfileErrors] = useState({});

  useEffect(() => {
    fetchEntrepriseParams();
    if (user) {
      setProfileData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        telephone: user.telephone || '',
        poste: user.poste || '',
        heure_debut_travail: user.heure_debut_travail || '',
        heure_fin_travail: user.heure_fin_travail || '',
        jours_travail: user.jours_travail || '1,2,3,4,5',
        password: '',
      });
    }
  }, [user]);

  const fetchEntrepriseParams = async () => {
    setLoadingEntreprise(true);
    const result = await parametresEntrepriseAPI.get();
    if (result.success) {
      setEntrepriseData(result.data);
    }
    setLoadingEntreprise(false);
  };

  const handleEntrepriseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEntrepriseData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const saveEntreprise = async (e) => {
    e.preventDefault();
    const result = await parametresEntrepriseAPI.update(entrepriseData);
    if (result.success) {
      setEntrepriseData(result.data);
      setIsEditingEntreprise(false);
      toast.success('Paramètres entreprise mis à jour');
    } else {
      toast.error(result.error || 'Erreur lors de la sauvegarde');
    }
  };

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileErrors({});

    const payload = { ...profileData };
    if (!payload.password) delete payload.password;

    const result = await profilAPI.update(user.id, payload);
    if (result.success) {
      setIsEditingProfile(false);
      await refreshUser();
      toast.success('Profil mis à jour avec succès');
    } else {
      if (typeof result.error === 'object') setProfileErrors(result.error);
      else toast.error(result.error || 'Erreur lors de la mise à jour');
    }
  };

  const tabs = [
    { id: 'entreprise', label: 'Entreprise', icon: <FaBuilding /> },
    { id: 'profil', label: 'Mon Profil', icon: <FaUser /> },
    { id: 'apparence', label: 'Apparence', icon: <FaPalette /> },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2">Paramètres</h1>
        <p className="text-gray-500">Gérez vos préférences personnelles et les réglages de l'établissement.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="lg:w-64 flex flex-row lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl font-bold transition-all whitespace-nowrap transform active:scale-95 ${activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-gray-500 bg-gray-50/50 hover:bg-gray-100 hover:text-gray-900 border border-transparent hover:border-gray-200'
                }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
          {activeTab === 'entreprise' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Information de l'Entreprise</h2>
                <button
                  onClick={() => setIsEditingEntreprise(!isEditingEntreprise)}
                  className={`p-2 rounded-xl transition-all ${isEditingEntreprise ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}
                >
                  {isEditingEntreprise ? <FaTimes size={20} /> : <FaEdit size={20} />}
                </button>
              </div>

              {loadingEntreprise ? (
                <div className="py-10 text-center text-gray-400">Chargement...</div>
              ) : (
                <form onSubmit={saveEntreprise} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Nom de l'établissement</label>
                      <input
                        name="nom_entreprise"
                        value={entrepriseData.nom_entreprise || ''}
                        onChange={handleEntrepriseChange}
                        disabled={!isEditingEntreprise}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Adresse physique</label>
                      <input
                        name="address"
                        value={entrepriseData.address || ''}
                        onChange={handleEntrepriseChange}
                        disabled={!isEditingEntreprise}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Téléphone / Contact</label>
                      <input
                        name="contact"
                        value={entrepriseData.contact || ''}
                        onChange={handleEntrepriseChange}
                        disabled={!isEditingEntreprise}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Seuil Alerte Stock Défaut</label>
                      <input
                        type="number"
                        name="default_stock_alert_threshold"
                        value={entrepriseData.default_stock_alert_threshold || ''}
                        onChange={handleEntrepriseChange}
                        disabled={!isEditingEntreprise}
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {isEditingEntreprise && (
                    <div className="md:col-span-2 pt-4">
                      <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                        <FaSave /> Enregistrer les changements
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {activeTab === 'profil' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Mon Profil Utilisateur</h2>
                  <p className="text-sm text-gray-500">Connecté en tant que <span className="font-bold text-blue-600">@{user?.username}</span></p>
                </div>
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`p-2 rounded-xl transition-all ${isEditingProfile ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}
                >
                  {isEditingProfile ? <FaTimes size={20} /> : <FaEdit size={20} />}
                </button>
              </div>

              <form onSubmit={saveProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Nom d'utilisateur</label>
                    <input
                      name="username"
                      value={profileData.username}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-2xl italic text-gray-500 cursor-not-allowed outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Poste / Rôle</label>
                    <input
                      name="poste"
                      value={profileData.poste || (user?.is_superuser ? 'Super Administrateur' : 'Employé')}
                      disabled
                      className="w-full px-4 py-3 bg-gray-100 border border-transparent rounded-2xl font-bold text-blue-600 cursor-not-allowed outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Prénom</label>
                    <input
                      name="first_name"
                      value={profileData.first_name}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                    {profileErrors.first_name && <p className="text-red-500 text-xs mt-1">{profileErrors.first_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Nom de famille</label>
                    <input
                      name="last_name"
                      value={profileData.last_name}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                    {profileErrors.last_name && <p className="text-red-500 text-xs mt-1">{profileErrors.last_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={profileData.email}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                    {profileErrors.email && <p className="text-red-500 text-xs mt-1">{profileErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Téléphone</label>
                    <input
                      name="telephone"
                      value={profileData.telephone}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                  </div>

                  <div className="md:col-span-2 pt-4 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                      <FaShieldAlt className="text-blue-500" /> Horaires & Poste
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Heure Début</label>
                    <input
                      type="time"
                      name="heure_debut_travail"
                      value={profileData.heure_debut_travail}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Heure Fin</label>
                    <input
                      type="time"
                      name="heure_fin_travail"
                      value={profileData.heure_fin_travail}
                      onChange={handleProfileChange}
                      disabled={!isEditingProfile}
                      className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all disabled:opacity-60"
                    />
                  </div>

                  {isEditingProfile && (
                    <div className="md:col-span-2">
                      <label className="block text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Nouveau mot de passe (Laisser vide pour ne pas changer)</label>
                      <input
                        type="password"
                        name="password"
                        value={profileData.password}
                        onChange={handleProfileChange}
                        autoComplete="new-password"
                        className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-2xl focus:bg-white focus:border-blue-500 outline-none transition-all"
                      />
                      {profileErrors.password && <p className="text-red-500 text-xs mt-1">{profileErrors.password}</p>}
                    </div>
                  )}
                </div>

                {!isEditingProfile && (
                  <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                    <p className="text-sm text-blue-800 flex items-center gap-2">
                      <FaShieldAlt /> Poste actuel : <span className="font-bold">{user?.poste || 'Non spécifié'}</span>
                    </p>
                  </div>
                )}

                {isEditingProfile && (
                  <div className="pt-4">
                    <button type="submit" className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center justify-center gap-2 transform active:scale-95">
                      <FaSave /> Sauvegarder mon profil
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {activeTab === 'apparence' && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Personnalisation de l'Apparence</h2>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-200 transition-all cursor-not-allowed opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center text-white">
                      <FaPalette size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Mode Sombre</p>
                      <p className="text-xs text-gray-500">Activer le thème sombre pour la nuit</p>
                    </div>
                  </div>
                  <div className="w-12 h-6 bg-gray-300 rounded-full relative">
                    <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-200 transition-all cursor-not-allowed opacity-60">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                      <FaCog size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Couleur Primaire</p>
                      <p className="text-xs text-gray-500">Choisir la couleur d'accentuation</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="w-6 h-6 border-2 border-white rounded-full bg-blue-600 ring-2 ring-blue-600"></div>
                    <div className="w-6 h-6 rounded-full bg-purple-600"></div>
                    <div className="w-6 h-6 rounded-full bg-green-600"></div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-gray-400 mt-10">Ces fonctionnalités seront disponibles dans une prochaine mise à jour.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParametresPage;

