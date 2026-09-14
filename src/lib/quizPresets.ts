import { QuizConfig, QuizPreset } from '../types';

const PRESETS_KEY = 'vexilla-quiz-presets';

function uid(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizeConfig(config: QuizConfig): QuizConfig {
  return {
    mode: config.mode,
    questionCount: config.questionCount,
    categories: [...config.categories],
    continents: [...config.continents],
    selectedSubOptions: { ...(config.selectedSubOptions || {}) },
    statuses: [...(config.statuses || ['All'])],
    tags: [...(config.tags || [])],
    mastery: [...(config.mastery || ['all'])],
    optionCount: config.optionCount,
    showCountryHintAfterAnswer: config.showCountryHintAfterAnswer ?? true,
    showCountryInQuestion: config.showCountryInQuestion ?? false,
    showCountryInOptions: config.showCountryInOptions ?? false,
    waitTimeAfterAnswer: config.waitTimeAfterAnswer ?? 1000,
  };
}

/** Load custom presets (localStorage, per-device). Never throws. */
export function loadCustomPresets(): QuizPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (p): p is QuizPreset =>
        p && typeof p.id === 'string' && typeof p.name === 'string' && p.config && typeof p.config === 'object'
    );
  } catch {
    return [];
  }
}

function persist(presets: QuizPreset[]): void {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // Storage full / private mode — presets just won't persist.
  }
}

export function saveCustomPreset(name: string, config: QuizConfig): QuizPreset[] {
  const trimmed = name.trim().slice(0, 60) || 'Untitled preset';
  const presets = loadCustomPresets();
  presets.push({ id: uid(), name: trimmed, createdAt: Date.now(), config: sanitizeConfig(config) });
  persist(presets);
  return presets;
}

export function deleteCustomPreset(id: string): QuizPreset[] {
  const presets = loadCustomPresets().filter((p) => p.id !== id);
  persist(presets);
  return presets;
}

export function renameCustomPreset(id: string, name: string): QuizPreset[] {
  const trimmed = name.trim().slice(0, 60);
  if (!trimmed) return loadCustomPresets();
  const presets = loadCustomPresets().map((p) => (p.id === id ? { ...p, name: trimmed } : p));
  persist(presets);
  return presets;
}
