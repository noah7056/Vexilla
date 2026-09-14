import { X } from 'lucide-react';
import { Flag } from '../../types';
import { FlagImage } from '../FlagImage';

interface QuizFlagViewerProps {
  flag: Flag;
  onClose: () => void;
}

/**
 * Cheat-proof enlarged flag view for active quizzes: the image only.
 * Deliberately shows no name, code, category, tags, origin, or "show on
 * map" action (the full FlagModal would give the answer away and navigating
 * to Atlas would abandon the round). Results screens keep FlagModal.
 */
export function QuizFlagViewer({ flag, onClose }: QuizFlagViewerProps) {
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
          className="absolute top-3 right-3 p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-700/60 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-full aspect-[3/2] flex items-center justify-center p-2 pt-8">
          <FlagImage
            flag={flag}
            alt="Enlarged flag"
            className="max-w-full max-h-full object-contain rounded-md drop-shadow"
          />
        </div>
      </div>
    </div>
  );
}
