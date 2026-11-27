// Yhteinen hintalaskenta orders/hinnoittelu.js (hinnoittelu vaihe 1, 27.11.2026).
// Päätökset: projektin claude/hinnoittelu_paatokset_2026-11-27.md. Hinnat ALV 0 %.
// Ajo: node testit/hinnoittelu/test_hinnoittelu.js
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', '..', 'orders', 'hinnoittelu.js'));
const H = window.KPT_HINNOITTELU;

let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
function eq(a, b, m) { ok(a === b, m + ' (saatu ' + JSON.stringify(a) + ', odotettu ' + JSON.stringify(b) + ')'); }
function near(a, b, t, m) { ok(typeof a === 'number' && Math.abs(a - b) <= t, m + ' (saatu ' + a + ', odotettu ' + b + ')'); }

// Testihinnasto (kuvitteellinen, Pural 0,5 suunnitelman esimerkkiluvuin)
const MAT = [
  { material: 'Pural', thickness_mm: 0.5, color: null, purchase_price: 9.25, multiplier: 1.85, work_price: 2.00 },
  { material: 'Pural', thickness_mm: 0.5, color: 'RR33', purchase_price: 10.00, multiplier: 1.85, work_price: 2.00 },
  { material: 'Pural  matta', thickness_mm: 0.5, color: null, purchase_price: 11.00, multiplier: 1.85, work_price: 2.00 },
  { material: 'Alumiini Stucco', thickness_mm: 0.7, color: null, purchase_price: 14.00, multiplier: 1.7, work_price: 2.50 },
  { material: 'ZN', thickness_mm: 0.6, color: null, purchase_price: null, multiplier: 1.85, work_price: 2.00 }   // hinta tyhjä
];
const KIINTEAT = [
  { product_name: 'Verstastyö', unit: 'h', unit_price: 50 },
  { product_name: 'Verstastyö (min)', unit: 'min', unit_price: 0.84 },
  { product_name: 'Pään kääntö', unit: 'kpl', unit_price: 5 }
];
const CTX = { materiaalit: MAT, kiinteat: KIINTEAT };

// 1. Pyöristys ja materiaalin hinta
eq(H.round5(6.278), 6.3, '1a: round5 6,278 → 6,30');
eq(H.round5(17.1125), 17.1, '1b: round5 17,11 → 17,10');
eq(H.round5(4.025), 4.05, '1c: round5 4,025 → 4,05 (puoliväli ylös)');
let mh = H.materiaalinHinta(MAT, { material: 'pural', thickness: '0,5', color: 'RR20' });
ok(mh && mh.lahde === 'perus' && mh.ostohinta === 9.25, '1d: RR20 → perushinta (värillä ei omaa hintaa)');
mh = H.materiaalinHinta(MAT, { material: 'Pural', thickness: 0.5, color: 'rr33' });
ok(mh && mh.lahde === 'vari' && mh.ostohinta === 10, '1e: RR33 → värin oma hinta (kirjainkoko ei haittaa)');
mh = H.materiaalinHinta(MAT, { material: 'Pural matta', thickness: 0.5 });
ok(mh && mh.ostohinta === 11, '1f: ylimääräiset välilyönnit nimessä eivät haittaa');
eq(H.materiaalinHinta(MAT, { material: 'Pural', thickness: 0.6 }), null, '1g: väärä paksuus → hinta puuttuu');
eq(H.materiaalinHinta(MAT, { material: 'ZN', thickness: 0.6 }), null, '1h: rivi ilman ostohintaa → hinta puuttuu');
eq(H.materiaalinHinta(MAT, { material: '' }), null, '1i: ei materiaalia → null');

// 2. Metri- ja neliöhinta (suunnitelman esimerkit)
mh = H.materiaalinHinta(MAT, { material: 'Pural', thickness: 0.5 });
eq(H.metrihinta(mh, 250), 6.3, '2a: Pural 0,5, aihio 250 → 0,25 × 9,25 × 1,85 + 2 = 6,28 → 6,30 €/m');
eq(H.metrihinta(mh, 100), 3.7, '2b: aihio 100 → 1,711 + 2 = 3,71 → 3,70 €/m');
eq(H.metrihinta(mh, 0), null, '2c: aihio 0 → ei hintaa');
eq(H.neliohinta(mh), 17.1, '2d: neliöhinta 9,25 × 1,85 = 17,11 → 17,10 €/m² (sama kuin hinnaston "Lista Pural 0.5")');

