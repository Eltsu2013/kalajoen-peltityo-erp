// Harjapiipun laskenta (orders/piippu-laskenta.js: laskeHarjapiippu, harjaPuoli2), vaihe 5 / 20.11.2026.
//
// Testipiippu A (Tomin Excel "Juuri kahdella puolen harjaa", 27.10.): luvut verrattu Exceliin 20.11.2026,
// ks. claude/harjapiippu_muistiinpanot.md. Erot Exceliin ovat Tomin päätöksiä:
//  - puolen 2 sivujuuret 1234 (Excel 1230): S9-korjaus +9 (kumpikin puoli omalla kulmallaan), tupla −5
//  - puolen 1 sivujuuret 871 (Excel 876): tupla lapepiipun tavalla
//  - hupun sivut 1290 (Excel 1295): sivun kaava + liitosvara 5
//  - hupun palat ylöspäin täysiin milleihin (Tomi 20.11.), siksi etu 1 = 793 (mockup v2:ssa 792 pyöristettynä)
const { laskeHarjapiippu, harjaPuoli2 } = require('../../orders/piippu-laskenta.js');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }
const near = (a, b, t) => Math.abs(a - b) <= (t === undefined ? 1e-9 : t);
const osa = (lista, nimi) => lista.find(p => p.osa === nimi);
const mitat = r => r ? r.lev + ' × ' + r.pit + (r.kpl > 1 ? ' (' + r.kpl + ' kpl)' : '') : 'puuttuu';

// Testipiippu A: leveys 390, suorat 445 + 750, korkeudet 760 / harja 550 / 940, yläreuna 35, vähennys 25, Alas 20, profiili 20, ylitys 200
const A = { lev1: 390, lev2: null, suora1: 445, suora2: 750, kork1: 760, korkH: 550, kork2: 940, poimu: 20,
  ylit1V: 200, ylit1O: 200, ylit2V: 200, ylit2O: 200, k24_1: 200, j25_1: 20, k24_2: 200, j25_2: 20,
  tupla: 15, etulis: 40, nousu: 200, sivulisa: 50, sauma: 20, huplis: 10, ylareunaV: 35, alatupla: 20, vahennys: 25,
  hsivlisa: 5, hattulis: 250, sivutJako: 1, jakosauma: 20 };
const a = laskeHarjapiippu(A);

// ---- Geometria: kummallekin puolelle oma kulma
ok(near(a.geom.puoli1.kaltevuusDeg, 25.3, 0.05) && near(a.geom.puoli2.kaltevuusDeg, 27.5, 0.05), 'kaltevuudet 25,3° / 27,5° (kuten Excelissä)');
ok(Math.round(a.geom.puoli1.vino) === 492 && Math.round(a.geom.puoli2.vino) === 845, 'vinomitat 492 / 845');
ok(a.virheet.length === 0, 'ei virheitä');

// ---- Juuret
ok(mitat(osa(a.juuret, 'Juuri etu 1')) === '430 × 440' && mitat(osa(a.juuret, 'Juuri etu 2')) === '430 × 440',
  'etujuuret 430 × 440 (Alas 20 + Eteen 200 + Alas 20 + nousu 200, ilman lapepiipun +20:tä)');
ok(mitat(osa(a.juuret, 'Juuri vasen 1')) === '435 × 871' && mitat(osa(a.juuret, 'Juuri oikea 1')) === '435 × 871', 'puolen 1 sivujuuret 435 × 871');
ok(mitat(osa(a.juuret, 'Juuri vasen 2')) === '435 × 1234' && mitat(osa(a.juuret, 'Juuri oikea 2')) === '435 × 1234', 'puolen 2 sivujuuret 435 × 1234 (S9-korjaus: oma kulma)');
ok(a.juuret.map(r => r.osa).join(',') === 'Juuri etu 1,Juuri vasen 1,Juuri oikea 1,Juuri etu 2,Juuri vasen 2,Juuri oikea 2', 'juuret: 6 riviä oikeassa järjestyksessä');

// S9-korjaus: puolen 2 sivujuuri lasketaan puolen 2 kulmalla, ei puolen 1 (Excelin vika). Puolen 1 kulmalla tulisi 1225.
const nousuKomp1 = 200 / Math.tan(a.geom.puoli1.kulma);
ok(Math.round(15 + 20 + 200 + a.geom.puoli2.vino + nousuKomp1 + 50) === 1225 && osa(a.juuret, 'Juuri vasen 2').pit === 1234, 'S9: vanhalla tavalla 1225, korjattuna 1234 (+9)');

