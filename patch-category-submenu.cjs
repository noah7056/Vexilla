const fs = require('fs');
let content = fs.readFileSync('src/components/FlagDictionary.tsx', 'utf8');

content = content.replace(
  "hasSubOptions = ['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional']",
  "hasSubOptions = ['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+']"
);

content = content.replace(
  "['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional'].includes(flag.category)",
  "['Provinces & Territories', 'Indigenous & Cultural Populations', 'Fictional', 'LGBTQI+'].includes(flag.category)"
);

const oldSubmenuRender = `{group.options.map(opt => {
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
                                           })}`;

const newSubmenuRender = `<div className="flex flex-wrap gap-1.5">
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
                                                         if (!selectedCategories.includes(cat)) {
                                                             setSelectedCategories(prev => {
                                                                 const newCats = prev.includes('All') ? [cat] : [...prev, cat];
                                                                 return newCats.length === ALL_CATEGORIES.length ? ['All'] : newCats;
                                                             });
                                                         }
                                                      }}
                                                      className={\`px-2.5 py-1 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 \${
                                                         isOptSelected
                                                           ? 'border-indigo-500 bg-indigo-600 text-white font-semibold shadow-xs'
                                                           : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/60 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                                                      }\`}
                                                   >
                                                      <span>{opt}</span>
                                                   </button>
                                               )
                                           })}
                                           </div>`;

content = content.replace(oldSubmenuRender, newSubmenuRender);

const oldContinentHeader = `{sortedContinents.length > 1 && (
                                              <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1 first:mt-0">
                                                  {group.continent}
                                              </div>
                                           )}`;
const newContinentHeader = `{sortedContinents.length > 1 && (
                                              <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-100 dark:border-zinc-700/60 pb-1 w-full">
                                                  {group.continent}
                                              </div>
                                           )}`;
                                           
content = content.replace(oldContinentHeader, newContinentHeader);
content = content.replace('<div key={group.continent} className="flex flex-col gap-0.5">', '<div key={group.continent} className="flex flex-col gap-2 mb-3 last:mb-0">');

fs.writeFileSync('src/components/FlagDictionary.tsx', content);
