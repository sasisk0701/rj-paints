import { memo, type HTMLAttributes, type ReactNode } from "react";
import clsx from "clsx";

export interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

/**
 * Panel - the base card shell (white surface, border, radius, shadow)
 * used for every content block across the portal.
 */
function PanelBase({ children, className, ...rest }: PanelProps) {
  return (
    <div
      className={clsx(
        "bg-surface border border-border rounded-lg shadow-sm",
        className
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
export const Panel = memo(PanelBase);

export interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

/**
 * PanelHeader - title + optional subtitle on the left, actions on the right.
 */
function PanelHeaderBase({ title, subtitle, actions }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border flex-wrap">
      <div>
        <div className="text-[15px] font-semibold font-display">{title}</div>
        {subtitle ? (
          <div className="text-xs text-ink-3 mt-0.5">{subtitle}</div>
        ) : null}
      </div>
      {actions ? <div className="flex gap-2">{actions}</div> : null}
    </div>
  );
}
export const PanelHeader = memo(PanelHeaderBase);

export interface PanelBodyProps {
  children: ReactNode;
  className?: string;
}

function PanelBodyBase({ children, className }: PanelBodyProps) {
  return <div className={clsx("p-5", className)}>{children}</div>;
}
export const PanelBody = memo(PanelBodyBase);
