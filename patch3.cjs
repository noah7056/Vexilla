const fs = require('fs');
let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

// We need to inject Filter icon if not present
if (!content.includes('Filter')) {
    content = content.replace("import { Search,", "import { Search, Filter,");
}

// 1. Remove Continents Chips and Flag Status Chips and the old Active Search Filter Tags
const removeSectionRegex = /\{\/\* Continents Chips \*\/\}[\s\S]*?<\/div>(\s*<\/div>)?\s*\{\/\* Flag Status Chips \*\/\}[\s\S]*?<\/div>\s*<\/div>/;
content = content.replace(removeSectionRegex, "");

const removeSearchTagsRegex = /\{\/\* Active Search Filter Tags \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*\)\}/;
content = content.replace(removeSearchTagsRegex, "");

// 2. Add Additional Filters and Active Filters below Categories
const additionalFiltersString = `
        {/* Additional Filters row */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-400 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
              Additional Filters
            </span>
          </div>
          <div className="flex flex-wrap gap-2 relative z-20">
             {/* Continents Filter */}
             <div className="relative inline-flex items-center">
                 <button onClick={selectAllContinents} className={\`px-3 py-1.5 rounded-l-xl text-xs font-medium border-y border-l transition-all flex items-center gap-1.5 \${selectedContinents.includes('All') ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'}\`}>
                    Continents
                 </button>
                 <button onClick={() => setOpenSubmenu(openSubmenu === '__continents__' ? null : '__continents__')} className={\`px-2 py-1.5 rounded-r-xl border transition-all flex items-center justify-center \${selectedContinents.includes('All') ? 'border-indigo-500 bg-indigo-600/90 text-white hover:bg-indigo-700' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}\`}>
                    <Settings2 className="w-3.5 h-3.5" />
                 </button>
                 {openSubmenu === '__continents__' && (
                     <>
                        <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                        <div className="absolute top-[calc(100%+4px)] left-0 min-w-[280px] max-w-[400px] sm:min-w-[400px] max-h-[32rem] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden">
                           <div className="overflow-y-auto p-2 flex flex-col gap-2 flex-1">
                               <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1 w-full mt-1">Select Continents</div>
                               <div className="flex flex-wrap gap-1.5">
                                   {ALL_CONTINENTS.map(cont => {
                                       const isSelected = !selectedContinents.includes('All') && selectedContinents.includes(cont);
                                       return (
                                           <button key={cont} onClick={() => toggleContinent(cont)} className={\`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 \${isSelected ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'}\`}>
                                              {cont}
                                           </button>
                                       );
                                   })}
                               </div>
                           </div>
                           <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                               <button onClick={() => setOpenSubmenu(null)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">Done</button>
                           </div>
                        </div>
                     </>
                 )}
             </div>

             {/* Statuses Filter */}
             <div className="relative inline-flex items-center">
                 <button onClick={selectAllStatuses} className={\`px-3 py-1.5 rounded-l-xl text-xs font-medium border-y border-l transition-all flex items-center gap-1.5 \${selectedStatuses.includes('All') ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'}\`}>
                    Flag Status
                 </button>
                 <button onClick={() => setOpenSubmenu(openSubmenu === '__statuses__' ? null : '__statuses__')} className={\`px-2 py-1.5 rounded-r-xl border transition-all flex items-center justify-center \${selectedStatuses.includes('All') ? 'border-indigo-500 bg-indigo-600/90 text-white hover:bg-indigo-700' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}\`}>
                    <Settings2 className="w-3.5 h-3.5" />
                 </button>
                 {openSubmenu === '__statuses__' && (
                     <>
                        <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                        <div className="absolute top-[calc(100%+4px)] left-0 min-w-[280px] max-w-[400px] sm:min-w-[400px] max-h-[32rem] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden">
                           <div className="overflow-y-auto p-2 flex flex-col gap-2 flex-1">
                               <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1 w-full mt-1">Select Status</div>
                               <div className="flex flex-wrap gap-1.5">
                                   {[...ALL_STATUSES, 'unspecified'].map(st => {
                                       const isSelected = !selectedStatuses.includes('All') && selectedStatuses.includes(st);
                                       return (
                                           <button key={st} onClick={() => toggleStatus(st)} className={\`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 capitalize \${isSelected ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'}\`}>
                                              {st}
                                           </button>
                                       );
                                   })}
                               </div>
                           </div>
                           <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                               <button onClick={() => setOpenSubmenu(null)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">Done</button>
                           </div>
                        </div>
                     </>
                 )}
             </div>

             {/* Tags Filter */}
             <div className="relative inline-flex items-center">
                 <button onClick={() => setSearchTags([])} className={\`px-3 py-1.5 rounded-l-xl text-xs font-medium border-y border-l transition-all flex items-center gap-1.5 \${searchTags.length === 0 ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'}\`}>
                    Tags
                 </button>
                 <button onClick={() => setOpenSubmenu(openSubmenu === '__tags__' ? null : '__tags__')} className={\`px-2 py-1.5 rounded-r-xl border transition-all flex items-center justify-center \${searchTags.length === 0 ? 'border-indigo-500 bg-indigo-600/90 text-white hover:bg-indigo-700' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'}\`}>
                    <Settings2 className="w-3.5 h-3.5" />
                 </button>
                 {openSubmenu === '__tags__' && (
                     <>
                        <div className="fixed inset-0 z-[40]" onClick={() => setOpenSubmenu(null)} />
                        <div className="absolute top-[calc(100%+4px)] left-0 min-w-[280px] max-w-[400px] sm:min-w-[400px] max-h-[32rem] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl z-[50] flex flex-col overflow-hidden">
                           <div className="p-2 border-b border-zinc-100 dark:border-zinc-700">
                               <div className="relative">
                                   <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                                   <input
                                      type="text"
                                      autoFocus
                                      placeholder="Search tags..."
                                      value={submenuSearch}
                                      onChange={e => setSubmenuSearch(e.target.value)}
                                      className="w-full pl-7 pr-2 py-1.5 text-sm bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/40 text-zinc-900 dark:text-white placeholder:text-zinc-400"
                                   />
                               </div>
                           </div>
                           <div className="overflow-y-auto p-2 flex flex-col gap-2 flex-1">
                               <div className="flex flex-wrap gap-1.5">
                                   {(() => {
                                      const allTags = Array.from(new Set(FLAGS.flatMap(f => f.tags || []))).sort();
                                      const filteredTags = allTags.filter(t => t.toLowerCase().includes(submenuSearch.toLowerCase()));
                                      if (filteredTags.length === 0) return <div className="p-4 text-center text-xs text-zinc-500">No tags found</div>;
                                      return filteredTags.map(tag => {
                                          const isSelected = searchTags.includes(tag);
                                          return (
                                              <button key={tag} onClick={() => {
                                                  setSearchTags(prev => isSelected ? prev.filter(t => t !== tag) : [...prev, tag]);
                                              }} className={\`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 \${isSelected ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs' : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'}\`}>
                                                 {tag}
                                              </button>
                                          );
                                      });
                                   })()}
                               </div>
                           </div>
                           <div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">
                               <button onClick={() => setOpenSubmenu(null)} className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm">Done</button>
                           </div>
                        </div>
                     </>
                 )}
             </div>
          </div>
        </div>
`;