// 3. Tuntihinta ja työ
eq(H.tuntihinta(KIINTEAT), 50, '3a: tuntihinta Verstastyö 50 €/h (ei minuuttiriviä)');
eq(H.tyonHinta(30, 50), 25, '3b: 30 min × 50 €/h = 25,00 € (tarkasti /60)');
eq(H.tyonHinta(7, 50), 5.83, '3c: 7 min = 5,83 € (ei 7 × 0,84 = 5,88)');
eq(H.tuntihinta([]), null, '3d: ei Verstastyö-riviä → null');

// 4. Hinnoittelutapa tilausriviltä
const rivi = (mitta, kpl, paat) => ({ mitta_mm: mitta, paat_mm: paat || 0, kok_mm: mitta + (paat || 0), kpl: kpl });
eq(H.tapa({ profile_type: 'avp', aihio_width_mm: 250, order_item_rows: [rivi(2000, 1)] }), 'lista', '4a: Peltilistat (avp) → lista');
eq(H.tapa({ profile_type: 'ulista' }), 'lista', '4b: U-lista → lista');
eq(H.tapa({ profile_type: 'saunakouru', aihio_width_mm: 340, order_item_rows: [rivi(2400, 1)] }), 'materiaali_aika', '4c: saunan kouru → materiaali + aika');
eq(H.tapa({ profile_type: 'piippu', aihio_width_mm: 600, order_item_rows: [rivi(900, 2)] }), 'materiaali_aika', '4d: piipun pala → materiaali + aika');
eq(H.tapa({ profile_type: 'piippu', aihio_width_mm: 0, quantity: 4, order_item_rows: [] }), 'kappale', '4e: piipun jalat (ei pituutta) → kappale');
eq(H.tapa({ profile_type: 'huuva', aihio_width_mm: 700, order_item_rows: [rivi(560, 2)] }), 'materiaali_aika', '4f: huuva → materiaali + aika');
eq(H.tapa({ profile_type: 'kartio', aihio_width_mm: 900, order_item_rows: [rivi(450, 1)] }), 'materiaali_aika', '4g: kartio → materiaali + aika');
eq(H.tapa({ profile_type: 'KAPPALE', profile_data: { maara: 3 } }), 'kappale', '4h: kappaletavara → kappale');

// 5. Listapelti: Pural 0,5, aihio 250, 2 × 3000 + 1 × 1500 (päät 20 mm molemmissa riveissä)
(function () {
  const t = { profile_type: 'avp', aihio_width_mm: 250, material: 'Pural', color: 'RR20', thickness_mm: 0.5,
    order_item_rows: [rivi(3000, 2, 20), rivi(1500, 1, 20)] };
  const r = H.rivinHinta(t, CTX);
  eq(r.tapa, 'lista', '5a: tapa lista');
  eq(r.puuttuu.length, 0, '5b: ei puutteita');
  near(H.juoksumetrit(t), 7.56, 1e-9, '5c: juoksumetrit (3,02 × 2 + 1,52) = 7,56 m (leikattava pituus päineen)');
  eq(r.osat[0].ahinta, 6.3, '5d: metrihinta 6,30 €/m');
  eq(r.yhteensa, 47.63, '5e: 7,56 m × 6,30 = 47,63 €');
  ok(/aihio 250 mm/.test(r.osat[0].selite), '5f: selite kertoo laskun (aihio, ostohinta, kerroin, työ)');
  ok(H.paanKaantoEhdotus(t) && H.paanKaantoEhdotus(t).taso === 'normaali' && H.paanKaantoEhdotus(t).paat === 2, '5g: päät rivillä → ehdotus normaali × 2');
  eq(H.kplYhteensa(t), 3, '5h: kpl yhteensä 3');
  eq(H.paanKaantoLisa(5, 2, 3), 30, '5i: pään kääntö normaali 5 € × 2 päätä × 3 kpl = 30,00 €');
  eq(H.paanKaantoEhdotus({ order_item_rows: [rivi(3000, 1)] }), null, '5j: ei päitä → ei ehdotusta');
})();

