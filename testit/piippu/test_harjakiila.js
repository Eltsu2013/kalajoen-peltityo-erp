// Harjapiipun kiila / mutka (orders/piippu-levitys.js: harjaKiilaTiedot, harjaMalli, harjaKiilaPalat, laskeKaikkiHarjaKiila).
// Vaihe 5b, 24.11.2026, suunnitelma claude/harjapiippu_kiila_suunnitelma.md (Tomi hyväksyi 24.11.).
//
// Tärkein testi: suoralla syötöllä 3D-malli antaa täsmälleen samat palat kuin nykyinen suoran harjapiipun levitys
// (harjaHupunPalat). Se todistaa, että malli on oikein, ennen kuin sitä käytetään vinoon piippuun.
const L = require('../../orders/piippu-levitys.js');
const PL = require('../../orders/pellit.js');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }
const near = (a, b, t) => Math.abs(a - b) <= (t === undefined ? 1e-6 : t);

// Testipiippu A (sama kuin test_harjapiippu.js)
const A = { tyyppi: 'harjapiippu', lev1: 390, lev2: null, suora1: 445, suora2: 750, kork1: 760, korkH: 550, kork2: 940, poimu: 20,
  ylit1V: 200, ylit1O: 200, ylit2V: 200, ylit2O: 200, k24_1: 200, j25_1: 20, k24_2: 200, j25_2: 20,
  tupla: 15, etulis: 40, nousu: 200, sivulisa: 50, sauma: 20, huplis: 10, ylareunaV: 35, alatupla: 20, vahennys: 25,
  hsivlisa: 5, hattulis: 250, sivutJako: 1, jakosauma: 20 };
const K = o => Object.assign({}, A, { kiilaPaalla: true }, o);
const pala = (t, nimi) => t.palat.find(p => p.nimi === nimi);

// ---- 1. Suora syöttö: 3D-malli = nykyinen levitys
function samat(v, nimi) {
  const a = L.harjaHupunPalat(v).palat, b = L.harjaKiilaPalat(v);
  if (!b) return ok(false, nimi + ': 3D-malli palautti tyhjän');
  let ero = 0, kulmaEro = 0, nimet = a.map(p => p.nimi + '×' + p.kpl).join() === b.palat.map(p => p.nimi + '×' + p.kpl).join();
  a.forEach(pa => {
    const pb = pala(b, pa.nimi);
    if (!pb) { nimet = false; return; }
    const qa = PL.aihioPisteet(L.levitaTaso(pa).p).pisteet, qb = PL.aihioPisteet(L.levitaTaso(pb).p).pisteet;
    if (qa.length !== qb.length) { ero = Infinity; return; }
    qa.forEach((q, i) => { ero = Math.max(ero, Math.hypot(q.x - qb[i].x, q.y - qb[i].y)); });
    kulmaEro = Math.max(kulmaEro, Math.abs(pb.vasen.kulma - 90), Math.abs(pb.oikea.kulma - 90), Math.abs(pb.ylaKulma - pa.ylaKulma));
  });
  ok(nimet && ero < 1e-6 && kulmaEro < 1e-6 && b.symmetrinen && b.varoitukset.length === 0,
    nimi + ': samat palat, merkintäpisteet ja kanttausluvut kuin suoralla laskennalla (ero ' + ero.toExponential(1) + ' mm)');
}
samat(A, 'suora A');
samat(Object.assign({}, A, { sivutJako: 2, etuJako1: 2, etuJako2: 3 }), 'suora A, poikki harjalta, etu 1 kahtena ja etu 2 kolmena');
samat(Object.assign({}, A, { ylaTyyppi: 'tupla', sauma: 15 }), 'suora A, yläreuna tupla, sauma 15');
samat(Object.assign({}, A, { ylaTyyppi: 'sisaan', suora1: 900, suora2: 260, kork1: 1100, korkH: 670, kork2: 800 }), 'suora, harja lähellä etu 2:ta, yläreuna sisään');