// 3. Update the Active Submenu Selections (Chips) logic to include the extra filters
const oldActiveFiltersRegex = /\{\/\* Active Submenu Selections \(Chips\) \*\/\}[\s\S]*?<\/div>\s*<\/div>\s*\)\}/;

const newActiveFilters = `{/* Active Submenu Selections (Chips) */}` + `
          {(Object.entries(selectedSubOptions as Record<string, string[]>).some(([_, opts]) => opts.length > 0) || !selectedContinents.includes('All') || !selectedStatuses.includes('All') || searchTags.length > 0) && (
             <div className="mt-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col gap-2">
                 <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Selected Filters</div>
                 <div className="flex flex-col gap-2">
                     {/* Sub-options from categories */}
                     {Object.entries(selectedSubOptions as Record<string, string[]>).map(([cat, opts]) => {
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

                     {/* Continents */}
                     {!selectedContinents.includes('All') && (
                         <div className="flex flex-wrap items-center gap-1.5">
                             <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">Continents:</span>
                             {selectedContinents.map(cont => (
                                 <span key={cont} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium bg-teal-100/50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-500/30">
                                     {cont}
                                     <button onClick={() => toggleContinent(cont)} className="p-0.5 hover:bg-teal-200 dark:hover:bg-teal-500/40 rounded-md transition-colors"><X className="w-3 h-3" /></button>
                                 </span>
                             ))}
                         </div>
                     )}

                     {/* Statuses */}
                     {!selectedStatuses.includes('All') && (
                         <div className="flex flex-wrap items-center gap-1.5">
                             <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">Status:</span>
                             {selectedStatuses.map(st => (
                                 <span key={st} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium capitalize bg-orange-100/50 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-500/30">
                                     {st}
                                     <button onClick={() => toggleStatus(st)} className="p-0.5 hover:bg-orange-200 dark:hover:bg-orange-500/40 rounded-md transition-colors"><X className="w-3 h-3" /></button>
                                 </span>
                             ))}
                         </div>
                     )}

                     {/* Tags */}
                     {searchTags.length > 0 && (
                         <div className="flex flex-wrap items-center gap-1.5">
                             <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 mr-1">Tags:</span>
                             {searchTags.map(tag => (
                                 <span key={tag} className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 rounded-lg text-xs font-medium bg-fuchsia-100/50 dark:bg-fuchsia-500/20 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-500/30">
                                     {tag}
                                     <button onClick={() => setSearchTags(prev => prev.filter(t => t !== tag))} className="p-0.5 hover:bg-fuchsia-200 dark:hover:bg-fuchsia-500/40 rounded-md transition-colors"><X className="w-3 h-3" /></button>
                                 </span>
                             ))}
                         </div>
                     )}
                 </div>
             </div>
          )}`;

content = content.replace(oldActiveFiltersRegex, additionalFiltersString + '\n\n' + newActiveFilters);

fs.writeFileSync('src/components/FlagDictionary.tsx', content);
