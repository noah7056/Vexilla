const fs = require('fs');
let content = fs.readFileSync('src/components/ProvinceCountrySubMenu.tsx', 'utf8');

const replacement = `const options = useMemo(() => {
    const flags = FLAGS.filter(f => categories.includes(f.category) && f.country);
    const grouped = {};
    flags.forEach(f => {
       const cont = f.continent || 'Other';
       if (!grouped[cont]) grouped[cont] = new Set();
       grouped[cont].add(f.country);
    });
    const sortedContinents = Object.keys(grouped).sort();
    return sortedContinents.map(cont => ({
       continent: cont,
       options: Array.from(grouped[cont]).sort()
    }));
  }, [categories]);

  const filteredGroups = options.map(g => ({
    continent: g.continent,
    options: g.options.filter(o => (o as string).toLowerCase().includes(search.toLowerCase()))
  })).filter(g => g.options.length > 0);`;

const target1 = /const options = useMemo\(\(\) => \{[\s\S]*?\}, \[categories\]\);\n\n  const filtered = options\.filter\(o => o\.toLowerCase\(\)\.includes\(search\.toLowerCase\(\)\)\);/;
content = content.replace(target1, replacement);

const replacement2 = `{filteredGroups.map(group => (
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

const target2 = /\{filtered\.map\(opt => \([\s\S]*?\}\)\}/;
content = content.replace(target2, replacement2);

fs.writeFileSync('src/components/ProvinceCountrySubMenu.tsx', content);

let ficContent = fs.readFileSync('src/components/FictionalUniverseSubMenu.tsx', 'utf8');
ficContent = ficContent.replace('options.filter(o => o.toLowerCase()', 'options.filter(o => (o as string).toLowerCase()');
fs.writeFileSync('src/components/FictionalUniverseSubMenu.tsx', ficContent);
