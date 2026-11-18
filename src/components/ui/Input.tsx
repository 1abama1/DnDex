import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
  type SelectHTMLAttributes,
  type ReactNode,
} from 'react';
interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
}
function Field({
  label,
  error,
  hint,
  id,
  children,
}: FieldProps & { id: string; children: ReactNode }) {
  return (
    <div className="form-field">
      {label && <label htmlFor={id}>{label}</label>}
      {children}
      {hint && (
        <p id={`${id}-hint`} className="field-hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
function description(id: string, hint?: string, error?: string, existing?: string) {
  return (
    [existing, hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined
  );
}
export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & FieldProps
>(function Input(
  { label, error, hint, id, className = '', 'aria-describedby': describedBy, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Field {...{ label, error, hint }} id={fieldId}>
      <input
        {...props}
        ref={ref}
        id={fieldId}
        className={`field-input ${className}`}
        aria-invalid={!!error || undefined}
        aria-describedby={description(fieldId, hint, error, describedBy)}
      />
    </Field>
  );
});
export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & FieldProps
>(function Textarea(
  { label, error, hint, id, className = '', 'aria-describedby': describedBy, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Field {...{ label, error, hint }} id={fieldId}>
      <textarea
        {...props}
        ref={ref}
        id={fieldId}
        className={`field-input field-textarea ${className}`}
        aria-invalid={!!error || undefined}
        aria-describedby={description(fieldId, hint, error, describedBy)}
      />
    </Field>
  );
});
export const Select = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> &
    FieldProps & { options: { value: string; label: string }[] }
>(function Select(
  { label, error, hint, options, id, className = '', 'aria-describedby': describedBy, ...props },
  ref,
) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <Field {...{ label, error, hint }} id={fieldId}>
      <select
        {...props}
        ref={ref}
        id={fieldId}
        className={`field-input field-select ${className}`}
        aria-invalid={!!error || undefined}
        aria-describedby={description(fieldId, hint, error, describedBy)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
});