// ---- 2. Nappi päällä mutta kentät tyhjinä = suora laskenta sellaisenaan
const s0 = L.laskeKaikkiHarja(A), s1 = L.laskeKaikkiHarja(K({}));
ok(JSON.stringify(s0.muut) === JSON.stringify(s1.muut) && JSON.stringify(s0.juuret) === JSON.stringify(s1.juuret) && !s1.kiila,
  'kiila päällä, kentät tyhjinä: lista täsmälleen sama kuin suoralla');
ok(L.harjaHupunPalat(K({})).palat.length === L.harjaHupunPalat(A).palat.length && !L.harjaHupunPalat(K({})).malli, 'kiila päällä, kentät tyhjinä: suoran harjapiipun palat');

// ---- 3. Kiila oikealla −20 (kapenee alaspäin, mitattuna korkeimmasta kulmasta = etu 2 oikea, 940)
const tk = L.harjaKiilaPalat(K({ kiilaOikea: -20 }));
const lvE2 = L.levitaTaso(pala(tk, 'Huppu etu 2')), lvE1 = L.levitaTaso(pala(tk, 'Huppu etu 1'));
ok(tk && !tk.symmetrinen && pala(tk, 'Huppu sivut oikea') && pala(tk, 'Huppu sivut vasen') && pala(tk, 'Huppu sivut oikea').kpl === 1,
  'kiila oikealla: sivut eri muotoiset → omat rivit oikea ja vasen (1 kpl)');
ok(near(lvE2.mitat.yla - lvE2.mitat.ala, 20, 0.6) && near(lvE1.mitat.yla - lvE1.mitat.ala, 20 * 760 / 940, 0.6),
  'kiila oikealla: etu 2 alhaalta noin 20 mm kapeampi, etu 1 noin 16 mm (suhteessa korkeuteen) (' + (lvE2.mitat.yla - lvE2.mitat.ala).toFixed(1) + ' / ' + (lvE1.mitat.yla - lvE1.mitat.ala).toFixed(1) + ')');
// Kun vain toinen seinä kallistuu, seinät ovat silti kohtisuorassa toisiaan vastaan → kanttausluku 90°. Kun molemmat
// kallistuvat, kulma muuttuu hieman (lapepiipun kiilassa sama: "lähes 90°").
ok(near(pala(tk, 'Huppu etu 2').vasen.kulma, 90, 1e-6), 'kiila vain oikealla: kulmasauma edelleen 90° (seinät kohtisuorassa)');
const po = pala(L.harjaKiilaPalat(K({ kiilaOikea: -20, kiilaEtu2: -20 })), 'Huppu etu 2');
ok(Math.abs(po.vasen.kulma - 90) > 0.01 && Math.abs(po.vasen.kulma - 90) < 3 && near(po.oikea.kulma, 90, 1e-6),
  'kiila oikealla ja etu 2:ssa: niiden välinen kulmasauma ' + po.vasen.kulma.toFixed(3) + '° (ei 90), toinen kulma 90°');

// ---- 4. Mutka: koko vasen puoli 30 mm korkeampi (katto kallistuu sivulle, lappeet tasaisia) → ei varoitusta
const tm = L.harjaKiilaPalat(K({ korkE1V: 790, korkHV: 580, korkE2V: 970 }));
const lO = L.levitaTaso(pala(tm, 'Huppu sivut oikea')), lV = L.levitaTaso(pala(tm, 'Huppu sivut vasen'));
ok(tm && tm.varoitukset.length === 0 && !tm.symmetrinen, 'mutka (vasen puoli 30 mm korkeampi): ei kieroutta, sivut omina riveinään');
// Ero on 30,8 eikä tasan 30: katto kallistuu myös sivuttain, joten 5 mm ulompana oleva huppu osuu kattoon 0,4 mm alempana
ok(near(lV.mitat.oikea - lO.mitat.vasen, 30, 1) && near(lV.mitat.vasen - lO.mitat.oikea, 30, 1) && near(lV.harja.h - lO.harja.h, 30, 1),
  'mutka: vasen sivu noin 30 mm korkeampi etu 1:llä, etu 2:lla ja harjalla (' + (lV.harja.h - lO.harja.h).toFixed(2) + ')');
