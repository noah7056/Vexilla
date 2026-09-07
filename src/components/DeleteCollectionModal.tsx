import React, { useEffect } from 'react';
import { Collection } from '../hooks/useCollections';
import { Trash2, X, AlertTriangle } from 'lucide-react';

interface DeleteCollectionModalProps {
  collection: Collection;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteCollectionModal({ collection, onClose, onConfirm }: DeleteCollectionModalProps) {
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
    <>
      <div 
        className="fixed inset-0 z-[60] bg-zinc-900/50 backdrop-blur-xs transition-opacity" 
        onClick={onClose} 
      />
      <div className="fixed inset-0 z-[60] flex items-center justify-center pointer-events-none px-4">
        <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 pointer-events-auto overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-100 dark:border-rose-900/60">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Delete Collection</h3>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-5 space-y-3">
            <p className="text-sm text-zinc-700 dark:text-zinc-300">
              Are you sure you want to delete <strong className="font-semibold text-zinc-900 dark:text-white">"{collection.name}"</strong>?
            </p>
            <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-900/50 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <span>
                This collection has <strong>{collection.flagIds.length}</strong> flag{collection.flagIds.length === 1 ? '' : 's'}. Deleting the collection will permanently remove this folder, but the flags will remain available in the dictionary.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 px-5 py-3.5 bg-zinc-50 dark:bg-zinc-900/80 border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/70 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs hover:shadow transition-all cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Collection</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
