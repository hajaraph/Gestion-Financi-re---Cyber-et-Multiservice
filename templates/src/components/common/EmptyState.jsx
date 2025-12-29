import React from 'react';

/**
 * Composant pour afficher un message quand un tableau est vide
 * @param {string} message - Message à afficher
 * @param {React.ReactNode} icon - Icône optionnelle à afficher
 */
const EmptyState = ({ message = "Aucune donnée trouvée", icon }) => {
    return (
        <div className="p-8 text-center text-gray-500">
            {icon || (
                <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
            )}
            <p>{message}</p>
        </div>
    );
};

export default EmptyState;
