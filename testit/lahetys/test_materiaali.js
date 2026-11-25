// Materiaalivalinta (orders/materiaali.js), vaihe 8.4a 25.11.2026: listat tuotteista ilman selainta.
const M = require('../../orders/materiaali.js');
let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }
const T = [
  { material: 'Pelti', color: 'RR33', thickness_mm: 0.5 }, { material: 'Pelti', color: 'RR33', thickness_mm: 0.6 },
  { material: 'Pelti', color: 'RR20', thickness_mm: 0.5 }, { material: 'Alumiini', color: 'Luonnon', thickness_mm: 0.7 },
  { material: 'Pelti', color: 'RR33', thickness_mm: 0.5 }, { material: '', color: 'X', thickness_mm: 1 }, { material: 'Pelti', color: 'RR33', thickness_mm: null },
];
ok(JSON.stringify(M.materiaalit(T)) === '["Alumiini","Pelti"]', '1: materiaalit aakkosjärjestyksessä, tyhjät ja tuplat pois');
ok(JSON.stringify(M.varit(T, 'Pelti')) === '["RR20","RR33"]', '2: värit materiaalin mukaan');
ok(JSON.stringify(M.paksuudet(T, 'Pelti', 'RR33')) === '[0.5,0.6]', '3: paksuudet numeroina, tuplat ja tyhjät pois');
ok(M.paksuudet(T, 'Pelti', 'XX').length === 0 && M.varit(T, 'Kupari').length === 0, '4: tuntematon → tyhjä lista');
ok(M.teksti({ material: 'Pelti', color: 'RR33', thickness: 0.5 }) === 'Pelti RR33 0,5 mm' && M.teksti({}) === '', '5: teksti suomeksi pilkulla');
console.log(fails ? fails + ' TESTIÄ EPÄONNISTUI' : 'KAIKKI TESTIT OK');
if (fails) process.exitCode = 1;
