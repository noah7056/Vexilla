import { useState, useEffect, useMemo, useRef } from 'react';
import type { ReactNode } from 'react';
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
  Maximize2,
  Map as MapIcon,
  Compass,
  Scale,
  Save,
  Trash2,
  Pencil,
  Loader2,
  Navigation
} from 'lucide-react';
import { PROVINCE_COUNTRIES  } from '../data/flags';
import { useFlags } from '../contexts/FlagsContext';
import { Flag, Category, Continent, FlagStatus, FlagProgress, MasteryLevel, QuizConfig, QuizMode, QuizPreset, QuizQuestionResult, ALL_CATEGORIES, ALL_CONTINENTS, ALL_STATUSES, getFlagMasteryLevel } from '../types';
import { FlagImage } from './FlagImage';
import { FlagModal } from './FlagModal';
import { CategoryFilterChips } from './CategoryFilterChips';
import { AdditionalFiltersBar } from './AdditionalFiltersBar';
import { resolveGeo } from '../lib/geo';
import { haversineKm, reverseGeocodeCountry, matchesExpectedCountry, scoreMapGuess, MapScore, MAP_VERDICT_LABEL } from '../lib/mapQuiz';
import { loadCustomPresets, saveCustomPreset, deleteCustomPreset, renameCustomPreset } from '../lib/quizPresets';
import { QuizGuessMap, QuizPromptMap } from './quiz/QuizMapPanel';

interface QuizProps {
  onAnswer: (flagId: string, isCorrect: boolean) => void;
  progress: Record<string, FlagProgress>;
}

const QUESTION_COUNT_OPTIONS: (number | 'all')[] = [5, 10, 20, 30, 50, 'all'];
const OPTION_COUNT_CHOICES: (2 | 4 | 6)[] = [2, 4, 6];

const MAP_MODES: QuizMode[] = ['flag-to-map', 'name-to-map', 'map-to-flag'];
const CHOICE_MODES: QuizMode[] = ['flag-to-name', 'name-to-flag', 'map-to-flag', 'flag-to-origin'];

export const MODE_LABEL: Record<QuizMode, string> = {
  'flag-to-name': 'Flag → Name',
  'name-to-flag': 'Name → Flag',
  'flag-to-map': 'Flag → Map Pin',
  'name-to-map': 'Name → Map Pin',
  'map-to-flag': 'Map → Flag',
  'true-false': 'True / False',
  'flag-to-origin': 'Flag → Continent / Country',
};

function modeCard(mode: QuizMode, current: QuizMode, onPick: (m: QuizMode) => void, icon: ReactNode, title: string, desc: string) {
  const active = current === mode;
  return (
    <button
      key={mode}
      type="button"
      onClick={() => onPick(mode)}
      className={`flex items-start gap-3.5 p-4 rounded-xl border-2 text-left transition-all ${
        active
          ? 'border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/40 text-zinc-900 dark:text-white ring-2 ring-indigo-500/20'
          : 'border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800'
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          active
            ? 'bg-indigo-600 text-white'
            : 'bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400'
        }`}
      >
        {icon}
      </div>
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {desc}
        </div>
      </div>
    </button>
  );
}

