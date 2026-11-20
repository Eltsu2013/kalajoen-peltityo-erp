// test_pisteet.js — merkintäpisteet (v11, 20.10.2026)
// Aihion ääriviivan kulmapisteet: yhdistetään paneeli + taitokset yhdeksi ääriviivaksi ja numeroidaan kulmat.
// Tarkistus ei luota yhteen menetelmään: ääriviivaa verrataan ruudukkonäytteillä alkuperäisiin monikulmioihin
// (piste on ääriviivan sisällä jos ja vain jos se on jonkin osan sisällä).
const fs = require('fs');
const { html, script } = require('./lataa')();   // yhteiset tiedostot + Huuva-mockupin skripti
const testCode = `
let fails = 0;
function ok(c, m) { if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }
function near(a, b, t, m) { ok(Math.abs(a-b) <= t, m + ' (saatu ' + (typeof a==='number'?a.toFixed(3):a) + ', odotettu ' + b + ')'); }
const all = t => ({ Etu:t, Oikea:t, Taka:t, Vasen:t });
const on4 = { Etu:true, Oikea:true, Taka:true, Vasen:true };
const area2 = pl => Math.abs(polygonSign(pl)) / 2;

// riippumaton "onko piste monikulmion sisällä" (ray casting, ei jaettu koodin kanssa)
function sisalla(q, pl) {
  let c = false;
  for (let i = 0, j = pl.length - 1; i < pl.length; j = i++) {
    const a = pl[i], b = pl[j];
    if ((a[1] > q[1]) !== (b[1] > q[1]) && q[0] < (b[0]-a[0]) * (q[1]-a[1]) / (b[1]-a[1]) + a[0]) c = !c;
  }
  return c;
}
function distSeg(q, a, b) {
  const dx = b[0]-a[0], dy = b[1]-a[1], l2 = dx*dx + dy*dy;
  let t = l2 > 0 ? ((q[0]-a[0])*dx + (q[1]-a[1])*dy) / l2 : 0;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(q[0] - (a[0] + t*dx), q[1] - (a[1] + t*dy));
}

// ---------- 1. yhdistaMonikulmiot: pienet käsin tarkistetut tapaukset
(function () {
  const sq = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
  let r = yhdistaMonikulmiot([sq(0, 0, 10, 10), sq(10, 0, 5, 10)]);
  ok(r.length === 1 && r[0].length === 4, '1a: kaksi vierekkäistä suorakulmiota -> yksi suorakulmio (4 kulmaa)');
  near(area2(r[0]), 150, 1e-9, '1a: pinta-ala 150');
  r = yhdistaMonikulmiot([sq(0, 0, 10, 10), sq(5, 5, 10, 10)]);
  ok(r.length === 1 && r[0].length === 8, '1b: osittain päällekkäiset neliöt -> L-muoto, 8 kulmaa (' + (r[0] || []).length + ')');
  near(area2(r[0]), 175, 1e-9, '1b: pinta-ala 100 + 100 - 25');
  r = yhdistaMonikulmiot([sq(0, 0, 10, 10), sq(2, 2, 3, 3)]);
  ok(r.length === 1 && r[0].length === 4 && Math.abs(area2(r[0]) - 100) < 1e-9, '1c: toinen kokonaan sisällä -> vain ulompi');
  r = yhdistaMonikulmiot([sq(0, 0, 10, 10), sq(0, 0, 10, 10)]);
  ok(r.length === 1 && r[0].length === 4, '1d: kaksi täsmälleen samaa -> yksi');
  r = yhdistaMonikulmiot([sq(0, 0, 10, 10), sq(20, 0, 5, 5)]);
  ok(r.length === 2, '1e: erilliset osat -> kaksi silmukkaa');
  // kolmio + suorakulmio yhteisellä reunalla, reunan suoralla jatkuvat pisteet katoavat
  r = yhdistaMonikulmiot([[[0,0],[10,0],[10,10],[0,10]], [[10,0],[20,0],[10,10]]]);
  ok(r.length === 1 && r[0].length === 4, '1f: suorakulmio + kolmio samalla reunalla -> puolisuunnikas (4 kulmaa)');
  near(area2(r[0]), 100 + 50, 1e-9, '1f: pinta-ala 150');
  // vastapäivään vaikka syöte oli myötäpäivään
  r = yhdistaMonikulmiot([sq(0, 0, 10, 10).reverse()]);
  ok(polygonSign(r[0]) > 0, '1g: tulos vastapäivään');
})();

// ---------- 2. Esimerkkihuuva: käsin lasketut pisteet
const sA = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
const side = { Etu:{L:0,R:0}, Oikea:{L:20,R:20}, Taka:{L:0,R:0}, Vasen:{L:20,R:20} };
const lisa0 = { Etu:0, Oikea:0, Taka:0, Vasen:0 };
const bKouru = { type: all('kouru'), floor:30, rise:20, hem:15, inW:20, inHem:10, d1:15, d2:15, lisa:lisa0, loveus:true };
const oA = { panelOn: on4, sideW: side, sideDir: {}, top: { type: all('sisaan'), w: 20, loveus: true }, bottom: bKouru };
const rA = ryhmitteleSamat(laskeKaikki(sA, oA));
const lista = p => aihioPisteet(p).pisteet;
const etuTaka = rA.find(p => p.name === 'Etu + Taka'), oikeaVasen = rA.find(p => p.name === 'Oikea + Vasen');
(function () {
  const odotettu = [[0,0],[860,0],[860,35],[830,65],[630,580.4],[610,600.4],[250,600.4],[230,580.4],[30,65],[0,35]];
  const P = lista(etuTaka);
  ok(P.length === 10, '2: Etu + Taka: 10 pistettä (' + P.length + ')');
  odotettu.forEach((q, k) => {
    near(P[k].x, q[0], 0.06, '2: Etu piste ' + (k + 1) + ' x');
    near(P[k].y, q[1], 0.06, '2: Etu piste ' + (k + 1) + ' y');
    ok(P[k].n === k + 1, '2: Etu piste ' + (k + 1) + ' numero');
  });
  const O = lista(oikeaVasen);
  const odO = [[0,0],[560,0],[560,35],[530,65],[547.7,77.1],[422.7,615.6],[405,603.5],[385,623.5],[175,623.5],[155,603.5],[137.3,615.6],[12.3,77.1],[30,65],[0,35]];
  ok(O.length === 14, '2: Oikea + Vasen: 14 pistettä (' + O.length + ')');
  odO.forEach((q, k) => {
    near(O[k].x, q[0], 0.06, '2: Oikea piste ' + (k + 1) + ' x');
    near(O[k].y, q[1], 0.06, '2: Oikea piste ' + (k + 1) + ' y');
  });
  // pyöristys ja muoto
  ok(fmtPiste(580.4) === '580' && fmtPiste(-0.2) === '0' && fmtPiste(547.7) === '548', '2: pyöristys kokonaisiin millimetreihin (-0 -> 0)');
})();

// ---------- 3. Yleiset ominaisuudet monelle huuvalle ja asetukselle
function ominaisuudet(nimi, s, o) {
  const r = laskeKaikki(s, o);
  r.forEach(p => {
    const t = nimi + ' ' + p.name;
    const res = aihioPisteet(p);
    const P = res.pisteet;
    ok(res.silmukoita === 1, t + ': yksi yhtenäinen ääriviiva');
    ok(P.length >= 3, t + ': vähintään 3 pistettä (' + P.length + ')');
    const ring = P.map(q => [q.x + p.minX, q.y + p.minY]);
    ok(polygonSign(ring) > 0, t + ': numerointi vastapäivään');
    // piste 1 on alin
    ok(P.every(q => q.y >= P[0].y - 1e-6), t + ': piste 1 on alin');
    // koordinaatit aihion sisällä ja aihion reunat koskettavat ääriviivaa
    const xs = P.map(q => q.x), ys = P.map(q => q.y);
    near(Math.min.apply(null, xs), 0, 1e-6, t + ': pienin x = 0');
    near(Math.min.apply(null, ys), 0, 1e-6, t + ': pienin y = 0');
    near(Math.max.apply(null, xs), p.w, 1e-6, t + ': suurin x = aihion leveys');
    near(Math.max.apply(null, ys), p.h, 1e-6, t + ': suurin y = aihion korkeus');
    // jokainen piste on oikea kulma: ei suoria välipisteitä, ei kaksoispisteitä
    let hyvaKulma = true, erilliset = true;
    ring.forEach((q, k) => {
      const a = ring[(k + ring.length - 1) % ring.length], b = ring[(k + 1) % ring.length];
      const l1 = Math.hypot(q[0]-a[0], q[1]-a[1]), l2 = Math.hypot(b[0]-q[0], b[1]-q[1]);
      if (l1 < 1e-6 || l2 < 1e-6) erilliset = false;
      else if (Math.abs((q[0]-a[0])*(b[1]-q[1]) - (q[1]-a[1])*(b[0]-q[0])) < 1e-6 * l1 * l2) hyvaKulma = false;
    });
    ok(erilliset, t + ': pisteet eri paikoissa');
    ok(hyvaKulma, t + ': jokaisessa pisteessä todellinen kulma');
    // ääriviivan jokainen sivu kulkee jonkin osan reunaa pitkin
    const osat = [[p.A2, p.B2, p.C2, p.D2]].concat(p.flanges.map(f => f.poly));
    const reunallaOsaa = m => osat.some(pl => pl.some((a, k) => distSeg(m, a, pl[(k + 1) % pl.length]) < 1e-6));
    ok(ring.every((q, k) => { const b = ring[(k + 1) % ring.length]; return reunallaOsaa([(q[0]+b[0])/2, (q[1]+b[1])/2]); }), t + ': jokainen sivu on jonkin osan reunaa');
    // ruudukkonäyte: sisällä ääriviivassa <=> sisällä jossain osassa
    let virheita = 0, naytteita = 0;
    const x0 = p.minX + 0.37, y0 = p.minY + 0.41;
    for (let x = x0; x < p.minX + p.w; x += 6.1) for (let y = y0; y < p.minY + p.h; y += 6.1) {
      naytteita++;
      const osassa = osat.some(pl => sisalla([x, y], pl));
      if (osassa !== sisalla([x, y], ring)) virheita++;
    }
    ok(naytteita > 100 && virheita === 0, t + ': ääriviiva = osien yhdiste (' + naytteita + ' näytettä, ' + virheita + ' eroa)');
  });
  return r;
}
function mk(botType, topType, opts2) {
  opts2 = opts2 || {};
  return { panelOn: opts2.panelOn || on4, sideW: opts2.sideW || side, sideDir: opts2.sideDir || {},
    top: { type: all(topType), w: opts2.topW === undefined ? 20 : opts2.topW, loveus: opts2.loveus !== false },
    bottom: Object.assign({}, bKouru, { type: all(botType) }, opts2.bottom || {}) };
}
['kouru', 'sisaan', 'tuplat', 'ei'].forEach(b => ['sisaan', 'ylos', 'ei'].forEach(t => {
  ominaisuudet('keskitetty ' + b + '/' + t, sA, mk(b, t));
}));
ominaisuudet('epäkeskoinen', { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:60, dy:40 }, mk('kouru', 'sisaan'));
const onSeina = { Etu:true, Oikea:true, Taka:false, Vasen:true };
const sSeina = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:125 };
const sideSeina = { Etu:{L:0,R:0}, Oikea:{L:20,R:30}, Taka:{L:0,R:0}, Vasen:{L:30,R:20} };
ominaisuudet('seinä/ulos', sSeina, mk('kouru', 'sisaan', { panelOn: onSeina, sideW: sideSeina }));
ominaisuudet('seinä/sisään', sSeina, mk('sisaan', 'sisaan', { panelOn: onSeina, sideW: sideSeina, sideDir: all({ L:'sisaan', R:'sisaan' }) }));
ominaisuudet('nurkka', { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:200, dy:125 }, mk('kouru', 'sisaan', { panelOn: { Etu:true, Oikea:false, Taka:false, Vasen:true }, sideW: { Etu:{L:0,R:30}, Oikea:{L:20,R:20}, Taka:{L:0,R:0}, Vasen:{L:30,R:20} } }));
ominaisuudet('laatikko', { Wb:600, Db:400, Wt:600, Dt:400, H:500, dx:0, dy:0 }, mk('kouru', 'sisaan'));
ominaisuudet('levenevä', { Wb:400, Db:250, Wt:800, Dt:500, H:500, dx:0, dy:0 }, mk('kouru', 'sisaan'));
ominaisuudet('lisämitta 15', sA, mk('kouru', 'sisaan', { bottom: { lisa: { Etu:15, Oikea:0, Taka:15, Vasen:0 } } }));
// ääriarvo: leveät sivutaitokset ja korkea kouru -> osat menevät päällekkäin, ääriviivan pitää silti olla yhdiste
ominaisuudet('leveät taitokset', sA, mk('kouru', 'sisaan', { sideW: { Etu:{L:40,R:40}, Oikea:{L:80,R:80}, Taka:{L:40,R:40}, Vasen:{L:80,R:80} }, topW: 60, bottom: { floor:60, rise:50, hem:30 } }));

// ---------- 4. Samat paneelit antavat samat pisteet; työkortti ja taulukko
(function () {
  const s2 = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
  const erillaan = laskeKaikki(s2, oA);
  const e = aihioPisteet(erillaan.find(p => p.name === 'Etu')).pisteet, t = aihioPisteet(erillaan.find(p => p.name === 'Taka')).pisteet;
  ok(e.length === t.length && e.every((q, k) => Math.abs(q.x - t[k].x) < 1e-6 && Math.abs(q.y - t[k].y) < 1e-6), '4: Etu ja Taka antavat samat pisteet (siksi voidaan yhdistää)');
  const taulu = pisteTaulu(etuTaka, 'x');
  ok((taulu.match(/<tr><td>/g) || []).length === 10, '4: taulukossa 10 riviä');
  ok((pisteTaulu(oikeaVasen, 'x').match(/<table/g) || []).length === 2, '4: yli 12 pistettä jaetaan kahteen taulukkoon');
  const svg = merkintaSvgSisalto(etuTaka, 560, 400, TEEMA_PAPERI);
  ok(svg.indexOf('NaN') < 0 && svg.indexOf('undefined') < 0, '4: piirrossa ei NaN/undefined');
  ok((svg.match(/<circle/g) || []).length === 10, '4: piirrossa 10 pistettä');
  ok(svg.indexOf('>10</text>') >= 0 && svg.indexOf('>1</text>') >= 0, '4: piirrossa numerot 1 ja 10');
  const ilman = rakennaTyokortit(s2, rA, 'T', 'V');
  const kanssa = rakennaTyokortit(s2, rA, 'T', 'V', { pisteet: true });
  ok((ilman.match(/class="tk-page"/g) || []).length === 3 && ilman.indexOf('merkintäpisteet') < 0, '4: ilman valintaa vanhat sivut (yhteenveto + 2), ei merkintäsivuja');
  ok((kanssa.match(/class="tk-page"/g) || []).length === 5, '4: merkintäpisteillä 5 sivua (yhteenveto + 2 × (kortti + merkintäsivu))');
  ok(kanssa.indexOf('Etu + Taka — merkintäpisteet') >= 0 && kanssa.indexOf('Oikea + Vasen — merkintäpisteet') >= 0, '4: merkintäsivujen otsikot');
  ok(kanssa.indexOf('1 → 2 → … → 10 → 1') >= 0 && kanssa.indexOf('→ 14 → 1') >= 0, '4: ohje pisteiden yhdistämisestä oikeilla pistemäärillä');
  // ruudun päivitys ei kaadu ilman kohdeelementtiä
  paivitaMerkinta(rA);
  ok(true, '4: paivitaMerkinta ajettavissa');
})();

// ---------- 5. Peilikuva (merkkaus pellin sisäpinnalle)
(function () {
  // symmetrinen paneeli: peilikuvan pisteet = samat pisteet (uudelleennumeroituna)
  [etuTaka, oikeaVasen].forEach(p => {
    const a = aihioPisteet(p, false).pisteet, b = aihioPisteet(p, true).pisteet;
    ok(a.length === b.length, '5: ' + p.name + ': peilikuvassa sama pistemäärä');
    ok(a.every((q, k) => Math.abs(q.x - b[k].x) < 1e-6 && Math.abs(q.y - b[k].y) < 1e-6), '5: ' + p.name + ': symmetrinen paneeli antaa peilikuvassa samat pisteet');
  });
  // epäsymmetrinen: epäkeskoinen huuva + eri sivutaitokset + lisämitta vain yhdellä pellillä
  const sE = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:80, dy:40 };
  const oE = { panelOn: on4, sideW: { Etu:{L:0,R:0}, Oikea:{L:20,R:35}, Taka:{L:0,R:0}, Vasen:{L:10,R:20} }, sideDir: {}, top: { type: { Etu:'sisaan', Oikea:'ylos', Taka:'sisaan', Vasen:'sisaan' }, w: 20, loveus: true },
    bottom: Object.assign({}, bKouru, { lisa: { Etu:15, Oikea:0, Taka:0, Vasen:0 } }) };
  laskeKaikki(sE, oE).forEach(p => {
    const t = '5: epäsymmetrinen ' + p.name;
    const a = aihioPisteet(p, false).pisteet, b = aihioPisteet(p, true).pisteet;
    ok(a.length === b.length, t + ': sama pistemäärä');
    const ringA = a.map(q => [q.x, q.y]), ringB = b.map(q => [q.x, q.y]);
    ok(polygonSign(ringB) > 0, t + ': peilikuva vastapäivään');
    ok(b.every(q => q.y >= b[0].y - 1e-6), t + ': peilikuvan piste 1 alin');
    near(polygonSign(ringB), polygonSign(ringA), 1e-6, t + ': sama pinta-ala');
    // jokainen alkuperäinen piste löytyy peilattuna
    ok(ringA.every(q => ringB.some(r => Math.abs(r[0] - (p.w - q[0])) < 1e-6 && Math.abs(r[1] - q[1]) < 1e-6)), t + ': jokainen piste löytyy peilattuna');
    // ruudukkonäyte: piste on peilikuvassa sisällä <=> alkuperäisessä peilattu piste sisällä
    let virheita = 0;
    for (let x = 0.37; x < p.w; x += 7.3) for (let y = 0.41; y < p.h; y += 7.3) {
      if (sisalla([x, y], ringB) !== sisalla([p.w - x, y], ringA)) virheita++;
    }
    ok(virheita === 0, t + ': peilikuva on alkuperäisen peilaus (' + virheita + ' eroa)');
  });
  const svgP = merkintaSvgSisalto(etuTaka, 560, 400, TEEMA_PAPERI, true), svgN = merkintaSvgSisalto(etuTaka, 560, 400, TEEMA_PAPERI, false);
  ok(svgP.indexOf('PEILIKUVA') >= 0 && svgN.indexOf('PEILIKUVA') < 0, '5: piirrossa peilikuva-merkintä vain peilitilassa');
  ok(svgP.indexOf('NaN') < 0, '5: peilikuvapiirrossa ei NaN');
  const s2 = { Wb:800, Db:500, Wt:400, Dt:250, H:500, dx:0, dy:0 };
  const kP = rakennaTyokortit(s2, rA, 'T', 'V', { pisteet: true, peili: true }), kN = rakennaTyokortit(s2, rA, 'T', 'V', { pisteet: true });
  ok(kP.indexOf('SISÄPINTA, peilikuva') >= 0 && kP.indexOf('Peilikuva (sisäpinta):') >= 0 && kP.indexOf('ulkopinnalta') < 0, '5: peilitilan kortissa sisäpinta-merkinnät');
  ok(kN.indexOf('SISÄPINTA') < 0 && kN.indexOf('ulkopinnalta') >= 0, '5: normaalitilassa ulkopinta-teksti');
  ok((kP.match(/class="tk-page"/g) || []).length === 5, '5: peilitilassa sama sivumäärä');
  ok(merkkausPeili() === false, '5: ilman valintaa ei peilitilaa');
})();

console.log(fails === 0 ? '\\nKAIKKI TESTIT OK' : '\\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
`;
const fake = { value: '', style: {}, disabled: false, textContent: '', innerHTML: '', classList: { toggle(){}, add(){}, remove(){} }, setAttribute(){} };
global.document = { getElementById: () => fake };
eval(script + '\n' + testCode);
