// Kartion DXF (orders/kartio.html, kartioDxf; vaihe 8.5 D3, 26.11.2026).
// Tarkistetaan, että DXF:n ääriviiva on sama kuin levityskuvan ääriviiva (sama asento kuin ruudulla, y käännetty eli ei peilikuvaa),
// pyöreän kartion kaaret ovat oikeita kaaria oikealla säteellä ja kulmalla, ja taitokset (saumalisä, huullos, nelikulmion
// taitosviivat) ovat TAITOS-tasolla. Laskenta luetaan sivun ensimmäisestä inline-skriptistä, kuten muissa Kartion testeissä.
const fs = require('fs');
const path = require('path');
require('../../orders/dxf.js');                       // asettaa globalThis.KPT_DXF
const { parit, entiteetit, arvo, arvot } = require('../dxf/lue_dxf.js');
const polku = process.argv[2] || path.join(__dirname, '../../orders/kartio.html');
const html = fs.readFileSync(polku, 'utf8');
const laskenta = html.split('<script>')[1].split('</script>')[0].split('// ==== UI ====')[0];
const L = new Function(laskenta + '; return { laske, laskeKartio, laskeNelio, kartioDxf, kartioDxfPala, nelioDxfPala, nelioViivat, vaakaKierto, kierraPisteet, tasajako };')();

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else console.log('ok  :', msg); }
const d2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const peili = p => [p[0], -p[1]];
const pe = { alaD: 600, ylaD: 300, H: 400, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, levyW: 1250, levyL: 5000, saumat: [{ kulma: 0, ed: 10, seur: 10 }] };

// Kaaripätkä (p → q, kaarevuus b): keskipiste, säde ja tiheät pisteet
function kaari(p, q, b) {
  const th = 4 * Math.atan(b), L2 = d2(p, q), r = L2 / (2 * Math.sin(Math.abs(th) / 2));
  const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], u = [(q[0] - p[0]) / L2, (q[1] - p[1]) / L2], h = (L2 / 2) / Math.tan(th / 2);
  const c = [m[0] - u[1] * h, m[1] + u[0] * h], a0 = Math.atan2(p[1] - c[1], p[0] - c[0]);
  const pts = []; for (let i = 0; i <= 60; i++) { const a = a0 + th * i / 60; pts.push([c[0] + r * Math.cos(a), c[1] + r * Math.sin(a)]); }
  return { c, r, th: th * 180 / Math.PI, pts };
}
// Suljettu ääriviiva [[x, y, b?]] tiheäksi murtoviivaksi
function tihea(lk) {
  const out = [];
  lk.forEach((p, i) => { const q = lk[(i + 1) % lk.length]; if (p[2]) out.push(...kaari(p, q, p[2]).pts.slice(0, -1)); else out.push([p[0], p[1]]); });
  return out;
}
const seg = (p, a, b) => { const e = [b[0] - a[0], b[1] - a[1]], l2 = e[0] * e[0] + e[1] * e[1]; let t = l2 ? ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / l2 : 0; t = Math.max(0, Math.min(1, t)); return d2(p, [a[0] + e[0] * t, a[1] + e[1] * t]); };
const etaisyys = (p, P) => { let m = Infinity; for (let i = 0; i < P.length; i++) m = Math.min(m, seg(p, P[i], P[(i + 1) % P.length])); return m; };
const ala = P => { let s = 0; P.forEach((p, i) => { const q = P[(i + 1) % P.length]; s += p[0] * q[1] - q[0] * p[1]; }); return s / 2; };
// Sama muoto: DXF:n tiheä ääriviiva levityskuvan ääriviivalla ja päinvastoin (levityskuvan kaari on 1,5° välein → ero < 0,1 mm)
function samaMuoto(pala, ulkoSvg) {
  const T = tihea(pala.leikkaus), U = ulkoSvg.map(peili);
  return Math.max(Math.max(...T.map(p => etaisyys(p, U))), Math.max(...U.map(p => etaisyys(p, T))));
}

