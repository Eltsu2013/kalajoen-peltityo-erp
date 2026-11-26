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
// v2 (Tomin testi 25.11.2026): väritön materiaali ja haku
const S = T.concat([{ material: 'Stucco alumiini', color: null, thickness_mm: 0.7 }, { material: 'Stucco alumiini', color: '', thickness_mm: 1.0 }]);
ok(M.varit(S, 'Stucco alumiini').length === 0 && JSON.stringify(M.paksuudet(S, 'Stucco alumiini', null)) === '[0.7,1]', '6: väritön materiaali: ei värejä, paksuudet ilman väriä');
ok(M.puuttuu(S, { material: 'Stucco alumiini', color: null, thickness: 0.7 }) === null, '7: värittömältä ei vaadita väriä (ennen herjasi "valitse väri")');
ok(M.puuttuu(S, { material: 'Pelti', thickness: 0.5 }) === 'väri' && M.puuttuu(S, { material: 'Pelti', color: 'RR33' }) === 'paksuus' && M.puuttuu(S, {}) === 'materiaali', '8: värillinen vaatii värin ja paksuuden');
ok(JSON.stringify(M.suodata(M.materiaalit(S), 'STU')) === '["Stucco alumiini"]' && M.suodata(['a', 'b'], '').length === 2, '9: haku kirjoittamalla, kirjainkoko ei haittaa');
// v3 (Tomi 26.11.2026): tuoteryhmä, väri ennen materiaalia, kirjoitusasujen tupla
const R = [
  { product_group: 'Pinnoitettu teräs', material: 'Glossy', color: 'RR20', thickness_mm: 0.5 },
  { product_group: 'Pinnoitettu teräs', material: 'Glossy', color: 'RR33', thickness_mm: 0.5 },
  { product_group: 'Pinnoitettu Teräs', material: 'HC 25', color: 'RR23', thickness_mm: 0.6 },
  { product_group: 'Pinnoitettu teräs', material: 'HC 25', color: 'RR33', thickness_mm: 0.6 },
  { product_group: 'Pinnoitettu teräs', material: 'Pural', color: 'RR33', thickness_mm: 0.6 },
  { product_group: 'Alumiini', material: 'Stucco', color: null, thickness_mm: 0.7 },
  { product_group: 'Rakenneteräs', material: 'Musta teräs', color: null, thickness_mm: 2 },
];
ok(JSON.stringify(M.ryhmat(R)) === '["Alumiini","Pinnoitettu teräs","Rakenneteräs"]', '10: tuoteryhmät kerran, kirjainkoosta välittämättä, yleisin kirjoitusasu');
ok(M.oletusRyhma(R) === 'Pinnoitettu teräs' && M.oletusRyhma([{ product_group: 'Pinnoitettu Teräs' }]) === 'Pinnoitettu Teräs' && M.oletusRyhma([{ product_group: 'Alumiini' }]) === '', '11: oletusryhmä löytyy kummalla kirjoitusasulla tahansa');
let L = M.listat(R, { ryhma: 'Pinnoitettu teräs', vari: 'RR20' });
ok(JSON.stringify(L.materiaalit) === '["Glossy"]', '12: väri RR20 rajaa materiaaliksi vain Glossyn');
L = M.listat(R, { ryhma: 'pinnoitettu TERÄS', vari: 'RR23' });
ok(JSON.stringify(L.materiaalit) === '["HC 25"]', '13: RR23 → HC 25, vaikka tuote on toisella kirjoitusasulla');
L = M.listat(R, { ryhma: 'Pinnoitettu teräs', materiaali: 'HC 25' });
ok(JSON.stringify(L.varit) === '["RR23","RR33"]' && JSON.stringify(L.paksuudet) === '[0.6]', '14: materiaali ensin rajaa värit (toimii yhä kumpaankin suuntaan)');
L = M.listat(R, { ryhma: 'Pinnoitettu teräs' });
ok(L.varit.length === 3 && L.materiaalit.length === 3 && L.paksuudet.length === 0 && L.ryhmallaVareja, '15: pelkkä ryhmä: kaikki ryhmän värit ja materiaalit, paksuus vasta materiaalista');
L = M.listat(R, { ryhma: 'Alumiini' });
ok(!L.ryhmallaVareja && JSON.stringify(L.materiaalit) === '["Stucco"]' && JSON.stringify(M.listat(R, { ryhma: 'Alumiini', materiaali: 'Stucco' }).paksuudet) === '[0.7]', '16: väritön ryhmä: väririvi voidaan piilottaa, paksuus ilman väriä');
ok(M.ryhmaTuotteelle(R, 'HC 25', 'RR23') === 'Pinnoitettu teräs' && M.ryhmaTuotteelle(R, 'Musta teräs') === 'Rakenneteräs' && M.ryhmaTuotteelle(R, 'Kupari') === '', '17: vanhan rivin tuoteryhmä päätellään materiaalista');
ok(M.listat(R, {}).materiaalit.length === 5, '18: ilman ryhmää kaikki materiaalit');
console.log(fails ? fails + ' TESTIÄ EPÄONNISTUI' : 'KAIKKI TESTIT OK');
if (fails) process.exitCode = 1;
