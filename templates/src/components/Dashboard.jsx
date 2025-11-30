import React, { useEffect, useState } from 'react';
import { dashboardAPI } from '../services/api';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const StatCard = ({ title, value, change, icon, currency = false, color }) => (
  <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-${color}-500 transform hover:scale-105 transition-transform duration-300`}>
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <p className={`text-2xl font-bold text-${color}-600`}>{currency ? formatCurrency(value) : value}</p>
        {change && (
          <p className={`text-xs mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change.toFixed(2)}% vs hier
          </p>
        )}
      </div>
      <div className={`w-12 h-12 bg-${color}-100 dark:bg-${color}-900 rounded-lg flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

const PopularService = ({ service, totalRevenue }) => {
  const percentage = totalRevenue > 0 ? (service.total_montant / totalRevenue) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <p className="font-medium text-gray-900 dark:text-white">{service.tarif_service__nom_service}</p>
        <p className="font-semibold text-blue-600">{formatCurrency(service.total_montant)}</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

const RecentActivity = ({ activity }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
    <div className="flex items-center">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${activity.type_transaction === 'RECETTE' ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
        {getIconForCategory(activity.categorie_service_nom, activity.type_transaction)}
      </div>
      <div>
        <p className="font-medium text-gray-900 dark:text-white">{activity.description}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {format(parseISO(activity.date_transaction), 'HH:mm', { locale: fr })}
        </p>
      </div>
    </div>
    <p className={`font-semibold ${activity.type_transaction === 'RECETTE' ? 'text-green-600' : 'text-red-600'}`}>
      {activity.type_transaction === 'RECETTE' ? '+' : '-'}{formatCurrency(activity.montant)}
    </p>
  </div>
);

const FinancialSummaryCard = ({ title, value, color }) => (
  <div className={`text-center p-4 bg-${color}-50 dark:bg-${color}-900 rounded-lg`}>
    <h3 className={`text-lg font-semibold text-${color}-700 dark:text-${color}-300`}>{title}</h3>
    <p className={`text-3xl font-bold text-${color}-600`}>{formatCurrency(value)}</p>
  </div>
);

const formatCurrency = (value) => {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(value);
};

const getIconForCategory = (category, type) => {
    if (type === 'DEPENSE') {
        return (
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
        )
    }
  switch (category) {
    case 'INTERNET':
      return (
        <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 6a1 1 0 00-1 1v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-1-1H4z" clipRule="evenodd"/>
        </svg>
      );
    case 'IMPRESSION':
      return (
        <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14a1 1 0 011-1h8a1 1 0 011 1v2H5v-2z" clipRule="evenodd"/>
        </svg>
      );
    case 'MULTISERVICE':
      return (
        <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
        </svg>
      );
    default:
      return (
        <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
        </svg>
      );
  }
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeFilter, setTimeFilter] = useState('today');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const response = await dashboardAPI.getStats({ period: timeFilter });
        if (response.success) {
          setStats(response.data);
        } else {
          setError(response.error);
        }
          // eslint-disable-next-line no-unused-vars
      } catch (err) {
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [timeFilter]);

  if (loading) {
    return <div>Chargement des données du tableau de bord...</div>;
  }

  if (error) {
    return <div className="text-red-500">Erreur: {error}</div>;
  }

  if (!stats) {
    return <div>Aucune donnée à afficher.</div>;
  }

  const {
    statistiques_principales: mainStats,
    services_populaires: popularServices,
    activite_recente: recentActivity,
    resume_financier: financialSummary,
  } = stats;

  const totalRevenue = popularServices.reduce((acc, service) => acc + service.total_montant, 0);

  return (
    <div className="w-full">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
            Tableau de Bord - Cyber Café
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vue d'ensemble de votre activité financière et des services
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {['today', 'week', 'month'].map(period => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${timeFilter === period ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'}`}
            >
              {period === 'today' ? 'Aujourd\'hui' : period === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
      </header>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Recettes" value={mainStats.recettes_jour.valeur} change={mainStats.recettes_jour.variation} currency icon={getIconForCategory()} color="green" />
        <StatCard title="Sessions Internet" value={mainStats.sessions_internet.valeur} icon={getIconForCategory('INTERNET')} color="blue" />
        <StatCard title="Documents Imprimés" value={mainStats.documents_imprimes.valeur} icon={getIconForCategory('IMPRESSION')} color="purple" />
        <StatCard title="Dépenses" value={mainStats.depenses_jour.valeur} currency icon={getIconForCategory(null, 'DEPENSE')} color="red" />
      </div>

      {/* Contenu principal en 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Services les plus utilisés */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Services Populaires
          </h2>
          <div className="space-y-4">
            {popularServices.map((service, index) => (
              <PopularService key={index} service={service} totalRevenue={totalRevenue} />
            ))}
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
            Activité Récente
          </h2>
          <div className="space-y-4">
            {recentActivity.map((activity) => (
              <RecentActivity key={activity.id} activity={activity} />
            ))}
          </div>
        </div>
      </div>

      {/* Résumé financier */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Résumé Financier
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FinancialSummaryCard title="Total Recettes" value={financialSummary.total_recettes} color="green" />
          <FinancialSummaryCard title="Total Dépenses" value={financialSummary.total_depenses} color="red" />
          <FinancialSummaryCard title="Bénéfice Net" value={financialSummary.benefice_net} color="blue" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
