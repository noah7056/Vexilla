import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Check,
  X,
  Globe2,
  Layers,
  RotateCcw,
  Trophy,
  Sparkles,
  SlidersHorizontal,
  Play,
  ArrowLeft,
  Eye,
  ImageIcon,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Flame,
  MapPin,
  Maximize2
} from 'lucide-react';
import { PROVINCE_COUNTRIES  } from '../data/flags';
import { useFlags } from '../contexts/FlagsContext';
import { Flag, Category, Continent, FlagStatus, QuizConfig, QuizMode, QuizQuestionResult, ALL_CATEGORIES, ALL_CONTINENTS, ALL_STATUSES } from '../types';
import { FlagImage } from './FlagImage';
import { FlagModal } from './FlagModal';
import { CategoryFilterChips } from './CategoryFilterChips';
import { AdditionalFiltersBar } from './AdditionalFiltersBar';

interface QuizProps {
  onAnswer: (flagId: string, isCorrect: boolean) => void;
}

const QUESTION_COUNT_OPTIONS: (number | 'all')[] = [5, 10, 20, 30, 50, 'all'];
const OPTION_COUNT_CHOICES: (2 | 4 | 6)[] = [2, 4, 6];

export function Quiz({ onAnswer }: QuizProps) {
  const { flags: FLAGS } = useFlags();
  // Quiz screen state: 'config' | 'active' | 'results'
  const [gameState, setGameState] = useState<'config' | 'active' | 'results'>('config');

  // Customization Configuration State
  const [config, setConfig] = useState<QuizConfig>({
    mode: 'flag-to-name',
    questionCount: 10,
    categories: [...ALL_CATEGORIES],
    continents: [...ALL_CONTINENTS],
    selectedSubOptions: {},
    statuses: ['All'],
    tags: [],
    optionCount: 4,
    showCountryHintAfterAnswer: true,
    showCountryInQuestion: false,
    showCountryInOptions: false,
    waitTimeAfterAnswer: 1000,
  });

  // Active Quiz State
  const [questionPool, setQuestionPool] = useState<Flag[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentOptions, setCurrentOptions] = useState<Flag[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [history, setHistory] = useState<QuizQuestionResult[]>([]);
  const [focusedFlag, setFocusedFlag] = useState<Flag | null>(null);

  // Calculate category matching pool based on current config categories & sub-options
  const categoryFlagsPool = useMemo(() => {
    return FLAGS.filter((flag) => {
      const isAllCat = config.categories.includes('All' as any) || config.categories.length === ALL_CATEGORIES.length;
      if (!isAllCat && !config.categories.includes(flag.category)) {
        return false;
      }

      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Organizations', 'Concepts'].includes(flag.category)) {
        const activeSub = config.selectedSubOptions?.[flag.category];
        if (activeSub && activeSub.length > 0) {
          if (!flag.country || !activeSub.includes(flag.country)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [config.categories, config.selectedSubOptions, FLAGS]);

  // Calculate matching flags pool based on current config
  const matchingFlags = useMemo(() => {
    return FLAGS.filter((flag) => {
      // 1. Categories
      const isAllCat = config.categories.includes('All' as any) || config.categories.length === ALL_CATEGORIES.length;
      if (!isAllCat && !config.categories.includes(flag.category)) {
        return false;
      }

      // 2. Sub-options
      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Organizations', 'Concepts'].includes(flag.category)) {
        const activeSub = config.selectedSubOptions?.[flag.category];
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
      if (!isGlobalCat) {
        const isAllCont = config.continents.includes('All' as any) || config.continents.length === ALL_CONTINENTS.length;
        if (!isAllCont && flag.continent && !config.continents.includes(flag.continent)) {
          return false;
        }
      }

      // 4. Statuses
      if (config.statuses && !config.statuses.includes('All') && config.statuses.length > 0) {
        const flagStatus = flag.status || 'unspecified';
        if (!config.statuses.includes(flagStatus as any)) {
          return false;
        }
      }

      // 5. Tags
      if (config.tags && config.tags.length > 0) {
        const hasAllTags = config.tags.every((t) =>
          flag.tags && flag.tags.some((ft) => ft.toLowerCase().includes(t.toLowerCase()))
        );
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }, [config.categories, config.continents, config.selectedSubOptions, config.statuses, config.tags, FLAGS]);

  // Handle Preset configurations
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'quick-world':
        setConfig((prev) => ({
          ...prev,
          mode: 'flag-to-name',
          questionCount: 10,
          categories: ['Sovereign States'],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          optionCount: 4,
        }));
        break;
      case 'name-to-flag':
        setConfig((prev) => ({
          ...prev,
          mode: 'name-to-flag',
          questionCount: 10,
          categories: ['Sovereign States'],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          optionCount: 4,
        }));
        break;
      case 'us-states':
        setConfig((prev) => ({
          ...prev,
          mode: 'flag-to-name',
          questionCount: 20,
          categories: ['US States'],
          continents: ['North America'],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          optionCount: 4,
        }));
        break;
      case 'fictional':
        setConfig((prev) => ({
          ...prev,
          mode: 'flag-to-name',
          questionCount: 15,
          categories: ['Fictional'],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          optionCount: 4,
        }));
        break;
      case 'provinces':
        setConfig((prev) => ({
          ...prev,
          mode: 'flag-to-name',
          questionCount: 15,
          categories: ['Provinces & Territories'],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          optionCount: 4,
        }));
        break;
      case 'all-in':
        setConfig((prev) => ({
          ...prev,
          mode: 'flag-to-name',
          questionCount: 25,
          categories: [...ALL_CATEGORIES],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          optionCount: 4,
        }));
        break;
      case 'expert-6':
        setConfig((prev) => ({
          ...prev,
          mode: 'flag-to-name',
          questionCount: 15,
          categories: ['Sovereign States', 'Non-Sovereign & Unrecognized'],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          optionCount: 6,
        }));
        break;
    }
  };

  // Toggle Category
  const toggleCategory = (cat: Category) => {
    setConfig((prev) => {
      const isAll = prev.categories.length === ALL_CATEGORIES.length || prev.categories.includes('All' as any);
      if (isAll) {
        return { ...prev, categories: [cat] };
      }
      const exists = prev.categories.includes(cat);
      if (exists) {
        const next = prev.categories.filter((c) => c !== cat);
        return { ...prev, categories: next.length === 0 ? [...ALL_CATEGORIES] : next };
      } else {
        const next = [...prev.categories, cat];
        return { ...prev, categories: next.length === ALL_CATEGORIES.length ? [...ALL_CATEGORIES] : next };
      }
    });
  };

  // Toggle Sub-Option
  const toggleSubOption = (category: string, option: string) => {
    setConfig((prev) => {
      const currentMap = prev.selectedSubOptions || {};
      const currentList = currentMap[category] || [];
      const updatedList = currentList.includes(option)
        ? currentList.filter((o) => o !== option)
        : [...currentList, option];
      
      const newSubOptions = { ...currentMap, [category]: updatedList };
      const cat = category as Category;
      const isAll = prev.categories.length === ALL_CATEGORIES.length || prev.categories.includes('All' as any);
      const categories = isAll ? [cat] : (prev.categories.includes(cat) ? prev.categories : [...prev.categories, cat]);

      return {
        ...prev,
        categories,
        selectedSubOptions: newSubOptions,
      };
    });
  };

  const handleClearSubOptions = (cat: string) => {
    setConfig((prev) => {
      const newSub = { ...prev.selectedSubOptions };
      delete newSub[cat];
      return {
        ...prev,
        selectedSubOptions: newSub,
      };
    });
  };

  // Select all / clear categories
  const selectAllCategories = () => {
    setConfig((prev) => ({ ...prev, categories: [...ALL_CATEGORIES], selectedSubOptions: {} }));
  };

  // Toggle Continent
  const toggleContinent = (cont: Continent) => {
    setConfig((prev) => {
      const isAll = prev.continents.length === ALL_CONTINENTS.length || prev.continents.includes('All' as any);
      if (isAll) {
        return { ...prev, continents: [cont] };
      }
      const exists = prev.continents.includes(cont);
      if (exists) {
        const next = prev.continents.filter((c) => c !== cont);
        return { ...prev, continents: next.length === 0 ? [...ALL_CONTINENTS] : next };
      } else {
        const next = [...prev.continents, cont];
        return { ...prev, continents: next.length === ALL_CONTINENTS.length ? [...ALL_CONTINENTS] : next };
      }
    });
  };

  // Select all continents
  const selectAllContinents = () => {
    setConfig((prev) => ({ ...prev, continents: [...ALL_CONTINENTS] }));
  };

  // Toggle Status
  const toggleStatus = (status: FlagStatus | 'unspecified') => {
    setConfig((prev) => {
      const current = prev.statuses || ['All'];
      if (current.includes('All')) {
        return { ...prev, statuses: [status] };
      }
      const exists = current.includes(status);
      if (exists) {
        const next = current.filter((s) => s !== status);
        return { ...prev, statuses: next.length === 0 ? ['All'] : next };
      } else {
        const next = [...current, status];
        return { ...prev, statuses: next.length === ALL_STATUSES.length + 1 ? ['All'] : next };
      }
    });
  };

  // Select all statuses
  const selectAllStatuses = () => {
    setConfig((prev) => ({ ...prev, statuses: ['All'] }));
  };

  // Toggle tag
  const toggleTag = (tag: string) => {
    setConfig((prev) => {
      const current = prev.tags || [];
      const updated = current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag];
      return { ...prev, tags: updated };
    });
  };

  // Clear tags
  const clearTags = () => {
    setConfig((prev) => ({ ...prev, tags: [] }));
  };

  const clearAllSubmenuFilters = () => {
    setConfig((prev) => ({
      ...prev,
      selectedSubOptions: {},
      continents: [...ALL_CONTINENTS],
      statuses: ['All'],
      tags: [],
    }));
  };

  const hasCustomFilters =
    config.categories.length !== ALL_CATEGORIES.length ||
    Object.values(config.selectedSubOptions || {}).some((arr: string[]) => arr && arr.length > 0) ||
    config.continents.length !== ALL_CONTINENTS.length ||
    (config.statuses && !config.statuses.includes('All')) ||
    (config.tags && config.tags.length > 0);

  const resetAllFilters = () => {
    setConfig((prev) => ({
      ...prev,
      categories: [...ALL_CATEGORIES],
      continents: [...ALL_CONTINENTS],
      selectedSubOptions: {},
      statuses: ['All'],
      tags: [],
    }));
  };

  // Start Quiz
  const handleStartQuiz = () => {
    if (matchingFlags.length === 0) return;

    // Shuffle flags
    const shuffled = [...matchingFlags].sort(() => Math.random() - 0.5);
    const count =
      config.questionCount === 'all'
        ? shuffled.length
        : Math.min(config.questionCount, shuffled.length);

    const questions = shuffled.slice(0, count);

    setQuestionPool(questions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsAnimating(false);
    setStreak(0);
    setBestStreak(0);
    setHistory([]);
    setGameState('active');
  };

  const currentFlag = questionPool[currentQuestionIndex];

  // Populate options whenever currentFlag changes
  useEffect(() => {
    if (gameState !== 'active' || !currentFlag) return;

    const neededWrong = config.optionCount - 1;

    // Prioritize wrong options from matching pool first for higher relevance
    let potentialWrong = matchingFlags.filter((f) => f.id !== currentFlag.id);
    if (potentialWrong.length < neededWrong) {
      potentialWrong = FLAGS.filter((f) => f.id !== currentFlag.id);
    }

    const wrongOptions = potentialWrong
      .sort(() => Math.random() - 0.5)
      .slice(0, neededWrong);

    const allOptions = [...wrongOptions, currentFlag].sort(() => Math.random() - 0.5);
    setCurrentOptions(allOptions);
    setSelectedAnswer(null);
  }, [currentQuestionIndex, gameState, currentFlag, matchingFlags, config.optionCount]);

  // Handle Option Selection
  const handleSelectAnswer = (flagId: string) => {
    if (selectedAnswer || isAnimating || !currentFlag) return;

    setSelectedAnswer(flagId);
    setIsAnimating(true);

    const isCorrect = flagId === currentFlag.id;

    if (isCorrect) {
      setStreak((prev) => {
        const next = prev + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }

    // Record result for this question
    setHistory((prev) => [
      ...prev,
      {
        flag: currentFlag,
        selectedFlagId: flagId,
        isCorrect,
      },
    ]);

    // Record global progress
    onAnswer(currentFlag.id, isCorrect);

    // Advance to next question or end
    setTimeout(() => {
      setIsAnimating(false);
      if (currentQuestionIndex + 1 < questionPool.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setGameState('results');
      }
    }, config.waitTimeAfterAnswer || 1000);
  };

  // Exit Quiz Early back to config
  const handleQuitToConfig = () => {
    setGameState('config');
  };

  // Restart same quiz
  const handlePlayAgain = () => {
    handleStartQuiz();
  };

  // ----------------------------------------------------
  // 1. CONFIGURATION SCREEN
  // ----------------------------------------------------
  if (gameState === 'config') {
    const totalMatching = matchingFlags.length;
    const canStart = totalMatching >= 2;

    return (
      <div className="w-full max-w-4xl mx-auto py-6 px-4">
        {/* Header */}
        <div className="mb-6 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-2.5 justify-center sm:justify-start">
              <SlidersHorizontal className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              Customize Quiz
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              Select your preferred mode, categories, question length, and difficulty.
            </p>
          </div>

          {/* Quick Presets Bar */}
          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-end">
            <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 self-center mr-1">
              Presets:
            </span>
            <button
              onClick={() => applyPreset('quick-world')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 dark:hover:text-indigo-300 transition-colors"
            >
              ⚡ Quick World (10)
            </button>
            <button
              onClick={() => applyPreset('name-to-flag')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 dark:hover:text-indigo-300 transition-colors"
            >
              🖼️ Name to Flag
            </button>
            <button
              onClick={() => applyPreset('us-states')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 dark:hover:text-indigo-300 transition-colors"
            >
              🇺🇸 US States
            </button>
            <button
              onClick={() => applyPreset('fictional')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 dark:hover:text-indigo-300 transition-colors"
            >
              ✨ Fictional
            </button>
            <button
              onClick={() => applyPreset('all-in')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 dark:hover:text-indigo-300 transition-colors"
            >
              🌍 All Categories
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Quiz Type / Mode */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 mb-3">
                1. Quiz Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, mode: 'flag-to-name' }))}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all ${
                    config.mode === 'flag-to-name'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-zinc-900 dark:text-white ring-2 ring-indigo-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      config.mode === 'flag-to-name'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Flag → Guess Name</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Show flag image, pick the matching country or territory name.
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConfig((prev) => ({ ...prev, mode: 'name-to-flag' }))}
                  className={`flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all ${
                    config.mode === 'name-to-flag'
                      ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-zinc-900 dark:text-white ring-2 ring-indigo-500/20'
                      : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg ${
                      config.mode === 'name-to-flag'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Name → Guess Flag</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      Show territory name, choose the correct flag from images.
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* 2. Categories & Filters */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-700/60">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  2. Question Pool & Filters
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                    {totalMatching} flags match
                  </span>
                  {hasCustomFilters && (
                    <button
                      type="button"
                      onClick={resetAllFilters}
                      className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                      title="Clear all active filters"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Clear All
                    </button>
                  )}
                </div>
              </div>

              {/* Category Filter Chips */}
              <CategoryFilterChips
                selectedCategories={config.categories.length === ALL_CATEGORIES.length ? ['All', ...config.categories] : config.categories}
                onToggleCategory={toggleCategory}
                onSelectAllCategories={selectAllCategories}
                selectedSubOptions={config.selectedSubOptions || {}}
                onToggleSubOption={toggleSubOption}
                onClearSubOptions={handleClearSubOptions}
                flagsPool={FLAGS}
                title="Categories"
                showAllOption={true}
              />

              {/* Additional Filters Bar (Continents, Statuses, Tags) */}
              <AdditionalFiltersBar
                flagsPool={categoryFlagsPool}
                selectedContinents={config.continents.length === ALL_CONTINENTS.length ? ['All', ...config.continents] : config.continents}
                onToggleContinent={toggleContinent}
                onSelectAllContinents={selectAllContinents}
                selectedStatuses={config.statuses || ['All']}
                onToggleStatus={toggleStatus}
                onSelectAllStatuses={selectAllStatuses}
                selectedTags={config.tags || []}
                onToggleTag={toggleTag}
                onClearTags={clearTags}
                selectedSubOptions={config.selectedSubOptions || {}}
                onRemoveSubOption={toggleSubOption}
                onClearAllSubmenuFilters={clearAllSubmenuFilters}
              />
            </div>
          </div>

          {/* Right Summary & Settings Column */}
          <div className="space-y-6">
            {/* 4. Number of Questions & Choices */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-5">
              {/* Question Count */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 mb-2.5">
                  4. Number of Questions
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {QUESTION_COUNT_OPTIONS.map((count) => {
                    const isSelected = config.questionCount === count;
                    const displayLabel = count === 'all' ? `All (${totalMatching})` : `${count}`;
                    return (
                      <button
                        key={String(count)}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, questionCount: count }))}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        {displayLabel}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Option Count */}
              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700/60">
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 mb-2.5">
                  5. Choices per Question
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {OPTION_COUNT_CHOICES.map((opts) => {
                    const isSelected = config.optionCount === opts;
                    return (
                      <button
                        key={opts}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, optionCount: opts }))}
                        className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                            : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                        }`}
                      >
                        {opts} Options
                      </button>
                    );
                  })}
                </div>
                <div className="text-[11px] text-zinc-400 dark:text-zinc-400 mt-2">
                  {config.optionCount === 2 && '⚡ 50/50 Rapid Mode'}
                  {config.optionCount === 4 && '🎯 Standard 4-choice Multiple Choice'}
                  {config.optionCount === 6 && '🔥 6-choice Challenge Mode'}
                </div>
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm col-span-1 md:col-span-2 space-y-5">
              <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                Advanced Settings
              </div>
              
              <div className="space-y-4">
                {/* Wait Time */}
                <div>
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
                    Wait Time Between Questions
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[500, 1000, 1500, 2000].map((ms) => {
                      const isSelected = (config.waitTimeAfterAnswer || 1000) === ms;
                      return (
                        <button
                          key={ms}
                          type="button"
                          onClick={() => setConfig(prev => ({ ...prev, waitTimeAfterAnswer: ms }))}
                          className={`py-1.5 px-3 text-xs font-semibold rounded-lg border transition-all ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                              : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                          }`}
                        >
                          {ms / 1000}s
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Toggles */}
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCountryHintAfterAnswer ?? true}
                      onChange={(e) => setConfig(prev => ({ ...prev, showCountryHintAfterAnswer: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 rounded border-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Show parent country/media hint after answering
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCountryInQuestion ?? false}
                      onChange={(e) => setConfig(prev => ({ ...prev, showCountryInQuestion: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 rounded border-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Always show parent country/media in question
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.showCountryInOptions ?? false}
                      onChange={(e) => setConfig(prev => ({ ...prev, showCountryInOptions: e.target.checked }))}
                      className="w-4 h-4 text-indigo-600 rounded border-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      Always show parent country/media in all options
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Launch Action Card */}
            <div className="bg-gradient-to-br from-indigo-50/70 to-white dark:from-zinc-800 dark:to-zinc-900 p-5 rounded-2xl border border-indigo-100 dark:border-zinc-700 shadow-sm flex flex-col justify-between">
              <div className="mb-4">
                <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  Quiz Ready
                </div>
                <div className="text-xl font-bold text-zinc-900 dark:text-white mt-1">
                  {totalMatching} Flags Available
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                  {config.questionCount === 'all'
                    ? `Playing all ${totalMatching} matching questions`
                    : `Generating ${Math.min(
                        typeof config.questionCount === 'number' ? config.questionCount : totalMatching,
                        totalMatching
                      )} questions with ${config.optionCount} choices each`}
                </p>
              </div>

              {!canStart && (
                <div className="text-xs text-rose-500 dark:text-rose-400 font-medium mb-3 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 flex-shrink-0" />
                  Select at least one category & continent with flags.
                </div>
              )}

              <button
                type="button"
                onClick={handleStartQuiz}
                disabled={!canStart}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all"
              >
                <Play className="w-4 h-4 fill-white" />
                Start Custom Quiz
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. ACTIVE QUIZ SCREEN
  // ----------------------------------------------------
  if (gameState === 'active' && currentFlag) {
    const totalQuestions = questionPool.length;
    const progressPercent = Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100);

    return (
      <div className="flex flex-col items-center w-full max-w-3xl mx-auto py-5 px-4 h-full">
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between gap-3 mb-4">
          <button
            onClick={handleQuitToConfig}
            className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Customize</span>
          </button>

          {/* Question Index & Streak */}
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            {streak > 1 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-bold text-xs shadow-xs border border-amber-200/60 dark:border-amber-800/60">
                <Flame className="w-3.5 h-3.5 fill-amber-500" />
                {streak} streak!
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
              {currentFlag.continent}
            </span>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mb-6">
          <motion.div
            className="bg-indigo-600 h-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Dynamic Question Presentation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentQuestionIndex}-${currentFlag.id}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="w-full flex flex-col items-center"
          >
            {/* MODE 1: FLAG -> NAME */}
            {config.mode === 'flag-to-name' && (
              <>
                <div className="text-center mb-4">
                  <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Which territory does this flag represent?
                  </div>
                </div>

                {/* Flag Canvas Card */}
                <button
                  type="button"
                  onClick={() => setFocusedFlag(currentFlag)}
                  className="group relative w-full aspect-[3/2] sm:aspect-video max-w-xl mb-6 rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center p-6 cursor-zoom-in transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
                >
                  <FlagImage
                    flag={currentFlag}
                    alt="Guess the flag"
                    className="max-w-full max-h-full object-contain rounded-md drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 p-2 bg-black/40 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </button>

                {/* Text Options Grid */}
                <div
                  className={`grid gap-3 w-full max-w-2xl ${
                    config.optionCount === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : config.optionCount === 6
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {currentOptions.map((option, idx) => {
                    const isSelected = selectedAnswer === option.id;
                    const isCorrect = option.id === currentFlag.id;

                    let stateClass =
                      'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-zinc-800 dark:text-zinc-100';

                    if (selectedAnswer) {
                      if (isCorrect) {
                        stateClass =
                          'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                      } else if (isSelected) {
                        stateClass =
                          'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300 font-bold';
                      } else {
                        stateClass =
                          'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-40 text-zinc-400 dark:text-zinc-500';
                      }
                    }

                    const optionLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectAnswer(option.id)}
                        disabled={!!selectedAnswer}
                        className={`relative flex items-center justify-between p-4 rounded-xl border-2 text-left font-medium text-sm sm:text-base transition-all select-none shadow-xs ${stateClass}`}
                      >
                        <div className="flex items-start gap-2.5 pr-2 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {optionLetters[idx] || idx + 1}
                          </span>
                          <span className="whitespace-normal break-words flex-1 leading-snug">
                            {option.name}
                            {(config.showCountryInOptions || ((config.showCountryHintAfterAnswer ?? true) && selectedAnswer && (isCorrect || isSelected))) && ['Provinces & Territories', 'Fictional', 'Indigenous & Cultural Populations'].includes(option.category) && option.country && (
                              <span className="block text-xs opacity-80 mt-0.5">({option.country})</span>
                            )}
                          </span>
                        </div>
                        {selectedAnswer && isCorrect && (
                          <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 ml-2" />
                        )}
                        {selectedAnswer && isSelected && !isCorrect && (
                          <X className="w-5 h-5 text-rose-500 flex-shrink-0 ml-2" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}

            {/* MODE 2: NAME -> FLAG */}
            {config.mode === 'name-to-flag' && (
              <>
                <div className="text-center mb-6">
                  <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-1.5">
                    Which flag belongs to:
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    {currentFlag.name}
                  </h3>
                  <div className="flex items-center justify-center gap-2 mt-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                      {currentFlag.continent} • {currentFlag.category}
                      {config.showCountryInQuestion && ['Provinces & Territories', 'Fictional', 'Indigenous & Cultural Populations'].includes(currentFlag.category) && currentFlag.country && ` • ${currentFlag.country}`}
                    </span>
                  </div>
                </div>

                {/* Flag Image Cards Grid */}
                <div
                  className={`grid gap-4 w-full max-w-2xl ${
                    config.optionCount === 2
                      ? 'grid-cols-2'
                      : config.optionCount === 6
                      ? 'grid-cols-2 sm:grid-cols-3'
                      : 'grid-cols-2'
                  }`}
                >
                  {currentOptions.map((option) => {
                    const isSelected = selectedAnswer === option.id;
                    const isCorrect = option.id === currentFlag.id;

                    let borderClass =
                      'border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 bg-white dark:bg-zinc-800';

                    if (selectedAnswer) {
                      if (isCorrect) {
                        borderClass =
                          'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/50 ring-4 ring-emerald-500/20';
                      } else if (isSelected) {
                        borderClass =
                          'border-rose-500 bg-rose-50/50 dark:bg-rose-950/50 ring-4 ring-rose-500/20';
                      } else {
                        borderClass =
                          'border-zinc-200 dark:border-zinc-700 opacity-40 bg-zinc-50 dark:bg-zinc-800';
                      }
                    }

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => handleSelectAnswer(option.id)}
                        disabled={!!selectedAnswer}
                        className={`group relative aspect-[3/2] rounded-2xl border-2 overflow-hidden p-3 flex items-center justify-center shadow-xs transition-all select-none ${borderClass}`}
                      >
                        <FlagImage
                          flag={option}
                          alt="Flag choice"
                          className="max-w-full max-h-full object-contain rounded drop-shadow-sm"
                        />

                        {/* Expand/Zoom Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedFlag(option);
                          }}
                          className="absolute top-2 left-2 p-1.5 bg-black/40 hover:bg-black/60 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>

                        {/* Status Badges */}
                        {selectedAnswer && isCorrect && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md z-10">
                            <Check className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}
                        {selectedAnswer && isSelected && !isCorrect && (
                          <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md z-10">
                            <X className="w-4 h-4 stroke-[3]" />
                          </div>
                        )}

                        {/* Name hint when answer is revealed or if always show in options */}
                        {(() => {
                          const isSubCategory = ['Provinces & Territories', 'Fictional', 'Indigenous & Cultural Populations', 'Pirate Flags', 'Organizations'].includes(option.category);
                          const shouldShowCountry = isSubCategory && option.country && (config.showCountryInOptions || (selectedAnswer && (config.showCountryHintAfterAnswer ?? true) && (isCorrect || isSelected)));
                          
                          const showBox = selectedAnswer || (config.showCountryInOptions && shouldShowCountry);

                          if (!showBox) return null;

                          return (
                            <div className="absolute bottom-1 inset-x-2 bg-black/80 backdrop-blur-sm text-white text-[10px] sm:text-[11px] font-medium py-0.5 px-1.5 rounded text-center leading-tight whitespace-normal break-words z-10">
                              {selectedAnswer && <span>{option.name}</span>}
                              {shouldShowCountry && (
                                <span className={`block text-[9px] sm:text-[10px] opacity-80 ${selectedAnswer ? 'mt-0.5' : ''}`}>
                                  {option.country}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {focusedFlag && (
          <FlagModal flag={focusedFlag} onClose={() => setFocusedFlag(null)} />
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // 3. RESULTS & SUMMARY SCREEN
  // ----------------------------------------------------
  if (gameState === 'results') {
    const totalQuestions = history.length;
    const correctCount = history.filter((h) => h.isCorrect).length;
    const accuracy = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    return (
      <div className="w-full max-w-3xl mx-auto py-8 px-4 flex flex-col items-center">
        {/* Results Card */}
        <div className="w-full bg-white dark:bg-zinc-800 rounded-3xl p-6 sm:p-8 border border-zinc-200 dark:border-zinc-700 shadow-xl text-center flex flex-col items-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60 flex items-center justify-center mb-3">
            <Trophy className="w-8 h-8" />
          </div>

          <h2 className="text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Quiz Complete!
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 mb-6">
            {config.mode === 'flag-to-name' ? 'Flag → Name Quiz' : 'Name → Flag Quiz'} •{' '}
            {config.categories.join(', ')}
          </p>

          {/* Metric Badges */}
          <div className="grid grid-cols-3 gap-3 w-full mb-6">
            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Score</div>
              <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                {correctCount} / {totalQuestions}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Accuracy</div>
              <div
                className={`text-2xl sm:text-3xl font-bold ${
                  accuracy >= 80
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : accuracy >= 50
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {accuracy}%
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700">
              <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Best Streak</div>
              <div className="text-2xl sm:text-3xl font-bold text-amber-500 dark:text-amber-400 flex items-center justify-center gap-1">
                <Flame className="w-5 h-5 fill-amber-500" />
                {bestStreak}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <button
              onClick={handlePlayAgain}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors shadow-sm shadow-indigo-500/20"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again (Same Settings)
            </button>

            <button
              onClick={handleQuitToConfig}
              className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-800 dark:text-white font-semibold text-sm transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Customize New Quiz
            </button>
          </div>
        </div>

        {/* Detailed Question Review List */}
        <div className="w-full bg-white dark:bg-zinc-800 rounded-2xl p-5 border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h3 className="font-bold text-zinc-900 dark:text-white text-sm mb-3">Round Breakdown</h3>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-700/60">
            {history.map((item, index) => {
              const selectedFlag = FLAGS.find((f) => f.id === item.selectedFlagId);
              return (
                <div
                  key={`${item.flag.id}-${index}`}
                  className="py-3 flex items-center justify-between gap-3 text-xs"
                >
                  <button
                    type="button"
                    onClick={() => setFocusedFlag(item.flag)}
                    className="flex items-center gap-3 min-w-0 text-left group hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <FlagImage
                      flag={item.flag}
                      alt={item.flag.name}
                      className="w-10 h-6 object-cover rounded shadow-xs border border-zinc-200 dark:border-zinc-600 flex-shrink-0 group-hover:border-indigo-400 transition-colors"
                    />
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {item.flag.name}
                      </div>
                      <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                        {item.flag.continent} • {item.flag.category}
                        {['Provinces & Territories', 'Fictional', 'Indigenous & Cultural Populations'].includes(item.flag.category) && item.flag.country && ` • ${item.flag.country}`}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.isCorrect ? (
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        Correct
                      </span>
                    ) : (
                      <div className="text-right">
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold justify-end">
                          <XCircle className="w-4 h-4" />
                          Missed
                        </span>
                        {selectedFlag && (
                          <button
                            type="button"
                            onClick={() => setFocusedFlag(selectedFlag)}
                            className="text-[10px] text-zinc-400 dark:text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer block mt-0.5 text-right transition-colors"
                            title="Click to view the flag you chose"
                          >
                            Chose: {selectedFlag.name}
                            {['Provinces & Territories', 'Fictional', 'Indigenous & Cultural Populations'].includes(selectedFlag.category) && selectedFlag.country ? `, ${selectedFlag.country}` : ''}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {focusedFlag && (
          <FlagModal
            flag={focusedFlag}
            flagsList={history.map((h) => h.flag)}
            onClose={() => setFocusedFlag(null)}
            onSelectFlag={(f) => setFocusedFlag(f)}
          />
        )}
      </div>
    );
  }

  return null;
}
