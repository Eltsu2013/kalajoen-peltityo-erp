// Piippujen hupun palat DXF:ään (orders/piippu-levitys.js: dxf, dxfPalat; vaihe 8.5 D4, 27.11.2026).
// Tarkistetaan: ääriviiva = merkintäpisteet (sama lähde kuin paperilla ja kaistakuvassa), peilikuvapari kahtena muotona
// (pinnoitettua peltiä ei voi kääntää), taitokset ilman nurkkaviivaa ja leikkausreunan päällä olevia viivoja, kappalemäärät,
// palat vierekkäin 50 mm välein, harjapiippu ja tiedoston luettavuus.
require('../../orders/dxf.js');                       // KPT_DXF
const L = require('../../orders/piippu-levitys.js');
const PL = require('../../orders/pellit.js');
const { parit, entiteetit, arvo } = require('../dxf/lue_dxf.js');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else console.log('ok  :', msg); }
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);
const sama = (r1, r2) => r1.length === r2.length && r1.every((q, i) => near(q[0], r2[i][0], 1e-9) && near(q[1], r2[i][1], 1e-9));

const OLETUS = { leveys: 400, suora: 600, etukork: 1000, takakork: 800, sauma: 20, huplis: 10, ylareunaV: 20, alatupla: 20, vahennys: 20,
  huptakalis: 5, saumatyyppi: 1, huppuEtuKpl: 1, huppuSivutKpl: 1, huppuTakaKpl: 1 };
const lape = v => L.hupunPalat(Object.assign({}, OLETUS, v)).palat;
const rengas = (p, peili) => PL.aihioPisteet(p, peili).pisteet.map(q => [q.x, q.y]);

// 1) Lapepiippu: palat, peilikuvapari, ääriviiva = merkintäpisteet
{
  const palat = lape({}), lista = L.dxfPalat(palat, 1);
  const siv = palat.find(p => p.nimi === 'Huppu sivut');
  ok(siv && siv.peili && siv.kpl === 2, '1a: ruudulla sivut yhtenä palana, 2 kpl, peilikuvat');
  ok(lista.map(k => k.nimi + ':' + k.kpl).join('|') === 'Huppu etu:1|Huppu sivut:1|Huppu sivut, peilikuva:1|Huppu taka:1', '1b: DXF:ssä etu, sivut, sivut peilikuvana, taka (' + lista.map(k => k.nimi + ':' + k.kpl).join(', ') + ')');
  const lv = L.levita(siv);
  ok(sama(lista[1].ring, rengas(lv.p, false)) && sama(lista[2].ring, rengas(lv.p, true)), '1c: ääriviivat = merkintäpisteet (ulkopinta ja peilikuva)');
  ok(sama(lista[2].ring.map(q => [lv.p.w - q[0], q[1]]).sort((a, b) => a[0] - b[0] || a[1] - b[1]), lista[1].ring.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])), '1d: peilikuva = sama muoto x:n suhteen käännettynä');
  // kaistakuva käyttää samaa paria
  const kk = L.kaistaKappaleet(palat, 1).find(k => k.nimi === 'Huppu sivut');
  ok(kk && sama(kk.ring, lista[1].ring) && sama(kk.ringPeili, lista[2].ring), '1e: sama muoto ja peilikuva kuin kaistakuvassa');
  const etu = palat[0], le = L.levita(etu);
  ok(sama(lista[0].ring, rengas(le.p, false)) && near(lista[0].w, le.p.w) && near(lista[0].h, le.p.h), '1f: etu: ääriviiva ja koko kuten levityksessä');
}

