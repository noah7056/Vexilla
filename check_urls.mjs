const images = [
  'Bandera_de_San_Salvador_%282015%29.svg',
  'Bandera_de_Santa_Ana%2C_El_Salvador.svg',
  'Bandera_Sonsonate_SV.png',
  'Bandera_Ahuachapan_SV.png',
  'Bandera_de_la_Provincia_de_La_Libertad.svg',
  'Bandera_Chalatenango_SV.png',
  'Bandera_de_Cuscatl%C3%A1n.svg',
  'Bandera_de_La_Paz_SV.png',
  'Bandera_Cabanas_SV.png',
  'Bandera_San_Vicente_SV.png',
  'Bandera_Usulutan_SV.png',
  'Bandera_de_San_Miguel_El_Salvador.svg',
  'Bandera_Morazan_SV.png',
  'Bandera_La_Union_SV.png'
];

async function check() {
  for (const img of images) {
    const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${img}`;
    const res = await fetch(url, { method: 'HEAD' });
    console.log(`${res.status} ${img}`);
  }
}
check();
