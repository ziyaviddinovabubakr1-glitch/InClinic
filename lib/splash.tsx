"use client";

import { createContext, useContext, useState, useCallback } from "react";

interface SplashContextValue {
  active: boolean;
  setActive: (v: boolean) => void;
}

const SplashContext = createContext<SplashContextValue | null>(null);

export function SplashProvider({ children }: { children: React.ReactNode }) {
  const [active, setActiveState] = useState(true);
  const setActive = useCallback((v: boolean) => setActiveState(v), []);

  return (
    <SplashContext.Provider value={{ active, setActive }}>
      {children}
    </SplashContext.Provider>
  );
}

export function useSplash() {
  const ctx = useContext(SplashContext);
  if (!ctx) throw new Error("useSplash must be used within SplashProvider");
  return ctx;
}
