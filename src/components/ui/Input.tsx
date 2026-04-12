import { type InputHTMLAttributes, type TextareaHTMLAttributes, type ReactNode, forwardRef } from 'react';

const baseInputStyles = `
  w-full px-4 py-2.5 bg-bg-tertiary border border-border rounded-lg
  text-text-primary placeholder:text-text-muted
  focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
`;

const errorBorderStyles = 'border-crimson/50 focus:border-crimson focus:ring-crimson/20';

function FieldWrapper({
  label,
  error,
  id,
  children,
}: {
  label?: string;
  error?: string;
  id?: string;
  children: ReactNode;
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text-secondary">
          {label}
        </label>
      )}
      {children}
      {error && <p className="text-xs text-crimson-light">{error}</p>}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => (
    <FieldWrapper label={label} error={error} id={id}>
      <input
        ref={ref}
        id={id || label?.toLowerCase().replace(/\s+/g, '-')}
        className={`${baseInputStyles} ${error ? errorBorderStyles : ''} ${className}`}
        {...props}
      />
    </FieldWrapper>
  )
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => (
    <FieldWrapper label={label} error={error} id={id}>
      <textarea
        ref={ref}
        id={id || label?.toLowerCase().replace(/\s+/g, '-')}
        className={`${baseInputStyles} resize-y min-h-[100px] ${error ? errorBorderStyles : ''} ${className}`}
        {...props}
      />
    </FieldWrapper>
  )
);

Textarea.displayName = 'Textarea';

interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', id, ...props }, ref) => (
    <FieldWrapper label={label} error={error} id={id}>
      <select
        ref={ref}
        id={id || label?.toLowerCase().replace(/\s+/g, '-')}
        className={`
          ${baseInputStyles} cursor-pointer appearance-none
          bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239b97b0%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')]
          bg-no-repeat bg-[right_0.75rem_center] bg-[length:1rem]
          ${error ? 'border-crimson/50' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </FieldWrapper>
  )
);

Select.displayName = 'Select';
