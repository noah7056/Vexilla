import { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Users, Search, Check } from 'lucide-react';
import { useFlags } from '../contexts/FlagsContext';

interface LGBTQISubMenuProps {
  selectedSubcategory: string;
  onSelectSubcategory: (subcategory: string) => void;
}

export function LGBTQISubMenu({
  selectedSubcategory,
  onSelectSubcategory,
}: LGBTQISubMenuProps) {
  const { flags: FLAGS } = useFlags();
  const [isExpanded, setIsExpanded] = useState(false);
  const [search, setSearch] = useState('');

  const options = useMemo(() => {
    const flags = FLAGS.filter(f => f.category === 'LGBTQI+' && f.country);
    return Array.from(new Set(flags.map(f => f.country as string))).sort();
  }, []);

  const filtered = options.filter(o => o && (o as string).toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-3 py-2 flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-zinc-400" />
          <span>Select Subcategory ({selectedSubcategory})</span>
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
          <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
            <button
              onClick={() => onSelectSubcategory('All')}
              className={`text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                selectedSubcategory === 'All' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
              }`}
            >
              All Subcategories
              {selectedSubcategory === 'All' && <Check className="w-3.5 h-3.5" />}
            </button>
            {filtered.map(opt => (
              <button
                key={opt as string}
                onClick={() => onSelectSubcategory(opt as string)}
                className={`text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                  selectedSubcategory === opt ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                }`}
              >
                <span className="truncate">{opt as string}</span>
                {selectedSubcategory === opt && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
