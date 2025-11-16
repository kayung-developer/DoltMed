import React from 'react';

const LegalLayout = ({ title, effectiveDate, children }) => {
    return (
        <div className="bg-white dark:bg-gray-900 py-20">
            <div className="container mx-auto px-6 max-w-4xl">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">{title}</h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Last Updated: {effectiveDate}</p>
                <div className="mt-8 prose prose-lg dark:prose-invert max-w-none">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default LegalLayout;