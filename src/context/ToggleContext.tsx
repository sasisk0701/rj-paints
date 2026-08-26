import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import type { Toggle } from "@/types/types";

export interface ToggleContextValue {
  toggle: Toggle;
  setToggle: (next: Toggle) => void;
  toggleBusiness: () => void;
}

export const ToggleContext = createContext<ToggleContextValue | null>(null);

export const TOGGLES = {
  PAINTS: "paints" as const,
  INTERIORS: "interiors" as const,
};

export function ToggleProvider({ children }: { children: ReactNode }) {
  const [toggle, setToggleState] = useState<Toggle>(TOGGLES.PAINTS);

  const setToggle = useCallback((next: Toggle) => {
    setToggleState((prev: any) => (prev === next ? prev : next));
  }, []);

  const toggleBusiness = useCallback(() => {
    setToggleState((prev: any) =>
      prev === TOGGLES.PAINTS ? TOGGLES.INTERIORS : TOGGLES.PAINTS
    );
  }, []);

  const value = useMemo<ToggleContextValue>(
    () => ({ toggle, setToggle, toggleBusiness }),
    [toggle, setToggle, toggleBusiness]
  );

  return (
    <ToggleContext.Provider value={value}>
      {children}
    </ToggleContext.Provider>
  );
}
