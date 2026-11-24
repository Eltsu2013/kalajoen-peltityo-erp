// Kartio, jonka yläpää on 0 = terävä kärki (Tomi 24.11.2026: Ø460 → 0, korkeus 200). Ajo: node test_kartio_karki.js [polku kartio.html]
const fs = require('fs');
const path = require('path');
const polku = process.argv[2] || path.join(__dirname, '../../orders/kartio.html');
const html = fs.readFileSync(polku, 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const laskentaOsa = script.split('// ==== UI ====')[0];
const L = new Function(laskentaOsa + '; return { laskeKartio, kartioPisteet, laske };')();

let ok = 0, vika = 0;
function tarkista(nimi, ehto, lisa) { if (ehto) { ok++; console.log('ok    ' + nimi); } else { vika++; console.log('VIRHE: ' + nimi + (lisa ? ' → ' + lisa : '')); } }
function lahella(nimi, a, b, tol) { tarkista(nimi, Math.abs(a - b) <= (tol === undefined ? 0.05 : tol), 'saatiin ' + a + ', odotettiin ' + b); }

const s = { alaD: 460, ylaD: 0, H: 200, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, a1: 10, a2: 10, levyW: 1250, levyL: 5000 };
const k = L.laskeKartio(s);
tarkista('1a laskee ilman virheitä', !(k.virheet && k.virheet.length), JSON.stringify(k.virheet));
lahella('1b sivu = √(230² + 200²)', k.sl, Math.hypot(230, 200), 1e-9);
lahella('1c Rb = sivu (kärki origossa)', k.Rb, k.sl, 1e-9);
lahella('1d Rs = 0', k.Rs, 0, 1e-12);
lahella('1e kulma = 360 · 230 / sivu', k.theta, 360 * 230 / Math.hypot(230, 200), 1e-9);
lahella('1f iso kaari = π · 460', k.kaariIso, Math.PI * 460, 1e-9);
lahella('1g pieni kaari 0', k.kaariPieni, 0, 1e-12);
tarkista('1h huomautus kärjestä', k.huomautukset.some((x) => /terävä kärki/.test(x)));

// 0,1 mm (Tomin kiertotie) antaa käytännössä saman
const k01 = L.laskeKartio({ ...s, ylaD: 0.1 });
lahella('2a Rb lähes sama kuin 0,1 mm:llä', k.Rb, k01.Rb, 0.1);
lahella('2b kulma lähes sama', k.theta, k01.theta, 0.05);
lahella('2c kappaleen leveys lähes sama', k.ulkoRajat.w, k01.ulkoRajat.w, 0.5);

// sovite: alapää päälle toimii, kärkeen ei sovitetta
const ks = L.laskeKartio({ ...s, alaSovite: 'paalle', ylaSovite: 'sisaan' });
lahella('3a alapää päälle 461,5', ks.da, 461.5, 1e-9);
lahella('3b yläpää pysyy 0', ks.dy, 0, 1e-12);
tarkista('3c ei virhettä sovitteella', !(ks.virheet && ks.virheet.length));

// geometria: kaikki pisteet lukuja, pieni kaari kärjessä
const pts = L.kartioPisteet(k, 10, 10);
tarkista('4a ulkoreunan pisteet lukuja', pts.ulko.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])));
tarkista('4b pieni kaari origossa', pts.pieni.every((p) => Math.hypot(p[0], p[1]) < 1e-9));
tarkista('4c sijoitus ja osat olemassa', k.osat && k.osat.length === 1 && k.osat[0].sijoitus && Number.isFinite(k.osat[0].sijoitus.h));

// jako osiin toimii kärjellä
const k2 = L.laskeKartio({ ...s, saumat: [{ kulma: 0, ed: 10, seur: 10 }, { kulma: 180, ed: 10, seur: 10 }] });
tarkista('5a kaksi osaa', k2.osat && k2.osat.length === 2);
lahella('5b osien kulmat yhteensä', k2.osat[0].theta + k2.osat[1].theta, k.theta, 1e-9);

// virheet
tarkista('6a kärkeen ei huullosta', (L.laskeKartio({ ...s, huYla: 10 }).virheet || []).some((x) => /Kärkeen/.test(x)));
tarkista('6b alapää 0 on yhä virhe', (L.laskeKartio({ ...s, alaD: 0, ylaD: 300 }).virheet || []).length >= 1);
tarkista('6c negatiivinen yläpää on virhe', (L.laskeKartio({ ...s, ylaD: -5 }).virheet || []).length >= 1);
tarkista('6d isomman pään huullos kärjellä toimii', !(L.laskeKartio({ ...s, huAla: 15 }).virheet || []).length);
tarkista('6e laske() ohjaa pyöreään', L.laske({ ...s }).Rb > 0);

console.log(ok + ' tarkistusta läpi, ' + vika + ' virhettä');
console.log(vika === 0 ? 'KAIKKI TESTIT OK' : vika + ' VIRHETTÄ');
process.exit(vika === 0 ? 0 : 1);
