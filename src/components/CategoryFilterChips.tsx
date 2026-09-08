import React, { useState } from 'react';
import { Layers, Settings, Search, X, Check } from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';
import { FICTIONAL_MEDIA_TYPES, FICTIONAL_FRANCHISES } from '../data/fictional';
import { Category, Flag, ALL_CATEGORIES } from '../types';

interface CategoryFilterChipsProps {
  selectedCategories: (Category | 'All')[];
  onToggleCategory: (cat: Category) => void;
  onSelectAllCategories: () => void;
  selectedSubOptions: Record<string, string[]>;
  onToggleSubOption: (category: string, option: string) => void;
  onClearSubOptions?: (category: string) => void;
  title?: string;
  showAllOption?: boolean;
  rightAction?: React.ReactNode;
  flagsPool?: Flag[];
}

export function CategoryFilterChips({
  selectedCategories,
  onToggleCategory,
  onSelectAllCategories,
  selectedSubOptions,
  onToggleSubOption,
  onClearSubOptions,
  title = 'Categories',
  showAllOption = true,
  rightAction,
  flagsPool: initialFlagsPool,
}: CategoryFilterChipsProps) {
  const { flags: FLAGS } = useFlags();
  const flagsPool = initialFlagsPool || FLAGS;
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(null);
  const [submenuSearch, setSubmenuSearch] = useState('');

  const isAllCategoriesActive =
    selectedCategories.includes('All') ||
    (selectedCategories.length === ALL_CATEGORIES.length &&
      Object.values(selectedSubOptions).every((opts) => !opts || opts.length === 0));

  return (
    <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-700/60">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
          {title}
        </span>
        {rightAction}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {showAllOption && (
          <button
            type="button"
            onClick={onSelectAllCategories}
            className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
              isAllCategoriesActive
                ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
            }`}
          >
            <span>All Categories</span>
            <span
              className={`text-[10px] px-1 py-0.5 rounded-full ${
                isAllCategoriesActive
                  ? 'bg-indigo-700 text-indigo-100'
                  : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              {flagsPool.length}
            </span>
          </button>
        )}

        {ALL_CATEGORIES.map((cat) => {
          const hasSubOptions = ['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Organizations'].includes(cat);
          const activeSubOptions = selectedSubOptions[cat] || [];
          const hasActiveSub = activeSubOptions.length > 0;
          const isCategorySelected = !selectedCategories.includes('All') && selectedCategories.includes(cat);
          const isHighlighted = (isCategorySelected || hasActiveSub) && !isAllCategoriesActive;
          const count = flagsPool.filter((f) => f.category === cat).length;
          const activeCount = hasActiveSub
            ? flagsPool.filter((f) => f.category === cat && f.country && activeSubOptions.includes(f.country)).length
            : count;

          const containerClass = isHighlighted
            ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
            : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300';

          const handleMainButtonClick = () => {
            if (hasSubOptions) {
              if (isHighlighted) {
                // Clicking an active category with submenu deselects everything inside
                if (onClearSubOptions) {
                  onClearSubOptions(cat);
                }
                if (isCategorySelected) {
                  onToggleCategory(cat);
                }
              } else {
                // Pressing an unselected category with submenu selects it with everything inside
                if (onClearSubOptions) {
                  onClearSubOptions(cat);
                }
                onToggleCategory(cat);
              }
            } else {
              onToggleCategory(cat);
            }
          };

          return (
            <div key={cat} className={`relative flex flex-col ${openSubmenu === cat ? 'z-30' : ''}`}>
              <div className={`flex border transition-all rounded-xl ${containerClass}`}>
                <button
                  type="button"
                  onClick={handleMainButtonClick}
                  className={`flex-1 px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 cursor-pointer ${
                    hasSubOptions ? 'rounded-l-xl' : 'rounded-xl'
                  } ${!isHighlighted ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800' : 'hover:bg-black/10 dark:hover:bg-black/20'}`}
                >
                  <span>{cat}</span>
                  <span
                    className={`text-[10px] px-1 py-0.5 rounded-full ${
                      isHighlighted
                        ? 'bg-indigo-700 text-indigo-100'
                        : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    {hasActiveSub ? `${activeCount}/${count}` : count}
                  </span>
                </button>

                {hasSubOptions && (
                  <button
                    type="button"
                    title={`Configure ${cat} options`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (openSubmenu === cat) {
                        setOpenSubmenu(null);
                      } else {
                        setSubmenuSearch('');
                        setOpenSubmenu(cat);
                      }
                    }}
                    className={`px-2 py-1 flex items-center justify-center rounded-r-xl border-l relative cursor-pointer ${
                      isHighlighted
                        ? 'border-indigo-500/50 hover:bg-black/10 dark:hover:bg-black/20 text-white'
                        : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300'
                    } transition-colors`}
                  >
                    <Settings className="w-3.5 h-3.5" />
                    {hasActiveSub && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white dark:ring-zinc-800" />
                    )}
                  </button>
                )}
              </div>

              {/* Submenu Popup */}
              {openSubmenu === cat && (
                <>
                  <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                  <div className="absolute top-[calc(100%+4px)] left-0 min-w-[280px] max-w-[400px] sm:min-w-[400px] max-h-[32rem] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-2 border-b border-zinc-100 dark:border-zinc-700 flex items-center gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                        <input
                          type="text"
                          placeholder="Search options..."
                          value={submenuSearch}
                          onChange={(e) => setSubmenuSearch(e.target.value)}
                          className="w-full pl-7 pr-7 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          autoFocus
                        />
                        {submenuSearch && (
                          <button
                            type="button"
                            onClick={() => setSubmenuSearch('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-y-auto p-2 flex flex-col gap-2 flex-1">
                      {(() => {
                        const availableFlags = flagsPool.filter((f) => f.category === cat && f.country);

                        if (cat === 'Fictional') {
                          const allOptions = Array.from(new Set(availableFlags.map((f) => f.country as string))).filter(Boolean);
                          const searchFiltered = allOptions.filter((opt: any) =>
                            opt.toLowerCase().includes(submenuSearch.toLowerCase())
                          );

                          const franchises = searchFiltered.filter((opt: any) => FICTIONAL_FRANCHISES.includes(opt)).sort();
                          const media = searchFiltered.filter((opt: any) => FICTIONAL_MEDIA_TYPES.includes(opt)).sort();
                          const others = searchFiltered
                            .filter((opt: any) => !FICTIONAL_FRANCHISES.includes(opt) && !FICTIONAL_MEDIA_TYPES.includes(opt))
                            .sort();

                          if (searchFiltered.length === 0) {
                            return <div className="p-4 text-center text-xs text-zinc-500">No results found</div>;
                          }

                          return (
                            <div className="flex flex-col gap-3">
                              {franchises.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1">
                                    Franchises / Universes
                                  </div>
                                   <div className="flex flex-wrap gap-1.5">
                                    {franchises.map((opt: any) => {
                                      const isOptSelected = activeSubOptions.includes(opt);
                                      const optCount = flagsPool.filter((f) => f.category === cat && f.country === opt).length;
                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => onToggleSubOption(cat, opt)}
                                          className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                                            isOptSelected
                                              ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                              : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                          }`}
                                        >
                                          {isOptSelected && <Check className="w-3 h-3" />}
                                          <span>{opt}</span>
                                          <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isOptSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                                            {optCount}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {media.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1">
                                    Media
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {media.map((opt: any) => {
                                      const isOptSelected = activeSubOptions.includes(opt);
                                      const optCount = flagsPool.filter((f) => f.category === cat && f.country === opt).length;
                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => onToggleSubOption(cat, opt)}
                                          className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                                            isOptSelected
                                              ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                              : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                          }`}
                                        >
                                          {isOptSelected && <Check className="w-3 h-3" />}
                                          <span>{opt}</span>
                                          <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isOptSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                                            {optCount}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {others.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1">
                                    Other
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {others.map((opt: any) => {
                                      const isOptSelected = activeSubOptions.includes(opt);
                                      const optCount = flagsPool.filter((f) => f.category === cat && f.country === opt).length;
                                      return (
                                        <button
                                          key={opt}
                                          type="button"
                                          onClick={() => onToggleSubOption(cat, opt)}
                                          className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                                            isOptSelected
                                              ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                              : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                          }`}
                                        >
                                          {isOptSelected && <Check className="w-3 h-3" />}
                                          <span>{opt}</span>
                                          <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isOptSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                                            {optCount}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        if (cat === 'LGBTQI+') {
                          const options = Array.from(new Set(availableFlags.map((f) => f.country as string)))
                            .filter(Boolean)
                            .sort()
                            .filter((opt: any) => opt.toLowerCase().includes(submenuSearch.toLowerCase()));

                          if (options.length === 0) {
                            return <div className="p-4 text-center text-xs text-zinc-500">No results found</div>;
                          }

                          return (
                            <div className="flex flex-wrap gap-1.5">
                              {options.map((opt: any) => {
                                const isOptSelected = activeSubOptions.includes(opt);
                                const optCount = flagsPool.filter((f) => f.category === cat && f.country === opt).length;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => onToggleSubOption(cat, opt)}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isOptSelected
                                        ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                    }`}
                                  >
                                    {isOptSelected && <Check className="w-3 h-3" />}
                                    <span>{opt}</span>
                                    <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isOptSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                                      {optCount}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          );
                        }

                        if (cat === 'Organizations') {
                          const ORG_SECTION_MAP: Record<string, string> = {
                            'Global': 'Others',
                            'Africa': 'Africa',
                            'Asia': 'Asia',
                            'Europe': 'Europe',
                            'North America': 'Others',
                            'South America': 'Others',
                            'Oceania': 'Oceania'
                          };

                          const orgCountryToSectionMap: Record<string, string> = {};
                          availableFlags.forEach((f) => {
                            if (f.country && !orgCountryToSectionMap[f.country]) {
                              orgCountryToSectionMap[f.country] = ORG_SECTION_MAP[f.country] || f.continent || 'Other';
                            }
                          });

                          const orgGrouped: Record<string, Set<string>> = {};
                          Object.entries(orgCountryToSectionMap).forEach(([country, section]) => {
                            if (!orgGrouped[section]) orgGrouped[section] = new Set();
                            orgGrouped[section].add(country);
                          });

                          const orgSortedSections = ['Africa', 'Asia', 'Europe', 'Oceania', 'Others'].filter(
                            s => orgGrouped[s] && orgGrouped[s].size > 0
                          );
                          const orgFilteredGroups = orgSortedSections
                            .map((section) => ({
                              section,
                              options: Array.from(orgGrouped[section])
                                .filter(Boolean)
                                .sort()
                                .filter((opt: any) => opt && opt.toLowerCase().includes(submenuSearch.toLowerCase())),
                            }))
                            .filter((g) => g.options.length > 0);

                          if (orgFilteredGroups.length === 0) {
                            return <div className="p-4 text-center text-xs text-zinc-500">No results found</div>;
                          }

                          return orgFilteredGroups.map((group) => (
                            <div key={group.section} className="flex flex-col gap-2 mb-3 last:mb-0">
                              {orgSortedSections.length > 1 && (
                                <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1 w-full">
                                  {group.section}
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {group.options.map((opt: any) => {
                                  const isOptSelected = activeSubOptions.includes(opt);
                                  const optCount = flagsPool.filter((f) => f.category === cat && f.country === opt).length;
                                  return (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => onToggleSubOption(cat, opt)}
                                      className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                                        isOptSelected
                                          ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                          : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                      }`}
                                    >
                                      {isOptSelected && <Check className="w-3 h-3" />}
                                      <span>{opt}</span>
                                      <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isOptSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                                        {optCount}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ));
                        }

                        // For Provinces & Territories and Indigenous populations, group each country under its single primary continent
                        const PRIMARY_COUNTRY_CONTINENTS: Record<string, string> = {
                          'United States': 'North America',
                          'Chile': 'South America',
                          'France': 'Europe',
                          'United Kingdom': 'Europe',
                          'Netherlands': 'Europe',
                          'Russia': 'Europe',
                          'Georgia': 'Europe',
                          'Australia': 'Oceania',
                          'New Zealand': 'Oceania',
                          'Spain': 'Europe',
                          'Portugal': 'Europe',
                          'Denmark': 'Europe',
                          'Norway': 'Europe',
                          'China': 'Asia',
                          'Ecuador': 'South America',
                          'Argentina': 'South America',
                          'Canada': 'North America',
                          'Brazil': 'South America',
                          'Japan': 'Asia',
                          'India': 'Asia',
                          'Germany': 'Europe',
                          'Italy': 'Europe',
                          'Mexico': 'North America',
                          'South Africa': 'Africa'
                        };

                        const countryToContinentMap: Record<string, string> = {};
                        availableFlags.forEach((f) => {
                          if (f.country && !countryToContinentMap[f.country]) {
                            if (PRIMARY_COUNTRY_CONTINENTS[f.country]) {
                              countryToContinentMap[f.country] = PRIMARY_COUNTRY_CONTINENTS[f.country];
                            } else {
                              countryToContinentMap[f.country] = f.continent || 'Other';
                            }
                          }
                        });

                        const grouped: Record<string, Set<string>> = {};
                        Object.entries(countryToContinentMap).forEach(([country, cont]) => {
                          if (!grouped[cont]) grouped[cont] = new Set();
                          grouped[cont].add(country);
                        });

                        const sortedContinents = Object.keys(grouped).sort();
                        const filteredGroups = sortedContinents
                          .map((cont) => ({
                            continent: cont,
                            options: Array.from(grouped[cont])
                              .filter(Boolean)
                              .sort()
                              .filter((opt: any) => opt && opt.toLowerCase().includes(submenuSearch.toLowerCase())),
                          }))
                          .filter((g) => g.options.length > 0);

                        if (filteredGroups.length === 0) {
                          return <div className="p-4 text-center text-xs text-zinc-500">No results found</div>;
                        }

                        return filteredGroups.map((group) => (
                          <div key={group.continent} className="flex flex-col gap-2 mb-3 last:mb-0">
                            {sortedContinents.length > 1 && (
                              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1 w-full">
                                {group.continent}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1.5">
                              {group.options.map((opt: any) => {
                                const isOptSelected = activeSubOptions.includes(opt);
                                const optCount = flagsPool.filter((f) => f.category === cat && f.country === opt).length;
                                return (
                                  <button
                                    key={opt}
                                    type="button"
                                    onClick={() => onToggleSubOption(cat, opt)}
                                    className={`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                                      isOptSelected
                                        ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                    }`}
                                  >
                                    {isOptSelected && <Check className="w-3 h-3" />}
                                    <span>{opt}</span>
                                    <span className={`text-[10px] px-1 py-0.2 rounded-full font-bold ${isOptSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'}`}>
                                      {optCount}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ));
                      })()}
                    </div>

                    <div className="p-2.5 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex items-center justify-end">
                      <button
                        type="button"
                        onClick={() => setOpenSubmenu(null)}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
