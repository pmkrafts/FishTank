import type { ButtonHTMLAttributes } from "react";

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "outline";
}

export function BrutalButton({
  variant = "solid",
  className = "",
  children,
  ...props
}: BrutalButtonProps) {
  const base = "brutal-button";
  const outline = variant === "outline" ? "brutal-button-outline" : "";
  return (
    <button className={`${base} ${outline} ${className}`} {...props}>
      {children}
    </button>
  );
}
