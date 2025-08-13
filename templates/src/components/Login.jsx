import React, { useState } from 'react';
import { authAPI } from '../services/api';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Effacer l'erreur quand l'utilisateur commence à taper
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Utiliser le service API centralisé
      const result = await authAPI.login({
        username: formData.username,
        password: formData.password,
        rememberMe: formData.rememberMe
      });

      if (result.success) {
        // Stocker les informations de connexion si "rester connecté" est coché
        if (formData.rememberMe) {
          localStorage.setItem('rememberUser', formData.username);
        } else {
          localStorage.removeItem('rememberUser');
        }

        // Appeler la fonction onLogin avec les données utilisateur
        onLogin({
          ...result.data.user,
          token: result.data.token
        });

      } else {
        // Afficher l'erreur retournée par le service API
        setErrors({ general: result.error });
      }

    } catch (error) {
      console.error('Erreur de connexion:', error);
      setErrors({ general: 'Une erreur inattendue s\'est produite' });
    } finally {
      setIsLoading(false);
    }
  };

  // Récupérer le nom d'utilisateur sauvegardé au chargement
  React.useEffect(() => {
    const rememberedUser = localStorage.getItem('rememberUser');
    if (rememberedUser) {
      setFormData(prev => ({
        ...prev,
        username: rememberedUser,
        rememberMe: true
      }));
    }
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-600 via-slate-700 to-gray-800 p-5 animate-fade-in">
      <div className="bg-white rounded-2xl p-10 w-full max-w-md shadow-2xl border border-white/20 animate-slide-up">
        <div className="text-center mb-8">
          <h2 className="text-gray-800 text-3xl font-semibold mb-2">Connexion</h2>
          <p className="text-gray-500 text-sm">Accédez à votre tableau de bord financier</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-5 text-center">
              <span className="text-red-600 text-sm">{errors.general}</span>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="username" className="font-medium text-gray-800 text-sm">
              Nom d'utilisateur
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`px-4 py-3 border-2 rounded-lg text-base transition-all duration-300 bg-gray-50 
                ${errors.username 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-gray-200 focus:border-blue-500 focus:bg-white focus:shadow-md focus:outline-none'
                }
                ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              placeholder="Entrez votre nom d'utilisateur"
              disabled={isLoading}
            />
            {errors.username && (
              <span className="text-red-600 text-xs mt-1">{errors.username}</span>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="font-medium text-gray-800 text-sm">
              Mot de passe
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`px-4 py-3 border-2 rounded-lg text-base transition-all duration-300 bg-gray-50
                ${errors.password 
                  ? 'border-red-400 bg-red-50' 
                  : 'border-gray-200 focus:border-blue-500 focus:bg-white focus:shadow-md focus:outline-none'
                }
                ${isLoading ? 'opacity-60 cursor-not-allowed' : ''}
              `}
              placeholder="Entrez votre mot de passe"
              disabled={isLoading}
            />
            {errors.password && (
              <span className="text-red-600 text-xs mt-1">{errors.password}</span>
            )}
          </div>

          <div className="my-3">
            <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-800 select-none">
              <input
                type="checkbox"
                name="rememberMe"
                checked={formData.rememberMe}
                onChange={handleChange}
                disabled={isLoading}
                className="appearance-none w-5 h-5 border-2 border-gray-300 rounded relative cursor-pointer transition-all duration-300 checked:bg-blue-500 checked:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              />
              <span className="absolute w-5 h-5 flex items-center justify-center pointer-events-none">
                {formData.rememberMe && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </span>
              Rester connecté
            </label>
          </div>

          <button
            type="submit"
            className={`bg-blue-600 text-white border-none py-4 px-5 rounded-lg text-base font-semibold cursor-pointer transition-all duration-300 mt-3 flex items-center justify-center gap-2
              ${isLoading 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:bg-blue-700 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              }
            `}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Connexion...</span>
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="text-center mt-8 pt-5 border-t border-gray-200">
          <a
            href="#forgot-password"
            className="text-blue-600 no-underline text-sm transition-colors duration-300 hover:text-blue-700 hover:underline"
          >
            Mot de passe oublié ?
          </a>
        </div>
      </div>
    </div>
  );
};

export default Login;
