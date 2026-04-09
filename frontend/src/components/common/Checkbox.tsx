import type { InputHTMLAttributes } from 'react';

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string | React.ReactNode;
  error?: string;
}

export const Checkbox = ({ label, error, className = '', ...props }: CheckboxProps) => {
  return (
    <div className="w-full">
      <label className="flex items-start space-x-3 cursor-pointer">
        <input
          type="checkbox"
          className={`mt-1 w-4 h-4 text-primary border-borderSubtle rounded focus:ring-primary ${
            error ? 'border-error' : ''
          } ${className}`}
          {...props}
        />
        <span className="text-sm text-textPrimary">{label}</span>
      </label>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

