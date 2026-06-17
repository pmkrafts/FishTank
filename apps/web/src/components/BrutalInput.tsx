import type { InputHTMLAttributes } from "react";

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function BrutalInput({ label, className = "", id, ...props }: BrutalInputProps) {
  const inputId = id ?? props.name;
  return (
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="brutal-label">
          {label}
        </label>
      )}
      <input id={inputId} className="brutal-input" {...props} />
    </div>
  );
}
