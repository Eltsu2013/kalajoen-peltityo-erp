// Käsin muokkaus: pään kääntö, oma hinta, lisä, alennus, ryhmän ja tilauksen alennus (hinnoittelu vaihe 4b-1, 28.11.2026).
// Suunnitelma: projektin claude/vaihe4b_suunnitelma.md (kohta 4, laskentajärjestys). Hinnat ALV 0 %.
// Ajo: node testit/hinnoittelu/test_muokkaus.js
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', '..', 'orders', 'hinnoittelu.js'));
const H = window.KPT_HINNOITTELU;

let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
function eq(a, b, m) { ok(a === b, m + ' (saatu ' + JSON.stringify(a) + ', odotettu ' + JSON.stringify(b) + ')'); }

const MAT = [{ material: 'Pural', thickness_mm: 0.5, color: null, purchase_price: 9.25, multiplier: 1.85, work_price: 2.00 }];
const KIINTEAT = [
  { product_name: 'Verstastyö', unit: 'h', unit_price: 50 },
  { product_name: 'Pään kääntö, helppo', unit: 'Kpl', unit_price: 2.5 },
  { product_name: 'Pään kääntö, normaali', unit: 'Kpl', unit_price: 5 },
  { product_name: 'Pään kääntö, vaativa', unit: 'Kpl', unit_price: 7.5 }
];
const CTX = { materiaalit: MAT, kiinteat: KIINTEAT };
// Listapelti: aihio 250 → 6,30 €/m; 2 × 3,02 m = 6,04 m → 38,05 €; päitä → ehdotus normaali × 2 × 2 kpl = 20,00 €
const pelti = { profile_type: 'avp', material: 'Pural', thickness_mm: 0.5, aihio_width_mm: 250, rows: [{ mitta: 3000, paat: 20, kok: 3020, kpl: 2 }] };
const peltiIlmanPaita = { profile_type: 'avp', material: 'Pural', thickness_mm: 0.5, aihio_width_mm: 250, rows: [{ mitta: 3000, paat: 0, kok: 3000, kpl: 2 }] };
const osa = (r, n) => r.osat.find(o => o.nimi === n);

// 1. Ilman muokkausta: ehdotus summassa (Tomi 28.11.)
(function () {
  const r = H.rivinHintaMuokattu(pelti, CTX, null);
  eq(osa(r, 'Pelti').summa, 38.05, '1a: pelti 6,04 m × 6,30 = 38,05');
  eq(osa(r, 'Pään kääntö').summa, 20, '1b: pään kääntö -ehdotus normaali 5,00 × 2 päätä × 2 kpl = 20,00');
  ok(osa(r, 'Pään kääntö').ehdotus === true && r.ehdotus === true, '1c: merkitty ehdotukseksi');
  eq(r.yhteensa, 58.05, '1d: ehdotus mukana summassa 58,05');
  ok(!r.muokattu && !r.alennus, '1e: ei käsin muokattu, ei alennusta');
  eq(r.ilmanMuokkausta, 58.05, '1f: ilman muokkausta = sama');
  eq(H.rivinHintaMuokattu(peltiIlmanPaita, CTX, null).yhteensa, 37.8, '1g: ilman päitä ei pään kääntöä (6 m × 6,30 = 37,80)');
})();