// 1) Peruskartio, saumalisät 10 + 10
{
  const k = L.laskeKartio(pe), o = k.osat[0], pala = L.kartioDxfPala(o);
  const ero = samaMuoto(pala, o.kuva.ulko);
  ok(ero < 0.1, '1a: DXF:n ääriviiva = levityskuvan ääriviiva (suurin ero ' + ero.toFixed(4) + ' mm)');
  const kaaret = pala.leikkaus.map((p, i) => p[2] ? kaari(p, pala.leikkaus[(i + 1) % pala.leikkaus.length], p[2]) : null).filter(Boolean);
  const isot = kaaret.filter(c => Math.abs(c.r - k.Rb) < 1e-6), pienet = kaaret.filter(c => Math.abs(c.r - k.Rs) < 1e-6);
  ok(kaaret.length === isot.length + pienet.length && isot.length > 0 && pienet.length > 0, '1b: kaaret säteillä Rb ' + k.Rb.toFixed(1) + ' ja Rs ' + k.Rs.toFixed(1));
  ok(kaaret.every(c => d2(c.c, [0, 0]) < 1e-6), '1c: kaarien keskipiste = kärki');
  ok(Math.abs(isot.reduce((a, c) => a + Math.abs(c.th), 0) - k.theta) < 1e-6 && Math.abs(pienet.reduce((a, c) => a + Math.abs(c.th), 0) - k.theta) < 1e-6, '1d: kaarien kulma yhteensä = kehitelmän kulma ' + k.theta.toFixed(2) + '°');
  ok(kaaret.every(c => Math.abs(c.th) <= 90 + 1e-9), '1e: yksi kaaripätkä enintään 90°');
  ok(ala(pala.leikkaus.map(p => [p[0], p[1]])) !== 0 && Math.sign(ala(tihea(pala.leikkaus))) === Math.sign(ala(o.kuva.ulko.map(peili))), '1f: kiertosuunta sama kuin peilatulla levityskuvalla');
  // asento kuten ruudulla: kärki ylhäällä, kaaret alapuolella (ruudulla y kasvaa alas, DXF:ssä ylös)
  const T = tihea(pala.leikkaus);
  ok(Math.max(...T.map(p => p[1])) < 10 + 1e-6 && Math.min(...T.map(p => p[1])) < -k.Rb * 0.9, '1g: kärki ylhäällä ja iso kaari alhaalla, kuten ruudulla');
  ok(pala.viivat.length === 2 && pala.kaaret.length === 0, '1h: TAITOS: kaksi saumalisän taitosta, ei huulloksen kaaria');
  ok(pala.viivat.every(v => Math.abs(Math.hypot(...v[0]) - k.Rs) < 1e-6 && Math.abs(Math.hypot(...v[1]) - k.Rb) < 1e-6), '1i: saumalisän taitos Rs:stä Rb:hen (sauman reuna)');
}

// 2) Ei peilikuvaa: eri levyiset saumalisät (10 ja 30) ovat samalla puolella kuin ruudulla
{
  const k = L.laskeKartio({ ...pe, saumat: [{ kulma: 0, ed: 30, seur: 10 }] }), o = k.osat[0], pala = L.kartioDxfPala(o);
  ok(o.a1 === 10 && o.a2 === 30, '2a: alun saumalisä 10, lopun 30');
  const kx = q => q.reduce((a, p) => a + p[0], 0) / q.length;
  const t2Ruutu = kx(o.kuva.tab2), t1Ruutu = kx(o.kuva.tab1);
  // DXF:ssä 30 mm saumalisä = taitosviivasta kauempana oleva ääriviivan pätkä; sen x-puoli
  const v30 = pala.viivat.find(v => { const m = [(v[0][0] + v[1][0]) / 2, (v[0][1] + v[1][1]) / 2]; return Math.sign(m[0]) === Math.sign(t2Ruutu); });
  ok(Math.sign(t2Ruutu) !== Math.sign(t1Ruutu) && !!v30, '2b: 30 mm saumalisä on DXF:ssä samalla puolella (x) kuin ruudulla');
  ok(samaMuoto(pala, o.kuva.ulko) < 0.1, '2c: muoto sama kuin levityskuvassa');
}