export function Quiz({ onAnswer, progress }: QuizProps) {
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
    mastery: ['all'],
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

  // Custom presets (localStorage, per-device)
  const [customPresets, setCustomPresets] = useState<QuizPreset[]>(() => loadCustomPresets());
  const [presetName, setPresetName] = useState('');
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Map-guess modes (flag-to-map / name-to-map)
  const [guess, setGuess] = useState<{ lat: number; lon: number } | null>(null);
  const [mapScore, setMapScore] = useState<MapScore | null>(null);
  const [checkingCountry, setCheckingCountry] = useState(false);

  // True/False mode: proposed name + whether the statement is true
  const [tfProposed, setTfProposed] = useState<{ name: string; isTrue: boolean; decoyId?: string } | null>(null);

  // Origin mode (continent or parent country): answer + string options
  const [originQ, setOriginQ] = useState<{ answer: string; options: string[]; kind: 'continent' | 'country' } | null>(null);

  // Calculate category matching pool based on current config categories & sub-options
  const categoryFlagsPool = useMemo(() => {
    return FLAGS.filter((flag) => {
      const isAllCat = config.categories.includes('All' as any) || config.categories.length === ALL_CATEGORIES.length;
      if (!isAllCat && !config.categories.includes(flag.category)) {
        return false;
      }

      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Languages', 'Pirate Flags', 'Organizations', 'Concepts'].includes(flag.category)) {
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
      if (['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+', 'Languages', 'Pirate Flags', 'Organizations', 'Concepts'].includes(flag.category)) {
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

      // 6. Map modes need a mappable location (Atlas geo resolution).
      // Forgiving scoring uses the pin + reverse-geocoded country, so
      // approximate parent-centroid pins are fine — only truly unmapped
      // or non-geo flags (fictional, languages, …) are excluded.
      if (MAP_MODES.includes(config.mode)) {
        if (!resolveGeo(flag)) {
          return false;
        }
      }

      // 7. Mastery (learning progress from Dictionary / Quiz attempts)
      const activeMastery = (config.mastery || ['all']).filter(
        (m): m is MasteryLevel => m !== 'all'
      );
      if (activeMastery.length > 0 && activeMastery.length < 4) {
        if (!activeMastery.includes(getFlagMasteryLevel(flag.id, progress))) {
          return false;
        }
      }

      return true;
    });
  }, [config.categories, config.continents, config.selectedSubOptions, config.statuses, config.tags, config.mode, config.mastery, progress, FLAGS]);

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
          mastery: ['all'],
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
          mastery: ['all'],
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
          mastery: ['all'],
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
          mastery: ['all'],
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
          mastery: ['all'],
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
          mastery: ['all'],
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
          mastery: ['all'],
          optionCount: 6,
        }));
        break;
      case 'map-world':
        setConfig((prev) => ({
          ...prev,
          mode: 'flag-to-map',
          questionCount: 10,
          categories: ['Sovereign States'],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          mastery: ['all'],
          optionCount: 4,
        }));
        break;
      case 'map-to-flag':
        setConfig((prev) => ({
          ...prev,
          mode: 'map-to-flag',
          questionCount: 10,
          categories: ['Sovereign States'],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          mastery: ['all'],
          optionCount: 4,
        }));
        break;
      case 'true-false':
        setConfig((prev) => ({
          ...prev,
          mode: 'true-false',
          questionCount: 15,
          categories: ['Sovereign States'],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          mastery: ['all'],
          optionCount: 2,
        }));
        break;
      case 'origin':
        setConfig((prev) => ({
          ...prev,
          mode: 'flag-to-origin',
          questionCount: 15,
          categories: [...ALL_CATEGORIES],
          continents: [...ALL_CONTINENTS],
          selectedSubOptions: {},
          statuses: ['All'],
          tags: [],
          mastery: ['all'],
          optionCount: 4,
        }));
        break;
    }
  };

  // Custom preset handlers (localStorage)
  const handleSavePreset = () => {
    const updated = saveCustomPreset(presetName || 'Untitled preset', config);
    setCustomPresets(updated);
    setPresetName('');
  };

  const handleDeletePreset = (id: string) => {
    setCustomPresets(deleteCustomPreset(id));
    if (renamingId === id) {
      setRenamingId(null);
      setRenameValue('');
    }
  };

  const handleRenamePreset = (id: string) => {
    const updated = renameCustomPreset(id, renameValue);
    setCustomPresets(updated);
    setRenamingId(null);
    setRenameValue('');
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

  // Toggle Mastery (mirrors Atlas/Dictionary multi-select)
  const toggleMastery = (level: MasteryLevel) => {
    setConfig((prev) => {
      const current = prev.mastery || ['all'];
      if (current.includes('all') || current.length === 0) {
        return { ...prev, mastery: [level] };
      }
      const exists = current.includes(level);
      if (exists) {
        const next = current.filter((m) => m !== level);
        return { ...prev, mastery: next.length === 0 ? ['all'] : next };
      } else {
        const next = [...current, level];
        return { ...prev, mastery: next.length === 4 ? ['all'] : next };
      }
    });
  };

  // Select all mastery
  const selectAllMastery = () => {
    setConfig((prev) => ({ ...prev, mastery: ['all'] }));
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
      mastery: ['all'],
    }));
  };

  const isMasteryCustom = (() => {
    const m = config.mastery || ['all'];
    const active = m.filter((x) => x !== 'all');
    return active.length > 0 && active.length < 4;
  })();

  const hasCustomFilters =
    config.categories.length !== ALL_CATEGORIES.length ||
    Object.values(config.selectedSubOptions || {}).some((arr: string[]) => arr && arr.length > 0) ||
    config.continents.length !== ALL_CONTINENTS.length ||
    (config.statuses && !config.statuses.includes('All')) ||
    (config.tags && config.tags.length > 0) ||
    isMasteryCustom;

  const resetAllFilters = () => {
    setConfig((prev) => ({
      ...prev,
      categories: [...ALL_CATEGORIES],
      continents: [...ALL_CONTINENTS],
      selectedSubOptions: {},
      statuses: ['All'],
      tags: [],
      mastery: ['all'],
    }));
  };

  // Frozen question pool for the active round (see handleStartQuiz).
  const poolRef = useRef<Flag[]>([]);

  // Start Quiz
  const handleStartQuiz = () => {
    if (matchingFlags.length === 0) return;

    // Snapshot the pool for the whole round: progress updates from answered
    // questions must not mutate the pool (or retrigger question setup) mid-quiz.
    poolRef.current = matchingFlags;

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
    setGuess(null);
    setMapScore(null);
    setCheckingCountry(false);
    setTfProposed(null);
    setOriginQ(null);
    setGameState('active');
  };

  const currentFlag = questionPool[currentQuestionIndex];

  // True location for map modes (pin + forgiving country scoring)
  const truth = currentFlag ? resolveGeo(currentFlag) : null;

  // Populate options whenever the current question changes. NOTE: this must
  // NOT depend on `matchingFlags` — every answered question updates progress,
  // which recomputes that array, and a re-run here would wipe the just-given
  // answer (score panel / selection) and reshuffle options. The round uses the
  // frozen poolRef snapshot instead.
  useEffect(() => {
    if (gameState !== 'active' || !currentFlag) return;

    const snapshot = poolRef.current.length > 0 ? poolRef.current : FLAGS;

    // Reset per-question transient state for the special modes
    setGuess(null);
    setMapScore(null);
    setCheckingCountry(false);
    setSelectedAnswer(null);

    // True/False: 50% true statement, else a decoy name from the pool
    if (config.mode === 'true-false') {
      const pool = snapshot.length > 1 ? snapshot : FLAGS;
      const showTrue = Math.random() < 0.5;
      if (showTrue) {
        setTfProposed({ name: currentFlag.name, isTrue: true });
      } else {
        const decoys = pool.filter((f) => f.id !== currentFlag.id);
        const decoy = decoys[Math.floor(Math.random() * decoys.length)];
        setTfProposed({
          name: decoy ? decoy.name : `${currentFlag.name} (Wrong)`,
          isTrue: false,
          decoyId: decoy?.id,
        });
      }
      return;
    }

    // Origin mode: ask parent country when the flag has one, else continent
    if (config.mode === 'flag-to-origin') {
      const pool = snapshot.length > 1 ? snapshot : FLAGS;
      if (currentFlag.country) {
        const countries = Array.from(
          new Set(pool.map((f) => f.country).filter((c): c is string => Boolean(c)))
        ).filter((c) => c !== currentFlag.country);
        const needed = config.optionCount - 1;
        const wrong = countries.sort(() => Math.random() - 0.5).slice(0, needed);
        // Fallback to continents if the pool has too few distinct countries
        let options = [...wrong, currentFlag.country as string];
        let kind: 'continent' | 'country' = 'country';
        if (options.length < 2) {
          const conts = [...ALL_CONTINENTS].filter((c) => c !== currentFlag.continent);
          const w = conts.sort(() => Math.random() - 0.5).slice(0, needed);
          options = [...w, currentFlag.continent || 'Global'];
          kind = 'continent';
        }
        setOriginQ({
          answer: currentFlag.country as string,
          options: options.sort(() => Math.random() - 0.5),
          kind,
        });
      } else {
        const conts = [...ALL_CONTINENTS].filter((c) => c !== currentFlag.continent);
        const needed = config.optionCount - 1;
        const wrong = conts.sort(() => Math.random() - 0.5).slice(0, needed);
        const answer = currentFlag.continent || 'Global';
        let options = [...wrong, answer];
        if (options.length < 2) options = [answer, 'Global'].filter((v, i, a) => a.indexOf(v) === i);
        setOriginQ({ answer, options: options.sort(() => Math.random() - 0.5), kind: 'continent' });
      }
      return;
    }

    // Map click modes use no multiple-choice options
    if (config.mode === 'flag-to-map' || config.mode === 'name-to-map') {
      setCurrentOptions([]);
      return;
    }

    const neededWrong = config.optionCount - 1;

    // Prioritize wrong options from matching pool first for higher relevance
    let potentialWrong = snapshot.filter((f) => f.id !== currentFlag.id);
    if (potentialWrong.length < neededWrong) {
      potentialWrong = FLAGS.filter((f) => f.id !== currentFlag.id);
    }

    const wrongOptions = potentialWrong
      .sort(() => Math.random() - 0.5)
      .slice(0, neededWrong);

    const allOptions = [...wrongOptions, currentFlag].sort(() => Math.random() - 0.5);
    setCurrentOptions(allOptions);
    setSelectedAnswer(null);
  }, [currentQuestionIndex, gameState, currentFlag, config.optionCount, config.mode]);

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

  // Shared manual advance (map modes reveal the answer on the map and let
  // the user study it before moving on — no auto timer there).
  const advanceToNext = () => {
    if (isAnimating) return;
    if (currentQuestionIndex + 1 < questionPool.length) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      setGameState('results');
    }
  };

  const recordResult = (result: QuizQuestionResult) => {
    setHistory((prev) => [...prev, result]);
    onAnswer(result.flag.id, result.isCorrect);
    if (result.isCorrect) {
      setStreak((prev) => {
        const next = prev + 1;
        setBestStreak((b) => Math.max(b, next));
        return next;
      });
    } else {
      setStreak(0);
    }
  };

  // Origin mode: string option selected
  const handleSelectOrigin = (option: string) => {
    if (selectedAnswer || isAnimating || !currentFlag || !originQ) return;
    setSelectedAnswer(option);
    setIsAnimating(true);
    const isCorrect = option === originQ.answer;
    recordResult({
      flag: currentFlag,
      selectedFlagId: option,
      isCorrect,
      originAnswer: originQ.answer,
    });
    setTimeout(() => {
      setIsAnimating(false);
      if (currentQuestionIndex + 1 < questionPool.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setGameState('results');
      }
    }, config.waitTimeAfterAnswer || 1000);
  };

  // True/False mode
  const handleTrueFalse = (answerTrue: boolean) => {
    if (selectedAnswer || isAnimating || !currentFlag || !tfProposed) return;
    setSelectedAnswer(answerTrue ? 'true' : 'false');
    setIsAnimating(true);
    const isCorrect = answerTrue === tfProposed.isTrue;
    recordResult({
      flag: currentFlag,
      selectedFlagId: tfProposed.decoyId || currentFlag.id,
      isCorrect,
      proposedName: tfProposed.name,
    });
    setTimeout(() => {
      setIsAnimating(false);
      if (currentQuestionIndex + 1 < questionPool.length) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else {
        setGameState('results');
      }
    }, config.waitTimeAfterAnswer || 1000);
  };

  // Map click modes: confirm the placed guess pin
  const handleConfirmMapGuess = async () => {
    if (!guess || !currentFlag || !truth || mapScore || checkingCountry || isAnimating) return;
    setCheckingCountry(true);
    const distanceKm = haversineKm(guess.lat, guess.lon, truth.lat, truth.lon);
    // Forgiving country check (reverse-geocode, cached). Any click inside
    // the right country counts — equivalent to border containment without
    // shipping polygon data. Falls back to pure distance when offline.
    let insideCountry = false;
    try {
      const reverse = await reverseGeocodeCountry(guess.lat, guess.lon);
      insideCountry = matchesExpectedCountry(reverse, currentFlag);
    } catch {
      insideCountry = false;
    }
    const score = scoreMapGuess(distanceKm, insideCountry);
    setCheckingCountry(false);
    setMapScore(score);
    recordResult({
      flag: currentFlag,
      selectedFlagId: '',
      isCorrect: score.isCorrect,
      distanceKm,
      insideCountry,
      guessLat: guess.lat,
      guessLon: guess.lon,
    });
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
              onClick={() => applyPreset('map-world')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 dark:hover:text-indigo-300 transition-colors"
            >
              🗺️ Map Pins
            </button>
            <button
              onClick={() => applyPreset('true-false')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 dark:hover:text-indigo-300 transition-colors"
            >
              ⚖️ True/False
            </button>
            <button
              onClick={() => applyPreset('all-in')}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-zinc-700 dark:hover:text-indigo-300 transition-colors"
            >
              🌍 All Categories
            </button>
          </div>
        </div>

        {/* Custom presets: save the current configuration, rename / delete */}
        <div className="mb-6 bg-white dark:bg-zinc-800 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Save className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400">
              My Presets ({customPresets.length})
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSavePreset();
                }
              }}
              placeholder="Name this setup (e.g. Europe capitals practice)…"
              maxLength={60}
              className="flex-1 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={handleSavePreset}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-1.5 flex-shrink-0"
            >
              <Save className="w-4 h-4" />
              Save current setup
            </button>
          </div>
          {customPresets.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              No custom presets yet — tweak the format, filters and lengths below, then save them here for one-tap replay.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {customPresets.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-700/70"
                >
                  {renamingId === p.id ? (
                    <>
                      <input
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleRenamePreset(p.id);
                          } else if (e.key === 'Escape') {
                            setRenamingId(null);
                            setRenameValue('');
                          }
                        }}
                        autoFocus
                        maxLength={60}
                        className="flex-1 min-w-0 px-2 py-1 rounded-lg border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-zinc-800 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                      />
                      <button
                        type="button"
                        onClick={() => handleRenamePreset(p.id)}
                        className="p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/60"
                        title="Save name"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRenamingId(null); setRenameValue(''); }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        title="Cancel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...p.config })}
                        className="flex-1 min-w-0 text-left"
                        title={`Apply: ${MODE_LABEL[p.config.mode]} • ${typeof p.config.questionCount === 'number' ? p.config.questionCount : 'All'} questions`}
                      >
                        <span className="block text-sm font-semibold text-zinc-800 dark:text-zinc-100 truncate">
                          {p.name}
                        </span>
                        <span className="block text-[11px] text-zinc-400 dark:text-zinc-500 truncate">
                          {MODE_LABEL[p.config.mode]} • {typeof p.config.questionCount === 'number' ? `${p.config.questionCount} Qs` : 'All Qs'} • {p.config.categories.length} categories
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRenamingId(p.id); setRenameValue(p.name); }}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-zinc-700"
                        title="Rename preset"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePreset(p.id)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                        title="Delete preset"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Configuration Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Question Pool & Filters */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-700/60">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                  1. Question Pool & Filters
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

              {/* Additional Filters Bar (Continents, Statuses, Tags, Mastery) */}
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
                selectedMastery={config.mastery || ['all']}
                onToggleMastery={toggleMastery}
                onSelectAllMastery={selectAllMastery}
                progress={progress}
                selectedSubOptions={config.selectedSubOptions || {}}
                onRemoveSubOption={toggleSubOption}
                onClearAllSubmenuFilters={clearAllSubmenuFilters}
              />
            </div>

            {/* 2. Quiz Type / Mode */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 mb-3">
                2. Quiz Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {modeCard('flag-to-name', config.mode, (m) => setConfig((prev) => ({ ...prev, mode: m })), <Eye className="w-5 h-5" />, 'Flag → Guess Name', 'Show flag image, pick the matching country or territory name.')}
                {modeCard('name-to-flag', config.mode, (m) => setConfig((prev) => ({ ...prev, mode: m })), <ImageIcon className="w-5 h-5" />, 'Name → Guess Flag', 'Show territory name, choose the correct flag from images.')}
                {modeCard('flag-to-map', config.mode, (m) => setConfig((prev) => ({ ...prev, mode: m })), <MapPin className="w-5 h-5" />, 'Flag → Map Pin', 'Show the flag — tap the map where it belongs. Anywhere in the right country counts.')}
                {modeCard('name-to-map', config.mode, (m) => setConfig((prev) => ({ ...prev, mode: m })), <Navigation className="w-5 h-5" />, 'Name → Map Pin', 'Show the territory name — tap the map where it belongs.')}
                {modeCard('map-to-flag', config.mode, (m) => setConfig((prev) => ({ ...prev, mode: m })), <MapIcon className="w-5 h-5" />, 'Map → Guess Flag', 'Show a mystery pin on a label-free map — pick the matching territory.')}
                {modeCard('true-false', config.mode, (m) => setConfig((prev) => ({ ...prev, mode: m })), <Scale className="w-5 h-5" />, 'True / False', 'Show a flag plus a name — judge whether they match. Rapid-fire.' )}
                {modeCard('flag-to-origin', config.mode, (m) => setConfig((prev) => ({ ...prev, mode: m })), <Compass className="w-5 h-5" />, 'Flag → Continent / Country', 'Show the flag — guess its continent, or its parent country for provinces.')}
              </div>
              {MAP_MODES.includes(config.mode) && (
                <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2.5">
                  🗺️ Map formats use only flags with a known location — non-geographic categories (Fictional, Languages, …) are excluded automatically.
                </p>
              )}
            </div>
          </div>

          {/* Right Summary & Settings Column */}
          <div className="space-y-6">
            {/* 3. Number of Questions & Choices */}
            <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm space-y-5">
              {/* Question Count */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 mb-2.5">
                  3. Number of Questions
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

              {/* Option Count (hidden for modes without multiple choice) */}
              {(config.mode === 'flag-to-map' || config.mode === 'name-to-map' || config.mode === 'true-false') ? (
                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-700/60">
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 mb-2.5">
                    4. Choices per Question
                  </label>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-400">
                    {config.mode === 'true-false'
                      ? '⚖️ True/False is always a 2-way judgment — no choice count needed.'
                      : '🗺️ Map-pin modes use tap-to-place guesses — no choice count needed.'}
                  </p>
                </div>
              ) : (
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
              )}
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
                      )} questions${
                        config.mode === 'flag-to-map' || config.mode === 'name-to-map'
                          ? ' with map-pin guesses'
                          : config.mode === 'true-false'
                          ? ' of true/false judgments'
                          : ` with ${config.optionCount} choices each`
                      }`}
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
          {currentFlag.continent && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60">
                {currentFlag.continent}
              </span>
            </div>
          )}
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
                      {[currentFlag.continent, currentFlag.category].filter(Boolean).join(' • ')}
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
            {/* MODE 3: MAP -> FLAG (mystery pin on label-free map, pick name) */}
            {config.mode === 'map-to-flag' && (
              <>
                <div className="text-center mb-4">
                  <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Which territory is pinned here?
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Label-free map — coastlines and neighbours are your only clues.
                  </p>
                </div>

                <div className="w-full max-w-xl mb-6 rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-700">
                  {truth ? (
                    <QuizPromptMap truth={{ lat: truth.lat, lon: truth.lon }} />
                  ) : (
                    <div className="p-8 text-center text-sm text-zinc-500">Location unavailable for this flag.</div>
                  )}
                </div>

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

            {/* MODE 4: TRUE / FALSE */}
            {config.mode === 'true-false' && tfProposed && (
              <>
                <div className="text-center mb-4">
                  <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    True or false?
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFocusedFlag(currentFlag)}
                  className="group relative w-full aspect-[3/2] sm:aspect-video max-w-xl mb-4 rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center p-6 cursor-zoom-in transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
                >
                  <FlagImage
                    flag={currentFlag}
                    alt="Judge the statement"
                    className="max-w-full max-h-full object-contain rounded-md drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 p-2 bg-black/40 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </button>

                <div className="w-full max-w-xl mb-6 px-5 py-4 rounded-2xl border-2 border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-center shadow-xs">
                  <span className="text-sm text-zinc-500 dark:text-zinc-400">This flag belongs to </span>
                  <span className="text-lg font-extrabold text-zinc-900 dark:text-white">{tfProposed.name}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-xl">
                  {[
                    { value: true, label: 'True', icon: <Check className="w-5 h-5" /> },
                    { value: false, label: 'False', icon: <X className="w-5 h-5" /> },
                  ].map((choice) => {
                    const picked = selectedAnswer === (choice.value ? 'true' : 'false');
                    const correctPick = tfProposed.isTrue === choice.value;
                    let stateClass =
                      'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-indigo-400 dark:hover:border-indigo-500 text-zinc-800 dark:text-zinc-100';
                    if (selectedAnswer) {
                      if (correctPick) {
                        stateClass =
                          'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold';
                      } else if (picked) {
                        stateClass =
                          'bg-rose-50 dark:bg-rose-950/60 border-rose-500 text-rose-800 dark:text-rose-300 font-bold';
                      } else {
                        stateClass =
                          'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 opacity-40 text-zinc-400 dark:text-zinc-500';
                      }
                    }
                    return (
                      <button
                        key={choice.label}
                        type="button"
                        onClick={() => handleTrueFalse(choice.value)}
                        disabled={!!selectedAnswer}
                        className={`flex items-center justify-center gap-2 p-4 rounded-xl border-2 font-bold text-base transition-all select-none shadow-xs ${stateClass}`}
                      >
                        {choice.icon}
                        {choice.label}
                      </button>
                    );
                  })}
                </div>
                {selectedAnswer && !tfProposed.isTrue && (
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-3">
                    Actually: <span className="font-semibold text-zinc-800 dark:text-zinc-100">{currentFlag.name}</span>
                    {currentFlag.country ? ` (${currentFlag.country})` : ''}
                  </p>
                )}
              </>
            )}

            {/* MODE 5: FLAG -> CONTINENT / COUNTRY */}
            {config.mode === 'flag-to-origin' && originQ && (
              <>
                <div className="text-center mb-4">
                  <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    {originQ.kind === 'country' ? 'Which country does this territory belong to?' : 'Which continent does this flag belong to?'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFocusedFlag(currentFlag)}
                  className="group relative w-full aspect-[3/2] sm:aspect-video max-w-xl mb-6 rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center p-6 cursor-zoom-in transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
                >
                  <FlagImage
                    flag={currentFlag}
                    alt="Guess the origin"
                    className="max-w-full max-h-full object-contain rounded-md drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3 p-2 bg-black/40 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-5 h-5" />
                  </div>
                </button>

                <div className="text-center mb-3">
                  <h3 className="text-xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                    {currentFlag.name}
                  </h3>
                </div>

                <div
                  className={`grid gap-3 w-full max-w-2xl ${
                    originQ.options.length <= 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : originQ.options.length > 4
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                      : 'grid-cols-1 sm:grid-cols-2'
                  }`}
                >
                  {originQ.options.map((option, idx) => {
                    const isSelected = selectedAnswer === option;
                    const isCorrect = option === originQ.answer;

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
                        key={option}
                        type="button"
                        onClick={() => handleSelectOrigin(option)}
                        disabled={!!selectedAnswer}
                        className={`relative flex items-center justify-between p-4 rounded-xl border-2 text-left font-medium text-sm sm:text-base transition-all select-none shadow-xs ${stateClass}`}
                      >
                        <div className="flex items-start gap-2.5 pr-2 flex-1 min-w-0">
                          <span className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-300 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                            {optionLetters[idx] || idx + 1}
                          </span>
                          <span className="whitespace-normal break-words flex-1 leading-snug">{option}</span>
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

            {/* MODE 6+7: FLAG/NAME -> MAP PIN (tap-to-place on the Atlas map) */}
            {(config.mode === 'flag-to-map' || config.mode === 'name-to-map') && (
              <>
                <div className="text-center mb-4">
                  <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    {config.mode === 'flag-to-map' ? 'Where does this flag belong? Tap the map.' : 'Where is this territory? Tap the map.'}
                  </div>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                    Forgiving scoring: anywhere inside the right country counts — plus a 300&nbsp;km pin tolerance for tiny islands.
                  </p>
                </div>

                {config.mode === 'flag-to-map' ? (
                  <button
                    type="button"
                    onClick={() => setFocusedFlag(currentFlag)}
                    className="group relative w-full aspect-[3/2] sm:aspect-video max-w-xl mb-4 rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 flex items-center justify-center p-6 cursor-zoom-in transition-all hover:border-indigo-300 dark:hover:border-indigo-600"
                  >
                    <FlagImage
                      flag={currentFlag}
                      alt="Locate this flag"
                      className="max-w-full max-h-full object-contain rounded-md drop-shadow-sm group-hover:scale-[1.02] transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 p-2 bg-black/40 text-white rounded-lg backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                  </button>
                ) : (
                  <div className="text-center mb-4">
                    <h3 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 dark:text-white tracking-tight">
                      {currentFlag.name}
                    </h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700">
                        {[currentFlag.continent, currentFlag.category].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                  </div>
                )}

                <div className="w-full max-w-2xl mb-4 rounded-2xl overflow-hidden shadow-md border border-zinc-200 dark:border-zinc-700">
                  <QuizGuessMap
                    guess={guess}
                    truth={truth && mapScore ? { lat: truth.lat, lon: truth.lon } : null}
                    revealed={!!mapScore}
                    onPick={(lat, lon) => setGuess({ lat, lon })}
                  />
                </div>

                {!mapScore ? (
                  <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full max-w-2xl">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500 flex-1 text-center sm:text-left">
                      {guess
                        ? `Pin placed at ${guess.lat.toFixed(2)}°, ${guess.lon.toFixed(2)}° — drag to adjust, then confirm.`
                        : 'Tap anywhere on the map to place your pin (or drag it to fine-tune).'}
                    </p>
                    <div className="flex items-center gap-2">
                      {guess && (
                        <button
                          type="button"
                          onClick={() => setGuess(null)}
                          className="px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                          Clear pin
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleConfirmMapGuess}
                        disabled={!guess || checkingCountry}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-indigo-500/25 transition-all"
                      >
                        {checkingCountry ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Checking country…
                          </>
                        ) : (
                          <>
                            <MapPin className="w-4 h-4" />
                            Confirm guess
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full max-w-2xl rounded-2xl border-2 p-4 text-center ${
                      mapScore.isCorrect
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-500'
                        : 'bg-rose-50 dark:bg-rose-950/50 border-rose-500'
                    }`}
                  >
                    <div className={`text-lg font-extrabold ${mapScore.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                      {MAP_VERDICT_LABEL[mapScore.verdict]}
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                      {Math.round(mapScore.distanceKm)} km from the pin
                      {mapScore.insideCountry ? ` · inside ${currentFlag.country || currentFlag.name} ✅` : ' · outside the country'}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      Correct answer: <span className="font-semibold text-zinc-800 dark:text-zinc-100">{currentFlag.name}</span>
                      {currentFlag.country ? ` (${currentFlag.country})` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={advanceToNext}
                      className="mt-3 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors"
                    >
                      {currentQuestionIndex + 1 < questionPool.length ? 'Next question →' : 'See results →'}
                    </button>
                  </div>
                )}
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
            {MODE_LABEL[config.mode]} Quiz •{' '}
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

          {/* Map-mode extras: average miss distance + correct-country rate */}
          {history.some((h) => typeof h.distanceKm === 'number') && (
            <div className="grid grid-cols-2 gap-3 w-full mb-6">
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Avg Distance</div>
                <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  {(() => {
                    const ds = history.filter((h) => typeof h.distanceKm === 'number').map((h) => h.distanceKm as number);
                    return ds.length > 0 ? `${Math.round(ds.reduce((a, b) => a + b, 0) / ds.length).toLocaleString()} km` : '—';
                  })()}
                </div>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-100 dark:border-zinc-700">
                <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1 font-medium">Correct Country</div>
                <div className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white">
                  {(() => {
                    const ms = history.filter((h) => typeof h.distanceKm === 'number');
                    const hits = ms.filter((h) => h.insideCountry).length;
                    return ms.length > 0 ? `${Math.round((hits / ms.length) * 100)}%` : '—';
                  })()}
                </div>
              </div>
            </div>
          )}

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
                        {[item.flag.continent, item.flag.category].filter(Boolean).join(' • ')}
                        {['Provinces & Territories', 'Fictional', 'Indigenous & Cultural Populations'].includes(item.flag.category) && item.flag.country && ` • ${item.flag.country}`}
                      </div>
                    </div>
                  </button>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {item.isCorrect ? (
                      <div className="text-right">
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold justify-end">
                          <CheckCircle2 className="w-4 h-4" />
                          Correct
                        </span>
                        {typeof item.distanceKm === 'number' && (
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {Math.round(item.distanceKm)} km away{item.insideCountry ? ' · in-country' : ''}
                          </span>
                        )}
                        {item.originAnswer && item.originAnswer !== item.flag.name && (
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {item.originAnswer}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-right">
                        <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold justify-end">
                          <XCircle className="w-4 h-4" />
                          Missed
                        </span>
                        {typeof item.distanceKm === 'number' && (
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            {Math.round(item.distanceKm)} km away{item.insideCountry ? ' · in-country' : ''}
                          </span>
                        )}
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
                        {!selectedFlag && item.originAnswer && (
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            Chose: {item.selectedFlagId} · Answer: {item.originAnswer}
                          </span>
                        )}
                        {!selectedFlag && item.proposedName && (
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            Proposed: {item.proposedName}
                          </span>
                        )}
                        {selectedFlag && item.proposedName && item.proposedName !== selectedFlag.name && (
                          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                            Proposed: {item.proposedName}
                          </span>
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
