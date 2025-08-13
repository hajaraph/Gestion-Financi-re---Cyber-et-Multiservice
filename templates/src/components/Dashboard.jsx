import React from 'react';

const Dashboard = () => {
  return (
    <div className="w-full">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          Tableau de Bord - Cyber Café
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vue d'ensemble de votre activité financière et des services
        </p>
      </header>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Recettes du jour */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Recettes du Jour</p>
              <p className="text-2xl font-bold text-green-600">45,500 Ar</p>
              <p className="text-xs text-green-500 mt-1">+12% vs hier</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Sessions Internet */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Sessions Internet</p>
              <p className="text-2xl font-bold text-blue-600">28</p>
              <p className="text-xs text-blue-500 mt-1">3 actives maintenant</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 6a1 1 0 00-1 1v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-1-1H4z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Documents imprimés */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents Imprimés</p>
              <p className="text-2xl font-bold text-purple-600">156</p>
              <p className="text-xs text-purple-500 mt-1">89 A4, 12 A3, 55 copies</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14a1 1 0 011-1h8a1 1 0 011 1v2H5v-2z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Dépenses */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Dépenses du Jour</p>
              <p className="text-2xl font-bold text-red-600">12,000 Ar</p>
              <p className="text-xs text-red-500 mt-1">Électricité, fournitures</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal en 2 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Services les plus utilisés */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Services Populaires
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">Aujourd'hui</span>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm1 6a1 1 0 00-1 1v4a1 1 0 001 1h12a1 1 0 001-1v-4a1 1 0 00-1-1H4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Internet - Forfait Heure</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">15 sessions • 1,500 Ar/h</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-blue-600">22,500 Ar</p>
                <p className="text-xs text-gray-500">53% des recettes</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14a1 1 0 011-1h8a1 1 0 011 1v2H5v-2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Impression A4 N&B</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">89 pages • 100 Ar/page</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-purple-600">8,900 Ar</p>
                <p className="text-xs text-gray-500">20% des recettes</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Photocopie</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">55 copies • 50 Ar/page</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600">2,750 Ar</p>
                <p className="text-xs text-gray-500">6% des recettes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Activité récente */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
              Activité Récente
            </h2>
            <button className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">
              Voir tout
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Session Internet - Poste 3</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">il y a 5 minutes</p>
                </div>
              </div>
              <p className="font-semibold text-green-600">+3,000 Ar</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zM5 14a1 1 0 011-1h8a1 1 0 011 1v2H5v-2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Impression couleur A4</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">il y a 12 minutes</p>
                </div>
              </div>
              <p className="font-semibold text-blue-600">+800 Ar</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Reliure document</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">il y a 25 minutes</p>
                </div>
              </div>
              <p className="font-semibold text-orange-600">+1,200 Ar</p>
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Achat papier A4</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">il y a 1 heure</p>
                </div>
              </div>
              <p className="font-semibold text-red-600">-5,000 Ar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Résumé financier */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Résumé Financier du Jour
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 dark:bg-green-900 rounded-lg">
            <h3 className="text-lg font-semibold text-green-700 dark:text-green-300">Total Recettes</h3>
            <p className="text-3xl font-bold text-green-600">45,500 Ar</p>
          </div>
          <div className="text-center p-4 bg-red-50 dark:bg-red-900 rounded-lg">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">Total Dépenses</h3>
            <p className="text-3xl font-bold text-red-600">12,000 Ar</p>
          </div>
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-700 dark:text-blue-300">Bénéfice Net</h3>
            <p className="text-3xl font-bold text-blue-600">33,500 Ar</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