// ---- Huppu (yhtenä kappaleena)
ok(mitat(osa(a.muut, 'Huppu etu 1')) === '440 × 793', 'hupun etu 1: 440 × 793 (760 + 35 + 20 + korjaus 2,36 − 25 = 792,4 → ylös)');
ok(mitat(osa(a.muut, 'Huppu etu 2')) === '440 × 973', 'hupun etu 2: 440 × 973');
const sivut = osa(a.muut, 'Huppu sivut');
ok(mitat(sivut) === '1290 × 973 (2 kpl)', 'hupun sivut 1290 × 973, 2 kpl (445 + 750 + 4 × 20 + 10 + liitosvara 5)');
ok(near(a.geom.harjaKohta, 492.5) && /harja 580 kohdassa 492,5/.test(sivut.lisa) && /^Leikkaus: 793 /.test(sivut.lisa), 'harjan kohta 492,5 etu 1 -päästä, harjalla 580 (ilman kaltevuuskorjausta): ' + sivut.lisa);
ok(near(a.geom.hE1Tod, 760 + 5 * 210 / 445 - 25) && near(a.geom.hHTod, 525) && near(a.geom.hE2Tod, 940 + 5 * 390 / 750 - 25), 'todelliset korkeudet ilman taitoksia: 737,4 / 525 / 917,6');

// ---- Kansi ja hattu leveämmän puolen mukaan
ok(mitat(osa(a.muut, 'Kansi')) === '550 × 1355' && mitat(osa(a.muut, 'Hattu')) === '640 × 1445', 'kansi 550 × 1355, hattu 640 × 1445');
const lev2 = laskeHarjapiippu(Object.assign({}, A, { lev2: 420 }));
ok(osa(lev2.muut, 'Kansi').lev === 580 && osa(lev2.muut, 'Hattu').lev === 670 && osa(lev2.muut, 'Huppu etu 2').lev === 470 && osa(lev2.juuret, 'Juuri etu 2').lev === 460,
  'eri leveydet: kansi ja hattu leveämmän (420) mukaan, etu 2 omalla leveydellään');

// ---- Poikki harjalta
const j = laskeHarjapiippu(Object.assign({}, A, { sivutJako: 2 }));
ok(mitat(osa(j.muut, 'Huppu sivu 1')) === '513 × 793 (2 kpl)' && mitat(osa(j.muut, 'Huppu sivu 2')) === '838 × 973 (2 kpl)',
  'poikki harjalta: sivu 1 = 492,5 + 20 → 513, sivu 2 = 797,5 + 40 → 838');
ok(!osa(j.muut, 'Huppu sivut') && osa(j.muut, 'Huppu sivu 1').lev + osa(j.muut, 'Huppu sivu 2').lev - 1 === 1290 + 60, 'poikki harjalta: yhteensä 1290 + jakosaumat 20 + 40 (pyöristys +1)');

// ---- Osavalinnat
const vain = laskeHarjapiippu(A, { juuret: false, huppu: true, kansi: false, hattu: false });
ok(vain.juuret.length === 0 && vain.muut.every(r => /^Huppu/.test(r.osa)) && vain.muut.length === 3, 'osavalinnat: vain huppu');

// ---- Virheelliset korkeudet
const v = laskeHarjapiippu(Object.assign({}, A, { kork2: 500 }));
ok(v.virheet.length === 1 && /Puolen 2/.test(v.virheet[0]), 'puolen 2 etukorkeus harjaa matalampi: virheilmoitus');