// 2) Taitokset: nurkkaviiva ('ei') pois, tuplan viiva mukaan, peilikuvassa peilattuna
{
  const palat = lape({}), lista = L.dxfPalat(palat, 1);
  const etu = L.levita(palat[0]), siv = L.levita(palat[1]);
  ok(lista[0].viivat.length === etu.viivat.filter(v => v.suunta !== 'ei').length && lista[0].viivat.length === 4, '2a: etu: 4 taitosta (saumat 2, alatupla, yläreuna)');
  ok(siv.viivat.some(v => v.suunta === 'ei') && lista[1].viivat.length === siv.viivat.filter(v => v.suunta !== 'ei').length, '2b: sivu: nurkkaviiva (ei taitosta) jätetty pois');
  const tupla = siv.viivat.find(v => v.tupla), x = tupla.p[0] - siv.p.minX;
  ok(lista[1].viivat.some(v => near(v[0][0], x) && near(v[1][0], x)), '2c: sivu: tuplan taitos 20 mm nurkasta (x = ' + x.toFixed(1) + ')');
  ok(lista[2].viivat.some(v => near(v[0][0], siv.p.w - x) && near(v[1][0], siv.p.w - x)), '2d: peilikuvassa tuplan taitos peilattuna (x = ' + (siv.p.w - x).toFixed(1) + ')');
  // taitokset paneelin sisällä tai reunalla, eivät aihion ulkopuolella
  ok(lista.every(k => k.viivat.every(v => v.every(q => q[0] > -1e-6 && q[0] < k.w + 1e-6 && q[1] > -1e-6 && q[1] < k.h + 1e-6))), '2e: kaikki taitokset aihion sisällä');
  // 0 mm sauma: sauman viiva olisi leikkausreunan päällä → ei taitosta
  const p0 = lape({ sauma: 0 }), l0 = L.dxfPalat(p0, 1);
  ok(l0[0].viivat.length === 2, '2f: 0 mm sauma: etupalassa vain ala- ja yläreunan taitokset (' + l0[0].viivat.length + ')');
}

// 3) Kappalemäärät ja symmetrinen sivu
{
  const l3 = L.dxfPalat(lape({}), 3);
  ok(l3.map(k => k.kpl).join(',') === '3,3,3,3', '3a: 3 piippua: etu 3, sivut 3 + peilikuva 3, taka 3');
  ok(L.dxfPalat(lape({}), 2.7).map(k => k.kpl).join(',') === '2,2,2,2', '3b: piippujen määrä kokonaisluvuksi alaspäin (kuten kaistat)');
  // suora sivu (etu- ja takakorkeus samat, saumatyyppi 2 = molemmat päät 40): sivu on itsessään symmetrinen → yksi muoto 2 kpl
  const ps = lape({ etukork: 900, takakork: 900, saumatyyppi: 2 }), ls = L.dxfPalat(ps, 1);
  const s = ls.filter(k => /sivut/.test(k.nimi));
  ok(s.length === 1 && s[0].kpl === 2, '3c: symmetrinen sivu: yksi muoto, 2 kpl (' + s.map(k => k.nimi + ':' + k.kpl).join(', ') + ')');
  // epäsymmetrinen kiilapiippu: sivut omina paloinaan (ei peilikuvaparia)
  const pk = lape({ kiilaPaalla: true, kiilaOikea: -20 }), lk = L.dxfPalat(pk, 1);
  ok(pk.some(p => / oikea$/.test(p.nimi)) && !lk.some(k => /peilikuva/.test(k.nimi)) && lk.length === pk.length, '3d: kiila oikealle: sivut oikea ja vasen omina muotoinaan (' + lk.map(k => k.nimi).join(', ') + ')');
}

