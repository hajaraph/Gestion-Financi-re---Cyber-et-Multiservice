import React, { useEffect, useState } from 'react';
import { profilAPI, roleAPI, permissionAPI } from '../services/api';
import ConfirmModal from './ConfirmModal';
import NotificationIcon from './common/NotificationIcon';
import TableLoader from './common/TableLoader';
import EmptyState from './common/EmptyState';
import { FaCheckCircle, FaTimesCircle, FaInfoCircle, FaTimes, FaSearch } from 'react-icons/fa'; // Import de FaTimes et FaSearch
import useDocumentTitle from '../hooks/useDocumentTitle';

const emptyForm = {
  username: '',
  email: '',
  password: '',
  first_name: '',
  last_name: '',
  role: '', // ID du rôle
  telephone: '',
  poste: '',
  actif: true,
  heure_debut_travail: '',
  heure_fin_travail: '',
  jours_travail: '1,2,3,4,5', // Par défaut du lundi au vendredi
  permissions_supplementaires_ids: [],
  permissions_refusees_ids: [],
};

const UserManagementPage = ({ user }) => { // Réception de l'objet user
  useDocumentTitle('Gestion des Utilisateurs');
  const [profils, setProfils] = useState([]);
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null); // Le profil utilisateur en cours d'édition
  const [form, setForm] = useState(emptyForm);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  // Fonction pour vérifier si l'utilisateur a une permission spécifique
  const hasPermission = (permissionCode) => {
    if (user?.is_superuser) {
      return true;
    }
    return user?.permissions?.includes(permissionCode);
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [profilsResult, rolesResult, permissionsResult] = await Promise.all([
        profilAPI.getAll(),
        roleAPI.getAll(),
        permissionAPI.getAll(),
      ]);

      if (profilsResult.success) setProfils(profilsResult.data);
      if (rolesResult.success) setRoles(rolesResult.data);
      if (permissionsResult.success) setPermissions(permissionsResult.data);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfils = profils.filter(p =>
    p.username?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.role_nom?.toLowerCase().includes(search.toLowerCase())
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

  const openEdit = (profil) => {
    setEditing(profil);
    setForm({
      username: profil.username || '',
      email: profil.email || '',
      password: '', // Ne pas pré-remplir le mot de passe
      first_name: profil.first_name || '',
      last_name: profil.last_name || '',
      role: profil.role || '',
      telephone: profil.telephone || '',
      poste: profil.poste || '',
      actif: profil.actif,
      heure_debut_travail: profil.heure_debut_travail || '',
      heure_fin_travail: profil.heure_fin_travail || '',
      jours_travail: profil.jours_travail || '1,2,3,4,5',
      permissions_supplementaires_ids: profil.permissions_supplementaires || [],
      permissions_refusees_ids: profil.permissions_refusees || [],
    });
    setErrors({});
    setShowModal(true);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const payload = {
      ...form,
      role: form.role || null, // Envoyer null si pas de rôle sélectionné
      permissions_supplementaires: form.permissions_supplementaires_ids,
      permissions_refusees: form.permissions_refusees_ids,
    };

    // Supprimer le mot de passe si c'est une mise à jour et qu'il n'a pas été modifié
    if (editing && !payload.password) {
      delete payload.password;
    }

    try {
      const result = editing
        ? await profilAPI.update(editing.id, payload)
        : await profilAPI.create(payload);

      if (result.success) {
        await load();
        setShowModal(false);
        notify(editing ? 'Profil utilisateur modifié avec succès' : 'Utilisateur créé avec succès');
      } else {
        const err = result.error;
        if (err && typeof err === 'object') setErrors(err);
        else setErrors({ general: err });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestDelete = (profil) => {
    setToDelete(profil);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      const result = await profilAPI.delete(toDelete.id);
      if (result.success) {
        await load();
        notify('Profil utilisateur supprimé');
      } else {
        notify(result.error?.detail || 'Erreur lors de la suppression.', 'error');
      }
    } finally {
      setShowDeleteModal(false);
      setToDelete(null);
    }
  };

  const handlePermissionChange = (permissionId, type) => {
    setForm(prevForm => {
      const newSupp = new Set(prevForm.permissions_supplementaires_ids);
      const newRef = new Set(prevForm.permissions_refusees_ids);

      if (type === 'supplementaire') {
        if (newSupp.has(permissionId)) {
          newSupp.delete(permissionId);
        } else {
          newSupp.add(permissionId);
          newRef.delete(permissionId); // Supprimer si elle était refusée
        }
      } else if (type === 'refusee') {
        if (newRef.has(permissionId)) {
          newRef.delete(permissionId);
        } else {
          newRef.add(permissionId);
          newSupp.delete(permissionId); // Supprimer si elle était supplémentaire
        }
        // Si la permission est refusée, elle ne peut pas être supplémentaire
        if (newSupp.has(permissionId)) newSupp.delete(permissionId);
      } else if (type === 'none') {
        newSupp.delete(permissionId);
        newRef.delete(permissionId);
      }

      return {
        ...prevForm,
        permissions_supplementaires_ids: Array.from(newSupp),
        permissions_refusees_ids: Array.from(newRef),
      };
    });
  };

  const getPermissionStatus = (permissionId) => {
    if (form.permissions_supplementaires_ids.includes(permissionId)) return 'supplementaire';
    if (form.permissions_refusees_ids.includes(permissionId)) return 'refusee';
    return 'none';
  };

  const joursSemaine = [
    { id: '1', nom: 'Lundi' },
    { id: '2', nom: 'Mardi' },
    { id: '3', nom: 'Mercredi' },
    { id: '4', nom: 'Jeudi' },
    { id: '5', nom: 'Vendredi' },
    { id: '6', nom: 'Samedi' },
    { id: '7', nom: 'Dimanche' },
  ];

  const handleJoursTravailChange = (jourId) => {
    setForm(prevForm => {
      const jours = prevForm.jours_travail.split(',').filter(Boolean).map(Number);
      const jourInt = parseInt(jourId, 10);

      if (jours.includes(jourInt)) {
        return {
          ...prevForm,
          jours_travail: jours.filter(j => j !== jourInt).join(','),
        };
      } else {
        return {
          ...prevForm,
          jours_travail: [...jours, jourInt].sort().join(','),
        };
      }
    });
  };

  const handleInitializePermissions = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir initialiser les permissions par défaut ? Cela peut créer de nouvelles permissions.")) {
      const result = await permissionAPI.initializePermissions();
      if (result.success) {
        notify(result.data.message);
        load(); // Recharger les permissions et profils
      } else {
        notify(result.error?.detail || "Erreur lors de l'initialisation des permissions.", 'error');
      }
    }
  };

  const handleCreateDefaultRoles = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir créer les rôles par défaut ? Cela peut créer de nouveaux rôles et leur assigner des permissions.")) {
      const result = await roleAPI.createDefaultRoles();
      if (result.success) {
        notify(result.data.message);
        load(); // Recharger les rôles et profils
      } else {
        notify(result.error?.detail || "Erreur lors de la création des rôles par défaut.", 'error');
      }
    }
  };

  return (
    <div className="p-6 relative">
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Utilisateurs</h1>
        <p className="text-gray-600">Gérer les profils, rôles et permissions des utilisateurs.</p>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="relative flex-1 max-w-md group">
          <FaSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Rechercher par nom d'utilisateur, email ou rôle..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
          />
        </div>

        <div className="flex gap-2">
          {hasPermission('manage_permissions') && (
            <>
              <button
                onClick={handleInitializePermissions}
                className="px-6 py-3 bg-purple-600 text-white rounded-2xl hover:bg-purple-700 transition-all flex items-center gap-2 font-bold shadow-lg transform active:scale-95"
              >
                <FaInfoCircle className="w-4 h-4" />
                Init. Permissions
              </button>
              <button
                onClick={handleCreateDefaultRoles}
                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all flex items-center gap-2 font-bold shadow-lg transform active:scale-95"
              >
                <FaCheckCircle className="w-4 h-4" />
                Créer Rôles Défaut
              </button>
            </>
          )}
          <button
            onClick={openCreate}
            className="px-6 py-3 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 font-bold"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nouvel utilisateur
          </button>
        </div>
      </div>

      {loading ? (
        <TableLoader message="Chargement des profils utilisateurs..." />
      ) : (
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nom d'utilisateur</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rôle</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProfils.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{p.role_nom || 'Aucun'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${p.actif ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {p.actif ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(p)} className="text-blue-600 hover:text-blue-900" title="Modifier le profil">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button onClick={() => requestDelete(p)} className="text-red-600 hover:text-red-900" title="Supprimer le profil">
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

            {filteredProfils.length === 0 && (
              <EmptyState message="Aucun profil utilisateur trouvé" />
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Modifier le profil utilisateur' : 'Nouvel utilisateur'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600" disabled={isSubmitting}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={onSubmit} className="flex flex-col flex-grow overflow-hidden">
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                {errors.general && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                    <span className="text-red-600 text-sm">{errors.general}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom d'utilisateur *</label>
                    <input
                      type="text"
                      required
                      value={form.username}
                      onChange={(e) => setForm({ ...form, username: e.target.value })}
                      className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${errors.username ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      placeholder="Nom d'utilisateur"
                      disabled={isSubmitting || editing}
                    />
                    {errors.username && <span className="text-red-600 text-xs mt-1 block">{errors.username}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email *</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      placeholder="email@example.com"
                      disabled={isSubmitting}
                    />
                    {errors.email && <span className="text-red-600 text-xs mt-1 block">{errors.email}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mot de passe {editing ? '(Laisser vide pour ne pas changer)' : '*'}</label>
                    <input
                      type="password"
                      required={!editing}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      placeholder="********"
                      disabled={isSubmitting}
                    />
                    {errors.password && <span className="text-red-600 text-xs mt-1 block">{errors.password}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Prénom *</label>
                    <input
                      type="text"
                      required
                      value={form.first_name}
                      onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      placeholder="Prénom"
                      disabled={isSubmitting}
                    />
                    {errors.first_name && <span className="text-red-600 text-xs mt-1 block">{errors.first_name}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nom *</label>
                    <input
                      type="text"
                      required
                      value={form.last_name}
                      onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      placeholder="Nom"
                      disabled={isSubmitting}
                    />
                    {errors.last_name && <span className="text-red-600 text-xs mt-1 block">{errors.last_name}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                    <input
                      type="text"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.telephone ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      placeholder="Téléphone"
                      disabled={isSubmitting}
                    />
                    {errors.telephone && <span className="text-red-600 text-xs mt-1 block">{errors.telephone}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Poste</label>
                    <input
                      type="text"
                      value={form.poste}
                      onChange={(e) => setForm({ ...form, poste: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.poste ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      placeholder="Poste"
                      disabled={isSubmitting}
                    />
                    {errors.poste && <span className="text-red-600 text-xs mt-1 block">{errors.poste}</span>}
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Rôle *</label>
                    <select
                      required
                      value={form.role || ''}
                      onChange={(e) => setForm({ ...form, role: e.target.value })}
                      className={`w-full px-4 py-2 bg-gray-50 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${errors.role ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                      disabled={isSubmitting}
                    >
                      <option value="">Sélectionner un rôle</option>
                      {roles.map(r => (
                        <option key={r.id} value={r.id}>{r.nom}</option>
                      ))}
                    </select>
                    {errors.role && <span className="text-red-600 text-xs mt-1 block">{errors.role}</span>}
                  </div>
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
                    <span className="ml-2 text-sm text-gray-700">Compte actif</span>
                  </label>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-800 mb-2">Restrictions Horaires</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heure de début</label>
                      <input
                        type="time"
                        value={form.heure_debut_travail}
                        onChange={(e) => setForm({ ...form, heure_debut_travail: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.heure_debut_travail ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        disabled={isSubmitting}
                      />
                      {errors.heure_debut_travail && <span className="text-red-600 text-xs mt-1 block">{errors.heure_debut_travail}</span>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Heure de fin</label>
                      <input
                        type="time"
                        value={form.heure_fin_travail}
                        onChange={(e) => setForm({ ...form, heure_fin_travail: e.target.value })}
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.heure_fin_travail ? 'border-red-400 bg-red-50' : 'border-gray-300'}`}
                        disabled={isSubmitting}
                      />
                      {errors.heure_fin_travail && <span className="text-red-600 text-xs mt-1 block">{errors.heure_fin_travail}</span>}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Jours de travail</label>
                    <div className="flex flex-wrap gap-2">
                      {joursSemaine.map(jour => (
                        <label key={jour.id} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            value={jour.id}
                            checked={form.jours_travail.split(',').includes(jour.id)}
                            onChange={() => handleJoursTravailChange(jour.id)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            disabled={isSubmitting}
                          />
                          <span className="ml-2 text-sm text-gray-700">{jour.nom}</span>
                        </label>
                      ))}
                    </div>
                    {errors.jours_travail && <span className="text-red-600 text-xs mt-1 block">{errors.jours_travail}</span>}
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-md font-semibold text-gray-800 mb-2">Permissions Spécifiques</h4>
                  <p className="text-sm text-gray-600 mb-4">Ces permissions s'ajoutent ou annulent celles du rôle.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissions.map(perm => (
                      <div key={perm.id} className="flex items-center justify-between p-2 border border-gray-200 rounded-lg">
                        <span className="text-sm text-gray-800">{perm.nom}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(perm.id, 'supplementaire')}
                            className={`p-1 rounded-full ${getPermissionStatus(perm.id) === 'supplementaire' ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-green-100 hover:text-green-700'}`}
                            title="Ajouter cette permission"
                            disabled={isSubmitting}
                          >
                            <FaCheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePermissionChange(perm.id, 'refusee')}
                            className={`p-1 rounded-full ${getPermissionStatus(perm.id) === 'refusee' ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600 hover:bg-red-100 hover:text-red-700'}`}
                            title="Refuser cette permission"
                            disabled={isSubmitting}
                          >
                            <FaTimesCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 p-8 border-t border-gray-100 bg-gray-50/50">
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

      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDelete}
        title="Confirmer la suppression"
        message={`Supprimer le profil de "${toDelete?.username}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        type="danger"
      />
    </div>
  );
};

export default UserManagementPage;
