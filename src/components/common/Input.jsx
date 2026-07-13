import { forwardRef } from 'react';

// ============================================================
// Compound Input Component
// Supports: Input, Input.Label, Input.Error, Input.HelpText
// ============================================================

const inputBaseClass = `
  w-full rounded-lg border px-3 py-2.5 text-sm text-gray-900
  transition-colors duration-150
  placeholder:text-gray-400
  focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
  disabled:bg-gray-100 disabled:cursor-not-allowed
`.trim();

const InputField = forwardRef(function InputField(
  { error, className = '', ...props },
  ref
) {
  return (
    <input
      ref={ref}
      className={`${inputBaseClass} ${
        error
          ? 'border-error focus:ring-error/50 focus:border-error'
          : 'border-gray-300'
      } ${className}`}
      aria-invalid={error ? 'true' : 'false'}
      {...props}
    />
  );
});

function Label({ children, required, htmlFor, className = '' }) {
  return (
    <label
      htmlFor={htmlFor}
      className={`block text-sm font-medium text-gray-700 mb-1 ${className}`}
    >
      {children}
      {required && (
        <span className="text-error ml-1" aria-hidden="true">
          *
        </span>
      )}
      {required && <span className="sr-only"> (required)</span>}
    </label>
  );
}

function Error({ children, id }) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      aria-live="polite"
      className="mt-1 text-xs text-error flex items-center gap-1"
    >
      <svg
        className="w-3.5 h-3.5 flex-shrink-0"
        fill="currentColor"
        viewBox="0 0 20 20"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
      {children}
    </p>
  );
}

function HelpText({ children }) {
  if (!children) return null;
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}

// Main wrapper component
function Input({ label, required, error, helpText, id, children, className = '' }) {
  return (
    <div className={`${className}`}>
      {label && (
        <Label htmlFor={id} required={required}>
          {label}
        </Label>
      )}
      {children}
      {helpText && !error && <HelpText>{helpText}</HelpText>}
      {error && <Error id={id ? `${id}-error` : undefined}>{error}</Error>}
    </div>
  );
}

Input.Label = Label;
Input.Field = InputField;
Input.Error = Error;
Input.HelpText = HelpText;

export { InputField };
export default Input;
