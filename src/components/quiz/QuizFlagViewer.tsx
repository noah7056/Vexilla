import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Flag } from '../../types';
import { FlagImage } from '../FlagImage';

interface QuizFlagViewerProps {
  flag: Flag;
  onClose: () => void;
}

const MIN_SCALE = 1;
const MAX_SCALE = 6;

interface View {
  s: number;
  x: number;
  y: number;
}

function clampView(v: View, w: number, h: number): View {
  const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.s));
  if (s <= 1) return { s: 1, x: 0, y: 0 };
  const mx = (s * w) / 2;
  const my = (s * h) / 2;
  return { s, x: Math.min(mx, Math.max(-mx, v.x)), y: Math.min(my, Math.max(-my, v.y)) };
}

/**
 * Cheat-proof enlarged flag view for active quizzes: the image only, with
 * zoom + pan inspection (wheel, drag, pinch, double-click, toolbar).
 * Deliberately shows no name, code, category, tags, origin, or "show on
 * map" action (the full FlagModal would give the answer away and navigating
 * to Atlas would abandon the round). Results screens keep FlagModal.
 */
export function QuizFlagViewer({ flag, onClose }: QuizFlagViewerProps) {
  const [view, setView] = useState<View>({ s: 1, x: 0, y: 0 });
  const boxRef = useRef<HTMLDivElement>(null);
  // Live mirror for use inside pointer handlers without stale closures.
  const latest = useRef(view);
  latest.current = view;
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDist = useRef<number | null>(null);

  // Fresh flag → reset view. Lock body scroll + Escape to close while open.
  useEffect(() => {
    setView({ s: 1, x: 0, y: 0 });
  }, [flag.id]);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const rectOf = (): DOMRect | null => boxRef.current?.getBoundingClientRect() ?? null;

  const zoomAt = (clientX: number, clientY: number, factor: number) => {
    const r = rectOf();
    if (!r) return;
    const cx = clientX - r.left - r.width / 2;
    const cy = clientY - r.top - r.height / 2;
    setView((prev) => {
      const raw = prev.s * factor;
      const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
      if (s === prev.s) return prev;
      const k = s / prev.s;
      return clampView({ s, x: cx - (cx - prev.x) * k, y: cy - (cy - prev.y) * k }, r.width, r.height);
    });
  };

  const zoomCenter = (factor: number) => {
    const r = rectOf();
    if (!r) return;
    zoomAt(r.left + r.width / 2, r.top + r.height / 2, factor);
  };

  const reset = () => setView({ s: 1, x: 0, y: 0 });

  const onPointerDown = (e: ReactPointerEvent) => {
    try {
      boxRef.current?.setPointerCapture(e.pointerId);
    } catch {}
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts: Array<{ x: number; y: number }> = Array.from(pointers.current.values());
      const a = pts[0];
      const b = pts[1];
      if (a && b) pinchDist.current = Math.hypot(a.x - b.x, a.y - b.y);
    }
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    const prevPos = pointers.current.get(e.pointerId)!;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (pointers.current.size === 2) {
      // Pinch: zoom around the viewport center.
      const pts: Array<{ x: number; y: number }> = Array.from(pointers.current.values());
      const a = pts[0];
      const b = pts[1];
      if (!a || !b) return;
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const d0 = pinchDist.current;
      pinchDist.current = d;
      if (d0 && d0 > 0 && Math.abs(d - d0) > 1) {
        const r = rectOf();
        setView((prev) => {
          const s = Math.min(MAX_SCALE, Math.max(MIN_SCALE, (prev.s * d) / d0));
          return s === prev.s || !r ? prev : clampView({ ...prev, s }, r.width, r.height);
        });
      }
      return;
    }

    // Single pointer: drag to pan (only when zoomed in).
    if (latest.current.s > 1) {
      const dx = e.clientX - prevPos.x;
      const dy = e.clientY - prevPos.y;
      const r = rectOf();
      setView((prev) => (r ? clampView({ ...prev, x: prev.x + dx, y: prev.y + dy }, r.width, r.height) : prev));
    }
  };

  const endPointer = (e: ReactPointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchDist.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-zinc-800 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-zinc-200 dark:border-zinc-700"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          title="Close"
          className="absolute top-3 right-3 z-10 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div
          ref={boxRef}
          onWheel={(e) => zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.15 : 1 / 1.15)}
          onDoubleClick={(e) => {
            if (latest.current.s > 1.5) reset();
            else zoomAt(e.clientX, e.clientY, 2.5);
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointer}
          onPointerCancel={endPointer}
          className={`w-full aspect-[3/2] flex items-center justify-center p-2 pt-8 overflow-hidden touch-none select-none ${
            view.s > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
          }`}
          title={view.s > 1 ? 'Drag to pan • scroll to zoom' : 'Scroll or double-click to zoom'}
        >
          <div
            className="max-w-full max-h-full flex items-center justify-center will-change-transform"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, transformOrigin: 'center' }}
          >
            <FlagImage
              flag={flag}
              alt="Enlarged flag"
              className="max-w-full max-h-full object-contain rounded-md drop-shadow pointer-events-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-3">
          <button
            type="button"
            onClick={() => zoomCenter(1 / 1.4)}
            disabled={view.s <= 1}
            title="Zoom out"
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-semibold text-zinc-400 dark:text-zinc-500 tabular-nums w-11 text-center">
            {Math.round(view.s * 100)}%
          </span>
          <button
            type="button"
            onClick={() => zoomCenter(1.4)}
            disabled={view.s >= MAX_SCALE}
            title="Zoom in"
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={reset}
            disabled={view.s <= 1}
            title="Reset view"
            className="p-2 rounded-xl text-zinc-500 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/60 disabled:opacity-30 disabled:cursor-default transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
