import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Star, Search, Check } from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';
import { FICTIONAL_MEDIA_TYPES } from '../data/fictional';

interface FictionalUniverseSubMenuProps {
  selectedUniverse: string;
  onSelectUniverse: (universe: string) => void;
}

export function FictionalUniverseSubMenu({
  selectedUniverse,
  onSelectUniverse,
}: FictionalUniverseSubMenuProps) {
  const { flags: FLAGS } = useFlags();
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const options = useMemo(() => {
    const flags = FLAGS.filter(f => f.category === 'Fictional' && f.country);
    return Array.from(new Set(flags.map(f => f.country as string))).sort();
  }, []);

  const filtered = useMemo(() => {
    return options.filter(o => o && (o as string).toLowerCase().includes(search.toLowerCase()));
  }, [options, search]);

  const franchises = useMemo(() => {
    return filtered.filter(opt => !FICTIONAL_MEDIA_TYPES.includes(opt));
  }, [filtered]);

  const media = useMemo(() => {
    return filtered.filter(opt => FICTIONAL_MEDIA_TYPES.includes(opt));
  }, [filtered]);

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-zinc-400" />
          <span>Select Universe ({selectedUniverse})</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isExpanded && (
        <div className="border-t border-zinc-200 dark:border-zinc-700 p-2">
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-7 pr-2 py-1.5 text-xs bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div className="max-h-56 overflow-y-auto flex flex-col gap-0.5">
            <button
              onClick={() => onSelectUniverse('All')}
              className={`text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                selectedUniverse === 'All' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              All Universes
              {selectedUniverse === 'All' && <Check className="w-3.5 h-3.5" />}
            </button>

            {franchises.length > 0 && (
              <div className="mt-2 mb-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-0.5 border-b border-zinc-100 dark:border-zinc-700/60 mb-1">
                  Franchises / Universes
                </div>
                {franchises.map(opt => (
                  <button
                    key={opt}
                    onClick={() => onSelectUniverse(opt)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                      selectedUniverse === opt ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {selectedUniverse === opt && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}

            {media.length > 0 && (
              <div className="mt-2 mb-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 px-2 py-0.5 border-b border-zinc-100 dark:border-zinc-700/60 mb-1">
                  Media
                </div>
                {media.map(opt => (
                  <button
                    key={opt}
                    onClick={() => onSelectUniverse(opt)}
                    className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                      selectedUniverse === opt ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <span className="truncate">{opt}</span>
                    {selectedUniverse === opt && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
