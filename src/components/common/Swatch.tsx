import { memo } from "react";
import clsx from "clsx";

export interface SwatchProps {
  color: string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Swatch - the signature "paint chip" element, used as a color tag next
 * to product/category names throughout the portal.
 */
function SwatchBase({ color, size = "md", className }: SwatchProps) {
  return (
    <span
      className={clsx(
        "inline-block flex-none rounded-[7px] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.06)]",
        size === "sm" ? "w-4 h-4 rounded-[5px]" : "w-[26px] h-[26px]",
        className
      )}
      style={{ backgroundColor: color }}
    />
  );
}

export const Swatch = memo(SwatchBase);

export interface AvatarProps {
  initials: string;
  bg?: string;
  size?: number;
  className?: string;
}

/**
 * Avatar - initials circle used for users, customers, suppliers.
 */
function AvatarBase({ initials, bg, size = 32, className }: AvatarProps) {
  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full text-white font-bold flex-none",
        className
      )}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.34,
        backgroundColor: bg || "#2B3B8C",
      }}
    >
      {initials}
    </span>
  );
}

export const Avatar = memo(AvatarBase);
