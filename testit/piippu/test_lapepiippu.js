// Lapepiipun laskenta (orders/piippu-laskenta.js).
//
// 1) Vertailuluvut: lapepiippu_vertailu.json sisältää 25 piippua (oletusmitat + satunnaisia mittoja, kaikki osajaot,
//    saumatyypit ja osavalinnat) ja niiden peltilistat. Luvut tallennettiin vaiheessa 2 (20.11.2026) siirron yhteydessä,
//    kun uusi tiedosto oli todettu täsmälleen samaksi kuin vanha laskenta (piippu.html ja piippu_tuotanto.html,
//    20 000 mittayhdistelmää). Jos tämä osa hälyttää, laskenta on muuttunut: tarkista, oliko muutos tarkoituksellinen.
// 2) Käsin lasketut oletusmitat ja saumarakenteen säännöt (Tomin luonnokset 20.11.2026).
const { laskeLapepiippu } = require('../../orders/piippu-laskenta.js');
const vertailu = require('./lapepiippu_vertailu.json');

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else { console.log('ok  :', msg); } }
const osa = (lista, nimi) => lista.find(p => p.osa === nimi);
const summa = (lista, alku) => lista.filter(p => p.osa.startsWith(alku)).reduce((s, p) => s + p.lev, 0);

// ---- 1) Vertailuluvut
vertailu.forEach((t, i) => {
  const r = laskeLapepiippu(t.v, t.osat);
  ok(JSON.stringify(r.juuret) === JSON.stringify(t.juuret), 'vertailu ' + i + ': juuret samat (' + t.juuret.length + ' riviä)');
  ok(JSON.stringify(r.muut) === JSON.stringify(t.muut), 'vertailu ' + i + ': huppu, kansi ja hattu samat (' + t.muut.length + ' riviä)');
});

// ---- 2) Oletusmitat (Piippu-sivun oletusarvot), käsin laskettu
const OLETUS = { leveys: 400, suora: 600, etukork: 1000, takakork: 800, harjalle: 1050, vasen: 150, oikea: 100, poimu: 20, k24: 200, j25: 15,
  tupla: 15, etulis: 40, takalis: 10, nousu: 200, juurisauma: 20, sauma: 20, huplis: 10, ylareunaV: 20, alatupla: 20, vahennys: 20,
  huptakalis: 5, hattulis: 250, saumatyyppi: 1, takaKpl: 1, huppuEtuKpl: 1, huppuSivutKpl: 1, huppuTakaKpl: 1 };
const o = laskeLapepiippu(OLETUS);
// kaltevuuskorjaus = (huplis / 2) × (korkeusero / suora) = 5 × 200 / 600 = 1,67 (E2-korjaus 18.11.2026: ei käänteinen)
ok(Math.abs(o.geom.kaltkorj - 5 * 200 / 600) < 1e-9, 'oletus: kaltevuuskorjaus 5 × 200 / 600 = 1,67 mm');
ok(osa(o.muut, 'Huppu etu').lev === 450, 'oletus: huppu etu leveys 400 + 2 × 20 + 10 = 450');
ok(osa(o.muut, 'Huppu etu').pit === 1022, 'oletus: huppu etu korkeus 1000 + 20 + 20 + 1,67 − 20 = 1022');
ok(osa(o.muut, 'Huppu sivut').lev === 670 && osa(o.muut, 'Huppu sivut').kpl === 2, 'oletus: huppu sivut 600 + 3 × 20 + 10 = 670, 2 kpl');
ok(osa(o.muut, 'Huppu taka').lev === 495, 'oletus: huppu taka (sauma 1) 400 + 4 × 20 + 10 + 5 = 495');
ok(osa(o.muut, 'Huppu taka').pit === 818, 'oletus: huppu taka korkeus 800 + 20 + 20 − 1,67 − 20 = 818');
ok(osa(o.muut, 'Kansi').lev === 500 && osa(o.muut, 'Kansi').pit === 700, 'oletus: kansi 500 × 700 (+ 4 × 20 + 10 + 10)');
ok(osa(o.muut, 'Hattu').lev === 650 && osa(o.muut, 'Hattu').pit === 850, 'oletus: hattu 650 × 850 (+ 250)');
ok(osa(o.juuret, 'Juuri etu').lev === 440, 'oletus: juuri etu leveys 400 + 40 = 440');
ok(osa(o.juuret, 'Juuri etu').pit === 450, 'oletus: juuri etu pituus 15 + 200 + 15 + (200 + 20) = 450');
ok(osa(o.juuret, 'Juuri taka').lev === 730, 'oletus: juuri taka leveys 150 + 100 + 400 + 2 × 15 + 2 × 20 + 10 = 730');
ok(o.geom.q9 === 220, 'oletus: juuri takaa piipulle (hupun kanssa) = nousu + 20 = 220');
ok(o.geom.etukulma === 72 && o.geom.takakulma === 108, 'oletus: etukulma 72°, takakulma 108°');

