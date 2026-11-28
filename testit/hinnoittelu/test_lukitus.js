// Hintojen lukitus orders/hintalukitus.js (hinnoittelu vaihe 4b-2, 28.11.2026). Suunnitelma: projektin claude/vaihe4b_suunnitelma.md.
// Kanta korvataan fetch-mockilla. Ajo: node testit/hinnoittelu/test_lukitus.js
const path = require('path');
global.window = {};
require(path.join(__dirname, '..', '..', 'orders', 'hintalukitus.js'));
require(path.join(__dirname, '..', '..', 'orders', 'hinnoittelu.js'));
const L = window.KPT_HINTALUKITUS, H = window.KPT_HINNOITTELU;

let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
function eq(a, b, m) { ok(a === b, m + ' (saatu ' + JSON.stringify(a) + ', odotettu ' + JSON.stringify(b) + ')'); }

// Mock-kanta
const kanta = {
  orders: { o1: { pricing: null }, o2: { pricing: { lukittu: { aika: '2026-11-01T10:00:00Z', tila: 'QUOTED', materiaalit: [], kiinteat: [] }, rivit: { x: { alennus_pct: 10 } } } } },
  materiaalit: [{ material: 'Pural', thickness_mm: 0.5, color: null, purchase_price: 9.25, multiplier: 1.85, work_price: 2 }],
  kiinteat: [{ product_name: 'Verstastyö', unit: 'h', unit_price: 50 }]
};
let kutsut = [];
global.fetch = async (url, opt) => {
  const o = opt || {}, m = o.method || 'GET';
  kutsut.push(m + ' ' + url.replace('https://x/rest/v1/', ''));
  const vast = (data, status) => ({ ok: (status || 200) < 300, status: status || 200, json: async () => data });
  const id = (url.match(/orders\?id=eq\.([^&]+)/) || [])[1];
  if (url.includes('/orders?') && m === 'GET') return vast([{ pricing: kanta.orders[id].pricing }]);
  if (url.includes('/orders?') && m === 'PATCH') { kanta.orders[id].pricing = JSON.parse(o.body).pricing; return vast(null, 204); }
  if (url.includes('/pricing_materials')) return vast(kanta.materiaalit);
  if (url.includes('/pricing_fixed')) return vast(kanta.kiinteat);
  return vast({ message: 'tuntematon' }, 404);
};
const O = { url: 'https://x', key: 'k' };

