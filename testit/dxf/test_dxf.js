// test_dxf.js — yhteinen DXF-kirjoitin orders/dxf.js (vaihe 8.5 D1, 26.11.2026)
// Tarkistetaan, että tiedosto on DXF R12 -muodon mukainen (ryhmäkoodi + arvo -parit, osiot, taulukot) ja että
// mitat ja tasot tulevat tiedostoon oikein. Lisäksi Huuvan palojen DXF: ääriviiva = merkintäpisteet (sama lähde).
const KPT_DXF = require('../../orders/dxf.js');

let fails = 0, n = 0;
function ok(c, m) { n++; if (!c) { fails++; console.log('FAIL:', m); } else console.log('ok  :', m); }

const { parit, entiteetit, arvo, arvot } = require('./lue_dxf.js');

// ---------- 1. Rakenne
(function () {
  const d = KPT_DXF.uusi();
  d.monikulmio([[0, 0], [800, 0], [800, 600], [0, 600]], 'LEIKKAUS');
  d.viiva(0, 100, 800, 100, 'TAITOS');
  d.kaari(400, -500, 1000, 60, 120, 'LEIKKAUS');
  d.teksti(0, 620, 12, 'Etu + Taka · 2 kpl', 'TEKSTI');
  const t = d.sisalto();
  const { p, parillinen } = parit(t);
  ok(parillinen, '1a: rivejä parillinen määrä (koodi + arvo)');
  ok(p.every(x => /^-?\d+$/.test(x[0])), '1a: jokainen ryhmäkoodi on kokonaisluku');
  ok(t.indexOf('\r\n') > 0 && t.replace(/\r\n/g, '').indexOf('\n') < 0, '1b: rivinvaihto CRLF');
  ok(p[p.length - 1][0] === '0' && p[p.length - 1][1] === 'EOF', '1c: tiedosto päättyy EOF');
  const osiot = p.filter((x, i) => x[0] === '2' && i > 0 && p[i - 1][1] === 'SECTION').map(x => x[1]);
  ok(osiot.join() === 'HEADER,TABLES,ENTITIES', '1d: osiot HEADER, TABLES, ENTITIES');
  ok(p.filter(x => x[1] === 'SECTION').length === p.filter(x => x[1] === 'ENDSEC').length, '1d: jokainen osio suljettu');
  const ver = p.findIndex(x => x[1] === '$ACADVER');
  ok(p[ver + 1][1] === 'AC1009', '1e: versio AC1009 (R12)');
  ok(t.indexOf('$INSUNITS\r\n 70\r\n4') > 0 || /\$INSUNITS\r\n70\r\n4/.test(t), '1e: yksikkö millimetri ($INSUNITS 4)');
  ['LEIKKAUS', 'TAITOS', 'TEKSTI'].forEach(nimi => ok(p.some((x, i) => x[0] === '2' && x[1] === nimi && p[i - 1][1] === 'LAYER'), '1f: taso ' + nimi + ' määritelty'));
  ok(p.some((x, i) => x[0] === '2' && x[1] === 'DASHED' && p[i - 1][1] === 'LTYPE'), '1f: katkoviiva määritelty');
  ok(!/e[+-]\d/i.test(p.filter(x => /^[1-5]\d$/.test(x[0])).map(x => x[1]).join(' ')), '1g: ei eksponenttimuotoisia lukuja');
  ok(p.filter(x => /^[1-5]\d$/.test(x[0])).every(x => /^-?\d+(\.\d+)?$/.test(x[1])), '1g: luvut pisteellä, ei pilkkua');

  const e = entiteetit(p);
  ok(e.map(x => x.tyyppi).join() === 'POLYLINE,VERTEX,VERTEX,VERTEX,VERTEX,SEQEND,LINE,ARC,TEXT', '2a: entiteetit oikeassa järjestyksessä');
  const pl = e[0];
  ok(arvo(pl, 8) === 'LEIKKAUS' && arvo(pl, 70) === '1' && arvo(pl, 66) === '1', '2b: monikulmio LEIKKAUS-tasolla, suljettu (70 = 1)');
  const v = e.filter(x => x.tyyppi === 'VERTEX').map(x => [Number(arvo(x, 10)), Number(arvo(x, 20))]);
  ok(JSON.stringify(v) === '[[0,0],[800,0],[800,600],[0,600]]', '2b: kärkipisteet millimetreinä (800 × 600)');
  const li = e.find(x => x.tyyppi === 'LINE');
  ok(arvo(li, 8) === 'TAITOS' && arvo(li, 11) === '800' && arvo(li, 21) === '100', '2c: taitosviiva TAITOS-tasolla');
  const ar = e.find(x => x.tyyppi === 'ARC');
  ok(arvo(ar, 40) === '1000' && arvo(ar, 50) === '60' && arvo(ar, 51) === '120', '2d: kaari: säde 1000, kulmat 60–120');
  const tx = e.find(x => x.tyyppi === 'TEXT');
  ok(arvo(tx, 1) === 'Etu + Taka - 2 kpl' && arvo(tx, 40) === '12', '2e: teksti ja korkeus, · → - (CAD-fonteista puuttuu ·)');
  ok(KPT_DXF.tekstiCadille('860 × 601 · 45° ±1 Ø20 Pääty') === '860 x 601 - 45%%d %%p1 %%c20 Pääty', '2e: × → x, ° ± Ø CAD-koodeiksi, ä jää');
  // rajat: kaaren ylin kohta 90°: y = -500 + 1000 = 500; monikulmion ylin 600, teksti 632
  const b = d.rajat();
  ok(Math.abs(b.minX + 100) < 1e-6 && b.minY === 0 && Math.abs(b.maxX - 900) < 1e-6, '2f: rajat: kaaren päät x = 400 ± 1000·cos 60° = -100 ja 900, ala 0');
  ok(Math.abs(b.maxY - 632) < 1e-9, '2f: ylin raja tekstin yläreuna 632');
})();

