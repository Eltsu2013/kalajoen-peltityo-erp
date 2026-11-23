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
ok(near(a.geom.harjaKohta, 492.5) && !sivut.lisa, 'harjan kohta 492,5 etu 1 -päästä; sivuilla ei leikkausmittoja (pois 23.11.2026): ' + sivut.lisa);
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

// ======================================================================================================
// Hupun palojen levityskuvat (orders/piippu-levitys.js: harjaHupunPalat, levitaTaso, laskeKaikkiHarja), vaihe 5 osa 2
const L = require('../../orders/piippu-levitys.js');
const PL = require('../../orders/pellit.js');
const pisteet = lv => PL.aihioPisteet(lv.p).pisteet.map(q => [Math.round(q.x * 1000) / 1000, Math.round(q.y * 1000) / 1000]);
const aihio = lv => Math.ceil(lv.p.w - 1e-6) + ' × ' + Math.ceil(lv.p.h - 1e-6);

// Tasolevitys = lapepiipun levitys samoille paloille (suora lapepiippu: seinät pystyssä, joten 3D-avaus on tasolevitys)
const LAPE = { leveys: 400, suora: 600, etukork: 1000, takakork: 800, sauma: 20, huplis: 10, ylareunaV: 20, alatupla: 20, vahennys: 20,
  huptakalis: 5, saumatyyppi: 1, huppuEtuKpl: 1, huppuSivutKpl: 2, huppuTakaKpl: 1 };
let tasoOk = true, tasoViesti = '';
['ulos', 'sisaan', 'tupla'].forEach(yt => [1, 2].forEach(st => {
  L.hupunPalat(Object.assign({}, LAPE, { ylaTyyppi: yt, saumatyyppi: st })).palat.forEach(pa => {
    const v1 = L.levitaPala(pa), m = v1.mitat;
    const pa2 = Object.assign({}, pa, { P: m.yla, ala2d: [[0, -m.vasen], [m.yla, -m.oikea]] });
    const v2 = L.levitaTaso(pa2);
    if (JSON.stringify(pisteet(v1)) !== JSON.stringify(pisteet(v2)) || v1.lovet.length !== v2.lovet.length) { tasoOk = false; tasoViesti = pa.nimi + ' ' + yt + ' sauma ' + st; }
  });
}));
ok(tasoOk, 'tasolevitys antaa lapepiipun paloille täsmälleen samat merkintäpisteet ja loveukset kuin lapepiipun levitys ' + tasoViesti);

// Testipiippu A: palat ja aihiot
const hp = L.harjaHupunPalat(A), pala = n => hp.palat.find(p => p.nimi === n);
ok(hp.palat.map(p => p.nimi + ' ' + p.kpl).join(', ') === 'Huppu etu 1 1, Huppu etu 2 1, Huppu sivut 2', 'palat: etu 1, etu 2, sivut 2 kpl');
const lvE1 = L.levitaTaso(pala('Huppu etu 1')), lvE2 = L.levitaTaso(pala('Huppu etu 2')), lvS = L.levitaTaso(pala('Huppu sivut'));
ok(aihio(lvE1) === '440 × 793' && aihio(lvE2) === '440 × 973', 'etukappaleiden aihiot = listan mitat (440 × 793, 440 × 973)');
ok(aihio(lvS) === '1290 × 962', 'sivukappale 1290 × 962 (listan kaava 973, ylimääräinen korkeus pois kuten lapepiipussa)');
ok(lvS.harja && near(lvS.harja.x, 452.5) && near(lvS.harja.aihiosta, 492.5) && near(lvS.harja.h, 525), 'harjan kohta 452,5 paneelista / 492,5 aihiosta, korkeus harjalla 525');
const kp = PL.aihioPisteet(lvS.p);
ok(kp.silmukoita === 1 && kp.pisteet.some(q => near(q.x, 492.5, 0.01) && near(q.y, 961.2 - 560, 0.1)), 'merkintäpisteissä V:n kärki (492,5; ' + (961.2 - 560).toFixed(1) + ')');
const lovi = lvS.lovet[lvS.lovet.length - 1];
const kulmaV = (a, b, c) => { const u = [a[0] - b[0], a[1] - b[1]], w = [c[0] - b[0], c[1] - b[1]]; return Math.acos((u[0] * w[0] + u[1] * w[1]) / Math.hypot(u[0], u[1]) / Math.hypot(w[0], w[1])) * 180 / Math.PI; };
ok(lovi.length === 4 && near(kulmaV(pala('Huppu sivut').ala2d[0], lovi[0], lovi[1]), 45, 1e-6) && near(kulmaV(pala('Huppu sivut').ala2d[2], lovi[0], lovi[3]), 45, 1e-6),
  'harjan loveus: kumpikin tupla viistetty 45° taitosviivasta, kärki V:n kärjessä');
const tr = L.taitosRivit(pala('Huppu sivut'));
ok(tr.length === 5 && tr.filter(r => /^Alareuna/.test(r[0])).length === 2 && /usein käsin/.test(tr[2][4]) && /\(etu 1\)/.test(tr[0][0]), 'taitostaulukko: kaksi alatuplaa (usein käsin), päiden nimet');
ok(pala('Huppu etu 1').vasen.tyyppi === 't90' && pala('Huppu sivut').vasen.tyyppi === 'k40' && pala('Huppu sivut').oikea.tyyppi === 'k40', 'saumat: etukappaleet 20 + 20 ulos, sivut 40 + 40');

