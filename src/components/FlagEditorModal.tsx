import { useState, useMemo } from 'react';
import { X, Save, ShieldAlert, Trash2, RotateCcw, AlertTriangle, Heart, User, Link2, ExternalLink, Plus, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { Flag, Category, Continent, FlagStatus, ALL_CATEGORIES, ALL_CONTINENTS, ALL_STATUSES } from '../types';
import { useFlags } from '../contexts/FlagsContext';
import { FlagImage } from './FlagImage';
import { StatusBadge } from './StatusBadge';

const CATEGORY_SUB_LABELS: Partial<Record<Category, string>> = {
  'Provinces & Territories': 'Country',
  'Indigenous & Cultural Populations': 'Country / Region',
  'Fictional': 'Universe / Franchise',
  'LGBTQI+': 'Subcategory',
  'Languages': 'Language Group',
  'Pirate Flags': 'Group',
  'Organizations': 'Scope',
};

const ORG_SCOPES = ['Global', 'Africa', 'Asia', 'Europe', 'Americas', 'Oceania'];

const CATEGORIES_WITH_SUBS: Category[] = [
  'Provinces & Territories',
  'Indigenous & Cultural Populations',
  'Fictional',
  'LGBTQI+',
  'Languages',
  'Pirate Flags',
  'Organizations',
];

const CATEGORIES_WITH_CONTINENT: Category[] = [
  'Sovereign States',
  'Non-Sovereign & Unrecognized',
  'US States',
  'Provinces & Territories',
  'Indigenous & Cultural Populations',
  'Organizations',
];

const LAST_SELECTIONS_KEY = 'vexillo_last_added_flag_selections';

interface LastAddedSelections {
  category?: Category;
  continent?: Continent | '';
  country?: string;
  status?: FlagStatus | '';
  creator?: string;
  sourceUrl?: string;
}

function getLastAddedSelections(): LastAddedSelections | null {
  try {
    const raw = localStorage.getItem(LAST_SELECTIONS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveLastAddedSelections(selections: LastAddedSelections) {
  try {
    localStorage.setItem(LAST_SELECTIONS_KEY, JSON.stringify(selections));
  } catch {
    // Ignore storage errors
  }
}

interface FlagEditorModalProps {
  key?: string | number;
  flagToEdit?: Flag | null; // if provided, we edit. Else add.
  onClose: () => void;
}

export function FlagEditorModal({ flagToEdit, onClose }: FlagEditorModalProps) {
  const {
    flags: FLAGS,
    addCustomFlag,
    editCustomFlag,
    deleteFlag,
    resetFlagToDefault,
    isCustomFlag,
    isModifiedBuiltIn,
  } = useFlags();

  // Resolve freshest flag data from store if editing
  const liveFlag = useMemo(() => {
    if (!flagToEdit) return undefined;
    return FLAGS.find(f => f.id === flagToEdit.id) || flagToEdit;
  }, [FLAGS, flagToEdit]);

  const isEditing = Boolean(flagToEdit);
  const isCustom = flagToEdit ? isCustomFlag(flagToEdit.id) : true;
  const isModified = flagToEdit ? isModifiedBuiltIn(flagToEdit.id) : false;

  const [name, setName] = useState(liveFlag?.name || '');
  const [code, setCode] = useState(liveFlag?.code || '');
  
  const [category, setCategory] = useState<Category>(() => {
    if (liveFlag?.category) return liveFlag.category;
    const last = getLastAddedSelections();
    return last?.category || 'Sovereign States';
  });

  const [continent, setContinent] = useState<Continent | ''>(() => {
    if (liveFlag) return liveFlag.continent || '';
    const last = getLastAddedSelections();
    return last?.continent !== undefined ? last.continent : '';
  });

  const [country, setCountry] = useState(() => {
    if (liveFlag) return liveFlag.country || '';
    const last = getLastAddedSelections();
    return last?.country !== undefined ? last.country : '';
  });

  const [imageUrl, setImageUrl] = useState(liveFlag?.imageUrl || '');

  const [status, setStatus] = useState<FlagStatus | ''>(() => {
    if (liveFlag) return liveFlag.status || '';
    const last = getLastAddedSelections();
    return last?.status !== undefined ? last.status : '';
  });

  const [creator, setCreator] = useState(() => {
    if (liveFlag) return liveFlag.creator || '';
    const last = getLastAddedSelections();
    return last?.creator !== undefined ? last.creator : '';
  });

  const [sourceUrl, setSourceUrl] = useState(() => {
    if (liveFlag) return liveFlag.sourceUrl || '';
    const last = getLastAddedSelections();
    return last?.sourceUrl !== undefined ? last.sourceUrl : '';
  });
  
  const [aliases, setAliases] = useState<string[]>(liveFlag?.aliases || []);
  const [newAlias, setNewAlias] = useState('');
  
  const [tags, setTags] = useState<string[]>(liveFlag?.tags || []);
  const [newTag, setNewTag] = useState('');

  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [customValue, setCustomValue] = useState('');

  const handleCategoryChange = (newCat: Category) => {
    setCategory(newCat);
    setCountry('');
    setAddingCustom(false);
    setCustomValue('');
    if (!CATEGORIES_WITH_CONTINENT.includes(newCat)) {
      setContinent('');
    }
    if (newCat === 'Organizations' && !continent) {
      setContinent('Global');
    }
  };

  const confirmCustom = () => {
    const trimmed = customValue.trim();
    if (trimmed) {
      setCountry(trimmed);
      setAddingCustom(false);
      setCustomValue('');
    }
  };

  // Derive sub-options per category from existing flags
  const subOptions = useMemo(() => {
    if (category === 'Organizations') return ORG_SCOPES;
    const c = new Set<string>();
    FLAGS.forEach(f => {
      if (f.category === category && f.country) c.add(f.country);
    });
    return Array.from(c).sort();
  }, [category, FLAGS]);

  const hasSubOptions = CATEGORIES_WITH_SUBS.includes(category);
  const hasContinent = CATEGORIES_WITH_CONTINENT.includes(category);
  const subLabel = CATEGORY_SUB_LABELS[category] || 'Country Association';

  const handleSave = () => {
    setError('');
    const trimmedName = name.trim();
    const trimmedCode = code.trim().toLowerCase();
    
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }
    if (!trimmedCode) {
      setError('Code is required.');
      return;
    }

    // Check code collision against OTHER flags
    const isDuplicateCode = FLAGS.some(
      f => f.id !== flagToEdit?.id && f.code.toLowerCase() === trimmedCode
    );
    if (isDuplicateCode) {
      setError(`A flag with code "${trimmedCode}" already exists. Codes must be unique.`);
      return;
    }

    const newFlag: Flag = {
      id: flagToEdit ? flagToEdit.id : `custom-${trimmedCode}-${Date.now()}`,
      name: trimmedName,
      code: trimmedCode,
      category,
      continent: continent || undefined,
      country: country.trim() || undefined,
      imageUrl: imageUrl.trim() || undefined,
      aliases: aliases.length > 0 ? aliases : undefined,
      tags: tags.length > 0 ? tags : undefined,
      status: status || undefined,
      creator: creator.trim() || undefined,
      sourceUrl: sourceUrl.trim() || undefined,
    };

    if (flagToEdit) {
      editCustomFlag(newFlag);
    } else {
      addCustomFlag(newFlag);
      saveLastAddedSelections({
        category,
        continent,
        country: country.trim(),
        status,
        creator: creator.trim() || undefined,
        sourceUrl: sourceUrl.trim() || undefined,
      });
    }
    onClose();
  };

  const handleDelete = () => {
    if (!flagToEdit) return;
    deleteFlag(flagToEdit.id);
    onClose();
  };

  const handleResetToDefault = () => {
    if (!flagToEdit) return;
    resetFlagToDefault(flagToEdit.id);
    onClose();
  };

  const previewFlag: Flag = {
    id: flagToEdit ? flagToEdit.id : 'preview',
    name: name || 'Preview',
    code: code.trim() || 'un',
    category,
    continent: continent || undefined,
    country: country.trim() || undefined,
    imageUrl: imageUrl.trim() || undefined,
    status: status || undefined,
    creator: creator.trim() || undefined,
    sourceUrl: sourceUrl.trim() || undefined,
    tags: tags.length > 0 ? tags : undefined
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 sm:py-8 overflow-y-auto">
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
        className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col max-h-full overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              {isEditing ? 'Edit Flag' : 'Add Custom Flag'}
            </h2>
            {isEditing && (
              <>
                {isModified ? (
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                    Modified Built-in
                  </span>
                ) : isCustom ? (
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                    Custom Flag
                  </span>
                ) : (
                  <span className="text-xs px-2 py-0.5 rounded-md font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
                    Built-in Flag
                  </span>
                )}
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col md:flex-row gap-6">
          {/* Form Side */}
          <div className="flex-1 space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-xl text-sm font-medium flex items-start gap-2 border border-red-200 dark:border-red-800/50">
                <ShieldAlert className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                  placeholder="e.g. United Nations"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                    placeholder="e.g. un (must be unique)"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                      Image URL
                    </label>
                    {imageUrl.trim() && (
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        Clear URL
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                    placeholder="https://... or auto-code fallback"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={e => handleCategoryChange(e.target.value as Category)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                  >
                    {ALL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Continent
                  </label>
                  <select
                    value={continent}
                    onChange={e => setContinent(e.target.value as Continent | '')}
                    disabled={!hasContinent}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <option value="">(None)</option>
                    {category === 'Organizations' && <option value="Global">Global</option>}
                    {ALL_CONTINENTS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    {subLabel}
                  </label>
                  {hasSubOptions ? (
                    addingCustom ? (
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={customValue}
                          onChange={e => setCustomValue(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); confirmCustom(); } if (e.key === 'Escape') { setAddingCustom(false); setCustomValue(''); } }}
                          autoFocus
                          className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                          placeholder={`New ${subLabel.toLowerCase()} name`}
                        />
                        <button
                          type="button"
                          onClick={confirmCustom}
                          className="px-2 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors flex items-center justify-center"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAddingCustom(false); setCustomValue(''); }}
                          className="px-2 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded-xl transition-colors flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1.5">
                        <select
                          value={country}
                          onChange={e => setCountry(e.target.value)}
                          className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                        >
                          <option value="">(None)</option>
                          {subOptions.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                          ))}
                          {country && !subOptions.includes(country) && (
                            <option value={country}>{country}</option>
                          )}
                        </select>
                        <button
                          type="button"
                          title={`Add new ${subLabel.toLowerCase()}`}
                          onClick={() => setAddingCustom(true)}
                          className="px-2 py-2 bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-zinc-600 dark:text-zinc-300 rounded-xl transition-colors flex items-center justify-center flex-shrink-0"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  ) : (
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      disabled
                      className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm opacity-40 cursor-not-allowed"
                      placeholder="N/A for this category"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as FlagStatus | '')}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                  >
                    <option value="">(None)</option>
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s === 'fan-made' ? 'Fan-Made' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Creator / Designer
                  </label>
                  <input
                    type="text"
                    value={creator}
                    onChange={e => setCreator(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                    placeholder="e.g. @vexillo_artist or John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Link / Source URL
                  </label>
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={e => setSourceUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-zinc-900 dark:text-white text-sm"
                    placeholder="e.g. https://... or wiki page"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Tags (Features, colors, symbols)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg text-xs font-medium bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/50">
                      #{tag}
                      <button type="button" onClick={() => setTags(tags.filter((_, i) => i !== idx))} className="p-0.5 rounded-full hover:bg-violet-200 dark:hover:bg-violet-800">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
                          setTags([...tags, newTag.trim().toLowerCase()]);
                          setNewTag('');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-900 dark:text-white"
                    placeholder="Add tag and press Enter"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newTag.trim() && !tags.includes(newTag.trim().toLowerCase())) {
                        setTags([...tags, newTag.trim().toLowerCase()]);
                        setNewTag('');
                      }
                    }}
                    className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg font-medium text-sm hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <label className="block text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                  Aliases (Alternative names)
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {aliases.map((alias, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                      {alias}
                      <button type="button" onClick={() => setAliases(aliases.filter((_, i) => i !== idx))} className="p-0.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAlias}
                    onChange={e => setNewAlias(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newAlias.trim() && !aliases.includes(newAlias.trim())) {
                          setAliases([...aliases, newAlias.trim()]);
                          setNewAlias('');
                        }
                      }
                    }}
                    className="flex-1 px-3 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none text-zinc-900 dark:text-white"
                    placeholder="Add alias and press Enter"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newAlias.trim() && !aliases.includes(newAlias.trim())) {
                        setAliases([...aliases, newAlias.trim()]);
                        setNewAlias('');
                      }
                    }}
                    className="px-3 py-1.5 bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded-lg font-medium text-sm hover:bg-zinc-300 dark:hover:bg-zinc-600 transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Preview Side */}
          <div className="md:w-64 flex-shrink-0 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider">Preview</h3>
            <div className="bg-zinc-100 dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700/50 flex flex-col items-center text-center">
              <div className="w-48 h-32 mb-4 shadow-sm relative rounded-lg overflow-hidden flex items-center justify-center bg-zinc-200 dark:bg-zinc-700">
                <FlagImage
                  key={`${previewFlag.id}-${previewFlag.imageUrl || ''}-${previewFlag.code}`}
                  flag={previewFlag}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              </div>
              <h4 className="font-bold text-zinc-900 dark:text-zinc-50 leading-tight text-sm sm:text-base">
                {previewFlag.name}
              </h4>
              <p className="text-xs text-zinc-500 mt-1">
                {previewFlag.category} {previewFlag.country ? `· ${previewFlag.country}` : ''}
              </p>

              {(previewFlag.status || creator.trim()) && (
                <div className="mt-2.5 inline-flex flex-wrap items-center justify-center gap-1.5">
                  {previewFlag.status && <StatusBadge status={previewFlag.status} size="sm" />}
                  {creator.trim() && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      by {creator.trim()}
                    </span>
                  )}
                </div>
              )}
              
              {previewFlag.tags && (
                <div className="flex flex-wrap items-center justify-center gap-1 mt-3">
                  {previewFlag.tags.slice(0, 3).map((t, idx) => (
                    <span key={idx} className="text-[10px] px-1.5 py-0.5 rounded-md bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300">
                      #{t}
                    </span>
                  ))}
                  {previewFlag.tags.length > 3 && (
                    <span className="text-[10px] text-zinc-400">+{previewFlag.tags.length - 3}</span>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed mt-2">
              If an Image URL is not provided, the system loads the flag image automatically using its code (e.g. ISO codes, Wikimedia filenames, or flagcdn).
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {isEditing && (
              <>
                {/* Reset to Default (Available for modified built-in flags) */}
                {isModified && (
                  <>
                    {confirmReset ? (
                      <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/60 p-1 rounded-xl border border-amber-300 dark:border-amber-700">
                        <span className="text-xs font-semibold text-amber-800 dark:text-amber-200 px-2 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Revert to built-in?
                        </span>
                        <button
                          type="button"
                          onClick={handleResetToDefault}
                          className="px-2.5 py-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmReset(false)}
                          className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmReset(true)}
                        className="px-3.5 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-1.5"
                        title="Revert modifications and restore original flag specifications"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Reset to Default</span>
                      </button>
                    )}
                  </>
                )}

                {/* Delete Button (ALWAYS stably present when editing any flag) */}
                {confirmDelete ? (
                  <div className="flex items-center gap-1.5 bg-red-50 dark:bg-red-950/60 p-1 rounded-xl border border-red-300 dark:border-red-700">
                    <span className="text-xs font-semibold text-red-800 dark:text-red-200 px-2 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      Delete flag?
                    </span>
                    <button
                      type="button"
                      onClick={handleDelete}
                      className="px-2.5 py-1 text-xs font-bold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="px-2 py-1 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 border border-red-200 dark:border-red-800/40 transition-colors flex items-center gap-1.5"
                    title={isCustom ? "Delete this custom flag" : "Delete and hide this flag from the app"}
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Flag</span>
                  </button>
                )}
              </>
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isEditing ? 'Save Changes' : 'Add Flag'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
