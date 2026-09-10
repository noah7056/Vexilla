import { useState, useRef, useEffect, useCallback } from 'react';
import type { MouseEvent, TouchEvent, WheelEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ArrowLeftRight,
  Globe2,
  Layers,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Move,
  Star,
  Search,
  ChevronDown,
  Tag
} from 'lucide-react';
import { Flag, FlagProgress } from '../types';
import { FlagImage } from './FlagImage';
import { StatusBadge } from './StatusBadge';
import { useFavorites } from '../hooks/useFavorites';
import { useFlags } from '../contexts/FlagsContext';

interface FlagCompareModalProps {
  flagA: Flag;
  flagB: Flag;
  progress?: Record<string, FlagProgress>;
  onClose: () => void;
  onUpdateFlags?: (flagA: Flag, flagB: Flag) => void;
}

interface FlagZoomCanvasProps {
  flag: Flag;
  slotNumber: 1 | 2;
  progress?: Record<string, FlagProgress>;
  onChangeFlag: (newFlag: Flag) => void;
}

function FlagZoomCanvas({ flag, slotNumber, progress = {}, onChangeFlag }: FlagZoomCanvasProps) {
  const { flags: FLAGS } = useFlags();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const pickerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan when flag changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, [flag.id]);

  // Click outside listener for flag picker dropdown
  useEffect(() => {
    if (!isPickerOpen) return;
    const handleClickOutside = (e: globalThis.MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isPickerOpen]);

  // Mouse wheel zoom
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.deltaY < 0) {
      setScale((prev) => Math.min(prev + 0.35, 6));
    } else {
      setScale((prev) => {
        const next = Math.max(prev - 0.35, 1);
        if (next === 1) setPosition({ x: 0, y: 0 });
        return next;
      });
    }
  };

  // Mouse Pan Start
  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    if (e.button !== 0) return;
    if (scale <= 1) return;

    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      posX: position.x,
      posY: position.y
    };
  };

  // Global mousemove and mouseup listeners for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseMove = (e: globalThis.MouseEvent) => {
      e.preventDefault();
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY
      });
    };

    const handleGlobalMouseUp = (e: globalThis.MouseEvent) => {
      e.preventDefault();
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleGlobalMouseMove, { passive: false });
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [isDragging]);

  // Touch Pan Start
  const handleTouchStart = (e: TouchEvent) => {
    if (scale <= 1 || e.touches.length !== 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      posX: position.x,
      posY: position.y
    };
  };

  // Global touchmove and touchend listeners for mobile
  useEffect(() => {
    if (!isDragging) return;

    const handleGlobalTouchMove = (e: globalThis.TouchEvent) => {
      if (e.touches.length !== 1) return;
      const deltaX = e.touches[0].clientX - dragStartRef.current.x;
      const deltaY = e.touches[0].clientY - dragStartRef.current.y;
      setPosition({
        x: dragStartRef.current.posX + deltaX,
        y: dragStartRef.current.posY + deltaY
      });
    };

    const handleGlobalTouchEnd = () => {
      setIsDragging(false);
    };

    window.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });
    window.addEventListener('touchend', handleGlobalTouchEnd);
    window.addEventListener('touchcancel', handleGlobalTouchEnd);

    return () => {
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
      window.removeEventListener('touchcancel', handleGlobalTouchEnd);
    };
  }, [isDragging]);

  const handleDoubleClick = (e: MouseEvent) => {
    e.preventDefault();
    if (scale > 1) {
      resetZoom();
    } else {
      setScale(2.5);
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.5, 6));
  const zoomOut = () =>
    setScale((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const filteredOptions = pickerSearch.trim()
    ? FLAGS.filter(
        (f) =>
          f.name.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          f.code.toLowerCase().includes(pickerSearch.toLowerCase()) ||
          (f.country && f.country.toLowerCase().includes(pickerSearch.toLowerCase())) ||
          (f.aliases && f.aliases.some((a) => a.toLowerCase().includes(pickerSearch.toLowerCase()))) ||
          (f.tags && f.tags.some((t) => t.toLowerCase().includes(pickerSearch.toLowerCase())))
      ).slice(0, 30)
    : FLAGS.slice(0, 30);

  const flagProgress = progress[flag.id];
  const attempts = flagProgress?.attempts || 0;
  const correct = flagProgress?.correct || 0;
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const isMastered = attempts >= 3 && accuracy >= 80;
  const needsPractice = attempts > 0 && accuracy < 50;

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full bg-zinc-950 relative overflow-hidden">
      {/* Pane Header: Flag Selector / Title */}
      <div className="px-3 py-2 sm:px-4 sm:py-2.5 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between gap-2 z-20 shrink-0">
        <div className="flex items-center gap-2 min-w-0 relative" ref={pickerRef}>
          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-400 text-xs font-bold flex items-center justify-center">
            {slotNumber}
          </span>

          <button
            onClick={() => setIsPickerOpen(!isPickerOpen)}
            className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-left text-white text-xs sm:text-sm font-semibold transition-colors truncate max-w-[180px] sm:max-w-[240px]"
            title="Click to switch flag"
          >
            <span className="truncate">{flag.name}</span>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          </button>

          <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-800 text-zinc-400 border border-zinc-700">
            {flag.code.toUpperCase()}
          </span>

          {/* Search Dropdown Popover */}
          {isPickerOpen && (
            <div className="absolute top-full left-0 mt-1 w-72 sm:w-80 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl z-50 p-2 max-h-80 flex flex-col">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search replacement flag..."
                  value={pickerSearch}
                  onChange={(e) => setPickerSearch(e.target.value)}
                  autoFocus
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div className="overflow-y-auto flex-1 space-y-1 pr-1">
                {filteredOptions.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      onChangeFlag(f);
                      setIsPickerOpen(false);
                      setPickerSearch('');
                    }}
                    className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-left text-xs transition-colors ${
                      f.id === flag.id
                        ? 'bg-indigo-600/30 text-indigo-300 font-semibold'
                        : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                    }`}
                  >
                    <div className="w-6 h-4 bg-zinc-800 rounded overflow-hidden flex items-center justify-center shrink-0">
                      <FlagImage flag={f} alt={f.name} className="max-w-full max-h-full object-contain" />
                    </div>
                    <span className="truncate flex-1">{f.name}</span>
                    <span className="text-[10px] text-zinc-500 font-mono">{f.code.toUpperCase()}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => toggleFavorite(flag.id)}
            className={`p-1.5 rounded-lg border transition-colors ${
              isFavorite(flag.id)
                ? 'border-amber-500/50 bg-amber-950/40 text-amber-400 hover:bg-amber-900/50'
                : 'border-zinc-800 bg-zinc-850 text-zinc-500 hover:bg-zinc-800 hover:text-amber-400'
            }`}
            title="Toggle Favorite"
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite(flag.id) ? 'fill-current' : ''}`} />
          </button>
        </div>
      </div>

      {/* Interactive Zoom Canvas */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden select-none">
        {/* Floating Zoom Controls Bar */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-zinc-900/90 backdrop-blur-md p-1 px-2 rounded-xl border border-zinc-700 shadow-xl select-none">
          <button
            onClick={zoomOut}
            disabled={scale <= 1}
            title="Zoom Out"
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>

          <span className="text-[11px] font-bold text-white px-1.5 min-w-[44px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= 6}
            title="Zoom In"
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-3.5 bg-zinc-700 mx-0.5" />

          <button
            onClick={resetZoom}
            title="Reset Zoom"
            className="p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Canvas Area with Drag & Scale */}
        <div
          ref={containerRef}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onDoubleClick={handleDoubleClick}
          style={{
            cursor: scale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            touchAction: 'none'
          }}
          className="w-full h-full p-4 sm:p-6 flex items-center justify-center overflow-hidden touch-none select-none"
        >
          <div
            style={{
              transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${scale})`,
              transition: isDragging ? 'none' : 'transform 0.12s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            className="w-full h-full flex items-center justify-center pointer-events-none select-none will-change-transform"
          >
            <FlagImage
              flag={flag}
              alt={flag.name}
              highRes={true}
              draggable={false}
              className="w-auto h-auto max-w-[92%] max-h-[88%] object-contain rounded-md shadow-2xl drop-shadow-2xl ring-1 ring-white/10 pointer-events-none select-none"
            />
          </div>
        </div>
      </div>

      {/* Pane Footer: Metadata Pills */}
      <div className="px-3 py-2 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-1.5 shrink-0 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {flag.continent && (
            <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-medium flex items-center gap-1">
              <Globe2 className="w-3 h-3 text-indigo-400" />
              {flag.continent}
            </span>
          )}
          <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700 text-[11px] font-medium flex items-center gap-1">
            <Layers className="w-3 h-3 text-zinc-400" />
            {flag.category}
          </span>
          {flag.status && <StatusBadge status={flag.status} size="sm" />}
          {flag.country && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 border ${
                flag.category === 'Fictional'
                  ? 'bg-purple-950/60 text-purple-300 border-purple-800/60'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800/60'
              }`}
            >
              {flag.category === 'Fictional' ? (
                <Sparkles className="w-3 h-3 text-purple-400" />
              ) : (
                <MapPin className="w-3 h-3 text-amber-400" />
              )}
              {flag.country}
            </span>
          )}
          {flag.aliases && flag.aliases.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 bg-teal-950/60 text-teal-300 border border-teal-800/60"
              title={`Aliases: ${flag.aliases.join(', ')}`}
            >
              <Tag className="w-3 h-3 text-teal-400" />
              {flag.aliases.join(', ')}
            </span>
          )}
          {flag.tags && flag.tags.length > 0 && (
            <span
              className="px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 bg-violet-950/60 text-violet-300 border border-violet-800/60"
              title={`Tags: ${flag.tags.join(', ')}`}
            >
              {flag.tags.map(t => `#${t}`).join(' ')}
            </span>
          )}
        </div>

        <div className="ml-auto shrink-0">
          {attempts === 0 ? (
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <HelpCircle className="w-3 h-3" /> Unattempted
            </span>
          ) : (
            <span
              className={`text-[11px] font-semibold flex items-center gap-1 ${
                isMastered ? 'text-emerald-400' : needsPractice ? 'text-rose-400' : 'text-indigo-400'
              }`}
            >
              {isMastered ? <CheckCircle2 className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              {accuracy}% ({correct}/{attempts})
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function FlagCompareModal({
  flagA,
  flagB,
  progress = {},
  onClose,
  onUpdateFlags
}: FlagCompareModalProps) {
  const { flags: FLAGS } = useFlags();
  const [currentA, setCurrentA] = useState<Flag>(flagA);
  const [currentB, setCurrentB] = useState<Flag>(flagB);

  useEffect(() => {
    setCurrentA(flagA);
  }, [flagA]);

  useEffect(() => {
    setCurrentB(flagB);
  }, [flagB]);

  // Swap flags
  const handleSwap = () => {
    const temp = currentA;
    setCurrentA(currentB);
    setCurrentB(temp);
    if (onUpdateFlags) {
      onUpdateFlags(currentB, temp);
    }
  };

  const handleUpdateA = (newFlag: Flag) => {
    setCurrentA(newFlag);
    if (onUpdateFlags) onUpdateFlags(newFlag, currentB);
  };

  const handleUpdateB = (newFlag: Flag) => {
    setCurrentB(newFlag);
    if (onUpdateFlags) onUpdateFlags(currentA, newFlag);
  };

  // Keyboard navigation: Escape to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      <div
        id="flag-compare-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-zinc-950/80 backdrop-blur-md select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-7xl h-[94vh] sm:h-[92vh] bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/60">
                  <ArrowLeftRight className="w-4 h-4" />
                </span>
                <h2 className="text-base sm:text-xl font-bold text-zinc-900 dark:text-white truncate">
                  Flag Comparison
                </h2>
              </div>

              {/* VS Label Indicator */}
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                <span className="truncate max-w-[140px] font-bold text-indigo-600 dark:text-indigo-400">
                  {currentA.name}
                </span>
                <span className="px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-[10px] text-zinc-500 font-bold uppercase">
                  VS
                </span>
                <span className="truncate max-w-[140px] font-bold text-indigo-600 dark:text-indigo-400">
                  {currentB.name}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Swap Button */}
              <button
                id="flag-compare-swap-btn"
                onClick={handleSwap}
                title="Swap Flag Positions"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs font-semibold transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Swap</span>
              </button>

              <button
                id="flag-compare-modal-close-btn"
                onClick={onClose}
                aria-label="Close compare modal"
                title="Close (Esc)"
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Hint Overlay Bar */}
          <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-1 flex items-center justify-between text-[11px] text-zinc-400">
            <div className="flex items-center gap-1.5">
              <Move className="w-3 h-3 text-zinc-500" />
              <span>Independent Zoom & Pan: Drag to pan, scroll wheel or +/- to zoom each flag separately</span>
            </div>
            <span className="hidden md:inline text-zinc-500">Click any flag name above to choose a different flag</span>
          </div>

          {/* Split Side-by-Side Zoom & Pan Canvases */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800 overflow-hidden bg-zinc-950">
            <FlagZoomCanvas
              flag={currentA}
              slotNumber={1}
              progress={progress}
              onChangeFlag={handleUpdateA}
            />
            <FlagZoomCanvas
              flag={currentB}
              slotNumber={2}
              progress={progress}
              onChangeFlag={handleUpdateB}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
