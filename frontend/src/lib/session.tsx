import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { api } from "./api";

export interface Profile {
  id: string;
  name: string;
  token: string;
  picture?: string;
}

interface SessionValue {
  profiles: Profile[];
  active: Profile | null;
  addProfile: (p: Profile) => void;
  switchTo: (id: string) => void;
  forget: (id: string) => void;
}

const KEY = "connectme.profiles.v1";
const ACTIVE_KEY = "connectme.active.v1";
const SessionContext = createContext<SessionValue | null>(null);

function load(): Profile[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((p) => p?.id && p?.token) : [];
  } catch {
    return [];
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profiles, setProfiles] = useState<Profile[]>(load);
  const [activeId, setActiveId] = useState<string | null>(() => localStorage.getItem(ACTIVE_KEY));

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
    else localStorage.removeItem(ACTIVE_KEY);
  }, [activeId]);

  const addProfile = useCallback((p: Profile) => {
    setProfiles((prev) => [...prev.filter((x) => x.id !== p.id), p]);
    setActiveId(p.id);
  }, []);

  const forget = useCallback((id: string) => {
    setProfiles((prev) => {
      const gone = prev.find((x) => x.id === id);
      if (gone) void api.logout(gone.token).catch(() => undefined);
      return prev.filter((x) => x.id !== id);
    });
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      profiles,
      active: profiles.find((p) => p.id === activeId) ?? profiles[0] ?? null,
      addProfile,
      switchTo: setActiveId,
      forget,
    }),
    [profiles, activeId, addProfile, forget]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used inside SessionProvider");
  return ctx;
}
