import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  BASE_FLAGS,
  BUILTIN_CUSTOM_FLAGS,
  BUILTIN_DELETED_FLAG_IDS
} from '../data/flags';
import { Flag, TrashItem, ALL_CATEGORIES, ALL_CONTINENTS } from '../types';
import { CONCEPT_SECTIONS } from '../data/concepts';
import { db, testFirestoreConnection, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs } from 'firebase/firestore';

const STORAGE_KEY = 'vexillo_custom_flags';
const TRASH_KEY = 'vexillo_trash_flags';
const PERMANENT_DELETED_KEY = 'vexillo_permanently_deleted_ids';
const LEGACY_DELETED_KEY = 'vexillo_deleted_flag_ids';
const SUBCATEGORIES_KEY = 'vexillo_custom_subcategories';
const CUSTOM_CATEGORIES_KEY = 'vexillo_custom_categories';
const CUSTOM_SECTIONS_KEY = 'vexillo_custom_sections';

export const FICTIONAL_SECTION_NAMES = ['Franchises / Universes', 'Media'] as const;

// Categories whose flags store a sub-section in `flag.continent`.
export const CATEGORIES_WITH_SECTIONS = [
  'Sovereign States',
  'Non-Sovereign & Unrecognized',
  'US States',
  'Provinces & Territories',
  'Indigenous & Cultural Populations',
  'Organizations',
  'Languages',
  'Fictional',
  'Concepts',
] as const;

export const CATEGORIES_WITH_SUBCATEGORIES = [
  'Provinces & Territories',
  'Indigenous & Cultural Populations',
  'Fictional',
  'LGBTQI+',
  'Languages',
  'Pirate Flags',
  'Organizations',
  'Concepts',
] as const;

export type SubCategoryParent = (typeof CATEGORIES_WITH_SUBCATEGORIES)[number] | string;

export type DeleteSubCategoryMode = 'delete-flags' | 'move-flags';
export type DeleteCategoryMode = 'delete-flags' | 'move-flags';
export type DeleteSectionMode = 'delete-flags' | 'move-flags';

interface FlagsContextType {
  flags: Flag[];
  customFlags: Flag[];
  // Built-in flags from code (base + baked customs, minus baked deletions).
  // Exposed so filter components can derive options without re-scanning.
  effectiveBuiltInFlags: Flag[];
  trash: TrashItem[];
  deletedFlagIds: string[];
  permanentlyDeletedIds: string[];
  customSubCategories: Record<string, string[]>;
  getSubCategories: (category: string) => string[];
  getSubCategoryFlagCount: (category: string, sub: string) => number;
  addSubCategory: (category: string, name: string) => { success: boolean; error?: string };
  renameSubCategory: (category: string, oldName: string, newName: string) => { success: boolean; error?: string; updatedCount?: number };
  deleteSubCategory: (category: string, name: string, action: { mode: DeleteSubCategoryMode; moveTo?: string }) => { success: boolean; error?: string; affectedCount?: number };
  customCategories: string[];
  getCategories: () => string[];
  getCategoryFlagCount: (category: string) => number;
  addCategory: (name: string) => { success: boolean; error?: string };
  renameCategory: (oldName: string, newName: string) => { success: boolean; error?: string; updatedCount?: number };
  deleteCategory: (name: string, action: { mode: DeleteCategoryMode; moveTo?: string }) => { success: boolean; error?: string; affectedCount?: number };
  customSections: Record<string, string[]>;
  getSections: (category: string) => string[];
  getSectionFlagCount: (category: string, section: string) => number;
  addSection: (category: string, name: string) => { success: boolean; error?: string };
  renameSection: (category: string, oldName: string, newName: string) => { success: boolean; error?: string; updatedCount?: number };
  deleteSection: (category: string, name: string, action: { mode: DeleteSectionMode; moveTo?: string }) => { success: boolean; error?: string; affectedCount?: number };
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
  // True once the first real (non-cached) server snapshots for the three flag
  // collections have been reconciled. Gates the one-time local -> cloud seed
  // so stale local deletions are never re-uploaded.
  const [initialSyncDone, setInitialSyncDone] = useState<boolean>(false);
  // IDs already observed in Firestore. Used to propagate deletions made on
  // another client (or directly in the console) down to local state.
  // Null until the first server snapshot arrives.
  const trashSeenRef = useRef<Set<string> | null>(null);
  const deletedSeenRef = useRef<Set<string> | null>(null);
  const firstSnapshotsRef = useRef({ custom: false, trash: false, deleted: false });

  const markSnapshotReady = (key: 'custom' | 'trash' | 'deleted') => {
    const s = firstSnapshotsRef.current;
    if (!s[key]) {
      s[key] = true;
      if (s.custom && s.trash && s.deleted) setInitialSyncDone(true);
    }
  };

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

