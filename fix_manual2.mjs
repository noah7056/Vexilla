import fs from 'fs';
import path from 'path';

function replaceInFile(file, search, replacement) {
  const p = path.join('src/data/provinces', file);
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(search, replacement);
  fs.writeFileSync(p, c);
}

// Revert mistakes from script
replaceInFile('germany.ts', 'Flag_of_Lower_Saxony.svg', 'Flag_of_Saxony.svg'); // Saxony
replaceInFile('germany.ts', 'Flag_of_Saxony.svg', 'Flag_of_Saxony-Anhalt.svg'); // Saxony-Anhalt (will fix both below cleanly)
