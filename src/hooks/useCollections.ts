import { useState, useEffect, useCallback, useMemo } from 'react';

export interface Collection {
  id: string;
  name: string;
  flagIds: string[];
}

const STORAGE_KEY = 'vexillo_collections';
const COLLECTIONS_CHANGE_EVENT = 'vexillo_collections_changed';

function sanitizeCollections(collections: Collection[]): Collection[] {
  const seenIds = new Set<string>();
  const sanitized: Collection[] = [];
  for (const c of collections) {
    if (!c || !c.id || seenIds.has(c.id)) continue;
    seenIds.add(c.id);
    sanitized.push({
      ...c,
      name: c.name || 'Untitled Collection',
      flagIds: Array.from(new Set(Array.isArray(c.flagIds) ? c.flagIds : []))
    });
  }
  return sanitized;
}

function getStoredCollections(): Collection[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? sanitizeCollections(parsed) : [];
  } catch (e) {
    console.error('Failed to load collections', e);
    return [];
  }
}

export function useCollections() {
  const [collections, setCollections] = useState<Collection[]>(() => getStoredCollections());

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setCollections(getStoredCollections());
      }
    };

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<Collection[]>;
      if (customEvent.detail && Array.isArray(customEvent.detail)) {
        setCollections(customEvent.detail);
      } else {
        setCollections(getStoredCollections());
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(COLLECTIONS_CHANGE_EVENT, handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(COLLECTIONS_CHANGE_EVENT, handleCustomEvent);
    };
  }, []);

  const saveCollections = useCallback((updaterOrList: Collection[] | ((prev: Collection[]) => Collection[])) => {
    setCollections(prev => {
      const rawNext = typeof updaterOrList === 'function' ? updaterOrList(prev) : updaterOrList;
      const next = sanitizeCollections(rawNext);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(
          new CustomEvent(COLLECTIONS_CHANGE_EVENT, { detail: next })
        );
      } catch (e) {
        console.error('Failed to save collections', e);
      }
      return next;
    });
  }, []);

  const createCollection = useCallback((name: string, initialFlagIds: string[] = []) => {
    const newCollection: Collection = {
      id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
      name: name.trim(),
      flagIds: initialFlagIds
    };
    saveCollections(prev => [...prev, newCollection]);
    return newCollection;
  }, [saveCollections]);

  const updateCollectionName = useCallback((id: string, name: string) => {
    saveCollections(prev => prev.map(c => c.id === id ? { ...c, name: name.trim() } : c));
  }, [saveCollections]);

  const deleteCollection = useCallback((id: string) => {
    saveCollections(prev => prev.filter(c => c.id !== id));
  }, [saveCollections]);

  const toggleFlagInCollection = useCallback((collectionId: string, flagId: string) => {
    saveCollections(prev => prev.map(c => {
      if (c.id === collectionId) {
        const flagIds = c.flagIds.includes(flagId)
          ? c.flagIds.filter(id => id !== flagId)
          : [...c.flagIds, flagId];
        return { ...c, flagIds };
      }
      return c;
    }));
  }, [saveCollections]);

  const addFlagToCollection = useCallback((collectionId: string, flagId: string) => {
    saveCollections(prev => prev.map(c => {
      if (c.id === collectionId && !c.flagIds.includes(flagId)) {
        return { ...c, flagIds: [...c.flagIds, flagId] };
      }
      return c;
    }));
  }, [saveCollections]);

  const removeFlagFromCollection = useCallback((collectionId: string, flagId: string) => {
    saveCollections(prev => prev.map(c => {
      if (c.id === collectionId && c.flagIds.includes(flagId)) {
        return { ...c, flagIds: c.flagIds.filter(id => id !== flagId) };
      }
      return c;
    }));
  }, [saveCollections]);

  return {
    collections,
    createCollection,
    updateCollectionName,
    deleteCollection,
    toggleFlagInCollection,
    addFlagToCollection,
    removeFlagFromCollection
  };
}
