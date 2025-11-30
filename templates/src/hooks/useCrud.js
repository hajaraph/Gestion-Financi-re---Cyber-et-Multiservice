import { useState, useCallback } from 'react';

export const useCrud = (api, emptyForm, loadDependencies) => {
  const [items, setItems] = useState([]);
  const [dependencies, setDependencies] = useState({});
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  const notify = useCallback((message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const mainResult = await api.getAll();
      if (mainResult.success) {
        setItems(mainResult.data);
      } else {
        notify('Erreur lors du chargement des données principales.', 'error');
      }

      if (loadDependencies) {
        const deps = await loadDependencies();
        setDependencies(deps);
      }
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
      notify('Une erreur critique est survenue.', 'error');
    } finally {
      setLoading(false);
    }
  }, [api, loadDependencies, notify]);

  const openCreate = useCallback(() => {
    setEditing(null);
    setForm(emptyForm);
    setErrors({});
    setShowModal(true);
  }, [emptyForm]);

  const openEdit = useCallback((item, formValues) => {
    setEditing(item);
    setForm(formValues);
    setErrors({});
    setShowModal(true);
  }, []);

  const onSubmit = useCallback(async (e, payload) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    try {
      const result = editing
        ? await api.update(editing.id, payload)
        : await api.create(payload);

      if (result.success) {
        await load();
        setShowModal(false);
        notify(editing ? 'Élément modifié avec succès' : 'Élément créé avec succès');
      } else {
        const err = result.error;
        if (err && typeof err === 'object') {
          setErrors(err);
        } else {
          setErrors({ general: err || 'Une erreur est survenue.' });
        }
        notify('Veuillez corriger les erreurs.', 'error');
      }
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
      notify('Une erreur inattendue est survenue.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [api, editing, load, notify]);

  const requestDelete = useCallback((item) => {
    setToDelete(item);
    setShowDeleteModal(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    if (!toDelete) return;
    try {
      const result = await api.delete(toDelete.id);
      if (result.success) {
        await load();
        notify('Élément supprimé avec succès');
      } else {
        if (result.statusCode === 409) {
          notify(result.error?.detail || `Cet élément ne peut pas être supprimé car il est utilisé ailleurs.`, 'warning');
        } else {
          notify(result.error?.detail || 'Erreur lors de la suppression.', 'error');
        }
      }
        // eslint-disable-next-line no-unused-vars
    } catch (error) {
      notify('Une erreur inattendue est survenue lors de la suppression.', 'error');
    } finally {
      setShowDeleteModal(false);
      setToDelete(null);
    }
  }, [api, toDelete, load, notify]);

  return {
    items,
    dependencies,
    loading,
    notification,
    showModal,
    isSubmitting,
    errors,
    editing,
    form,
    showDeleteModal,
    toDelete,
    load,
    notify,
    openCreate,
    openEdit,
    onSubmit,
    requestDelete,
    confirmDelete,
    setForm,
    setShowModal,
    setShowDeleteModal,
  };
};
