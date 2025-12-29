import React from 'react';

/**
 * Composant de chargement standardisé pour les tableaux
 * @param {string} message - Message à afficher pendant le chargement
 */
const TableLoader = ({ message = "Chargement des données..." }) => {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 font-medium">{message}</p>
        </div>
    );
};

export default TableLoader;