// Poikki harjalta
const hj = L.harjaHupunPalat(Object.assign({}, A, { sivutJako: 2 })), s1 = hj.palat.find(p => p.nimi === 'Huppu sivu 1'), s2 = hj.palat.find(p => p.nimi === 'Huppu sivu 2');
ok(aihio(L.levitaTaso(s1)) === '513 × 782' && aihio(L.levitaTaso(s2)) === '838 × 962', 'poikki harjalta: sivu 1 513 × 782, sivu 2 838 × 962');
ok(s1.oikea.tyyppi === 't90' && s1.oikea.s === 20 && !s1.oikea.nurkka && s2.vasen.tyyppi === 'k40' && s2.vasen.w === 40 && !s2.vasen.nurkka,
  'jakosauma: etu 1 -puolelle 20 ulos, etu 2 -puolelle 20 + 20 tupla (Tomi 20.11.)');
ok(L.taitosRivit(s2)[0][1] === '20 + 20' && /jakosauma/.test(L.taitosRivit(s2)[0][4]) && /\(harja\)/.test(L.taitosRivit(s2)[0][0]), 'taitostaulukko: jakosauma harjan päässä');

// Peltilista: hupun rivit = aihio, muut kuten laskeHarjapiippu
const kk = L.laskeKaikkiHarja(A), kaava = laskeHarjapiippu(A);
ok(JSON.stringify(kk.juuret) === JSON.stringify(kaava.juuret) && JSON.stringify(kk.muut.filter(r => !/^Huppu/.test(r.osa))) === JSON.stringify(kaava.muut.filter(r => !/^Huppu/.test(r.osa))),
  'lista: juuret, kansi ja hattu kuten laskeHarjapiippu');
ok(mitat(osa(kk.muut, 'Huppu sivut')) === '1290 × 962 (2 kpl)' && osa(kk.muut, 'Huppu sivut').lisa === osa(kaava.muut, 'Huppu sivut').lisa && mitat(osa(kk.muut, 'Huppu etu 1')) === '440 × 793',
  'lista: hupun sivut 1290 × 962, leikkausmitat säilyvät, etu 1 ennallaan');

// Ominaisuustesti: satunnaiset harjapiiput, yksi ääriviiva joka palassa, aihio ei koskaan kaavan lukua suurempi
let hOk = true, hViesti = '', hPaloja = 0;
for (let i = 0; i < 200 && hOk; i++) {
  const korkH = 300 + Math.round(rnd() * 500);
  const x = Object.assign({}, A, { lev1: 300 + Math.round(rnd() * 400), lev2: rnd() < 0.5 ? null : 300 + Math.round(rnd() * 400), suora1: 200 + Math.round(rnd() * 900),
    suora2: 200 + Math.round(rnd() * 900), korkH, kork1: korkH + 60 + Math.round(rnd() * 600), kork2: korkH + 60 + Math.round(rnd() * 600),
    sivutJako: rnd() < 0.5 ? 1 : 2, ylaTyyppi: ['ulos', 'sisaan', 'tupla'][Math.floor(rnd() * 3)], ylareunaV: [20, 35][Math.floor(rnd() * 2)] });
  const k1 = L.laskeKaikkiHarja(x), k0 = laskeHarjapiippu(x), t = L.harjaHupunPalat(x);
  t.palat.forEach(pa => {
    hPaloja++;
    const r = PL.aihioPisteet(L.levitaTaso(pa).p), a1 = osa(k1.muut, pa.nimi), a0 = osa(k0.muut, pa.nimi);
    const virhe = r.silmukoita !== 1 ? 'monta ääriviivaa' : !(a1 && a0) ? 'rivi puuttuu' : a1.lev > a0.lev || a1.pit > a0.pit ? 'aihio isompi kuin kaava' : '';
    if (virhe && hOk) { hOk = false; hViesti = virhe + ' ' + pa.nimi + ' ' + JSON.stringify(x); }
  });
}
ok(hOk, '200 satunnaista harjapiippua, ' + hPaloja + ' palaa: yksi ääriviiva, aihio ei koskaan kaavan lukua suurempi ' + hViesti);
ok(L.harjaHupunPalat(Object.assign({}, A, { kork2: 500 })) === null && L.laskeKaikkiHarja(Object.assign({}, A, { kork2: 500 })).virheet.length === 1, 'virheelliset korkeudet: ei paloja, virhe välittyy listaan');
ok(/<svg/.test(L.palaHtml(pala('Huppu sivut'))) && /harja/.test(L.palaHtml(pala('Huppu sivut'))), 'palaHtml piirtää sivukappaleen harjoineen');

// Sivukuva ja kaltevuus suhdelukuna (vaihe 6b: yhteinen harjapiippu-sivulle ja Tuotannolle)
ok(JSON.stringify(L.harjaSuhde(A)) === JSON.stringify(['1:2.1', '1:1.9']), 'kaltevuus suhdelukuna kuten lapepiipussa: 445 / 210 = 1:2.1, 750 / 390 = 1:1.9');
ok(L.harjaSuhde(Object.assign({}, A, { kork2: 500 }))[1] === '—', 'kaltevuus: mahdoton puoli = —');
const sk = L.harjaSivukuva(A), skT = L.harjaSivukuva(A, { todelliset: true });
ok(/^<svg/.test(sk) && /vino 492/.test(sk) && /vino 845/.test(sk) && /koko 1195/.test(sk) && !/↳/.test(sk), 'sivukuva: vinomitat 492 / 845, koko 1195');
ok(/↳ 737/.test(skT) && /↳ 525/.test(skT) && /↳ 918/.test(skT), 'Tuotannon sivukuva: todelliset korkeudet 737 / 525 / 918');

// ---- Lapepiippu ennallaan (sama tiedosto)
const { laskeLapepiippu } = require('../../orders/piippu-laskenta.js');
ok(typeof laskeLapepiippu === 'function', 'laskeLapepiippu yhä mukana (omat testit: test_lapepiippu.js)');

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
