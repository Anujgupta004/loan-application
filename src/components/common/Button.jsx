import { forwardRef } from 'react';

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    disabled = false,
    type = 'button',
    className = '',
    ...props
  },
  ref
) {
  const base = `
    inline-flex items-center justify-center gap-2 font-medium rounded-lg
    transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]
  `;

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark focus:ring-primary/50 active:scale-[0.98]',
    secondary: 'bg-white text-primary border border-primary hover:bg-primary/5 focus:ring-primary/50',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-error text-white hover:bg-red-700 focus:ring-error/50',
    success: 'bg-accent text-white hover:bg-green-700 focus:ring-accent/50',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {isLoading && <span className="spinner" aria-hidden="true" />}
      {isLoading ? 'Please wait...' : children}
    </button>
  );
});

export default Button;
