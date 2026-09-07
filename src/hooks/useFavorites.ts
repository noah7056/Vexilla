import { useState, useEffect, useCallback, useMemo } from 'react';

const STORAGE_KEY = 'vexillo_favorite_flags';
const FAVORITES_CHANGE_EVENT = 'vexillo_favorites_changed';

function getStoredFavorites(): string[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to load favorite flags', e);
    return [];
  }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>(() => getStoredFavorites());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setFavorites(getStoredFavorites());
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setFavorites(customEvent.detail);
      } else {
        setFavorites(getStoredFavorites());
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(FAVORITES_CHANGE_EVENT, handleCustomEvent);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(FAVORITES_CHANGE_EVENT, handleCustomEvent);
    };
  }, []);

  const saveFavorites = useCallback((newFavorites: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
      window.dispatchEvent(
        new CustomEvent(FAVORITES_CHANGE_EVENT, { detail: newFavorites })
      );
    } catch (e) {
      console.error('Failed to save favorite flags', e);
    }
  }, []);

  const toggleFavorite = useCallback(
    (flagId: string) => {
      const next = favorites.includes(flagId)
        ? favorites.filter((id) => id !== flagId)
        : [...favorites, flagId];
      saveFavorites(next);
    },
    [favorites, saveFavorites]
  );

  const addFavorite = useCallback(
    (flagId: string) => {
      if (favorites.includes(flagId)) return;
      const next = [...favorites, flagId];
      saveFavorites(next);
    },
    [favorites, saveFavorites]
  );

  const removeFavorite = useCallback(
    (flagId: string) => {
      if (!favorites.includes(flagId)) return;
      const next = favorites.filter((id) => id !== flagId);
      saveFavorites(next);
    },
    [favorites, saveFavorites]
  );

  const clearFavorites = useCallback(() => {
    saveFavorites([]);
  }, [saveFavorites]);

  const favoritesSet = useMemo(() => new Set(favorites), [favorites]);

  const isFavorite = useCallback(
    (flagId: string) => favoritesSet.has(flagId),
    [favoritesSet]
  );

  return {
    favorites,
    favoritesSet,
    favoritesCount: favorites.length,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,
  };
}