// 4) Koko tiedosto
{
  const d = L.dxf(lape({}), 'Piippu 1', 1), t = d.sisalto(), e = entiteetit(parit(t).p);
  const polyt = []; let nyk = null;
  e.forEach(x => { if (x.tyyppi === 'POLYLINE') { nyk = { taso: arvo(x, 8), suljettu: arvo(x, 70) === '1', v: [] }; polyt.push(nyk); } else if (x.tyyppi === 'VERTEX' && nyk) nyk.v.push([+arvo(x, 10), +arvo(x, 20)]); else if (x.tyyppi === 'SEQEND') nyk = null; });
  ok(polyt.length === 4 && polyt.every(p => p.taso === 'LEIKKAUS' && p.suljettu), '4a: neljä suljettua ääriviivaa LEIKKAUS-tasolla');
  const rajat = polyt.map(p => ({ min: Math.min(...p.v.map(q => q[0])), max: Math.max(...p.v.map(q => q[0])), ymin: Math.min(...p.v.map(q => q[1])) }));
  ok(rajat.every((r, i) => i === 0 || near(r.min - rajat[i - 1].max, 50, 0.01)) && near(rajat[0].min, 0, 0.01), '4b: palat vierekkäin 50 mm välein origosta alkaen');
  ok(rajat.every(r => near(r.ymin, 0, 0.01)), '4c: palojen alareuna y = 0');
  const tekstit = e.filter(x => x.tyyppi === 'TEXT').map(x => arvo(x, 1));
  const etu = L.levita(lape({})[0]).p;
  ok(tekstit[0] === 'Piippu 1 - Huppu etu - 1 kpl - aihio ' + Math.ceil(etu.w - 1e-6) + ' x ' + Math.ceil(etu.h - 1e-6) + ' mm', '4d: teksti: ' + tekstit[0]);
  ok(tekstit[2].indexOf('Piippu 1 - Huppu sivut, peilikuva - 1 kpl') === 0, '4e: peilikuvan teksti: ' + tekstit[2]);
  const taitokset = e.filter(x => x.tyyppi === 'LINE');
  ok(taitokset.length > 0 && taitokset.every(x => arvo(x, 8) === 'TAITOS'), '4f: taitokset TAITOS-tasolla (' + taitokset.length + ')');
  ok(L.dxf([], 'X', 1) === null && L.dxf(null, 'X', 1) === null, '4g: ei paloja → ei tiedostoa');
}

// 5) Harjapiippu
const A = { lev1: 390, lev2: null, suora1: 445, suora2: 750, kork1: 760, korkH: 550, kork2: 940, poimu: 20,
  ylit1V: 200, ylit1O: 200, ylit2V: 200, ylit2O: 200, k24_1: 200, j25_1: 20, k24_2: 200, j25_2: 20,
  tupla: 15, etulis: 40, nousu: 200, sivulisa: 50, sauma: 20, huplis: 10, ylareunaV: 35, alatupla: 20, vahennys: 25,
  hsivlisa: 5, hattulis: 250, sivutJako: 1, jakosauma: 20 };
{
  const t = L.harjaHupunPalat(A), lista = L.dxfPalat(t.palat, 1);
  ok(lista.map(k => k.nimi).join('|') === 'Huppu etu 1|Huppu etu 2|Huppu sivut|Huppu sivut, peilikuva', '5a: harjapiippu: etu 1, etu 2, sivut ja sivut peilikuvana (' + lista.map(k => k.nimi + ':' + k.kpl).join(', ') + ')');
  const siv = t.palat.find(p => p.nimi === 'Huppu sivut'), lv = L.levita(siv);
  ok(sama(lista[2].ring, rengas(lv.p, false)) && sama(lista[3].ring, rengas(lv.p, true)), '5b: sivun ääriviiva (taittuva alareuna harjalla) = merkintäpisteet');
  ok(lista[2].viivat.length === lv.viivat.filter(v => v.suunta !== 'ei').length, '5c: sivun taitokset: alatuplan kaksi osaa, saumat, tuplat, yläreuna');
  const j2 = L.dxfPalat(L.harjaHupunPalat(Object.assign({}, A, { sivutJako: 2 })).palat, 2);
  ok(j2.filter(k => /sivu 1/.test(k.nimi)).length === 2 && j2.filter(k => /sivu 1/.test(k.nimi)).every(k => k.kpl === 2), '5d: sivut kahtena osana, 2 piippua: sivu 1 ja sen peilikuva 2 + 2 kpl');
  const d = L.dxf(t.palat, 'Harjapiippu ä', 1);
  ok(d && entiteetit(parit(d.sisalto()).p).filter(x => x.tyyppi === 'POLYLINE').length === 4, '5e: tiedosto: neljä palaa');
  const koodattu = KPT_DXF.koodaa(d.sisalto());
  ok(koodattu.includes(0xe4), '5f: ääkköset Windows-1252:na (ä = 0xE4)');
}

