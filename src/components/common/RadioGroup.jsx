import { forwardRef } from 'react';

const RadioGroup = forwardRef(function RadioGroup(
  {
    label,
    required,
    error,
    options = [],
    value,
    onChange,
    name,
    layout = 'horizontal',
    helpText,
    id,
  },
  ref
) {
  return (
    <fieldset>
      {label && (
        <legend className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-error ml-1" aria-hidden="true">*</span>}
          {required && <span className="sr-only"> (required)</span>}
        </legend>
      )}
      <div
        className={`flex ${layout === 'vertical' ? 'flex-col gap-2' : 'flex-wrap gap-3'}`}
        role="group"
        aria-labelledby={id}
      >
        {options.map((opt) => {
          const optValue = opt.value ?? opt;
          const optLabel = opt.label ?? opt;
          const optIcon = opt.icon ?? null;
          const optId = `${name}-${optValue}`;
          const isSelected = value === optValue;

          return (
            <label
              key={optValue}
              htmlFor={optId}
              className={`
                flex items-center gap-2.5 cursor-pointer rounded-lg border px-3 py-2.5
                transition-all duration-150 min-h-[44px]
                ${isSelected
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-primary/40 hover:bg-gray-50'
                }
                ${error ? 'border-error/60' : ''}
              `}
            >
              <input
                ref={ref}
                type="radio"
                id={optId}
                name={name}
                value={optValue}
                checked={isSelected}
                onChange={(e) => onChange && onChange(e.target.value)}
                className="w-4 h-4 text-primary border-gray-300 focus:ring-primary/50"
                aria-describedby={error ? `${name}-error` : undefined}
              />
              {optIcon && <span aria-hidden="true">{optIcon}</span>}
              <span className="text-sm font-medium">{optLabel}</span>
            </label>
          );
        })}
      </div>
      {helpText && !error && <p className="mt-1 text-xs text-gray-500">{helpText}</p>}
      {error && (
        <p
          id={`${name}-error`}
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
    </fieldset>
  );
});

export default RadioGroup;
