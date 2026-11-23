// Piipun kansi ja sen reiät (orders/piippu-laskenta.js: laskeKansi, kansiAsetukset, kansiReianMitat).
// Tomin päätökset 23.11.2026 (mockup piippu/kansi-mockup.html): sisämitta = piipun ulkomitta + väljyys 5 mm yhteensä,
// taitos vie reunasta T (tupla tai 90°, sama koko), reiät mitataan oletuksena hupun pellin ulkopinnasta, piippu kannen keskellä.
// Esimerkit Tomin piirroksista (esimerkin 3 piipun koko ja keskikohdat keksitty).
const P = require('../../orders/piippu-laskenta.js');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }
const near = (a, b) => Math.abs(a - b) < 1e-6;

const PERUS = { huplis: 10, ylareunaV: 20, ylaTyyppi: 'ulos' };
const kansi = (lev, syv, k) => P.laskeKansi(lev, syv, Object.assign({}, PERUS, { kansi: k }));
const nelio = (o) => Object.assign({ muoto: 'nelio', l: 150, s: 150, vTapa: 'keski', sTapa: 'keski' }, o);

// ---- Oletukset
const as0 = P.kansiAsetukset({});
ok(as0.tyyppi === 'tupla' && as0.T === 20 && as0.lovi === '45' && as0.valjyys === 5 && as0.viite === 'huppu' && as0.vaaka === 'vasen' && as0.syva === 'etu' && as0.reiat.length === 0,
  'oletukset: tupla 20, 45° viisto, väljyys 5, reiät hupun pinnasta, vasemmasta ja edestä');
ok(P.kansiAsetukset({ ylareunaV: 25 }).T === 25 && P.kansiAsetukset({ ylareunaV: 25, ylaTyyppi: 'sisaan' }).T === 20 && P.kansiAsetukset({ ylareunaV: 25, kansi: { T: 15 } }).T === 15,
  'taitoksen oletus = hupun yläreuna ulos (25), sisäänpäin taitetulla 20, oma arvo voittaa');
ok(P.kansiAsetukset({ kansi: { reiat: new Array(12).fill({}) } }).reiat.length === 8, 'enintään 8 reikää');

// ---- Esimerkki 2: piippu 410 (vasen–oikea) × 970 (etu–taka), kolme 150 × 150 -reikää 130 / 410 / 690 edestä
const e2 = kansi(410, 970, { reiat: [130, 410, 690].map(x => nelio({ sTapa: 'reuna', sMm: x })) });
ok(e2.aihio.lev === 505 && e2.aihio.pit === 1065, 'esim. 2: aihio 505 × 1065 (970 + 10 + 2 × 20 + 5 + 2 × 20 = 1065, Tomin lasku)');
ok(near(e2.L.sisa, 465) && near(e2.S.sisa, 1025) && near(e2.S.huppu, 980) && near(e2.S.viiteSiirto, 22.5), 'esim. 2: sisämitta 465 × 1025, hupun pinta 22,5 mm kannen sisäreunasta');
const m2 = e2.reiat.map(r => P.kansiReianMitat(r, e2, 'leikkuu'));
ok(m2.map(m => m.sAlku).join() === '172.5,452.5,732.5' && m2.every(m => near(m.sLoppu - m.sAlku, 150)), 'esim. 2: reikien alut edestä 172,5 / 452,5 / 732,5 (20 + 22,5 + 130 ...)');
ok(m2.every(m => near(m.vKeski, 252.5)), 'esim. 2: reiät keskellä vasen–oikea (505 / 2 = 252,5)');
ok(e2.varoitukset.length === 0, 'esim. 2: ei varoituksia');
const m2t = P.kansiReianMitat(e2.reiat[0], e2, 'taitettu');
ok(near(m2t.sAlku, 152.5) && near(m2t.vKeski, 232.5), 'taitetusta reunasta: taitos 20 pois (152,5 ja 232,5)');

// ---- Tupla ja 90° ovat saman kokoisia, väljyys ja taitos muuttavat
ok(kansi(410, 970, { tyyppi: '90' }).aihio.pit === 1065, '90° alas: sama aihio kuin tuplalla');
ok(kansi(410, 970, { T: 25 }).aihio.pit === 1075 && kansi(410, 970, { valjyys: 10 }).aihio.pit === 1070, 'taitos 25 → 1075, väljyys 10 → 1070');

// ---- Viite muurattu piippu ja takaa / oikeasta mitattuna
const e2p = kansi(410, 970, { viite: 'piippu', reiat: [nelio({ sTapa: 'reuna', sMm: 130 })] });
ok(near(P.kansiReianMitat(e2p.reiat[0], e2p, 'leikkuu').sAlku, 20 + 27.5 + 130), 'muuratusta piipusta: siirto 27,5 → 177,5');
const e2b = kansi(410, 970, { syva: 'taka', vaaka: 'oikea', reiat: [nelio({ sTapa: 'reuna', sMm: 130, vTapa: 'reuna', vMm: 50 })] });
const r2b = e2b.reiat[0], m2b = P.kansiReianMitat(r2b, e2b, 'leikkuu');
ok(near(m2b.sAlku, 172.5) && near(r2b.u, 1065 - 172.5 - 75) && near(m2b.vAlku, 20 + 22.5 + 50) && near(r2b.w, 505 - 92.5 - 75),
  'takaa ja oikeasta: mitat omasta reunastaan, paikka kannessa peilautuu');

