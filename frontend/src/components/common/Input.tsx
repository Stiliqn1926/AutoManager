import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = ({ label, error, className = '', ...props }: InputProps) => {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-textPrimary mb-1">
        {label}
      </label>
      <input
        className={`w-full px-4 py-2 bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${
          error ? 'border-error focus:ring-error' : 'border-borderSubtle'
        } ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};