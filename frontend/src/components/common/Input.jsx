import React from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';

const Input = React.forwardRef(({ id, name, type = 'text', label, placeholder, error, ...rest }, ref) => {
  return (
    <div>
      <label htmlFor={id || name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          id={id || name}
          name={name}
          type={type}
          ref={ref}
          placeholder={placeholder}
          className={`block w-full appearance-none rounded-md border px-3 py-2 placeholder-gray-400 shadow-sm focus:outline-none sm:text-sm
            ${error
              ? 'border-danger text-danger focus:border-danger focus:ring-danger'
              : 'border-gray-300 dark:border-gray-600 dark:bg-gray-800 focus:border-dortmed-500 focus:ring-dortmed-500'
            }
          `}
          {...rest}
        />
        {error && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <ExclamationCircleIcon className="h-5 w-5 text-danger" aria-hidden="true" />
          </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error.message}</p>}
    </div>
  );
});

export default Input;