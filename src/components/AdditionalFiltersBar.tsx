import { useState, useMemo } from 'react';
import { Filter, Settings, Search, X, XCircle, Check, CheckCircle2, Sparkles, AlertCircle, HelpCircle, Trophy, ChevronDown, ChevronRight, Move } from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';
import {
  Continent,
  FlagStatus,
  AdminType,
  MasteryFilter,
  MasteryLevel,
  FlagProgress,
  Flag,
  ALL_CONTINENTS,
  ALL_STATUSES,
  ALL_ADMIN_TYPES,
  ALL_MASTERY_LEVELS,
  getFlagMasteryLevel
} from '../types';
import {
  AdminTypeFilter,
  NO_PARENT_VALUE,
  ParentTreeNode,
  getAdminTypeCounts,
  getAdminTypeKey,
  getParentKey,
  getParentOptionsDetailed,
  getParentTree,
  getPhantomPlacement,
  getSubnationalCountry,
  getTopLevelLabel,
  isSubnationalFlag,
  matchesParentsHierarchical,
} from '../lib/subnational';

interface AdditionalFiltersBarProps {
  flagsPool?: Flag[];

  selectedContinents?: (Continent | 'All')[];
  onToggleContinent?: (cont: Continent) => void;
  onSelectAllContinents?: () => void;
  
  selectedStatuses?: (FlagStatus | 'unspecified' | 'All')[];
  onToggleStatus?: (status: FlagStatus | 'unspecified') => void;
  onSelectAllStatuses?: () => void;

  selectedTags?: string[];
  onToggleTag?: (tag: string) => void;
  onClearTags?: () => void;

  selectedMastery?: (MasteryLevel | 'all')[];
  onToggleMastery?: (mastery: MasteryLevel) => void;
  onSelectAllMastery?: () => void;

  // Subnational facets (subdivision type + parent region). Shown only when
  // subnationalActive is true; Parent is enabled once scopeCountries is non-empty.
  subnationalActive?: boolean;
  scopeCountries?: string[];
  selectedAdminTypes?: AdminTypeFilter[];
  onToggleAdminType?: (t: AdminType | 'unspecified') => void;
  onSelectAllAdminTypes?: () => void;
  selectedParents?: string[];
  onToggleParent?: (p: string) => void;
  onClearParents?: () => void;

  // Backward compatibility
  masteryFilter?: MasteryFilter;
  onSelectMastery?: (mastery: MasteryFilter) => void;

  progress?: Record<string, FlagProgress>;

  selectedSubOptions?: Record<string, string[]>;
  onRemoveSubOption?: (category: string, option: string) => void;
  onClearAllSubmenuFilters?: () => void;

  title?: string;
}