// ---------- 3. Luvut, merkistö, nimet
(function () {
  const d = KPT_DXF.uusi();
  d.monikulmio([[0.123456, -0.00001], [10, 0], [10, 1e-7]], 'LEIKKAUS', false);
  const e = entiteetit(parit(d.sisalto()).p);
  ok(arvo(e[0], 70) === '0', '3a: avoin monikulmio (70 = 0)');
  ok(arvot(e[1], 10)[0] === '0.1235' && arvot(e[1], 20)[0] === '0', '3b: neljä desimaalia, -0 → 0');
  const b = KPT_DXF.koodaa('Etu ÄÖåä × 45° € ✓');
  ok(b[4] === 0xC4 && b[5] === 0xD6 && b[6] === 0xE5 && b[7] === 0xE4, '3c: ÄÖåä Windows-1252-tavuina');
  ok(b[9] === 0xD7 && b[13] === 0xB0 && b[15] === 0x80 && b[17] === 0x3F, '3c: × ja ° ja €, tuntematon merkki ?');
  ok(KPT_DXF.turvallinenNimi('Huuva 1: Etu/Taka') === 'Huuva 1- Etu-Taka.dxf' && KPT_DXF.turvallinenNimi('a.DXF') === 'a.DXF', '3d: tiedostonimi ilman kiellettyjä merkkejä, pääte .dxf');
  let virhe = false; try { KPT_DXF.uusi().viiva(0, 0, NaN, 1, 'LEIKKAUS'); } catch (x) { virhe = true; }
  ok(virhe, '3e: NaN ei mene tiedostoon (virhe)');
  ok(KPT_DXF.uusi().viiva(0, 0, 1, 1, 'EIOLE').sisalto().indexOf('\r\n8\r\n0\r\n') > 0, '3f: tuntematon taso → taso 0');
})();

// ---------- 4. Kaaripätkät ääriviivassa (v3, D3 Kartio): VERTEX + ryhmäkoodi 42 (bulge)
(function () {
  const d = KPT_DXF.uusi();
  ok(Math.abs(KPT_DXF.kaarevuus(180) - 1) < 1e-12 && Math.abs(KPT_DXF.kaarevuus(90) - Math.tan(Math.PI / 8)) < 1e-12, '4a: kaarevuus = tan(kulma / 4): 180° → 1');
  // puoliympyrä (100,0) → (-100,0) vastapäivään keskipisteen (0,0) ympäri, sitten suora takaisin: ylin kohta y = 100
  d.monikulmio([[100, 0, KPT_DXF.kaarevuus(180)], [-100, 0]], 'LEIKKAUS');
  const e = entiteetit(parit(d.sisalto()).p);
  const v = e.filter(x => x.tyyppi === 'VERTEX');
  ok(arvo(v[0], 42) === '1' && arvo(v[1], 42) === undefined, '4b: kaaripätkän alkupisteessä 42 = 1, suoran pätkän pisteessä ei koodia');
  const b = d.rajat();
  ok(Math.abs(b.maxY - 100) < 1e-9 && b.minY === 0 && b.minX === -100 && b.maxX === 100, '4c: rajoissa kaaren ylin kohta (y = 100)');
  // myötäpäivään (miinus): kaari kulkee alapuolelta
  const d2 = KPT_DXF.uusi().monikulmio([[100, 0, -KPT_DXF.kaarevuus(180)], [-100, 0]], 'LEIKKAUS');
  ok(Math.abs(d2.rajat().minY + 100) < 1e-9 && d2.rajat().maxY === 0, '4d: miinus = myötäpäivään, kaari alapuolella');
  // 90° kaari (r = 1000, kulmat 30°–120°): ylittää 90°:n → ylin kohta y = 1000
  const P = a => [1000 * Math.cos(a * Math.PI / 180), 1000 * Math.sin(a * Math.PI / 180)];
  const d3 = KPT_DXF.uusi().monikulmio([P(30).concat(KPT_DXF.kaarevuus(90)), P(120)], 'LEIKKAUS', false);
  ok(Math.abs(d3.rajat().maxY - 1000) < 1e-6, '4e: 30°–120° kaaren ylin kohta 1000');
  // avoimen viivan viimeisen pisteen kaarevuus ei vaikuta (ei pätkää)
  const d4 = KPT_DXF.uusi().monikulmio([[0, 0], [10, 0, 1]], 'LEIKKAUS', false);
  ok(d4.rajat().minY === 0 && d4.rajat().maxY === 0, '4f: avoimen viivan viimeinen piste: ei kaarta rajoihin');
})();

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