// 6. Kiilapelti: tilausrivin aihio on jo leveämmän pään (Peltilistat lähettää max(A, B))
(function () {
  const r = H.rivinHinta({ profile_type: 'kynnys', aihio_width_mm: 175, material: 'Pural', thickness_mm: 0.5, order_item_rows: [rivi(1000, 1)] }, CTX);
  eq(r.osat[0].ahinta, round5Js(0.175 * 9.25 * 1.85 + 2), '6a: kynnys 160 → 175: metrihinta leveämmän pään aihiolla');
  function round5Js(x) { return Math.round(x * 20) / 20; }
})();

// 7. Värin oma hinta listapellissä
(function () {
  const r = H.rivinHinta({ profile_type: 'avp', aihio_width_mm: 250, material: 'Pural', color: 'RR33', thickness_mm: 0.5, order_item_rows: [rivi(1000, 1)] }, CTX);
  eq(r.osat[0].ahinta, H.round5(0.25 * 10 * 1.85 + 2), '7a: RR33 omalla ostohinnalla 10,00 → 6,63 → 6,65 €/m');
  ok(/värin oma hinta/.test(r.osat[0].selite), '7b: selite kertoo värin oman hinnan');
})();

// 8. Puutteet
(function () {
  let r = H.rivinHinta({ profile_type: 'avp', aihio_width_mm: 250, material: 'ZN', thickness_mm: 0.6, order_item_rows: [rivi(1000, 1)] }, CTX);
  ok(r.puuttuu.indexOf('hinta') >= 0 && r.yhteensa === 0, '8a: ZN ilman ostohintaa → "hinta" puuttuu, summa 0');
  r = H.rivinHinta({ profile_type: 'avp', aihio_width_mm: 250, order_item_rows: [rivi(1000, 1)] }, CTX);
  ok(r.puuttuu.indexOf('materiaali') >= 0, '8b: materiaali valitsematta');
  r = H.rivinHinta({ profile_type: 'avp', aihio_width_mm: 250, material: 'Pural', thickness_mm: 0.5, order_item_rows: [] }, CTX);
  ok(r.puuttuu.indexOf('pituus') >= 0, '8c: ei pituusrivejä');
  eq(H.puuteTeksti('tyoaika'), 'Työaika puuttuu', '8d: puutteen teksti suomeksi');
})();

// 9. Saunan kouru: materiaali + aika, päätylaput mukana, työaika rivillä
(function () {
  // Kouru: aihio 340 (leveämpi pää), 2 × 2400, päätylaput 2 kourulle yhteensä 0,0388 m², työaika 20 + 40 min
  const t = { profile_type: 'saunakouru', aihio_width_mm: 340, material: 'Pural', thickness_mm: 0.5,
    profile_data: { paatylaputM2: 0.0388, tyoaika: { suunnittelu_min: 20, tyo_min: 40, yhteensa_min: 60 } },
    order_item_rows: [rivi(2400, 2)] };
  near(H.menekkiM2(t), 0.34 * 2.4 * 2 + 0.0388, 1e-9, '9a: menekki = 0,34 × 2,4 × 2 + laput 0,0388 = 1,6708 m²');
  const r = H.rivinHinta(t, CTX);
  eq(r.tapa, 'materiaali_aika', '9b: tapa materiaali + aika');
  eq(r.osat[0].ahinta, 17.1, '9c: neliöhinta 17,10 €/m²');
  eq(r.osat[0].summa, 28.57, '9d: materiaali 1,6708 × 17,10 = 28,57 €');
  eq(r.osat[1].summa, 50, '9e: työ 60 min × 50 €/h = 50,00 €');
  eq(r.yhteensa, 78.57, '9f: kouru yhteensä 78,57 €');
  ok(r.tyoMukana && r.puuttuu.length === 0, '9g: työ mukana, ei puutteita');
  const ilman = H.ryhmanHinta([Object.assign({}, t, { profile_data: { paatylaputM2: 0.0388 } })], CTX);
  ok(ilman.puuttuu.indexOf('tyoaika') >= 0, '9h: kouru ilman työaikaa → ryhmällä "Työaika puuttuu"');
  const eiTuntia = H.rivinHinta(t, { materiaalit: MAT, kiinteat: [] });
  ok(eiTuntia.puuttuu.indexOf('tuntihinta') >= 0 && eiTuntia.yhteensa === 28.57, '9i: ei tuntihintaa → puute, materiaali silti laskettu');
})();

