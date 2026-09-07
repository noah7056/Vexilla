import fs from 'fs';
import path from 'path';

function replaceInFile(file, search, replacement) {
  const p = path.join('src/data/provinces', file);
  let c = fs.readFileSync(p, 'utf8');
  c = c.replace(search, replacement);
  fs.writeFileSync(p, c);
}

// Mexico
replaceInFile('mexico.ts', 'Flag_of_Quebec.svg', 'Flag_of_Nuevo_Leon.svg');
replaceInFile('mexico.ts', 'Flag_of_Mexico_City,_Mexico.svg', 'Flag_of_Mexico_City.svg');

// Panama
replaceInFile('panama.ts', 'Bandera_de_la_Provincia_de_Panam%C3%A1_Oeste.svg', 'Bandera_de_la_Provincia_de_Panam%C3%A1.svg'); // Undo panama

// Argentina
replaceInFile('argentina.ts', 'Bandera_de_la_Ciudad_de_Buenos_Aires.svg', 'Bandera_de_la_Provincia_de_Buenos_Aires.svg');

