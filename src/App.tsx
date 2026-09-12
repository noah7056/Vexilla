/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import type { ReactNode } from 'react';
import { ViewMode } from './types';
import { FlagDictionary } from './components/FlagDictionary';
// Secondary views are code-split so the initial bundle only contains the
// dictionary (the default view). They load on demand when selected.
const Flashcards = lazy(() => import('./components/Flashcards').then((m) => ({ default: m.Flashcards })));
const Quiz = lazy(() => import('./components/Quiz').then((m) => ({ default: m.Quiz })));
const ProgressTracker = lazy(() => import('./components/ProgressTracker').then((m) => ({ default: m.ProgressTracker })));
const CollectionsView = lazy(() => import('./components/CollectionsView').then((m) => ({ default: m.CollectionsView })));
import { useProgress } from './hooks/useProgress';
import { AdminProvider, useAdmin } from './contexts/AdminContext';
import { Globe2, BookOpen, BrainCircuit, BarChart3, Moon, Sun, Droplets, TreePine, Flame, Sparkles, Palette, FolderHeart, Lock, Unlock, X } from 'lucide-react';

type ThemeId = 'daylight' | 'twilight' | 'midnight' | 'ocean' | 'forest' | 'sunset' | 'lavender';

interface AppTheme {
  id: ThemeId;
  label: string;
  icon: ReactNode;
  isDark: boolean;
}

const APP_THEMES: AppTheme[] = [
  { id: 'daylight', label: 'Daylight', icon: <Sun className="w-4 h-4" />, isDark: false },
  { id: 'twilight', label: 'Twilight', icon: <Moon className="w-4 h-4" />, isDark: true },
  { id: 'midnight', label: 'Midnight Abyss', icon: <Moon className="w-4 h-4" />, isDark: true },
  { id: 'ocean', label: 'Ocean Breeze', icon: <Droplets className="w-4 h-4" />, isDark: true },
  { id: 'forest', label: 'Whispering Pines', icon: <TreePine className="w-4 h-4" />, isDark: true },
  { id: 'sunset', label: 'Autumn Embers', icon: <Flame className="w-4 h-4" />, isDark: false },
  { id: 'lavender', label: 'Lavender Haze', icon: <Sparkles className="w-4 h-4" />, isDark: false },
];

const THEME_STORAGE_KEY = 'vexilla-theme';

function getStoredTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved && APP_THEMES.some(t => t.id === saved)) {
      return saved as ThemeId;
    }
  } catch (e) {
    console.error('Failed to load theme preference', e);
  }
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'twilight';
  }
  return 'daylight';
}

export default function App() {
  return (
    <AdminProvider>
      <AppInner />
    </AdminProvider>
  );
}

