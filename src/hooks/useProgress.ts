import { useState, useEffect } from 'react';
import { FlagProgress } from '../types';

export function useProgress() {
  const [progress, setProgress] = useState<Record<string, FlagProgress>>({});

  useEffect(() => {
    const stored = localStorage.getItem('vexilla-progress');
    if (stored) {
      try {
        setProgress(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse progress', e);
      }
    }
  }, []);

  const saveProgress = (newProgress: Record<string, FlagProgress>) => {
    setProgress(newProgress);
    localStorage.setItem('vexilla-progress', JSON.stringify(newProgress));
  };

  const recordAnswer = (flagId: string, isCorrect: boolean) => {
    const current = progress[flagId] || {
      flagId,
      attempts: 0,
      correct: 0,
      lastAttemptedAt: null,
    };

    const newProgress = {
      ...progress,
      [flagId]: {
        ...current,
        attempts: current.attempts + 1,
        correct: current.correct + (isCorrect ? 1 : 0),
        lastAttemptedAt: new Date().toISOString(),
      },
    };

    saveProgress(newProgress);
  };

  const resetProgress = () => {
    saveProgress({});
  };

  return { progress, recordAnswer, resetProgress };
}