  const [customSubCategories, setCustomSubCategories] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(SUBCATEGORIES_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const cleaned: Record<string, string[]> = {};
        Object.entries(parsed).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            cleaned[k] = (v as unknown[]).filter(x => typeof x === 'string').map(s => (s as string).trim()).filter(Boolean);
          }
        });
        return cleaned;
      }
      return {};
    } catch {
      return {};
    }
  });

  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_CATEGORIES_KEY);
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return (parsed as unknown[]).filter(x => typeof x === 'string').map(s => (s as string).trim()).filter(Boolean);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [customSections, setCustomSections] = useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_SECTIONS_KEY);
      if (!saved) return {};
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        const cleaned: Record<string, string[]> = {};
        Object.entries(parsed).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            cleaned[k] = (v as unknown[]).filter(x => typeof x === 'string').map(s => (s as string).trim()).filter(Boolean);
          }
        });
        return cleaned;
      }
      return {};
    } catch {
      return {};
    }
  });

  // Test connection on boot
  useEffect(() => {
    testFirestoreConnection();
  }, []);

  // Real-time Firestore Sync (live listeners only for the small collections;
  // custom_flags is fetched once — see below)
  useEffect(() => {
    let unsubTrash: (() => void) | null = null;
    let unsubDeleted: (() => void) | null = null;
    let unsubSubs: (() => void) | null = null;
    let unsubCats: (() => void) | null = null;
    let unsubSections: (() => void) | null = null;
    let cancelled = false;

    try {
      // 1. Custom Flags: one-time fetch, no live listener. This collection can
      // hold thousands of docs; a persistent listener re-downloads them on
      // every change. All mutations write through to Firestore directly, and
      // trash/hidden-ID changes still arrive live via the listeners below.
      const customCol = collection(db, 'custom_flags');
      getDocs(customCol)
        .then((snapshot) => {
          if (cancelled) return;
          setIsFirestoreConnected(true);
          if (!snapshot.metadata.fromCache) markSnapshotReady('custom');
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
              const unchanged = merged.length === prev.length && prev.every((f, i) => merged[i] === f);
              if (unchanged) return prev;
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
              } catch {}
              return merged;
            });
          } else if (!snapshot.metadata.fromCache) {
            markSnapshotReady('custom');
          }
        })
        .catch((error) => {
          if (!cancelled) console.warn('Firestore custom_flags fetch error:', error);
        });

      // 2. Trash Flags Listener (Firestore is source of truth; deletions
      // confirmed in the trash bin propagate to every client automatically)
      const trashCol = collection(db, 'trash_flags');
      unsubTrash = onSnapshot(
        trashCol,
        (snapshot) => {
          const fromServer = !snapshot.metadata.fromCache;
          if (fromServer) markSnapshotReady('trash');
          const fsTrash: TrashItem[] = [];
          snapshot.forEach((docSnap) => {
            fsTrash.push(docSnap.data() as TrashItem);
          });
          const fsIds = new Set(fsTrash.map((t) => t.flag.id));

          // While offline (cached snapshot) never discard local items.
          if (!fromServer && trashSeenRef.current === null) return;

          setTrash((prev) => {
            const seen = trashSeenRef.current;
            let next: TrashItem[];
            if (seen === null) {
              // First server snapshot: adopt Firestore contents so items
              // deleted elsewhere (e.g. trash emptied in the console) do not
              // linger locally and get re-uploaded.
              const map = new Map<string, TrashItem>();
              fsTrash.forEach((t) => map.set(t.flag.id, t));
              next = Array.from(map.values());
            } else {
              const map = new Map<string, TrashItem>();
              prev.forEach((t) => {
                if (fsIds.has(t.flag.id) || !seen.has(t.flag.id)) map.set(t.flag.id, t);
              });
              fsTrash.forEach((t) => map.set(t.flag.id, t));
              next = Array.from(map.values());
            }
            trashSeenRef.current = fsIds;
            const unchanged = next.length === prev.length && prev.every((t, i) => next[i] === t);
            if (unchanged) return prev;
            try {
              localStorage.setItem(TRASH_KEY, JSON.stringify(next));
              localStorage.setItem(LEGACY_DELETED_KEY, JSON.stringify(next.map((t) => t.flag.id)));
            } catch {}
            return next;
          });
        },
        (error) => {
          console.warn('Firestore trash_flags snapshot error:', error);
        }
      );

      // 3. Permanently Deleted Flag IDs Listener (Firestore is source of
      // truth; confirmed deletions propagate to every client automatically)
      const deletedCol = collection(db, 'deleted_flag_ids');
      unsubDeleted = onSnapshot(
        deletedCol,
        (snapshot) => {
          const fromServer = !snapshot.metadata.fromCache;
          if (fromServer) markSnapshotReady('deleted');
          const fsDeletedIds = new Set<string>();
          snapshot.forEach((docSnap) => {
            fsDeletedIds.add(docSnap.id);
          });

          // While offline (cached snapshot) never discard local items.
          if (!fromServer && deletedSeenRef.current === null) return;

          setPermanentlyDeletedIds((prev) => {
            const seen = deletedSeenRef.current;
            let next: string[];
            if (seen === null) {
              // First server snapshot: adopt Firestore contents so IDs deleted
              // elsewhere do not linger locally and get re-uploaded.
              next = Array.from(fsDeletedIds);
            } else {
              const merged = new Set<string>(fsDeletedIds);
              prev.forEach((id) => {
                if (fsDeletedIds.has(id) || !seen.has(id)) merged.add(id);
              });
              next = Array.from(merged);
            }
            deletedSeenRef.current = new Set(fsDeletedIds);
            const unchanged = next.length === prev.length && prev.every((id) => next.includes(id));
            if (unchanged) return prev;
            try {
              localStorage.setItem(PERMANENT_DELETED_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
        },
        (error) => {
          console.warn('Firestore deleted_flag_ids snapshot error:', error);
        }
      );

      // 4. Custom Sub-categories Listener (one doc per parent category)
      const subsCol = collection(db, 'custom_subcategories');
      unsubSubs = onSnapshot(
        subsCol,
        (snapshot) => {
          if (snapshot.empty) return;
          setCustomSubCategories((prev) => {
            const merged: Record<string, string[]> = { ...prev };
            let changed = false;
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as { category?: string; values?: string[] };
              const cat = data.category || docSnap.id;
              const vals = Array.isArray(data.values)
                ? data.values.filter(v => typeof v === 'string').map(v => v.trim()).filter(Boolean)
                : [];
              const prevSet = new Set(merged[cat] || []);
              const nextSet = new Set([...prevSet, ...vals]);
              const nextArr = Array.from(nextSet);
              if (nextArr.length !== (merged[cat] || []).length) changed = true;
              merged[cat] = nextArr;
            });
            if (!changed) return prev;
            try {
              localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        },
        (error) => {
          console.warn('Firestore custom_subcategories snapshot error:', error);
        }
      );

      // 5. Custom Categories Listener (single doc 'all')
      const catsCol = collection(db, 'custom_categories');
      unsubCats = onSnapshot(
        catsCol,
        (snapshot) => {
          if (snapshot.empty) return;
          const vals: string[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data() as { values?: string[] };
            if (Array.isArray(data.values)) {
              data.values.forEach(v => {
                if (typeof v === 'string' && v.trim()) vals.push(v.trim());
              });
            }
          });
          if (vals.length === 0) return;
          setCustomCategories((prev) => {
            const merged = Array.from(new Set([...prev, ...vals]));
            if (merged.length === prev.length) return prev;
            try {
              localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        },
        (error) => {
          console.warn('Firestore custom_categories snapshot error:', error);
        }
      );

      // 6. Custom Sections Listener (one doc per parent category)
      const sectionsCol = collection(db, 'custom_sections');
      unsubSections = onSnapshot(
        sectionsCol,
        (snapshot) => {
          if (snapshot.empty) return;
          setCustomSections((prev) => {
            const merged: Record<string, string[]> = { ...prev };
            let changed = false;
            snapshot.forEach((docSnap) => {
              const data = docSnap.data() as { category?: string; values?: string[] };
              const cat = data.category || docSnap.id;
              const vals = Array.isArray(data.values)
                ? data.values.filter(v => typeof v === 'string').map(v => v.trim()).filter(Boolean)
                : [];
              const prevSet = new Set(merged[cat] || []);
              const nextSet = new Set([...prevSet, ...vals]);
              const nextArr = Array.from(nextSet);
              if (nextArr.length !== (merged[cat] || []).length) changed = true;
              merged[cat] = nextArr;
            });
            if (!changed) return prev;
            try {
              localStorage.setItem(CUSTOM_SECTIONS_KEY, JSON.stringify(merged));
            } catch {}
            return merged;
          });
        },
        (error) => {
          console.warn('Firestore custom_sections snapshot error:', error);
        }
      );
    } catch (err) {
      console.warn('Failed to attach Firestore listeners:', err);
    }

    return () => {
      cancelled = true;
      if (unsubTrash) unsubTrash();
      if (unsubDeleted) unsubDeleted();
      if (unsubSubs) unsubSubs();
      if (unsubCats) unsubCats();
      if (unsubSections) unsubSections();
    };
  }, []);

  // One-time seed: push small pre-existing local items (trash, hidden IDs,
  // taxonomy) up to Firestore once connected. Custom flags are deliberately
  // excluded: every mutation writes through to Firestore directly, so bulk
  // re-uploading thousands of docs on each fresh client would only burn
  // bandwidth and write quota. Runs after the first server snapshots have
  // been reconciled (initialSyncDone) so stale entries are never re-uploaded.
  useEffect(() => {
    if (!isFirestoreConnected || !initialSyncDone) return;

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

    // Push local custom sub-categories to Firestore
    Object.entries(customSubCategories).forEach(([cat, values]) => {
      setDoc(doc(db, 'custom_subcategories', cat), { category: cat, values }).catch((err) =>
        console.warn('Failed to sync sub-category to Firestore:', cat, err)
      );
    });

    // Push local custom categories to Firestore (single doc)
    if (customCategories.length > 0) {
      setDoc(doc(db, 'custom_categories', 'all'), { values: customCategories }).catch((err) =>
        console.warn('Failed to sync categories to Firestore:', err)
      );
    }

    // Push local custom sections to Firestore
    Object.entries(customSections).forEach(([cat, values]) => {
      setDoc(doc(db, 'custom_sections', cat), { category: cat, values }).catch((err) =>
        console.warn('Failed to sync section to Firestore:', cat, err)
      );
    });
  }, [isFirestoreConnected, initialSyncDone]);

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

    const trashedIds = new Set(trash.map(t => t.flag.id));
    trash.forEach(item => {
      deleteDoc(doc(db, 'trash_flags', item.flag.id)).catch(() => {});
      // Drop any lingering custom override for the trashed flag as well, so a
      // hardcoded flag can't conflict with a stale override if it reappears.
      deleteDoc(doc(db, 'custom_flags', item.flag.id)).catch(() => {});
    });
    if (customFlags.some(f => trashedIds.has(f.id))) {
      saveCustom(customFlags.filter(f => !trashedIds.has(f.id)));
    }

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

  // ---- Sub-category management (stored in flag.country per parent category) ----
  const saveSubCategories = (next: Record<string, string[]>) => {
    setCustomSubCategories(next);
    try {
      localStorage.setItem(SUBCATEGORIES_KEY, JSON.stringify(next));
    } catch {}
    Object.entries(next).forEach(([cat, values]) => {
      setDoc(doc(db, 'custom_subcategories', cat), { category: cat, values }).catch(() => {});
    });
  };

  const getSubCategories = (category: string): string[] => {
    const derived = new Set<string>();
    effectiveBuiltInFlags.forEach(f => {
      if (f.category === category && f.country?.trim()) derived.add(f.country.trim());
    });
    customFlags.forEach(f => {
      if (f.category === category && f.country?.trim()) derived.add(f.country.trim());
    });
    // Visible flags already include overrides, but also scan merged flags for safety
    flags.forEach(f => {
      if (f.category === category && f.country?.trim()) derived.add(f.country.trim());
    });
    (customSubCategories[category] || []).forEach(v => {
      const t = v.trim();
      if (t) derived.add(t);
    });
    return Array.from(derived).sort((a, b) => a.localeCompare(b));
  };

  const getSubCategoryFlagCount = (category: string, sub: string): number => {
    return flags.filter(f => f.category === category && f.country === sub).length;
  };

  const normalizeName = (s: string) => s.trim();

  const addSubCategory = (category: string, name: string): { success: boolean; error?: string } => {
    const trimmed = normalizeName(name);
    if (!trimmed) return { success: false, error: 'Name is required.' };
    const existing = getSubCategories(category);
    if (existing.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: `Sub-category "${trimmed}" already exists.` };
    }
    const next = {
      ...customSubCategories,
      [category]: [...(customSubCategories[category] || []), trimmed],
    };
    saveSubCategories(next);
    return { success: true };
  };

  const renameSubCategory = (category: string, oldName: string, newName: string): { success: boolean; error?: string; updatedCount?: number } => {
    const from = normalizeName(oldName);
    const to = normalizeName(newName);
    if (!from || !to) return { success: false, error: 'Both names are required.' };
    if (from.toLowerCase() === to.toLowerCase()) {
      // Case-only rename: allow, still update flags + custom list
      if (from === to) return { success: false, error: 'New name is the same as the old name.' };
    } else {
      const existing = getSubCategories(category);
      if (!existing.includes(from)) return { success: false, error: `Sub-category "${from}" not found.` };
      if (existing.some(e => e.toLowerCase() === to.toLowerCase())) {
        return { success: false, error: `Sub-category "${to}" already exists. Delete or merge instead.` };
      }
    }

    const affected = flags.filter(f => f.category === category && f.country === from);
    // Bulk-update: build new customFlags overrides for every affected flag
    const customMap = new Map<string, Flag>(customFlags.map(f => [f.id, f]));
    affected.forEach(orig => {
      const updated: Flag = { ...orig, country: to };
      customMap.set(orig.id, updated);
      setDoc(doc(db, 'custom_flags', orig.id), cleanObject(updated)).catch(() => {});
    });
    const mergedCustom = Array.from(customMap.values());
    setCustomFlags(mergedCustom);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedCustom));
    } catch {}

    // Update custom sub-category registry: drop old, keep registry tidy (new name comes from flags)
    const currentList = customSubCategories[category] || [];
    const withoutOld = currentList.filter(v => v !== from);
    // If the renamed sub had zero flags (pure custom entry), ensure new name persists
    const next: Record<string, string[]> = { ...customSubCategories };
    if (affected.length === 0 && currentList.includes(from)) {
      next[category] = [...withoutOld, to];
    } else if (withoutOld.length !== currentList.length) {
      next[category] = withoutOld;
    }
    if (next[category] !== customSubCategories[category]) {
      saveSubCategories(next);
    }

    return { success: true, updatedCount: affected.length };
  };

  const deleteSubCategory = (
    category: string,
    name: string,
    action: { mode: DeleteSubCategoryMode; moveTo?: string }
  ): { success: boolean; error?: string; affectedCount?: number } => {
    const target = normalizeName(name);
    if (!target) return { success: false, error: 'Sub-category name is required.' };
    const existing = getSubCategories(category);
    if (!existing.includes(target)) return { success: false, error: `Sub-category "${target}" not found.` };

    const affected = flags.filter(f => f.category === category && f.country === target);

    if (action.mode === 'move-flags') {
      const dest = normalizeName(action.moveTo || '');
      if (!dest) return { success: false, error: 'Choose a destination sub-category.' };
      if (dest === target) return { success: false, error: 'Destination must be different.' };
      if (!existing.includes(dest)) return { success: false, error: `Destination "${dest}" not found.` };

      const customMap = new Map<string, Flag>(customFlags.map(f => [f.id, f]));
      affected.forEach(orig => {
        const updated: Flag = { ...orig, country: dest };
        customMap.set(orig.id, updated);
        setDoc(doc(db, 'custom_flags', orig.id), cleanObject(updated)).catch(() => {});
      });
      const mergedCustom = Array.from(customMap.values());
      setCustomFlags(mergedCustom);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedCustom));
      } catch {}
    } else {
      // delete-flags: move every flag in the sub-category to trash (recoverable)
      if (affected.length > 0) {
        const affectedIds = new Set(affected.map(f => f.id));
        const remainingCustom = customFlags.filter(f => !affectedIds.has(f.id));
        setCustomFlags(remainingCustom);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingCustom));
        } catch {}
        affected.forEach(f => {
          deleteDoc(doc(db, 'custom_flags', f.id)).catch(() => {});
        });

        const newItems: TrashItem[] = affected.map(flag => ({
          flag,
          deletedAt: Date.now(),
          isCustom: !effectiveBuiltInFlags.some(f => f.id === flag.id),
        }));
        const mergedTrash = [...newItems, ...trash.filter(t => !affectedIds.has(t.flag.id))];
        saveTrash(mergedTrash);
        newItems.forEach(item => {
          setDoc(doc(db, 'trash_flags', item.flag.id), cleanObject(item)).catch(() => {});
        });
      }
    }

    // Drop deleted name from custom registry
    const currentList = customSubCategories[category] || [];
    if (currentList.includes(target)) {
      const next = { ...customSubCategories, [category]: currentList.filter(v => v !== target) };
      saveSubCategories(next);
    }

    return { success: true, affectedCount: affected.length };
  };

  // ---- Category management (top-level flag.category) ----
  const saveCustomCategories = (next: string[]) => {
    setCustomCategories(next);
    try {
      localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(next));
    } catch {}
    setDoc(doc(db, 'custom_categories', 'all'), { values: next }).catch(() => {});
  };

  const getCategories = (): string[] => {
    const seen = new Set<string>();
    (ALL_CATEGORIES as string[]).forEach(c => seen.add(c));
    customCategories.forEach(c => { const t = c.trim(); if (t) seen.add(t); });
    // Robustness: include any category actually used by flags (e.g. after import)
    flags.forEach(f => { if (f.category?.trim()) seen.add(f.category.trim()); });
    effectiveBuiltInFlags.forEach(f => { if (f.category?.trim()) seen.add(f.category.trim()); });
    const builtInOrder = ALL_CATEGORIES as string[];
    const builtIn = builtInOrder.filter(c => seen.has(c));
    const extra = Array.from(seen).filter(c => !(builtInOrder as string[]).includes(c)).sort((a, b) => a.localeCompare(b));
    return [...builtIn, ...extra];
  };

  const getCategoryFlagCount = (category: string): number => {
    return flags.filter(f => f.category === category).length;
  };

  const addCategory = (name: string): { success: boolean; error?: string } => {
    const trimmed = normalizeName(name);
    if (!trimmed) return { success: false, error: 'Name is required.' };
    const existing = getCategories();
    if (existing.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: `Category "${trimmed}" already exists.` };
    }
    saveCustomCategories([...customCategories, trimmed]);
    return { success: true };
  };

  const renameCategory = (oldName: string, newName: string): { success: boolean; error?: string; updatedCount?: number } => {
    const from = normalizeName(oldName);
    const to = normalizeName(newName);
    if (!from || !to) return { success: false, error: 'Both names are required.' };
    if (from === to) return { success: false, error: 'New name is the same as the old name.' };
    const existing = getCategories();
    if (!existing.includes(from)) return { success: false, error: `Category "${from}" not found.` };
    if (existing.some(e => e.toLowerCase() === to.toLowerCase())) {
      return { success: false, error: `Category "${to}" already exists. Merge instead.` };
    }
    const isBuiltIn = (ALL_CATEGORIES as string[]).includes(from);
    if (isBuiltIn) {
      return { success: false, error: `Built-in category "${from}" cannot be renamed. Create a new category and move flags instead.` };
    }

    const affected = flags.filter(f => f.category === from);
    const customMap = new Map<string, Flag>(customFlags.map(f => [f.id, f]));
    affected.forEach(orig => {
      const updated: Flag = { ...orig, category: to as Flag['category'] };
      customMap.set(orig.id, updated);
      setDoc(doc(db, 'custom_flags', orig.id), cleanObject(updated)).catch(() => {});
    });
    const mergedCustom = Array.from(customMap.values());
    setCustomFlags(mergedCustom);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedCustom)); } catch {}

    // Move taxonomy registries keyed by category
    if (customSubCategories[from]) {
      const nextSubs = { ...customSubCategories };
      const merged = Array.from(new Set([...(nextSubs[to] || []), ...nextSubs[from]]));
      nextSubs[to] = merged;
      delete nextSubs[from];
      saveSubCategories(nextSubs);
    }
    if (customSections[from]) {
      const nextSecs = { ...customSections };
      const merged = Array.from(new Set([...(nextSecs[to] || []), ...nextSecs[from]]));
      nextSecs[to] = merged;
      delete nextSecs[from];
      saveCustomSections(nextSecs);
    }
    saveCustomCategories([...customCategories.filter(c => c !== from), to]);

    return { success: true, updatedCount: affected.length };
  };

  const deleteCategory = (name: string, action: { mode: DeleteCategoryMode; moveTo?: string }): { success: boolean; error?: string; affectedCount?: number } => {
    const target = normalizeName(name);
    if (!target) return { success: false, error: 'Category name is required.' };
    const existing = getCategories();
    if (!existing.includes(target)) return { success: false, error: `Category "${target}" not found.` };
    if ((ALL_CATEGORIES as string[]).includes(target)) {
      return { success: false, error: `Built-in category "${target}" cannot be deleted. Move its flags to another category instead.` };
    }

    const affected = flags.filter(f => f.category === target);

    if (action.mode === 'move-flags') {
      const dest = normalizeName(action.moveTo || '');
      if (!dest) return { success: false, error: 'Choose a destination category.' };
      if (dest === target) return { success: false, error: 'Destination must be different.' };
      if (!existing.includes(dest)) return { success: false, error: `Destination "${dest}" not found.` };
      const customMap = new Map<string, Flag>(customFlags.map(f => [f.id, f]));
      affected.forEach(orig => {
        const updated: Flag = { ...orig, category: dest as Flag['category'] };
        customMap.set(orig.id, updated);
        setDoc(doc(db, 'custom_flags', orig.id), cleanObject(updated)).catch(() => {});
      });
      const mergedCustom = Array.from(customMap.values());
      setCustomFlags(mergedCustom);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedCustom)); } catch {}
    } else {
      if (affected.length > 0) {
        const affectedIds = new Set(affected.map(f => f.id));
        const remainingCustom = customFlags.filter(f => !affectedIds.has(f.id));
        setCustomFlags(remainingCustom);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingCustom)); } catch {}
        affected.forEach(f => { deleteDoc(doc(db, 'custom_flags', f.id)).catch(() => {}); });
        const newItems: TrashItem[] = affected.map(flag => ({
          flag,
          deletedAt: Date.now(),
          isCustom: !effectiveBuiltInFlags.some(f => f.id === flag.id),
        }));
        const mergedTrash = [...newItems, ...trash.filter(t => !affectedIds.has(t.flag.id))];
        saveTrash(mergedTrash);
        newItems.forEach(item => {
          setDoc(doc(db, 'trash_flags', item.flag.id), cleanObject(item)).catch(() => {});
        });
      }
    }

    // Clean registries
    if (customSubCategories[target]) {
      const nextSubs = { ...customSubCategories };
      delete nextSubs[target];
      saveSubCategories(nextSubs);
    }
    if (customSections[target]) {
      const nextSecs = { ...customSections };
      delete nextSecs[target];
      saveCustomSections(nextSecs);
    }
    saveCustomCategories(customCategories.filter(c => c !== target));

    return { success: true, affectedCount: affected.length };
  };

  // ---- Sub-section management (stored in flag.continent per parent category) ----
  const saveCustomSections = (next: Record<string, string[]>) => {
    setCustomSections(next);
    try {
      localStorage.setItem(CUSTOM_SECTIONS_KEY, JSON.stringify(next));
    } catch {}
    Object.entries(next).forEach(([cat, values]) => {
      setDoc(doc(db, 'custom_sections', cat), { category: cat, values }).catch(() => {});
    });
  };

  const isSectionlessCategory = (category: string) => {
    return category === 'LGBTQI+' || category === 'Pirate Flags';
  };

  const getSections = (category: string): string[] => {
    if (category === 'Fictional') {
      return [...FICTIONAL_SECTION_NAMES];
    }
    if (isSectionlessCategory(category)) {
      return [];
    }
    const base: string[] = [];
    if (category === 'Concepts') {
      base.push(...(CONCEPT_SECTIONS as unknown as string[]));
    } else if (category === 'Organizations') {
      base.push('Global', ...(ALL_CONTINENTS as string[]));
    } else {
      base.push(...(ALL_CONTINENTS as string[]));
    }
    const derived = new Set<string>(base);
    const scan = (f: Flag) => {
      if (f.category === category) {
        // continent holds the section for sectioned categories
        const cont = (f as Flag).continent;
        if (typeof cont === 'string' && cont.trim()) derived.add(cont.trim());
      }
    };
    effectiveBuiltInFlags.forEach(scan);
    customFlags.forEach(scan);
    flags.forEach(scan);
    (customSections[category] || []).forEach(v => { const t = v.trim(); if (t) derived.add(t); });
    // Keep geographic/continent order stable, extras sorted at end
    const order = [...base];
    const extras = Array.from(derived).filter(v => !order.includes(v)).sort((a, b) => a.localeCompare(b));
    return [...order.filter(v => derived.has(v)), ...extras];
  };

  const getSectionFlagCount = (category: string, section: string): number => {
    if (category === 'Fictional') {
      // Fictional sections group sub-categories, not flags directly via continent.
      // Count flags whose universe belongs to the section group is handled in UI;
      // here return 0 to avoid misuse — UI computes grouped counts separately.
      return 0;
    }
    return flags.filter(f => f.category === category && f.continent === section).length;
  };

  const addSection = (category: string, name: string): { success: boolean; error?: string } => {
    const trimmed = normalizeName(name);
    if (!trimmed) return { success: false, error: 'Name is required.' };
    if (category === 'Fictional') {
      return { success: false, error: 'Fictional sections (Franchises / Universes, Media) are fixed.' };
    }
    if (isSectionlessCategory(category)) {
      return { success: false, error: `Category "${category}" does not use sub-sections.` };
    }
    const existing = getSections(category);
    if (existing.some(e => e.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, error: `Sub-section "${trimmed}" already exists.` };
    }
    const next = { ...customSections, [category]: [...(customSections[category] || []), trimmed] };
    saveCustomSections(next);
    return { success: true };
  };

  const renameSection = (category: string, oldName: string, newName: string): { success: boolean; error?: string; updatedCount?: number } => {
    const from = normalizeName(oldName);
    const to = normalizeName(newName);
    if (!from || !to) return { success: false, error: 'Both names are required.' };
    if (from === to) return { success: false, error: 'New name is the same as the old name.' };
    if (category === 'Fictional') {
      return { success: false, error: 'Fictional sections are fixed and cannot be renamed.' };
    }
    if (isSectionlessCategory(category)) {
      return { success: false, error: `Category "${category}" does not use sub-sections.` };
    }
    const existing = getSections(category);
    if (!existing.includes(from)) return { success: false, error: `Sub-section "${from}" not found.` };
    if (existing.some(e => e.toLowerCase() === to.toLowerCase())) {
      return { success: false, error: `Sub-section "${to}" already exists.` };
    }
    const affected = flags.filter(f => f.category === category && f.continent === from);
    const customMap = new Map<string, Flag>(customFlags.map(f => [f.id, f]));
    affected.forEach(orig => {
      const updated: Flag = { ...orig, continent: to as Flag['continent'] };
      customMap.set(orig.id, updated);
      setDoc(doc(db, 'custom_flags', orig.id), cleanObject(updated)).catch(() => {});
    });
    const mergedCustom = Array.from(customMap.values());
    setCustomFlags(mergedCustom);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedCustom)); } catch {}

    const currentList = customSections[category] || [];
    const withoutOld = currentList.filter(v => v !== from);
    const next: Record<string, string[]> = { ...customSections };
    if (affected.length === 0 && currentList.includes(from)) {
      next[category] = [...withoutOld, to];
    } else if (withoutOld.length !== currentList.length) {
      next[category] = withoutOld;
    }
    if (next[category] !== customSections[category]) {
      saveCustomSections(next);
    }
    return { success: true, updatedCount: affected.length };
  };

  const deleteSection = (category: string, name: string, action: { mode: DeleteSectionMode; moveTo?: string }): { success: boolean; error?: string; affectedCount?: number } => {
    const target = normalizeName(name);
    if (!target) return { success: false, error: 'Sub-section name is required.' };
    if (category === 'Fictional') {
      return { success: false, error: 'Fictional sections are fixed and cannot be deleted.' };
    }
    if (isSectionlessCategory(category)) {
      return { success: false, error: `Category "${category}" does not use sub-sections.` };
    }
    const existing = getSections(category);
    if (!existing.includes(target)) return { success: false, error: `Sub-section "${target}" not found.` };
    const affected = flags.filter(f => f.category === category && f.continent === target);

    if (action.mode === 'move-flags') {
      const dest = normalizeName(action.moveTo || '');
      if (!dest) return { success: false, error: 'Choose a destination sub-section.' };
      if (dest === target) return { success: false, error: 'Destination must be different.' };
      if (!existing.includes(dest)) return { success: false, error: `Destination "${dest}" not found.` };
      const customMap = new Map<string, Flag>(customFlags.map(f => [f.id, f]));
      affected.forEach(orig => {
        const updated: Flag = { ...orig, continent: dest as Flag['continent'] };
        customMap.set(orig.id, updated);
        setDoc(doc(db, 'custom_flags', orig.id), cleanObject(updated)).catch(() => {});
      });
      const mergedCustom = Array.from(customMap.values());
      setCustomFlags(mergedCustom);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(mergedCustom)); } catch {}
    } else {
      if (affected.length > 0) {
        const affectedIds = new Set(affected.map(f => f.id));
        const remainingCustom = customFlags.filter(f => !affectedIds.has(f.id));
        setCustomFlags(remainingCustom);
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingCustom)); } catch {}
        affected.forEach(f => { deleteDoc(doc(db, 'custom_flags', f.id)).catch(() => {}); });
        const newItems: TrashItem[] = affected.map(flag => ({
          flag,
          deletedAt: Date.now(),
          isCustom: !effectiveBuiltInFlags.some(f => f.id === flag.id),
        }));
        const mergedTrash = [...newItems, ...trash.filter(t => !affectedIds.has(t.flag.id))];
        saveTrash(mergedTrash);
        newItems.forEach(item => {
          setDoc(doc(db, 'trash_flags', item.flag.id), cleanObject(item)).catch(() => {});
        });
      }
    }

    const currentList = customSections[category] || [];
    if (currentList.includes(target)) {
      const next = { ...customSections, [category]: currentList.filter(v => v !== target) };
      saveCustomSections(next);
    }
    return { success: true, affectedCount: affected.length };
  };

  const hasLocalChanges = customFlags.length > 0 || trash.length > 0 || permanentlyDeletedIds.length > 0 || (Object.values(customSubCategories) as string[][]).some(a => a.length > 0) || customCategories.length > 0 || (Object.values(customSections) as string[][]).some(a => a.length > 0);

  const clearLocalFlagsStorageOnly = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(TRASH_KEY);
      localStorage.removeItem(PERMANENT_DELETED_KEY);
      localStorage.removeItem(LEGACY_DELETED_KEY);
      localStorage.removeItem(SUBCATEGORIES_KEY);
      localStorage.removeItem(CUSTOM_CATEGORIES_KEY);
      localStorage.removeItem(CUSTOM_SECTIONS_KEY);
      setCustomFlags([]);
      setTrash([]);
      setPermanentlyDeletedIds([]);
      setCustomSubCategories({});
      setCustomCategories([]);
      setCustomSections({});
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
      permanentlyDeletedIds,
      customSubCategories,
      customCategories,
      customSections
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
      let importedSubs: Record<string, string[]> = {};
      let importedCats: string[] = [];
      let importedSections: Record<string, string[]> = {};

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

        if (data.customSubCategories && typeof data.customSubCategories === 'object') {
          Object.entries(data.customSubCategories).forEach(([k, v]) => {
            if (Array.isArray(v)) {
              importedSubs[k] = (v as unknown[]).filter(x => typeof x === 'string').map(s => (s as string).trim()).filter(Boolean);
            }
          });
        }

        if (Array.isArray(data.customCategories)) {
          importedCats = (data.customCategories as unknown[]).filter(x => typeof x === 'string').map(s => (s as string).trim()).filter(Boolean);
        }

        if (data.customSections && typeof data.customSections === 'object') {
          Object.entries(data.customSections).forEach(([k, v]) => {
            if (Array.isArray(v)) {
              importedSections[k] = (v as unknown[]).filter(x => typeof x === 'string').map(s => (s as string).trim()).filter(Boolean);
            }
          });
        }
      }

      if (importedFlags.length === 0 && importedTrash.length === 0 && importedPermIds.length === 0 && Object.keys(importedSubs).length === 0 && importedCats.length === 0 && Object.keys(importedSections).length === 0) {
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

      if (Object.keys(importedSubs).length > 0) {
        const mergedSubs: Record<string, string[]> = { ...customSubCategories };
        Object.entries(importedSubs).forEach(([cat, vals]) => {
          const set = new Set([...(mergedSubs[cat] || []), ...vals]);
          mergedSubs[cat] = Array.from(set);
        });
        saveSubCategories(mergedSubs);
      }

      if (importedCats.length > 0) {
        saveCustomCategories(Array.from(new Set([...customCategories, ...importedCats])));
      }

      if (Object.keys(importedSections).length > 0) {
        const mergedSecs: Record<string, string[]> = { ...customSections };
        Object.entries(importedSections).forEach(([cat, vals]) => {
          const set = new Set([...(mergedSecs[cat] || []), ...vals]);
          mergedSecs[cat] = Array.from(set);
        });
        saveCustomSections(mergedSecs);
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
        effectiveBuiltInFlags,
        trash,
        deletedFlagIds,
        permanentlyDeletedIds,
        customSubCategories,
        getSubCategories,
        getSubCategoryFlagCount,
        addSubCategory,
        renameSubCategory,
        deleteSubCategory,
        customCategories,
        getCategories,
        getCategoryFlagCount,
        addCategory,
        renameCategory,
        deleteCategory,
        customSections,
        getSections,
        getSectionFlagCount,
        addSection,
        renameSection,
        deleteSection,
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