// 6) Kansi (D4b): samaan tiedostoon hupun palojen perään, samassa asennossa kuin kansikuva (Tomi 27.11.: yläpuolelta vasemman
//    sivun puolelta, etu vasemmalla, väri ylöspäin; ei peilausta), karvattu reikä leikataan pienempänä
{
  const PI = require('../../orders/piippu-laskenta.js');
  const vals = Object.assign({}, OLETUS, { kansi: { tyyppi: '90', T: 20, lovi: '45', reiat: [
    { muoto: 'pyorea', d: 150, vTapa: 'reuna', vMm: 50, sTapa: 'reuna', sMm: 60, karvaus: true, karvMm: 7 },
    { muoto: 'nelio', l: 120, s: 100, vTapa: 'keski', sTapa: 'reuna', sMm: 250, karvaus: true, karvMm: 7 },
    { muoto: 'nelio', l: 80, s: 80, vTapa: 'keski', sTapa: 'reuna', sMm: 400, karvaus: false }] } });
  const k = PI.laskeKansi(400, 600, vals);
  const AU = k.S.aihio, AW = k.L.aihio;
  const d = L.dxf(lape({}), 'Piippu 1', 2, { kansi: { k, kpl: 2 } }), e = entiteetit(parit(d.sisalto()).p);
  const polyt = []; let nyk = null;
  e.forEach(x => { if (x.tyyppi === 'POLYLINE') { nyk = { taso: arvo(x, 8), suljettu: arvo(x, 70) === '1', v: [] }; polyt.push(nyk); } else if (x.tyyppi === 'VERTEX' && nyk) nyk.v.push([+arvo(x, 10), +arvo(x, 20), +(arvo(x, 42) || 0)]); else if (x.tyyppi === 'SEQEND') nyk = null; });
  const hupunPalat = polyt.slice(0, 4), kp = polyt.slice(4);
  const x0 = Math.max(...hupunPalat[3].v.map(q => q[0])) + 50;
  ok(kp.length === 1 + 1 + 3 + 2, '6a: kansi: ääriviiva, taitos, 3 reiän leikkaus ja 2 karvauksen taitosta (' + kp.length + ')');
  const raja = kp[0];
  ok(raja.taso === 'LEIKKAUS' && raja.v.length === 8 && near(Math.min(...raja.v.map(q => q[0])), x0, 1e-3) && near(Math.max(...raja.v.map(q => q[0])) - x0, AU, 1e-3) && near(Math.max(...raja.v.map(q => q[1])), AW, 1e-3),
    '6b: kannen ääriviiva ' + AU + ' × ' + AW + ', 8 kulmapistettä (45° viisteet), 50 mm hupun palojen jälkeen');
  ok(raja.v.some(q => near(q[0], x0 + 20, 1e-3) && near(q[1], 0, 1e-3)) && raja.v.some(q => near(q[0], x0, 1e-3) && near(q[1], 20, 1e-3)), '6c: kulman viiste 20 × 20');
  const taitos = kp[1];
  ok(taitos.taso === 'TAITOS' && near(Math.min(...taitos.v.map(q => q[0])), x0 + 20, 1e-3) && near(Math.min(...taitos.v.map(q => q[1])), 20, 1e-3), '6d: taitos 20 mm reunasta');
  // pyöreä karvattu reikä: leikkaus Ø 150 − 2 × 7 = 136, taitos Ø 150; yläpuolelta x = AU − u
  const r1 = k.reiat[0], ymp = kp.filter(p => p.v.length === 2 && p.v.every(q => q[2] === 1));
  const sade = p => Math.abs(p.v[0][0] - p.v[1][0]) / 2, kx = p => (p.v[0][0] + p.v[1][0]) / 2;
  ok(ymp.length === 2 && ymp.some(p => p.taso === 'LEIKKAUS' && near(sade(p), 71.5)) && ymp.some(p => p.taso === 'TAITOS' && near(sade(p), 75)), '6e: pyöreä karvattu reikä (7 mm): leikkaus Ø 143 (puolet karvauksesta, Tomi 27.11.), taitos Ø 150, oikeina ympyröinä');
  ok(ymp.every(p => near(kx(p), x0 + r1.u, 1e-6) && near(p.v[0][1], r1.w, 1e-6)), '6f: kuten kansikuvassa: reiän x = etäisyys etureunasta (etu vasemmalla, ei peilausta)');
  // kanttinen karvattu reikä: leikkaus pyöristetyin kulmin (rLeik), taitos rReika
  const r2 = k.reiat[1];
  const kant = kp.filter(p => p.v.length === 8 && p !== raja && p !== taitos);
  ok(r2.rLeik > 0 && kant.length === 2 && kant.every(p => p.v.filter(q => near(q[2], KPT_DXF.kaarevuus(90))).length === 4), '6g: kanttinen karvattu reikä: pyöristetyt kulmat (4 × 90° kaari) leikkauksessa ja taitoksessa');
  const lk = kant.find(p => p.taso === 'LEIKKAUS'), lev = p => Math.max(...p.v.map(q => q[0])) - Math.min(...p.v.map(q => q[0])), kork = p => Math.max(...p.v.map(q => q[1])) - Math.min(...p.v.map(q => q[1]));
  ok(lk && near(lev(lk), r2.du - r2.karvaus, 1e-6) && near(kork(lk), r2.dw - r2.karvaus, 1e-6), '6h: leikattava reikä ' + (r2.du - r2.karvaus) + ' × ' + (r2.dw - r2.karvaus) + ' (reunasta puolet karvauksesta)');
  const kaarenSade = p => { const i = p.v.findIndex(q => q[2]); const a = p.v[i], b = p.v[(i + 1) % p.v.length]; return Math.hypot(b[0] - a[0], b[1] - a[1]) / Math.SQRT2; };
  ok(near(kaarenSade(lk), r2.rReika - r2.karvaus / 2, 1e-6) && near(kaarenSade(kant.find(p => p.taso === 'TAITOS')), r2.rReika, 1e-6), '6h2: leikkauksen kulmapyöristys = reiän pyöristys − karvaus/2 (samankeskinen)');
  const nelio = kp.find(p => p.v.length === 4 && p.taso === 'LEIKKAUS');
  ok(nelio && near(lev(nelio), 80) && near(kork(nelio), 80), '6i: karvaamaton reikä 80 × 80 leikataan sellaisenaan, ei taitosta');
  const tekstit = e.filter(x => x.tyyppi === 'TEXT').map(x => arvo(x, 1));
  ok(['ETU', 'TAKA', 'VASEN', 'OIKEA'].every(t => tekstit.includes(t)), '6j: reunojen nimet TEKSTI-tasolla');
  const etu = e.find(x => x.tyyppi === 'TEXT' && arvo(x, 1) === 'ETU'), taka = e.find(x => x.tyyppi === 'TEXT' && arvo(x, 1) === 'TAKA');
  ok(+arvo(etu, 10) < +arvo(taka, 10), '6k: ETU vasemmalla, TAKA oikealla (kuten työkortissa)');
  ok(tekstit.some(t => t.indexOf('Piippu 1 - Kansi - 2 kpl - aihio ' + Math.ceil(AU - 1e-6) + ' x ' + Math.ceil(AW - 1e-6) + ' mm') === 0), '6l: kannen teksti ja kappalemäärä');
  // suora lovi ja pelkkä kansi ilman hupun paloja
  const k2 = PI.laskeKansi(400, 600, Object.assign({}, vals, { kansi: Object.assign({}, vals.kansi, { lovi: 'suora', reiat: [] }) }));
  const d2 = L.dxf([], 'P', 1, { kansi: { k: k2, kpl: 1 } }), p2 = entiteetit(parit(d2.sisalto()).p).filter(x => x.tyyppi === 'VERTEX').length;
  ok(d2 && p2 === 12 + 4, '6m: suora lovi (12 pistettä) ja taitos; pelkkä kansi ilman hupun paloja kelpaa');
  ok(L.dxf(lape({}), 'P', 1, { kansi: null }).sisalto().indexOf('Kansi') < 0, '6n: ilman kantta ei kantta tiedostossa');
  // harjapiippu: ETU 1 / ETU 2
  const kh = PI.laskeKansi(390, 1195, Object.assign({}, vals, { kansi: Object.assign({}, vals.kansi, { reiat: [] }) }));
  kh.harja = true;
  const th = entiteetit(parit(L.dxf([], 'H', 1, { kansi: { k: kh, kpl: 1 } }).sisalto()).p).filter(x => x.tyyppi === 'TEXT').map(x => arvo(x, 1));
  ok(th.includes('ETU 1') && th.includes('ETU 2'), '6o: harjapiipun kannessa ETU 1 / ETU 2');
}

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
