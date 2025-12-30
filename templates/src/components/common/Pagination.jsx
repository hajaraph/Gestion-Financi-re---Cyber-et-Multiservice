import React from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

/**
 * Reusable Modern Pagination Component
 * 
 * @param {number} currentPage - Current active page (1-indexed)
 * @param {number} totalItems - Total number of items across all pages
 * @param {number} itemsPerPage - Number of items shown per page
 * @param {function} onPageChange - Callback when a page is selected
 * @param {string} className - Optional additional CSS classes
 */
const Pagination = ({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    className = ''
}) => {
    // Basic validation and calculation
    const totalPages = Math.ceil(totalItems / itemsPerPage) || 0;

    // If no results or only one page, we don't need pagination
    if (totalItems <= itemsPerPage) return null;

    // Generate page numbers to display logic
    const getPageNumbers = () => {
        const delta = 1; // Show current page + 1 on each side
        const range = [];
        const rangeWithDots = [];

        for (let i = 1; i <= totalPages; i++) {
            if (
                i === 1 ||
                i === totalPages ||
                (i >= currentPage - delta && i <= currentPage + delta)
            ) {
                range.push(i);
            }
        }

        let last;
        for (let i of range) {
            if (last) {
                if (i - last === 2) {
                    rangeWithDots.push(last + 1);
                } else if (i - last !== 1) {
                    rangeWithDots.push('...');
                }
            }
            rangeWithDots.push(i);
            last = i;
        }

        return rangeWithDots;
    };

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    return (
        <div className={`flex flex-col items-center justify-between gap-6 py-8 mt-4 border-t border-gray-100 ${className}`}>
            {/* Summary Text */}
            <div className="text-sm text-gray-500 font-medium bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                Affichage de <span className="text-blue-600 font-bold">{startItem}</span> à <span className="text-blue-600 font-bold">{endItem}</span> sur <span className="text-gray-900 font-bold">{totalItems}</span> résultats
            </div>

            {/* Pagination Controls */}
            <nav className="flex items-center space-x-2" aria-label="Pagination">
                {/* Previous Button */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all shadow-sm active:scale-90"
                    title="Précédent"
                >
                    <FaChevronLeft className="w-4 h-4" />
                </button>

                {/* Page Numbers */}
                <div className="hidden sm:flex items-center space-x-2 p-1.5 bg-gray-50/50 backdrop-blur-sm rounded-2xl border border-gray-100">
                    {getPageNumbers().map((page, index) => (
                        <React.Fragment key={index}>
                            {page === '...' ? (
                                <span className="px-3 text-gray-400 font-bold">...</span>
                            ) : (
                                <button
                                    onClick={() => onPageChange(page)}
                                    className={`w-11 h-11 flex items-center justify-center rounded-xl text-sm font-bold transition-all transform active:scale-95 ${currentPage === page
                                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105'
                                            : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30'
                                        }`}
                                >
                                    {page}
                                </button>
                            )}
                        </React.Fragment>
                    ))}
                </div>

                {/* Mobile Page indicator */}
                <span className="sm:hidden px-4 py-2 bg-gray-50 rounded-xl font-bold text-gray-700">
                    Page {currentPage} / {totalPages}
                </span>

                {/* Next Button */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="p-3 rounded-xl border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 hover:border-blue-300 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:hover:text-gray-600 transition-all shadow-sm active:scale-90"
                    title="Suivant"
                >
                    <FaChevronRight className="w-4 h-4" />
                </button>
            </nav>
        </div>
    );
};

export default Pagination;

