import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ADMIN_STORAGE_KEY = 'vexilla_admin';
const PASSKEY = 'v7112';
const EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface AdminState {
  unlocked: boolean;
  expiresAt: number | null;
}

interface AdminContextType {
  isAdmin: boolean;
  unlock: (passkey: string) => boolean;
  lock: () => void;
  expiresAt: number | null;
}

const AdminContext = createContext<AdminContextType | null>(null);

function getStoredAdmin(): AdminState | null {
  try {
    const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed: AdminState = JSON.parse(raw);
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminState, setAdminState] = useState<AdminState | null>(() => getStoredAdmin());

  useEffect(() => {
    if (!adminState?.expiresAt) return;
    const timeout = setTimeout(() => {
      localStorage.removeItem(ADMIN_STORAGE_KEY);
      setAdminState(null);
    }, adminState.expiresAt - Date.now());
    return () => clearTimeout(timeout);
  }, [adminState]);

  const unlock = useCallback((passkey: string): boolean => {
    if (passkey !== PASSKEY) return false;
    const state: AdminState = {
      unlocked: true,
      expiresAt: Date.now() + EXPIRY_MS,
    };
    localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(state));
    setAdminState(state);
    return true;
  }, []);

  const lock = useCallback(() => {
    localStorage.removeItem(ADMIN_STORAGE_KEY);
    setAdminState(null);
  }, []);

  return (
    <AdminContext.Provider
      value={{
        isAdmin: adminState?.unlocked === true,
        unlock,
        lock,
        expiresAt: adminState?.expiresAt ?? null,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider');
  return ctx;
}
