// Kartion harppi ja kaaren pisteet (orders/kartio.html, kartioHarppi; R1 24.11.2026, claude/kartio_huomiot.md kohdat A ja B).
// Laskenta luetaan sivun ensimmäisestä inline-skriptistä (ennen riviä "// ==== UI ===="), kuten muissa Kartion testeissä.
const fs = require('fs');
const path = require('path');
const polku = process.argv[2] || path.join(__dirname, '../../orders/kartio.html');
const html = fs.readFileSync(polku, 'utf8');
const laskenta = html.split('<script>')[1].split('</script>')[0].split('// ==== UI ====')[0];
const L = new Function(laskenta + '; return { laskeKartio, kartioHarppi, sijoituksenMuunnos, kierraPisteet, napa, rad };')();

let fails = 0;
function ok(cond, msg) { if (!cond) { fails++; console.log('FAIL:', msg); } else console.log('ok  :', msg); }
const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
const pe = { alaD: 600, ylaD: 300, H: 400, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, levyW: 1250, levyL: 5000, saumat: [{ kulma: 0, ed: 10, seur: 10 }] };

// 1) Peruskartio, reunasijoitus: kärjen etäisyys kaaren pisteisiin = säde, saumalisän kulmiin = √(R² + a²)
{
  const k = L.laskeKartio(pe), o = k.osat[0], sj = o.sijoitus, h = L.kartioHarppi(o, sj, 100);
  ok(sj.tila === 'reuna', '1a: reunasijoitus');
  ok(h.iso.pisteet.every(q => Math.abs(d(h.karki, q.p) - k.Rb) < 1e-6), '1b: iso kaari kärjestä säteellä Rb (' + k.Rb.toFixed(1) + ')');
  ok(h.pieni.pisteet.every(q => Math.abs(d(h.karki, q.p) - k.Rs) < 1e-6), '1c: pieni kaari kärjestä säteellä Rs');
  const T1 = h.rivit.find(r => r.nimi === 'T1'), T2 = h.rivit.find(r => r.nimi === 'T2');
  ok(Math.abs(d(h.karki, T1.p) - Math.hypot(k.Rb, 10)) < 1e-6 && Math.abs(d(h.karki, T2.p) - Math.hypot(k.Rs, 10)) < 1e-6, '1d: saumalisän kulmat T1 ja T2 kärjestä √(R² + 10²)');
  // kärki on saumareunan jatkeella: reunasijoituksessa saumalisän ulkoreuna on rullan reunassa (x = 0), kärki 10 mm sisällä
  ok(Math.abs(h.karki[0] - 10) < 1e-6, '1e: kärki 10 mm rullan reunasta (saumalisän leveys), saatu ' + h.karki[0].toFixed(3));
  ok(Math.abs(h.karki[1] - (Math.hypot(k.Rb, 0) )) < 1 || h.karki[1] > 0, '1f: kärki leikkauspään jälkeen (y > 0)');
  // pisteet ovat kappaleen ääriviivalla: jokainen rivi löytyy sijoitetusta ääriviivasta (kaaret tiheämmin, siksi etäisyys murtoviivaan)
  const seg = (p, a, b) => { const e = [b[0] - a[0], b[1] - a[1]], l2 = e[0] * e[0] + e[1] * e[1]; let t = l2 ? ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / l2 : 0; t = Math.max(0, Math.min(1, t)); return d(p, [a[0] + e[0] * t, a[1] + e[1] * t]); };
  const P = sj.pisteet, lahin = p => { let m = Infinity; for (let i = 0; i < P.length; i++) m = Math.min(m, seg(p, P[i], P[(i + 1) % P.length])); return m; };
  // ääriviivan kaari on piirretty 1,5° välein, joten murtoviiva poikkeaa kaaresta enintään Rb·(1 − cos 0,75°) ≈ 0,07 mm
  ok(h.rivit.every(r => lahin(r.p) < 0.1), '1g: kaikki merkintäpisteet ovat leikkausääriviivalla (suurin ero ' + Math.max(...h.rivit.map(r => lahin(r.p))).toFixed(4) + ' mm)');
  ok(h.rivit.every(r => r.x >= -1e-6 && r.y >= -1e-6 && r.x <= sj.w + 1e-6), '1h: pisteet pellillä (x, y ≥ 0)');
  // väli: enintään askel kaarta pitkin, jako tasainen
  ok(h.iso.n === Math.ceil(k.kaariIso / 100) && h.iso.pituus / h.iso.n <= 100 + 1e-9, '1i: iso kaari ' + h.iso.n + ' väliin (pituus ' + h.iso.pituus.toFixed(1) + ')');
  ok(h.iso.pisteet.slice(1).every((q, i) => Math.abs(d(q.p, h.iso.pisteet[i].p) - h.iso.janne) < 1e-6), '1j: peräkkäisten pisteiden jänne sama');
  const nimet = h.rivit.map(r => r.nimi);
  ok(nimet[0] === 'T1' && nimet[1] === 'I1' && nimet.indexOf('T3') === h.iso.n + 2 && nimet[nimet.length - 1] === 'T2', '1k: järjestys T1, I1…, T3, T4, P…, T2');
  ok(h.rivit.every((r, i) => Math.abs(r.seurPit - d(r.p, h.rivit[(i + 1) % h.rivit.length].p)) < 1e-9), '1l: matka seuraavaan');
  const h50 = L.kartioHarppi(o, sj, 50);
  ok(h50.iso.n === Math.ceil(k.kaariIso / 50), '1m: väli 50 mm → enemmän pisteitä');
}

