import type { ReactNode } from "react";
import {
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineExclamationTriangle,
  HiXMark,
} from "react-icons/hi2";
import Button from "../Button";
import type { BannerVariant } from "../../models/banner";

export interface BannerProps {
  variant?: BannerVariant;
  title?: string;
  children?: ReactNode;
  className?: string;
  onClose?: () => void;
}

const variantClasses: Record<BannerVariant, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-900",
  error: "border-red-200 bg-red-50 text-red-900",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
};

const iconClasses: Record<BannerVariant, string> = {
  success: "text-emerald-600",
  error: "text-red-600",
  warning: "text-amber-600",
};

const titleClasses: Record<BannerVariant, string> = {
  success: "text-emerald-900",
  error: "text-red-900",
  warning: "text-amber-900",
};

const bodyClasses: Record<BannerVariant, string> = {
  success: "text-emerald-800",
  error: "text-red-800",
  warning: "text-amber-800",
};

const VariantIcon = ({ variant }: { variant: BannerVariant }) => {
  const className = `size-5 shrink-0 ${iconClasses[variant]}`;

  if (variant === "success") {
    return <HiOutlineCheckCircle className={className} aria-hidden />;
  }

  if (variant === "error") {
    return <HiOutlineExclamationCircle className={className} aria-hidden />;
  }

  return <HiOutlineExclamationTriangle className={className} aria-hidden />;
};

const Banner = ({
  variant = "success",
  title,
  children,
  className = "",
  onClose,
}: BannerProps) => {
  const role = variant === "error" ? "alert" : "status";

  return (
    <div
      role={role}
      className={[
        "flex items-start gap-3 rounded-xl border px-4 py-3 shadow-sm",
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <VariantIcon variant={variant} />

      <div className="min-w-0 flex-1 text-left">
        {title && (
          <p className={`text-sm font-semibold ${titleClasses[variant]}`}>
            {title}
          </p>
        )}
        {children && (
          <div
            className={`text-sm ${title ? "mt-0.5" : ""} ${bodyClasses[variant]}`}
          >
            {children}
          </div>
        )}
      </div>

      {onClose && (
        <Button
          variant="clear"
          iconOnly
          size="sm"
          className="shrink-0 text-current hover:bg-black/5"
          ariaLabel="Dismiss"
          onClick={onClose}
        >
          <HiXMark className="size-4" aria-hidden />
        </Button>
      )}
    </div>
  );
};

export default Banner;