// 3) Huullos: leikkauskaaret Rb + 20 ja Rs − 10, taitoskaaret Rb ja Rs
{
  const k = L.laskeKartio({ ...pe, huAla: 20, huYla: 10 }), o = k.osat[0], pala = L.kartioDxfPala(o);
  ok(samaMuoto(pala, o.kuva.ulko) < 0.1, '3a: muoto sama kuin levityskuvassa (huulloksen porras mukana)');
  const r = pala.leikkaus.map((p, i) => p[2] ? kaari(p, pala.leikkaus[(i + 1) % pala.leikkaus.length], p[2]).r : null).filter(x => x !== null);
  ok(r.every(x => Math.abs(x - (k.Rb + 20)) < 1e-6 || Math.abs(x - (k.Rs - 10)) < 1e-6), '3b: leikkauskaaret Rb + 20 ja Rs − 10');
  ok(pala.kaaret.length === 2 && Math.abs(pala.kaaret[0].r - k.Rb) < 1e-9 && Math.abs(pala.kaaret[1].r - k.Rs) < 1e-9, '3c: TAITOS-kaaret säteillä Rb ja Rs');
  ok(pala.kaaret.every(c => Math.abs((c.a1 - c.a0) - k.theta) < 1e-9), '3d: taitoskaaren kulma = kehitelmän kulma');
  // taitoskaaren päät ovat saumalisän taitoksen päissä
  const kp = (c, a) => [c.r * Math.cos(a * Math.PI / 180), c.r * Math.sin(a * Math.PI / 180)];
  const paat = pala.viivat.flatMap(v => v);
  ok(pala.kaaret.every(c => [c.a0, c.a1].every(a => paat.some(p => d2(p, kp(c, a)) < 1e-6))), '3e: taitoskaaret ja saumalisän taitokset kohtaavat');
}

// 4) Ilman saumalisiä ei taitosviivoja; kärkikartio (yläpää 0)
{
  const k = L.laskeKartio({ ...pe, saumat: [{ kulma: 0, ed: 0, seur: 0 }] }), pala = L.kartioDxfPala(k.osat[0]);
  const odotus = 2 * Math.ceil(k.theta / 90) + 2;   // kaksi kaarta enintään 90° pätkinä + kaksi suoraa sauman reunaa
  ok(pala.viivat.length === 0 && pala.leikkaus.length === odotus, '4a: ilman saumalisiä: ei taitoksia, ääriviivassa vain kaaret ja sauman reunat (' + pala.leikkaus.length + ' pistettä)');
  ok(samaMuoto(pala, k.osat[0].kuva.ulko) < 0.1, '4b: muoto sama');
  const kk = L.laskeKartio({ ...pe, ylaD: 0, H: 200, alaD: 460 }), pk = L.kartioDxfPala(kk.osat[0]);
  ok(!kk.virheet.length && kk.Rs === 0, '4c: kärkikartio laskettu');
  ok(samaMuoto(pk, kk.osat[0].kuva.ulko) < 0.1, '4d: kärkikartion muoto sama kuin levityskuvassa');
  ok(pk.leikkaus.every(p => !(Math.hypot(p[0], p[1]) < 1e-9 && p[2])) && pk.leikkaus.filter(p => Math.hypot(p[0], p[1]) < 1e-9).length === 1, '4e: kärki on yksi piste, ei pientä kaarta');
  ok(pk.viivat.every(v => Math.hypot(...v[0]) < 1e-9), '4f: saumalisän taitos alkaa kärjestä');
}

// 5) Iso kulma (yli 180°): kaari jaettu enintään 90° pätkiin
{
  const k = L.laskeKartio({ ...pe, alaD: 1000, ylaD: 100, H: 100, levyW: 5000, levyL: 9000 }), o = k.osat[0], pala = L.kartioDxfPala(o);
  ok(k.theta > 180, '5a: kehitelmän kulma ' + k.theta.toFixed(1) + '°');
  const kaaret = pala.leikkaus.map((p, i) => p[2] ? kaari(p, pala.leikkaus[(i + 1) % pala.leikkaus.length], p[2]) : null).filter(Boolean);
  ok(kaaret.length >= 6 && kaaret.every(c => Math.abs(c.th) <= 90 + 1e-9), '5b: kaaret ' + kaaret.length + ' pätkänä, kukin ≤ 90°');
  ok(samaMuoto(pala, o.kuva.ulko) < 0.15, '5c: muoto sama');
}

