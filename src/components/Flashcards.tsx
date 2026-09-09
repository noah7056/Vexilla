import { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight, Globe2, RotateCcw } from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';
import { Category, Continent, FlagStatus, ALL_CATEGORIES, ALL_CONTINENTS, ALL_STATUSES } from '../types';
import { FlagImage } from './FlagImage';
import { CategoryFilterChips } from './CategoryFilterChips';
import { AdditionalFiltersBar } from './AdditionalFiltersBar';

export function Flashcards() {
  const { flags: FLAGS } = useFlags();
  const [selectedCategories, setSelectedCategories] = useState<(Category | 'All')[]>(['All']);
  const [selectedSubOptions, setSelectedSubOptions] = useState<Record<string, string[]>>({});
  const [selectedContinents, setSelectedContinents] = useState<(Continent | 'All')[]>(['All']);
  const [selectedStatuses, setSelectedStatuses] = useState<(FlagStatus | 'unspecified' | 'All')[]>(['All']);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // Toggle Category
  const toggleCategory = (cat: Category) => {
    setSelectedCategories((prev) => {
      if (prev.includes('All')) {
        return [cat];
      }
      const exists = prev.includes(cat);
      if (exists) {
        const next = prev.filter((c) => c !== cat);
        return next.length === 0 ? ['All'] : next;
      } else {
        const next = [...prev, cat];
        return next.length === ALL_CATEGORIES.length ? ['All'] : next;
      }
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const selectAllCategories = () => {
    setSelectedCategories(['All']);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const toggleSubOption = (category: string, option: string) => {
    setSelectedSubOptions((prev) => {
      const current = prev[category] || [];
      const updated = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...prev, [category]: updated };
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

    setCurrentIndex(0);
    setIsFlipped(false);
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
        return next.length === ALL_CONTINENTS.length ? ['All'] : next;
      }
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const selectAllContinents = () => {
    setSelectedContinents(['All']);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Toggle Status
  const toggleStatus = (status: FlagStatus | 'unspecified') => {
    setSelectedStatuses((prev) => {
      if (prev.includes('All')) {
        return [status];
      }
      const exists = prev.includes(status);
      if (exists) {
        const next = prev.filter((s) => s !== status);
        return next.length === 0 ? ['All'] : next;
      } else {
        const next = [...prev, status];
        return next.length === ALL_STATUSES.length + 1 ? ['All'] : next;
      }
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const selectAllStatuses = () => {
    setSelectedStatuses(['All']);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Toggle Tag
  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const clearTags = () => {
    setSelectedTags([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleClearSubOptions = (cat: string) => {
    setSelectedSubOptions((prev) => {
      const next = { ...prev };
      delete next[cat];
      return next;
    });
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const clearAllSubmenuFilters = () => {
    setSelectedSubOptions({});
    setSelectedContinents(['All']);
    setSelectedStatuses(['All']);
    setSelectedTags([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const hasCustomFilters =
    !selectedCategories.includes('All') ||
    Object.values(selectedSubOptions).some((arr: string[]) => arr && arr.length > 0) ||
    !selectedContinents.includes('All') ||
    !selectedStatuses.includes('All') ||
    selectedTags.length > 0;

  const handleResetFilters = () => {
    setSelectedCategories(['All']);
    setSelectedSubOptions({});
    setSelectedContinents(['All']);
    setSelectedStatuses(['All']);
    setSelectedTags([]);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  // Base pool of flags restricted by Category & Sub-options
  const categoryFlagsPool = useMemo(() => {
    return FLAGS.filter((flag) => {
      const matchesCat = selectedCategories.includes('All') || selectedCategories.includes(flag.category);
      if (!matchesCat) return false;

      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Languages', 'Organizations', 'Concepts'].includes(flag.category)) {
        const activeSub = selectedSubOptions[flag.category];
        if (activeSub && activeSub.length > 0) {
          if (!flag.country || !activeSub.includes(flag.country)) {
            return false;
          }
        }
      }
      return true;
    });
  }, [selectedCategories, selectedSubOptions, FLAGS]);

  const filteredFlags = useMemo(() => {
    return FLAGS.filter((flag) => {
      // 1. Categories
      const matchesCat = selectedCategories.includes('All') || selectedCategories.includes(flag.category);
      if (!matchesCat) return false;

      // 2. Sub-options
      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Languages', 'Organizations', 'Concepts'].includes(flag.category)) {
        const activeSub = selectedSubOptions[flag.category];
        if (activeSub && activeSub.length > 0) {
          if (!flag.country || !activeSub.includes(flag.country)) {
            return false;
          }
        }
      }

      // 3. Continents
      const isGlobalCat =
        flag.category === 'Fictional' ||
        flag.category === 'LGBTQI+' ||
        flag.category === 'Languages' ||
        flag.category === 'Pirate Flags' ||
        flag.category === 'Organizations' ||
        flag.category === 'Concepts';
      const matchesCont =
        selectedContinents.includes('All') ||
        isGlobalCat ||
        (flag.continent ? selectedContinents.includes(flag.continent) : false);
      if (!matchesCont) return false;

      // 4. Status
      const matchesStatus =
        selectedStatuses.includes('All') ||
        selectedStatuses.length === 0 ||
        (Boolean(flag.status) && selectedStatuses.includes(flag.status as FlagStatus)) ||
        (!flag.status && selectedStatuses.includes('unspecified'));
      if (!matchesStatus) return false;

      // 5. Tags
      if (selectedTags.length > 0) {
        const hasTag = flag.tags && selectedTags.some((t) => flag.tags?.some(ft => ft.toLowerCase().includes(t.toLowerCase())));
        if (!hasTag) return false;
      }

      return true;
    });
  }, [selectedCategories, selectedSubOptions, selectedContinents, selectedStatuses, selectedTags, FLAGS]);

  useEffect(() => {
    if (currentIndex >= filteredFlags.length) {
      setCurrentIndex(0);
    }
  }, [filteredFlags.length, currentIndex]);

  const handleNext = () => {
    if (filteredFlags.length <= 1) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredFlags.length);
    }, 150);
  };

  const handlePrev = () => {
    if (filteredFlags.length <= 1) return;
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + filteredFlags.length) % filteredFlags.length);
    }, 150);
  };

  const currentFlag = filteredFlags[currentIndex] || filteredFlags[0];

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto py-6 px-4">
      {/* Filter Controls Bar */}
      <div className="flex flex-col gap-3.5 mb-6 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/80">
            Showing <strong className="font-bold">{filteredFlags.length}</strong> of{' '}
            <strong>{FLAGS.length}</strong> flags
          </span>
          {hasCustomFilters && (
            <button
              onClick={handleResetFilters}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200/80 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/50 dark:border-rose-800/60 dark:text-rose-300 text-xs font-semibold transition-colors cursor-pointer"
              title="Clear all active filters"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
              Clear All
            </button>
          )}
        </div>

        <CategoryFilterChips
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          onSelectAllCategories={selectAllCategories}
          selectedSubOptions={selectedSubOptions}
          onToggleSubOption={toggleSubOption}
          onClearSubOptions={handleClearSubOptions}
          flagsPool={FLAGS}
          title="Categories"
          showAllOption={true}
        />

        <AdditionalFiltersBar
          flagsPool={categoryFlagsPool}
          selectedContinents={selectedContinents}
          onToggleContinent={toggleContinent}
          onSelectAllContinents={selectAllContinents}
          selectedStatuses={selectedStatuses}
          onToggleStatus={toggleStatus}
          onSelectAllStatuses={selectAllStatuses}
          selectedTags={selectedTags}
          onToggleTag={toggleTag}
          onClearTags={clearTags}
          selectedSubOptions={selectedSubOptions}
          onRemoveSubOption={toggleSubOption}
          onClearAllSubmenuFilters={clearAllSubmenuFilters}
        />
      </div>

      {filteredFlags.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-zinc-800 rounded-2xl border border-zinc-200 dark:border-zinc-700">
          <Globe2 className="w-12 h-12 text-zinc-400 dark:text-zinc-500 mb-3" />
          <h3 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
            No flags match the selected filters
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">
            Try adjusting your Continent, Category, or Country selection.
          </p>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center relative perspective-1000">
          <div
            className="w-full aspect-[3/2] sm:aspect-video max-w-2xl cursor-pointer select-none"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <motion.div
              className="w-full h-full relative preserve-3d"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 200, damping: 20 }}
            >
              {/* Front: Flag Image */}
              <div className="absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center p-6">
                <FlagImage
                  flag={currentFlag}
                  alt="Flag"
                  className="max-w-full max-h-full object-contain rounded-md drop-shadow-sm"
                />
                <div className="absolute bottom-3 right-4 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                  Click card to reveal name
                </div>
              </div>

              {/* Back: Details */}
              <div
                className="absolute w-full h-full backface-hidden rounded-2xl overflow-hidden shadow-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex flex-col items-center justify-center p-8 text-center"
                style={{ transform: 'rotateY(180deg)' }}
              >
                <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
                  {currentFlag.name}
                </h2>
                {currentFlag.aliases && currentFlag.aliases.length > 0 && (
                  <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-4 font-medium">
                    <span className="text-zinc-400 dark:text-zinc-500">aka:</span> {currentFlag.aliases.join(', ')}
                  </p>
                )}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 font-medium text-xs">
                    {currentFlag.continent}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium text-xs">
                    {currentFlag.category}
                  </span>
                  {currentFlag.country && (
                    <span className="px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-medium text-xs">
                      {currentFlag.country}
                    </span>
                  )}
                </div>
                {currentFlag.tags && currentFlag.tags.length > 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3">
                    {currentFlag.tags.map((tag, idx) => (
                      <span
                        key={`${tag}-${idx}`}
                        className="px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 text-[11px] font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="absolute bottom-3 right-4 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
                  Click card to hide name
                </div>
              </div>
            </motion.div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center gap-6">
            <button
              onClick={handlePrev}
              disabled={filteredFlags.length <= 1}
              aria-label="Previous flag"
              className="p-3.5 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-zinc-600 dark:text-zinc-300 font-medium text-sm">
              {currentIndex + 1} / {filteredFlags.length}
            </div>

            <button
              onClick={handleNext}
              disabled={filteredFlags.length <= 1}
              aria-label="Next flag"
              className="p-3.5 rounded-full bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