// 2. Pään kääntö valittuna
(function () {
  const r = H.rivinHintaMuokattu(pelti, CTX, { paan_kaanto: { taso: 'vaativa', paat: 1 } });
  eq(osa(r, 'Pään kääntö').summa, 15, '2a: vaativa 7,50 × 1 pää × 2 kpl = 15,00');
  ok(osa(r, 'Pään kääntö').ehdotus === false && r.ehdotus === false, '2b: valittu ei ole ehdotus');
  eq(H.rivinHintaMuokattu(pelti, CTX, { paan_kaanto: { taso: 'ei' } }).yhteensa, 38.05, '2c: taso ei → pään kääntö pois');
  eq(osa(H.rivinHintaMuokattu(pelti, CTX, { paan_kaanto: { taso: 'oma', paat: 2, hinta: 4 } }), 'Pään kääntö').summa, 16, '2d: oma 4,00 × 2 × 2 = 16,00');
  const r2 = H.rivinHintaMuokattu(peltiIlmanPaita, CTX, { paan_kaanto: { taso: 'helppo', paat: 2 } });
  eq(osa(r2, 'Pään kääntö').summa, 10, '2e: valinta toimii myös ilman päitä riveillä (2,50 × 2 × 2)');
  const r3 = H.rivinHintaMuokattu(pelti, { materiaalit: MAT, kiinteat: [{ product_name: 'Verstastyö', unit: 'h', unit_price: 50 }] }, null);
  ok(r3.puuttuu.indexOf('paankaanto') >= 0 && !osa(r3, 'Pään kääntö'), '2f: hinta puuttuu Kiinteistä → puute paankaanto, ei osaa');
  eq(H.puuteTeksti('paankaanto').indexOf('Pään käännön hinta puuttuu'), 0, '2g: puutteen teksti');
})();

// 3. Oma hinta, lisä, alennus ja järjestys
(function () {
  const r = H.rivinHintaMuokattu(pelti, CTX, { oma_hinta: 7, paan_kaanto: { taso: 'ei' } });
  eq(osa(r, 'Pelti').summa, 42.28, '3a: oma hinta 7,00 × 6,04 = 42,28');
  eq(r.ilmanMuokkausta, 38.05, '3b: yliviivattu = laskettu 38,05');
  ok(r.muokattu, '3c: muokattu');
  const l = H.rivinHintaMuokattu(pelti, CTX, { lisa_eur: 25 });
  eq(l.yhteensa, 83.05, '3d: lisä 25 € → 58,05 + 25 = 83,05');
  eq(l.ilmanMuokkausta, 58.05, '3e: lisä ei kuulu yliviivattuun lukuun');
  const a = H.rivinHintaMuokattu(pelti, CTX, { alennus_pct: 20 });
  eq(a.alennus.summa, -11.61, '3f: −20 % 58,05:stä = −11,61');
  eq(a.yhteensa, 46.44, '3g: 58,05 − 11,61 = 46,44');
  ok(a.alennus.nayta === true, '3h: alennus näkyy laskulla oletuksena');
  const b = H.rivinHintaMuokattu(pelti, CTX, { alennus_eur: 15, nayta_alennus: false });
  eq(b.yhteensa, 43.05, '3i: −15 € → 43,05');
  ok(b.alennus.nayta === false, '3j: piilotettu alennus');
  const j = H.rivinHintaMuokattu(pelti, CTX, { lisa_eur: 25, alennus_pct: 10 });
  eq(j.alennus.summa, -8.31, '3k: alennus lasketaan lisän jälkeen: 83,05 × 10 % = 8,305 → 8,31');
  eq(j.yhteensa, 74.74, '3l: 83,05 − 8,31 = 74,74');
})();

// 4. Rajat
(function () {
  eq(H.rivinHintaMuokattu(pelti, CTX, { alennus_eur: 999 }).yhteensa, 0, '4a: € alennus enintään koko summa → 0,00');
  eq(H.rivinHintaMuokattu(pelti, CTX, { alennus_pct: 150 }).yhteensa, 0, '4b: % enintään 100');
  eq(H.rivinHintaMuokattu(pelti, CTX, { alennus_pct: 10, alennus_eur: 5 }).alennus.selite, '10 %', '4c: % voittaa, jos molemmat');
  ok(!H.rivinHintaMuokattu(pelti, CTX, { alennus_pct: 0, lisa_eur: 0 }).muokattu, '4d: nollat eivät ole muokkaus');
  eq(H.rivinHintaMuokattu(pelti, CTX, { lisa_eur: -5 }).yhteensa, 53.05, '4e: negatiivinen lisä vähentää');
})();

