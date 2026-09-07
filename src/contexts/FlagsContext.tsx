import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  BASE_FLAGS,
  BUILTIN_CUSTOM_FLAGS,
  BUILTIN_DELETED_FLAG_IDS
} from '../data/flags';
import { Flag, TrashItem } from '../types';
import { db, testFirestoreConnection, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';

const STORAGE_KEY = 'vexillo_custom_flags';
const TRASH_KEY = 'vexillo_trash_flags';
const PERMANENT_DELETED_KEY = 'vexillo_permanently_deleted_ids';
const LEGACY_DELETED_KEY = 'vexillo_deleted_flag_ids';

interface FlagsContextType {
  flags: Flag[];
  customFlags: Flag[];
  trash: TrashItem[];
  deletedFlagIds: string[];
  permanentlyDeletedIds: string[];
  addCustomFlag: (flag: Flag) => void;
  editCustomFlag: (flag: Flag) => void;
  deleteFlag: (id: string) => void;
  deleteCustomFlag: (id: string) => void;
  restoreFlag: (id: string) => void;
  restoreAllDeletedFlags: () => void;
  permanentlyDeleteFlag: (id: string) => void;
  emptyTrash: () => void;
  restoreAllPermanentlyDeleted: () => void;
  resetFlagToDefault: (id: string) => void;
  isCustomFlag: (id: string) => boolean;
  isModifiedBuiltIn: (id: string) => boolean;
  getOriginalFlag: (id: string) => Flag | undefined;
  hasLocalChanges: boolean;
  isFirestoreConnected: boolean;
  bakeLocalFlagsToCode: () => Promise<{ success: boolean; customCount: number; deletedCount: number; error?: string }>;
  clearLocalFlagsStorageOnly: () => void;
  importCustomFlagsData: (data: any) => { success: boolean; importedCount: number; error?: string };
  exportCustomFlagsData: () => { customFlags: Flag[]; trash: TrashItem[]; permanentlyDeletedIds: string[] };
}

const FlagsContext = createContext<FlagsContextType | null>(null);

// Helper to remove undefined properties before saving to Firestore
function cleanObject<T extends object>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  Object.entries(obj).forEach(([key, value]) => {
    if (value !== undefined) {
      result[key] = value;
    }
  });
  return result;
}

