import { forwardRef } from 'react';

const Checkbox = forwardRef(function Checkbox(
  { label, error, id, required, helpText, className = '', ...props },
  ref
) {
  return (
    <div className={`${className}`}>
      <div className="flex items-start gap-3">
        <input
          ref={ref}
          type="checkbox"
          id={id}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${id}-error` : undefined}
          className={`
            mt-0.5 w-4 h-4 rounded border-gray-300 text-primary
            focus:ring-2 focus:ring-primary/50 cursor-pointer flex-shrink-0
            ${error ? 'border-error' : ''}
          `}
          {...props}
        />
        {label && (
          <label htmlFor={id} className="text-sm text-gray-700 cursor-pointer leading-relaxed">
            {label}
            {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
          </label>
        )}
      </div>
      {helpText && !error && <p className="mt-1 ml-7 text-xs text-gray-500">{helpText}</p>}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="mt-1 ml-7 text-xs text-error flex items-center gap-1"
        >
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  );
});

export default Checkbox;
