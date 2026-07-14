import { forwardRef, useState } from 'react';

/**
 * MaskedInput — Shows only last 4 characters by default.
 * Used for PAN (show last 4) and Aadhaar (show last 4).
 * Toggle visibility via the eye button.
 */
const MaskedInput = forwardRef(function MaskedInput(
  {
    id,
    label,
    required,
    error,
    helpText,
    maskChar = '•',
    visibleChars = 4,
    showToggle = true,
    className = '',
    onChange,
    onBlur,
    value,
    placeholder,
    maxLength,
    ...props
  },
  ref
) {
  const [isVisible, setIsVisible] = useState(false);

  // Build masked display value
  const getMasked = (val) => {
    if (!val) return '';
    if (isVisible) return val;
    if (val.length <= visibleChars) return val;
    return maskChar.repeat(val.length - visibleChars) + val.slice(-visibleChars);
  };

  const baseClass = `
    w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900
    transition-colors duration-150 placeholder:text-gray-400
    focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${error ? 'border-error focus:ring-error/50 focus:border-error' : 'border-gray-300'}
    ${showToggle ? 'pr-10' : ''}
  `.trim();

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
          {required && <span className="sr-only"> (required)</span>}
        </label>
      )}

      <div className="relative">
        <input
          ref={ref}
          id={id}
          type="text"
          value={isVisible ? (value || '') : getMasked(value || '')}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          maxLength={maxLength}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={required ? 'true' : undefined}
          aria-describedby={error ? `${id}-error` : helpText ? `${id}-help` : undefined}
          className={baseClass}
          {...props}
        />

        {showToggle && (
          <button
            type="button"
            onClick={() => setIsVisible((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600
              min-h-[44px] min-w-[44px] flex items-center justify-center rounded
              focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label={isVisible ? `Hide ${label || 'value'}` : `Show ${label || 'value'}`}
            aria-pressed={isVisible}
          >
            {isVisible ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {helpText && !error && (
        <p id={`${id}-help`} className="mt-1 text-xs text-gray-500">{helpText}</p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          aria-live="polite"
          className="mt-1 text-xs text-error flex items-center gap-1"
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

export default MaskedInput;
