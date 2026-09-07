import { useState, useMemo } from 'react';
import { Filter, Settings, Search, X, XCircle, Check, CheckCircle2, Sparkles, AlertCircle, HelpCircle, Trophy } from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';
import {
  Continent,
  FlagStatus,
  MasteryFilter,
  MasteryLevel,
  FlagProgress,
  Flag,
  ALL_CONTINENTS,
  ALL_STATUSES,
  ALL_MASTERY_LEVELS,
  getFlagMasteryLevel
} from '../types';

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
  masteryFilter,
  onSelectMastery,
  progress,
  selectedSubOptions,
  onRemoveSubOption,
  onClearAllSubmenuFilters,
  title = 'Additional Filters',
}: AdditionalFiltersBarProps) {
  const { flags: FLAGS } = useFlags();
  const flagsPool = initialFlagsPool || FLAGS;
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [tagSearch, setTagSearch] = useState('');
  const [statusSearch, setStatusSearch] = useState('');

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
  }, []);

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

  const hasSubOptions = Boolean(selectedSubOptions && Object.entries(selectedSubOptions).some(([_, opts]) => opts && opts.length > 0));
  const hasActiveContinents = Boolean(selectedContinents && !selectedContinents.includes('All') && selectedContinents.length > 0);
  const hasActiveStatuses = Boolean(selectedStatuses && !selectedStatuses.includes('All') && selectedStatuses.length > 0);
  const hasActiveTags = Boolean(selectedTags && selectedTags.length > 0);
  const hasActiveMastery = activeMasteryLevels.length > 0;

  const showSelectedFiltersSection = hasSubOptions || hasActiveContinents || hasActiveStatuses || hasActiveTags || hasActiveMastery;

  // Clear all submenu filters helper
  const handleClearAllSubmenuFilters = () => {
    if (onClearAllSubmenuFilters) {
      onClearAllSubmenuFilters();
      return;
    }
    if (onSelectAllContinents) onSelectAllContinents();
    if (onSelectAllStatuses) onSelectAllStatuses();
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

        {/* Flag Statuses Filter */}
        {showStatuses && onToggleStatus && onSelectAllStatuses && (() => {
          const isDropdownOpen = openSubmenu === '__statuses__';
          const statusOptions = [...ALL_STATUSES, 'unspecified' as const];
          const filteredStatuses = statusSearch.trim()
            ? statusOptions.filter((s) => s.toLowerCase().includes(statusSearch.trim().toLowerCase()))
            : statusOptions;

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
                  title={hasActiveStatuses ? 'Click to deselect all statuses' : 'Configure flag status filter'}
                  className={`px-3 py-1.5 rounded-l-xl text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                    hasActiveStatuses ? 'hover:bg-black/10 dark:hover:bg-black/20' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <span>Flag Status</span>
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
                  title="Open flag status menu"
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
                        Filter by Flag Status
                      </span>
                    </div>

                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-700/60">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search status..."
                          value={statusSearch}
                          onChange={(e) => setStatusSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/40 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400"
                        />
                      </div>
                    </div>

                    <div className="p-2.5 flex flex-wrap gap-1.5 max-h-64 overflow-y-auto">
                      {filteredStatuses.map((st) => {
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