// ---- 3) Saumarakenne (kohta 8): jaetun kappaleen liitokseen 20 + 40 = 60 mm eli 3 × sauma
// Mitat jaollisia kahdella ja kolmella, ettei palojen pyöristys sotke summia (400 / 3 = 133,3 pyöristyy).
const JAOLLINEN = Object.assign({}, OLETUS, { leveys: 420, suora: 600, huplis: 12, huptakalis: 6 });
[1, 2].forEach(st => {
  const yksi = laskeLapepiippu(Object.assign({}, JAOLLINEN, { saumatyyppi: st }));
  const kaksi = laskeLapepiippu(Object.assign({}, JAOLLINEN, { saumatyyppi: st, huppuSivutKpl: 2, huppuEtuKpl: 2, huppuTakaKpl: 2 }));
  const kolme = laskeLapepiippu(Object.assign({}, JAOLLINEN, { saumatyyppi: st, huppuSivutKpl: 3, huppuEtuKpl: 3, huppuTakaKpl: 3 }));
  ['Huppu sivut', 'Huppu etu', 'Huppu taka'].forEach(nimi => {
    const koko = summa(yksi.muut, nimi);
    ok(summa(kaksi.muut, nimi) - koko === 60, 'sauma ' + st + ': ' + nimi + ' 2 osaa: liitokseen 60 mm lisää');
    ok(summa(kolme.muut, nimi) - koko === 120, 'sauma ' + st + ': ' + nimi + ' 3 osaa: kahteen liitokseen 120 mm lisää');
  });
});
const s2 = laskeLapepiippu(Object.assign({}, OLETUS, { saumatyyppi: 2, huppuSivutKpl: 2 }));
ok(osa(s2.muut, 'Huppu sivut 2').lev - osa(s2.muut, 'Huppu sivut 1').lev === 20, 'sauma 2, sivut 2 osaa: takimmainen pala saa sen 40:n (yksi sauma enemmän)');
ok(!osa(s2.muut, 'Huppu sivut'), 'sauma 2, sivut 2 osaa: ei jakamatonta sivua listalla');
// Lapepiipun sauma 2: etu ja taka ovat samanlaiset (20 + 20), sivuissa 40 + 40
const s2y = laskeLapepiippu(Object.assign({}, OLETUS, { saumatyyppi: 2 }));
ok(osa(s2y.muut, 'Huppu taka').lev === osa(s2y.muut, 'Huppu etu').lev, 'sauma 2: huppu taka = huppu etu (20 + 20)');
ok(osa(s2y.muut, 'Huppu sivut').lev === 600 + 4 * 20 + 10 + 5, 'sauma 2: sivut 600 + 4 × 20 + 10 + 5 = 695');

// ---- 4) Osavalinnat ja Tuotannon oletus
const kaikki = laskeLapepiippu(OLETUS);
ok(osa(kaikki.muut, 'Kansi') && osa(kaikki.muut, 'Hattu') && kaikki.juuret.length === 4, 'ilman osavalintoja lasketaan kaikki osat (Tuotanto)');
const ilmanHuppua = laskeLapepiippu(OLETUS, { huppu: false });
ok(!ilmanHuppua.muut.some(p => p.osa.startsWith('Huppu')), 'huppu pois: ei hupun paloja');
ok(Math.abs(ilmanHuppua.geom.q9 - ilmanHuppua.geom.p10) < 1e-12, 'huppu pois: juuri takaa piipulle = nousun vaakakomponentti (p10)');
const pelkkaHattu = laskeLapepiippu(OLETUS, { juuret: false, huppu: false, kansi: false });
ok(pelkkaHattu.juuret.length === 0 && pelkkaHattu.muut.length === 1 && pelkkaHattu.muut[0].osa === 'Hattu', 'vain hattu valittuna: yksi rivi');
const tyhja = laskeLapepiippu(null);
ok(Array.isArray(tyhja.juuret) && Array.isArray(tyhja.muut), 'tyhjä syöte ei kaada laskentaa');
ok(JSON.stringify(laskeLapepiippu(Object.assign({}, OLETUS, { leveys: '400', suora: '600' }))) === JSON.stringify(o), 'mitat tekstinä ("400") antavat saman tuloksen kuin numeroina');

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