// 6) Koko tiedosto: osat, ryhmät, kappalemäärä, palat vierekkäin
{
  const k3 = L.laskeKartio({ ...pe, saumat: L.tasajako(3, 10, 10) });
  const t3 = L.kartioDxf(k3, 'Kartio 1', 2).sisalto(), e3 = entiteetit(parit(t3).p);
  ok(k3.ryhmat.length === 1 && e3.filter(x => x.tyyppi === 'POLYLINE' && arvo(x, 8) === 'LEIKKAUS').length === 1, '6a: kolme samanlaista osaa → yksi pala');
  const tx = e3.find(x => x.tyyppi === 'TEXT');
  ok(arvo(tx, 1) === 'Kartio 1 - Osa 1, 2, 3 - 6 kpl - pala ' + Math.round(k3.osat[0].sijoitus.w) + ' x ' + Math.round(k3.osat[0].sijoitus.h) + ' mm', '6b: teksti: ' + arvo(tx, 1));
  ok(arvo(e3[0], 70) === '1', '6c: ääriviiva suljettu');
  ok(e3.filter(x => x.tyyppi === 'VERTEX').some(x => arvo(x, 42) !== undefined), '6d: kaaret kaarevuutena (ryhmäkoodi 42)');
  const kTXT = L.laskeKartio(pe), t1 = L.kartioDxf(kTXT, 'Kartio', 1).sisalto(), tx1 = entiteetit(parit(t1).p).find(x => x.tyyppi === 'TEXT');
  ok(arvo(tx1, 1).indexOf('Osa') < 0 && /- 1 kpl - pala/.test(arvo(tx1, 1)), '6e: yksi osa: ei osan nimeä (' + arvo(tx1, 1) + ')');
  // kaksi erilaista osaa (saumat 0° ja 120°)
  const k2 = L.laskeKartio({ ...pe, saumat: [{ kulma: 0, ed: 10, seur: 10 }, { kulma: 120, ed: 10, seur: 10 }] });
  const d = L.kartioDxf(k2, 'K', 1), e2 = entiteetit(parit(d.sisalto()).p);
  const polyt = []; let nyk = null;
  e2.forEach(x => { if (x.tyyppi === 'POLYLINE') { nyk = { taso: arvo(x, 8), v: [] }; polyt.push(nyk); } else if (x.tyyppi === 'VERTEX' && nyk) nyk.v.push([+arvo(x, 10), +arvo(x, 20), +(arvo(x, 42) || 0)]); else if (x.tyyppi === 'SEQEND') nyk = null; });
  const leik = polyt.filter(p => p.taso === 'LEIKKAUS');
  ok(k2.ryhmat.length === 2 && leik.length === 2, '6f: kaksi erilaista osaa → kaksi palaa');
  const r0 = tihea(leik[0].v), r1 = tihea(leik[1].v);
  const mx0 = Math.max(...r0.map(p => p[0])), mn1 = Math.min(...r1.map(p => p[0]));
  ok(Math.abs(mn1 - mx0 - 50) < 0.1, '6g: palat vierekkäin 50 mm välein (väli ' + (mn1 - mx0).toFixed(2) + ')');
  ok(Math.abs(Math.min(...r0.map(p => p[1]))) < 0.1 && Math.abs(Math.min(...r0.map(p => p[0]))) < 0.1, '6h: ensimmäinen pala origosta (vasen alakulma 0, 0)');
  // pala tiedostossa = pala siirrettynä
  const p0 = L.kartioDxfPala(k2.osat[0]), dx = leik[0].v[0][0] - p0.leikkaus[0][0], dy = leik[0].v[0][1] - p0.leikkaus[0][1];
  ok(leik[0].v.every((q, i) => Math.abs(q[0] - p0.leikkaus[i][0] - dx) < 1e-3 && Math.abs(q[1] - p0.leikkaus[i][1] - dy) < 1e-3 && Math.abs(q[2] - (p0.leikkaus[i][2] || 0)) < 1e-3), '6i: tiedoston pala = laskettu pala siirrettynä');
  // tarkkuus tiedostosta luettuna: kaarevuuden pyöristys heitti aiemmin säteen 0,2 mm (ezdxf), nyt alle 0,005 mm
  const rTied = leik[0].v.map((q, i) => q[2] ? kaari(q, leik[0].v[(i + 1) % leik[0].v.length], q[2]).r : null).filter(x => x !== null);
  const rEro = Math.max(...rTied.map(x => Math.min(Math.abs(x - k2.Rb), Math.abs(x - k2.Rs))));
  ok(rEro < 0.005, '6j: tiedostosta luetun kaaren säde = Rb / Rs (suurin ero ' + rEro.toFixed(5) + ' mm)');
  ok(L.kartioDxf({ virheet: ['Korkeus puuttuu.'] }, 'K', 1) === null && L.kartioDxf(L.laskeKartio({ ...pe, H: 0 }), 'K', 1) === null, '6k: virheellisellä kartiolla ei tiedostoa');
}

