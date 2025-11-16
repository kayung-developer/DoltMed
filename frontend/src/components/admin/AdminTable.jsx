import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/solid';

const AdminTable = ({ headers, data, renderRow, pagination, onPageChange }) => {
    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {data.length > 0 ? data.map(renderRow) : (
                            <tr><td colSpan={headers.length} className="text-center py-8 text-gray-500">No data available.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            {pagination && pagination.pages > 1 && (
                <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        {/* Mobile pagination */}
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                Showing <span className="font-medium">{(pagination.page - 1) * pagination.size + 1}</span> to <span className="font-medium">{(pagination.page - 1) * pagination.size + data.length}</span> of{' '}
                                <span className="font-medium">{pagination.total}</span> results
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 1} className="pagination-button rounded-l-md">
                                    <ChevronLeftIcon className="h-5 w-5" />
                                </button>
                                {/* Page numbers can be added here for complex pagination */}
                                <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.pages} className="pagination-button rounded-r-md">
                                    <ChevronRightIcon className="h-5 w-5" />
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default AdminTable;