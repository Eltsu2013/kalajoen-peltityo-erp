// Kaistat ja rullan menekki piipuille (orders/menekki.js + piippu-levitys.js kaistaKappaleet), vaihe 8.3 24.11.2026.
// Huuvan kaistalaskenta on testattu tiedostossa testit/huuva/test_kaista.js (sama koodi, nyt menekki.js:ssä).
// Tässä: yhteinen tiedosto toimii ilman Huuvaa, kappaleiden muoto (ring) ja piipun hupun palat kaistoille.
require('../../orders/geom.js');
const PL = require('../../orders/pellit.js');
const M = require('../../orders/menekki.js');
const L = require('../../orders/piippu-levitys.js');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }
const near = (a, b, tol) => Math.abs(a - b) <= (tol || 1e-6);
const nelio = (w, h) => [[0, 0], [w, 0], [w, h], [0, h]];

// ---- 1) Suorakaiteet suorana: kaistan pituus = kpl × leveys, rivit rullan leveydelle
(function () {
  const kr = M.laskeKaistat([{ nimi: 'A', kpl: 3, w: 400, h: 500, ring: nelio(400, 500) }, { nimi: 'B', kpl: 2, w: 300, h: 600, ring: nelio(300, 600) }], { tila: 'suora', rulla: 1250 });
  ok(kr.kaistat.length === 2 && near(kr.kaistat[0].pituus, 1200) && near(kr.kaistat[1].pituus, 600), '1a: kaistat 3 × 400 = 1200 ja 2 × 300 = 600');
  ok(kr.rivit.length === 1 && near(kr.rivit[0].leveys, 1100) && near(kr.pituus, 1200), '1b: molemmat kaistat samalle riville (500 + 600 ≤ 1250), rullasta 1200');
  ok(kr.jaannokset.some(j => near(j.leveys, 600) && near(j.pituus, 600)) && kr.jaannokset.some(j => j.kaista === 'rivin reuna' && near(j.leveys, 150)), '1c: jäännökset: B-kaistan jatke 600 × 600 ja rivin reuna 150 × 1200');
  ok(near(kr.kaistaAla, 1200 * 500 + 600 * 600) && near(kr.hukkaAla, 1250 * 1200 - kr.kaistaAla), '1d: pinta-alat');
  const lomitus = M.laskeKaistat([{ nimi: 'A', kpl: 3, w: 400, h: 500, ring: nelio(400, 500) }], { tila: 'lomitus' });
  ok(lomitus.kaistat[0].tila === 'suora' && near(lomitus.kaistat[0].pituus, 1200), '1e: suorakaide ei lomitu (ei säästöä), pysyy suorana');
})();

// ---- 2) Puolisuunnikas lomitettuna: siirto = (ala + yla) / 2 eli kaksi kappaletta vievät ala + yla
(function () {
  const ring = [[0, 0], [400, 0], [300, 500], [100, 500]];   // ala 400, yla 200, tasakylkinen
  const kr = M.laskeKaistat([{ nimi: 'T', kpl: 2, w: 400, h: 500, ring }], { tila: 'lomitus', rulla: 1250 });
  const k = kr.kaistat[0];
  ok(k.tila === 'lomitus' && near(k.siirto, 300, 0.05), '2a: lomitussiirto 300 (saatu ' + k.siirto.toFixed(2) + ')');
  ok(near(k.pituus, 700, 0.05) && near(k.suoraPituus, 800), '2b: kaista 700 (suorana 800)');
  ok(k.leikkaukset.length === 1 && near(k.leikkaukset[0].ala, 400, 0.05) && near(k.leikkaukset[0].yla, 300, 0.05), '2c: viilto vino: alareunassa 400, yläreunassa 300');
  ok(k.paat.alku && k.paat.loppu, '2d: päiden leikkaukset (jätekolmiot irti)');
  ok(M.kaistaTila(0.5, 'auto') === 'lomitus' && M.kaistaTila(1.0, 'auto') === 'suora' && M.kaistaTila(1.0, 'lomitus') === 'lomitus', '2e: automaattinen asettelu paksuuden mukaan (raja 0,8 mm)');
})();

