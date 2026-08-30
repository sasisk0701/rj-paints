import { memo, type ButtonHTMLAttributes, type ReactNode } from "react";

import type { LucideIcon } from "lucide-react";

import clsx from "clsx";

type Variant = "primary" | "ghost" | "dangerGhost" | "danger";

type Size = "sm" | "md" | "large";

const VARIANT_CLASSES: Record<Variant, string> = {
  // solid blue
  primary:
    "bg-blue-600 text-white border-transparent hover:bg-blue-700",

  // subtle branded outline
  ghost:
    "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",

  // red outline — used for delete actions
  dangerGhost:
    "bg-white text-red-600 border-red-300 hover:bg-red-50",

  // solid red — used for destructive confirm buttons
  danger:
    "bg-red-600 text-white border-transparent hover:bg-red-700",
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: "px-2.5 py-1.5 text-xs rounded-md",
  md: "px-3.5 py-2 text-[13px] rounded-lg",
  large: "px-4 py-2.5 text-sm rounded-xl",
};

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: LucideIcon;
  loading?: boolean;
  children?: ReactNode;
}

function ButtonBase({
  variant = "ghost",
  size = "md",
  icon: Icon,
  loading = false,
  className,
  children,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={loading || undefined}
      disabled={rest.disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 font-semibold border whitespace-nowrap transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent"
          aria-hidden="true"
        />
      ) : Icon ? (
        <Icon size={size === "sm" ? 14 : size === "md" ? 16 : 18} />
      ) : null}

      {children}
    </button>
  );
}

export const Button = memo(ButtonBase);
