const fs = require('fs');

function patchQuiz() {
    let content = fs.readFileSync('src/components/Quiz.tsx', 'utf8');
    if (!content.includes('LGBTQISubMenu')) {
        content = content.replace("import { FictionalUniverseSubMenu } from './FictionalUniverseSubMenu';", "import { FictionalUniverseSubMenu } from './FictionalUniverseSubMenu';\nimport { LGBTQISubMenu } from './LGBTQISubMenu';");
    }

    const filterCondition = "const matchContinent = flag.category === 'Fictional' || flag.category === 'LGBTQI+' || flag.category === 'Languages' || flag.category === 'Pirate Flags' || config.continents.includes(flag.continent);";
    content = content.replace(
        "const matchContinent = flag.category === 'Fictional' || flag.category === 'LGBTQI+' || flag.category === 'Languages' || flag.category === 'Pirate Flags' || config.continents.includes(flag.continent);",
        `const matchContinent = flag.category === 'Fictional' || flag.category === 'LGBTQI+' || flag.category === 'Languages' || flag.category === 'Pirate Flags' || config.continents.includes(flag.continent);
      if (config.categories.includes('LGBTQI+') && config.lgbtqiSubcategory && config.lgbtqiSubcategory !== 'All' && flag.category === 'LGBTQI+') {
        if (flag.country !== config.lgbtqiSubcategory) return false;
      }`
    );

    const submenuJSX = `{/* Sub-filter for Fictional Universes */}
              {config.categories.includes('Fictional') && (
                <div className="mt-3">
                  <FictionalUniverseSubMenu
                    selectedUniverse={config.fictionalUniverse || 'All'}
                    onSelectUniverse={(universe) =>
                      setConfig((prev) => ({ ...prev, fictionalUniverse: universe }))
                    }
                  />
                </div>
              )}`;

    const lgbtqiJSX = `
              {/* Sub-filter for LGBTQI+ Subcategories */}
              {config.categories.includes('LGBTQI+') && (
                <div className="mt-3">
                  <LGBTQISubMenu
                    selectedSubcategory={config.lgbtqiSubcategory || 'All'}
                    onSelectSubcategory={(subcat) =>
                      setConfig((prev) => ({ ...prev, lgbtqiSubcategory: subcat }))
                    }
                  />
                </div>
              )}`;

    if (!content.includes('LGBTQISubMenu selectedSubcategory=')) {
        content = content.replace(submenuJSX, submenuJSX + lgbtqiJSX);
    }
    fs.writeFileSync('src/components/Quiz.tsx', content);
}

function patchFlashcards() {
    let content = fs.readFileSync('src/components/Flashcards.tsx', 'utf8');
    if (!content.includes('LGBTQISubMenu')) {
        content = content.replace("import { FictionalUniverseSubMenu } from './FictionalUniverseSubMenu';", "import { FictionalUniverseSubMenu } from './FictionalUniverseSubMenu';\nimport { LGBTQISubMenu } from './LGBTQISubMenu';");
    }

    content = content.replace(
        "if (config.categories.includes('Fictional') && config.fictionalUniverse && config.fictionalUniverse !== 'All' && flag.category === 'Fictional') {",
        `if (config.categories.includes('LGBTQI+') && config.lgbtqiSubcategory && config.lgbtqiSubcategory !== 'All' && flag.category === 'LGBTQI+') {
          if (flag.country !== config.lgbtqiSubcategory) return false;
        }
        
        if (config.categories.includes('Fictional') && config.fictionalUniverse && config.fictionalUniverse !== 'All' && flag.category === 'Fictional') {`
    );

    const submenuJSX = `{/* Sub-filter for Fictional Universes */}
              {config.categories.includes('Fictional') && (
                <div className="mt-3">
                  <FictionalUniverseSubMenu
                    selectedUniverse={config.fictionalUniverse || 'All'}
                    onSelectUniverse={(universe) =>
                      setConfig((prev) => ({ ...prev, fictionalUniverse: universe }))
                    }
                  />
                </div>
              )}`;

    const lgbtqiJSX = `
              {/* Sub-filter for LGBTQI+ Subcategories */}
              {config.categories.includes('LGBTQI+') && (
                <div className="mt-3">
                  <LGBTQISubMenu
                    selectedSubcategory={config.lgbtqiSubcategory || 'All'}
                    onSelectSubcategory={(subcat) =>
                      setConfig((prev) => ({ ...prev, lgbtqiSubcategory: subcat }))
                    }
                  />
                </div>
              )}`;

    if (!content.includes('LGBTQISubMenu selectedSubcategory=')) {
        content = content.replace(submenuJSX, submenuJSX + lgbtqiJSX);
    }
    fs.writeFileSync('src/components/Flashcards.tsx', content);
}

patchQuiz();
patchFlashcards();