export function FlagsProvider({ children }: { children: React.ReactNode }) {
  // Built-in baked flags loaded from codebase, reactive to immediate in-memory bake actions
  const [bakedCustomFlags, setBakedCustomFlags] = useState<Flag[]>(() => BUILTIN_CUSTOM_FLAGS || []);
  const [bakedDeletedIds, setBakedDeletedIds] = useState<string[]>(() => BUILTIN_DELETED_FLAG_IDS || []);
  const [isFirestoreConnected, setIsFirestoreConnected] = useState<boolean>(false);

  const [customFlags, setCustomFlags] = useState<Flag[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [permanentlyDeletedIds, setPermanentlyDeletedIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(PERMANENT_DELETED_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [trash, setTrash] = useState<TrashItem[]>(() => {
    try {
      const savedTrash = localStorage.getItem(TRASH_KEY);
      if (savedTrash) {
        return JSON.parse(savedTrash);
      }
      return [];
    } catch {
      return [];
    }
  });

  // Test connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Real-time Firestore Sync
  useEffect(() => {
    let unsubCustom: (() => void) | null = null;
    let unsubTrash: (() => void) | null = null;
    let unsubDeleted: (() => void) | null = null;

    try {
      // 1. Custom Flags Listener
      const customCol = collection(db, 'custom_flags');
      unsubCustom = onSnapshot(
        customCol,
        (snapshot) => {
          setIsFirestoreConnected(true);
          const fsFlags: Flag[] = [];
          snapshot.forEach((docSnap) => {
            fsFlags.push(docSnap.data() as Flag);
          });

          if (fsFlags.length > 0) {
            setCustomFlags((prev) => {
              // Merge Firestore flags with local storage flags
              const map = new Map<string, Flag>();
              prev.forEach((f) => map.set(f.id, f));
              fsFlags.forEach((f) => map.set(f.id, f));
              const merged = Array.from(map.values());
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        },
        (error) => {
          console.warn('Firestore custom_flags snapshot error:', error);
        }
      );

      // 2. Trash Flags Listener
      const trashCol = collection(db, 'trash_flags');
      unsubTrash = onSnapshot(
        trashCol,
        (snapshot) => {
          const fsTrash: TrashItem[] = [];
          snapshot.forEach((docSnap) => {
            fsTrash.push(docSnap.data() as TrashItem);
          });

          if (fsTrash.length > 0) {
            setTrash((prev) => {
              const map = new Map<string, TrashItem>();
              prev.forEach((t) => map.set(t.flag.id, t));
              fsTrash.forEach((t) => map.set(t.flag.id, t));
              const merged = Array.from(map.values());
              try {
                localStorage.setItem(TRASH_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        },
        (error) => {
          console.warn('Firestore trash_flags snapshot error:', error);
        }
      );

      // 3. Permanently Deleted Flag IDs Listener
      const deletedCol = collection(db, 'deleted_flag_ids');
      unsubDeleted = onSnapshot(
        deletedCol,
        (snapshot) => {
          const fsDeletedIds: string[] = [];
          snapshot.forEach((docSnap) => {
            fsDeletedIds.push(docSnap.id);
          });

          if (fsDeletedIds.length > 0) {
            setPermanentlyDeletedIds((prev) => {
              const set = new Set([...prev, ...fsDeletedIds]);
              const merged = Array.from(set);
              try {
                localStorage.setItem(PERMANENT_DELETED_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          }
        },
        (error) => {
          console.warn('Firestore deleted_flag_ids snapshot error:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Firestore listeners:', err);
    }

    return () => {
      if (unsubCustom) unsubCustom();
      if (unsubTrash) unsubTrash();
      if (unsubDeleted) unsubDeleted();
    };
  }, []);

  // Sync existing local items up to Firestore if connected
  useEffect(() => {
    if (!isFirestoreConnected) return;

    // Push local custom flags to Firestore
    customFlags.forEach((flag) => {
      setDoc(doc(db, 'custom_flags', flag.id), cleanObject(flag)).catch((err) =>
        console.warn('Failed to sync flag to Firestore:', flag.id, err)
      );
    });

    // Push local trash items to Firestore
    trash.forEach((item) => {
      setDoc(doc(db, 'trash_flags', item.flag.id), cleanObject(item)).catch((err) =>
        console.warn('Failed to sync trash item to Firestore:', item.flag.id, err)
      );
    });

    // Push permanently deleted IDs to Firestore
    permanentlyDeletedIds.forEach((id) => {
      setDoc(doc(db, 'deleted_flag_ids', id), { id, deletedAt: Date.now() }).catch((err) =>
        console.warn('Failed to sync deleted ID to Firestore:', id, err)
      );
    });
  }, [isFirestoreConnected]);

  // Effective built-in flags (Base flags + Baked custom flags - Baked deleted flags)
  const effectiveBuiltInFlags = useMemo(() => {
    const map = new Map<string, Flag>();
    BASE_FLAGS.forEach(flag => map.set(flag.id, flag));
    bakedCustomFlags.forEach(customFlag => map.set(customFlag.id, customFlag));

    const deletedSet = new Set(bakedDeletedIds);
    return Array.from(map.values()).filter(flag => !deletedSet.has(flag.id));
  }, [bakedCustomFlags, bakedDeletedIds]);

  const saveCustom = (newCustom: Flag[]) => {
    setCustomFlags(newCustom);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCustom));
  };

  const saveTrash = (newTrash: TrashItem[]) => {
    setTrash(newTrash);
    localStorage.setItem(TRASH_KEY, JSON.stringify(newTrash));
    localStorage.setItem(LEGACY_DELETED_KEY, JSON.stringify(newTrash.map(t => t.flag.id)));
  };

  const savePermanentlyDeleted = (newIds: string[]) => {
    setPermanentlyDeletedIds(newIds);
    localStorage.setItem(PERMANENT_DELETED_KEY, JSON.stringify(newIds));
  };

  const isCustomFlag = (id: string) => {
    return !effectiveBuiltInFlags.some(f => f.id === id);
  };

  const isModifiedBuiltIn = (id: string) => {
    return effectiveBuiltInFlags.some(f => f.id === id) && customFlags.some(f => f.id === id);
  };

  const getOriginalFlag = (id: string) => {
    return effectiveBuiltInFlags.find(f => f.id === id);
  };

  const addCustomFlag = (flag: Flag) => {
    // If was previously in trash or permanently deleted, clean up
    if (trash.some(t => t.flag.id === flag.id)) {
      saveTrash(trash.filter(t => t.flag.id !== flag.id));
      deleteDoc(doc(db, 'trash_flags', flag.id)).catch(() => {});
    }
    if (permanentlyDeletedIds.includes(flag.id)) {
      savePermanentlyDeleted(permanentlyDeletedIds.filter(id => id !== flag.id));
      deleteDoc(doc(db, 'deleted_flag_ids', flag.id)).catch(() => {});
    }

    const updated = [...customFlags.filter(f => f.id !== flag.id), flag];
    saveCustom(updated);

    // Save directly to Firestore
    setDoc(doc(db, 'custom_flags', flag.id), cleanObject(flag)).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `custom_flags/${flag.id}`);
    });
  };

  const editCustomFlag = (flag: Flag) => {
    if (trash.some(t => t.flag.id === flag.id)) {
      saveTrash(trash.filter(t => t.flag.id !== flag.id));
      deleteDoc(doc(db, 'trash_flags', flag.id)).catch(() => {});
    }
    if (permanentlyDeletedIds.includes(flag.id)) {
      savePermanentlyDeleted(permanentlyDeletedIds.filter(id => id !== flag.id));
      deleteDoc(doc(db, 'deleted_flag_ids', flag.id)).catch(() => {});
    }

    let updated: Flag[] = [];
    if (customFlags.some(f => f.id === flag.id)) {
      updated = customFlags.map(f => (f.id === flag.id ? flag : f));
    } else {
      updated = [...customFlags, flag];
    }
    saveCustom(updated);

    // Save directly to Firestore
    setDoc(doc(db, 'custom_flags', flag.id), cleanObject(flag)).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `custom_flags/${flag.id}`);
    });
  };

  const deleteFlag = (id: string) => {
    const customMatch = customFlags.find(f => f.id === id);
    const staticMatch = effectiveBuiltInFlags.find(f => f.id === id);
    const flagToDelete = customMatch || staticMatch;

    if (!flagToDelete) return;

    const isCustom = !effectiveBuiltInFlags.some(f => f.id === id);

    if (customMatch) {
      saveCustom(customFlags.filter(f => f.id !== id));
      deleteDoc(doc(db, 'custom_flags', id)).catch(() => {});
    }

    const newTrashItem: TrashItem = {
      flag: flagToDelete,
      deletedAt: Date.now(),
      isCustom,
    };

    saveTrash([newTrashItem, ...trash.filter(t => t.flag.id !== id)]);

    // Save to Firestore trash
    setDoc(doc(db, 'trash_flags', id), cleanObject(newTrashItem)).catch((err) => {
      handleFirestoreError(err, OperationType.WRITE, `trash_flags/${id}`);
    });
  };

  const deleteCustomFlag = deleteFlag;

  const restoreFlag = (id: string) => {
    const item = trash.find(t => t.flag.id === id);
    if (!item) return;

    if (item.isCustom) {
      saveCustom([...customFlags.filter(f => f.id !== id), item.flag]);
      setDoc(doc(db, 'custom_flags', id), cleanObject(item.flag)).catch(() => {});
    }

    saveTrash(trash.filter(t => t.flag.id !== id));
    deleteDoc(doc(db, 'trash_flags', id)).catch(() => {});

    if (permanentlyDeletedIds.includes(id)) {
      savePermanentlyDeleted(permanentlyDeletedIds.filter(d => d !== id));
      deleteDoc(doc(db, 'deleted_flag_ids', id)).catch(() => {});
    }
  };

  const restoreAllDeletedFlags = () => {
    const restoredCustoms: Flag[] = [];
    trash.forEach(item => {
      if (item.isCustom) {
        restoredCustoms.push(item.flag);
        setDoc(doc(db, 'custom_flags', item.flag.id), cleanObject(item.flag)).catch(() => {});
      }
      deleteDoc(doc(db, 'trash_flags', item.flag.id)).catch(() => {});
    });

    if (restoredCustoms.length > 0) {
      const existingIds = new Set(customFlags.map(f => f.id));
      const toAdd = restoredCustoms.filter(f => !existingIds.has(f.id));
      saveCustom([...customFlags, ...toAdd]);
    }

    saveTrash([]);
  };

  const permanentlyDeleteFlag = (id: string) => {
    const item = trash.find(t => t.flag.id === id);

    if (item && !item.isCustom) {
      if (!permanentlyDeletedIds.includes(id)) {
        savePermanentlyDeleted([...permanentlyDeletedIds, id]);
        setDoc(doc(db, 'deleted_flag_ids', id), { id, deletedAt: Date.now() }).catch(() => {});
      }
    }

    saveTrash(trash.filter(t => t.flag.id !== id));
    deleteDoc(doc(db, 'trash_flags', id)).catch(() => {});

    if (customFlags.some(f => f.id === id)) {
      saveCustom(customFlags.filter(f => f.id !== id));
      deleteDoc(doc(db, 'custom_flags', id)).catch(() => {});
    }
  };

  const emptyTrash = () => {
    const builtInIdsToHide = trash
      .filter(t => !t.isCustom)
      .map(t => t.flag.id)
      .filter(id => !permanentlyDeletedIds.includes(id));

    if (builtInIdsToHide.length > 0) {
      savePermanentlyDeleted([...permanentlyDeletedIds, ...builtInIdsToHide]);
      builtInIdsToHide.forEach(id => {
        setDoc(doc(db, 'deleted_flag_ids', id), { id, deletedAt: Date.now() }).catch(() => {});
      });
    }

    trash.forEach(item => {
      deleteDoc(doc(db, 'trash_flags', item.flag.id)).catch(() => {});
    });

    saveTrash([]);
  };

  const restoreAllPermanentlyDeleted = () => {
    permanentlyDeletedIds.forEach(id => {
      deleteDoc(doc(db, 'deleted_flag_ids', id)).catch(() => {});
    });
    savePermanentlyDeleted([]);
  };

  const resetFlagToDefault = (id: string) => {
    if (customFlags.some(f => f.id === id)) {
      saveCustom(customFlags.filter(f => f.id !== id));
      deleteDoc(doc(db, 'custom_flags', id)).catch(() => {});
    }
    if (trash.some(t => t.flag.id === id)) {
      saveTrash(trash.filter(t => t.flag.id !== id));
      deleteDoc(doc(db, 'trash_flags', id)).catch(() => {});
    }
    if (permanentlyDeletedIds.includes(id)) {
      savePermanentlyDeleted(permanentlyDeletedIds.filter(d => d !== id));
      deleteDoc(doc(db, 'deleted_flag_ids', id)).catch(() => {});
    }
  };

  const deletedFlagIds = useMemo(() => {
    return trash.map(t => t.flag.id);
  }, [trash]);

  const flags = useMemo(() => {
    const combined = [...effectiveBuiltInFlags];
    customFlags.forEach(cf => {
      const idx = combined.findIndex(f => f.id === cf.id);
      if (idx !== -1) {
        combined[idx] = cf;
      } else {
        combined.push(cf);
      }
    });

    const trashIds = new Set(trash.map(t => t.flag.id));
    const permIds = new Set(permanentlyDeletedIds);

    return combined.filter(f => !trashIds.has(f.id) && !permIds.has(f.id));
  }, [effectiveBuiltInFlags, customFlags, trash, permanentlyDeletedIds]);

  const hasLocalChanges = customFlags.length > 0 || trash.length > 0 || permanentlyDeletedIds.length > 0;

  const clearLocalFlagsStorageOnly = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TRASH_KEY);
      localStorage.removeItem(PERMANENT_DELETED_KEY);
      localStorage.removeItem(LEGACY_DELETED_KEY);
      setCustomFlags([]);
      setTrash([]);
      setPermanentlyDeletedIds([]);
    } catch (e) {
      console.error('Failed to clear flag storage', e);
    }
  };

  const bakeLocalFlagsToCode = async (): Promise<{
    success: boolean;
    customCount: number;
    deletedCount: number;
    error?: string;
  }> => {
    try {
      const response = await fetch('/api/bake-flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customFlags,
          permanentlyDeletedIds,
          trash
        })
      });

      const res = await response.json();
      if (res.success) {
        const currentCustom = [...customFlags];
        const currentTrash = [...trash];
        const currentPerm = [...permanentlyDeletedIds];
        const trashFlagIds = currentTrash.map(t => t.flag.id);

        setBakedCustomFlags(prev => {
          const map = new Map<string, Flag>();
          prev.forEach(f => map.set(f.id, f));
          currentCustom.forEach(f => map.set(f.id, f));
          const allDeleted = new Set<string>([...currentPerm, ...trashFlagIds]);
          return Array.from(map.values()).filter(f => !allDeleted.has(f.id));
        });

        setBakedDeletedIds(prev => {
          return Array.from(new Set<string>([...prev, ...currentPerm, ...trashFlagIds]));
        });

        return {
          success: true,
          customCount: res.customCount ?? 0,
          deletedCount: res.deletedCount ?? 0
        };
      } else {
        return {
          success: false,
          customCount: 0,
          deletedCount: 0,
          error: res.error || 'Server returned failure'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        customCount: 0,
        deletedCount: 0,
        error: err?.message || 'Failed to connect to local development server'
      };
    }
  };

  const exportCustomFlagsData = () => {
    return {
      customFlags,
      trash,
      permanentlyDeletedIds
    };
  };

  const importCustomFlagsData = (data: any): { success: boolean; importedCount: number; error?: string } => {
    try {
      if (!data) {
        return { success: false, importedCount: 0, error: 'No data provided' };
      }

      let importedFlags: Flag[] = [];
      let importedTrash: TrashItem[] = [];
      let importedPermIds: string[] = [];

      if (Array.isArray(data)) {
        importedFlags = data.filter(f => f && typeof f.id === 'string' && typeof f.name === 'string');
      } else if (typeof data === 'object') {
        if (Array.isArray(data.customFlags)) {
          importedFlags = data.customFlags.filter((f: any) => f && typeof f.id === 'string' && typeof f.name === 'string');
        } else if (Array.isArray(data.flags)) {
          importedFlags = data.flags.filter((f: any) => f && typeof f.id === 'string' && typeof f.name === 'string');
        }

        if (Array.isArray(data.trash)) {
          importedTrash = data.trash.filter((t: any) => t && t.flag && typeof t.flag.id === 'string');
        }

        if (Array.isArray(data.permanentlyDeletedIds)) {
          importedPermIds = data.permanentlyDeletedIds.filter((id: any) => typeof id === 'string');
        }
      }

      if (importedFlags.length === 0 && importedTrash.length === 0 && importedPermIds.length === 0) {
        return { success: false, importedCount: 0, error: 'No valid flag data found in JSON' };
      }

      const currentMap = new Map<string, Flag>(customFlags.map(f => [f.id, f]));
      importedFlags.forEach(f => {
        currentMap.set(f.id, f);
        setDoc(doc(db, 'custom_flags', f.id), cleanObject(f)).catch(() => {});
      });
      const mergedCustom = Array.from(currentMap.values());
      saveCustom(mergedCustom);

      if (importedTrash.length > 0) {
        const trashMap = new Map<string, TrashItem>(trash.map(t => [t.flag.id, t]));
        importedTrash.forEach(t => {
          trashMap.set(t.flag.id, t);
          setDoc(doc(db, 'trash_flags', t.flag.id), cleanObject(t)).catch(() => {});
        });
        saveTrash(Array.from(trashMap.values()));
      }

      if (importedPermIds.length > 0) {
        const permSet = new Set([...permanentlyDeletedIds, ...importedPermIds]);
        const permList = Array.from(permSet);
        permList.forEach(id => {
          setDoc(doc(db, 'deleted_flag_ids', id), { id, deletedAt: Date.now() }).catch(() => {});
        });
        savePermanentlyDeleted(permList);
      }

      return {
        success: true,
        importedCount: importedFlags.length
      };
    } catch (err: any) {
      return { success: false, importedCount: 0, error: err?.message || 'Failed to import flags' };
    }
  };

  return (
    <FlagsContext.Provider
      value={{
        flags,
        customFlags,
        trash,
        deletedFlagIds,
        permanentlyDeletedIds,
        addCustomFlag,
        editCustomFlag,
        deleteFlag,
        deleteCustomFlag,
        restoreFlag,
        restoreAllDeletedFlags,
        permanentlyDeleteFlag,
        emptyTrash,
        restoreAllPermanentlyDeleted,
        resetFlagToDefault,
        isCustomFlag,
        isModifiedBuiltIn,
        getOriginalFlag,
        hasLocalChanges,
        isFirestoreConnected,
        bakeLocalFlagsToCode,
        clearLocalFlagsStorageOnly,
        importCustomFlagsData,
        exportCustomFlagsData,
      }}
    >
      {children}
    </FlagsContext.Provider>
  );
}

export function useFlags() {
  const ctx = useContext(FlagsContext);
  if (!ctx) throw new Error('useFlags must be used within FlagsProvider');
  return ctx;
}