// 5. Kappaletavara: kappalehinta muokkauksesta
(function () {
  const kap = { itemType: 'kappale', nimike: 'Lumieste', maara: 6 };
  ok(H.rivinHintaMuokattu(kap, CTX, null).puuttuu.indexOf('kappalehinta') >= 0, '5a: ilman hintaa puute');
  eq(H.rivinHintaMuokattu(kap, CTX, { kappalehinta: 12.5 }).yhteensa, 75, '5b: 6 × 12,50 = 75,00');
  eq(H.rivinHintaMuokattu(kap, Object.assign({}, CTX, { kappalehinta: 10 }), { kappalehinta: 12.5 }).yhteensa, 75, '5c: oma kappalehinta voittaa Kiinteistä löydetyn');
  eq(H.rivinHintaMuokattu(kap, CTX, { kappalehinta: 12.5, alennus_pct: 10 }).yhteensa, 67.5, '5d: alennus myös kappaletavaralle');
})();

// 6. Ryhmä (piippu): rivien muokkaukset + ryhmän lisä ja alennus
(function () {
  const piippu = [
    { profile_type: 'piippu', material: 'Pural', thickness_mm: 0.5, aihio_width_mm: 1000, rows: [{ kok: 1000, kpl: 1 }], profile_data: { vals: { tyoaika: { yhteensa_min: 60 } } } },
    { profile_type: 'piippu', nimike: 'Piipun jalka', kpl: 4, rows: [] }
  ];
  const g0 = H.ryhmanHintaMuokattu(piippu, CTX, null);
  // materiaali 1 m² × 17,10 + työ 60 min × 50 €/h = 67,10; jalat ilman hintaa
  eq(g0.yhteensa, 67.1, '6a: ilman muokkauksia 17,10 + 50,00 = 67,10');
  ok(g0.puuttuu.indexOf('kappalehinta') >= 0, '6b: jalkojen hinta puuttuu');
  const g = H.ryhmanHintaMuokattu(piippu, CTX, { rivit: { 1: { kappalehinta: 18 } }, ryhma: { lisa_eur: 30, alennus_pct: 10 } });
  eq(g.valisumma, 139.1, '6c: välisumma 67,10 + 4 × 18 = 139,10');
  eq(g.alennus.summa, -16.91, '6d: ryhmän alennus (139,10 + 30) × 10 % = 16,91');
  eq(g.yhteensa, 152.19, '6e: 169,10 − 16,91 = 152,19');
  ok(g.muokattu && g.puuttuu.length === 0, '6f: muokattu, ei puutteita');
  eq(H.ryhmanHintaMuokattu(piippu, Object.assign({}, CTX, { kappalehinnat: { 1: 20 } }), null).yhteensa, 147.1, '6g: kappalehinnat ctx:stä kuten ennen (67,10 + 80)');
  const ilman = [{ profile_type: 'piippu', material: 'Pural', thickness_mm: 0.5, aihio_width_mm: 1000, rows: [{ kok: 1000, kpl: 1 }] }];
  ok(H.ryhmanHintaMuokattu(ilman, CTX, null).puuttuu.indexOf('tyoaika') >= 0, '6h: työaika puuttuu ryhmältä kuten ryhmanHinnassa');
})();

// 7. Tilaus: koko tilauksen alennus ja alennukset yhteensä
(function () {
  const g1 = H.ryhmanHintaMuokattu([pelti], CTX, { rivit: { 0: { alennus_eur: 8.05 } } });     // 58,05 − 8,05 = 50,00
  const g2 = H.ryhmanHintaMuokattu([peltiIlmanPaita], CTX, null);                               // 37,80
  const t = H.tilauksenHinta([g1, g2], { alennus_pct: 5 });
  eq(t.valisumma, 87.8, '7a: välisumma 50,00 + 37,80 = 87,80');
  eq(t.alennus.summa, -4.39, '7b: tilauksen −5 % = −4,39');
  eq(t.yhteensa, 83.41, '7c: 87,80 − 4,39 = 83,41');
  eq(t.alennuksetYhteensa, -12.44, '7d: alennukset yhteensä −8,05 − 4,39 = −12,44');
  eq(t.ehdotuksia, 1, '7e: yksi pään kääntö -ehdotus vahvistamatta');
  eq(H.tilauksenHinta([g1, g2], null).yhteensa, 87.8, '7f: ilman tilauksen alennusta');
  eq(H.tilauksenHinta([g1, g2], { alennus_eur: 7.8 }).yhteensa, 80, '7g: € alennus tilaukselle');
})();

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
