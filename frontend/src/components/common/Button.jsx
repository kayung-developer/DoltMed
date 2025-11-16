import React from 'react';

const Button = ({ children, onClick, type = 'button', variant = 'primary', className = '', isLoading = false, disabled = false }) => {
  const baseStyles = 'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-semibold shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900';

  const variants = {
    primary: 'bg-dortmed-600 text-white hover:bg-dortmed-700 focus:ring-dortmed-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 focus:ring-gray-500',
    danger: 'bg-danger text-white hover:bg-red-700 focus:ring-red-500',
    ghost: 'bg-transparent text-dortmed-600 hover:bg-dortmed-100 dark:text-dortmed-400 dark:hover:bg-dortmed-900/50 focus:ring-dortmed-500',
  };

  const spinner = (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );

  const isDisabled = isLoading || disabled;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`${baseStyles} ${variants[variant]} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      {isLoading && spinner}
      {children}
    </button>
  );
};

export default Button;