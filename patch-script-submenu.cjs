const fs = require('fs');

const replacement = `                           <div className="overflow-y-auto p-2 flex flex-col gap-2 flex-1 max-h-72">
                               {(() => {
                                   const availableFlags = FLAGS.filter(f => f.category === cat && f.country);
                                   const grouped = {};
                                   availableFlags.forEach(f => {
                                       // Fictional might have continent as 'Fictional', others have real continents.
                                       const cont = f.continent || 'Other';
                                       if (!grouped[cont]) grouped[cont] = new Set();
                                       grouped[cont].add(f.country);
                                   });
                                   
                                   const sortedContinents = Object.keys(grouped).sort();
                                   const filteredGroups = sortedContinents.map(cont => ({
                                       continent: cont,
                                       options: Array.from(grouped[cont]).sort().filter(opt => opt.toLowerCase().includes(submenuSearch.toLowerCase()))
                                   })).filter(g => g.options.length > 0);

                                   if (filteredGroups.length === 0) return <div className="p-4 text-center text-xs text-zinc-500">No results found</div>;
                                   
                                   return filteredGroups.map(group => (
                                       <div key={group.continent} className="flex flex-col gap-0.5">
                                           {sortedContinents.length > 1 && (
                                              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1 first:mt-0">
                                                  {group.continent}
                                              </div>
                                           )}
                                           {group.options.map(opt => {
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
                                           })}
                                       </div>
                                   ));
                               })()}
                           </div>`;

let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

const targetRegex = /<div className="overflow-y-auto p-2 flex flex-col gap-0\.5 flex-1 max-h-48">.*?<\/div>/s;

// We should precisely replace between `<div className="overflow-y-auto p-2 flex flex-col gap-0.5 flex-1 max-h-48">` and `                           </div>`
// Let's use indexOf instead to be safer.

let index1 = content.indexOf('<div className="overflow-y-auto p-2 flex flex-col gap-0.5 flex-1 max-h-48">');
let index2 = content.indexOf('<div className="p-2 border-t border-zinc-100 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end">', index1);

if (index1 !== -1 && index2 !== -1) {
    content = content.substring(0, index1) + replacement + '\n                           ' + content.substring(index2);
    
    // Also, we want to make the popup wider as requested:
    // Old: min-w-[260px] max-w-[320px] max-h-80
    // New: min-w-[300px] max-w-[400px] sm:min-w-[400px] max-h-[28rem]
    content = content.replace(
        'left-0 min-w-[260px] max-w-[320px] max-h-80',
        'left-0 min-w-[280px] max-w-[400px] sm:min-w-[400px] max-h-[32rem]'
    );
    
    fs.writeFileSync('src/components/FlagDictionary.tsx', content);
    console.log("Patched successfully");
} else {
    console.log("Could not find boundaries", index1, index2);
}

