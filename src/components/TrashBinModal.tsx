import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Trash2,
  RotateCcw,
  X,
  Search,
  AlertTriangle,
  Check,
  Inbox
} from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';
import { FlagImage } from './FlagImage';
import { StatusBadge } from './StatusBadge';
import { TrashItem } from '../types';

interface TrashBinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 45) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function TrashBinModal({ isOpen, onClose }: TrashBinModalProps) {
  const {
    trash,
    restoreFlag,
    restoreAllDeletedFlags,
    permanentlyDeleteFlag,
    emptyTrash,
  } = useFlags();

  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showEmptyConfirm, setShowEmptyConfirm] = useState(false);
  const [recentlyRestoredName, setRecentlyRestoredName] = useState<string | null>(null);

  // Close or dismiss on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirmDeleteId) {
          setConfirmDeleteId(null);
        } else if (showEmptyConfirm) {
          setShowEmptyConfirm(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, confirmDeleteId, showEmptyConfirm, onClose]);

  // Reset confirmation states when opening or closing
  useEffect(() => {
    if (!isOpen) {
      setConfirmDeleteId(null);
      setShowEmptyConfirm(false);
      setSearchQuery('');
      setRecentlyRestoredName(null);
    }
  }, [isOpen]);

  const filteredTrash = useMemo(() => {
    if (!searchQuery.trim()) return trash;
    const query = searchQuery.toLowerCase().trim();
    return trash.filter(item => {
      const f = item.flag;
      return (
        f.name.toLowerCase().includes(query) ||
        f.code.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query) ||
        (f.country && f.country.toLowerCase().includes(query)) ||
        (f.creator && f.creator.toLowerCase().includes(query))
      );
    });
  }, [trash, searchQuery]);

  const handleRestore = (item: TrashItem) => {
    restoreFlag(item.flag.id);
    setRecentlyRestoredName(item.flag.name);
    setTimeout(() => {
      setRecentlyRestoredName(prev => (prev === item.flag.name ? null : prev));
    }, 3000);
  };

  const handlePermanentDelete = (id: string) => {
    permanentlyDeleteFlag(id);
    setConfirmDeleteId(null);
  };

  const handleEmptyTrash = () => {
    emptyTrash();
    setShowEmptyConfirm(false);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop matching app modal standards */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-zinc-950/70 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Modal Container adhering strictly to the active theme tokens */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 w-full max-w-2xl max-h-[88vh] rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-zinc-900 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/60 dark:border-zinc-700 shadow-2xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Trash Bin
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300/60 dark:border-zinc-700">
                    {trash.length} {trash.length === 1 ? 'flag' : 'flags'}
                  </span>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Review deleted flags to restore them or delete them definitively.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              title="Close (Esc)"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Feedback banner when a flag is restored */}
          {recentlyRestoredName && (
            <div className="mx-5 sm:mx-6 mt-3 px-3.5 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-900 dark:text-indigo-200 text-xs flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>
                  Restored <strong className="font-semibold">{recentlyRestoredName}</strong> back to the flag dictionary!
                </span>
              </div>
              <button
                onClick={() => setRecentlyRestoredName(null)}
                className="text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-200 cursor-pointer p-0.5"
                title="Dismiss"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Search & Bulk Actions Toolbar */}
          {trash.length > 0 && (
            <div className="px-5 sm:px-6 py-3 bg-zinc-100/60 dark:bg-zinc-900/60 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 shrink-0">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search deleted flags..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm bg-zinc-100/90 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 outline-none text-zinc-900 dark:text-zinc-100 transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500 shadow-2xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={restoreAllDeletedFlags}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Restore all flags currently in the trash bin"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Restore All</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowEmptyConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900/60 hover:bg-red-500/10 dark:hover:bg-red-950/30 text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="Definitively delete all flags currently in the trash bin"
                >
                  <Trash2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500" />
                  <span>Empty Trash</span>
                </button>
              </div>
            </div>
          )}

          {/* Empty Trash Confirmation Safeguard */}
          {showEmptyConfirm && (
            <div className="px-5 sm:px-6 py-3.5 bg-zinc-200/60 dark:bg-zinc-800/90 border-b border-zinc-200 dark:border-zinc-700 animate-in fade-in shrink-0">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5 text-xs text-zinc-800 dark:text-zinc-200">
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Definitively delete all {trash.length} flags in trash?</span>
                    <p className="text-zinc-600 dark:text-zinc-400 mt-0.5">
                      This action cannot be undone. All flags in the trash will be permanently deleted.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowEmptyConfirm(false)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300/70 dark:border-zinc-600 hover:bg-zinc-200/80 dark:hover:bg-zinc-600 cursor-pointer transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleEmptyTrash}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer transition-colors"
                  >
                    Yes, Empty Trash
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Flags List Content */}
          <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-900/50">
            {trash.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-3xl bg-zinc-200/60 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 dark:text-zinc-500 mb-4 border border-zinc-300/60 dark:border-zinc-700">
                  <Inbox className="w-8 h-8 opacity-60" />
                </div>
                <h4 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Trash is Empty
                </h4>
                <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5 leading-relaxed">
                  Deleted flags will appear here so you can review and restore them back to the dictionary or delete them definitively.
                </p>
              </div>
            ) : filteredTrash.length === 0 ? (
              <div className="py-12 text-center text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm">
                No deleted flags matched "{searchQuery}".
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredTrash.map(item => {
                  const flag = item.flag;
                  const isConfirmingThis = confirmDeleteId === flag.id;

                  return (
                    <div
                      key={flag.id}
                      className={`p-3 sm:p-3.5 rounded-2xl border transition-all ${
                        isConfirmingThis
                          ? 'bg-zinc-200/80 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 shadow-sm'
                          : 'bg-zinc-100/90 dark:bg-zinc-800/80 border-zinc-200 dark:border-zinc-700/80 hover:border-zinc-300 dark:hover:border-zinc-600 shadow-2xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        
                        {/* Flag Preview & Metadata */}
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Flag Thumbnail Container */}
                          <div className="w-16 h-11 sm:w-20 sm:h-13 rounded-xl overflow-hidden shadow-2xs border border-zinc-200 dark:border-zinc-700/80 shrink-0 bg-zinc-200/60 dark:bg-zinc-900 flex items-center justify-center p-1">
                            <FlagImage
                              flag={flag}
                              className="w-full h-full object-contain drop-shadow-2xs rounded-sm"
                            />
                          </div>

                          {/* Info */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                {flag.name}
                              </h4>
                              {flag.status && (
                                <StatusBadge status={flag.status} size="sm" />
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-500 dark:text-zinc-400 flex-wrap">
                              <span>{flag.category}</span>
                              {flag.country && <span>· {flag.country}</span>}
                              {flag.creator && (
                                <span className="text-zinc-600 dark:text-zinc-300">
                                  · by {flag.creator}
                                </span>
                              )}
                              <span className="text-zinc-400 dark:text-zinc-500">
                                · Deleted {formatRelativeTime(item.deletedAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {isConfirmingThis ? (
                            <div className="flex items-center gap-1.5 animate-in fade-in">
                              <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1 hidden sm:inline">
                                Definitively delete?
                              </span>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-100 dark:bg-zinc-700 border border-zinc-300/70 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200/80 dark:hover:bg-zinc-600 cursor-pointer transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={() => handlePermanentDelete(flag.id)}
                                className="px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs cursor-pointer transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleRestore(item)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all cursor-pointer active:scale-95"
                                title="Restore to dictionary"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(flag.id)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-zinc-200/60 dark:bg-zinc-700/50 hover:bg-red-500/10 dark:hover:bg-red-950/40 text-zinc-600 hover:text-red-600 dark:text-zinc-400 dark:hover:text-red-400 border border-zinc-300/60 dark:border-zinc-600 hover:border-red-400/40 dark:hover:border-red-900/60 transition-all cursor-pointer active:scale-95"
                                title="Delete definitively"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Delete Definitively</span>
                              </button>
                            </>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-5 sm:px-6 py-3.5 bg-zinc-100/80 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 shrink-0">
            <div>
              {trash.length > 0 && (
                <span>
                  Tip: Definitively deleted items cannot be restored.
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-200/60 dark:bg-zinc-800 hover:bg-zinc-300/60 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-300/60 dark:border-zinc-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
