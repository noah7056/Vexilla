const fs = require('fs');

const replacement = `          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={selectAllCategories}
              className={\`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 \${
                selectedCategories.includes('All')
                  ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
              }\`}
            >
              <span>All Categories</span>
              <span
                className={\`text-[10px] px-1 py-0.5 rounded-full \${
                  selectedCategories.includes('All')
                    ? 'bg-indigo-700 text-indigo-100'
                    : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                }\`}
              >
                {FLAGS.length}
              </span>
            </button>
            {ALL_CATEGORIES.map((cat) => {
              const isSelected = !selectedCategories.includes('All') && selectedCategories.includes(cat);
              const count = FLAGS.filter((f) => f.category === cat).length;
              const hasSubOptions = ['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional'].includes(cat);
              const activeSubOptions = selectedSubOptions[cat] || [];
              const hasActiveSub = activeSubOptions.length > 0;
              
              // We want the whole item to look like the button
              const containerClass = isSelected
                      ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300';
              
              return (
                <div key={cat} className="relative flex flex-col">
                  <div className={\`flex border transition-all rounded-xl \${containerClass}\`}>
                    <button
                      onClick={() => toggleCategory(cat)}
                      className={\`flex-1 px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 \${hasSubOptions ? 'rounded-l-xl' : 'rounded-xl'} \${!isSelected && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}\`}
                    >
                      <span>{cat}</span>
                      <span
                        className={\`text-[10px] px-1 py-0.5 rounded-full \${
                          isSelected
                            ? 'bg-indigo-700 text-indigo-100'
                            : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300'
                        }\`}
                      >
                        {count}
                      </span>
                    </button>
                    {hasSubOptions && (
                      <button
                        onClick={(e) => {
                           e.stopPropagation();
                           if (openSubmenu === cat) {
                               setOpenSubmenu(null);
                           } else {
                               setSubmenuSearch('');
                               setOpenSubmenu(cat);
                           }
                        }}
                        className={\`px-2 py-1 flex items-center justify-center rounded-r-xl border-l \${isSelected ? 'border-indigo-500/50 hover:bg-black/10 dark:hover:bg-black/20' : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'} transition-colors\`}
                      >
                        <Settings className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  
                  {/* Submenu Popup */}
                  {openSubmenu === cat && (
                     <>
                        <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                        <div className="absolute top-[calc(100%+4px)] left-0 min-w-[260px] max-w-[320px] max-h-80 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden">
                           <div className="p-2 border-b border-zinc-100 dark:border-zinc-700">
                               <div className="relative">
                                   <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                   <input
                                      type="text"
                                      autoFocus
                                      placeholder={\`Search \${cat}...\`}
                                      value={submenuSearch}
                                      onChange={e => setSubmenuSearch(e.target.value)}
                                      className="w-full pl-7 pr-2 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/40 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                   />
                               </div>
                           </div>
                           <div className="overflow-y-auto p-2 flex flex-col gap-0.5 flex-1 max-h-48">
                               {(() => {
                                   const available = Array.from(new Set(FLAGS.filter(f => f.category === cat && f.country).map(f => f.country as string))).sort();
                                   const filtered = available.filter(opt => opt.toLowerCase().includes(submenuSearch.toLowerCase()));
                                   if (filtered.length === 0) return <div className="p-4 text-center text-xs text-zinc-500">No results found</div>;
                                   
                                   return filtered.map(opt => {
                                       const isOptSelected = activeSubOptions.includes(opt);
                                       return (
                                           <button
                                              key={opt}
                                              onClick={() => {
                                                 // Don't close, just toggle
                                                 setSelectedSubOptions(prev => {
                                                     const newOpts = prev[cat] ? [...prev[cat]] : [];
                                                     if (newOpts.includes(opt)) {
                                                         const filteredOpts = newOpts.filter(o => o !== opt);
                                                         return { ...prev, [cat]: filteredOpts };
                                                     } else {
                                                         return { ...prev, [cat]: [...newOpts, opt] };
                                                     }
                                                 });
                                                 // Also ensure category is selected
                                                 if (!selectedCategories.includes(cat)) {
                                                     setSelectedCategories(prev => {
                                                         const newCats = prev.includes('All') ? [cat] : [...prev, cat];
                                                         return newCats.length === ALL_CATEGORIES.length ? ['All'] : newCats;
                                                     });
                                                 }
                                              }}
                                              className={\`w-full text-left px-2 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-between \${
                                                 isOptSelected
                                                   ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300'
                                                   : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700/50'
                                              }\`}
                                           >
                                              <span className="truncate">{opt}</span>
                                              {isOptSelected && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                                           </button>
                                       )
                                   })
                               })()}
                           </div>
                           <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                               <button onClick={() => setOpenSubmenu(null)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">Done</button>
                           </div>
                        </div>
                     </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Submenu Selections (Chips) */}
          {Object.entries(selectedSubOptions).some(([_, opts]) => opts.length > 0) && (
             <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-2">
                 <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Selected Sub-categories</div>
                 <div className="flex flex-col gap-2">
                     {Object.entries(selectedSubOptions).map(([cat, opts]) => {
                         if (opts.length === 0) return null;
                         return (
                             <div key={cat} className="flex flex-wrap items-center gap-1.5">
                                 <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">{cat}:</span>
                                 {opts.map(opt => (
                                     <span key={opt} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium bg-indigo-100/50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/30">
                                         {opt}
                                         <button
                                            onClick={() => {
                                                 setSelectedSubOptions(prev => {
                                                     const newOpts = prev[cat].filter(o => o !== opt);
                                                     return { ...prev, [cat]: newOpts };
                                                 });
                                            }}
                                            className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-500/40 rounded-md transition-colors"
                                         >
                                             <X className="w-3 h-3" />
                                         </button>
                                     </span>
                                 ))}
                             </div>
                         )
                     })}
                 </div>
             </div>
          )}`;

let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

const targetRegex = /<div className="flex flex-wrap gap-1\.5">.*?\{\/\* Sub-filter for Region \/ Nation.*?\}\)/s;
// The replacement ends right before Continents Chips. Let's find exactly what to replace.

let index1 = content.indexOf('<div className="flex flex-wrap gap-1.5">');
let index2 = content.indexOf('{/* Continents Chips */}');
if (index1 !== -1 && index2 !== -1) {
    content = content.substring(0, index1) + replacement + '\n\n        ' + content.substring(index2);
    fs.writeFileSync('src/components/FlagDictionary.tsx', content);
    console.log("Patched successfully");
} else {
    console.log("Could not find boundaries", index1, index2);
}

