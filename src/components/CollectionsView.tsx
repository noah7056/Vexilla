import { useState, useMemo } from 'react';
import { Collection, useCollections } from '../hooks/useCollections';
import { useFlags } from '../contexts/FlagsContext';
import { FlagImage } from './FlagImage';
import { FolderHeart, MoreVertical, Plus, Edit2, Trash2, X, Play, Search, XCircle } from 'lucide-react';
import { FlagModal } from './FlagModal';
import { CreateCollectionModal } from './CreateCollectionModal';
import { DeleteCollectionModal } from './DeleteCollectionModal';

export function CollectionsView() {
  const { flags: FLAGS } = useFlags();
  const { collections, createCollection, updateCollectionName, deleteCollection, removeFlagFromCollection } = useCollections();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);
  const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [collectionToDelete, setCollectionToDelete] = useState<Collection | null>(null);
  
  const [searchCollections, setSearchCollections] = useState('');
  const [searchFlags, setSearchFlags] = useState('');

  const activeCollection = useMemo(() => collections.find(c => c.id === activeCollectionId), [collections, activeCollectionId]);

  const filteredCollections = useMemo(() => {
    if (!searchCollections.trim()) return collections;
    const term = searchCollections.toLowerCase().trim();
    return collections.filter(c => c.name.toLowerCase().includes(term));
  }, [collections, searchCollections]);

  const activeFlags = useMemo(() => {
    if (!activeCollection) return [];
    const uniqueIds = Array.from(new Set(activeCollection.flagIds));
    let flags = uniqueIds.map(id => FLAGS.find(f => f.id === id)).filter(Boolean) as typeof FLAGS;
    if (searchFlags.trim()) {
      const term = searchFlags.toLowerCase().trim();
      flags = flags.filter(flag => {
        return (
          flag.name.toLowerCase().includes(term) ||
          flag.code.toLowerCase().includes(term) ||
          (flag.continent && flag.continent.toLowerCase().includes(term)) ||
          flag.category.toLowerCase().includes(term) ||
          (flag.status && flag.status.toLowerCase().includes(term)) ||
          (flag.country && flag.country.toLowerCase().includes(term)) ||
          (flag.aliases && flag.aliases.some((alias) => alias && alias.toLowerCase().includes(term))) ||
          (flag.tags && flag.tags.some((tag) => tag && tag.toLowerCase().includes(term)))
        );
      });
    }
    return flags;
  }, [activeCollection, searchFlags, FLAGS]);

  const handleCreate = (name: string) => {
    createCollection(name);
  };

  const handleEdit = (c: Collection) => {
    setEditingId(c.id);
    setEditName(c.name);
  };

  const handleSaveEdit = () => {
    if (editingId && editName.trim()) {
      updateCollectionName(editingId, editName.trim());
      setEditingId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (collectionToDelete) {
      deleteCollection(collectionToDelete.id);
      if (activeCollectionId === collectionToDelete.id) {
        setActiveCollectionId(null);
      }
      setCollectionToDelete(null);
    }
  };

  if (activeCollection) {
    return (
      <div className="w-full max-w-7xl mx-auto py-6 px-4 flex flex-col relative z-0 h-full">
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <button 
              onClick={() => {
                setActiveCollectionId(null);
                setSearchFlags('');
              }}
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline self-start flex items-center gap-1"
            >
              &larr; Back to Collections
            </button>
            <div className="flex flex-wrap items-center gap-2">
              {editingId === activeCollection.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={handleSaveEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  autoFocus
                  className="text-xl sm:text-2xl font-bold bg-white dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-500/60 rounded-xl px-2.5 py-1 text-zinc-900 dark:text-zinc-100 outline-none ring-2 ring-indigo-500/20"
                />
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
                    <FolderHeart className="w-7 h-7 text-indigo-500" />
                    {activeCollection.name}
                  </h2>
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => handleEdit(activeCollection)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      title="Rename collection"
                      aria-label="Rename collection"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setCollectionToDelete(activeCollection)}
                      className="p-1.5 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title="Delete collection"
                      aria-label="Delete collection"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
            <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
              {activeCollection.flagIds.length} flags in this collection.
            </p>
          </div>

          <div className="relative w-full md:w-72 flex-shrink-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search flags in this collection..."
              value={searchFlags}
              onChange={(e) => setSearchFlags(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-400 shadow-xs"
            />
            {searchFlags && (
              <button
                type="button"
                onClick={() => setSearchFlags('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                title="Clear text input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {collectionToDelete && (
          <DeleteCollectionModal
            collection={collectionToDelete}
            onClose={() => setCollectionToDelete(null)}
            onConfirm={handleConfirmDelete}
          />
        )}

        {activeFlags.length === 0 ? (
          <div className="text-center py-24 flex flex-col items-center justify-center flex-1 my-auto">
            <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg font-medium">
              {searchFlags.trim() ? "No flags match your search." : "This collection is empty."}
            </p>
            {!searchFlags.trim() && (
              <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Add flags from the Dictionary.</p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 md:gap-5 pb-8 overflow-y-auto">
            {activeFlags.map(flag => (
              <div 
                key={flag.id}
                className="group relative bg-white dark:bg-zinc-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-zinc-100 dark:border-zinc-700/60 flex flex-col"
                onClick={() => setSelectedFlagId(flag.id)}
              >
                <div className="aspect-[3/2] overflow-hidden bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center p-2">
                  <FlagImage flag={flag} className="w-full h-full object-contain filter drop-shadow-sm transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-3 text-center bg-white dark:bg-zinc-800 border-t border-zinc-100 dark:border-zinc-700/60">
                  <h3 className="text-[11px] sm:text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide truncate">
                    {flag.name}
                  </h3>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); removeFlagFromCollection(activeCollection.id, flag.id); }}
                  className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm rounded-full text-zinc-400 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                  title="Remove from collection"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
        
        {selectedFlagId && (
          <FlagModal
            flag={FLAGS.find(f => f.id === selectedFlagId)!}
            flagsList={activeFlags}
            onClose={() => setSelectedFlagId(null)}
            onSelectFlag={(f) => setSelectedFlagId(f.id)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-6 px-4 flex flex-col relative z-0 h-full">
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FolderHeart className="w-7 h-7 text-indigo-500" />
            Collections
          </h2>
          <p className="mt-0.5 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Create custom folders to organize and group flags.
          </p>
        </div>
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 dark:text-zinc-500" />
            <input
              type="text"
              placeholder="Search collections..."
              value={searchCollections}
              onChange={(e) => setSearchCollections(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 dark:focus:border-indigo-400 shadow-xs"
            />
            {searchCollections && (
              <button
                type="button"
                onClick={() => setSearchCollections('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                title="Clear text input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button 
            onClick={() => setIsCreating(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm hover:shadow active:scale-95 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Collection</span>
          </button>
        </div>
      </div>

      {isCreating && (
        <CreateCollectionModal
          onClose={() => setIsCreating(false)}
          onSubmit={handleCreate}
        />
      )}

      {collectionToDelete && (
        <DeleteCollectionModal
          collection={collectionToDelete}
          onClose={() => setCollectionToDelete(null)}
          onConfirm={handleConfirmDelete}
        />
      )}

      {collections.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center justify-center flex-1 my-auto">
          <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg font-medium">No collections yet.</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Create one to start organizing flags.</p>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="text-center py-24 flex flex-col items-center justify-center flex-1 my-auto">
          <p className="text-zinc-500 dark:text-zinc-400 text-base sm:text-lg font-medium">No collections found.</p>
          <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-1">Try a different search term.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8 overflow-y-auto">
          {filteredCollections.map((c, idx) => (
            <div key={`${c.id}-${idx}`} className="group bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700/60 overflow-hidden flex flex-col">
              <div 
                className="p-5 flex-1 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-colors"
                onClick={() => setActiveCollectionId(c.id)}
              >
                {editingId === c.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={handleSaveEdit}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveEdit(); }}
                    autoFocus
                    className="w-full bg-white dark:bg-zinc-900 border border-indigo-300 dark:border-indigo-500/50 rounded-lg px-2 py-1 text-zinc-900 dark:text-zinc-100 text-lg font-bold outline-none ring-2 ring-indigo-500/20"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate flex items-center gap-2">
                    <FolderHeart className="w-5 h-5 text-indigo-400" />
                    {c.name}
                  </h3>
                )}
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 font-medium">{c.flagIds.length} flags</p>
                
                {/* Preview thumbnails */}
                <div className="mt-4 flex -space-x-2">
                  {Array.from(new Set(c.flagIds)).slice(0, 4).map((flagId, i) => {
                    const flag = FLAGS.find(f => f.id === flagId);
                    if (!flag) return null;
                    return (
                      <div key={`${c.id}-${flagId}-${i}`} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden relative z-[4]" style={{ zIndex: 4 - i }}>
                        <FlagImage flag={flag} className="w-full h-full object-cover" />
                      </div>
                    );
                  })}
                  {c.flagIds.length > 4 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-zinc-500 dark:text-zinc-300 relative z-0">
                      +{c.flagIds.length - 4}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t border-zinc-100 dark:border-zinc-700/60 p-2 flex justify-end gap-1 bg-zinc-50/50 dark:bg-zinc-900/50">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleEdit(c); }}
                  className="p-1.5 text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                  title="Rename"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); setCollectionToDelete(c); }}
                  className="p-1.5 text-zinc-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                  title="Delete collection"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