export function AdditionalFiltersBar({
  flagsPool: initialFlagsPool,
  selectedContinents,
  onToggleContinent,
  onSelectAllContinents,
  selectedStatuses,
  onToggleStatus,
  onSelectAllStatuses,
  selectedTags,
  onToggleTag,
  onClearTags,
  selectedMastery,
  onToggleMastery,
  onSelectAllMastery,
  subnationalActive,
  scopeCountries,
  selectedAdminTypes,
  onToggleAdminType,
  onSelectAllAdminTypes,
  selectedParents,
  onToggleParent,
  onClearParents,
  masteryFilter,
  onSelectMastery,
  progress,
  selectedSubOptions,
  onRemoveSubOption,
  onClearAllSubmenuFilters,
  title = 'Additional Filters',
}: AdditionalFiltersBarProps) {
  const { flags: FLAGS, parentLinks, setParentLink, editCustomFlag } = useFlags();
  const flagsPool = initialFlagsPool || FLAGS;
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [parentSearch, setParentSearch] = useState('');
  // Expanded root nodes in the nested parent tree, keyed `country|||name`.
  const [expandedParents, setExpandedParents] = useState<Set<string>>(new Set());
  // Node (`country|||name`) whose move picker is currently open.
  const [movePickerFor, setMovePickerFor] = useState<string | null>(null);

  // Collect all unique tags from FLAGS
  const allAvailableTags = useMemo(() => {
    const tagSet = new Set<string>();
    FLAGS.forEach((f) => {
      if (f.tags) {
        f.tags.forEach((t) => {
          if (t && t.trim()) tagSet.add(t.trim());
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [FLAGS]);

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return allAvailableTags;
    return allAvailableTags.filter((t) => t.toLowerCase().includes(tagSearch.trim().toLowerCase()));
  }, [allAvailableTags, tagSearch]);

  // Derive active mastery levels
  const activeMasteryLevels = useMemo((): MasteryLevel[] => {
    if (selectedMastery !== undefined) {
      const active = selectedMastery.filter((m): m is MasteryLevel => m !== 'all');
      return active.length === 4 ? [] : active;
    }
    if (masteryFilter && masteryFilter !== 'all') {
      return [masteryFilter as MasteryLevel];
    }
    return [];
  }, [selectedMastery, masteryFilter]);

  const handleToggleMastery = (level: MasteryLevel) => {
    if (onToggleMastery) {
      onToggleMastery(level);
    } else if (onSelectMastery) {
      if (masteryFilter === level) {
        onSelectMastery('all');
      } else {
        onSelectMastery(level);
      }
    }
  };

  const handleSelectAllMastery = () => {
    if (onSelectAllMastery) {
      onSelectAllMastery();
    } else if (onSelectMastery) {
      onSelectMastery('all');
    }
  };

  // Dynamic counts for each mastery level in the current flagsPool
  const masteryStats = useMemo(() => {
    let mastered = 0;
    let learning = 0;
    let needsPractice = 0;
    let unattempted = 0;

    flagsPool.forEach((flag) => {
      const level = getFlagMasteryLevel(flag.id, progress);
      if (level === 'mastered') mastered++;
      else if (level === 'learning') learning++;
      else if (level === 'needs-practice') needsPractice++;
      else unattempted++;
    });

    return { mastered, learning, needsPractice, unattempted, total: flagsPool.length };
  }, [flagsPool, progress]);

  const showContinents = Boolean(selectedContinents && onToggleContinent && onSelectAllContinents);
  const showStatuses = Boolean(selectedStatuses && onToggleStatus && onSelectAllStatuses);
  const showTags = Boolean(selectedTags && onToggleTag && onClearTags);
  const showMastery = Boolean(progress !== undefined && (onToggleMastery || onSelectMastery));
  const showTypes = Boolean(subnationalActive && selectedAdminTypes && onToggleAdminType && onSelectAllAdminTypes);
  const showParents = Boolean(subnationalActive && selectedParents && onToggleParent && onClearParents);
  const parentScope = scopeCountries || [];
  const parentEnabled = parentScope.length > 0;

  const hasActiveTypes = Boolean(
    showTypes && selectedAdminTypes && !selectedAdminTypes.includes('All') && selectedAdminTypes.length > 0
  );
  const hasActiveParents = Boolean(showParents && selectedParents && selectedParents.length > 0);

  const typeCounts = useMemo(
    () => getAdminTypeCounts(flagsPool, parentScope),
    [flagsPool, parentScope]
  );
  const parentData = useMemo(
    () => getParentOptionsDetailed(flagsPool, parentScope),
    [flagsPool, parentScope]
  );
  // Nested region → sub-region tree (states → counties, regions → provinces,
  // …). Counts are subtree totals so a chip reads as "flags selected by this".
  // Manual phantom placements (parentLinks) nest flagless regions under their
  // assigned state.
  const parentTree = useMemo(
    () => getParentTree(flagsPool, parentScope, parentLinks),
    [flagsPool, parentScope, parentLinks]
  );
  // Real-flag counts per `country|||name`: moving a real region edits every
  // same-named flag, so duplicated names (e.g. Harris County in TX and GA)
  // can't be moved from here — the flag editor handles those.
  const realNameCounts = useMemo(() => {
    const m = new Map<string, number>();
    flagsPool.forEach((f) => {
      if (!isSubnationalFlag(f)) return;
      const nm = (f.name || '').trim();
      if (!nm) return;
      const k = `${getSubnationalCountry(f)}|||${nm}`;
      m.set(k, (m.get(k) || 0) + 1);
    });
    return m;
  }, [flagsPool]);
  const parentSearching = parentSearch.trim().length > 0;
  const parentGroups = useMemo(() => {
    const q = parentSearch.trim().toLowerCase();
    const groups = new Map<string, typeof parentData.opts>();
    parentData.opts.forEach((o) => {
      if (q && !o.parent.toLowerCase().includes(q) && !o.country.toLowerCase().includes(q)) return;
      const arr = groups.get(o.country) || [];
      arr.push(o);
      groups.set(o.country, arr);
    });
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [parentData, parentSearch]);

  const hasSubOptions = Boolean(selectedSubOptions && Object.entries(selectedSubOptions).some(([_, opts]) => opts && opts.length > 0));
  const hasActiveContinents = Boolean(selectedContinents && !selectedContinents.includes('All') && selectedContinents.length > 0);
  const hasActiveStatuses = Boolean(selectedStatuses && !selectedStatuses.includes('All') && selectedStatuses.length > 0);
  const hasActiveTags = Boolean(selectedTags && selectedTags.length > 0);
  const hasActiveMastery = activeMasteryLevels.length > 0;

  const showSelectedFiltersSection = hasSubOptions || hasActiveContinents || hasActiveStatuses || hasActiveTags || hasActiveMastery || hasActiveTypes || hasActiveParents;

  // Clear all submenu filters helper
  const handleClearAllSubmenuFilters = () => {
    if (onClearAllSubmenuFilters) {
      onClearAllSubmenuFilters();
      return;
    }
    if (onSelectAllContinents) onSelectAllContinents();
    if (onSelectAllStatuses) onSelectAllStatuses();
    if (onSelectAllAdminTypes) onSelectAllAdminTypes();
    if (onClearParents) onClearParents();
    if (onClearTags) onClearTags();
    handleSelectAllMastery();
    if (selectedSubOptions && onRemoveSubOption) {
      Object.entries(selectedSubOptions).forEach(([cat, opts]) => {
        opts.forEach((opt) => onRemoveSubOption(cat, opt));
      });
    }
  };

  if (!showContinents && !showStatuses && !showTags && !showMastery && !showSelectedFiltersSection) {
    return null;
  }

  // Calculate dynamic flag counts for filter buttons
  const activeContinentsList = (selectedContinents || []).filter((c): c is Continent => c !== 'All');
  const continentsFlagCount = hasActiveContinents
    ? flagsPool.filter((f) => f.continent && activeContinentsList.includes(f.continent)).length
    : 0;

  const activeStatusesList = (selectedStatuses || []).filter((s): s is FlagStatus | 'unspecified' => s !== 'All');
  const statusesFlagCount = hasActiveStatuses
    ? flagsPool.filter(
        (f) =>
          (Boolean(f.status) && activeStatusesList.includes(f.status as any)) ||
          (!f.status && activeStatusesList.includes('unspecified'))
      ).length
    : 0;

  const activeTypeCount = hasActiveTypes && selectedAdminTypes
    ? (selectedAdminTypes as string[]).reduce((n, t) => n + (typeCounts.get(t as AdminType | 'unspecified') || 0), 0)
    : 0;

  const tagsFlagCount = hasActiveTags && selectedTags
    ? flagsPool.filter((f) =>
        f.tags && selectedTags.some((t) => f.tags!.some((ft) => ft.toLowerCase().includes(t.toLowerCase())))
      ).length
    : 0;

  const masteryFlagCount = hasActiveMastery
    ? flagsPool.filter((f) => activeMasteryLevels.includes(getFlagMasteryLevel(f.id, progress))).length
    : 0;

  return (
    <div className="space-y-3 pt-2 border-t border-zinc-100 dark:border-zinc-700/60">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          {title}
        </span>
      </div>

      <div className="flex flex-wrap gap-2 relative z-20">
        {/* Continents Filter */}
        {showContinents && onToggleContinent && onSelectAllContinents && (() => {
          const isDropdownOpen = openSubmenu === '__continents__';

          const handleContinentMainClick = () => {
            if (hasActiveContinents) {
              onSelectAllContinents();
            } else {
              setOpenSubmenu(isDropdownOpen ? null : '__continents__');
            }
          };

          return (
            <div className={`relative inline-flex items-center ${isDropdownOpen ? 'z-30' : ''}`}>
              <div
                className={`flex border transition-all rounded-xl ${
                  hasActiveContinents
                    ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                <button
                  type="button"
                  onClick={handleContinentMainClick}
                  title={hasActiveContinents ? 'Click to deselect all continents' : 'Configure continents filter'}
                  className={`px-3 py-1.5 rounded-l-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    hasActiveContinents ? 'hover:bg-black/10 dark:hover:bg-black/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Continents</span>
                  {hasActiveContinents && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-700 text-indigo-100 font-bold">
                      {continentsFlagCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSubmenu(isDropdownOpen ? null : '__continents__');
                  }}
                  title="Open continents menu"
                  className={`px-2 py-1.5 rounded-r-xl border-l flex items-center justify-center transition-colors cursor-pointer ${
                    hasActiveContinents
                      ? 'border-indigo-500/50 hover:bg-black/10 dark:hover:bg-black/20 text-white'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Continents Dropdown */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                  <div className="absolute top-[calc(100%+4px)] left-0 min-w-[280px] max-w-[360px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Filter by Continent
                      </span>
                    </div>

                    <div className="p-2.5 flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
                      {ALL_CONTINENTS.map((cont) => {
                        const isSelected = selectedContinents && !selectedContinents.includes('All') && selectedContinents.includes(cont);
                        const countInPool = flagsPool.filter((f) => f.continent === cont).length;
                        return (
                          <button
                            key={cont}
                            type="button"
                            onClick={() => onToggleContinent(cont)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{cont}</span>
                            <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                              {countInPool}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu(null)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Statuses Filter */}
        {showStatuses && onToggleStatus && onSelectAllStatuses && (() => {
          const isDropdownOpen = openSubmenu === '__statuses__';
          const statusOptions = [...ALL_STATUSES, 'unspecified' as const];

          const handleStatusMainClick = () => {
            if (hasActiveStatuses) {
              onSelectAllStatuses();
            } else {
              setOpenSubmenu(isDropdownOpen ? null : '__statuses__');
            }
          };

          return (
            <div className={`relative inline-flex items-center ${isDropdownOpen ? 'z-30' : ''}`}>
              <div
                className={`flex border transition-all rounded-xl ${
                  hasActiveStatuses
                    ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                <button
                  type="button"
                  onClick={handleStatusMainClick}
                  title={hasActiveStatuses ? 'Click to deselect all statuses' : 'Configure status filter'}
                  className={`px-3 py-1.5 rounded-l-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    hasActiveStatuses ? 'hover:bg-black/10 dark:hover:bg-black/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Status</span>
                  {hasActiveStatuses && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-700 text-indigo-100 font-bold">
                      {statusesFlagCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSubmenu(isDropdownOpen ? null : '__statuses__');
                  }}
                  title="Open status menu"
                  className={`px-2 py-1.5 rounded-r-xl border-l flex items-center justify-center transition-colors cursor-pointer ${
                    hasActiveStatuses
                      ? 'border-indigo-500/50 hover:bg-black/10 dark:hover:bg-black/20 text-white'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Status Dropdown */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                  <div className="absolute top-[calc(100%+4px)] left-0 min-w-[280px] max-w-[360px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Filter by Status
                      </span>
                    </div>

                    <div className="p-2.5 flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
                      {statusOptions.map((st) => {
                        const isSelected = selectedStatuses && !selectedStatuses.includes('All') && selectedStatuses.includes(st);
                        const countInPool = flagsPool.filter((f) => (st === 'unspecified' ? !f.status : f.status === st)).length;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => onToggleStatus(st)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 capitalize cursor-pointer ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{st}</span>
                            <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                              {countInPool}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu(null)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Subdivision Type Filter */}
        {showTypes && onToggleAdminType && onSelectAllAdminTypes && selectedAdminTypes && (() => {
          const isDropdownOpen = openSubmenu === '__types__';
          const typeOptions = [...ALL_ADMIN_TYPES, 'unspecified' as const];

          const handleTypeMainClick = () => {
            if (hasActiveTypes) {
              onSelectAllAdminTypes();
            } else {
              setOpenSubmenu(isDropdownOpen ? null : '__types__');
            }
          };

          return (
            <div className={`relative inline-flex items-center ${isDropdownOpen ? 'z-30' : ''}`}>
              <div
                className={`flex border transition-all rounded-xl ${
                  hasActiveTypes
                    ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                <button
                  type="button"
                  onClick={handleTypeMainClick}
                  title={hasActiveTypes ? 'Click to deselect all types' : 'Configure subdivision type filter'}
                  className={`px-3 py-1.5 rounded-l-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    hasActiveTypes ? 'hover:bg-black/10 dark:hover:bg-black/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Type</span>
                  {hasActiveTypes && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-700 text-indigo-100 font-bold">
                      {activeTypeCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSubmenu(isDropdownOpen ? null : '__types__');
                  }}
                  title="Open subdivision type menu"
                  className={`px-2 py-1.5 rounded-r-xl border-l flex items-center justify-center transition-colors cursor-pointer ${
                    hasActiveTypes
                      ? 'border-indigo-500/50 hover:bg-black/10 dark:hover:bg-black/20 text-white'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Type Dropdown */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                  <div className="absolute top-[calc(100%+4px)] left-0 min-w-[280px] max-w-[360px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-700/60">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Filter by subdivision type
                      </span>
                    </div>

                    <div className="p-2.5 flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
                      {typeOptions.map((t) => {
                        const isSelected = !selectedAdminTypes.includes('All') && selectedAdminTypes.includes(t);
                        const countInPool = typeCounts.get(t) || 0;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => onToggleAdminType(t)}
                            className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 capitalize cursor-pointer ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            <span>{t}</span>
                            <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                              {countInPool}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu(null)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Parent Region Filter */}
        {showParents && onToggleParent && onClearParents && selectedParents && (() => {
          const isDropdownOpen = openSubmenu === '__parents__';

          const handleParentMainClick = () => {
            if (hasActiveParents) {
              onClearParents();
              return;
            }
            if (!parentEnabled) return;
            setOpenSubmenu(isDropdownOpen ? null : '__parents__');
          };

          const toggleExpanded = (key: string) => {
            setExpandedParents((prev) => {
              const next = new Set(prev);
              if (next.has(key)) next.delete(key);
              else next.add(key);
              return next;
            });
          };

          const renderParentChip = (country: string, name: string, count: number, phantom = false) => {
            const isSelected = (selectedParents as string[]).includes(name);
            return (
              <button
                key={`${country}|||${name}`}
                type="button"
                onClick={() => (onToggleParent as (p: string) => void)(name)}
                title={phantom ? `${name} — no flag for this region yet; its children are grouped here` : name}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                    : phantom
                      ? 'border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
                <span>{name}</span>
                <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                  {count}
                </span>
              </button>
            );
          };

          // Applies a move: phantoms get a manual placement, real regions get
          // their flag's parentRegion rewritten (via the standard edit path,
          // so it syncs like any flag edit). '' = top level.
          const applyMove = (node: ParentTreeNode, dest: string) => {
            if (node.phantom) {
              setParentLink(node.country, node.name, dest || null);
            } else {
              FLAGS.filter(
                (f) =>
                  isSubnationalFlag(f) &&
                  getSubnationalCountry(f) === node.country &&
                  (f.name || '').trim() === node.name
              ).forEach((f) => {
                editCustomFlag({ ...f, parentRegion: dest ? dest : undefined });
              });
            }
            setMovePickerFor(null);
            if (dest) {
              setExpandedParents((prev) => new Set(prev).add(`${node.country}|||${dest}`));
            }
          };

          const renderTreeNode = (
            node: ParentTreeNode,
            placeTargets: string[],
            treeParent: string,
            isRoot: boolean
          ) => {
            const key = `${node.country}|||${node.name}`;
            const isExpanded = expandedParents.has(key);
            const hasKids = node.children.length > 0;
            const placement = node.phantom
              ? getPhantomPlacement(node.country, node.name, parentLinks)
              : '';
            // Move affordance: every phantom (place it) + every nested region
            // (re-parent it). Real top-level regions are already at the top.
            const showMove = node.phantom || !isRoot;
            // Same-named real flags in one country move as a unit, which is
            // surprising — those go through the flag editor instead.
            const nameDup = !node.phantom && (realNameCounts.get(key) || 0) > 1;
            const pickerOpen = movePickerFor === key;
            // Picker targets: real regions, minus self and own subtree.
            const descNames = new Set<string>();
            const collectDesc = (n: ParentTreeNode): void => {
              n.children.forEach((c) => {
                descNames.add(c.name);
                collectDesc(c);
              });
            };
            collectDesc(node);
            const targets = placeTargets.filter(
              (t) => t !== node.name && !descNames.has(t)
            );
            const current = node.phantom ? placement : treeParent;
            return (
              <div key={key} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1">
                  <div className="flex-1 min-w-0">
                    {renderParentChip(node.country, node.name, node.totalCount, node.phantom)}
                  </div>
                  {showMove && (
                    <button
                      type="button"
                      disabled={nameDup}
                      onClick={() => setMovePickerFor(pickerOpen ? null : key)}
                      title={
                        nameDup
                          ? `"${node.name}" exists more than once in ${node.country} — move it via the flag editor`
                          : node.phantom
                            ? placement
                              ? `${node.name} lives under ${placement} — change placement`
                              : `Place ${node.name} under a state/region`
                            : `Move ${node.name} under another state/region (edits its flag)`
                      }
                      className={`p-1.5 rounded-lg border transition-colors flex-shrink-0 ${
                        pickerOpen
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 cursor-pointer'
                          : nameDup
                            ? 'border-zinc-200 dark:border-zinc-700 text-zinc-300 dark:text-zinc-600 cursor-not-allowed'
                            : 'border-transparent text-zinc-300 dark:text-zinc-600 hover:text-zinc-500 dark:hover:text-zinc-300 hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer'
                      }`}
                    >
                      <Move className="w-3 h-3" />
                    </button>
                  )}
                  {hasKids && (
                    <button
                      type="button"
                      onClick={() => toggleExpanded(key)}
                      title={isExpanded ? `Collapse ${node.name}` : `Expand ${node.name} (${node.children.length})`}
                      className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer flex-shrink-0"
                    >
                      {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                {pickerOpen && !nameDup && (
                  <div className="ml-1 flex flex-col gap-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 p-1">
                    <div className="px-1.5 pt-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      {node.phantom ? `Place under…` : `Move under…`}
                    </div>
                    {[{ value: '', label: 'Top level' }, ...targets.map((t) => ({ value: t, label: t }))].map((opt) => (
                      <button
                        key={opt.value || '__top__'}
                        type="button"
                        onClick={() => {
                          if ((opt.value || '') !== (current || '')) applyMove(node, opt.value);
                          else setMovePickerFor(null);
                        }}
                        className={`px-1.5 py-1 rounded-md text-xs text-left flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                          (opt.value || '') === (current || '')
                            ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 font-semibold'
                            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                        }`}
                      >
                        <span className="truncate">{opt.label}</span>
                        {(opt.value || '') === (current || '') && <Check className="w-3 h-3 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                )}
                {hasKids && isExpanded && (
                  <div className="ml-3 pl-2.5 border-l-2 border-zinc-100 dark:border-zinc-700/60 flex flex-col gap-1.5">
                    {node.children.map((child) => renderTreeNode(child, placeTargets, node.name, false))}
                  </div>
                )}
              </div>
            );
          };

          // All real regions in a country group, for the phantom assign picker.
          const collectPlaceTargets = (roots: ParentTreeNode[]): string[] => {
            const out = new Set<string>();
            const walk = (nodes: ParentTreeNode[]) => {
              nodes.forEach((n) => {
                if (!n.phantom) out.add(n.name);
                walk(n.children);
              });
            };
            walk(roots);
            return Array.from(out).sort((a, b) => a.localeCompare(b));
          };

          return (
            <div className={`relative inline-flex items-center ${isDropdownOpen ? 'z-30' : ''}`}>
              <div
                className={`flex border transition-all rounded-xl ${
                  hasActiveParents
                    ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                } ${!parentEnabled && !hasActiveParents ? 'opacity-60' : ''}`}
              >
                <button
                  type="button"
                  disabled={!parentEnabled && !hasActiveParents}
                  onClick={handleParentMainClick}
                  title={!parentEnabled && !hasActiveParents ? 'Select a country first' : hasActiveParents ? 'Click to deselect all parents' : 'Configure parent region filter'}
                  className={`px-3 py-1.5 rounded-l-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    !parentEnabled && !hasActiveParents
                      ? 'cursor-not-allowed'
                      : hasActiveParents
                        ? 'cursor-pointer hover:bg-black/10 dark:hover:bg-black/20'
                        : 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Parent region</span>
                  {hasActiveParents && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-700 text-indigo-100 font-bold">
                      {selectedParents.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  disabled={!parentEnabled}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSubmenu(isDropdownOpen ? null : '__parents__');
                  }}
                  title={!parentEnabled ? 'Select a country first' : 'Open parent region menu'}
                  className={`px-2 py-1.5 rounded-r-xl border-l flex items-center justify-center transition-colors ${
                    !parentEnabled
                      ? 'cursor-not-allowed'
                      : 'cursor-pointer'
                  } ${
                    hasActiveParents
                      ? 'border-indigo-500/50 hover:bg-black/10 dark:hover:bg-black/20 text-white'
                      : parentEnabled
                        ? 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                        : 'border-zinc-200 dark:border-zinc-700 text-zinc-400'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Parent Dropdown */}
              {isDropdownOpen && parentEnabled && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                  <div className="absolute top-[calc(100%+4px)] left-0 min-w-[300px] max-w-[400px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-700/60">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Filter by parent region
                      </span>
                      <div className="relative mt-1.5">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search parents..."
                          value={parentSearch}
                          onChange={(e) => setParentSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 flex flex-col gap-3 max-h-72 overflow-y-auto">
                      {parentData.noneCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onToggleParent(NO_PARENT_VALUE)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer self-start ${
                            selectedParents.includes(NO_PARENT_VALUE)
                              ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                              : 'border-dashed border-zinc-300 dark:border-zinc-600 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400'
                          }`}
                        >
                          {selectedParents.includes(NO_PARENT_VALUE) && <Check className="w-3 h-3" />}
                          <span>{getTopLevelLabel(flagsPool, parentScope)} ({parentData.noneCount})</span>
                        </button>
                      )}
                      {parentGroups.length === 0 && parentData.noneCount === 0 && (
                        <div className="py-4 text-center text-xs text-zinc-400">
                          No subdivisions in the selected countries yet.
                        </div>
                      )}
                      {parentSearching ? (
                        parentGroups.map(([country, opts]) => (
                          <div key={country} className="flex flex-col gap-1.5">
                            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1">
                              {country}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {opts.map((o) => renderParentChip(o.country, o.parent, o.count))}
                            </div>
                          </div>
                        ))
                      ) : (
                        parentTree.map((group) => {
                          const placeTargets = collectPlaceTargets(group.roots);
                          return (
                            <div key={group.country} className="flex flex-col gap-1.5">
                              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1">
                                {group.country}
                              </div>
                              <div className="flex flex-col gap-1.5">
                                {group.roots.map((node) => renderTreeNode(node, placeTargets, '', true))}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu(null)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Tags Filter */}
        {showTags && onToggleTag && onClearTags && (() => {
          const isDropdownOpen = openSubmenu === '__tags__';

          const handleTagsMainClick = () => {
            if (hasActiveTags) {
              onClearTags();
            } else {
              setOpenSubmenu(isDropdownOpen ? null : '__tags__');
            }
          };

          return (
            <div className={`relative inline-flex items-center ${isDropdownOpen ? 'z-30' : ''}`}>
              <div
                className={`flex border transition-all rounded-xl ${
                  hasActiveTags
                    ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                <button
                  type="button"
                  onClick={handleTagsMainClick}
                  title={hasActiveTags ? 'Click to clear selected tags' : 'Configure tags filter'}
                  className={`px-3 py-1.5 rounded-l-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    hasActiveTags ? 'hover:bg-black/10 dark:hover:bg-black/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Tags</span>
                  {hasActiveTags && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-700 text-indigo-100 font-bold">
                      {tagsFlagCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSubmenu(isDropdownOpen ? null : '__tags__');
                  }}
                  title="Open tags menu"
                  className={`px-2 py-1.5 rounded-r-xl border-l flex items-center justify-center transition-colors cursor-pointer ${
                    hasActiveTags
                      ? 'border-indigo-500/50 hover:bg-black/10 dark:hover:bg-black/20 text-white'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tags Dropdown */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                  <div className="absolute top-[calc(100%+4px)] left-0 min-w-[280px] max-w-[380px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Filter by Motifs & Tags
                      </span>
                    </div>

                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-700/60">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search tags (e.g. green, star, bird)..."
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
                      {filteredTags.length === 0 ? (
                        <div className="w-full py-4 text-center text-xs text-zinc-400">
                          No matching tags found
                        </div>
                      ) : (
                        filteredTags.map((tag, idx) => {
                          const isSelected = selectedTags?.includes(tag);
                          const countInPool = flagsPool.filter(
                            (f) => f.tags && f.tags.some((ft) => ft.toLowerCase().includes(tag.toLowerCase()))
                          ).length;
                          return (
                            <button
                              key={`${tag}-${idx}`}
                              type="button"
                              onClick={() => onToggleTag(tag)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                                isSelected
                                  ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                  : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3" />}
                              <span>{tag}</span>
                              <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                                {countInPool}
                              </span>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu(null)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Mastery Filter (Dictionary / Progress) - Multiple Selection Enabled */}
        {showMastery && (() => {
          const isDropdownOpen = openSubmenu === '__mastery__';

          const handleMasteryMainClick = () => {
            if (hasActiveMastery) {
              handleSelectAllMastery();
            } else {
              setOpenSubmenu(isDropdownOpen ? null : '__mastery__');
            }
          };

          return (
            <div className={`relative inline-flex items-center ${isDropdownOpen ? 'z-30' : ''}`}>
              <div
                className={`flex border transition-all rounded-xl ${
                  hasActiveMastery
                    ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                <button
                  type="button"
                  onClick={handleMasteryMainClick}
                  title={hasActiveMastery ? 'Click to reset mastery filter' : 'Filter by quiz learning mastery'}
                  className={`px-3 py-1.5 rounded-l-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    hasActiveMastery ? 'hover:bg-black/10 dark:hover:bg-black/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Trophy className="w-3.5 h-3.5" />
                  <span>
                    {hasActiveMastery
                      ? activeMasteryLevels.length === 1
                        ? activeMasteryLevels[0].replace('-', ' ')
                        : `Mastery (${activeMasteryLevels.length})`
                      : 'Mastery'}
                  </span>
                  {hasActiveMastery && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-700 text-indigo-100 font-bold">
                      {masteryFlagCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenSubmenu(isDropdownOpen ? null : '__mastery__');
                  }}
                  title="Open mastery options"
                  className={`px-2 py-1.5 rounded-r-xl border-l flex items-center justify-center transition-colors cursor-pointer ${
                    hasActiveMastery
                      ? 'border-indigo-500/50 hover:bg-black/10 dark:hover:bg-black/20 text-white'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Mastery Dropdown */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                  <div className="absolute top-[calc(100%+4px)] left-0 min-w-[270px] max-w-[340px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2.5 border-b border-zinc-100 dark:border-zinc-700/60 flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                        Filter by Learning Mastery
                      </span>
                    </div>

                    <div className="p-2.5 flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                      {/* Mastered */}
                      {(() => {
                        const isSelected = activeMasteryLevels.includes('mastered');
                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleMastery('mastered')}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-emerald-500 bg-emerald-600 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                              <span>Mastered (2+ Correct)</span>
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-emerald-700 text-white' : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'}`}>
                              {masteryStats.mastered}
                            </span>
                          </button>
                        );
                      })()}

                      {/* Learning */}
                      {(() => {
                        const isSelected = activeMasteryLevels.includes('learning');
                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleMastery('learning')}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                              <span>Learning (In Progress)</span>
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-indigo-700 text-white' : 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'}`}>
                              {masteryStats.learning}
                            </span>
                          </button>
                        );
                      })()}

                      {/* Needs Practice */}
                      {(() => {
                        const isSelected = activeMasteryLevels.includes('needs-practice');
                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleMastery('needs-practice')}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-rose-500 bg-rose-600 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-500" />}
                              <span>Needs Practice (&lt;50%)</span>
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-rose-700 text-white' : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300'}`}>
                              {masteryStats.needsPractice}
                            </span>
                          </button>
                        );
                      })()}

                      {/* Unattempted */}
                      {(() => {
                        const isSelected = activeMasteryLevels.includes('unattempted');
                        return (
                          <button
                            type="button"
                            onClick={() => handleToggleMastery('unattempted')}
                            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-zinc-700 bg-zinc-800 text-white font-semibold shadow-xs'
                                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />}
                              <span>Unattempted</span>
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${isSelected ? 'bg-zinc-950 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                              {masteryStats.unattempted}
                            </span>
                          </button>
                        );
                      })()}
                    </div>

                    <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu(null)}
                        className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-xs cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })()}
      </div>

      {/* Selected Filters Chips Section at Bottom */}
      {showSelectedFiltersSection && (
        <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-800/60 flex flex-col gap-2 animate-in fade-in duration-150">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
            <span>Selected Filters</span>
            <button
              type="button"
              onClick={handleClearAllSubmenuFilters}
              className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <XCircle className="w-3 h-3" />
              Clear Sub Filters
            </button>
          </div>

          <div className="flex flex-col gap-2">
            {/* Sub-options from categories */}
            {selectedSubOptions &&
              Object.entries(selectedSubOptions).map(([cat, opts]) => {
                if (!opts || opts.length === 0) return null;
                return (
                  <div key={cat} className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">{cat}:</span>
                    {opts.map((opt) => {
                      const count = FLAGS.filter((f) => f.category === cat && f.country === opt).length;
                      return (
                        <span
                          key={opt}
                          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30"
                        >
                          <span>
                            {opt} ({count})
                          </span>
                          {onRemoveSubOption && (
                            <button
                              type="button"
                              onClick={() => onRemoveSubOption(cat, opt)}
                              className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-500/40 rounded-md transition-colors cursor-pointer"
                              title={`Remove ${opt}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                );
              })}

            {/* Continents */}
            {hasActiveContinents && selectedContinents && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">Continents:</span>
                {activeContinentsList.map((cont) => {
                  const count = flagsPool.filter((f) => f.continent === cont).length;
                  return (
                    <span
                      key={cont}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium bg-teal-100/50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30"
                    >
                      <span>
                        {cont} ({count})
                      </span>
                      {onToggleContinent && (
                        <button
                          type="button"
                          onClick={() => onToggleContinent(cont)}
                          className="p-0.5 hover:bg-teal-200 dark:hover:bg-teal-500/40 rounded-md transition-colors cursor-pointer"
                          title={`Remove ${cont}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Statuses */}
            {hasActiveStatuses && selectedStatuses && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">Status:</span>
                {activeStatusesList.map((st) => {
                  const count = flagsPool.filter((f) => (st === 'unspecified' ? !f.status : f.status === st)).length;
                  return (
                    <span
                      key={st}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium capitalize bg-orange-100/50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30"
                    >
                      <span>
                        {st} ({count})
                      </span>
                      {onToggleStatus && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(st)}
                          className="p-0.5 hover:bg-orange-200 dark:hover:bg-orange-500/40 rounded-md transition-colors cursor-pointer"
                          title={`Remove ${st}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Subdivision types */}
            {hasActiveTypes && selectedAdminTypes && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">Type:</span>
                {(selectedAdminTypes as string[]).filter((t) => t !== 'All').map((t) => {
                  const count = flagsPool.filter((f) => getAdminTypeKey(f) === t).length;
                  return (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium capitalize bg-sky-100/50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/30"
                    >
                      <span>
                        {t} ({count})
                      </span>
                      {onToggleAdminType && (
                        <button
                          type="button"
                          onClick={() => onToggleAdminType(t as AdminType | 'unspecified')}
                          className="p-0.5 hover:bg-sky-200 dark:hover:bg-sky-500/40 rounded-md transition-colors cursor-pointer"
                          title={`Remove ${t}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Parent regions */}
            {hasActiveParents && selectedParents && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">Parent region:</span>
                {selectedParents.map((p) => {
                  // Hierarchical count: selecting a region includes its whole
                  // subtree, so the chip shows what the filter actually yields.
                  const count =
                    p === NO_PARENT_VALUE
                      ? flagsPool.filter((f) => !getParentKey(f)).length
                      : flagsPool.filter((f) => matchesParentsHierarchical(f, [p], FLAGS, parentLinks)).length;
                  return (
                    <span
                      key={p}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium bg-lime-100/50 dark:bg-lime-500/20 text-lime-700 dark:text-lime-300 border border-lime-200 dark:border-lime-500/30"
                    >
                      <span>
                        {p === NO_PARENT_VALUE ? getTopLevelLabel(flagsPool, parentScope) : p} ({count})
                      </span>
                      {onToggleParent && (
                        <button
                          type="button"
                          onClick={() => onToggleParent(p)}
                          className="p-0.5 hover:bg-lime-200 dark:hover:bg-lime-500/40 rounded-md transition-colors cursor-pointer"
                          title={`Remove ${p}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Tags */}
            {hasActiveTags && selectedTags && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">Tags:</span>
                {selectedTags.map((tag, idx) => {
                  const count = flagsPool.filter(
                    (f) => f.tags && f.tags.some((ft) => ft.toLowerCase().includes(tag.toLowerCase()))
                  ).length;
                  return (
                    <span
                      key={`${tag}-${idx}`}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium bg-fuchsia-100/50 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-500/30"
                    >
                      <span>
                        {tag} ({count})
                      </span>
                      {onToggleTag && (
                        <button
                          type="button"
                          onClick={() => onToggleTag(tag)}
                          className="p-0.5 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-500/40 rounded-md transition-colors cursor-pointer"
                          title={`Remove ${tag}`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </span>
                  );
                })}
              </div>
            )}

            {/* Mastery */}
            {hasActiveMastery && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">Mastery:</span>
                {activeMasteryLevels.map((level) => {
                  const count = flagsPool.filter((f) => getFlagMasteryLevel(f.id, progress) === level).length;
                  const labelMap: Record<MasteryLevel, string> = {
                    mastered: 'Mastered',
                    learning: 'Learning',
                    'needs-practice': 'Needs Practice',
                    unattempted: 'Unattempted',
                  };
                  return (
                    <span
                      key={level}
                      className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium capitalize bg-amber-100/50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30"
                    >
                      <span>
                        {labelMap[level]} ({count})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleMastery(level)}
                        className="p-0.5 hover:bg-amber-200 dark:hover:bg-amber-500/40 rounded-md transition-colors cursor-pointer"
                        title={`Remove ${labelMap[level]}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
