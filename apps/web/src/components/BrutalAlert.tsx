import type { ReactNode } from "react";

interface BrutalAlertProps {
  children: ReactNode;
  variant?: "red" | "blue";
}

export function BrutalAlert({ children, variant = "red" }: BrutalAlertProps) {
  const cls = `brutal-alert ${variant === "blue" ? "brutal-alert-blue" : "brutal-alert-red"}`;
  return <div className={cls}>{children}</div>;
}