// 2) Huullos: kaaret leikkausreunalla (Rb + h, Rs − h), porras K1–K4
{
  const k = L.laskeKartio({ ...pe, huAla: 20, huYla: 10 }), o = k.osat[0], h = L.kartioHarppi(o, o.sijoitus, 100);
  ok(Math.abs(h.RbLeikkaus - (k.Rb + 20)) < 1e-9 && Math.abs(h.RsLeikkaus - (k.Rs - 10)) < 1e-9, '2a: leikkaussäteet Rb + 20 ja Rs − 10');
  ok(h.iso.pisteet.every(q => Math.abs(d(h.karki, q.p) - (k.Rb + 20)) < 1e-6), '2b: iso kaari leikkausreunalla');
  ok(['K1', 'K2', 'K3', 'K4'].every(n => h.rivit.some(r => r.nimi === n)), '2c: huulloksen porras K1–K4');
  const K1 = h.rivit.find(r => r.nimi === 'K1');
  ok(Math.abs(d(h.karki, K1.p) - k.Rb) < 1e-6, '2d: K1 taitoslinjalla (säde Rb)');
}

// 3) Kärkikartio (yläpää 0): ei pientä kaarta, kärki = saumojen yhteinen kulma
{
  const k = L.laskeKartio({ ...pe, ylaD: 0, H: 200 }), o = k.osat[0], h = L.kartioHarppi(o, o.sijoitus, 100);
  ok(h.pieni === null && !h.rivit.some(r => /^P/.test(r.nimi)), '3a: kärkikartiossa ei pientä kaarta');
  ok(h.rivit.every(r => Number.isFinite(r.x) && Number.isFinite(r.y)), '3b: kaikki pisteet lukuja');
}

// 4) Useampi osa ja vapaa kierto: kärki pysyy samalla etäisyydellä kaarista
{
  const k = L.laskeKartio({ ...pe, saumat: [{ kulma: 0, ed: 10, seur: 10 }, { kulma: 120, ed: 10, seur: 10 }, { kulma: 240, ed: 10, seur: 10 }] });
  ok(k.osat.every(o => { const h = L.kartioHarppi(o, o.sijoitus, 80); return h.iso.pisteet.every(q => Math.abs(d(h.karki, q.p) - k.Rb) < 1e-6); }), '4a: kolme osaa, kaaret kärjestä säteellä Rb');
  const ks = L.laskeKartio({ ...pe, sijoitusTila: 'saasta' }), os = ks.osat[0], hs = L.kartioHarppi(os, os.sijoitus, 100);
  ok(hs.iso.pisteet.every(q => Math.abs(d(hs.karki, q.p) - ks.Rb) < 1e-6) && os.sijoitus.tila === 'saasta', '4b: vapaa kierto: kaaret kärjestä säteellä Rb');
  // matala, leveä kartio: kärki voi jäädä pellin ulkopuolelle
  const m = L.laskeKartio({ ...pe, alaD: 1000, ylaD: 900, H: 100, levyW: 1250, levyL: 5000, saumat: [{ kulma: 0, ed: 10, seur: 10 }, { kulma: 180, ed: 10, seur: 10 }] });
  const hm = L.kartioHarppi(m.osat[0], m.osat[0].sijoitus, 100);
  // reunasijoituksessa kärki on saumareunan jatkeella (x = saumalisä), mutta palan pituuden ulkopuolella: rullalla, jos palaa ei ole vielä katkaistu
  ok(Math.abs(hm.karki[0] - 10) < 1e-6 && hm.karki[1] > m.osat[0].sijoitus.h, '4c: matalassa kartiossa kärki palan ulkopuolella (' + hm.karki.map(x => x.toFixed(0)).join(', ') + ', pala ' + m.osat[0].sijoitus.h.toFixed(0) + ' mm pitkä)');
}

console.log(fails === 0 ? '\nKAIKKI TESTIT OK' : '\nEPÄONNISTUI: ' + fails);
if (fails) process.exitCode = 1;
