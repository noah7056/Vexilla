import { useState, useRef, useEffect, useCallback } from 'react';
import type { MouseEvent, TouchEvent, WheelEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Globe2,
  Layers,
  MapPin,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Move,
  Star,
  ArrowLeftRight,
  Skull,
  Tag,
  FolderPlus,
  Check,
  Pencil,
  User,
  Link2,
  ExternalLink,
  Info
} from 'lucide-react';
import { Flag, FlagProgress } from '../types';
import { FlagImage } from './FlagImage';
import { StatusBadge } from './StatusBadge';
import { useFavorites } from '../hooks/useFavorites';
import { useCollections } from '../hooks/useCollections';
import { useAdmin } from '../contexts/AdminContext';

import { CreateCollectionModal } from './CreateCollectionModal';

interface FlagModalProps {
  flag: Flag | null;
  flagsList?: Flag[];
  progress?: Record<string, FlagProgress>;
  onClose: () => void;
  onSelectFlag?: (flag: Flag) => void;
  onCompare?: (flag: Flag) => void;
  onEdit?: (flag: Flag) => void;
}

export function FlagModal({
  flag,
  flagsList = [],
  progress = {},
  onClose,
  onSelectFlag,
  onCompare,
  onEdit
}: FlagModalProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { collections, toggleFlagInCollection, createCollection } = useCollections();
  const { isAdmin } = useAdmin();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [showCollections, setShowCollections] = useState(false);
  const [showFanMadePopover, setShowFanMadePopover] = useState(false);
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, posX: 0, posY: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset zoom & pan when flag changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
    setShowFanMadePopover(false);
  }, [flag?.id]);

  // Index in flagsList for Prev/Next
  const currentIndex = flag ? flagsList.findIndex((f) => f.id === flag.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < flagsList.length - 1;

  const handlePrev = useCallback(() => {
    if (hasPrev && onSelectFlag) {
      onSelectFlag(flagsList[currentIndex - 1]);
    }
  }, [hasPrev, onSelectFlag, flagsList, currentIndex]);

  const handleNext = useCallback(() => {
    if (hasNext && onSelectFlag) {
      onSelectFlag(flagsList[currentIndex + 1]);
    }
  }, [hasNext, onSelectFlag, flagsList, currentIndex]);

  // Keyboard navigation: Escape to close, Left/Right arrow for prev/next, +/- for zoom, 0 to reset
  useEffect(() => {
    if (!flag) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        setScale((prev) => Math.min(prev + 0.5, 6));
      } else if (e.key === '-' || e.key === '_') {
        setScale((prev) => {
          const next = Math.max(prev - 0.5, 1);
          if (next === 1) setPosition({ x: 0, y: 0 });
          return next;
        });
      } else if (e.key === '0') {
        setScale(1);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [flag, onClose, handlePrev, handleNext]);

  // Global dragstart preventer to avoid browser dragging image ghost
  useEffect(() => {
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };
    window.addEventListener('dragstart', handleDragStart);
    return () => window.removeEventListener('dragstart', handleDragStart);
  }, []);

  // Global mousemove and mouseup listeners while dragging for seamless panning
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

  // Mouse wheel zoom
  const handleWheel = (e: WheelEvent) => {
    e.preventDefault();
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

  if (!flag) return null;

  const flagProgress = progress[flag.id];
  const attempts = flagProgress?.attempts || 0;
  const correct = flagProgress?.correct || 0;
  const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 0;
  const isMastered = attempts >= 3 && accuracy >= 80;
  const needsPractice = attempts > 0 && accuracy < 50;

  return (
    <AnimatePresence>
      <div
        id="flag-modal-overlay"
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 md:p-8 bg-zinc-950/80 backdrop-blur-md select-none"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-6xl h-[94vh] sm:h-[90vh] bg-white dark:bg-zinc-900 rounded-2xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Modal Header */}
          <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 bg-zinc-50 dark:bg-zinc-900 shrink-0">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
              <h2 className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-white break-words leading-tight whitespace-normal min-w-0">
                {flag.name}
              </h2>
              <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 shrink-0">
                {flag.code.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {onCompare && (
                <button
                  id="flag-modal-compare-btn"
                  onClick={() => onCompare(flag)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-xs font-semibold transition-colors"
                  title="Compare with another flag"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Compare</span>
                </button>
              )}
              
              {onEdit && isAdmin && (
                <button
                  id="flag-modal-edit-btn"
                  onClick={() => onEdit(flag)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/60 dark:hover:text-indigo-300 text-xs font-semibold transition-colors"
                  title="Edit flag"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              )}

              <div className="relative">
                <button
                  onClick={() => setShowCollections(!showCollections)}
                  className={`p-2 rounded-xl border transition-colors ${
                    showCollections
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-500 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-indigo-500'
                  }`}
                  title="Add to Collection"
                >
                  <FolderPlus className="w-4 h-4" />
                </button>
                {showCollections && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowCollections(false)} />
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-50 overflow-hidden py-1 max-h-60 overflow-y-auto">
                      <div className="px-3 py-1.5 text-xs font-semibold tracking-wider text-zinc-500 dark:text-zinc-400 uppercase">Save to...</div>
                      {collections.length === 0 && (
                        <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400 italic">No collections yet</div>
                      )}
                      {collections.map(c => {
                        const inCollection = c.flagIds.includes(flag.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleFlagInCollection(c.id, flag.id)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                          >
                            <span className="truncate pr-2">{c.name}</span>
                            {inCollection && <Check className="w-4 h-4 text-indigo-500 shrink-0" />}
                          </button>
                        );
                      })}
                      <div className="border-t border-zinc-100 dark:border-zinc-700/60 mt-1 pt-1">
                        <button
                          onClick={() => {
                            setShowCollections(false);
                            setIsCreatingCollection(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left text-indigo-600 dark:text-indigo-400 font-medium hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                        >
                          <FolderPlus className="w-4 h-4" />
                          New Collection
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {isCreatingCollection && (
                <CreateCollectionModal
                  onClose={() => setIsCreatingCollection(false)}
                  onSubmit={(name) => {
                    createCollection(name, [flag.id]);
                  }}
                />
              )}

              <button
                onClick={() => toggleFavorite(flag.id)}
                className={`p-2 rounded-xl border transition-colors ${
                  isFavorite(flag.id)
                    ? 'border-amber-200 bg-amber-50 text-amber-500 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50'
                    : 'border-zinc-200 bg-white text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:text-amber-500'
                }`}
                title="Toggle Favorite"
              >
                <Star className={`w-4 h-4 ${isFavorite(flag.id) ? 'fill-current' : ''}`} />
              </button>

              {/* Previous / Next buttons */}
              {flagsList.length > 1 && (
                <div className="flex items-center gap-1 mr-1">
                  <button
                    id="flag-modal-prev-btn"
                    onClick={handlePrev}
                    disabled={!hasPrev}
                    aria-label="Previous flag"
                    title="Previous Flag (Left Arrow)"
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    id="flag-modal-next-btn"
                    onClick={handleNext}
                    disabled={!hasNext}
                    aria-label="Next flag"
                    title="Next Flag (Right Arrow)"
                    className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              <button
                id="flag-modal-close-btn"
                onClick={onClose}
                aria-label="Close modal"
                title="Close (Esc)"
                className="p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Interactive Zoom/Pan Canvas Area */}
          <div className="relative flex-1 bg-zinc-950 flex items-center justify-center overflow-hidden select-none">
            {/* Zoom / Pan Instructions Overlay */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/60 backdrop-blur-md text-zinc-300 px-3 py-1.5 rounded-lg text-xs pointer-events-none border border-white/10 select-none">
              <Move className="w-3.5 h-3.5" />
              <span>{scale > 1 ? 'Drag anywhere to pan | Double-click to reset' : 'Scroll / buttons to zoom | Double-click to zoom'}</span>
            </div>

            {/* Floating Zoom Controls Bar */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5 bg-zinc-900/90 backdrop-blur-md p-1.5 px-2.5 rounded-2xl border border-zinc-700 shadow-2xl select-none">
              <button
                id="flag-zoom-out-btn"
                onClick={zoomOut}
                disabled={scale <= 1}
                title="Zoom Out (-)"
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ZoomOut className="w-4 h-4" />
              </button>

              <span className="text-xs font-bold text-white px-2 min-w-[56px] text-center">
                {Math.round(scale * 100)}%
              </span>

              <button
                id="flag-zoom-in-btn"
                onClick={zoomIn}
                disabled={scale >= 6}
                title="Zoom In (+)"
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
              </button>

              <div className="w-px h-4 bg-zinc-700 mx-1" />

              <button
                id="flag-zoom-reset-btn"
                onClick={resetZoom}
                title="Reset Zoom (0)"
                className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
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
              className="w-full h-full p-4 sm:p-8 md:p-10 flex items-center justify-center overflow-hidden touch-none select-none"
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
                  className="w-auto h-auto max-w-[95%] max-h-[92%] object-contain rounded-lg shadow-2xl drop-shadow-2xl ring-1 ring-white/10 pointer-events-none select-none"
                />
              </div>
            </div>
          </div>

          {/* Metadata & Progress Footer */}
          <div className="p-3.5 sm:px-6 sm:py-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            {/* Territory Tags */}
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/60 text-xs font-semibold">
                <Globe2 className="w-3.5 h-3.5" />
                <span>{flag.continent}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-700 text-xs font-semibold">
                <Layers className="w-3.5 h-3.5" />
                <span>{flag.category}</span>
              </div>
              {flag.status ? (
                (flag.creator || flag.sourceUrl) ? (
                  <div className="relative inline-block">
                    <button
                      id="flag-bottom-status-origin-btn"
                      type="button"
                      onClick={() => setShowFanMadePopover(prev => !prev)}
                      className="group inline-flex items-center gap-1 cursor-pointer select-none rounded-xl transition-transform active:scale-95 focus:outline-none"
                      title="Click to view creator and origin link details"
                    >
                      <StatusBadge
                        status={flag.status}
                        className="group-hover:ring-2 group-hover:ring-zinc-400/30 dark:group-hover:ring-zinc-600/40 transition-all"
                      />
                      <span className="p-0.5 rounded-full text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
                        <Info className="w-3.5 h-3.5" />
                      </span>
                    </button>

                    <AnimatePresence>
                      {showFanMadePopover && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowFanMadePopover(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full mb-2.5 left-0 w-72 sm:w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl shadow-xl z-50 p-4"
                          >
                            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                                  <User className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                    Creator & Origin
                                  </h4>
                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                                    {flag.status ? `${flag.status.charAt(0).toUpperCase() + flag.status.slice(1)} flag attribution` : 'Flag attribution & link'}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowFanMadePopover(false)}
                                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="mt-3 space-y-2.5">
                              {flag.creator && (
                                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80">
                                  <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                                      Creator / Designer
                                    </div>
                                    <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                      {flag.creator}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {flag.sourceUrl ? (
                                <div>
                                  <a
                                    href={flag.sourceUrl.startsWith('http') ? flag.sourceUrl : `https://${flag.sourceUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs group cursor-pointer active:scale-98"
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <ExternalLink className="w-3.5 h-3.5 text-zinc-300 dark:text-indigo-200 group-hover:text-white" />
                                      <span className="truncate">Open Origin / Link</span>
                                    </span>
                                    <span className="text-[10px] opacity-75 font-normal truncate max-w-[110px]">
                                      {flag.sourceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    </span>
                                  </a>
                                </div>
                              ) : (
                                <div className="text-[11px] text-zinc-400 dark:text-zinc-500 italic px-1 flex items-center gap-1.5">
                                  <Link2 className="w-3 h-3 shrink-0" />
                                  <span>No external link specified.</span>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <StatusBadge status={flag.status} />
                )
              ) : (
                (flag.creator || flag.sourceUrl) && (
                  <div className="relative inline-block">
                    <button
                      id="flag-bottom-creator-btn"
                      type="button"
                      onClick={() => setShowFanMadePopover(prev => !prev)}
                      className="group inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-100 hover:bg-zinc-200/80 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold transition-all cursor-pointer select-none active:scale-95"
                      title="Click to view creator and origin details"
                    >
                      <User className="w-3.5 h-3.5 text-indigo-500" />
                      <span>{flag.creator ? `By ${flag.creator}` : 'Origin Link'}</span>
                      <Info className="w-3 h-3 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-200" />
                    </button>

                    <AnimatePresence>
                      {showFanMadePopover && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowFanMadePopover(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 4 }}
                            transition={{ duration: 0.15 }}
                            className="absolute bottom-full mb-2.5 left-0 w-72 sm:w-80 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700/80 rounded-2xl shadow-xl z-50 p-4"
                          >
                            <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100 dark:border-zinc-800">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shrink-0">
                                  <User className="w-4 h-4 text-indigo-500" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
                                    Creator & Origin
                                  </h4>
                                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Flag attribution & link</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowFanMadePopover(false)}
                                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="mt-3 space-y-2.5">
                              {flag.creator && (
                                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80">
                                  <User className="w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 mt-0.5" />
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider">
                                      Creator / Designer
                                    </div>
                                    <div className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
                                      {flag.creator}
                                    </div>
                                  </div>
                                </div>
                              )}

                              {flag.sourceUrl && (
                                <div>
                                  <a
                                    href={flag.sourceUrl.startsWith('http') ? flag.sourceUrl : `https://${flag.sourceUrl}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white text-xs font-semibold transition-all shadow-xs group cursor-pointer active:scale-98"
                                  >
                                    <span className="flex items-center gap-2 truncate">
                                      <ExternalLink className="w-3.5 h-3.5 text-zinc-300 dark:text-indigo-200 group-hover:text-white" />
                                      <span className="truncate">Open Origin / Link</span>
                                    </span>
                                    <span className="text-[10px] opacity-75 font-normal truncate max-w-[110px]">
                                      {flag.sourceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    </span>
                                  </a>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                )
              )}
              {flag.country && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold ${
                    flag.category === 'Fictional'
                      ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/60'
                      : flag.category === 'Pirate Flags'
                      ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60'
                      : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  }`}
                >
                  {flag.category === 'Fictional' ? (
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  ) : flag.category === 'Pirate Flags' ? (
                    <Skull className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                  ) : (
                    <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  )}
                  <span>{flag.country}</span>
                </div>
              )}
              {flag.aliases && flag.aliases.length > 0 && (
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/60 text-xs font-semibold"
                  title={`Aliases: ${flag.aliases.join(', ')}`}
                >
                  <Tag className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>Aliases: {flag.aliases.join(', ')}</span>
                </div>
              )}
              {flag.tags && flag.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {flag.tags.map((tag, idx) => (
                    <span
                      key={`${tag}-${idx}`}
                      className="px-2.5 py-0.5 rounded-xl text-xs font-semibold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <span className="sm:hidden px-2.5 py-1 rounded-xl text-xs font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700">
                Code: {flag.code.toUpperCase()}
              </span>
            </div>

            {/* User Quiz Mastery Stat for this Flag */}
            <div className="flex items-center gap-3 ml-auto shrink-0 self-center">
              {attempts === 0 ? (
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-medium">
                  <HelpCircle className="w-4 h-4 text-zinc-400" />
                  <span>Unattempted in Quiz</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs font-medium">
                  {isMastered ? (
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Mastered ({accuracy}%)
                    </span>
                  ) : needsPractice ? (
                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                      <AlertCircle className="w-4 h-4" />
                      Needs Practice ({accuracy}%)
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <Sparkles className="w-4 h-4" />
                      Learning ({accuracy}%)
                    </span>
                  )}
                  <span className="text-zinc-400 dark:text-zinc-500">
                    ({correct}/{attempts} correct)
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