(async function () {
  // 1. Tilat
  ok(L.lukitaankoTila('QUOTED') && L.lukitaankoTila('ORDERED') && L.lukitaankoTila('IN_PRODUCTION') && L.lukitaankoTila('COMPLETED') && L.lukitaankoTila('INVOICED'), '1a: Tarjottu, Tilattu ja myöhemmät lukitaan');
  ok(!L.lukitaankoTila('DRAFT') && !L.lukitaankoTila('IN_PROGRESS') && !L.lukitaankoTila('ARCHIVED'), '1b: Luonnos, Kesken ja Arkisto eivät lukitse');
  eq(L.tilaTeksti('ORDERED'), 'Tilattu', '1c: tilan teksti suomeksi');

  // 2. Lukitus
  let t = await L.lukitse('o1', 'DRAFT', O);
  ok(!t.lukittiin && kutsut.length === 0, '2a: luonnos ei lukitse eikä kutsu kantaa');
  t = await L.lukitse('o1', 'QUOTED', O);
  ok(t.lukittiin, '2b: Tarjottu lukitsee');
  const lk = kanta.orders.o1.pricing.lukittu;
  ok(lk && lk.tila === 'QUOTED' && lk.materiaalit.length === 1 && lk.kiinteat.length === 1 && /^\d{4}-/.test(lk.aika), '2c: kopio tallentui (tila, aika, materiaalit, kiinteät)');
  kanta.materiaalit[0].purchase_price = 12;   // hinnasto muuttuu
  t = await L.lukitse('o1', 'ORDERED', O);
  ok(!t.lukittiin && kanta.orders.o1.pricing.lukittu.materiaalit[0].purchase_price === 9.25, '2d: toinen lukitus ei muuta vanhaa (Tilattu sen jälkeen)');
  kutsut = [];
  t = await L.lukitse('o2', 'COMPLETED', O);
  ok(!t.lukittiin && kutsut.filter(k => k.indexOf('pricing_') >= 0).length === 0, '2e: jo lukittu → hinnastoa ei haeta');

  // 3. Päivitä nykyiseen: muokkaukset säilyvät
  const p = await L.paivitaNykyiseen('o2', 'ORDERED', O);
  ok(p.lukittu.paivitetty === true && p.lukittu.materiaalit[0].purchase_price === 12, '3a: uusi hinnasto kopioon, merkitty päivitetyksi');
  eq(kanta.orders.o2.pricing.rivit.x.alennus_pct, 10, '3b: rivin alennus säilyi');

  // 4. Yhdistäminen: lukittu voittaa, puuttuvat nykyisestä
  const lukittu = { materiaalit: [{ material: 'Pural', thickness_mm: 0.5, color: null, purchase_price: 9.25, multiplier: 1.85, work_price: 2 }], kiinteat: [{ product_name: 'Verstastyö', unit: 'h', unit_price: 50 }] };
  const nyt = { materiaalit: [
      { material: 'pural ', thickness_mm: '0.50', color: null, purchase_price: 12, multiplier: 1.85, work_price: 2 },
      { material: 'HC 25', thickness_mm: 0.5, color: null, purchase_price: 8.8, multiplier: 1.85, work_price: 2 },
      { material: 'Pural', thickness_mm: 0.5, color: 'RR33', purchase_price: 10, multiplier: 1.85, work_price: 2 }],
    kiinteat: [{ product_name: 'Verstastyö', unit: 'h', unit_price: 60 }, { product_name: 'Pään kääntö, normaali', unit: 'Kpl', unit_price: 5 }] };
  const y = L.yhdista(lukittu, nyt);
  eq(y.materiaalit.length, 3, '4a: lukittu Pural + uudet HC 25 ja Pural RR33');
  ok(y.uudet && y.uudet.materiaalit.length === 2 && y.uudet.kiinteat.length === 1, '4b: uudet = kopiosta puuttuneet (kirjainkoko ja paksuuden muoto eivät haittaa)');
  const pelti = { profile_type: 'avp', material: 'Pural', thickness_mm: 0.5, aihio_width_mm: 250, rows: [{ kok: 1000, kpl: 1 }] };
  eq(H.rivinHinta(pelti, y).osat[0].ahinta, 6.3, '4c: Pural lasketaan lukitulla hinnalla (6,30 €/m, ei 7,55)');
  eq(H.tuntihinta(y.kiinteat), 50, '4d: tuntihinta lukittu 50 €/h (nykyinen 60)');
  eq(H.rivinHinta(Object.assign({}, pelti, { material: 'HC 25' }), y).osat[0].ahinta, 6.05, '4e: kopiosta puuttuva HC 25 nykyisestä');
  const ei = L.yhdista(null, nyt);
  ok(ei.materiaalit === nyt.materiaalit && ei.uudet === null, '4f: ilman lukitusta nykyinen hinnasto sellaisenaan');
  ok(L.yhdista(lukittu, { materiaalit: [], kiinteat: [] }).uudet === null, '4g: ei uusia → uudet null');

  // 5. Virhe hinnaston haussa ei tallenna puolikasta lukitusta
  const vanhaFetch = global.fetch;
  kanta.orders.o3 = { pricing: null };
  global.fetch = async (url, opt) => url.includes('pricing_fixed') ? { ok: false, status: 500, json: async () => ({}) } : vanhaFetch(url, opt);
  let virhe = null;
  try { await L.lukitse('o3', 'QUOTED', O); } catch (e) { virhe = e; }
  ok(virhe && kanta.orders.o3.pricing === null, '5a: hinnaston hakuvirhe → virhe, tilaukseen ei tallennu mitään');
  global.fetch = vanhaFetch;

  console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
  if (fails) process.exitCode = 1;
})();