// ---- Puolen 2 ehdotukset
const e = harjaPuoli2({ suora1: 445, kork1: 760, korkH: 550, koko: 1195 }, { suora2: 'auto', puoli2: 'auto' });
ok(e.suora2 === 750 && near(e.kork2, 550 + 750 * 210 / 445) && near(e.vino1, Math.hypot(445, 210)) && e.varoitukset.length === 0, 'ehdotus: suora 2 = 1195 − 445 = 750, korkeus puolen 1 kaltevuudesta (' + Math.round(e.kork2) + ')');
const e2 = harjaPuoli2({ suora1: 445, kork1: 760, korkH: 550, koko: 1195 }, { suora2: 'auto', puoli2: { kork: 940 } });
ok(near(e2.kork2, 940) && Math.round(e2.vino2) === 845, 'oma korkeus 940 → vinomitta 845');
const e3 = harjaPuoli2({ suora1: 445, kork1: 760, korkH: 550, koko: 1195 }, { suora2: 'auto', puoli2: { vino: 845.34 } });
ok(near(e3.kork2, 940, 0.05), 'oma vinomitta 845,34 → korkeus 940');
const e4 = harjaPuoli2({ suora1: 445, kork1: 760, korkH: 550, koko: 1195 }, { suora2: 700, puoli2: 'auto' });
ok(e4.suora2 === 700 && e4.varoitukset.length === 1 && /eivät täsmää/.test(e4.varoitukset[0]), 'oma suora mitta 700: varoitus, ettei täsmää kokonaismittaan');

// ---- Ominaisuustesti: puolet päittäin vaihdettuna rivit vaihtuvat keskenään (paljastaa väärän puolen mitan, kuten S9)
let siemen = 11;
const rnd = () => { siemen = (siemen * 1103515245 + 12345) % 2147483648; return siemen / 2147483648; };
let vaihtoOk = true, vaihtoViesti = '';
for (let i = 0; i < 300 && vaihtoOk; i++) {
  const korkH = 300 + Math.round(rnd() * 500);
  const x = Object.assign({}, A, { lev1: 300 + Math.round(rnd() * 400), lev2: 300 + Math.round(rnd() * 400), suora1: 200 + Math.round(rnd() * 900), suora2: 200 + Math.round(rnd() * 900),
    korkH, kork1: korkH + 50 + Math.round(rnd() * 600), kork2: korkH + 50 + Math.round(rnd() * 600), ylit1V: Math.round(rnd() * 300), ylit1O: Math.round(rnd() * 300),
    ylit2V: Math.round(rnd() * 300), ylit2O: Math.round(rnd() * 300), k24_1: 150 + Math.round(rnd() * 100), k24_2: 150 + Math.round(rnd() * 100), j25_1: Math.round(rnd() * 30), j25_2: Math.round(rnd() * 30) });
  const y = Object.assign({}, x, { lev1: x.lev2, lev2: x.lev1, suora1: x.suora2, suora2: x.suora1, kork1: x.kork2, kork2: x.kork1,
    ylit1V: x.ylit2V, ylit1O: x.ylit2O, ylit2V: x.ylit1V, ylit2O: x.ylit1O, k24_1: x.k24_2, k24_2: x.k24_1, j25_1: x.j25_2, j25_2: x.j25_1 });
  const rx = laskeHarjapiippu(x), ry = laskeHarjapiippu(y);
  const vaihda = n => n.replace(/ 1$/, ' X').replace(/ 2$/, ' 1').replace(/ X$/, ' 2');
  const sama = (lx, ly, nimet) => lx.every(r => { const q = ly.find(z => z.osa === (nimet ? vaihda(r.osa) : r.osa)); return q && q.lev === r.lev && q.pit === r.pit && q.kpl === r.kpl; });
  if (!sama(rx.juuret, ry.juuret, true) || !sama(rx.muut.filter(r => /etu/.test(r.osa)), ry.muut, true) || !sama(rx.muut.filter(r => !/etu/.test(r.osa) && !/sivut/.test(r.osa)), ry.muut, false)
    || osa(rx.muut, 'Huppu sivut').lev !== osa(ry.muut, 'Huppu sivut').lev || osa(rx.muut, 'Huppu sivut').pit !== osa(ry.muut, 'Huppu sivut').pit) {
    vaihtoOk = false; vaihtoViesti = JSON.stringify(x);
  }
}
ok(vaihtoOk, '300 satunnaista harjapiippua: puolet päittäin vaihdettuna juuret ja etukappaleet vaihtuvat keskenään, sivut, kansi ja hattu samat ' + vaihtoViesti);

// ---- Lapepiippu ennallaan (sama tiedosto)
const { laskeLapepiippu } = require('../../orders/piippu-laskenta.js');
ok(typeof laskeLapepiippu === 'function', 'laskeLapepiippu yhä mukana (omat testit: test_lapepiippu.js)');

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
