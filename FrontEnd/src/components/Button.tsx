import type { ReactNode } from "react";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "alert";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-300",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300",
  alert:
    "bg-red-600 text-white hover:bg-red-500 focus:ring-red-300",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const Button = ({
  variant = "primary",
  size = "md",
  children,
  disabled = false,
  className = "",
  onClick,
}: ButtonProps) => {
  const classes = [
    "inline-flex items-center justify-center rounded-lg font-medium shadow-sm transition focus:outline-none focus:ring-2 disabled:pointer-events-none disabled:opacity-50",
    variantClasses[variant],
    sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
