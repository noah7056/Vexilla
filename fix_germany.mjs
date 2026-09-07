import fs from 'fs';
import path from 'path';

let content = fs.readFileSync('src/data/provinces/germany.ts', 'utf8');
content = content.replace(/Flag_of_Lower_Saxony\.svg/g, 'Flag_of_Saxony.svg'); // Undo bad Saxony replace
fs.writeFileSync('src/data/provinces/germany.ts', content);