function AppInner() {
  const [view, setView] = useState<ViewMode>('dictionary');
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => getStoredTheme());
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isPasskeyModalOpen, setIsPasskeyModalOpen] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState('');
  const { isAdmin, unlock, lock, expiresAt } = useAdmin();
  const { progress, recordAnswer, resetProgress } = useProgress();

  const desktopThemeRef = useRef<HTMLDivElement>(null);
  const mobileThemeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isThemeMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      const isInsideDesktop = desktopThemeRef.current?.contains(target);
      const isInsideMobile = mobileThemeRef.current?.contains(target);

      if (!isInsideDesktop && !isInsideMobile) {
        setIsThemeMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsThemeMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isThemeMenuOpen]);

  useEffect(() => {
    // Listen for storage changes across tabs
    const handleStorage = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue && APP_THEMES.some(t => t.id === e.newValue)) {
        setCurrentTheme(e.newValue as ThemeId);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    } catch (e) {
      console.error('Failed to save theme preference', e);
    }

    const themeObj = APP_THEMES.find(t => t.id === currentTheme);
    const isDark = themeObj?.isDark ?? false;

    // Reset all previous theme classes
    document.documentElement.className = document.documentElement.className
      .replace(/\btheme-\S+/g, '')
      .replace(/\bdark\b/g, '')
      .trim();

    if (currentTheme !== 'daylight' && currentTheme !== 'twilight') {
      document.documentElement.classList.add(`theme-${currentTheme}`);
    }
    
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, [currentTheme]);

  const activeThemeObj = APP_THEMES.find(t => t.id === currentTheme) || APP_THEMES[0];

  const navItems: { id: ViewMode; label: string; icon: ReactNode }[] = [
    { id: 'dictionary', label: 'Dictionary', icon: <Globe2 className="w-5 h-5" /> },
    { id: 'collections', label: 'Collections', icon: <FolderHeart className="w-5 h-5" /> },
    { id: 'flashcards', label: 'Flashcards', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'quiz', label: 'Quiz', icon: <BrainCircuit className="w-5 h-5" /> },
    { id: 'progress', label: 'Progress', icon: <BarChart3 className="w-5 h-5" /> },
  ];

  return (
    <div className={`min-h-screen bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-200 flex flex-col ${activeThemeObj.isDark ? 'dark' : ''} ${currentTheme !== 'daylight' && currentTheme !== 'twilight' ? `theme-${currentTheme}` : ''}`}>
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-indigo-600 dark:text-indigo-400">Vexilla</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Admin Lock/Unlock Button */}
            <button
              onClick={() => {
                if (isAdmin) {
                  lock();
                } else {
                  setIsPasskeyModalOpen(true);
                }
              }}
              className={`p-2 rounded-full transition-colors flex items-center justify-center cursor-pointer ${
                isAdmin
                  ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                  : 'text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-600 dark:hover:text-zinc-300'
              }`}
              title={isAdmin ? 'Admin Mode Active — Click to Lock' : 'Admin Mode Locked — Click to Unlock'}
              aria-label={isAdmin ? 'Lock admin mode' : 'Unlock admin mode'}
            >
              {isAdmin ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </button>

            {/* Desktop Nav */}
            <nav className="hidden sm:flex items-center bg-zinc-100 dark:bg-zinc-800 rounded-full p-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  id={`nav-${item.id}`}
                  onClick={() => setView(item.id)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                    view === item.id 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm' 
                      : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>

            <div ref={desktopThemeRef} className="hidden sm:block relative">
              <button
                id="theme-toggle-btn"
                onClick={() => setIsThemeMenuOpen(prev => !prev)}
                className="p-2 rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400 transition-colors flex items-center justify-center cursor-pointer"
                aria-label="Toggle theme menu"
                title="Change Theme"
              >
                {activeThemeObj.icon}
              </button>
              
              {isThemeMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                  {APP_THEMES.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => {
                        setCurrentTheme(theme.id);
                        setIsThemeMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                        currentTheme === theme.id 
                          ? 'bg-zinc-100 dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 font-semibold' 
                          : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                      }`}
                    >
                      <span className={currentTheme === theme.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}>
                        {theme.icon}
                      </span>
                      {theme.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 overflow-y-auto">
          {view === 'dictionary' && <FlagDictionary progress={progress} />}
          {view !== 'dictionary' && (
            <Suspense
              fallback={
                <div className="flex items-center justify-center py-16 text-sm text-zinc-500 dark:text-zinc-400">
                  Loading…
                </div>
              }
            >
              {view === 'collections' && <CollectionsView />}
              {view === 'flashcards' && <Flashcards />}
              {view === 'quiz' && <Quiz onAnswer={recordAnswer} />}
              {view === 'progress' && <ProgressTracker progress={progress} onResetProgress={resetProgress} />}
            </Suspense>
          )}
        </div>
      </main>

      {/* Mobile Nav */}
      <nav className="sm:hidden bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 pb-safe relative">
        <div className="flex justify-around items-center p-2 relative z-10 bg-white dark:bg-zinc-900">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => {
                setView(item.id);
                setIsThemeMenuOpen(false);
              }}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[64px] transition-colors ${
                view === item.id 
                  ? 'text-indigo-600 dark:text-indigo-400' 
                  : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'
              }`}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
          <div ref={mobileThemeRef} className="relative">
            {isThemeMenuOpen && (
              <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg z-50 overflow-hidden py-1">
                {APP_THEMES.map(theme => (
                  <button
                    key={theme.id}
                    onClick={() => {
                      setCurrentTheme(theme.id);
                      setIsThemeMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors cursor-pointer ${
                      currentTheme === theme.id 
                        ? 'bg-zinc-100 dark:bg-zinc-700 text-indigo-600 dark:text-indigo-400 font-semibold' 
                        : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50'
                    }`}
                  >
                    <span className={currentTheme === theme.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400'}>
                      {theme.icon}
                    </span>
                    {theme.label}
                  </button>
                ))}
              </div>
            )}
            <button
              id="mobile-theme-toggle-btn"
              onClick={() => setIsThemeMenuOpen(prev => !prev)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[64px] transition-colors cursor-pointer ${isThemeMenuOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800'}`}
              aria-label="Toggle theme menu"
            >
              {activeThemeObj.icon}
              <span className="text-[10px] font-medium">Theme</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Passkey Modal */}
      {isPasskeyModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-700 relative">
            <button
              onClick={() => { setIsPasskeyModalOpen(false); setPasskeyInput(''); setPasskeyError(''); }}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/50">
                <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Admin Access</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">Enter passkey to unlock admin tools</p>
              </div>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const success = unlock(passkeyInput);
                if (success) {
                  setIsPasskeyModalOpen(false);
                  setPasskeyInput('');
                  setPasskeyError('');
                } else {
                  setPasskeyError('Invalid passkey. Try again.');
                  setPasskeyInput('');
                }
              }}
            >
              <input
                type="password"
                value={passkeyInput}
                onChange={(e) => { setPasskeyInput(e.target.value); setPasskeyError(''); }}
                placeholder="Enter passkey"
                autoFocus
                className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-400 mb-3"
              />
              {passkeyError && (
                <p className="text-xs text-red-500 dark:text-red-400 mb-3">{passkeyError}</p>
              )}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors"
              >
                Unlock
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
