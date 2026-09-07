import { useMemo, useState } from 'react';
import {
  Globe2,
  Layers,
  RotateCcw,
  Sparkles,
  Trophy,
  Target,
  BarChart2,
  AlertTriangle
} from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';
import { FlagProgress, ALL_CATEGORIES, ALL_CONTINENTS } from '../types';

interface ProgressTrackerProps {
  progress: Record<string, FlagProgress>;
  onResetProgress: () => void;
}

export function ProgressTracker({ progress, onResetProgress }: ProgressTrackerProps) {
  const { flags: FLAGS } = useFlags();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Calculate detailed overall, category, and continent stats
  const stats = useMemo(() => {
    let totalAttempts = 0;
    let totalCorrect = 0;
    let mastered = 0;
    let learning = 0;
    let needsPractice = 0;
    let unattempted = 0;

    FLAGS.forEach((flag) => {
      const p = progress[flag.id];
      if (!p || p.attempts === 0) {
        unattempted++;
        return;
      }

      totalAttempts += p.attempts;
      totalCorrect += p.correct;
      const acc = p.correct / p.attempts;

      if (p.correct >= 2) {
        mastered++;
      } else if (acc < 0.5) {
        needsPractice++;
      } else {
        learning++;
      }
    });

    const totalMissed = totalAttempts - totalCorrect;
    const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
    const masteryPercentage = Math.round((mastered / FLAGS.length) * 100);

    // Category breakdown
    const categoryStats = ALL_CATEGORIES.map((cat) => {
      const flagsInCat = FLAGS.filter((f) => f.category === cat);
      let catMastered = 0;
      let catAttempted = 0;

      flagsInCat.forEach((f) => {
        const p = progress[f.id];
        if (p && p.attempts > 0) {
          catAttempted++;
          if (p.correct >= 2) {
            catMastered++;
          }
        }
      });

      return {
        category: cat,
        total: flagsInCat.length,
        mastered: catMastered,
        attempted: catAttempted,
        percent: flagsInCat.length > 0 ? Math.round((catMastered / flagsInCat.length) * 100) : 0,
      };
    });

    // Continent breakdown
    const continentStats = ALL_CONTINENTS.map((cont) => {
      const flagsInCont = FLAGS.filter((f) => f.continent === cont);
      let contMastered = 0;

      flagsInCont.forEach((f) => {
        const p = progress[f.id];
        if (p && p.correct >= 2) {
          contMastered++;
        }
      });

      return {
        continent: cont,
        total: flagsInCont.length,
        mastered: contMastered,
        percent: flagsInCont.length > 0 ? Math.round((contMastered / flagsInCont.length) * 100) : 0,
      };
    });

    return {
      totalAttempts,
      totalCorrect,
      totalMissed,
      accuracy,
      mastered,
      learning,
      needsPractice,
      unattempted,
      masteryPercentage,
      categoryStats,
      continentStats,
    };
  }, [progress, FLAGS]);

  const handleConfirmReset = () => {
    onResetProgress();
    setShowResetConfirm(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto py-6 px-4 space-y-6">
      {/* Header & Reset Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            Learning & Progress Analytics
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
            Track your mastery of world flags, quiz accuracy, and regional progress.
          </p>
        </div>

        {/* Reset Progress Button */}
        <div>
          <button
            id="reset-progress-btn"
            onClick={() => setShowResetConfirm(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-xs font-semibold transition-colors shadow-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Progress</span>
          </button>
        </div>
      </div>

      {/* Top 4 Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Mastered Flags */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
              Flags Mastered
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              {stats.mastered}{' '}
              <span className="text-sm font-normal text-zinc-400 dark:text-zinc-500">/ {FLAGS.length}</span>
            </div>
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {stats.masteryPercentage}% of collection mastered
            </div>
          </div>
        </div>

        {/* 2. Global Accuracy */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
              Accuracy Rate
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats.accuracy}%
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {stats.totalCorrect} correct • {stats.totalMissed} missed
            </div>
          </div>
        </div>

        {/* 3. Learning & Practice Status */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
              In Progress
            </span>
            <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              {stats.learning} <span className="text-xs font-normal text-zinc-400 dark:text-zinc-500">learning</span>
            </div>
            <div className="text-xs text-rose-500 dark:text-rose-400 font-semibold mt-1">
              {stats.needsPractice} flags need practice (&lt;50%)
            </div>
          </div>
        </div>

        {/* 4. Total Quiz Questions Answered */}
        <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-400 dark:text-zinc-400 uppercase tracking-wider">
              Total Attempts
            </span>
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
              <BarChart2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white">
              {stats.totalAttempts}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {stats.unattempted} flags unattempted
            </div>
          </div>
        </div>
      </div>

      {/* Regional & Category Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown Progress */}
        <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3.5 flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Mastery by Category
          </h3>
          <div className="space-y-3.5">
            {stats.categoryStats.map((item) => (
              <div key={item.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-medium">
                  <span className="text-zinc-700 dark:text-zinc-300">{item.category}</span>
                  <span className="text-zinc-500 dark:text-zinc-400 font-semibold">
                    {item.mastered} / {item.total} ({item.percent}%)
                  </span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Continent Breakdown Progress */}
        <div className="bg-white dark:bg-zinc-800 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-700 shadow-sm">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white mb-3.5 flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            Mastery by Continent
          </h3>
          <div className="grid grid-cols-2 gap-2.5">
            {stats.continentStats.map((item) => (
              <div
                key={item.continent}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-700 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                    {item.continent}
                  </span>
                  <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                    {item.percent}%
                  </span>
                </div>
                <div className="mt-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  {item.mastered} of {item.total} mastered
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl p-6 max-w-md w-full border border-zinc-200 dark:border-zinc-700 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white">
                Reset All Learning Progress?
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                This will wipe all quiz records, mastery percentages, and question attempt histories.
                This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-reset-progress-btn"
                onClick={handleConfirmReset}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                Yes, Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
