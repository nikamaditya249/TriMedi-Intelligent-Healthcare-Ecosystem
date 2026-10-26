import React from "react";

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = "left",
  onClick,
  type = "button",
  ...props
}) {
  const baseStyles =
    "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.99]";

  const sizes = {
    sm: "px-3 py-1.5 text-xs gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2.5 font-semibold",
    icon: "p-2 text-sm",
  };

  const variants = {
    primary:
      "bg-[#087F73] hover:bg-[#06665D] text-white shadow-xs focus:ring-[#087F73] border border-[#06665D]",
    secondary:
      "bg-white hover:bg-[#F1F5F9] text-[#172033] border border-[#D9E2EC] hover:border-[#C5D1DE] shadow-xs focus:ring-[#087F73]",
    outline:
      "border border-[#D9E2EC] hover:border-[#087F73] text-[#087F73] bg-white hover:bg-[#E8F7F4] focus:ring-[#087F73] shadow-xs",
    ghost:
      "bg-transparent hover:bg-[#F1F5F9] text-[#52627A] hover:text-[#172033] focus:ring-[#CBD5E1]",
    danger:
      "bg-[#C53030] hover:bg-[#9B2C2C] text-white shadow-xs focus:ring-[#C53030] border border-[#9B2C2C]",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseStyles} ${sizes[size]} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      ) : (
        <>
          {Icon && iconPosition === "left" && <Icon className="w-4 h-4 shrink-0" />}
          {children}
          {Icon && iconPosition === "right" && <Icon className="w-4 h-4 shrink-0" />}
        </>
      )}
    </button>
  );
}

export default Button;
