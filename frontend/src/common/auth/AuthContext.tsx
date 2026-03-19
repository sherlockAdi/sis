import { createContext, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { MeResponse } from "../services/authApi";

type AuthState = {
  me: MeResponse | null;
  setMe: (value: MeResponse | null) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [meValue, setMeValue] = useState<MeResponse | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      me: meValue,
      setMe: setMeValue,
    }),
    [meValue],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

