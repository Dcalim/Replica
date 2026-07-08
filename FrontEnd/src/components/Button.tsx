import type { ReactNode } from "react";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "alert" | "clear";
  size?: "sm" | "md" | "lg";
  children?: ReactNode;
  iconOnly?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-300",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus:ring-slate-300",
  alert:
    "bg-red-600 text-white hover:bg-red-500 focus:ring-red-300",
  clear:
    "border-0 bg-transparent text-slate-500 shadow-none hover:bg-slate-100 hover:text-slate-700 focus:ring-slate-300",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

const iconOnlySizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "p-1.5",
  md: "p-2",
  lg: "p-2.5",
};

const Button = ({
  variant = "primary",
  size = "md",
  children,
  iconOnly = false,
  disabled = false,
  className = "",
  ariaLabel,
  onClick,
}: ButtonProps) => {
  const classes = [
    "inline-flex items-center justify-center rounded-lg font-medium transition focus:outline-none focus:ring-2 disabled:pointer-events-none disabled:opacity-50",
    variant === "clear" ? "shadow-none" : "shadow-sm",
    variantClasses[variant],
    iconOnly ? iconOnlySizeClasses[size] : sizeClasses[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;
