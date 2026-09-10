import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Filter,
  Globe2,
  Layers,
  ArrowUpDown,
  X,
  XCircle,
  Maximize2,
  MapPin,
  Star,
  ArrowLeftRight,
  Plus,
  ShieldCheck,
  Settings,
  Check,
  RotateCcw,
  Trash2,
  FileJson,
  Cloud
} from 'lucide-react';
import { PROVINCE_COUNTRIES  } from '../data/flags';
import { useFlags } from '../contexts/FlagsContext';
import { useAdmin } from '../contexts/AdminContext';
import { FICTIONAL_MEDIA_TYPES } from '../data/fictional';
import {
  Flag,
  Category,
  Continent,
  FlagProgress,
  FlagStatus,
  MasteryFilter,
  MasteryLevel,
  ALL_STATUSES,
  getFlagMasteryLevel
} from '../types';
import { FlagImage } from './FlagImage';
import { FlagModal } from './FlagModal';
import { FlagCompareModal } from './FlagCompareModal';
import { FlagEditorModal } from './FlagEditorModal';
import { TrashBinModal } from './TrashBinModal';
import { CategoryFilterChips } from './CategoryFilterChips';
import { AdditionalFiltersBar } from './AdditionalFiltersBar';
import { SyncLocalFlagsBanner } from './SyncLocalFlagsBanner';
import { ImportExportModal } from './ImportExportModal';
import { useFavorites } from '../hooks/useFavorites';

interface FlagDictionaryProps {
  progress: Record<string, FlagProgress>;
}

const ALL_CATEGORIES: Category[] = [
  'Sovereign States',
  'Non-Sovereign & Unrecognized',
  'US States',
  'Provinces & Territories',
  'Fictional',
  'Indigenous & Cultural Populations',
  'LGBTQI+',
  'Languages',
  'Pirate Flags',
  'Organizations'
];

const ALL_CONTINENTS: Continent[] = [
  'Africa',
  'Asia',
  'Europe',
  'North America',
  'South America',
  'Oceania',
  'Antarctica'
];

type SortOption = 'name-asc' | 'name-desc' | 'continent' | 'category';
type ItemsPerPage = 12 | 25 | 50 | 100 | 'All';

