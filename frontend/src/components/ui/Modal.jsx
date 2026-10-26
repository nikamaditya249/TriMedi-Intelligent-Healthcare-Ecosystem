import React, { useEffect } from "react";
import { FiX } from "react-icons/fi";

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = "max-w-lg",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 transition-opacity duration-150"
        style={{ backgroundColor: "rgba(15, 23, 42, 0.38)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} bg-[#FFFFFF] rounded-2xl shadow-xl border border-[#D9E2EC] p-5 sm:p-6 z-10 transform transition-all duration-150 animate-in fade-in zoom-in-95`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between pb-4 border-b border-[#D9E2EC] mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="text-xs text-[#52627A] mt-0.5 leading-relaxed">{subtitle}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#52627A] hover:text-[#172033] hover:bg-[#F1F5F9] transition-colors -mr-1"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <div>{children}</div>
      </div>
    </div>
  );
}

export default Modal;
