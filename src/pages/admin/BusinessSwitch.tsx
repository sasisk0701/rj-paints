import { memo, useCallback } from "react";

import clsx from "clsx";

import { TOGGLES } from "@/context/ToggleContext.tsx";
import { useBusiness } from "@/hooks/useBusiness.ts";

import type { Toggle } from "@/types/types.ts";

function BusinessSwitchBase() {
  const { toggle, setToggle } = useBusiness();

  const handleClick = useCallback(
    (next: Toggle) => () => {
      setToggle(next);
    },
    [setToggle]
  );

  const isPaints = toggle === TOGGLES.PAINTS;
  const isInteriors = toggle === TOGGLES.INTERIORS;

  return (
    <div className="flex items-center bg-surface-2 border border-border rounded-full p-[3px] gap-0.5 flex-none">
      {/* Paints */}
      <button
        type="button"
        onClick={handleClick(TOGGLES.PAINTS)}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
          "transition-all duration-200",
          isPaints
            ? "text-paints shadow-sm"
            : "text-ink-2 hover:text-paints"
        )}
        style={{
          backgroundColor: isPaints ? "#c9dbf2ff" : "transparent",
        }}
      >
        Paints
      </button>

      {/* Interiors */}
      <button
        type="button"
        onClick={handleClick(TOGGLES.INTERIORS)}
        className={clsx(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold",
          "transition-all duration-200",
          isInteriors
            ? "text-interiors shadow-sm"
            : "text-ink-2 hover:text-interiors"
        )}
        style={{
          backgroundColor: isInteriors ? "#f0d5c5ff" : "transparent",
        }}
      >
        Interiors
      </button>
    </div>
  );
}

export const BusinessSwitch = memo(BusinessSwitchBase);