export function FlagDictionary({ progress }: FlagDictionaryProps) {
  const { flags: FLAGS, trash, isFirestoreConnected, getCategories } = useFlags();
  const dynamicCatCount = useMemo(() => {
    try {
      return getCategories().length;
    } catch {
      return ALL_CATEGORIES.length;
    }
  }, [getCategories, FLAGS]);
  const { isAdmin } = useAdmin();
  const { favoritesSet, toggleFavorite } = useFavorites();
  const [search, setSearch] = useState('');
  const [searchTags, setSearchTags] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['All']);
  const [selectedContinents, setSelectedContinents] = useState<string[]>(['All']);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>(['All']);
  const [selectedSubOptions, setSelectedSubOptions] = useState<Record<string, string[]>>({});
  const [selectedMastery, setSelectedMastery] = useState<(MasteryLevel | 'all')[]>(['all']);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [submenuSearch, setSubmenuSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [focusedFlag, setFocusedFlag] = useState<Flag | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [flagToEdit, setFlagToEdit] = useState<Flag | null>(null);
  const [editorInitialTab, setEditorInitialTab] = useState<'flag' | 'categories'>('flag');
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  
  const [itemsPerPage, setItemsPerPage] = useState<ItemsPerPage>(12);
  const [displayedCount, setDisplayedCount] = useState<number>(12);

  const addSearchTag = (tagToAdd?: string) => {
    const val = (tagToAdd !== undefined ? tagToAdd : search).trim();
    if (val && !searchTags.includes(val)) {
      setSearchTags((prev) => [...prev, val]);
      setSearch('');
    }
  };

  const removeSearchTag = (tagToRemove: string) => {
    setSearchTags((prev) => prev.filter((t) => t !== tagToRemove));
  };

  const clearSearchTags = () => {
    setSearchTags([]);
  };

  // Reset displayedCount when filters or itemsPerPage changes
  useEffect(() => {
    setDisplayedCount(itemsPerPage === 'All' ? FLAGS.length : itemsPerPage);
  }, [search, searchTags, selectedCategories, selectedContinents, selectedStatuses, selectedSubOptions, selectedMastery, sortBy, showFavoritesOnly, itemsPerPage]);

  // Flag Comparison State
  const [compareFlags, setCompareFlags] = useState<Flag[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  const toggleCompareFlag = (flag: Flag) => {
    setCompareFlags((prev) => {
      const existsIndex = prev.findIndex((f) => f.id === flag.id);
      if (existsIndex >= 0) {
        return prev.filter((f) => f.id !== flag.id);
      }
      if (prev.length >= 2) {
        // Replace second flag if already 2
        return [prev[0], flag];
      }
      return [...prev, flag];
    });
  };

  const handleStartCompareFromModal = (flag: Flag) => {
    setFocusedFlag(null);
    setCompareMode(true);
    setCompareFlags((prev) => {
      const exists = prev.some((f) => f.id === flag.id);
      if (exists) return prev;
      if (prev.length === 0) return [flag];
      return [prev[0], flag];
    });
  };

  // Toggle Category
  const toggleCategory = (cat: Category | 'All') => {
    if (cat === 'All') {
      setSelectedCategories(['All']);
      setSelectedSubOptions({});
      return;
    }
    setSelectedCategories((prev) => {
      if (prev.includes('All')) return [cat];
      const exists = prev.includes(cat);
      if (exists) {
        const next = prev.filter((c) => c !== cat);
        setSelectedSubOptions(prevSub => {
          const newSub = { ...prevSub };
          delete newSub[cat];
          return newSub;
        });
        return next.length === 0 ? ['All'] : next;
      } else {
        const next = [...prev, cat];
        if (next.length === dynamicCatCount) {
          setSelectedSubOptions({});
          return ['All'];
        }
        return next;
      }
    });
  };

  // Toggle Sub-Option
  const toggleSubOption = (category: string, option: string) => {
    setSelectedSubOptions((prev) => {
      const currentList = prev[category] || [];
      const updatedList = currentList.includes(option)
        ? currentList.filter((o) => o !== option)
        : [...currentList, option];
      return { ...prev, [category]: updatedList };
    });
    setSelectedCategories((prev) => {
      if (prev.includes('All')) {
        return [category as Category];
      }
      if (!prev.includes(category as Category)) {
        return [...prev, category as Category];
      }
      return prev;
    });
  };

  const handleClearSubOptions = (cat: string) => {
    setSelectedSubOptions((prev) => {
      const newSub = { ...prev };
      delete newSub[cat];
      return newSub;
    });
  };

  const toggleMastery = (level: MasteryLevel) => {
    setSelectedMastery((prev) => {
      if (prev.includes('all') || prev.length === 0) {
        return [level];
      }
      const exists = prev.includes(level);
      if (exists) {
        const next = prev.filter((m) => m !== level);
        return next.length === 0 ? ['all'] : next;
      } else {
        const next = [...prev, level];
        return next.length === 4 ? ['all'] : next;
      }
    });
  };

  const selectAllMastery = () => {
    setSelectedMastery(['all']);
  };

  const clearAllSubmenuFilters = () => {
    setSelectedSubOptions({});
    setSelectedContinents(['All']);
    setSelectedStatuses(['All']);
    setSearchTags([]);
    setSelectedMastery(['all']);
  };

  // Toggle Continent
  const toggleContinent = (cont: Continent) => {
    setSelectedContinents((prev) => {
      if (prev.includes('All')) {
        return [cont];
      }
      const exists = prev.includes(cont);
      if (exists) {
        const next = prev.filter((c) => c !== cont);
        return next.length === 0 ? ['All'] : next;
      } else {
        const next = [...prev, cont];
        if (next.length === ALL_CONTINENTS.length) {
          return ['All'];
        }
        return next;
      }
    });
  };

  // Toggle Status
  const toggleStatus = (st: FlagStatus | 'unspecified') => {
    setSelectedStatuses((prev) => {
      if (prev.includes('All')) {
        return [st];
      }
      const exists = prev.includes(st);
      if (exists) {
        const next = prev.filter((s) => s !== st);
        return next.length === 0 ? ['All'] : next;
      } else {
        const next = [...prev, st];
        if (next.length === ALL_STATUSES.length + 1) {
          return ['All'];
        }
        return next;
      }
    });
  };

  const selectAllCategories = () => {
    setSelectedCategories(['All']);
    setSelectedSubOptions({});
  };
  const selectAllContinents = () => setSelectedContinents(['All']);
  const selectAllStatuses = () => setSelectedStatuses(['All']);

  const clearAllFilters = () => {
    setSearch('');
    setSearchTags([]);
    setSelectedCategories(['All']);
    setSelectedContinents(['All']);
    setSelectedStatuses(['All']);
    setSelectedSubOptions({});
    setSelectedMastery(['all']);
    setSortBy('name-asc');
    setShowFavoritesOnly(false);
  };

  const isMasteryCustom = !selectedMastery.includes('all') && selectedMastery.length > 0 && selectedMastery.length < 4;

  const hasCustomFilters =
    search.trim() !== '' ||
    searchTags.length > 0 ||
    !selectedCategories.includes('All') ||
    !selectedContinents.includes('All') ||
    !selectedStatuses.includes('All') ||
    isMasteryCustom ||
    Object.values(selectedSubOptions as Record<string, string[]>).some(arr => arr.length > 0) ||
    showFavoritesOnly;

  // Base pool of flags restricted by Category & Sub-options
  const categoryFlagsPool = useMemo(() => {
    return FLAGS.filter((flag) => {
      const matchesCat = selectedCategories.includes('All') || selectedCategories.includes(flag.category);
      if (!matchesCat) return false;

      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Languages', 'Organizations', 'Concepts'].includes(flag.category)) {
        const activeSubOptions = selectedSubOptions[flag.category] || [];
        if (activeSubOptions.length > 0) {
          if (!flag.country || !activeSubOptions.includes(flag.country)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [selectedCategories, selectedSubOptions, FLAGS]);

  // Filter and Sort Flags
  const filteredFlags = useMemo(() => {
    const liveQuery = search.trim().toLowerCase();
    const activeTerms = [
      ...searchTags.filter(Boolean).map((t) => t.toLowerCase()),
      ...(liveQuery ? [liveQuery] : [])
    ];

    const activeMasteryList = selectedMastery.filter((m): m is MasteryLevel => m !== 'all');
    const isMasteryActive = activeMasteryList.length > 0 && activeMasteryList.length < 4;

    const filtered = FLAGS.filter((flag) => {
      if (showFavoritesOnly && !favoritesSet.has(flag.id)) {
        return false;
      }

      const matchesSearch =
        activeTerms.length === 0 ||
        activeTerms.every((q) => {
          return (
            (flag.name && flag.name.toLowerCase().includes(q)) ||
            (flag.code && flag.code.toLowerCase().includes(q)) ||
            (flag.continent && flag.continent.toLowerCase().includes(q)) ||
            (flag.category && flag.category.toLowerCase().includes(q)) ||
            (flag.status && flag.status.toLowerCase().includes(q)) ||
            (flag.country && flag.country.toLowerCase().includes(q)) ||
            (flag.creator && flag.creator.toLowerCase().includes(q)) ||
            (flag.aliases && flag.aliases.some((alias) => alias && alias.toLowerCase().includes(q))) ||
            (flag.tags && flag.tags.some((tag) => tag && tag.toLowerCase().includes(q)))
          );
        });

      const matchesCat = selectedCategories.includes('All') || selectedCategories.includes(flag.category);
      const isGlobalCat = flag.category === 'Fictional' || flag.category === 'LGBTQI+' || flag.category === 'Languages' || flag.category === 'Pirate Flags' || flag.category === 'Organizations' || flag.category === 'Concepts';
      const matchesCont = selectedContinents.includes('All') || isGlobalCat || (flag.continent ? selectedContinents.includes(flag.continent) : false);

      // Status Filter
      const matchesStatus =
        selectedStatuses.includes('All') ||
        selectedStatuses.length === 0 ||
        (Boolean(flag.status) && selectedStatuses.includes(flag.status as string)) ||
        (!flag.status && selectedStatuses.includes('unspecified'));

      // Sub-options filtering for specific categories
      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Languages', 'Organizations', 'Concepts'].includes(flag.category)) {
        const activeSubOptions = selectedSubOptions[flag.category] || [];
        if (activeSubOptions.length > 0) {
          if (!flag.country || !activeSubOptions.includes(flag.country)) {
            return false;
          }
        }
      }

      // Mastery filter
      if (isMasteryActive) {
        const flagLevel = getFlagMasteryLevel(flag.id, progress);
        if (!activeMasteryList.includes(flagLevel)) {
          return false;
        }
      }

      return matchesSearch && matchesCat && matchesCont && matchesStatus;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-desc':
          return b.name.localeCompare(a.name);
        case 'continent':
          return (a.continent || '').localeCompare(b.continent || '') || a.name.localeCompare(b.name);
        case 'category':
          return a.category.localeCompare(b.category) || a.name.localeCompare(b.name);
        case 'name-asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [search, searchTags, selectedCategories, selectedContinents, selectedStatuses, selectedSubOptions, selectedMastery, sortBy, showFavoritesOnly, favoritesSet, progress, FLAGS]);

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4">
      {/* Header */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Globe2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Flag Dictionary
          </h2>
        </div>

        {/* Counter Badge & Compare Toggle */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Trash Bin Icon Button */}
          {isAdmin && (
          <button
            id="open-trash-bin-btn"
            onClick={() => setIsTrashOpen(true)}
            className={`relative p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-xs ${
              trash.length > 0
                ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
            title={
              trash.length > 0
                ? `Trash (${trash.length} deleted ${trash.length === 1 ? 'flag' : 'flags'})`
                : 'Trash'
            }
            aria-label="Trash"
          >
            <Trash2 className="w-4 h-4" />
            {trash.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[17px] h-[17px] px-1 rounded-full text-[10px] font-bold bg-indigo-600 text-white flex items-center justify-center border-2 border-zinc-50 dark:border-zinc-900 shadow-xs">
                {trash.length}
              </span>
            )}
          </button>
          )}

          {/* Cloud Database Sync Status */}
          {isAdmin && isFirestoreConnected && (
            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60 shadow-2xs"
              title="Connected to Google Firebase Firestore Cloud Database. All changes are saved automatically."
            >
              <Cloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span className="hidden md:inline">Cloud Sync Active</span>
            </div>
          )}

          {isAdmin && (
          <button
            onClick={() => { setFlagToEdit(null); setEditorInitialTab('flag'); setIsEditorOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/50"
            title="Add flags and manage categories, sub-categories, and sub-sections"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add / Manage</span>
          </button>
          )}
          {isAdmin && (
          <button
            onClick={() => setIsImportExportOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700"
            title="Export, backup, or import custom flags"
          >
            <FileJson className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Backup / Import</span>
          </button>
          )}
          <button
            id="toggle-compare-mode-btn"
            onClick={() => {
              setCompareMode(!compareMode);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              compareMode || compareFlags.length > 0
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>Compare Flags</span>
            {compareFlags.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white/20 text-[10px] font-bold">
                {compareFlags.length}/2
              </span>
            )}
          </button>

          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/80">
            Showing <strong className="font-bold">{filteredFlags.length}</strong> of{' '}
            <strong>{FLAGS.length}</strong> flags
          </span>
        </div>
      </div>

      {/* Sync Local Flags Banner (visible only when local changes exist in browser storage) */}
      {isAdmin && <SyncLocalFlagsBanner />}

      {/* Filter & Search Toolbar */}
      <div className="bg-white dark:bg-zinc-800 p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4 mb-6">
        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              id="flag-dictionary-search"
              type="text"
              placeholder={searchTags.length > 0 ? "Add descriptor or term (e.g. green, bird, star)..." : "Search by name, code, alias, or tag (e.g. green, bird, star)..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSearchTag();
                }
              }}
              className="w-full pl-10 pr-20 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-400"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  title="Clear text input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              {search.trim() && (
                <button
                  type="button"
                  onClick={() => addSearchTag()}
                  className="px-2 py-0.5 text-[11px] font-semibold rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                  title="Add as stacked filter tag"
                >
                  + Add
                </button>
              )}
            </div>
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 min-w-[190px]">
            <ArrowUpDown className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <select
              id="flag-dictionary-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="name-asc">Name (A → Z)</option>
              <option value="name-desc">Name (Z → A)</option>
              <option value="continent">Group by Continent</option>
              <option value="category">Group by Category</option>
            </select>
          </div>

          {/* Items Per Page Selector */}
          <div className="flex items-center gap-2 min-w-[130px]">
            <Layers className="w-4 h-4 text-zinc-400 dark:text-zinc-500 flex-shrink-0" />
            <select
              id="flag-dictionary-items-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                const val = e.target.value;
                setItemsPerPage(val === 'All' ? 'All' : Number(val) as ItemsPerPage);
              }}
              className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
            >
              <option value="12">12 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="All">All flags</option>
            </select>
          </div>

          {/* Favorites Filter */}
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all flex-shrink-0 ${
              showFavoritesOnly
                ? 'bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700/50 dark:text-amber-400'
                : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800'
            }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favorites
          </button>

          {/* Clear All Filters Button */}
          {hasCustomFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300 text-xs font-semibold transition-colors flex-shrink-0 cursor-pointer"
              title="Clear all active filters and search terms"
            >
              <XCircle className="w-4 h-4 text-rose-500 dark:text-rose-400" />
              Clear All
            </button>
          )}
        </div>

        

        {/* Category Filter Chips */}
        <CategoryFilterChips
          selectedCategories={selectedCategories as any}
          onToggleCategory={toggleCategory}
          onSelectAllCategories={selectAllCategories}
          selectedSubOptions={selectedSubOptions}
          onToggleSubOption={toggleSubOption}
          onClearSubOptions={handleClearSubOptions}
          flagsPool={FLAGS}
          title="Categories"
          showAllOption={true}
        />

        {/* Additional Filters Bar with Mastery, Continents, Status, Tags, and Selected Filters Summary */}
        <AdditionalFiltersBar
          flagsPool={categoryFlagsPool}
          selectedContinents={selectedContinents as any}
          onToggleContinent={toggleContinent}
          onSelectAllContinents={selectAllContinents}
          selectedStatuses={selectedStatuses as any}
          onToggleStatus={toggleStatus}
          onSelectAllStatuses={selectAllStatuses}
          selectedTags={searchTags}
          onToggleTag={(tag) => setSearchTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))}
          onClearTags={clearSearchTags}
          selectedMastery={selectedMastery}
          onToggleMastery={toggleMastery}
          onSelectAllMastery={selectAllMastery}
          progress={progress}
          selectedSubOptions={selectedSubOptions}
          onRemoveSubOption={(cat, opt) => {
            setSelectedSubOptions((prev) => {
              const newOpts = (prev[cat] || []).filter((o) => o !== opt);
              return { ...prev, [cat]: newOpts };
            });
          }}
          onClearAllSubmenuFilters={clearAllSubmenuFilters}
        />
      </div>

      {/* Flag Grid */}
      {filteredFlags.length > 0 ? (
        <div className="pb-20">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-4">
            {filteredFlags.slice(0, displayedCount).map((flag) => {
              const flagProg = progress[flag.id];
              const attempts = flagProg?.attempts || 0;
              const correct = flagProg?.correct || 0;
              const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
              const isMastered = attempts >= 3 && accuracy >= 80;
              const needsPractice = attempts > 0 && accuracy < 50;

            const compareIndex = compareFlags.findIndex((f) => f.id === flag.id);
            const isSelectedForCompare = compareIndex >= 0;

            return (
              <button
                key={flag.id}
                id={`flag-card-${flag.id}`}
                onClick={() => {
                  if (compareMode) {
                    toggleCompareFlag(flag);
                  } else {
                    setFocusedFlag(flag);
                  }
                }}
                className={`group flex flex-col bg-white dark:bg-zinc-800 rounded-2xl border p-2.5 shadow-xs hover:shadow-md hover:-translate-y-1 active:scale-[0.98] transition-all duration-150 text-left relative overflow-hidden cursor-pointer ${
                  isSelectedForCompare
                    ? 'border-indigo-500 ring-2 ring-indigo-500/50 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500/70'
                }`}
              >
                {/* Flag Image Visual Box */}
                <div className="w-full aspect-[3/2] bg-zinc-50 dark:bg-zinc-900 rounded-xl overflow-hidden flex items-center justify-center p-2 border border-zinc-100 dark:border-zinc-700/50 relative">
                  <FlagImage
                    flag={flag}
                    alt={flag.name}
                    className="max-w-full max-h-full object-contain rounded drop-shadow-sm transition-transform duration-150 group-hover:scale-105"
                  />

                  {/* Top Left Controls: Favorite & Compare Selection */}
                  <div className="absolute top-1.5 left-1.5 flex items-center gap-1 z-10">
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(flag.id);
                      }}
                      role="button"
                      title="Favorite"
                      className={`p-1.5 rounded-full backdrop-blur-md transition-all hover:scale-110 ${
                        favoritesSet.has(flag.id)
                          ? 'bg-amber-100/90 text-amber-500 opacity-100 dark:bg-zinc-800/90'
                          : 'bg-white/50 dark:bg-zinc-800/50 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-amber-500'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${favoritesSet.has(flag.id) ? 'fill-current' : ''}`} />
                    </div>

                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompareFlag(flag);
                        if (!compareMode) setCompareMode(true);
                      }}
                      role="button"
                      title={isSelectedForCompare ? 'Remove from compare' : 'Add to compare'}
                      className={`p-1.5 rounded-full backdrop-blur-md transition-all hover:scale-110 ${
                        isSelectedForCompare
                          ? 'bg-indigo-600 text-white opacity-100'
                          : 'bg-white/50 dark:bg-zinc-800/50 text-zinc-400 opacity-0 group-hover:opacity-100 hover:text-indigo-600'
                      }`}
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Selected for Compare Slot Badge */}
                  {isSelectedForCompare && (
                    <div className="absolute top-1.5 right-1.5 z-10 px-2 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-md animate-in fade-in zoom-in duration-150">
                      Slot {compareIndex + 1}
                    </div>
                  )}

                  {/* Focus Zoom Icon on Hover */}
                  {!compareMode && !isSelectedForCompare && (
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                      <div className="p-1.5 rounded-full bg-white/90 dark:bg-zinc-800/90 text-zinc-800 dark:text-white shadow-sm">
                        <Maximize2 className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  )}

                  {/* Mini Mastery Status Dot / Badge (when not in compare mode or selected) */}
                  {!isSelectedForCompare && attempts > 0 && (
                    <div className="absolute top-1.5 right-1.5">
                      {isMastered ? (
                        <div
                          title={`Mastered (${accuracy}%)`}
                          className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-800"
                        />
                      ) : needsPractice ? (
                        <div
                          title={`Needs Practice (${accuracy}%)`}
                          className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-zinc-800"
                        />
                      ) : (
                        <div
                          title={`Learning (${accuracy}%)`}
                          className="w-2.5 h-2.5 rounded-full bg-indigo-500 ring-2 ring-white dark:ring-zinc-800"
                        />
                      )}
                    </div>
                  )}
                </div>

                {/* Name & Metadata Underneath */}
                <div className="mt-2 px-1 flex flex-col flex-1 justify-between min-w-0">
                  <div>
                    <h3
                      className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"
                      title={flag.name}
                    >
                      {flag.name}
                    </h3>
                    <div
                      className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5 flex items-center gap-1"
                      title={flag.country ? `${flag.continent || flag.category} • ${flag.country}` : (flag.continent || flag.category)}
                    >
                      <span className="truncate">{flag.continent || flag.category}</span>
                      {flag.country && (
                        <>
                          <span className="text-zinc-300 dark:text-zinc-600">•</span>
                          <span className="truncate font-medium text-amber-600 dark:text-amber-400">{flag.country}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Load More Button */}
        {displayedCount < filteredFlags.length && (
          <div className="mt-8 flex justify-center pb-8">
            <button
              onClick={() => setDisplayedCount(prev => prev + (itemsPerPage === 'All' ? filteredFlags.length : itemsPerPage))}
              className="px-6 py-2.5 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 font-semibold shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              See More
            </button>
          </div>
        )}
      </div>
      ) : (
        /* Empty State */
        <div className="bg-white dark:bg-zinc-800 rounded-3xl p-10 border border-zinc-200 dark:border-zinc-700 text-center flex flex-col items-center">
          <Globe2 className="w-12 h-12 text-zinc-300 dark:text-zinc-600 mb-3" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-white">No flags match your filters</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm">
            Try adjusting your search keyword, continent, or category selections.
          </p>
          <button
            onClick={clearAllFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Floating Compare Action Bar / Dock */}
      {(compareMode || compareFlags.length > 0) && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[94%] max-w-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 shadow-2xl rounded-2xl p-3 flex items-center justify-between gap-3 select-none text-white animate-in slide-in-from-bottom-6 duration-200">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Slot 1 */}
            <div className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-zinc-800 border border-zinc-700 min-w-0 flex-1">
              <span className="w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                1
              </span>
              {compareFlags[0] ? (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-4 bg-zinc-900 rounded overflow-hidden flex items-center justify-center shrink-0">
                    <FlagImage flag={compareFlags[0]} alt={compareFlags[0].name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <span className="text-xs font-medium truncate text-zinc-200">{compareFlags[0].name}</span>
                  <button
                    onClick={() => toggleCompareFlag(compareFlags[0])}
                    className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-700 ml-auto shrink-0"
                    title="Remove flag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 italic truncate">Select 1st flag</span>
              )}
            </div>

            {/* VS Divider */}
            <span className="text-[10px] font-bold text-zinc-500 uppercase shrink-0">VS</span>

            {/* Slot 2 */}
            <div className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl bg-zinc-800 border border-zinc-700 min-w-0 flex-1">
              <span className="w-5 h-5 rounded-full bg-indigo-600/40 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                2
              </span>
              {compareFlags[1] ? (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="w-6 h-4 bg-zinc-900 rounded overflow-hidden flex items-center justify-center shrink-0">
                    <FlagImage flag={compareFlags[1]} alt={compareFlags[1].name} className="max-w-full max-h-full object-contain" />
                  </div>
                  <span className="text-xs font-medium truncate text-zinc-200">{compareFlags[1].name}</span>
                  <button
                    onClick={() => toggleCompareFlag(compareFlags[1])}
                    className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-700 ml-auto shrink-0"
                    title="Remove flag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="text-xs text-zinc-500 italic truncate">Select 2nd flag</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="open-compare-modal-btn"
              onClick={() => {
                if (compareFlags.length === 2) {
                  setIsCompareModalOpen(true);
                }
              }}
              disabled={compareFlags.length < 2}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md ${
                compareFlags.length === 2
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95'
                  : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed opacity-60'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Compare {compareFlags.length === 2 ? 'Now' : `(${compareFlags.length}/2)`}</span>
            </button>

            {compareFlags.length > 0 && (
              <button
                onClick={() => setCompareFlags([])}
                className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 text-xs transition-colors"
                title="Clear selection"
              >
                Clear
              </button>
            )}

            <button
              onClick={() => {
                setCompareMode(false);
                setCompareFlags([]);
              }}
              className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-zinc-800 transition-colors"
              title="Close compare dock"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Flag Focus Modal with Zoom & Pan */}
      {focusedFlag && (
        <FlagModal
          flag={focusedFlag}
          flagsList={filteredFlags}
          progress={progress}
          onClose={() => setFocusedFlag(null)}
          onSelectFlag={(f) => setFocusedFlag(f)}
          onCompare={handleStartCompareFromModal}
          onEdit={(flag) => {
            setFlagToEdit(flag);
            setEditorInitialTab('flag');
            setIsEditorOpen(true);
            setFocusedFlag(null);
          }}
        />
      )}

      {/* Flag Comparison Modal with Independent Zoom & Pan */}
      {isCompareModalOpen && compareFlags.length === 2 && (
        <FlagCompareModal
          flagA={compareFlags[0]}
          flagB={compareFlags[1]}
          progress={progress}
          onClose={() => setIsCompareModalOpen(false)}
          onUpdateFlags={(a, b) => setCompareFlags([a, b])}
        />
      )}

      {/* Unified Admin Editor Modal (flag + categories tabs) */}
      <AnimatePresence>
        {isEditorOpen && (
          <FlagEditorModal
            key={`${flagToEdit ? flagToEdit.id : 'new-flag'}-${editorInitialTab}`}
            flagToEdit={flagToEdit}
            initialTab={editorInitialTab}
            onClose={() => {
              setIsEditorOpen(false);
              setFlagToEdit(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Trash Bin Modal */}
      <TrashBinModal
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
      />

      {/* Import / Export & Backup Modal */}
      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
      />
    </div>
  );
}
