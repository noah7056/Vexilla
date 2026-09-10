import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  AlertTriangle,
  FolderCog,
  Search,
  MoveRight,
} from 'lucide-react';
import { useFlags, CATEGORIES_WITH_SUBCATEGORIES } from '../contexts/FlagsContext';

interface SubCategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCategory?: string;
}

const SUB_LABELS: Record<string, string> = {
  'Provinces & Territories': 'Country',
  'Indigenous & Cultural Populations': 'Country / Region',
  'Fictional': 'Universe / Franchise',
  'LGBTQI+': 'Subcategory',
  'Languages': 'Language Group',
  'Pirate Flags': 'Group',
  'Organizations': 'Group',
  'Concepts': 'Subcategory',
};

export function SubCategoryManagerModal({ isOpen, onClose, initialCategory }: SubCategoryManagerModalProps) {
  const {
    getSubCategories,
    getSubCategoryFlagCount,
    addSubCategory,
    renameSubCategory,
    deleteSubCategory,
  } = useFlags();

  const [selectedCategory, setSelectedCategory] = useState<string>(
    initialCategory || CATEGORIES_WITH_SUBCATEGORIES[0]
  );
  const [search, setSearch] = useState('');
  const [newName, setNewName] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [deletingName, setDeletingName] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState<'delete-flags' | 'move-flags'>('move-flags');
  const [moveTo, setMoveTo] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setNewName('');
      setEditingName(null);
      setEditValue('');
      setDeletingName(null);
      setDeleteMode('move-flags');
      setMoveTo('');
      setError('');
      setNotice('');
      if (initialCategory) setSelectedCategory(initialCategory);
    }
  }, [isOpen, initialCategory]);

  useEffect(() => {
    // Reset per-category UI state when switching parent category
    setSearch('');
    setNewName('');
    setEditingName(null);
    setEditValue('');
    setDeletingName(null);
    setMoveTo('');
    setError('');
    setNotice('');
  }, [selectedCategory]);

  const subCategories = useMemo(
    () => getSubCategories(selectedCategory),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedCategory, getSubCategories]
  );

  // Re-resolve on every render so counts stay fresh after mutations.
  // getSubCategories is stable per render via flags/customSubs closure, so calling
  // it directly here keeps the list live without extra state.
  const liveSubs = getSubCategories(selectedCategory);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return liveSubs;
    return liveSubs.filter(s => s.toLowerCase().includes(q));
  }, [liveSubs, search]);

  // Keep for memo parity / external reference (avoids unused warning in some setups)
  void subCategories;

  const subLabel = SUB_LABELS[selectedCategory] || 'Sub-category';
  const deletingCount = deletingName ? getSubCategoryFlagCount(selectedCategory, deletingName) : 0;
  const moveTargets = deletingName ? liveSubs.filter(s => s !== deletingName) : liveSubs;

  useEffect(() => {
    if (deletingName) {
      setDeleteMode(moveTargets.length > 0 ? 'move-flags' : 'delete-flags');
      setMoveTo(moveTargets[0] || '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deletingName]);

  if (!isOpen) return null;

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setError('');
    window.setTimeout(() => setNotice(''), 3500);
  };

  const handleAdd = () => {
    const res = addSubCategory(selectedCategory, newName);
    if (!res.success) {
      setError(res.error || 'Failed to add.');
      return;
    }
    setNewName('');
    flashNotice(`"${newName.trim()}" added to ${selectedCategory}.`);
  };

  const startEdit = (name: string) => {
    setEditingName(name);
    setEditValue(name);
    setError('');
    setNotice('');
  };

  const confirmRename = () => {
    if (!editingName) return;
    const res = renameSubCategory(selectedCategory, editingName, editValue);
    if (!res.success) {
      setError(res.error || 'Failed to rename.');
      return;
    }
    const count = res.updatedCount ?? 0;
    setEditingName(null);
    setEditValue('');
    flashNotice(
      count > 0
        ? `Renamed to "${editValue.trim()}" — ${count} flag${count === 1 ? '' : 's'} updated.`
        : `Renamed to "${editValue.trim()}".`
    );
  };

  const confirmDelete = () => {
    if (!deletingName) return;
    if (deleteMode === 'move-flags' && !moveTo) {
      setError('Choose a destination sub-category to move flags to.');
      return;
    }
    const res = deleteSubCategory(selectedCategory, deletingName, {
      mode: deleteMode,
      moveTo: deleteMode === 'move-flags' ? moveTo : undefined,
    });
    if (!res.success) {
      setError(res.error || 'Failed to delete.');
      return;
    }
    const count = res.affectedCount ?? 0;
    const deleted = deletingName;
    setDeletingName(null);
    setMoveTo('');
    flashNotice(
      deleteMode === 'move-flags'
        ? `"${deleted}" deleted — ${count} flag${count === 1 ? '' : 's'} moved to "${moveTo}".`
        : `"${deleted}" deleted — ${count} flag${count === 1 ? '' : 's'} moved to Trash.`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/40 dark:bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
              <FolderCog className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                Manage Sub-categories
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Add, rename, or delete {subLabel.toLowerCase()}s inside any parent category.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
            aria-label="Close sub-category manager"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium flex items-start gap-2 border border-red-200 dark:border-red-800/50">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}
          {notice && !error && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-xl text-sm font-medium flex items-start gap-2 border border-emerald-200 dark:border-emerald-800/50">
              <Check className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>{notice}</p>
            </div>
          )}

          {/* Parent category picker + search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                Parent category
              </label>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
              >
                {CATEGORIES_WITH_SUBCATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-1.5">
                Search {subLabel.toLowerCase()}s
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={`Search ${liveSubs.length} ${subLabel.toLowerCase()}s...`}
                  className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                />
              </div>
            </div>
          </div>

          {/* Add new */}
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 mb-2">
              Add new {subLabel.toLowerCase()}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newName}
                onChange={e => { setNewName(e.target.value); setError(''); }}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                placeholder={`e.g. New ${subLabel.toLowerCase()} name`}
                className="flex-1 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={handleAdd}
                disabled={!newName.trim()}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add
              </button>
            </div>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1.5">
              New entries appear immediately as options in the flag editor and filters, even before any flag uses them.
            </p>
          </div>

          {/* List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                {filtered.length} {subLabel.toLowerCase()}{filtered.length === 1 ? '' : 's'} in {selectedCategory}
              </span>
            </div>
            {filtered.length === 0 ? (
              <div className="text-center py-8 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700">
                <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">No sub-categories found.</p>
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Add one above to get started.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map(name => {
                  const count = getSubCategoryFlagCount(selectedCategory, name);
                  const isEditing = editingName === name;
                  return (
                    <div
                      key={name}
                      className="flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                    >
                      {isEditing ? (
                        <>
                          <input
                            type="text"
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') { e.preventDefault(); confirmRename(); }
                              if (e.key === 'Escape') { setEditingName(null); setEditValue(''); }
                            }}
                            autoFocus
                            className="flex-1 min-w-0 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                          />
                          <button
                            type="button"
                            onClick={confirmRename}
                            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
                            title="Save rename"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setEditingName(null); setEditValue(''); }}
                            className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 transition-colors"
                            title="Cancel rename"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={name}>
                              {name}
                            </div>
                            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                              {count} flag{count === 1 ? '' : 's'}
                              {count === 0 && ' • empty'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => startEdit(name)}
                            className="p-2 rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-zinc-400 dark:hover:text-indigo-300 transition-colors"
                            title={`Rename "${name}"`}
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => { setDeletingName(name); setError(''); setNotice(''); }}
                            className="p-2 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-zinc-400 dark:hover:text-red-300 transition-colors"
                            title={`Delete "${name}"`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </motion.div>

      {/* Delete confirmation overlay */}
      {deletingName && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
            onClick={() => setDeletingName(null)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-700 p-5"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/40">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  Delete "{deletingName}"?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {deletingCount} flag{deletingCount === 1 ? '' : 's'} currently inside this {subLabel.toLowerCase()}.
                  This cannot be undone — choose what happens to {deletingCount === 0 ? 'the entry' : 'those flags'}.
                </p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                  deleteMode === 'move-flags'
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name="delete-sub-mode"
                  checked={deleteMode === 'move-flags'}
                  onChange={() => setDeleteMode('move-flags')}
                  disabled={moveTargets.length === 0}
                  className="mt-1 w-4 h-4 text-indigo-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <MoveRight className="w-4 h-4" />
                    Move flags to another {subLabel.toLowerCase()}
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    {moveTargets.length > 0
                      ? 'Flags stay in the app under the destination you pick.'
                      : 'No other destinations exist yet — add one first.'}
                  </span>
                  {deleteMode === 'move-flags' && moveTargets.length > 0 && (
                    <select
                      value={moveTo}
                      onChange={e => setMoveTo(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="mt-2 w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {moveTargets.map(t => (
                        <option key={t} value={t}>{t} ({getSubCategoryFlagCount(selectedCategory, t)})</option>
                      ))}
                    </select>
                  )}
                </span>
              </label>

              <label
                className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${
                  deleteMode === 'delete-flags'
                    ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40'
                    : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                }`}
              >
                <input
                  type="radio"
                  name="delete-sub-mode"
                  checked={deleteMode === 'delete-flags'}
                  onChange={() => setDeleteMode('delete-flags')}
                  className="mt-1 w-4 h-4 text-red-600"
                />
                <span>
                  <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <Trash2 className="w-4 h-4" />
                    Delete the flags inside
                  </span>
                  <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Flags move to Trash (recoverable), then the {subLabel.toLowerCase()} is removed.
                  </span>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingName(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleteMode === 'move-flags' && !moveTo}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white transition-colors"
              >
                {deleteMode === 'move-flags' ? 'Move & Delete' : 'Delete All'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