// 7) Nelikulmio → pyöreä
const nel = { muoto: 'nelio', W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, levyW: 1250, levyL: 5000, saumat: [{ paikka: 0, ed: 10, seur: 10 }] };
{
  const k = L.laskeNelio(nel), o = k.osat[0], kv = o.kuva, pala = L.nelioDxfPala(o, k);
  const rot = L.vaakaKierto(kv.ulko), odotus = L.kierraPisteet(kv.ulko, rot).map(peili);
  ok(pala.leikkaus.length === kv.ulko.length && pala.leikkaus.every((p, i) => d2(p, odotus[i]) < 1e-9 && !p[2]), '7a: ääriviiva = levityskuvan ääriviiva samassa asennossa (' + pala.leikkaus.length + ' pistettä, murtoviiva)');
  const nv = L.nelioViivat(kv);
  const keski = kv.viivat.filter((v, j) => j > 0 && j < kv.viivat.length - 1 && v.ia % 2 === 0 && v.ib % (k.N - 1) === 0).length;
  ok(keski > 0 && pala.viivat.length === kv.viivat.length - keski, '7b: TAITOS: kaikki viivat paitsi sivun keskiviivat (' + keski + ' pois), saumareunat mukana');
  // poisjätetyt viivat eivät ole taitoksia (taite 0)
  ok(kv.viivat.every((v, j) => !(j > 0 && j < kv.viivat.length - 1 && v.ia % 2 === 0 && v.ib % (k.N - 1) === 0) || Math.abs(nv.viivat[j].taite || 0) < 0.01), '7c: sivun keskiviivoilla taite 0');
  ok(pala.kaaret.length === 0 && pala.avoimet.length === 0, '7d: ilman huullosta ei muita taitoksia');
  const ilmanSaumalisaa = L.nelioDxfPala(L.laskeNelio({ ...nel, saumat: [{ paikka: 0, ed: 0, seur: 0 }] }).osat[0], k);
  ok(ilmanSaumalisaa.viivat.length === pala.viivat.length - 2, '7e: ilman saumalisiä saumareunat ovat leikkausreunaa, eivät taitoksia');
  const kh = L.laskeNelio({ ...nel, huAla: 20, huYla: 15 }), oh = kh.osat[0], ph = L.nelioDxfPala(oh, kh);
  ok(ph.viivat.length === pala.viivat.length + oh.kuva.huul.A.runs.length, '7f: alapään huullos: taitos jokaiselle suoralle liuskalle (' + oh.kuva.huul.A.runs.length + ')');
  ok(ph.avoimet.length === 1 && ph.avoimet[0].length === oh.kuva.Bp.length, '7g: yläpään huullos: taitos B-pisteiden murtoviivana');
  const rh = L.vaakaKierto(oh.kuva.ulko);
  ok(ph.leikkaus.every((p, i) => d2(p, peili(L.kierraPisteet([oh.kuva.ulko[i]], rh)[0])) < 1e-9), '7h: huulloksellinen ääriviiva = levityskuva');
  const t = L.kartioDxf(kh, 'Siirtymä 1', 1).sisalto(), e = entiteetit(parit(t).p);
  ok(e.filter(x => x.tyyppi === 'POLYLINE' && arvo(x, 8) === 'TAITOS' && arvo(x, 70) === '0').length === 1, '7i: tiedostossa avoin TAITOS-murtoviiva (yläpään huullos)');
  ok(arvo(e.find(x => x.tyyppi === 'TEXT'), 1).indexOf('Siirtymä 1 - 1 kpl - pala ') === 0, '7j: teksti nelikulmiolle');
}

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
