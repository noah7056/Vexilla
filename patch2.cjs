const fs = require('fs');
let content = fs.readFileSync('src/components/ProvinceCountrySubMenu.tsx', 'utf8');

const replacement = `{filteredGroups.map(group => (
              <div key={group.continent} className="flex flex-col gap-0.5">
                {options.length > 1 && (
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 mt-1 first:mt-0">
                    {group.continent}
                  </div>
                )}
                {group.options.map(opt => (
                  <button
                    key={opt as string}
                    onClick={() => onSelectCountry(opt as string)}
                    className={\`text-left px-2 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between \${
                      selectedCountry === opt ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                    }\`}
                  >
                    <span className="truncate">{opt as string}</span>
                    {selectedCountry === opt && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                ))}
              </div>
            ))}`;

const target2 = /\{filtered\.map\(opt => \(\s*<button[\s\S]*?<\/button>\s*\)\)\}/;
content = content.replace(target2, replacement);
fs.writeFileSync('src/components/ProvinceCountrySubMenu.tsx', content);

