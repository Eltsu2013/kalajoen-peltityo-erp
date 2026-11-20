// test_kaista.js — kaistat rullasta, lomitus ja giljotiiniviillot (v13, 21.10.2026)
// Sääntö: saman ryhmän kappaleet lomitetaan (joka toinen käännetty 180°) niin, että ne erottuu yhdellä suoralla
// viillolla kaistan läpi. Tarkistetaan käsin lasketuilla arvoilla ja riippumattomilla ominaisuustesteillä.
const fs = require('fs');
const { html, script } = require('./lataa')();   // yhteiset tiedostot + Huuva-mockupin skripti
const testCode = `
let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
function near(a, b, t, m) { ok(Math.abs(a-b) <= t, m + ' (saatu ' + (typeof a==='number'?a.toFixed(3):a) + ', odotettu ' + b + ')'); }
const all = t => ({ Etu:t, Oikea:t, Taka:t, Vasen:t });
const on4 = { Etu:true, Oikea:true, Taka:true, Vasen:true };
function sisalla(q, pl) {
  let c = false;
  for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) {
    const a = pl[i], b = pl[j];
    if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0]-a[0]) * (q[1]-a[1]) / (b[1]-a[1]) + a[0]) c = !c;
  }
  return c;
}

// ---------- 1. kuperaKuori ja kuoriErotus: pienet käsin laskettavat tapaukset
(function () {
  const k = kuperaKuori([[0,0],[10,0],[10,10],[0,10],[5,5],[5,0]]);
  ok(k.length === 4, '1a: kuoressa vain 4 kulmaa (sisäpiste ja suora välipiste pois)');
  const A = [[0,0],[10,0],[10,10],[0,10]], B = A.map(q => [q[0] + 15, q[1]]);
  const e = kuoriErotus(A, B);
  near(e.gap, 5, 1e-9, '1b: neliöiden välinen rako 5');
  near(e.X * 12.5 + e.Y * 0, e.c, 1e-9, '1b: erottava suora keskellä (x = 12,5)');
  const C = A.map(q => [q[0] + 4, q[1]]);
  ok(kuoriErotus(A, C).gap < 0, '1c: päällekkäiset antavat negatiivisen raon');
})();

// ---------- 2. lomitusSiirto: käsin laskettavat muodot
(function () {
  // suunnikas (0,0),(10,0),(14,10),(4,10): kierrettynä sama muoto -> vinot sivut samalla suoralla kun s = 10
  const par = [[0,0],[10,0],[14,10],[4,10]];
  const r = lomitusSiirto(par, 14, 10, 0);
  near(r.s, 10, 0.02, '2a: suunnikkaan lomitussiirto 10');
  near(r.c / r.X, 10, 0.05, '2a: viilto alareunassa x = 10');
  near((r.c - r.Y * 10) / r.X, 14, 0.05, '2a: viilto yläreunassa x = 14');
  // suorakulmio: lomituksesta ei hyötyä
  ok(lomitusSiirto([[0,0],[10,0],[10,5],[0,5]], 10, 5, 0) === null, '2b: suorakulmiolla ei lomitusta (siirto = leveys)');
  // rako 3 mm vaakasuunnassa kasvattaa siirtoa 3 / cos(kulma): suunnikkaan reuna (10,0)-(14,10), normaalin vaakakomponentti = 10/sqrt(116)
  const r3 = lomitusSiirto(par, 14, 10, 3);
  near(r3.s, 10 + 3 * Math.sqrt(116) / 10, 0.02, '2c: 3 mm rako kasvattaa siirtoa 3 / cos(kulma)');
  // viilto kulkee parin symmetriakeskipisteen (w/2 + s/2, h/2) kautta -> ketjun viillot ovat samalla etäisyydellä
  const epasym = [[0,0],[12,0],[12,3],[9,10],[2,10],[0,6]];
  const re = lomitusSiirto(epasym, 12, 10, 0);
  near(re.X * (6 + re.s / 2) + re.Y * 5, re.c, 1e-6, '2d: epäsymmetrisellä kappaleella viilto kulkee parin keskipisteen kautta');
})();

// ---------- 3. jaaRiveihin: käsin lasketut jaot
(function () {
  const ks = a => a.map(q => ({ h: q[0], pituus: q[1] }));
  const sum = (kk, r) => r.reduce((s, row) => s + Math.max.apply(null, row.map(i => kk[i].pituus)), 0);
  let kk = ks([[600, 1500], [600, 900], [700, 1000]]);
  let r = jaaRiveihin(kk, 1250);
  near(sum(kk, r), 2500, 1e-9, '3a: 600+600 samalle riville (1500) + 700 omalle (1000) = 2500');
  kk = ks([[400, 1000], [400, 1000], [400, 1000]]);
  r = jaaRiveihin(kk, 1250);
  ok(r.length === 1 && r[0].length === 3, '3b: kolme 400 mm kaistaa mahtuu yhdelle riville (1200 <= 1250)');
  kk = ks([[800, 500], [800, 500]]);
  r = jaaRiveihin(kk, 1250);
  ok(r.length === 2, '3c: kaksi 800 mm kaistaa ei mahdu rinnakkain');
  kk = ks([[500, 2000], [500, 300], [500, 300], [250, 1500]]);
  r = jaaRiveihin(kk, 1250);
    ok(r.reduce((s, row) => s + row.length, 0) === 4 && new Set([].concat.apply([], r)).size === 4, '3d: kaikki 4 kaistaa mukana kerran');
  near(sum(kk, r), 2300, 1e-9, '3d: rivi 1: 500 (2000) + 500 (300) + 250 (1500) = 1250 -> 2000, rivi 2: 500 (300) -> 300, yhteensä 2300');
})();

// ---------- 4. kaistaTila
(function () {
  ok(kaistaTila(0.5, 'auto') === 'lomitus' && kaistaTila(0.8, 'auto') === 'lomitus', '4a: 0,5 ja 0,8 mm -> lomitus');
  ok(kaistaTila(0.9, 'auto') === 'suora' && kaistaTila(1.5, 'auto') === 'suora', '4a: 0,9 ja 1,5 mm -> suora');
  ok(kaistaTila(1.5, 'lomitus') === 'lomitus' && kaistaTila(0.5, 'suora') === 'suora', '4b: käsin valinta ohittaa paksuuden');
})();

// ---------- 5. Esimerkkihuuva: käsin lasketut kaistamitat
const sA = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
const side = { Etu:{L:0,R:0}, Oikea:{L:20,R:20}, Taka:{L:0,R:0}, Vasen:{L:20,R:20} };
const lisa0 = { Etu:0, Oikea:0, Taka:0, Vasen:0 };
const bKouru = { type: all('kouru'), floor:30, rise:20, hem:15, inW:20, inHem:10, d1:15, d2:15, lisa:lisa0, loveus:true };
const oA = { panelOn: on4, sideW: side, sideDir: {}, top: { type: all('sisaan'), w: 20, loveus: true }, bottom: bKouru };
const rA = ryhmitteleSamat(laskeKaikki(sA, oA));
(function () {
  const kr = laskeKaistat(rA, { tila: 'lomitus', rulla: 1250 });
  const e = kr.kaistat[0];
  // Etu: aihio 860 x 600,388. Oikea oikea reuna kulkee (860,35)-(630,580,388); kierretty kappale samaan suuntaan.
  const h = e.h, k = 230 / (580.388 - 35);
  near(h, 600.388, 0.001, '5a: Etu+Taka kaistan leveys = aihion korkeus');
  near(e.siirto, 860 - (h - 70) * k, 0.05, '5a: Etu+Taka lomitussiirto (käsin: 860 - 530,388 * 230/545,388 = 636,3)');
  near(e.pituus, 860 + e.siirto, 1e-9, '5a: kaistan pituus = aihio + siirto');
  near(e.leikkaukset[0].ala, 860 + 35 * k, 0.05, '5a: viilto alareunassa 874,8');
  near(e.leikkaukset[0].yla, 860 - (h - 35) * k, 0.05, '5a: viilto yläreunassa 621,6');
  ok(e.tila === 'lomitus' && e.palat.length === 2 && !e.palat[0].kierto && e.palat[1].kierto, '5a: kaksi kappaletta, jälkimmäinen käännetty');
  ok(e.palat[0].nimi === 'Etu' && e.palat[1].nimi === 'Taka', '5a: kappaleiden nimet Etu, Taka');
  const o2 = kr.kaistat[1];
  near(o2.siirto, 429.13, 0.05, '5b: Oikea+Vasen lomitussiirto 429,1 (kuvan mukainen, Tomi hyväksyi)');
  near(o2.pituus, 560 + o2.siirto, 1e-9, '5b: pituus 989');
  ok(kr.rivit.length === 1 && kr.rivit[0].kaistat.length === 2, '5c: molemmat kaistat samalle riville (601 + 624 <= 1250)');
  near(kr.pituus, e.pituus, 1e-9, '5c: rullasta menee pidemmän kaistan pituus');
  near(kr.kulutusAla, 1250 * e.pituus, 1e-3, '5c: kulutusala = rullan leveys x pituus');
  near(kr.kaistaAla + kr.hukkaAla, kr.kulutusAla, 1e-3, '5c: kaistat + hukka = kulutus');
  ok(kr.jaannokset.some(j => j.kaista === 'Oikea + Vasen' && Math.abs(j.pituus - (e.pituus - o2.pituus)) < 1e-6), '5c: lyhyemmän kaistan viereinen jäännös raportoidaan');
  const su = laskeKaistat(rA, { tila: 'suora', rulla: 1250 });
  near(su.kaistat[0].pituus, 1720, 1e-9, '5d: suorana Etu+Taka 2 x 860 = 1720');
  near(su.kaistat[1].pituus, 1120, 1e-9, '5d: suorana Oikea+Vasen 2 x 560 = 1120');
  ok(su.kaistat[0].leikkaukset.length === 1 && Math.abs(su.kaistat[0].leikkaukset[0].ala - 860) < 1e-9 && Math.abs(su.kaistat[0].leikkaukset[0].yla - 860) < 1e-9, '5d: suorana pystyviilto x = 860');
  ok(su.kaistat.every(q => q.tila === 'suora' && q.palat.every(pa => !pa.kierto)), '5d: suorassa tilassa ei käännettyjä kappaleita');
  const kapea = laskeKaistat(rA, { tila: 'lomitus', rulla: 1000 });
  ok(kapea.rivit.length === 2, '5e: 1000 mm rullalle kaistat eivät mahdu rinnakkain (601 + 624 > 1000) -> kaksi riviä');
  near(kapea.pituus, kapea.kaistat[0].pituus + kapea.kaistat[1].pituus, 1e-9, '5e: rullapituus = kaistojen pituuksien summa');
  const liianLeveä = laskeKaistat(rA, { tila: 'suora', rulla: 500 });
  ok(liianLeveä.varoitukset.length === 2, '5f: varoitus jokaisesta kaistasta joka on rullaa leveämpi');
  const yksi = laskeKaistat([rA[0]], { tila: 'lomitus' });
  near(yksi.rulla, 1250, 1e-9, '5g: oletusrulla 1250 mm');
  const y1 = laskeKaistat([Object.assign({}, rA[0], { kpl: 1, names: ['Etu'], name: 'Etu' })], { tila: 'lomitus' });
  ok(y1.kaistat[0].tila === 'suora' && Math.abs(y1.kaistat[0].pituus - 860) < 1e-9 && y1.kaistat[0].leikkaukset.length === 0, '5h: yksittäinen kappale ei lomitu, ei viiltoja');
})();

// ---------- 6. Ominaisuudet useille huuville: viilto erottaa kappaleet, mikään ei mene päällekkäin
function ominaisuudet(nimi, s, o) {
  const panels = ryhmitteleSamat(laskeKaikki(s, o));
  const kr = laskeKaistat(panels, { tila: 'lomitus', rulla: 1250 });
  kr.kaistat.forEach((k, ki) => {
    const t = nimi + ' / ' + k.nimi;
    let lkm = 0;
    // 1) kappaleet kaistan sisällä
    let sisassa = true;
    k.palat.forEach(pa => pa.ring.forEach(q => { if (q[0] < -1e-6 || q[0] > k.pituus + 1e-6 || q[1] < -1e-6 || q[1] > k.h + 1e-6) sisassa = false; }));
    ok(sisassa, t + ': kaikki kappaleet kaistan sisällä');
    // päiden leikkaukset: kaikki kappaleet alkuleikkauksen oikealla ja loppuleikkauksen vasemmalla puolella
    if (k.tila === 'lomitus') {
      let paaOk = !!(k.paat.alku && k.paat.loppu);
      ['alku', 'loppu'].forEach(nm => {
        const pa = k.paat[nm];
        if (!pa) return;
        const dx = pa.p2[0] - pa.p1[0], dy = pa.p2[1] - pa.p1[1], l = Math.hypot(dx, dy);
        // suoran päät kaistan reunalla
        [pa.p1, pa.p2].forEach(q => { const reunalla = Math.abs(q[0]) < 1e-6 || Math.abs(q[0] - k.pituus) < 1e-6 || Math.abs(q[1]) < 1e-6 || Math.abs(q[1] - k.h) < 1e-6; if (!reunalla) paaOk = false; });
        k.palat.forEach(pa2 => pa2.ring.forEach(q => {
          const v = (dx * (q[1] - pa.p1[1]) - dy * (q[0] - pa.p1[0])) / l;   // > 0: suoran vasemmalla puolella (kuljettaessa p1 -> p2)
          const sivu = (pa.p2[1] > pa.p1[1] ? 1 : -1) * v;   // suunta ylöspäin: vasen puoli = pienempi x
          if (nm === 'alku' && sivu > 1e-6) paaOk = false;
          if (nm === 'loppu' && sivu < -1e-6) paaOk = false;
        }));
      });
      ok(paaOk, t + ': alku- ja loppupään leikkaus kulkevat kaistan reunalta reunalle, kaikki kappaleet niiden välissä');
    }
    // 2) jokainen viilto: edelliset kappaleet vasemmalla, seuraavat oikealla (viivan sivu)
    let erottuu = true;
    k.leikkaukset.forEach((lk, i) => {
      const puoli = q => (lk.yla - lk.ala) * (q[1] - 0) - k.h * (q[0] - lk.ala);   // < 0: viivan oikealla puolella (x isompi)
      k.palat.forEach((pa, j) => pa.ring.forEach(q => {
        const v = puoli(q) / Math.hypot(lk.yla - lk.ala, k.h);   // etäisyys mm, merkki: positiivinen = vasemmalla
        if (j <= i && v < -1e-6) erottuu = false;
        if (j > i && v > 1e-6) erottuu = false;
      }));
    });
    ok(erottuu, t + ': ' + k.leikkaukset.length + ' viiltoa erottaa kappaleet puhtaasti (yksi suora per väli)');
    // 3) ei päällekkäisyyttä: ruudukkonäyte
    let paallekkain = 0;
    for (let x = 0.3; x < k.pituus; x += 5.3) for (let y = 0.4; y < k.h; y += 5.3) {
      let n = 0; k.palat.forEach(pa => { if (sisalla([x, y], pa.ring)) n++; });
      if (n > 1) paallekkain++;
      lkm++;
    }
    ok(paallekkain === 0, t + ': kappaleet eivät mene päällekkäin (' + lkm + ' näytettä)');
    // 4) lomitus todella säästää tai on suora
    ok(k.pituus <= k.suoraPituus + 1e-9, t + ': kaista ei ole suoraa pidempi (' + Math.round(k.pituus) + ' <= ' + Math.round(k.suoraPituus) + ')');
    // 5) vähimmäissiirto: 2 mm pienempi siirto ei enää erota (kupera kuori menee päällekkäin) -> käsin ei voi lomittaa tiukemmin
    if (k.tila === 'lomitus') {
      const a = k.palat[0].ring, b = k.palat[1].ring.map(q => [q[0] - 2, q[1]]);
      const ka = kuperaKuori(a), kb = kuperaKuori(b);
      let osuma = false;
      for (let x = 0.2; x < k.pituus && !osuma; x += 0.9) for (let y = 0.2; y < k.h; y += 0.9) if (sisalla([x, y], ka) && sisalla([x, y], kb)) { osuma = true; break; }
      ok(osuma, t + ': 2 mm pienemmällä siirrolla kuoret menisivät päällekkäin (siirto on pienin mahdollinen)');
    }
  });
  const sumaLeveys = kr.rivit.every(r => r.leveys <= 1250 + 1e-9);
  ok(sumaLeveys, nimi + ': kaikki rivit mahtuvat rullalle');
  ok(kr.kulutusAla + 1e-6 >= kr.kaistaAla, nimi + ': kulutus >= kaistojen ala');
  return kr;
}
function mk(botType, topType, opts2) {
  opts2 = opts2 || {};
  return { panelOn: opts2.panelOn || on4, sideW: opts2.sideW || side, sideDir: opts2.sideDir || {},
    top: { type: all(topType), w: opts2.topW === undefined ? 20 : opts2.topW, loveus: opts2.loveus !== false },
    bottom: Object.assign({}, bKouru, { type: all(botType) }, opts2.bottom || {}) };
}
['kouru', 'sisaan', 'tuplat', 'ei'].forEach(b => ['sisaan', 'ylos', 'ei'].forEach(t => ominaisuudet('keskitetty ' + b + '/' + t, sA, mk(b, t))));
ominaisuudet('epäkeskoinen', { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:60, dy:40 }, mk('kouru', 'sisaan'));
ominaisuudet('levenevä', { Wb:400, Db:250, Wt:800, Dt:500, H:500, dx:0, dy:0 }, mk('kouru', 'sisaan'));
ominaisuudet('leveät taitokset', sA, mk('kouru', 'sisaan', { sideW: { Etu:{L:40,R:40}, Oikea:{L:80,R:80}, Taka:{L:40,R:40}, Vasen:{L:80,R:80} }, topW: 60, bottom: { floor:60, rise:50, hem:30 } }));
// neliöhuuva: kaikki neljä paneelia samanlaisia -> yksi ryhmä, 4 kpl, ketju (A, B, A, B)
(function () {
  const sN = { Wb:600, Db:600, Wt:300, Dt:300, H:400, dx:0, dy:0 };
  const sideN = { Etu:{L:20,R:20}, Oikea:{L:20,R:20}, Taka:{L:20,R:20}, Vasen:{L:20,R:20} };
  const kr = ominaisuudet('neliöhuuva 4 kpl', sN, mk('kouru', 'sisaan', { sideW: sideN }));
  const k = kr.kaistat[0];
  ok(k.kpl === 4 && kr.kaistat.length === 1, '6n: neliöhuuvassa yksi ryhmä 4 kpl');
  near(k.pituus, k.palat[3].dx + k.w, 1e-9, '6n: ketjun pituus = viimeisen kappaleen paikka + aihio');
  near(k.palat[3].dx, 2 * k.siirto + k.siirto2, 1e-6, '6n: paikat: A -> B siirto sAB, B -> A siirto sBA');
  ok(k.leikkaukset.length === 3, '6n: kolme viiltoa');
  ok(k.palat.map(pa => pa.kierto).join() === 'false,true,false,true', '6n: kappaleet vuorotellen käännettynä');
})();

// epäsymmetrinen kappale ketjuna (4 kpl): viilto erottaa jokaisen välin, vaikka sAB != sBA
(function () {
  const orig = aihioPisteet;
  const ring = [[0,0],[10,0],[13,10],[5,10]];
  aihioPisteet = () => ({ pisteet: ring.map((q, i) => ({ n: i + 1, x: q[0], y: q[1] })), silmukoita: 1 });
  const kr = laskeKaistat([{ name: 'X', names: ['X1', 'X2', 'X3', 'X4'], kpl: 4, w: 13, h: 10 }], { tila: 'lomitus', rulla: 1250 });
  aihioPisteet = orig;
  const k = kr.kaistat[0];
  ok(k.tila === 'lomitus' && Math.abs(k.siirto - k.siirto2) > 0.1, '6m: epäsymmetrisellä kappaleella sAB != sBA (' + k.siirto.toFixed(2) + ' / ' + k.siirto2.toFixed(2) + ')');
  let erottuu = true, paallekkain = 0;
  k.leikkaukset.forEach((lk, i) => k.palat.forEach((pa, j) => pa.ring.forEach(q => {
    const v = ((lk.yla - lk.ala) * q[1] - k.h * (q[0] - lk.ala)) / Math.hypot(lk.yla - lk.ala, k.h);
    if ((j <= i && v < -1e-6) || (j > i && v > 1e-6)) erottuu = false;
  })));
  for (let x = 0.05; x < k.pituus; x += 0.1) for (let y = 0.05; y < k.h; y += 0.1) { let n = 0; k.palat.forEach(pa => { if (sisalla([x, y], pa.ring)) n++; }); if (n > 1) paallekkain++; }
  ok(erottuu, '6m: 3 viiltoa erottaa neljän epäsymmetrisen kappaleen ketjun');
  ok(paallekkain === 0, '6m: ketjun kappaleet eivät mene päällekkäin');
})();

// ---------- 7. Piirto, taulukko ja työkortti
(function () {
  const kr = laskeKaistat(rA, { tila: 'lomitus', rulla: 1250 });
  const svg = kaistaSvgSisalto(kr.kaistat[0], 560, 220, TEEMA_PAPERI_KAISTA);
  ok(svg.indexOf('NaN') < 0 && svg.indexOf('undefined') < 0, '7a: kaistakuvassa ei NaN / undefined');
  ok(svg.indexOf('1: 875') >= 0 && svg.indexOf('1: 622') >= 0, '7a: viillon mitat 875 (alareuna) ja 622 (yläreuna) kuvassa');
  ok(svg.indexOf('Taka ⟲180°') >= 0, '7a: käännetty kappale merkitty');
  ok(svg.indexOf('1497 × 600') >= 0, '7a: kaistan mitat 1497 × 600 kuvassa');
  const tbl = kaistaLeikkausTaulu(kr.kaistat[0], 'x');
  ok(tbl.indexOf('<td>875</td><td>622</td>') >= 0, '7b: viiltotaulukossa 875 / 622');
  ok(kaistaLeikkausTaulu(laskeKaistat(rA, { tila: 'suora' }).kaistat[0], 'x').indexOf('<td>860</td><td>860</td>') >= 0, '7b: suorassa 860 / 860');
  const yht = kaistaYhteenveto(kr, 'x');
  ok(yht.indexOf('Rullasta menee 1497 mm') >= 0, '7c: yhteenvedossa rullasta menee 1497 mm');
  ok(yht.indexOf('NaN') < 0, '7c: yhteenvedossa ei NaN');
  ok(kaistaOtsikko(kr.kaistat[0], 1).indexOf('lomitettuna, suorana 1720 mm') >= 0, '7d: otsikossa suora vertailu 1720 mm');
  // näyttö ruudulla (feikki-DOM: kentät tyhjiä -> oletuspaksuus 0,6 -> lomitus)
  const k2 = paivitaKaistat(rA);
  ok(k2 && k2.tila === 'lomitus', '7e: ruutupäivitys käyttää oletuksena lomitusta (0,6 mm)');
  ok(paivitaKaistat([]) === null, '7e: tyhjällä listalla ei kaistoja');
  // työkortti
  const s2 = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
  const ilman = rakennaTyokortit(s2, rA, 'T', 'V', { pisteet: true });
  const kanssa = rakennaTyokortit(s2, rA, 'T', 'V', { pisteet: true, kaista: { paksuus: 0.6, rulla: 1250, tila: 'lomitus' } });
  ok(ilman.indexOf('tk-kaista') < 0, '7f: ilman valintaa ei kaistasivua');
  ok((kanssa.match(/class="tk-page tk-kaista"/g) || []).length === 1, '7f: valinnalla yksi kaistasivu');
  ok((kanssa.match(/class="tk-page"/g) || []).length === 5, '7f: muut sivut ennallaan (yhteenveto + 2 x (kortti + merkintäsivu))');
  ok(kanssa.indexOf('Rullan menekki') >= 0 && kanssa.indexOf('<td>875</td><td>622</td>') >= 0, '7f: kaistasivulla viiltomitat ja rullan menekki');
  ok(kanssa.indexOf('NaN') < 0, '7f: työkortissa ei NaN');
  const suora = rakennaTyokortit(s2, rA, 'T', 'V', { kaista: { paksuus: 1.5, rulla: 1250, tila: 'suora' } });
  ok(suora.indexOf('asettelu: <b>suora</b>') >= 0 && suora.indexOf('1,5 mm') >= 0, '7g: suora asettelu ja paksuus 1,5 mm näkyvät kortissa');
})();

// ---------- 8. Huuvien kappalemäärä ja kaistojen jako (v14)
(function () {
  const sum = a => a.reduce((x, y) => x + y, 0);
  ok(JSON.stringify(jaaKaistoihin(10, 7, 0)) === '[5,5]', '8a: 10 kpl, kapasiteetti 7 -> tasaisesti [5,5]');
  ok(JSON.stringify(jaaKaistoihin(7, 7, 0)) === '[7]', '8a: 7 kpl mahtuu yhdelle');
  ok(JSON.stringify(jaaKaistoihin(7, 3, 0)) === '[3,2,2]', '8a: 7 kpl, kapasiteetti 3 -> [3,2,2]');
  ok(JSON.stringify(jaaKaistoihin(10, 7, 4)) === '[4,4,2]', '8a: valinta 4 kpl kaistalle -> [4,4,2]');
  ok(JSON.stringify(jaaKaistoihin(3, 5, 9)) === '[3]', '8a: valinta kapasiteettia suurempi rajataan');
  // kerroHuuvat
  const x3 = kerroHuuvat(rA, 3);
  ok(x3[0].kpl === 6 && x3[1].kpl === 6 && x3[0].names.join() === 'Etu,Taka,Etu,Taka,Etu,Taka', '8b: 3 huuvaa -> Etu + Taka 6 kpl, nimet toistuvat');
  ok(kerroHuuvat(rA, 1) === rA && kerroHuuvat(rA, 0) === rA && kerroHuuvat(rA, NaN) === rA, '8b: 1, 0 ja virheellinen määrä jättävät ennalleen');
  ok(rA[0].kpl === 2, '8b: alkuperäinen lista ei muutu');
  // 2 huuvaa: yksi kaista 4 kpl, pituus 860 + 3 x 636,33
  const r2 = laskeKaistat(kerroHuuvat(rA, 2), { tila: 'lomitus', rulla: 1250 });
  ok(r2.kaistat.length === 2 && r2.kaistat[0].kpl === 4, '8c: 2 huuvaa -> Etu + Taka 4 kpl yhdellä kaistalla');
  near(r2.kaistat[0].pituus, 860 + 3 * 636.33, 0.2, '8c: kaistan pituus 2769 mm (käsin: 860 + 3 x 636,3)');
    // 5 huuvaa: 10 kappaletta -> kaksi kaistaa 5 + 5
  const r5 = laskeKaistat(kerroHuuvat(rA, 5), { tila: 'lomitus', rulla: 1250 });
  near(r5.ryhmat[0].kapasiteetti, 7, 0, '8d: kapasiteetti 5000 mm:llä on 7 kpl (860 + 6 x 636,3 = 4678 <= 5000 < 5314)');
  const e5 = r5.kaistat.filter(k => k.nimi === 'Etu + Taka');
  ok(e5.length === 2 && e5[0].kpl === 5 && e5[1].kpl === 5 && e5[0].osa === 1 && e5[1].osa === 2 && e5[0].osia === 2, '8d: 5 huuvaa -> Etu + Taka kaksi kaistaa 5 + 5, osa 1/2 ja 2/2');
  near(e5[0].pituus, 860 + 4 * 636.33, 0.2, '8d: kaistan pituus 3405');
  ok(e5[0].palat.map(q => q.nimi).join() === 'Etu,Taka,Etu,Taka,Etu' && e5[1].palat.map(q => q.nimi).join() === 'Taka,Etu,Taka,Etu,Taka', '8d: nimet jatkuvat kaistalta toiselle (Etu, Taka, ... )');
  ok(e5[1].palat.map(q => q.kierto).join() === 'false,true,false,true,false', '8d: käännöt alkavat jokaisella kaistalla alusta');
  ok(sum(r5.kaistat.map(k => k.kpl)) === 10 + 10, '8d: kaikki kappaleet mukana (Etu + Taka 10 + Oikea + Vasen 10)');
  // käyttäjän valinta ja rajat
  const rv = laskeKaistat(kerroHuuvat(rA, 5), { tila: 'lomitus', rulla: 1250, kplKaistalle: { 'Etu + Taka': 4 } });
  ok(rv.kaistat.filter(k => k.nimi === 'Etu + Taka').map(k => k.kpl).join() === '4,4,2' && rv.ryhmat[0].valinta === 4, '8e: valinta 4 kpl kaistalle -> kaistat 4, 4, 2');
  const rr = laskeKaistat(kerroHuuvat(rA, 5), { tila: 'lomitus', rulla: 1250, maxPit: 3000 });
  ok(rr.ryhmat[0].kapasiteetti === 4 && rr.kaistat.filter(k => k.nimi === 'Etu + Taka').map(k => k.kpl).join() === '4,3,3', '8e: enimmäispituus 3000 mm -> kapasiteetti 4 (860 + 3 x 636,3 = 2769), jako 4 + 3 + 3');
  const ra = laskeKaistat(kerroHuuvat(rA, 5), { tila: 'lomitus', rulla: 1250, maxPit: 0 });
  ok(ra.kaistat.filter(k => k.nimi === 'Etu + Taka').length === 1 && ra.kaistat[0].kpl === 10, '8e: maxPit 0 = ei rajaa, yksi kaista 10 kpl');
  // suora tila: 5 kpl mahtuu 5000:een (4300), 6 kpl ei -> 3 + 3
  const rs = laskeKaistat(kerroHuuvat(rA, 3), { tila: 'suora', rulla: 1250 });
  ok(rs.ryhmat[0].kapasiteetti === 5 && rs.kaistat.filter(k => k.nimi === 'Etu + Taka').map(k => k.kpl).join() === '3,3', '8f: suorana kapasiteetti 5 (5 x 860 = 4300), 6 kpl -> 3 + 3');
  // jokainen jaettu kaista säilyttää viiltosäännön
  let hyva = true;
  r5.kaistat.forEach(k => k.leikkaukset.forEach((lk, i) => k.palat.forEach((pa, j) => pa.ring.forEach(q => {
    const v = ((lk.yla - lk.ala) * q[1] - k.h * (q[0] - lk.ala)) / Math.hypot(lk.yla - lk.ala, k.h);
    if ((j <= i && v < -1e-6) || (j > i && v > 1e-6)) hyva = false;
  }))));
  ok(hyva, '8g: jaetuilla kaistoilla jokainen viilto erottaa kappaleet puhtaasti');
  // rullan menekki: kaistat jaetaan riveihin ja kaikki mahtuvat
  ok(r5.rivit.every(r => r.leveys <= 1250 + 1e-9) && sum(r5.rivit.map(r => r.kaistat.length)) === r5.kaistat.length, '8h: kaikki kaistat sijoitettu riveille');
  // otsikko, valintakenttä, työkortti
  ok(kaistaOtsikko(e5[1], 2).indexOf('(osa 2/2)') >= 0, '8i: otsikossa osa 2/2');
  const kv = kaistaValinta(r5.ryhmat[0]);
  ok(kv.indexOf('tasainen jako (5 + 5)') >= 0 && kv.indexOf('<option value="7"') >= 0 && kv.indexOf('<option value="8"') < 0 && kv.indexOf('mahtuu 7') >= 0, '8i: valintakentässä tasainen jako ja 1...7 kpl');
  ok(kaistaValinta({ nimi: 'X', kpl: 1, kapasiteetti: 1, valinta: 0 }) === '', '8i: yhden kappaleen ryhmälle ei valintaa');
  const s2 = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
  const k3 = rakennaTyokortit(s2, kerroHuuvat(rA, 3), 'T', 'V', { huuvia: 3, kaista: { paksuus: 0.6, rulla: 1250, tila: 'lomitus', maxPit: 5000, kplKaistalle: {} } });
  ok(k3.indexOf('<th>Huuvia</th><td><b>3 kpl</b>') >= 0 && k3.indexOf('Etu + Taka') >= 0 && k3.indexOf('6 kpl') >= 0, '8j: yhteenvedossa Huuvia 3 kpl ja palamäärä 6 kpl');
  ok(rakennaTyokortit(s2, rA, 'T', 'V', { huuvia: 1 }).indexOf('<th>Huuvia</th>') < 0, '8j: yhdellä huuvalla ei Huuvia-riviä');
  ok(k3.indexOf('NaN') < 0, '8j: ei NaN');
  // ruutu: huuviaMaara feikki-DOMilla antaa 1
  ok(huuviaMaara() === 1, '8k: tyhjä kenttä = 1 huuva');
  const kr = paivitaKaistat(kerroHuuvat(rA, 2));
  ok(kr && kr.ryhmat.length === 2, '8k: ruutupäivitys toimii kerrotuilla paloilla');
})();

// ---------- 9. Kaistan päiden leikkaukset (alku / loppu), v14
(function () {
  const k = laskeKaistat(rA, { tila: 'lomitus', rulla: 1250 }).kaistat;
  const e = k[0], o = k[1];
  const kE = 230 / (580.388 - 35);
  // Etu (symmetrinen puolisuunnikas): alkuleikkaus kulkee kuoren reunaa (0,35) -> (230, 580,388) ja jatkuu yläreunaan
  near(e.paat.alku.paatyKorkeus, 35, 1e-6, '9a: Etu alku: leikkaus alkaa päätyreunasta 35 mm korkeudelta');
  near(e.paat.alku.yla, 230 + (e.h - 580.388) * kE, 0.01, '9a: Etu alku: yläreunassa 238,4 (käsin: 230 + 20 x 230/545,388)');
  ok(e.paat.alku.ala === null, '9a: Etu alku: ei alareunan pistettä (suora alkaa päädystä)');
  // loppu: kaksikappaleisessa kaistassa kaista on pisteen suhteen symmetrinen -> loppu = alun peilikuva 180°
  near(e.paat.loppu.ala, e.pituus - e.paat.alku.yla, 0.02, '9b: Etu loppu: alareunassa = pituus − alun yläreunan mitta');
  near(e.paat.loppu.paatyKorkeus, e.h - 35, 1e-6, '9b: Etu loppu: päätyreunassa korkeus = h − 35');
  // Oikea (vinoneliö-mäinen): alku (0,35) -> (137,27; 615,60), yläreunassa 139,1
  near(o.paat.alku.paatyKorkeus, 35, 1e-6, '9c: Oikea alku: päätyreunasta 35 mm');
  near(o.paat.alku.yla, 137.2728 + (o.h - 615.5988) * (137.2728 / (615.5988 - 35)), 0.01, '9c: Oikea alku: yläreunassa 139,1');
  near(o.paat.loppu.paatyKorkeus, o.h - 35, 1e-6, '9c: Oikea+Vasen loppu: päätyreunasta h − 35 = 588,5');
  near(o.paat.loppu.ala, o.pituus - o.paat.alku.yla, 0.02, '9c: Oikea+Vasen loppu: alareunassa = pituus − 139,1');
  // suora asettelu ei tee päiden leikkauksia, yksittäinen kappale ei myöskään
  const su = laskeKaistat(rA, { tila: 'suora' });
  ok(su.kaistat.every(q => !q.paat.alku && !q.paat.loppu), '9d: suorassa asettelussa ei päiden leikkauksia');
  const y1 = laskeKaistat([Object.assign({}, rA[0], { kpl: 1, names: ['Etu'], name: 'Etu' })], { tila: 'lomitus' });
  ok(!y1.kaistat[0].paat.alku, '9d: yhden kappaleen kaistalla ei päiden leikkauksia');
  // taulukko, kuva ja otsikot
  const tb = kaistaLeikkausTaulu(e, 'x');
  ok(tb.indexOf('<th>Leikkaus</th>') >= 0 && tb.indexOf('Viilto') < 0, '9e: taulukon otsikko on Leikkaus (ei Viilto)');
  ok(tb.indexOf('<td>Alku</td><td>päädyssä, 35 mm alareunasta</td><td>238</td>') >= 0, '9e: Alku-rivi: päädyssä, 35 mm alareunasta / yläreunassa 238');
  ok(tb.indexOf('<td>Loppu</td><td>') >= 0 && tb.indexOf('päädyssä, 565 mm alareunasta') >= 0, '9e: Loppu-rivi: päädyssä, 565 mm alareunasta');
  ok(tb.indexOf('<td>1</td><td>875</td><td>622</td>') >= 0, '9e: tavallinen leikkaus 1 ennallaan (875 / 622)');
  const sv = kaistaSvgSisalto(e, 560, 220, TEEMA_PAPERI_KAISTA);
  ok(sv.indexOf('alku: 238') >= 0 && sv.indexOf('↑35') >= 0 && sv.indexOf('↑565') >= 0 && sv.indexOf('NaN') < 0, '9f: kuvassa alku: 238, ↑35 ja ↑565');
  const kk = rakennaTyokortit({ Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 }, rA, 'T', 'V', { kaista: { paksuus: 0.6, rulla: 1250, tila: 'lomitus' } });
  ok(kk.indexOf('viilto') < 0 && kk.indexOf('Viilto') < 0 && kk.indexOf('Viillon') < 0, '9g: työkortin kaistasivulla ei sanaa viilto');
  ok(kk.indexOf('päädyssä, 35 mm alareunasta') >= 0, '9g: työkortin kaistasivulla päiden leikkaukset');
})();

// ---------- 10. Kappalesivut kaistalla: pellin muoto, asento ja nollakohta (v15)
(function () {
  const pl = kerroHuuvat(rA, 2);
  const kr = laskeKaistat(pl, { tila: 'lomitus', rulla: 1250 });
  const pEt = pl.find(q => q.name === 'Etu + Taka'), pOv = pl.find(q => q.name === 'Oikea + Vasen');
  const aE = palaAsennot(kr, pEt, false), aO = palaAsennot(kr, pOv, false);
  ok(aE.length === 4 && aO.length === 4, '10a: kummallakin ryhmällä neljä palaa kaistalla');
  ok(aE.map(r => r.kaista).join() === '1,1,1,1' && aO.map(r => r.kaista).join() === '2,2,2,2', '10a: kaistanumerot 1 (Etu + Taka) ja 2 (Oikea + Vasen)');
  ok(aO.map(r => r.kierto).join() === 'false,true,false,true', '10a: joka toinen pala käännetty');
  // käsin: vasen vino sivu (0,35)->(137,27; 615,60) osuu alareunaan 35 x 137,27 / 580,60 = 8,28 mm nollakohdan vasemmalle puolelle
  const kO = 35 * 137.2728 / (615.5988 - 35), kE = 35 * 230 / (580.388 - 35);
  [0, kO, kO, 0].forEach((v, i) => near(aO[i].offset, v, 0.05, '10b: Oikea + Vasen pala ' + (i + 1) + ' nollakohdan siirtymä'));
  [0, kE, kE, 0].forEach((v, i) => near(aE[i].offset, v, 0.05, '10b: Etu + Taka pala ' + (i + 1) + ' nollakohdan siirtymä'));
  // peilikuvassa pellin kulma on toisella puolella: ensimmäisellä ja viimeisellä palalla siirtymä ei ole 0
  const aOp = palaAsennot(kr, pOv, true), aEp = palaAsennot(kr, pEt, true);
  aOp.forEach((r, i) => near(r.offset, kO, 0.05, '10c: peilikuva, Oikea + Vasen pala ' + (i + 1) + ' siirtymä 8,3'));
  aEp.forEach((r, i) => near(r.offset, kE, 0.05, '10c: peilikuva, Etu + Taka pala ' + (i + 1) + ' siirtymä 14,8'));
  // ominaisuus: pelti peittää kappaleen: pinta-ala >= ääriviivan ala, ja kappaleen kaikki kulmat ovat pellin sisällä tai reunalla
  const ala = pg => { let s = 0; for (let i = 0; i < pg.length; i++) { const a = pg[i], b = pg[(i + 1) % pg.length]; s += a[0] * b[1] - b[0] * a[1]; } return Math.abs(s) / 2; };
  const etaisyys = (q, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return (dx * (q[1] - a[1]) - dy * (q[0] - a[0])) / l; };
  let kaikkiSisalla = true, alaOk = true;
  [[pEt, aE], [pOv, aO]].forEach(([pp, as]) => {
    const rengas = aihioPisteet(pp).pisteet.map(q => [q.x, q.y]);
    as.forEach(r => {
      if (ala(r.levy) < ala(rengas) - 1e-6) alaOk = false;
      // kupera pelti (vastapäivään): kulma on jokaisen sivun vasemmalla puolella
      const sg = (() => { let s = 0; for (let i = 0; i < r.levy.length; i++) { const a = r.levy[i], b = r.levy[(i + 1) % r.levy.length]; s += a[0] * b[1] - b[0] * a[1]; } return s >= 0 ? 1 : -1; })();
      rengas.forEach(q => { for (let i = 0; i < r.levy.length; i++) if (sg * etaisyys(q, r.levy[i], r.levy[(i + 1) % r.levy.length]) < -0.01) kaikkiSisalla = false; });
    });
  });
  ok(alaOk && kaikkiSisalla, '10d: pelti peittää kappaleen kokonaan (kaikki 8 palaa)');
  // levyt yhdessä + päiden jätekolmiot = kaista: pinta-alat täsmäävät
  const k2 = kr.kaistat[1];
  const levyAla = aO.reduce((s, r) => s + ala(r.levy), 0);
  const jate = k2.paat.alku ? 1 : 0;   // vain varmistus, että päät ovat olemassa
  ok(jate === 1 && levyAla < k2.pituus * k2.h && levyAla > 0.9 * k2.pituus * k2.h, '10d: palojen pellit täyttävät noin 90–100 % kaistasta (loppu on päiden jätekolmiot)');
  // suora kaista: pelti = suorakulmio w × h, siirtymä 0, ei käännettyjä
  const krS = laskeKaistat(rA, { tila: 'suora' });
  const aS = palaAsennot(krS, rA[0], false);
  ok(aS.every(r => !r.kierto && r.offset < 1e-6 && Math.abs(ala(r.levy) - rA[0].w * rA[0].h) < 1e-3), '10e: suoralla kaistalla pelti on suorakulmio w × h, nollakohta pellin kulma');
  // taulukko
  const tb = asentoTaulu(aO, 'x');
  ok(tb.indexOf('<td>2</td><td>1 / 4</td><td>suoraan</td><td>pellin vasen alakulma</td>') >= 0, '10f: taulukko: pala 1/4 suoraan, nollakohta pellin kulma');
  ok(tb.indexOf('<td>2</td><td>2 / 4</td><td><b>käännä 180°</b></td><td>pellin alareunalla <b>8 mm</b>') >= 0, '10f: taulukko: pala 2/4 käännä 180°, 8 mm');
  ok(tb.indexOf('<td>4 / 4</td><td><b>käännä 180°</b></td><td>pellin vasen alakulma') >= 0, '10f: taulukko: viimeinen pala käännetty, nollakohta pellin kulma');
  const tbE = asentoTaulu(aE, 'x');
  ok(tbE.indexOf('<b>15 mm</b>') >= 0, '10f: Etu + Taka keskipalat 15 mm (14,8 pyöristettynä)');
  // piirros ja työkortti
  const sv = merkintaSvgSisalto(pOv, 560, 400, TEEMA_PAPERI, false, edustavaLevy(aO));
  ok(sv.indexOf('pellin muoto leikattuna (pala 2/4)') >= 0 && sv.indexOf('NaN') < 0, '10g: kuvassa pellin muoto, keskimmäinen pala 2/4');
  const kk = rakennaTyokortit({ Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 }, pl, 'T', 'V', { pisteet: true, huuvia: 2, kaista: { paksuus: 0.6, rulla: 1250, tila: 'lomitus' } });
  ok(kk.indexOf('Palat kaistalla') >= 0 && kk.indexOf('Työjärjestys') >= 0 && kk.indexOf('nollakohdasta') >= 0, '10h: työkortissa Palat kaistalla, Työjärjestys ja nollakohta');
  const kk2 = rakennaTyokortit({ Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 }, pl, 'T', 'V', { pisteet: true, huuvia: 2 });
  ok(kk2.indexOf('Palat kaistalla') < 0 && kk2.indexOf('aihion vasemmasta reunasta') >= 0, '10h: ilman kaistasivua vanha ohje ja ei taulukkoa');
})();

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '', classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
