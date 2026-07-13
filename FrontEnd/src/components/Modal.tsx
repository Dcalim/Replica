import { useEffect, type ReactNode } from "react";
import Button from "./Button";

export interface ModalProps {
  show: boolean;
  heading: string;
  onClose: () => void;
  children?: ReactNode;
  className?: string;
}

const CloseIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const Modal = ({
  show,
  heading,
  onClose,
  children,
  className = "",
}: ModalProps) => {
  useEffect(() => {
    if (!show) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [show, onClose]);

  if (!show) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      <Button variant="overlay" ariaLabel="Close modal" onClick={onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-heading"
        className={`relative z-10 w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-xl ${className}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <h2
            id="modal-heading"
            className="font-['Sora'] text-lg font-semibold text-slate-900"
          >
            {heading}
          </h2>

          <Button
            variant="clear"
            iconOnly
            size="sm"
            ariaLabel="Close"
            onClick={onClose}
          >
            <CloseIcon />
          </Button>
        </div>

        {children && (
          <div className="px-6 py-4 text-left text-sm text-slate-600">
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
