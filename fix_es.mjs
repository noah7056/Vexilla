import fs from 'fs';

let content = fs.readFileSync('src/data/provinces/el-salvador.ts', 'utf8');

const replacements = {
  'Bandera_Ahuachapan_SV.png': 'Bandera_del_Departamento_de_Ahuachapán.PNG',
  'Bandera_Cabanas_SV.png': 'Flag_of_the_Cabañas_Department.svg',
  'Bandera_Chalatenango_SV.png': 'Flag_of_Chalatenango.svg',
  'Bandera_de_la_Provincia_de_La_Libertad.svg': 'Flag_of_La_Libertad_Department_(El_Salvador).svg',
  'Bandera_Morazan_SV.png': 'Flag_of_Morazán_Department.svg',
  'Bandera_de_La_Paz_SV.png': 'Bandera_del_Departamento_de_La_Paz_de_El_Salvador.PNG',
  'Bandera_de_San_Miguel_El_Salvador.svg': 'SM_Bandera.png',
  'Bandera_San_Vicente_SV.png': 'Flag_of_San_Vicente_Department.svg',
  'Bandera_Usulutan_SV.png': 'Flag_of_Usulatán_Department.svg',
  'Bandera_La_Union_SV.png': 'Bandera_de_La_Unión.png' // I'll guess this or replace with a known one if it fails, but Wikipedia has a lot of PNGs. Let me check the correct name for La Union.
};

for (const [oldName, newName] of Object.entries(replacements)) {
  content = content.replace(oldName, newName);
}

fs.writeFileSync('src/data/provinces/el-salvador.ts', content);
