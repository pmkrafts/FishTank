import type { ReactNode } from "react";

interface BrutalBoxProps {
  children: ReactNode;
  variant?: "default" | "black";
  className?: string;
}

export function BrutalBox({
  children,
  variant = "default",
  className = "",
}: BrutalBoxProps) {
  const cls =
    variant === "black" ? "brutal-box-black" : "brutal-box";
  return <div className={`${cls} ${className}`}>{children}</div>;
}