const e1m = L.levitaTaso(pala(tm, 'Huppu etu 1'));
ok(near(e1m.mitat.vasen - e1m.mitat.oikea, 30, 1), 'mutka: etu 1 vasemmasta reunasta noin 30 mm korkeampi (vino alareuna)');

// ---- 5. Kiero lape: vain yksi kulma korkeampi → varoitus
const tv = L.harjaKiilaPalat(K({ korkE1V: 790 }));
ok(tv && tv.varoitukset.length === 1 && /Puolen 1 lape on kiero: korkeudet heittävät noin 30 mm/.test(tv.varoitukset[0]),
  'kiero lape (etu 1 vasen 30 mm korkeampi, muut ennallaan): varoitus puolelle 1, heitto 30 mm');
ok(L.harjaKiilaPalat(K({ korkE1V: 763 })).varoitukset.length === 0, 'pieni heitto (3 mm): ei varoitusta');

// ---- 6. Vino harja: vasemmalla sivulla harja 100 mm kauempana etu 1:stä. Harja on vaakasuora, joten tasaisilla lappeilla
// harjasta kauempana olevat kulmat ovat matalammalla: korkeudet lasketaan lappeiden tasoista (oikea puoli ennallaan).
const ax = 100 / 390, b1 = 210 / 445, b2 = 390 / 750;                       // harjan suunta ja lappeiden kaltevuudet
const vinoH = K({ harjaVasen: 545, korkE1V: 760 + ax * b1 * 390, korkE2V: 940 - ax * b2 * 390 });
const th = L.harjaKiilaPalat(vinoH);
const hO = L.levitaTaso(pala(th, 'Huppu sivut oikea')).harja, hV = L.levitaTaso(pala(th, 'Huppu sivut vasen')).harja;
ok(th && th.varoitukset.length === 0, 'vino harja, korkeudet tasaisista lappeista: ei kieroutta');
ok(near(hO.x, 2.5 + 5 + 445 - 5 * ax, 1e-6) && near(hV.x, 2.5 + 5 + 650 - 5 * ax, 1e-6),
  'vino harja: oikealla harja ' + hO.x.toFixed(2) + ' mm etu 1 -päästä, vasemmalla ' + hV.x.toFixed(2) + ' mm etu 2 -päästä (huppu 5 mm ulompana siirtää harjaa 1,3 mm)');
ok(L.harjaKiilaPalat(K({ harjaVasen: 545 })).varoitukset.length === 2, 'vino harja mutta korkeudet ennallaan: kumpikaan lape ei voi olla tasainen → varoitus molemmille');

// ---- 7. Poikki harjalta kiilan kanssa
const tj = L.harjaKiilaPalat(K({ sivutJako: 2, vasenPituus: 1175 }));
ok(tj && ['Huppu sivu 1 oikea', 'Huppu sivu 2 oikea', 'Huppu sivu 1 vasen', 'Huppu sivu 2 vasen'].every(n => pala(tj, n)),
  'poikki harjalta, sivut eri pituiset: neljä sivupalaa');
const j1v = pala(tj, 'Huppu sivu 1 vasen'), j2v = pala(tj, 'Huppu sivu 2 vasen');
ok(j1v.paat.join() === 'harja,etu 1' && j1v.vasen.tyyppi === 't90' && j1v.vasen.s === 20 && j2v.paat.join() === 'etu 2,harja' && j2v.oikea.tyyppi === 'k40',
  'poikki harjalta, vasen sivu ulkopuolelta: etu 1 -puolen palassa jakosauma 90° vasemmassa reunassa, etu 2 -puolen palassa tupla oikeassa');
const jO = pala(tj, 'Huppu sivu 1 oikea').P + pala(tj, 'Huppu sivu 2 oikea').P, jV = j1v.P + j2v.P;
ok(near(jO - jV, 20, 1), 'poikki harjalta: vasen sivu noin 20 mm lyhyempi (1175 vs 1195; ' + (jO - jV).toFixed(2) + ')');