// 10. Piippu ryhmänä: palat (materiaali + aika), jalat (kappale), työaika ensimmäisellä rivillä
(function () {
  const mat = { material: 'Pural', color: 'RR33', thickness_mm: 0.5 };
  const ryhma = [
    Object.assign({ profile_type: 'piippu', aihio_width_mm: 640, order_item_rows: [rivi(900, 2)], profile_data: { vals: {}, tyoaika: { yhteensa_min: 180 } } }, mat),
    Object.assign({ profile_type: 'piippu', aihio_width_mm: 520, order_item_rows: [rivi(700, 2)] }, mat),
    Object.assign({ profile_type: 'piippu', aihio_width_mm: 0, quantity: 4, order_item_rows: [] }, mat)   // jalat 4 kpl
  ];
  const r = H.ryhmanHinta(ryhma, Object.assign({}, CTX, { kappalehinnat: { 2: 12.5 } }));
  const n = H.round5(10 * 1.85);   // RR33 oma hinta 10,00 → 18,50 €/m²
  near(r.rivit[0].osat[0].summa, H.sentit(0.64 * 0.9 * 2 * n), 0.001, '10a: pala 1 materiaali värin omalla neliöhinnalla');
  eq(r.rivit[0].osat[1].summa, 150, '10b: työ 180 min = 150,00 € (ryhmän ensimmäisellä rivillä)');
  ok(r.rivit[1].osat.length === 1 && !r.rivit[1].tyoMukana, '10c: pala 2: vain materiaali, ei työtä toiseen kertaan');
  eq(r.rivit[2].tapa, 'kappale', '10d: jalat kappaleena');
  eq(r.rivit[2].yhteensa, 50, '10e: jalat 4 × 12,50 = 50,00 €');
  eq(r.puuttuu.length, 0, '10f: ryhmällä ei puutteita');
  eq(r.yhteensa, H.sentit(r.rivit[0].yhteensa + r.rivit[1].yhteensa + 50), '10g: ryhmän summa = rivien summa');
  const ilmanJalkaHintaa = H.ryhmanHinta(ryhma, CTX);
  ok(ilmanJalkaHintaa.puuttuu.indexOf('kappalehinta') >= 0, '10h: jalkojen hinta puuttuu → näkyy ryhmän puutteena');
  const ilmanTyota = H.ryhmanHinta(ryhma.map((t, i) => i === 0 ? Object.assign({}, t, { profile_data: { vals: {} } }) : t), Object.assign({}, CTX, { kappalehinnat: { 2: 12.5 } }));
  ok(ilmanTyota.puuttuu.length === 1 && ilmanTyota.puuttuu[0] === 'tyoaika', '10i: piippu ilman työaikaa → vain "Työaika puuttuu"');
})();

// 11. tilaus.html:n muistin muoto (rows / thickness) käy myös
(function () {
  const t = { profile_type: 'avp', aihio_width_mm: 250, material: 'Pural', thickness: '0.5', rows: [{ mitta: 1000, paat: 0, kok: 1000, kpl: 2 }] };
  const r = H.rivinHinta(t, CTX);
  eq(r.yhteensa, 12.6, '11a: 2 × 1 m × 6,30 = 12,60 € tilaus.html:n rivimuodosta');
})();

// 12. Kappaletavara
(function () {
  const r = H.rivinHinta({ profile_type: 'KAPPALE', quantity: 3, profile_data: { maara: 3 } }, Object.assign({}, CTX, { kappalehinta: 7.2 }));
  eq(r.yhteensa, 21.6, '12a: 3 × 7,20 = 21,60 €');
})();

