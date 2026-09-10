import { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Pencil,
  Trash2,
  Check,
  AlertTriangle,
  Search,
  MoveRight,
  Layers,
  FolderCog,
  LayoutGrid,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useFlags, CATEGORIES_WITH_SUBCATEGORIES } from '../contexts/FlagsContext';
import { ALL_CATEGORIES } from '../types';

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

const SECTION_LABELS: Record<string, string> = {
  'Sovereign States': 'Continent',
  'Non-Sovereign & Unrecognized': 'Continent',
  'US States': 'Continent',
  'Provinces & Territories': 'Continent',
  'Indigenous & Cultural Populations': 'Continent',
  'Organizations': 'Scope',
  'Languages': 'Continent',
  'Fictional': 'Section',
  'Concepts': 'Section',
};

function isBuiltInCategory(name: string): boolean {
  return (ALL_CATEGORIES as string[]).includes(name);
}

export function CategoryEditorPanel() {
  const {
    getCategories,
    getCategoryFlagCount,
    addCategory,
    renameCategory,
    deleteCategory,
    getSubCategories,
    getSubCategoryFlagCount,
    addSubCategory,
    renameSubCategory,
    deleteSubCategory,
    getSections,
    getSectionFlagCount,
    addSection,
    renameSection,
    deleteSection,
  } = useFlags();

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // ---- Categories state ----
  const [catSearch, setCatSearch] = useState('');
  const [newCat, setNewCat] = useState('');
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editCatValue, setEditCatValue] = useState('');
  const [deletingCat, setDeletingCat] = useState<string | null>(null);
  const [catDeleteMode, setCatDeleteMode] = useState<'move-flags' | 'delete-flags'>('move-flags');
  const [catMoveTo, setCatMoveTo] = useState('');

  // ---- Sub-categories state ----
  const [subParent, setSubParent] = useState<string>(CATEGORIES_WITH_SUBCATEGORIES[0] as string);
  const [subSearch, setSubSearch] = useState('');
  const [newSub, setNewSub] = useState('');
  const [editingSub, setEditingSub] = useState<string | null>(null);
  const [editSubValue, setEditSubValue] = useState('');
  const [deletingSub, setDeletingSub] = useState<string | null>(null);
  const [subDeleteMode, setSubDeleteMode] = useState<'move-flags' | 'delete-flags'>('move-flags');
  const [subMoveTo, setSubMoveTo] = useState('');

  // ---- Sub-sections state ----
  const categories = getCategories();
  const [secParent, setSecParent] = useState<string>('Provinces & Territories');
  const [secSearch, setSecSearch] = useState('');
  const [newSec, setNewSec] = useState('');
  const [editingSec, setEditingSec] = useState<string | null>(null);
  const [editSecValue, setEditSecValue] = useState('');
  const [deletingSec, setDeletingSec] = useState<string | null>(null);
  const [secDeleteMode, setSecDeleteMode] = useState<'move-flags' | 'delete-flags'>('move-flags');
  const [secMoveTo, setSecMoveTo] = useState('');

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setError('');
    window.setTimeout(() => setNotice(''), 4000);
  };
  const flashError = (msg: string) => {
    setError(msg);
    setNotice('');
  };

  // Categories list
  const liveCats = getCategories();
  const filteredCats = useMemo(() => {
    const q = catSearch.trim().toLowerCase();
    if (!q) return liveCats;
    return liveCats.filter(c => c.toLowerCase().includes(q));
  }, [liveCats, catSearch]);

  const handleAddCat = () => {
    const res = addCategory(newCat);
    if (!res.success) { flashError(res.error || 'Failed to add category.'); return; }
    setNewCat('');
    flashNotice(`Category "${newCat.trim()}" added.`);
  };

  const confirmRenameCat = () => {
    if (!editingCat) return;
    const res = renameCategory(editingCat, editCatValue);
    if (!res.success) { flashError(res.error || 'Failed to rename category.'); return; }
    const name = editCatValue.trim();
    setEditingCat(null);
    setEditCatValue('');
    flashNotice(`Category renamed to "${name}" — ${res.updatedCount ?? 0} flag${(res.updatedCount ?? 0) === 1 ? '' : 's'} updated.`);
  };

  const openDeleteCat = (name: string) => {
    const targets = liveCats.filter(c => c !== name);
    setDeletingCat(name);
    setCatDeleteMode(targets.length > 0 ? 'move-flags' : 'delete-flags');
    setCatMoveTo(targets[0] || '');
    setError('');
    setNotice('');
  };

  const confirmDeleteCat = () => {
    if (!deletingCat) return;
    const res = deleteCategory(deletingCat, { mode: catDeleteMode, moveTo: catDeleteMode === 'move-flags' ? catMoveTo : undefined });
    if (!res.success) { flashError(res.error || 'Failed to delete category.'); return; }
    const name = deletingCat;
    const dest = catMoveTo;
    const count = res.affectedCount ?? 0;
    setDeletingCat(null);
    setCatMoveTo('');
    flashNotice(
      catDeleteMode === 'move-flags'
        ? `Category "${name}" deleted — ${count} flag${count === 1 ? '' : 's'} moved to "${dest}".`
        : `Category "${name}" deleted — ${count} flag${count === 1 ? '' : 's'} moved to Trash.`
    );
  };

  // Sub-categories list
  const liveSubs = getSubCategories(subParent);
  const filteredSubs = useMemo(() => {
    const q = subSearch.trim().toLowerCase();
    if (!q) return liveSubs;
    return liveSubs.filter(s => s.toLowerCase().includes(q));
  }, [liveSubs, subSearch]);
  const subLabel = SUB_LABELS[subParent] || 'Sub-category';
  const subMoveTargets = deletingSub ? liveSubs.filter(s => s !== deletingSub) : liveSubs;

  const handleAddSub = () => {
    const res = addSubCategory(subParent, newSub);
    if (!res.success) { flashError(res.error || 'Failed to add.'); return; }
    setNewSub('');
    flashNotice(`"${newSub.trim()}" added to ${subParent}.`);
  };

  const confirmRenameSub = () => {
    if (!editingSub) return;
    const res = renameSubCategory(subParent, editingSub, editSubValue);
    if (!res.success) { flashError(res.error || 'Failed to rename.'); return; }
    const name = editSubValue.trim();
    const count = res.updatedCount ?? 0;
    setEditingSub(null);
    setEditSubValue('');
    flashNotice(count > 0 ? `Renamed to "${name}" — ${count} flag${count === 1 ? '' : 's'} updated.` : `Renamed to "${name}".`);
  };

  const openDeleteSub = (name: string) => {
    setDeletingSub(name);
    const targets = liveSubs.filter(s => s !== name);
    setSubDeleteMode(targets.length > 0 ? 'move-flags' : 'delete-flags');
    setSubMoveTo(targets[0] || '');
    setError('');
    setNotice('');
  };

  const confirmDeleteSub = () => {
    if (!deletingSub) return;
    const res = deleteSubCategory(subParent, deletingSub, { mode: subDeleteMode, moveTo: subDeleteMode === 'move-flags' ? subMoveTo : undefined });
    if (!res.success) { flashError(res.error || 'Failed to delete.'); return; }
    const name = deletingSub;
    const dest = subMoveTo;
    const count = res.affectedCount ?? 0;
    setDeletingSub(null);
    setSubMoveTo('');
    flashNotice(
      subDeleteMode === 'move-flags'
        ? `"${name}" deleted — ${count} flag${count === 1 ? '' : 's'} moved to "${dest}".`
        : `"${name}" deleted — ${count} flag${count === 1 ? '' : 's'} moved to Trash.`
    );
  };

  // Sub-sections list
  const secParentSafe = categories.includes(secParent) ? secParent : categories[0] || 'Provinces & Territories';
  const liveSecs = getSections(secParentSafe);
  const filteredSecs = useMemo(() => {
    const q = secSearch.trim().toLowerCase();
    if (!q) return liveSecs;
    return liveSecs.filter(s => s.toLowerCase().includes(q));
  }, [liveSecs, secSearch]);
  const secLabel = SECTION_LABELS[secParentSafe] || 'Sub-section';
  const isFictionalSecs = secParentSafe === 'Fictional';
  const isSectionless = liveSecs.length === 0;
  const secMoveTargets = deletingSec ? liveSecs.filter(s => s !== deletingSec) : liveSecs;

  const handleAddSec = () => {
    const res = addSection(secParentSafe, newSec);
    if (!res.success) { flashError(res.error || 'Failed to add.'); return; }
    setNewSec('');
    flashNotice(`"${newSec.trim()}" added to ${secParentSafe} ${secLabel.toLowerCase()}s.`);
  };

  const confirmRenameSec = () => {
    if (!editingSec) return;
    const res = renameSection(secParentSafe, editingSec, editSecValue);
    if (!res.success) { flashError(res.error || 'Failed to rename.'); return; }
    const name = editSecValue.trim();
    const count = res.updatedCount ?? 0;
    setEditingSec(null);
    setEditSecValue('');
    flashNotice(count > 0 ? `Renamed to "${name}" — ${count} flag${count === 1 ? '' : 's'} updated.` : `Renamed to "${name}".`);
  };

  const openDeleteSec = (name: string) => {
    setDeletingSec(name);
    const targets = liveSecs.filter(s => s !== name);
    setSecDeleteMode(targets.length > 0 ? 'move-flags' : 'delete-flags');
    setSecMoveTo(targets[0] || '');
    setError('');
    setNotice('');
  };

  const confirmDeleteSec = () => {
    if (!deletingSec) return;
    const res = deleteSection(secParentSafe, deletingSec, { mode: secDeleteMode, moveTo: secDeleteMode === 'move-flags' ? secMoveTo : undefined });
    if (!res.success) { flashError(res.error || 'Failed to delete.'); return; }
    const name = deletingSec;
    const dest = secMoveTo;
    const count = res.affectedCount ?? 0;
    setDeletingSec(null);
    setSecMoveTo('');
    flashNotice(
      secDeleteMode === 'move-flags'
        ? `"${name}" deleted — ${count} flag${count === 1 ? '' : 's'} moved to "${dest}".`
        : `"${name}" deleted — ${count} flag${count === 1 ? '' : 's'} moved to Trash.`
    );
  };

  const rowClass = 'flex items-center gap-2 p-2.5 rounded-2xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700';

  return (
    <div className="space-y-6">
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

      {/* ---- 1. Categories ---- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <LayoutGrid className="w-4 h-4 text-indigo-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Categories</h3>
          <span className="text-[11px] text-zinc-400">({liveCats.length})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={catSearch}
              onChange={e => setCatSearch(e.target.value)}
              placeholder="Search categories..."
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCat(); } }}
              placeholder="New category name"
              className="flex-1 min-w-0 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
            />
            <button
              type="button"
              onClick={handleAddCat}
              disabled={!newCat.trim()}
              className="px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
          {filteredCats.length === 0 && (
            <div className="text-center py-6 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500">No categories found.</div>
          )}
          {filteredCats.map(name => {
            const count = getCategoryFlagCount(name);
            const builtIn = isBuiltInCategory(name);
            const isEditing = editingCat === name;
            return (
              <div key={name} className={rowClass}>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editCatValue}
                      onChange={e => setEditCatValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); confirmRenameCat(); }
                        if (e.key === 'Escape') { setEditingCat(null); setEditCatValue(''); }
                      }}
                      autoFocus
                      className="flex-1 min-w-0 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                    />
                    <button type="button" onClick={confirmRenameCat} className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white" title="Save rename">
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => { setEditingCat(null); setEditCatValue(''); }} className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300" title="Cancel">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2" title={name}>
                        <span className="truncate">{name}</span>
                        {builtIn && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400 shrink-0">Built-in</span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{count} flag{count === 1 ? '' : 's'}{count === 0 && ' • empty'}</div>
                    </div>
                    {!builtIn && (
                      <>
                        <button type="button" onClick={() => { setEditingCat(name); setEditCatValue(name); setError(''); setNotice(''); }} className="p-2 rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-zinc-400" title={`Rename "${name}"`}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => openDeleteCat(name)} className="p-2 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-zinc-400" title={`Delete "${name}"`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-zinc-400 dark:text-zinc-500">Built-in categories cannot be renamed or deleted. To reorganize them, move their flags into another category via the delete flow on a custom category, or edit flags individually.</p>
      </section>

      <div className="border-t border-zinc-100 dark:border-zinc-800" />

      {/* ---- 2. Sub-categories ---- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <FolderCog className="w-4 h-4 text-violet-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sub-categories</h3>
          <span className="text-[11px] text-zinc-400">({filteredSubs.length} in {subParent})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={subParent}
            onChange={e => { setSubParent(e.target.value); setEditingSub(null); setDeletingSub(null); }}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
          >
            {liveCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={subSearch}
              onChange={e => setSubSearch(e.target.value)}
              placeholder={`Search ${subLabel.toLowerCase()}s...`}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newSub}
            onChange={e => setNewSub(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSub(); } }}
            placeholder={`New ${subLabel.toLowerCase()} name`}
            className="flex-1 min-w-0 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
          />
          <button
            type="button"
            onClick={handleAddSub}
            disabled={!newSub.trim()}
            className="px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
          {filteredSubs.length === 0 && (
            <div className="text-center py-6 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500">No sub-categories yet — add one above.</div>
          )}
          {filteredSubs.map(name => {
            const count = getSubCategoryFlagCount(subParent, name);
            const isEditing = editingSub === name;
            return (
              <div key={name} className={rowClass}>
                {isEditing ? (
                  <>
                    <input
                      type="text"
                      value={editSubValue}
                      onChange={e => setEditSubValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') { e.preventDefault(); confirmRenameSub(); }
                        if (e.key === 'Escape') { setEditingSub(null); setEditSubValue(''); }
                      }}
                      autoFocus
                      className="flex-1 min-w-0 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                    />
                    <button type="button" onClick={confirmRenameSub} className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white" title="Save rename">
                      <Check className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => { setEditingSub(null); setEditSubValue(''); }} className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300" title="Cancel">
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={name}>{name}</div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{count} flag{count === 1 ? '' : 's'}{count === 0 && ' • empty'}</div>
                    </div>
                    <button type="button" onClick={() => { setEditingSub(name); setEditSubValue(name); setError(''); setNotice(''); }} className="p-2 rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-zinc-400" title={`Rename "${name}"`}>
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button type="button" onClick={() => openDeleteSub(name)} className="p-2 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-zinc-400" title={`Delete "${name}"`}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="border-t border-zinc-100 dark:border-zinc-800" />

      {/* ---- 3. Sub-sections ---- */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-emerald-500" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Sub-sections</h3>
          <span className="text-[11px] text-zinc-400">({isSectionless ? 'N/A' : `${filteredSecs.length} in ${secParentSafe}`})</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <select
            value={secParentSafe}
            onChange={e => { setSecParent(e.target.value); setEditingSec(null); setDeletingSec(null); }}
            className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
          >
            {liveCats.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={secSearch}
              onChange={e => setSecSearch(e.target.value)}
              placeholder={isSectionless ? 'No sub-sections for this category' : `Search ${secLabel.toLowerCase()}s...`}
              disabled={isSectionless || isFictionalSecs}
              className="w-full pl-9 pr-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm disabled:opacity-40"
            />
          </div>
        </div>

        {isFictionalSecs ? (
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-500 dark:text-zinc-400">
            Fictional sections (<strong>Franchises / Universes</strong>, <strong>Media</strong>) are fixed groupings of universes and cannot be added, renamed, or deleted. Manage Fictional universes above under Sub-categories.
          </div>
        ) : isSectionless ? (
          <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 text-xs text-zinc-500 dark:text-zinc-400">
            Category "{secParentSafe}" does not use sub-sections.
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <input
                type="text"
                value={newSec}
                onChange={e => setNewSec(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddSec(); } }}
                placeholder={`New ${secLabel.toLowerCase()} name`}
                className="flex-1 min-w-0 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
              />
              <button
                type="button"
                onClick={handleAddSec}
                disabled={!newSec.trim()}
                className="px-3 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
              {filteredSecs.length === 0 && (
                <div className="text-center py-6 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500">No sub-sections found.</div>
              )}
              {filteredSecs.map(name => {
                const count = getSectionFlagCount(secParentSafe, name);
                const isEditing = editingSec === name;
                return (
                  <div key={name} className={rowClass}>
                    {isEditing ? (
                      <>
                        <input
                          type="text"
                          value={editSecValue}
                          onChange={e => setEditSecValue(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') { e.preventDefault(); confirmRenameSec(); }
                            if (e.key === 'Escape') { setEditingSec(null); setEditSecValue(''); }
                          }}
                          autoFocus
                          className="flex-1 min-w-0 px-3 py-1.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                        />
                        <button type="button" onClick={confirmRenameSec} className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white" title="Save rename">
                          <Check className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => { setEditingSec(null); setEditSecValue(''); }} className="p-2 rounded-xl bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300" title="Cancel">
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate" title={name}>{name}</div>
                          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">{count} flag{count === 1 ? '' : 's'}{count === 0 && ' • empty'}</div>
                        </div>
                        <button type="button" onClick={() => { setEditingSec(name); setEditSecValue(name); setError(''); setNotice(''); }} className="p-2 rounded-xl text-zinc-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 dark:text-zinc-400" title={`Rename "${name}"`}>
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" onClick={() => openDeleteSec(name)} className="p-2 rounded-xl text-zinc-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:text-zinc-400" title={`Delete "${name}"`}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* Delete confirmations */}
      {deletingCat && (
        <DeleteConfirm
          title={`Delete category "${deletingCat}"?`}
          body={`${getCategoryFlagCount(deletingCat)} flag${getCategoryFlagCount(deletingCat) === 1 ? '' : 's'} currently inside. Choose what happens to those flags.`}
          moveLabel="Move flags to another category"
          moveOptions={liveCats.filter(c => c !== deletingCat)}
          moveValue={catMoveTo}
          onMoveChange={setCatMoveTo}
          mode={catDeleteMode}
          onModeChange={setCatDeleteMode}
          deleteLabel="Delete the flags inside"
          deleteHint="Flags move to Trash (recoverable), then the category is removed."
          onCancel={() => setDeletingCat(null)}
          onConfirm={confirmDeleteCat}
          confirmMoveLabel="Move & Delete"
          getCount={getCategoryFlagCount}
        />
      )}
      {deletingSub && (
        <DeleteConfirm
          title={`Delete "${deletingSub}"?`}
          body={`${getSubCategoryFlagCount(subParent, deletingSub)} flag${getSubCategoryFlagCount(subParent, deletingSub) === 1 ? '' : 's'} currently inside this ${subLabel.toLowerCase()}. Choose what happens to those flags.`}
          moveLabel={`Move flags to another ${subLabel.toLowerCase()}`}
          moveOptions={subMoveTargets}
          moveValue={subMoveTo}
          onMoveChange={setSubMoveTo}
          mode={subDeleteMode}
          onModeChange={setSubDeleteMode}
          deleteLabel="Delete the flags inside"
          deleteHint="Flags move to Trash (recoverable), then the entry is removed."
          onCancel={() => setDeletingSub(null)}
          onConfirm={confirmDeleteSub}
          confirmMoveLabel="Move & Delete"
          getCount={(opt) => getSubCategoryFlagCount(subParent, opt)}
        />
      )}
      {deletingSec && (
        <DeleteConfirm
          title={`Delete "${deletingSec}"?`}
          body={`${getSectionFlagCount(secParentSafe, deletingSec)} flag${getSectionFlagCount(secParentSafe, deletingSec) === 1 ? '' : 's'} currently inside this ${secLabel.toLowerCase()}. Choose what happens to those flags.`}
          moveLabel={`Move flags to another ${secLabel.toLowerCase()}`}
          moveOptions={secMoveTargets}
          moveValue={secMoveTo}
          onMoveChange={setSecMoveTo}
          mode={secDeleteMode}
          onModeChange={setSecDeleteMode}
          deleteLabel="Delete the flags inside"
          deleteHint="Flags move to Trash (recoverable), then the entry is removed."
          onCancel={() => setDeletingSec(null)}
          onConfirm={confirmDeleteSec}
          confirmMoveLabel="Move & Delete"
          getCount={(opt) => getSectionFlagCount(secParentSafe, opt)}
        />
      )}
    </div>
  );
}

function DeleteConfirm({
  title,
  body,
  moveLabel,
  moveOptions,
  moveValue,
  onMoveChange,
  mode,
  onModeChange,
  deleteLabel,
  deleteHint,
  onCancel,
  onConfirm,
  confirmMoveLabel,
  getCount,
}: {
  title: string;
  body: string;
  moveLabel: string;
  moveOptions: string[];
  moveValue: string;
  onMoveChange: (v: string) => void;
  mode: 'move-flags' | 'delete-flags';
  onModeChange: (m: 'move-flags' | 'delete-flags') => void;
  deleteLabel: string;
  deleteHint: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmMoveLabel: string;
  getCount?: (opt: string) => number;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm" onClick={onCancel} />
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
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">{title}</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{body}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${mode === 'move-flags' ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
            <input
              type="radio"
              checked={mode === 'move-flags'}
              onChange={() => onModeChange('move-flags')}
              disabled={moveOptions.length === 0}
              className="mt-1 w-4 h-4 text-indigo-600"
            />
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <MoveRight className="w-4 h-4" /> {moveLabel}
              </span>
              {mode === 'move-flags' && moveOptions.length > 0 && (
                <select
                  value={moveValue}
                  onChange={e => onMoveChange(e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="mt-2 w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl text-sm text-zinc-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {moveOptions.map(t => (
                    <option key={t} value={t}>{t}{getCount ? ` (${getCount(t)})` : ''}</option>
                  ))}
                </select>
              )}
              {moveOptions.length === 0 && (
                <span className="block text-xs text-zinc-500 mt-0.5">No destinations available.</span>
              )}
            </span>
          </label>

          <label className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-colors ${mode === 'delete-flags' ? 'border-red-500 bg-red-50/60 dark:bg-red-950/40' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}>
            <input
              type="radio"
              checked={mode === 'delete-flags'}
              onChange={() => onModeChange('delete-flags')}
              className="mt-1 w-4 h-4 text-red-600"
            />
            <span>
              <span className="block text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Trash2 className="w-4 h-4" /> {deleteLabel}
              </span>
              <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{deleteHint}</span>
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={mode === 'move-flags' && !moveValue}
            className="px-4 py-2 rounded-xl text-sm font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white"
          >
            {mode === 'move-flags' ? confirmMoveLabel : 'Delete All'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