// ---- Esimerkki 1: 390 × 390, Ø160 keskellä
const e1 = kansi(390, 390, { reiat: [{ muoto: 'pyorea', d: 160, vTapa: 'keski', sTapa: 'keski' }] });
ok(e1.aihio.lev === 485 && e1.aihio.pit === 485 && near(e1.reiat[0].u, 242.5) && near(e1.reiat[0].w, 242.5), 'esim. 1: aihio 485 × 485, reikä keskellä (242,5)');
ok(near(e1.reiat[0].leikDw, 146) && e1.reiat[0].rLeik === 0, 'esim. 1: karvaus 7 → leikataan Ø146, pyöreässä ei kulmapyöristystä');

// ---- Esimerkki 3: reiän keskikohta edestä, reunaan vasemmasta, toinen ilman karvausta
const e3 = kansi(500, 700, { reiat: [nelio({ sTapa: 'keskelle', sMm: 200, vTapa: 'reuna', vMm: 120 }),
  nelio({ l: 180, s: 180, sTapa: 'keskelle', sMm: 480, vTapa: 'reuna', vMm: 120, karvaus: false })] });
const m3 = e3.reiat.map(r => P.kansiReianMitat(r, e3, 'leikkuu'));
ok(near(m3[0].sKeski, 20 + 22.5 + 200) && near(m3[0].vAlku, 20 + 22.5 + 120) && near(m3[1].sKeski, 20 + 22.5 + 480), 'esim. 3: keskikohdat edestä, alku vasemmasta');
ok(e3.reiat[0].karvaus === 7 && near(e3.reiat[0].leikDw, 136) && e3.reiat[0].rLeik === 30 && near(e3.reiat[0].rReika, 37) && e3.reiat[1].karvaus === 0 && e3.reiat[1].rReika === 0,
  'karvaus: 150 → leikataan 136, kulmat r30 (reiässä r37); ilman karvausta terävät kulmat');

// ---- Mitattu ulkomitta (Tuotanto)
const em = kansi(410, 970, { mitattu: { lev: 462, syv: 1024 }, reiat: [nelio({ sTapa: 'reuna', sMm: 130 })] });
ok(em.aihio.lev === 507 && em.aihio.pit === 1069 && near(em.S.huppu, 984), 'mitattu 462 × 1024: aihio 507 × 1069, hupun pinta 984');
ok(near(P.kansiReianMitat(em.reiat[0], em, 'leikkuu').sAlku, 20 + 22.5 + 130), 'mitattu: reikä pysyy hupun pinnasta mitattuna samassa kohdassa kannen sisäreunasta');
ok(kansi(410, 970, { mitattu: { lev: '', syv: 0 } }).aihio.pit === 1065, 'tyhjä tai nolla mitattu = laskettu');

// ---- Yläreuna ei ulos: ei lisätä
ok(P.laskeKansi(410, 970, { huplis: 10, ylareunaV: 20, ylaTyyppi: 'tupla' }).aihio.pit === 1025, 'hupun yläreuna tupla: 970 + 10 + 5 + 2 × 20 = 1025');

// ---- Varoitukset
ok(kansi(410, 970, { reiat: [nelio({ l: 500 })] }).varoitukset.some(t => /reunan yli/.test(t)), 'liian iso reikä: varoitus kannen reunasta');
ok(kansi(410, 970, { reiat: [nelio({ sTapa: 'reuna', sMm: 100 }), nelio({ sTapa: 'reuna', sMm: 200 })] }).varoitukset.some(t => /päällekkäin/.test(t)), 'päällekkäiset reiät: varoitus');
ok(kansi(410, 970, { reiat: [nelio({ l: 10, s: 10 })] }).varoitukset.some(t => /karvaukselle/.test(t)), 'liian pieni reikä karvaukselle: varoitus');

// ---- Peltilistat käyttävät samaa laskentaa
const lape = P.laskeLapepiippu(Object.assign({ leveys: 410, suora: 970, etukork: 1000, takakork: 800 }, PERUS));
ok(lape.muut.find(p => p.osa === 'Kansi').pit === 1065 && lape.kansi && lape.kansi.aihio.pit === 1065, 'lapepiippu: kansirivi ja tulos.kansi samat');
ok(!P.laskeLapepiippu(Object.assign({ leveys: 410, suora: 970 }, PERUS), { kansi: false }).kansi, 'ilman kantta tulos.kansi = null');

console.log(fails ? 'EPÄONNISTUI: ' + fails : 'KAIKKI TESTIT OK');
process.exit(fails ? 1 : 0);