// 13. Pään kääntö -tasojen hinnat kiinteistä hinnoista (ennen ja jälkeen rivien uudelleennimeämisen)
(function () {
  let h = H.paanKaantoHinnat([{ product_name: 'Pään kääntö', unit_price: 5 }, { product_name: 'Toisen pään taivutus', unit_price: 2.5 }]);
  ok(h.normaali === 5 && h.helppo === 2.5 && h.vaativa === null, '13a: vanhat nimet: normaali 5, helppo 2,50, vaativa puuttuu');
  h = H.paanKaantoHinnat([{ product_name: 'Pään kääntö, normaali', unit_price: 5 }, { product_name: 'Pään kääntö, helppo', unit_price: '2.50' },
    { product_name: 'pään kääntö,  VAATIVA', unit_price: 7.5 }, { product_name: 'Pään kääntö', unit_price: 99 }]);
  ok(h.normaali === 5 && h.helppo === 2.5 && h.vaativa === 7.5, '13b: uudet nimet voittavat vanhan (kirjainkoko ja välilyönnit eivät haittaa)');
  eq(H.paanKaantoLisa(h.vaativa, 1, 4), 30, '13c: vaativa 7,50 € × 1 pää × 4 kpl = 30,00 €');
})();

// 14. Työaika syöttöpaketissa (Piippu, Harjapiippu, Huuva, Kartio: profile_data.vals.tyoaika, vaihe 3)
(function () {
  eq(H.tyoaikaMin({ profile_data: { vals: { tyoaika: { suunnittelu_min: 30, tyo_min: 150, yhteensa_min: 180 } } } }), 180, '14a: vals.tyoaika luetaan');
  eq(H.tyoaikaMin({ profile_data: { vals: { tyoaika: null } } }), null, '14b: vals.tyoaika tyhjä → ei arviota');
  const huuva = [{ profile_type: 'huuva', aihio_width_mm: 700, material: 'Pural', thickness_mm: 0.5, order_item_rows: [rivi(560, 2)],
    profile_data: { vals: { tyyppi: 'huuva', tyoaika: { yhteensa_min: 90 } } } },
    { profile_type: 'huuva', aihio_width_mm: 520, material: 'Pural', thickness_mm: 0.5, order_item_rows: [rivi(560, 2)] }];
  const r = H.ryhmanHinta(huuva, CTX);
  ok(r.puuttuu.length === 0 && r.rivit[0].tyoMukana && r.rivit[0].osat[1].summa === 75, '14c: huuvan työ 90 min = 75,00 € ensimmäiseltä riviltä, ei puutteita');
})();

// 15. tilaus.html:n oikea muisti (vaihe 4a): profileType camelCase, kappaletavara itemType 'kappale' + maara
(function () {
  const piippu = { profileType: 'piippu', aihio_width_mm: 700, material: 'Pural', thickness: '0.5', rows: [{ mitta: 1000, paat: 0, kok: 1000, kpl: 1 }],
    profile_data: { vals: { tyoaika: { yhteensa_min: 60 } } } };
  eq(H.tapa(piippu), 'materiaali_aika', '15a: profileType piippu → materiaali + aika (ei lista)');
  eq(H.tapa({ profileType: 'piippu', nimike: 'Piipun jalka', kpl: 4, rows: [] }), 'kappale', '15b: piipun jalat (ei rivejä) → kappale');
  eq(H.kplYhteensa({ profileType: 'piippu', kpl: 4, rows: [] }), 4, '15c: jalkojen kpl tilaus.html:n kentästä kpl');
  const kap = { id: 'i_1', itemType: 'kappale', nimike: 'Lumieste', maara: 6, yksikko: 'kpl' };
  eq(H.tapa(kap), 'kappale', '15d: itemType kappale → kappale');
  eq(H.rivinHinta(kap, Object.assign({}, CTX, { kappalehinta: 12.5 })).yhteensa, 75, '15e: 6 × 12,50 = 75,00 € (maara)');
  eq(H.tapa({ profileType: 'avp', aihio_width_mm: 250, rows: [{ kok: 1000, kpl: 1 }] }), 'lista', '15f: profileType avp → lista');
  const r = H.rivinHinta(piippu, CTX);
  ok(r.tyoMukana && r.osat.length === 2, '15g: piipun materiaali + työ tilaus.html:n muodosta');
})();

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
