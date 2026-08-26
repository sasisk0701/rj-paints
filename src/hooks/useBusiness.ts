import { useContext } from "react";
import { ToggleContext, type ToggleContextValue } from "@/context/ToggleContext.tsx";

export function useBusiness(): ToggleContextValue {
  const ctx = useContext(ToggleContext);
  if (!ctx) {
    throw new Error("useBusiness must be used within a <ToggleProvider>");
  }
  return ctx;
}