// ---- 8. Mahdottomat mitat
ok(L.harjaKiilaPalat(K({ vasenPituus: 4000 })) === null, 'mahdoton yläpää (vasen sivu 4000): ei paloja');
const lm = L.laskeKaikkiHarja(K({ vasenPituus: 4000 }));
ok(lm.virheet.length === 1 && /Kiilan mitat eivät sovi yhteen/.test(lm.virheet[0]), 'mahdoton yläpää: peltilistaan virheilmoitus');
ok(L.harjaKiilaPalat(K({ harjaVasen: 1300 })) === null, 'harja sivun ulkopuolella (1300 > 1195): ei paloja');

// ---- 9. Peltilista kiilan kanssa: kansi ja hattu leveimmän ja pisimmän mukaan, juuret pisimmän mukaan, hupun rivit aihiona
const lk = L.laskeKaikkiHarja(K({ lev2: 420, vasenPituus: 1250, suoraKulma: 0 }));
const rivi = (lista, n) => lista.find(r => r.osa === n);
ok(lk.kiila && lk.virheet.length === 0 && rivi(lk.muut, 'Hattu').lev === 420 + 250 && rivi(lk.muut, 'Hattu').pit === 1250 + 250,
  'kiila: hattu leveimmän (420) ja pisimmän (1250) mukaan');
ok(lk.kansi && lk.kansi.L.piippu === 420 && lk.kansi.S.piippu === 1250 && rivi(lk.muut, 'Kansi'), 'kiila: kansi leveimmän ja pisimmän mukaan');
ok(lk.juuret.length === 6 && lk.juuret.every(r => r.lev > 0 && r.pit > 0), 'kiila: kuusi juurta');
const hk = lk.muut.filter(r => /^Huppu/.test(r.osa)), tl = L.harjaKiilaPalat(K({ lev2: 420, vasenPituus: 1250 }));
ok(hk.length === tl.palat.length && hk.every(r => { const pa = pala(tl, r.osa), lv = L.levitaTaso(pa); return r.lev === Math.ceil(lv.p.w - 1e-6) && r.pit === Math.ceil(lv.p.h - 1e-6) && r.kpl === pa.kpl; }),
  'kiila: hupun rivit todellisen aihion kokoisina ylöspäin');
// juuret pisimmän mukaan: mutkassa vasen puoli korkeampi → sivujuuret vasemman (pidemmän) vinomitan mukaan
const jm = L.laskeKaikkiHarja(K({ korkE1V: 820, korkHV: 550, korkE2V: 940 })), js = L.laskeKaikkiHarja(A);
ok(rivi(jm.juuret, 'Juuri vasen 1').pit > rivi(js.juuret, 'Juuri vasen 1').pit && rivi(jm.juuret, 'Juuri oikea 1').pit === rivi(jm.juuret, 'Juuri vasen 1').pit,
  'juuret pisimmän mukaan: puolen 1 sivujuuret jyrkemmän (pidemmän) sivun mukaan, molemmat samat');

// ---- 10. Levityskuvat ja työkortin tiedot toimivat kiilan paloilla (ei kaadu, harjan kohta näkyy)
let kuvatOk = true;
[tk, tm, tj].forEach(t => t.palat.forEach(pa => {
  try { const h = L.palaHtml(pa); const ti = L.palaTiedot(pa); if (!h || !ti) kuvatOk = false; } catch (e) { kuvatOk = false; console.log(e.message); }
}));
ok(kuvatOk, 'levityskuva ja palan tiedot syntyvät kaikista kiilan paloista');
ok(L.harjaHupunPalat(K({ kiilaOikea: -20 })).palat.length === tk.palat.length, 'harjaHupunPalat käyttää kiilaa, kun kiila on päällä (Tuotanto ja työkortti)');

console.log(fails ? 'EPÄONNISTUI: ' + fails : 'KAIKKI TESTIT OK');
process.exit(fails ? 1 : 0);