// ---- 3) pellitKappaleiksi: pelti-osan ääriviiva aihioPisteet-funktiosta
(function () {
  const OLETUS = { leveys: 400, suora: 600, etukork: 1000, takakork: 800, sauma: 20, huplis: 10, ylareunaV: 20, alatupla: 20, vahennys: 20,
    huptakalis: 5, saumatyyppi: 1, huppuEtuKpl: 1, huppuSivutKpl: 1, huppuTakaKpl: 1 };
  const palat = L.hupunPalat(OLETUS).palat;
  const etu = palat.find(p => p.nimi === 'Huppu etu'), p = L.levitaPala(etu).p;
  const kp = M.pellitKappaleiksi([Object.assign({}, p, { name: 'Huppu etu', kpl: 1 })])[0];
  ok(kp.nimi === 'Huppu etu' && kp.ring.length === PL.aihioPisteet(p).pisteet.length && near(kp.w, p.w), '3a: kappale pelti-osasta: nimi, ääriviiva ja leveys');

  // ---- 4) kaistaKappaleet: lapepiipun hupun palat (sivut peilikuvapari)
  const kk = L.kaistaKappaleet(palat, 2);
  const sivut = kk.filter(k => /^Huppu sivut/.test(k.nimi));
  ok(sivut.length === 1 && sivut[0].kpl === 4 && sivut[0].ringPeili, '4a: sivut (2 piippua = 4 kpl) yhtenä ryhmänä, mukana peilattu ääriviiva, koska sivu ei ole itse peilisymmetrinen');
  ok(near(sivut[0].ring.reduce((s, q) => s + q[0], 0), sivut[0].ringPeili.reduce((s, q) => s + sivut[0].w - q[0], 0), 1e-6), '4b: peilikuvan ääriviiva = alkuperäinen peilattuna (x → w − x)');
  const etuK = kk.find(k => k.nimi === 'Huppu etu');
  ok(etuK && etuK.kpl === 2 && kk.reduce((s, k) => s + k.kpl, 0) === palat.reduce((s, pa) => s + pa.kpl * 2, 0), '4c: kappalemäärä säilyy (piippujen määrällä kerrottuna)');
  const kr = M.laskeKaistat(kk, { tila: 'lomitus', rulla: 1250 });
  ok(kr.kaistat.length >= 3 && kr.pituus > 0 && !kr.kaistat.some(k => k.palat.some(pa => pa.ring.some(q => q[1] < -1e-6 || q[1] > k.h + 1e-6))), '4d: kaistat lasketaan, palat pysyvät kaistan sisällä');
  // peilikuvapari: samalla kaistalla vuorotellen, ei lomitusta (peilikuvaa ei saa kääntämällä)
  const ks = kr.kaistat.filter(k => k.nimi === 'Huppu sivut');
  const sp = [].concat.apply([], ks.map(k => k.palat));
  ok(ks.every(k => k.tila === 'suora') && sp.length === 4 && sp.map(pa => pa.peili).join() === 'false,true,false,true', '4e: sivut suorana, joka toinen peilikuva (' + sp.map(pa => pa.nimi).join(', ') + ')');
  ok(sp[1].nimi === 'Huppu sivut (peilikuva)' && near(sp[1].ring.reduce((s, q) => s + q[1], 0), sivut[0].ringPeili.reduce((s, q) => s + q[1], 0), 1e-6), '4f: peilikuvapalan nimi ja ääriviiva');

  // ---- 5) Symmetrinen pala pysyy yhtenä ryhmänä: etupala (peili-lippu keinotekoisesti)
  const yksi = L.kaistaKappaleet([Object.assign({}, etu, { peili: true, kpl: 2 })], 1);
  ok(yksi.length === 1 && yksi[0].kpl === 2, '5a: peilisymmetrinen pala (etu) pysyy yhtenä ryhmänä, vaikka peili-lippu on päällä');

  // ---- 6) Harjapiippu: palat levitetään tasona (levitaTaso), kaistaKappaleet käy niillekin
  const H = { tyyppi: 'harjapiippu', lev1: 390, lev2: null, suora1: 445, suora2: 750, kork1: 760, korkH: 550, kork2: 940, poimu: 20,
    ylit1V: 200, ylit1O: 200, ylit2V: 200, ylit2O: 200, k24_1: 200, j25_1: 20, k24_2: 200, j25_2: 20,
    tupla: 15, etulis: 40, nousu: 200, sivulisa: 50, sauma: 20, huplis: 10, ylareunaV: 35, alatupla: 20, vahennys: 25,
    hsivlisa: 5, hattulis: 250, sivutJako: 1, jakosauma: 20 };   // sama kuin test_harjakiila.js
  const ht = L.harjaHupunPalat(H);
  if (ht && ht.palat && ht.palat.length) {
    const hk = L.kaistaKappaleet(ht.palat, 1);
    ok(hk.length >= ht.palat.length && hk.every(k => k.ring.length >= 3 && k.w > 0 && k.h > 0), '6a: harjapiipun palat kaistakappaleiksi (' + hk.map(k => k.nimi + ' ' + k.kpl).join(', ') + ')');
  } else ok(false, '6a: harjapiipun palat puuttuvat (tarkista syötteet)');
})();

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
