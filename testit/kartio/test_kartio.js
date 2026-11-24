// Kartion laskennan testit (vaihe 1a). Ajo: node test_kartio.js [polku kartio.html]
const fs = require('fs');
const path = require('path');
const polku = process.argv[2] || path.join(__dirname, '../../orders/kartio.html');
const html = fs.readFileSync(polku, 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const laskentaOsa = script.split('// ==== UI ====')[0];
const L = new Function(laskentaOsa + '; return {luku, rd, fmt, sovitettuD, laskeKartio, kartioPisteet, kierraPisteet, rajat, parasSijoitus, rakennaOsat, ehdotaJako, tasajako, laskeNelio, laske, ketjuMitat, huullokset, reunaSymmetrinen, puolikasMitat, nelioViivat, nelioKulmat, nelioRenkaat, nelioJono, reunaSijoitus, sijoitaOsa, suoratKetjut, sijAsetus, saumaTila, oletusPaikat, avaaJono, omaLeikkaus, dist3, PAIKAT};')();

let ok = 0, vika = 0;
function tarkista(nimi, ehto, lisa) { if (ehto) { ok++; console.log('ok    ' + nimi); } else { vika++; console.log('VIRHE: ' + nimi + (lisa ? ' → ' + lisa : '')); } }
function lahella(nimi, a, b, tol) { tarkista(nimi, Math.abs(a - b) <= (tol === undefined ? 0.05 : tol), 'saatiin ' + a + ', odotettiin ' + b); }

const oletus = { alaD: 400, ylaD: 200, H: 300, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, a1: 10, a2: 10, levyW: 1250, levyL: 5000 };

// 1. Syötteen luku
tarkista('1a pilkku', L.luku('0,5', 0) === 0.5);
tarkista('1b piste', L.luku('12.25', 0) === 12.25);
tarkista('1c tyhjä', L.luku('', 7) === 7);
tarkista('1d roskaa', L.luku('abc', 3) === 3);

// 2. Sovitteet (Putket-logiikka: kerran paksuus ja välys)
lahella('2a päälle 100', L.sovitettuD(100, 'paalle', 0.5, 1), 101.5, 1e-9);
lahella('2b sisään 100', L.sovitettuD(100, 'sisaan', 0.5, 1), 98.5, 1e-9);   // sama kuin Putket-sivun tulos 98.5
lahella('2c ei', L.sovitettuD(100, 'ei', 0.5, 1), 100, 1e-9);
lahella('2d päälle 600 t0.6 v1', L.sovitettuD(600, 'paalle', 0.6, 1), 601.6, 1e-9);
lahella('2e sisään 300 t0.6 v1', L.sovitettuD(300, 'sisaan', 0.6, 1), 298.4, 1e-9);

// 3. Käsinlaskettu esimerkki: Ø400 → Ø200, H300
let k = L.laskeKartio(oletus);
lahella('3a sivu', k.sl, 316.228, 0.001);
lahella('3b Rb', k.Rb, 632.456, 0.001);
lahella('3c Rs', k.Rs, 316.228, 0.001);
lahella('3d kulma', k.theta, 113.842, 0.001);
lahella('3e iso kaari', k.kaariIso, 1256.637, 0.001);
lahella('3f pieni kaari', k.kaariPieni, 628.319, 0.001);
lahella('3g jänne', k.janne, 1059.9, 0.1);
tarkista('3h isompi pää on ala', k.suuriPaa === 'ala');
// kaarten pituus kulmasta ja säteestä pitää täsmätä piiriin
lahella('3i Rb·θ = π·D1', k.Rb * k.theta * Math.PI / 180, k.kaariIso, 1e-6);
lahella('3j Rs·θ = π·D2', k.Rs * k.theta * Math.PI / 180, k.kaariPieni, 1e-6);
// kehitelmässä sivun pituus Rb − Rs = s
lahella('3k Rb − Rs = s', k.Rb - k.Rs, k.sl, 1e-9);
// ulkomitat ilman saumaa: sektori 113.8° → leveys = jänne, korkeus = Rb − Rs·cos(θ/2)
lahella('3l sektorin leveys', k.sektoriRajat.w, 1059.9, 0.1);
lahella('3m sektorin korkeus', k.sektoriRajat.h, 632.456 - 316.228 * Math.cos(113.842 / 2 * Math.PI / 180), 0.01);

// 4. Päätysovitteet: Ø600 päälle → 601.6, Ø300 sisään → 298.4, H400, t0.6 v1
k = L.laskeKartio({ alaD: 600, ylaD: 300, H: 400, alaSovite: 'paalle', ylaSovite: 'sisaan', t: 0.6, v: 1, a1: 10, a2: 10, levyW: 1250, levyL: 5000 });
lahella('4a da', k.da, 601.6, 1e-9);
lahella('4b dy', k.dy, 298.4, 1e-9);
lahella('4c sivu', k.sl, 427.765, 0.005);
lahella('4d Rb', k.Rb, 848.8, 0.05);
lahella('4e Rs', k.Rs, 421.0, 0.05);
lahella('4f kulma', k.theta, 127.58, 0.01);

// 5. Yläpää isompi: sama kartio ylösalaisin antaa saman levityksen
let a = L.laskeKartio({ ...oletus, alaD: 200, ylaD: 400 });
tarkista('5a suuri pää ylhäällä', a.suuriPaa === 'yla');
lahella('5b Rb sama', a.Rb, 632.456, 0.001);
lahella('5c kulma sama', a.theta, 113.842, 0.001);

// 6. Virheet
tarkista('6a sama halkaisija', (L.laskeKartio({ ...oletus, alaD: 300, ylaD: 300 }).virheet || []).length === 1);
tarkista('6b sovite tekee samaksi', (L.laskeKartio({ ...oletus, alaD: 100, ylaD: 100, alaSovite: 'paalle', ylaSovite: 'paalle' }).virheet || []).length === 1);
tarkista('6c korkeus 0', (L.laskeKartio({ ...oletus, H: 0 }).virheet || []).length === 1);
tarkista('6d halkaisija 0', (L.laskeKartio({ ...oletus, alaD: 0 }).virheet || []).length >= 1);
tarkista('6e sisään yli nollan', (L.laskeKartio({ ...oletus, ylaD: 1, ylaSovite: 'sisaan', t: 1, v: 1 }).virheet || []).length === 1);

// 7. Geometria: pisteet
k = L.laskeKartio(oletus);
const pts = L.kartioPisteet(k, 10, 10);
const r2 = (p) => Math.hypot(p[0], p[1]);
tarkista('7a iso kaari kaikki säteellä Rb', pts.iso.every((p) => Math.abs(r2(p) - k.Rb) < 1e-6));
tarkista('7b pieni kaari kaikki säteellä Rs', pts.pieni.every((p) => Math.abs(r2(p) - k.Rs) < 1e-6));
const ang = (p) => Math.atan2(p[1], p[0]) * 180 / Math.PI;
lahella('7c iso kaari alkaa kulmasta 0', ang(pts.iso[0]), 0, 1e-9);
lahella('7d iso kaari päättyy kulmaan θ', ang(pts.iso[pts.iso.length - 1]), k.theta, 1e-6);
// saumaliuskat: leveys 10 mm, pituus Rb − Rs
const fmt0 = (x) => String(Math.round(x * 10) / 10);
const d = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
lahella('7e liuska 1 pituus', d(pts.tab1[0], pts.tab1[1]), k.Rb - k.Rs, 1e-6);
lahella('7f liuska 1 leveys', d(pts.tab1[1], pts.tab1[2]), 10, 1e-6);
lahella('7g liuska 2 pituus', d(pts.tab2[0], pts.tab2[1]), k.Rb - k.Rs, 1e-6);
lahella('7h liuska 2 leveys', d(pts.tab2[1], pts.tab2[2]), 10, 1e-6);
// liuska 2 ei saa mennä sektorin sisään: sen uloimmat pisteet ovat kauempana kulmasta θ kuin reunat
const kehaPiste = (p) => ((ang(p) % 360) + 360) % 360;
tarkista('7i liuska 2 sektorin ulkopuolella', kehaPiste(pts.tab2[2]) > k.theta && kehaPiste(pts.tab2[2]) < k.theta + 30);
tarkista('7j liuska 1 sektorin ulkopuolella', ang(pts.tab1[2]) < 0);
// saumalisä 0 → liuskat nollaleveitä
const p0 = L.kartioPisteet(k, 0, 0);
lahella('7k ei saumaa, leveys 0', d(p0.tab1[1], p0.tab1[2]), 0, 1e-9);

// 8. Ulkomitat saumalisän kanssa ovat suuremmat
tarkista('8a sauma kasvattaa mittoja', k.ulkoRajat.w >= k.sektoriRajat.w - 1e-6 && k.ulkoRajat.h >= k.sektoriRajat.h - 1e-6);
const ilman = L.laskeKartio({ ...oletus, a1: 0, a2: 0 });
lahella('8b ilman saumaa ulkomitat = sektori w', ilman.ulkoRajat.w, ilman.sektoriRajat.w, 1e-6);
lahella('8c ilman saumaa ulkomitat = sektori h', ilman.ulkoRajat.h, ilman.sektoriRajat.h, 1e-6);

// 9. Sijoitus pellille
k = L.laskeKartio(oletus);
tarkista('9a mahtuu rullalle 1250', k.sijoitus.sopii === true && k.sijoitus.w <= 1250 + 1e-6);
tarkista('9b pituus rajoissa', k.sijoitus.h <= 5000);
// sijoituksen pisteet alkavat nollasta
const sb = L.rajat(k.sijoitus.pisteet);
lahella('9c sijoitus x0', sb.x0, 0, 1e-6);
lahella('9d sijoitus y0', sb.y0, 0, 1e-6);
lahella('9e sijoituksen w', sb.w, k.sijoitus.w, 1e-6);
// kierto ei vääristä kappaletta: kahden pisteen etäisyys säilyy
lahella('9f etäisyys säilyy', d(k.sijoitus.pisteet[0], k.sijoitus.pisteet[5]), d(k.kuva.ulko[0], k.kuva.ulko[5]), 1e-6);
// liian iso: Ø1500 → Ø400, H300 ei mahdu 1250 leveälle eikä lyhyelle levylle
const iso = L.laskeKartio({ ...oletus, alaD: 1500, ylaD: 400 });
tarkista('9g iso kartio ei mahdu 1250/2500', L.laskeKartio({ ...oletus, alaD: 1500, ylaD: 400, levyW: 1250, levyL: 2500 }).sijoitus.sopii === false);
tarkista('9h varoitus tulee', L.laskeKartio({ ...oletus, alaD: 1500, ylaD: 400, levyW: 1250, levyL: 2500 }).huomautukset.some((x) => /Ei mahdu/.test(x)));
// levy: pieni kartio mahtuu 1250×2500
tarkista('9i levylle mahtuu', L.laskeKartio({ ...oletus, levyW: 1250, levyL: 2500 }).sijoitus.sopii === true);
// pelkkä kierto 90° vaihtaa mitat: kapea levy 1000 × 1500 → kappale 1060 leveä pitää kääntää tai ei mahdu
const kapea = L.laskeKartio({ ...oletus, a1: 0, a2: 0, levyW: 1000, levyL: 1500 });
tarkista('9j kapea levy: tuloksena joko mahtuu kääntämällä tai varoitus', kapea.sijoitus.sopii ? (kapea.sijoitus.w <= 1000 + 1e-6 && kapea.sijoitus.h <= 1500 + 1e-6) : kapea.huomautukset.length > 0);

// 10. Kulma yli 180° → huomautus
const jyrkka = L.laskeKartio({ alaD: 1000, ylaD: 100, H: 50, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, a1: 10, a2: 10, levyW: 5000, levyL: 5000 });
tarkista('10a kulma > 180', jyrkka.theta > 180);
tarkista('10b huomautus kulmasta', jyrkka.huomautukset.some((x) => /yli 180/.test(x)));
// lähes sylinteri: pitkä, kapea kartio, kulma pieni
const kapea2 = L.laskeKartio({ alaD: 210, ylaD: 200, H: 1000, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, a1: 10, a2: 10, levyW: 1250, levyL: 5000 });
tarkista('10c kapea kartio kulma < 10°', kapea2.theta < 10);
tarkista('10d kapea kartio ei kaadu', isFinite(kapea2.Rb) && kapea2.sijoitus.sopii === true);


// ===== 11. Osat ja saumat (vaihe 1b) =====
const pe = (n, ed, seur) => L.tasajako(n, ed === undefined ? 10 : ed, seur === undefined ? 10 : seur);
const rad = (x) => x * Math.PI / 180;
// 11a: oletus (ei saumat-kenttää) = yksi osa
k = L.laskeKartio(oletus);
tarkista('11a oletuksella yksi osa', k.osat.length === 1 && k.ryhmat.length === 1);
lahella('11b yhden osan kulma = koko kulma', k.osat[0].theta, k.theta, 1e-9);
lahella('11c a1 = 10', k.osat[0].a1, 10, 1e-9);

// 11d: tasajako 3 osaan: Ø400→Ø200 H300
let k3 = L.laskeKartio({ ...oletus, saumat: pe(3) });
tarkista('11d kolme osaa', k3.osat.length === 3);
tarkista('11e kolme samanlaista = yksi ryhmä, 3 kpl', k3.ryhmat.length === 1 && k3.ryhmat[0].kpl === 3);
lahella('11f osan kulma = θ/3', k3.osat[0].theta, 113.842 / 3, 0.001);
lahella('11g kulmien summa = θ', k3.osat.reduce((a, o) => a + o.theta, 0), k3.theta, 1e-9);
lahella('11h isojen kaarien summa = π·D1', k3.osat.reduce((a, o) => a + o.kaariIso, 0), Math.PI * 400, 1e-6);
lahella('11i pienten kaarien summa = π·D2', k3.osat.reduce((a, o) => a + o.kaariPieni, 0), Math.PI * 200, 1e-6);
lahella('11j osan iso kaari = π·D1/3', k3.osat[1].kaariIso, Math.PI * 400 / 3, 1e-6);
lahella('11k osan jänne', k3.osat[0].janne, 2 * k3.Rb * Math.sin(rad(113.842 / 6)), 0.001);
// osan reunat 10 mm saumalisää
{
  const p = L.kartioPisteet(k3.osat[0], k3.osat[0].a1, k3.osat[0].a2);
  const dd = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  lahella('11l osan liuska 1 leveys', dd(p.tab1[1], p.tab1[2]), 10, 1e-6);
}

// 11m: epätasainen jako kulmilla 0, 90, 270 → osat 90°, 180°, 90°
let ke = L.laskeKartio({ ...oletus, saumat: [{ kulma: 0, ed: 10, seur: 10 }, { kulma: 90, ed: 10, seur: 10 }, { kulma: 270, ed: 10, seur: 10 }] });
lahella('11m osa 1 = θ/4', ke.osat[0].theta, k.theta * 0.25, 1e-9);
lahella('11n osa 2 = θ/2', ke.osat[1].theta, k.theta * 0.5, 1e-9);
lahella('11o osa 3 = θ/4', ke.osat[2].theta, k.theta * 0.25, 1e-9);
tarkista('11p osat 1 ja 3 samaa ryhmää', ke.ryhmat.length === 2 && ke.osat[0].ryhma === ke.osat[2].ryhma && ke.osat[1].ryhma !== ke.osat[0].ryhma);
tarkista('11q ryhmän kpl', ke.ryhmat[ke.osat[0].ryhma].kpl === 2);
// 11r: järjestämättömät kulmat annetaan sorttiin
let kj = L.laskeKartio({ ...oletus, saumat: [{ kulma: 270, ed: 10, seur: 10 }, { kulma: 0, ed: 10, seur: 10 }, { kulma: 90, ed: 10, seur: 10 }] });
lahella('11r sortattu: osa 2 = θ/2', kj.osat[1].theta, k.theta * 0.5, 1e-9);
// 11s: kulma 360 = 0 (mod), negatiivinen kulma kääntyy
let kn = L.laskeKartio({ ...oletus, saumat: [{ kulma: -90, ed: 10, seur: 10 }, { kulma: 90, ed: 10, seur: 10 }] });
tarkista('11s negatiivinen kulma (−90 = 270)', kn.osat.length === 2 && Math.abs(kn.osat[0].theta - k.theta / 2) < 1e-9);
// 11t: kaksi samaan kohtaan → virhe
tarkista('11t sama kohta antaa virheen', (L.laskeKartio({ ...oletus, saumat: [{ kulma: 0, ed: 10, seur: 10 }, { kulma: 360, ed: 10, seur: 10 }] }).virheet || []).length === 1);
tarkista('11u lähes sama kohta antaa virheen', (L.laskeKartio({ ...oletus, saumat: [{ kulma: 10, ed: 10, seur: 10 }, { kulma: 10.001, ed: 10, seur: 10 }] }).virheet || []).length === 1);

// 11v: saumalisät kulkevat oikealle reunalle. Sauma j: ed = edellisen osan loppureuna, seur = seuraavan osan alkureuna.
let ks = L.laskeKartio({ ...oletus, saumat: [{ kulma: 0, ed: 5, seur: 15 }, { kulma: 180, ed: 20, seur: 8 }] });
// osa 1 (0→180): alkureuna sauma 1 seur = 15, loppureuna sauma 2 ed = 20
lahella('11v osa 1 a1 = sauma1.seur', ks.osat[0].a1, 15, 1e-9);
lahella('11w osa 1 a2 = sauma2.ed', ks.osat[0].a2, 20, 1e-9);
// osa 2 (180→360): alkureuna sauma 2 seur = 8, loppureuna sauma 1 ed = 5
lahella('11x osa 2 a1 = sauma2.seur', ks.osat[1].a1, 8, 1e-9);
lahella('11y osa 2 a2 = sauma1.ed', ks.osat[1].a2, 5, 1e-9);
tarkista('11z eri saumalisät → kaksi ryhmää', ks.ryhmat.length === 2);
tarkista('11å sauma-numerot', ks.osat[1].sauma1 === 2 && ks.osat[1].sauma2 === 1);

// 12. Pellille mahtuminen: iso kartio jaetaan
const isoS = { ...oletus, alaD: 1500, ylaD: 400, H: 400, levyW: 1250, levyL: 2500 };
const iso1 = L.laskeKartio(isoS);
tarkista('12a yksi osa ei mahdu', iso1.kaikkiMahtuu === false);
tarkista('12b huomautus ehdottaa jakoa', iso1.huomautukset.some((x) => /Tasajaolla \d osaa/.test(x)));
const ehd = L.ehdotaJako(iso1, 1250, 2500, 10, 10);
tarkista('12c ehdotus on luku 2–8', ehd >= 2 && ehd <= 8, 'saatiin ' + ehd);
const isoJaettu = L.laskeKartio({ ...isoS, saumat: pe(ehd) });
tarkista('12d ehdotetulla jaolla kaikki mahtuvat', isoJaettu.kaikkiMahtuu === true);
tarkista('12e ehdotettu on pienin: yhtä vähemmällä ei mahdu', ehd === 1 || L.laskeKartio({ ...isoS, saumat: pe(ehd - 1) }).kaikkiMahtuu === false);
tarkista('12f osien määrä täsmää', isoJaettu.osat.length === ehd);
// pelinkulutus on osien summa
lahella('12g pellinkulutus = osien pituuksien summa', isoJaettu.pellinKulutus, isoJaettu.osat.reduce((a, o) => a + o.sijoitus.h, 0), 1e-9);
// ei mahdu edes 8 osalla: valtava kartio, kapea pelti
const mahdoton = L.laskeKartio({ ...oletus, alaD: 6000, ylaD: 5000, H: 3000, levyW: 200, levyL: 300 });
tarkista('12h mahdoton → ei ehdotusta', mahdoton.huomautukset.some((x) => /Edes 8 osalla/.test(x)));

// 13. Kulma yli 180° osassa: jaon jälkeen kulma pienenee, huomautus katoaa
const j1 = L.laskeKartio({ alaD: 1000, ylaD: 100, H: 50, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, levyW: 5000, levyL: 5000, saumat: pe(1) });
const j2 = L.laskeKartio({ alaD: 1000, ylaD: 100, H: 50, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, levyW: 5000, levyL: 5000, saumat: pe(2) });
tarkista('13a yksi osa >180°', j1.huomautukset.some((x) => /yli 180/.test(x)));
tarkista('13b kaksi osaa ≤180°, ei huomautusta', !j2.huomautukset.some((x) => /yli 180/.test(x)));
tarkista('13c osan kulma puolittuu', Math.abs(j2.osat[0].theta - j1.theta / 2) < 1e-9);

// 14. Osan geometria: kuvan pisteet vastaavat osan kulmaa
{
  const o = k3.osat[1];
  const pt = L.kartioPisteet(o, o.a1, o.a2);
  const ang = (p) => Math.atan2(p[1], p[0]) * 180 / Math.PI;
  lahella('14a osan iso kaari päättyy kulmaan θ_osa', ang(pt.iso[pt.iso.length - 1]), o.theta, 1e-6);
  tarkista('14b sijoitus on olemassa jokaiselle osalle', k3.osat.every((x) => x.sijoitus && x.sijoitus.pisteet.length > 4));
}

// ===== 15. Nelikulmio → pyöreä (vaihe 2) =====
const nel = { muoto: 'nelio', W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, levyW: 1250, levyL: 5000, saumat: [{ paikka: 0, ed: 10, seur: 10 }] };
const dd2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
let nk = L.laskeNelio(nel);
tarkista('15a laskenta onnistuu', !(nk.virheet && nk.virheet.length));
tarkista('15b yksi osa', nk.osat.length === 1);

// 15c: renkaat
{
  const r = L.nelioRenkaat(600, 400, 300, 400, 6, 0, 0);
  tarkista('15c alarengas 8 pistettä', r.A.length === 8);
  tarkista('15d ylärengas 4·(N−1) = 20 pistettä', r.B.length === 20);
  tarkista('15e kaikki ylärenkaan pisteet säteellä 150', r.B.every((p) => Math.abs(Math.hypot(p[0], p[1]) - 150) < 1e-9 && p[2] === 400));
  lahella('15f S-piste etu', r.B[0][1], -150, 1e-9);
  lahella('15g S-piste oikea (indeksi N−1)', r.B[5][0], 150, 1e-9);
  tarkista('15h alarengas z = 0', r.A.every((p) => p[2] === 0));
  const rN2 = L.nelioRenkaat(600, 400, 300, 400, 2, 0, 0);
  tarkista('15i N = 2: ylärengas 4 pistettä', rN2.B.length === 4);
}
// 15j: kolmiojono
{
  const j = L.nelioJono(6);
  tarkista('15j kolmioita 4N+4 = 28', j.askeleet.length === 28);
  tarkista('15k jono sulkeutuu (viimeinen tila = ensimmäinen)', j.tilat[28][0] === 0 && j.tilat[28][1] === 0);
  tarkista('15l alareunan A-askeleita 8', j.askeleet.filter((x) => x.k === 'A').length === 8);
  tarkista('15m B-askeleita 4(N−1) = 20', j.askeleet.filter((x) => x.k === 'B').length === 20);
  tarkista('15n jokainen saumapaikka löytyy täsmälleen kerran', [0, 1, 2, 3, 4, 5, 6, 7].every((k) => {
    const tl = L.saumaTila(k, 6);
    return j.tilat.slice(0, 28).filter((x) => x[0] === tl[0] && x[1] === tl[1]).length === 1;
  }));
  for (const N of [2, 3, 4, 7, 12]) {
    const jj = L.nelioJono(N);
    tarkista('15o N=' + N + ' kolmioita 4N+4', jj.askeleet.length === 4 * N + 4);
    tarkista('15p N=' + N + ' saumapaikat löytyvät', [0, 1, 2, 3, 4, 5, 6, 7].every((k) => {
      const tl = L.saumaTila(k, N);
      return jj.tilat.slice(0, jj.tilat.length - 1).filter((x) => x[0] === tl[0] && x[1] === tl[1]).length === 1;
    }));
  }
}
// 15q: käsinlaskettu esimerkki 600×400 → Ø300 H400 N6 (prototyypistä)
{
  const o = nk.osat[0];
  const Ap = o.kuva.Ap, Bp = o.kuva.Bp;
  lahella('15q alareunan pituus kehityksessä = 2(W+D)', o.pitA, 2000, 1e-6);
  lahella('15r yläreunan monikulmio', o.pitB, 938.6, 0.1);
  lahella('15s yläreunan monikulmio = 20 sivua ympyrään piirrettynä', nk.ylaMonikulmio, 938.6, 0.1);
  lahella('15t alkureuna 3D', o.reunaPit1, 403.113, 0.001);
  lahella('15u loppureuna 3D = alkureuna', o.reunaPit2, 403.113, 0.001);
  lahella('15v nurkka 1 viiva 1 (sivu etu)', nk.nurkkaviivat[0][0], 502.5, 0.05);
  lahella('15w nurkka 1 viiva 2', nk.nurkkaviivat[0][1], 477.1, 0.05);
  lahella('15x nurkka 1 viiva 3', nk.nurkkaviivat[0][2], 459.4, 0.05);
  lahella('15y nurkka 1 viiva 4', nk.nurkkaviivat[0][3], 452.1, 0.05);
  lahella('15z nurkka 1 viiva 5', nk.nurkkaviivat[0][4], 456.5, 0.05);
  lahella('15å nurkka 1 viiva 6 (sivu oikea)', nk.nurkkaviivat[0][5], 471.7, 0.05);
  lahella('15ä sivukeskiviiva etu', nk.sivukeskiviivat[0], 403.1, 0.05);
  lahella('15ö sivukeskiviiva oikea', nk.sivukeskiviivat[1], 427.2, 0.05);
  tarkista('16a viivat nurkka-numeroituna 4 kpl, N viivaa kullakin', nk.nurkkaviivat.length === 4 && nk.nurkkaviivat.every((x) => x.length === 6));
  // nurkan kulma kehityksessä: alareunan kulma pisteessä Ap[1] (nurkka 1)
  const ang = (p, q, r) => { const a = [q[0] - p[0], q[1] - p[1]], b = [r[0] - p[0], r[1] - p[1]]; return Math.acos((a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b))) * 180 / Math.PI; };
  lahella('16b nurkan kulma kehityksessä', ang(Ap[1].p, Ap[0].p, Ap[2].p), 145.4, 0.1);
  tarkista('16c ei itseleikkausta', o.leikkaa === false && nk.huomautukset.length === 0);
  // pienin mitta pellillä (prototyypin 0,5° askel): 653 × 1472
  // rulla 1250: valitaan lyhin pituus, jolla leveys ≤ 1250. Tarkistus riippumattomalla silmukalla.
  {
    let paras = Infinity;
    for (let a = 0; a < 180; a += 0.5) { const q = L.rajat(L.kierraPisteet(o.kuva.ulko, a)); if (q.w <= 1250 && q.h < paras) paras = q.h; }
    const nkS = L.laskeNelio({ ...nel, sijoitusTila: 'saasta' });
    lahella('16d lyhin pituus rullalla 1250 (säästä pellissä)', nkS.sijoitus.h, paras, 1e-6);
    tarkista('16e leveys ≤ 1250', nkS.sijoitus.w <= 1250 + 1e-6);
    tarkista('16d2 säästötila on merkitty', nkS.sijoitus.tila === 'saasta');
  }
  tarkista('16f mahtuu 1250 rullalle', nk.kaikkiMahtuu === true);
  // kapea rulla 700: pienin leveys on noin 653 (prototyyppi), pituus silloin noin 1472
  const kapea = L.laskeNelio({ ...nel, levyW: 700, sijoitusTila: 'saasta' });
  tarkista('16i mahtuu 700 leveälle', kapea.kaikkiMahtuu === true && kapea.sijoitus.w <= 700 + 1e-6);
  tarkista('16j kapealla rullalla pituus kasvaa', kapea.sijoitus.h > L.laskeNelio({ ...nel, sijoitusTila: 'saasta' }).sijoitus.h + 100);
  // ilman saumalisää pienin leveys on prototyypin 652.9 mm
  const nolla = [{ paikka: 0, ed: 0, seur: 0 }];
  tarkista('16k 640 leveälle ei mahdu (ei saumalisää)', L.laskeNelio({ ...nel, saumat: nolla, levyW: 640, eiEhdotusta: true }).kaikkiMahtuu === false);
  { const x = L.laskeNelio({ ...nel, saumat: nolla, levyW: 660, sijoitusTila: 'saasta' }); tarkista('16l 660 leveälle mahtuu (ei saumalisää)', x.kaikkiMahtuu && x.sijoitus.w <= 660 && x.sijoitus.w >= 652.8); }
  lahella('16m pituus silloin ~1472', L.laskeNelio({ ...nel, saumat: nolla, levyW: 660, sijoitusTila: 'saasta' }).sijoitus.h, 1471.8, 40);
}
// 16g: kehityksen sisäinen johdonmukaisuus: jokaisen kolmion kaikki sivut = 3D-pituudet
{
  const o = nk.osat[0];
  let ok2 = true, pahin = 0;
  const pos3 = (tag) => tag.k === 'A' ? nk.A[tag.i] : nk.B[tag.i];
  o.kuva.tris.forEach((tr) => {
    // kolmion kärjet: a (A-pisteen ia), b (B-pisteen ib), p (uusi, A tai B)
    const va = nk.A[tr.ia], vb = nk.B[tr.ib], vp = tr.kind === 'A' ? nk.A[tr.idx] : nk.B[tr.idx];
    const e = [Math.abs(dd2(tr.a, tr.b) - L.dist3(va, vb)), Math.abs(dd2(tr.a, tr.p) - L.dist3(va, vp)), Math.abs(dd2(tr.b, tr.p) - L.dist3(vb, vp))];
    pahin = Math.max(pahin, ...e);
    if (Math.max(...e) > 1e-6) ok2 = false;
  });
  tarkista('16g kaikki kolmion sivut täsmäävät 3D-pituuksiin', ok2, 'pahin ero ' + pahin);
}
// 16h: ensimmäisen kolmion 3D-normaali osoittaa sisäänpäin → piirros (SVG, y alaspäin) näyttää ulkopinnan
{
  const r = nk;
  const va = r.A[0], vb = r.B[0], vp = r.A[1];
  const u = [vb[0] - va[0], vb[1] - va[1], vb[2] - va[2]], w = [vp[0] - va[0], vp[1] - va[1], vp[2] - va[2]];
  const nrm = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  const kesk = [(va[0] + vb[0] + vp[0]) / 3, (va[1] + vb[1] + vp[1]) / 3];
  tarkista('16h normaali osoittaa kohti akselia (sisäänpäin)', nrm[0] * kesk[0] + nrm[1] * kesk[1] < 0);
}
// 17: N:n vaikutus: yläreunan monikulmio lähestyy ympyrää
{
  const err = (N) => Math.abs(L.laskeNelio({ ...nel, N }).ylaMonikulmio - Math.PI * 300) / (Math.PI * 300);
  tarkista('17a N=12 tarkempi kuin N=3', err(12) < err(3));
  tarkista('17b N=12 virhe < 0,1 %', err(12) < 0.001, 'virhe ' + err(12));
  tarkista('17c N=2 virhe suurin', err(2) > err(3));
  for (const N of [2, 3, 5, 8, 12]) {
    const x = L.laskeNelio({ ...nel, N });
    lahella('17d N=' + N + ' alareuna 2000', x.osat[0].pitA, 2000, 1e-6);
    tarkista('17e N=' + N + ' ei itseleikkausta', !x.osat[0].leikkaa);
    lahella('17f N=' + N + ' alku- ja loppureuna sama', x.osat[0].reunaPit1, x.osat[0].reunaPit2, 1e-9);
  }
}
// 18: sovite nelikulmiolle ja ylärenkaalle
{
  const x = L.laskeNelio({ ...nel, alaSovite: 'sisaan', ylaSovite: 'paalle' });
  lahella('18a W sisään = 598.5', x.W, 598.5, 1e-9);
  lahella('18b D sisään = 398.5', x.D, 398.5, 1e-9);
  lahella('18c yläpää päälle = 301.5', x.d, 301.5, 1e-9);
  const y = L.laskeNelio({ ...nel, alaSovite: 'paalle' });
  lahella('18d W päälle = 601.5', y.W, 601.5, 1e-9);
  lahella('18e alareuna = 2(W+D)', y.osat[0].pitA, 2 * (601.5 + 401.5), 1e-6);
}
// 19: saumat ja osat
{
  const tasa = (n, ed, seur) => L.oletusPaikat(n).map((p) => ({ paikka: p, ed: ed === undefined ? 10 : ed, seur: seur === undefined ? 10 : seur }));
  tarkista('19a oletuspaikat n=1', JSON.stringify(L.oletusPaikat(1)) === '[0]');
  tarkista('19b oletuspaikat n=2 (etu ja taka)', JSON.stringify(L.oletusPaikat(2)) === '[0,4]');
  tarkista('19c oletuspaikat n=4 (sivujen keskikohdat)', JSON.stringify(L.oletusPaikat(4)) === '[0,2,4,6]');
  tarkista('19d oletuspaikat n=8 kaikki', JSON.stringify(L.oletusPaikat(8)) === '[0,1,2,3,4,5,6,7]');
  const n2 = L.laskeNelio({ ...nel, saumat: tasa(2) });
  tarkista('19e kaksi osaa', n2.osat.length === 2);
  tarkista('19f kaksi osaa keskitetyllä ympyrällä ovat samanlaisia → yksi ryhmä (2 kpl)', n2.ryhmat.length === 1 && n2.ryhmat[0].kpl === 2);
  lahella('19g osien alareunat yhteensä 2(W+D)', n2.osat[0].pitA + n2.osat[1].pitA, 2000, 1e-6);
  lahella('19h osien yläreunat yhteensä', n2.osat[0].pitB + n2.osat[1].pitB, nk.ylaMonikulmio, 1e-6);
  lahella('19i osa 1 alareuna 1000', n2.osat[0].pitA, 1000, 1e-6);
  tarkista('19j kaksi osaa lyhyempi pellillä kuin yksi', n2.osat[0].sijoitus.h < nk.sijoitus.h);
  const n4 = L.laskeNelio({ ...nel, W: 500, D: 500, saumat: tasa(4) });
  tarkista('19k neliö, 4 saumaa sivujen keskellä: 4 samanlaista', n4.ryhmat.length === 1 && n4.ryhmat[0].kpl === 4);
  const n4n = L.laskeNelio({ ...nel, W: 500, D: 500, saumat: [1, 3, 5, 7].map((p) => ({ paikka: p, ed: 10, seur: 10 })) });
  tarkista('19l neliö, 4 saumaa nurkissa: 4 samanlaista', n4n.ryhmat.length === 1 && n4n.ryhmat[0].kpl === 4);
  lahella('19m nurkkasaumoilla osan alareuna 500', n4n.osat[0].pitA, 500, 1e-6);
  // sama paikka kahdesti
  tarkista('19n sama paikka kahdesti → virhe', (L.laskeNelio({ ...nel, saumat: [{ paikka: 2, ed: 10, seur: 10 }, { paikka: 2, ed: 10, seur: 10 }] }).virheet || []).length === 1);
  // järjestys ei vaikuta
  const jarj = L.laskeNelio({ ...nel, saumat: [{ paikka: 4, ed: 10, seur: 10 }, { paikka: 0, ed: 10, seur: 10 }] });
  tarkista('19o syötön järjestys ei vaikuta', jarj.osat.length === 2 && Math.abs(jarj.osat[0].pitA - n2.osat[0].pitA) < 1e-9);
  // sauman paikka vaikuttaa: etusivu vs. oikea sivu (suorakulmio, eri sivun pituudet)
  const e1 = L.laskeNelio({ ...nel, saumat: [{ paikka: 0, ed: 10, seur: 10 }] });
  const e2 = L.laskeNelio({ ...nel, saumat: [{ paikka: 2, ed: 10, seur: 10 }] });
  tarkista('19p eri saumapaikka → eri reunapituus', Math.abs(e1.osat[0].reunaPit1 - e2.osat[0].reunaPit1) > 10);
  lahella('19q sauma oikealla sivulla: reunapituus 427.2', e2.osat[0].reunaPit1, 427.2, 0.05);
  // saumalisät oikeille reunoille
  const sl = L.laskeNelio({ ...nel, saumat: [{ paikka: 0, ed: 5, seur: 15 }, { paikka: 4, ed: 20, seur: 8 }] });
  lahella('19r osa 1 a1 = sauma1.seur', sl.osat[0].a1, 15, 1e-9);
  lahella('19s osa 1 a2 = sauma2.ed', sl.osat[0].a2, 20, 1e-9);
  lahella('19t osa 2 a1 = sauma2.seur', sl.osat[1].a1, 8, 1e-9);
  lahella('19u osa 2 a2 = sauma1.ed', sl.osat[1].a2, 5, 1e-9);
  tarkista('19v eri saumalisät → kaksi ryhmää', sl.ryhmat.length === 2);
  // liuskat: leveys = saumalisä, pituus = reunan pituus
  const tb = sl.osat[0].kuva.tab1;
  lahella('19w liuska 1 leveys', dd2(tb[1], tb[2]), 15, 1e-9);
  lahella('19x liuska 1 pituus = reuna', dd2(tb[0], tb[1]), sl.osat[0].reunaPit1, 1e-9);
  lahella('19y liuska 2 leveys', dd2(sl.osat[0].kuva.tab2[1], sl.osat[0].kuva.tab2[2]), 20, 1e-9);
  // liuska on osan ulkopuolella: liuskan kärjet eivät ole perus-ääriviivan sisällä (pisteen sijainti suhteessa ensimmäiseen kolmioon)
  {
    const o = sl.osat[0], tr = o.kuva.tris[0];
    const ss = (a, b, q) => (b[0] - a[0]) * (q[1] - a[1]) - (b[1] - a[1]) * (q[0] - a[0]);
    tarkista('19z liuska 1 on kolmion vastakkaisella puolella', ss(o.kuva.tab1[0], o.kuva.tab1[1], o.kuva.tab1[2]) * ss(tr.a, tr.b, tr.p) < 0);
  }
  // pienen osan kulutus pienenee kun osia lisätään
  const n3 = L.laskeNelio({ ...nel, saumat: tasa(3) });
  tarkista('19å kolme osaa', n3.osat.length === 3);
  tarkista('19ä sauma nurkassa: reunapituus nurkkaviivan pituus', Math.abs(L.laskeNelio({ ...nel, saumat: [{ paikka: 1, ed: 10, seur: 10 }] }).osat[0].reunaPit1 - nk.nurkkaviivat[0][3]) < 1e-9);
}
// 20: ympyrän siirto
{
  const sj = L.laskeNelio({ ...nel, ox: 60, oy: -40 });
  tarkista('20a siirretty ympyrä laskee', !(sj.virheet && sj.virheet.length));
  lahella('20b siirto ei muuta alareunaa', sj.osat[0].pitA, 2000, 1e-6);
  tarkista('20c siirto muuttaa viivojen pituuksia', Math.abs(sj.nurkkaviivat[0][0] - nk.nurkkaviivat[0][0]) > 1);
  lahella('20d ylärenkaan keskipiste siirtynyt (S oikea)', sj.B[5][0], 60 + 150, 1e-9);
  lahella('20e ylärenkaan keskipiste siirtynyt (S etu y)', sj.B[0][1], -40 - 150, 1e-9);
  tarkista('20f kaikki kolmiot täsmäävät 3D:hen siirrolla', sj.osat[0].kuva.tris.every((tr) => {
    const va = sj.A[tr.ia], vb = sj.B[tr.ib], vp = tr.kind === 'A' ? sj.A[tr.idx] : sj.B[tr.idx];
    return Math.abs(dd2(tr.a, tr.b) - L.dist3(va, vb)) < 1e-6 && Math.abs(dd2(tr.a, tr.p) - L.dist3(va, vp)) < 1e-6 && Math.abs(dd2(tr.b, tr.p) - L.dist3(vb, vp)) < 1e-6;
  }));
  tarkista('20g siirto 60/−40 ei itseleikkausta', !sj.osat[0].leikkaa);
  // seinäkiinnitteinen: taka-reuna linjassa: oy = (D − d)/2 ylhäältä katsottuna taka (y=+D/2 → ympyrän reuna y = oy + 150 = 200 → oy = 50)
  const sein = L.laskeNelio({ ...nel, oy: 50 });
  lahella('20h takareuna linjassa: S taka y = D/2', sein.B[10][1], 200, 1e-9);
  lahella('20i taka-sivukeskiviiva = korkeus (suora seinä)', sein.sivukeskiviivat[2], 400, 1e-9);
  tarkista('20j seinämalli ei itseleikkausta', !sein.osat[0].leikkaa);
}
// 21: itseleikkaus-tarkistus toimii
{
  tarkista('21a kahdeksikko leikkaa', L.omaLeikkaus([[0, 0], [10, 10], [10, 0], [0, 10]]) === true);
  tarkista('21b neliö ei leikkaa', L.omaLeikkaus([[0, 0], [10, 0], [10, 10], [0, 10]]) === false);
  tarkista('21c L-muoto ei leikkaa', L.omaLeikkaus([[0, 0], [10, 0], [10, 5], [5, 5], [5, 10], [0, 10]]) === false);
}
// 22: virheet ja reunatapaukset
{
  tarkista('22a leveys 0', (L.laskeNelio({ ...nel, W: 0 }).virheet || []).length >= 1);
  tarkista('22b halkaisija 0', (L.laskeNelio({ ...nel, ylaD: 0 }).virheet || []).length >= 1);
  tarkista('22c korkeus 0', (L.laskeNelio({ ...nel, H: 0 }).virheet || []).length >= 1);
  tarkista('22d sovite tekee mitan negatiiviseksi', (L.laskeNelio({ ...nel, ylaD: 1, ylaSovite: 'sisaan', t: 1, v: 1 }).virheet || []).length === 1);
  // N rajataan 2–12
  tarkista('22e N=1 → 2', L.laskeNelio({ ...nel, N: 1 }).N === 2);
  tarkista('22f N=99 → 12', L.laskeNelio({ ...nel, N: 99 }).N === 12);
  // ylempi pää isompi kuin alapää (esim. 200×100 → Ø400)
  const iso = L.laskeNelio({ ...nel, W: 200, D: 100, ylaD: 400, H: 300 });
  tarkista('22g ylä isompi kuin ala laskee ilman virhettä', !(iso.virheet && iso.virheet.length) && !iso.osat[0].leikkaa);
  lahella('22h alareuna 600', iso.osat[0].pitA, 600, 1e-6);
  // neliö, ympyrä sama kuin sivu
  const sama = L.laskeNelio({ ...nel, W: 300, D: 300, ylaD: 300, H: 200 });
  tarkista('22i neliö 300 → Ø300 laskee', !(sama.virheet && sama.virheet.length) && sama.osat[0].pitA > 0);
  // laske() valitsee oikean
  tarkista('22j laske() ohjaa nelioon', L.laske({ ...nel }).tyyppi === 'nelio');
  tarkista('22k laske() ohjaa pyöreään', L.laske({ ...oletus }).tyyppi === undefined && L.laske({ ...oletus }).Rb > 0);
}
// 23: pellille mahtuminen ja ehdotus
{
  const iso = L.laskeNelio({ ...nel, W: 1400, D: 1000, ylaD: 700, H: 600, levyW: 1250, levyL: 2500 });
  tarkista('23a iso ei mahdu yhtenä kappaleena', iso.kaikkiMahtuu === false);
  tarkista('23b ehdotus jaosta', iso.huomautukset.some((x) => /Tasajaolla \d osaa/.test(x)), JSON.stringify(iso.huomautukset));
  const m = (iso.huomautukset.join(' ').match(/Tasajaolla (\d) osaa/) || [])[1];
  if (m) {
    const jaettu = L.laskeNelio({ ...nel, W: 1400, D: 1000, ylaD: 700, H: 600, levyW: 1250, levyL: 2500, saumat: L.oletusPaikat(+m).map((p) => ({ paikka: p, ed: 10, seur: 10 })) });
    tarkista('23c ehdotetulla jaolla kaikki mahtuvat', jaettu.kaikkiMahtuu === true);
    tarkista('23d ehdotettu on pienin', +m === 1 || L.laskeNelio({ ...nel, W: 1400, D: 1000, ylaD: 700, H: 600, levyW: 1250, levyL: 2500, saumat: L.oletusPaikat(+m - 1).map((p) => ({ paikka: p, ed: 10, seur: 10 })) }).kaikkiMahtuu === false);
  }
  const mahdoton = L.laskeNelio({ ...nel, W: 6000, D: 5000, ylaD: 3000, H: 2000, levyW: 200, levyL: 300 });
  tarkista('23e mahdoton: ei ehdotusta', mahdoton.huomautukset.some((x) => /Edes 8 osalla/.test(x)));
  tarkista('23f pellinkulutus = osien pituuksien summa', Math.abs(nk.pellinKulutus - nk.osat.reduce((a, o) => a + o.sijoitus.h, 0)) < 1e-9);
}

// 24: sijoitus "suora reuna rullan reunaa vasten" (v3)
{
  const dd = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const ala = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return a / 2; };
  const tarkistaReuna = (nimi, o) => {
    const sj = o.sijoitus, b = L.rajat(sj.pisteet);
    lahella(nimi + ' x0 = 0', b.x0, 0, 1e-6);
    lahella(nimi + ' y0 = 0 (leikkauspää)', b.y0, 0, 1e-6);
    lahella(nimi + ' reuna x = 0 (alku)', sj.reunaPisteet[0][0], 0, 1e-6);
    lahella(nimi + ' reuna x = 0 (loppu)', sj.reunaPisteet[1][0], 0, 1e-6);
    lahella(nimi + ' reunan pituus', dd(sj.reunaPisteet[0], sj.reunaPisteet[1]), sj.reunaPit, 1e-6);
    tarkista(nimi + ' kappale reunan oikealla puolella', sj.pisteet.every((p) => p[0] >= -1e-6));
    // kierto + siirto ei muuta mittoja eikä peilaa
    const u = o.kuva.ulko;
    let maxEro = 0;
    for (let i = 0; i < u.length; i += 3) for (let j = i + 1; j < u.length; j += 5) maxEro = Math.max(maxEro, Math.abs(dd(u[i], u[j]) - dd(sj.pisteet[i], sj.pisteet[j])));
    lahella(nimi + ' mitat säilyvät', maxEro, 0, 1e-6);
    tarkista(nimi + ' ei peilausta', Math.sign(ala(u)) === Math.sign(ala(sj.pisteet)));
  };
  // oletus on reuna
  const r1 = L.laskeKartio({ ...oletus, alaD: 600, ylaD: 300, H: 400 });
  tarkista('24a oletuksena reunasijoitus', r1.osat[0].sijoitus.tila === 'reuna');
  tarkistaReuna('24b pyöreä', r1.osat[0]);
  tarkista('24c pyöreällä kaksi reunavaihtoehtoa', r1.osat[0].sijoitus.vaihtoehdot.length === 2 && r1.osat[0].sijoitus.vaihtoehdot.every((v) => v.kelpaa));
  lahella('24d reunan pituus = kartion sivu', r1.osat[0].sijoitus.reunaPit, r1.sl, 1e-6);
  // nelikulmio 600×400 → Ø300, H400, sauma etusivun keskellä, N6
  const nr = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', saumat: [{ paikka: 0, ed: 10, seur: 10 }] });
  const sj = nr.osat[0].sijoitus;
  tarkistaReuna('24e nelio', nr.osat[0]);
  lahella('24f oletusreuna on pisin (taka 600)', sj.reunaPit, 600, 1e-6);
  tarkista('24g oletusreuna nimeltään sivu taka', /taka/.test(sj.nimi), sj.nimi);
  tarkista('24h oletus mahtuu', sj.sopii === true && sj.w <= 1250);
  tarkista('24i vaihtoehtoja on 7 (4 sivua + 2 puolikasta... + 2 saumareunaa)', sj.vaihtoehdot.length === 7, String(sj.vaihtoehdot.length));
  const pit = {}; sj.vaihtoehdot.forEach((v) => { pit[v.avain] = v; });
  lahella('24j oikea sivu 400', pit.a1_3.pit, 400, 1e-6);
  lahella('24k etusivun puolikas 300', pit.a0_1.pit, 300, 1e-6);
  tarkista('24l etusivun puolikas ei mahdu rullalle (leveys > 1250)', pit.a0_1.sopii === false && pit.a0_1.w > 1250);
  // käsin valittu reuna
  const oik = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', saumat: [{ paikka: 0, ed: 10, seur: 10 }], reunaValinnat: { 1: 'a1_3' } });
  lahella('24m valittu reuna 400', oik.osat[0].sijoitus.reunaPit, 400, 1e-6);
  tarkista('24n valinta merkitty käsin tehdyksi', oik.osat[0].sijoitus.valittuKasin === true);
  tarkistaReuna('24o valittu reuna', oik.osat[0]);
  // valittu reuna ei mahdu: varoitus ja ehdotus
  const eiM = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', saumat: [{ paikka: 0, ed: 10, seur: 10 }], reunaValinnat: { 1: 'a0_1' } });
  tarkista('24p valittu ei mahdu → sopii false', eiM.osat[0].sijoitus.sopii === false && eiM.kaikkiMahtuu === false);
  tarkista('24q ehdotetaan toista reunaa', eiM.osat[0].sijoitus.ehdotus && eiM.osat[0].sijoitus.ehdotus.avain === 'a3_5');
  tarkista('24r varoitus tekstinä', eiM.huomautukset.some((x) => /Ei mahdu/.test(x)));
  // tuntematon valinta → automaattinen
  const tuntematon = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', saumat: [{ paikka: 0, ed: 10, seur: 10 }], reunaValinnat: { 1: 'xyz' } });
  lahella('24s tuntematon valinta → automaattinen', tuntematon.osat[0].sijoitus.reunaPit, 600, 1e-6);
  // säästötila vs reunatila
  const saasta = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', saumat: [{ paikka: 0, ed: 10, seur: 10 }], sijoitusTila: 'saasta' });
  tarkista('24t säästötilassa ei reunaa', saasta.osat[0].sijoitus.tila === 'saasta' && saasta.osat[0].sijoitus.reunaPisteet === undefined);
  tarkista('24u säästö ≤ reuna pituudessa', saasta.osat[0].sijoitus.h <= sj.h + 1e-6);
  const vap = L.parasSijoitus(nr.osat[0].kuva.ulko, 1250, 5000);
  lahella('24v säästötila = parasSijoitus', saasta.osat[0].sijoitus.h, vap.h, 1e-9);
  lahella('24w reunatilan vapaa-tieto täsmää', sj.vapaa.h, vap.h, 1e-9);
  // ei mahdu reunalla mutta mahtuu vapaalla kierrolla → vihje
  const vihje = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', saumat: [{ paikka: 0, ed: 10, seur: 10 }], levyW: 1250, levyL: 1100 });
  tarkista('24x reunalla ei mahdu pituuteen 1100', vihje.kaikkiMahtuu === false);
  tarkista('24y vihje vapaasta kierrosta', vihje.huomautukset.some((x) => /Säästä pellissä/.test(x)), JSON.stringify(vihje.huomautukset));
  // iso sektori (yli 180°): ei käyttökelpoista reunaa → vapaa kierto + ilmoitus
  const iso = L.laskeKartio({ ...oletus, alaD: 1000, ylaD: 100, H: 300, levyW: 2000, levyL: 5000 });
  tarkista('24z yli 180° kulmalla ei reunaa', iso.osat[0].theta > 180 && iso.osat[0].sijoitus.tila === 'saasta' && !!iso.osat[0].sijoitus.ilmoitus);
  // suoratKetjut
  const ket = L.suoratKetjut([[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], 0.05);
  tarkista('24å suorat ketjut yhdistyvät', JSON.stringify(ket) === JSON.stringify([[0, 2], [2, 4]]), JSON.stringify(ket));
  // samanlaiset osat jakavat saman sijoituksen
  const kaksi = L.laskeKartio({ ...oletus, saumat: L.tasajako(2, 10, 10) });
  tarkista('24ä samanlaiset osat jakavat sijoituksen', kaksi.osat[0].sijoitus === kaksi.osat[1].sijoitus && kaksi.ryhmat.length === 1);
  // ryhmän valinta koskee koko ryhmää
  const kaksiV = L.laskeKartio({ ...oletus, saumat: L.tasajako(2, 10, 10), reunaValinnat: { 1: 't2' } });
  tarkista('24ö valinta koskee ryhmän kaikkia osia', kaksiV.osat[1].sijoitus.avain === 't2' && kaksiV.osat[0].sijoitus.avain === 't2');
  // rullan kulutus summataan
  lahella('24aa kulutus = osien pituuksien summa', nr.pellinKulutus, sj.h, 1e-9);
}

// 25: merkintä: mitat ketjuna leikattua reunaa pitkin (v4)
{
  // suora reuna: pisteet 45,33 mm välein, alkukulma origossa, ensimmäinen merkki 10 mm päässä
  const rivi = [[10, 0]]; for (let i = 1; i < 10; i++) rivi.push([10 + 45.33 * i, 0]);
  const kt = L.ketjuMitat(rivi, [0, 0], [rivi[9][0] + 10, 0], 'X', 3);
  tarkista('25a ensimmäinen mitta = 10', kt.rivit[0].vali === 10);
  const summa = kt.rivit.reduce((a, r) => a + r.vali, 0) + kt.loppuVali;
  tarkista('25b välien summa = pyöristetty kokonaispituus', summa === Math.round(10 + 45.33 * 9 + 10), String(summa));
  { let c = 0, maxEro = 0; kt.rivit.forEach((r, i) => { c += r.vali; maxEro = Math.max(maxEro, Math.abs(c - (10 + 45.33 * i))); }); tarkista('25c virhe ei kasva yli 0,5 mm', maxEro <= 0.5 + 1e-9, String(maxEro)); }
  tarkista('25d tasausvälejä on, ja ne ovat 1 mm erilaisia', kt.tasauksia > 0 && kt.rivit.filter((r) => r.tasaus).every((r) => Math.abs(r.vali - 45.33) > 0.5));
  tarkista('25e tarkistus joka kolmannella ja viimeisellä', kt.rivit.filter((r) => r.tarkistus).map((r) => r.nro).join(',') === '3,6,9,10');
  lahella('25f suora reuna: suora mitta = reunaa pitkin', kt.rivit[2].suora, Math.round(10 + 45.33 * 2), 0.51);
  tarkista('25f2 suora mitta kaikilla riveillä', kt.rivit.every((r) => Number.isFinite(r.suora)));
  tarkista('25f3 suorat mitat kasvavat suoralla reunalla', kt.rivit.every((r, i) => i === 0 || r.suora > kt.rivit[i - 1].suora));
  // kaareva reuna: suora mitta alkukulmasta on lyhyempi kuin välien summa
  const kaari = []; for (let i = 0; i < 11; i++) { const a = i * 0.2; kaari.push([100 * Math.cos(a), 100 * Math.sin(a)]); }
  const kk = L.ketjuMitat(kaari, [100, -5], [kaari[10][0], kaari[10][1] + 5], 'B', 5);
  const rSumma = kk.rivit.reduce((a, r) => a + r.vali, 0);
  tarkista('25g kaarella suora mitta < välien summa', kk.rivit[10].suora < rSumma - 5 && kk.kokonaisSuora < rSumma - 5, kk.rivit[10].suora + ' vs ' + rSumma);
  lahella('25h kaaren suora mitta = jänne', kk.rivit[10].suora, Math.round(Math.hypot(kaari[10][0] - 100, kaari[10][1] + 5)), 0.51);
  // 600×400 → Ø300, H400, sauma etusivun keskellä, N6
  const nm = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', saumat: [{ paikka: 0, ed: 10, seur: 10 }] }).osat[0].merkinnat;
  tarkista('25i B-merkkejä 21 ja A-merkkejä 9', nm.B.rivit.length === 21 && nm.A.rivit.length === 9);
  tarkista('25j A-välit 10,300,200,200,300,300,200,200,300 + loppu 10', nm.A.rivit.map((r) => r.vali).join(',') === '10,300,200,200,300,300,200,200,300' && nm.A.loppuVali === 10);
  lahella('25k B-välit 47 (jänne 46,93)', nm.B.rivit[1].vali, 47, 0);
  tarkista('25l B-sarjassa yksi tasausväli 46', nm.B.tasauksia === 1 && nm.B.rivit.filter((r) => r.tasaus)[0].vali === 46);
  tarkista('25m B-välien summa = pyöristetty reunan pituus', nm.B.rivit.reduce((a, r) => a + r.vali, 0) + nm.B.loppuVali === Math.round(nm.B.reunaPit));
  tarkista('25n ylärajalla suora mitta loppuun < reunan pituus', nm.B.kokonaisSuora < nm.B.reunaPit - 100, nm.B.kokonaisSuora + ' vs ' + nm.B.reunaPit);
  lahella('25o A: suora alkukulmasta loppukulmaan (nelikulmio on auki puolelta)', nm.A.kokonaisSuora, 1479, 1);
  tarkista('25p viivoja 29', nm.viivat.length === 29);
  const vv = {}; nm.viivat.forEach((v) => { vv[v.nimi] = v.pit; });
  lahella('25q A5–B11 = taka keskiviiva 403,1', vv['A5–B11'], 403.1, 0.05);
  lahella('25r A3–B6 = oikea keskiviiva 427,2', vv['A3–B6'], 427.2, 0.05);
  lahella('25s A1–B1 = etu keskiviiva 403,1', vv['A1–B1'], 403.1, 0.05);
  tarkista('25t viuhkat A2 → B1…B6 ja A4 → B6…B11', nm.viuhkat.some((x) => x.a === 2 && x.b1 === 1 && x.b2 === 6) && nm.viuhkat.some((x) => x.a === 4 && x.b1 === 6 && x.b2 === 11));
  const mk4 = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', saumat: [{ paikka: 0, ed: 10, seur: 10 }], tarkistusVali: 4 }).osat[0].merkinnat;
  tarkista('25u tarkistusväli 4', mk4.B.rivit.filter((r) => r.tarkistus).map((r) => r.nro).join(',') === '4,8,12,16,20,21');
  // saumalisä 0: ensimmäinen mitta 0
  const nollaLisa = L.laskeNelio({ ...nel, saumat: [{ paikka: 0, ed: 0, seur: 0 }] }).osat[0].merkinnat;
  tarkista('25v saumalisä 0 → ensimmäinen mitta 0', nollaLisa.B.rivit[0].vali === 0 && nollaLisa.A.rivit[0].vali === 0);
  // kaksi osaa: jokaisella oma merkintä, samanlaisilla sama tulos
  const kaksi = L.laskeNelio({ ...nel, saumat: [{ paikka: 0, ed: 10, seur: 10 }, { paikka: 4, ed: 10, seur: 10 }] });
  tarkista('25w kahdella osalla merkinnät', kaksi.osat.every((o) => o.merkinnat && o.merkinnat.A.rivit.length > 1));
  tarkista('25x symmetriset osat saavat samat mitat', JSON.stringify(kaksi.osat[0].merkinnat.B.rivit.map((r) => r.vali)) === JSON.stringify(kaksi.osat[1].merkinnat.B.rivit.map((r) => r.vali)));
}

// 26: leikkauskulmat ennen leikkausta (v5)
{
  const ko = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', saumat: [{ paikka: 0, ed: 10, seur: 10 }] }).osat[0];
  const r = L.nelioKulmat(ko, ko.sijoitus, false);
  tarkista('26a kulmat T1,A2,A4,A6,A8,T3,T4,T2', r.map((x) => x.nimi).join(',') === 'T1,A2,A4,A6,A8,T3,T4,T2', r.map((x) => x.nimi).join(','));
  const odotus = { T1: [517, 0], A2: [227, 110], A4: [0, 439], A6: [0, 1039], A8: [227, 1369], T3: [517, 1479], T4: [660, 1102], T2: [660, 377] };
  r.forEach((x) => lahella('26b ' + x.nimi + ' x', x.x, odotus[x.nimi][0], 0.6) || 0);
  r.forEach((x) => lahella('26c ' + x.nimi + ' y', x.y, odotus[x.nimi][1], 0.6));
  const pit = {}; r.forEach((x) => { pit[x.nimi] = x.seurPit; });
  lahella('26d T1→A2 = 310', pit.T1, 310, 0.05); lahella('26e A2→A4 = 400', pit.A2, 400, 0.05); lahella('26f A4→A6 = 600', pit.A4, 600, 0.05);
  lahella('26g A6→A8 = 400', pit.A6, 400, 0.05); lahella('26h A8→T3 = 310', pit.A8, 310, 0.05);
  lahella('26i T3→T4 = sauman pituus', pit.T3, ko.reunaPit2, 1e-6); lahella('26j T2→T1 = sauman pituus', pit.T2, ko.reunaPit1, 1e-6);
  tarkista('26k T4 → kaari ilman B-pisteitä', pit.T4 === null);
  // matka vastaa pisteiden etäisyyttä pellillä
  let eroMax = 0; r.forEach((x, j) => { if (x.seurPit !== null) eroMax = Math.max(eroMax, Math.abs(x.seurPit - Math.hypot(r[(j + 1) % r.length].x - x.x, r[(j + 1) % r.length].y - x.y))); });
  lahella('26l matka = pisteiden etäisyys pellillä', eroMax, 0, 1e-6);
  tarkista('26m reunalla olevat A4 ja A6: x = 0', Math.abs(r[2].x) < 1e-6 && Math.abs(r[3].x) < 1e-6);
  tarkista('26n kaikki pisteet pellin sisällä (x,y ≥ 0)', r.every((x) => x.x >= -1e-6 && x.y >= -1e-6));
  // ympyrän pisteet mukaan
  const rb = L.nelioKulmat(ko, ko.sijoitus, true);
  tarkista('26o B-pisteineen 8 + 21 riviä', rb.length === 29, String(rb.length));
  lahella('26p T4 → B21 = saumalisä 10', rb.find((x) => x.nimi === 'T4').seurPit, 10, 1e-6);
  tarkista('26q B-pisteissä ei kaarta', rb.every((x) => x.seurPit !== null));
  // saumalisä 0: T1 ja A1 samassa pisteessä, ei kaadu
  const k0 = L.laskeNelio({ ...nel, saumat: [{ paikka: 0, ed: 0, seur: 0 }] }).osat[0];
  const r0 = L.nelioKulmat(k0, k0.sijoitus, false);
  tarkista('26r saumalisä 0 toimii', r0.length >= 6 && r0.every((x) => Number.isFinite(x.x) && Number.isFinite(x.y)));
  // säästötilassa pisteet pysyvät pellin sisällä
  const ks = L.laskeNelio({ ...nel, sijoitusTila: 'saasta' }).osat[0];
  tarkista('26s säästötilassa pisteet x,y ≥ 0', L.nelioKulmat(ks, ks.sijoitus, false).every((x) => x.x >= -1e-6 && x.y >= -1e-6));
  // valittu reuna vaihtaa koordinaatit (oikea sivu reunalla): reunan kulmat x = 0
  const ko2 = L.laskeNelio({ ...nel, saumat: [{ paikka: 0, ed: 10, seur: 10 }], reunaValinnat: { 1: 'a1_3' } }).osat[0];
  const r2 = L.nelioKulmat(ko2, ko2.sijoitus, false);
  tarkista('26t valitulla reunalla A2 ja A4 ovat x = 0', Math.abs(r2.find((x) => x.nimi === 'A2').x) < 1e-6 && Math.abs(r2.find((x) => x.nimi === 'A4').x) < 1e-6);
}

// ===== 27. Symmetrinen reuna: puolikas-taulukko (v6) =====
{
  const nel = { muoto: 'nelio', W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, saumat: [{ paikka: 0, ed: 10, seur: 10 }], levyTyyppi: 'rulla', levyW: 1250, levyL: 5000 };
  const o = L.laskeNelio(nel).osat[0], mk = o.merkinnat;
  tarkista('27a B-reuna symmetrinen (sauma etusivun keskellä, 10 + 10)', mk.B.sym === true);
  tarkista('27b A-reuna symmetrinen', mk.A.sym === true);
  const hb = mk.B.puolikas.rivit;
  tarkista('27c B-puolikkaassa 11 riviä (21 pistettä)', hb.length === 11, String(hb.length));
  tarkista('27d B-rivien nimet parit ja puoliväli', hb[0].nimi === 'B1 / B21' && hb[1].nimi === 'B2 / B20' && hb[9].nimi === 'B10 / B12' && hb[10].nimi === 'B11 (puoliväli)', hb.map((r) => r.nimi).join(' | '));
  tarkista('27e B suorat mitat käsin (10, 57, 104, 150, 196, 240, 284, 326, 367, 406, 444)', hb.map((r) => r.suora).join(',') === '10,57,104,150,196,240,284,326,367,406,444', hb.map((r) => r.suora).join(','));
  tarkista('27f A-puolikas 5 riviä: 10, 310, 488, 678, 902', mk.A.puolikas.rivit.map((r) => r.suora).join(',') === '10,310,488,678,902', mk.A.puolikas.rivit.map((r) => r.suora).join(','));
  // peilimitta: suora matka loppukulmasta merkille n+1-k on sama kuin alkukulmasta merkille k
  const kv = o.kuva, B = kv.Bp.map((x) => x.p), n = B.length, alkuP = kv.tab1[2], loppuP = kv.tab2[2];
  let erMax = 0; for (let k = 0; k < n; k++) erMax = Math.max(erMax, Math.abs(d(alkuP, B[k]) - d(loppuP, B[n - 1 - k])));
  lahella('27g peilimitta alusta = lopusta (suurin ero)', erMax, 0, 1e-6);
  // peilikuva: kokonaisessa taulukossa loppupään suora mitta ei ole sama kuin alkupään, mutta puolikkaan kautta se löytyy
  tarkista('27h puoliväli-merkki B11 koko taulukossa', mk.B.puoli === 11 && mk.B.rivit.filter((r) => r.puoli).length === 1 && mk.B.rivit[10].puoli === true);
  tarkista('27i A-reunan puoliväli A5', mk.A.puoli === 5);
  // puolikkaan ketjun summa = pyöristetty polun pituus alkukulmasta B11:een
  const sumVali = hb.reduce((a, r) => a + r.vali, 0);
  let cum = d(alkuP, B[0]); for (let i = 1; i < 11; i++) cum += d(B[i - 1], B[i]);
  lahella('27j puolikkaan välien summa = polku B11:een (pyöristys alle 0,5)', sumVali, cum, 0.5);
  tarkista('27k puolikkaan viimeinen rivi lihavoitu', hb[10].tarkistus === true && hb[2].tarkistus === true && hb[0].tarkistus === false);
  // epäsymmetrinen: eri saumalisät
  const e1 = L.laskeNelio({ ...nel, saumat: [{ paikka: 0, ed: 10, seur: 0 }] }).osat[0].merkinnat;
  tarkista('27l eri saumalisät (10 + 0): ei symmetrinen, ei puolikasta', e1.B.sym === false && e1.B.puolikas === undefined && e1.A.sym === false);
  tarkista('27m epäsymmetrisessäkin yksi puoliväli-merkki', e1.B.rivit.filter((r) => r.puoli).length === 1);
  // ympyrän siirto rikkoo symmetrian
  const e2 = L.laskeNelio({ ...nel, ox: 30 }).osat[0].merkinnat;
  tarkista('27n ympyrän siirto: B ei symmetrinen', e2.B.sym === false);
  // sauma nurkassa (paikka 1): tulos tunnistetaan laskemalla, puolikas vain jos symmetrinen
  [0, 1, 2, 3, 4, 5, 6, 7].forEach((pk) => {
    const m = L.laskeNelio({ ...nel, saumat: [{ paikka: pk, ed: 10, seur: 10 }] }).osat[0].merkinnat;
    tarkista('27o sauma ' + pk + ': puolikas vain jos symmetrinen', (m.B.sym === (m.B.puolikas !== undefined)) && (m.A.sym === (m.A.puolikas !== undefined)));
    if (m.B.sym) { const r = m.B.puolikas.rivit; tarkista('27p sauma ' + pk + ': puolikkaan koko (n+1)/2', r.length === (m.B.rivit.length + 1) / 2); }
  });
  // reunaSymmetrinen suoraan: peilisymmetrinen kaari vs vino kaari
  const sym = [[0, 0], [10, 3], [20, 4], [30, 3], [40, 0]], vino = [[0, 0], [10, 3], [20, 4], [30, 5], [40, 0]];
  tarkista('27q reunaSymmetrinen: symmetrinen kaari', L.reunaSymmetrinen(sym, [-5, 0], [45, 0]) === true);
  tarkista('27r reunaSymmetrinen: vino kaari ei', L.reunaSymmetrinen(vino, [-5, 0], [45, 0]) === false);
  tarkista('27s reunaSymmetrinen: eri alku- ja loppuliuska ei', L.reunaSymmetrinen(sym, [-5, 0], [48, 0]) === false);
}

// ===== 28. Huullos pyöreälle kartiolle (v7) =====
{
  const ala = (pts) => { let a = 0; for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length]; a += p[0] * q[1] - q[0] * p[1]; } return Math.abs(a) / 2; };
  const pe = { alaD: 600, ylaD: 300, H: 400, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, a1: 10, a2: 10, levyW: 1250, levyL: 5000 };
  const ilman = L.laskeKartio(pe), huul = L.laskeKartio({ ...pe, huAla: 20, huYla: 10 });
  const o0 = ilman.osat[0], o1 = huul.osat[0];
  lahella('28a Rb = 854,4', huul.Rb, 854.4, 0.05); lahella('28b Rs = 427,2', huul.Rs, 427.2, 0.05);
  tarkista('28c ilman huullosta: ei huullosta, kuva ennallaan', ilman.huul.onko === false && o0.kuva.huulIso.length === 0 && o0.kuva.huulPieni.length === 0);
  tarkista('28d huullos: ala = iso pää (20), yla = pieni pää (10)', huul.huul.iso.h === 20 && huul.huul.pieni.h === 10 && huul.huul.iso.paa === 'ala' && huul.huul.pieni.paa === 'yla');
  // etäisyydet kärjestä: uloin piste Rb + 20, sisin Rs − 10
  const et = o1.kuva.ulko.map((q) => Math.hypot(q[0], q[1]));
  lahella('28e uloin piste Rb + 20 (874,4)', Math.max(...et), huul.Rb + 20, 1e-6);
  lahella('28f sisin piste Rs − 10 (417,2)', Math.min(...et), huul.Rs - 10, 1e-6);
  // huullosten pinta-alat: rengaskaistaleet kulmalta theta
  const th = huul.theta * Math.PI / 180;
  const alaIso = th / 2 * ((huul.Rb + 20) ** 2 - huul.Rb ** 2), alaPieni = th / 2 * (huul.Rs ** 2 - (huul.Rs - 10) ** 2);
  lahella('28g isonpään huullos pinta-ala', ala(o1.kuva.huulIso), alaIso, alaIso * 0.003);
  lahella('28h pienenpään huullos pinta-ala', ala(o1.kuva.huulPieni), alaPieni, alaPieni * 0.003);
  lahella('28i ulkoreunan ala kasvaa huullosten verran', ala(o1.kuva.ulko) - ala(o0.kuva.ulko), alaIso + alaPieni, (alaIso + alaPieni) * 0.005);
  // taitoslinjat: huullospolygonin sisäkaari on Rb:llä / Rs:llä
  const sis = (pts, r) => pts.filter((q) => Math.abs(Math.hypot(q[0], q[1]) - r) < 1e-6).length;
  tarkista('28j isossa huullospolygonissa pisteet kaarella Rb ja Rb + 20', sis(o1.kuva.huulIso, huul.Rb) > 10 && sis(o1.kuva.huulIso, huul.Rb + 20) > 10);
  tarkista('28k pienessä huullospolygonissa pisteet kaarella Rs ja Rs − 10', sis(o1.kuva.huulPieni, huul.Rs) > 10 && sis(o1.kuva.huulPieni, huul.Rs - 10) > 10);
  // sektori ei muutu
  lahella('28l sektorin leveys ei muutu', o1.sektoriRajat.w, o0.sektoriRajat.w, 1e-9);
  // kappale kasvaa (uloin kaari 874,4: jänne kasvaa 2·20·sin(theta/2) ≈ 35,7)
  const kasvu = 2 * 20 * Math.sin(th / 2);
  tarkista('28m kappaleen mitat kasvavat huullosten verran', o1.ulkoRajat.w > o0.ulkoRajat.w + 20 && o1.ulkoRajat.w < o0.ulkoRajat.w + kasvu + 12, fmt0(o1.ulkoRajat.w - o0.ulkoRajat.w) + ' / jänne ' + fmt0(kasvu));
  // taittosuunnat
  const hp = L.laskeKartio({ ...pe, huAla: 20, huYla: 10, huAlaS: 'putki', huYlaS: 'putki' }).huul;
  lahella('28n kaltevuus atan(150/400) = 20,556°', hp.alfa, Math.atan(150 / 400) * 180 / Math.PI, 1e-9);
  tarkista('28o putken suuntaan: iso pää sisään, pieni ulos, kulma = kaltevuus', hp.iso.taito === 'sisaan' && hp.pieni.taito === 'ulos' && Math.abs(hp.iso.kulma - hp.alfa) < 1e-9 && Math.abs(hp.pieni.kulma - hp.alfa) < 1e-9);
  const hu = L.laskeKartio({ ...pe, huAla: 20, huYla: 10, huAlaS: 'sisaan', huAlaK: 75 }).huul;
  tarkista('28p sisään 75°: kulma ja suunta sellaisenaan', hu.iso.taito === 'sisaan' && hu.iso.kulma === 75 && hu.pieni.taito === 'ulos' && hu.pieni.kulma === 90);
  tarkista('28q oletus ulos 90°', huul.huul.iso.taito === 'ulos' && huul.huul.iso.kulma === 90 && huul.huul.pieni.kulma === 90);
  // käänteinen kartio: ylhäällä iso pää
  const kaan = L.laskeKartio({ ...pe, alaD: 300, ylaD: 600, huAla: 10, huYla: 20, huAlaS: 'putki', huYlaS: 'putki' });
  tarkista('28r käänteinen: yla = iso pää (20, sisään), ala = pieni (10, ulos)', kaan.huul.iso.paa === 'yla' && kaan.huul.iso.h === 20 && kaan.huul.iso.taito === 'sisaan' && kaan.huul.pieni.paa === 'ala' && kaan.huul.pieni.taito === 'ulos');
  // liian suuri pienen pään huullos
  const vir = L.laskeKartio({ ...pe, huYla: 430 });
  tarkista('28s liian suuri huullos pienessä päässä = virhe', vir.virheet && vir.virheet.length === 1 && /liian suuri/.test(vir.virheet[0]));
  tarkista('28t negatiivinen huullos = 0', L.laskeKartio({ ...pe, huAla: -5 }).huul.onko === false);
  // useampi osa: huullokset joka osalla
  const kaksi = L.laskeKartio({ ...pe, huAla: 20, huYla: 10, saumat: L.tasajako(2, 10, 10) });
  tarkista('28u kahdella osalla huullos molemmissa', kaksi.osat.every((o) => o.kuva.huulIso.length > 0 && o.kuva.huulPieni.length > 0));
  lahella('28v kahden osan uloin piste', Math.max(...kaksi.osat[0].kuva.ulko.map((q) => Math.hypot(q[0], q[1]))), kaksi.Rb + 20, 1e-6);
  // sijoitus huullosten kanssa: kappale mahtuu ja mitat vastaavat sijoitettua ääriviivaa
  const sj = o1.sijoitus, sb = L.rajat(sj.pisteet);
  lahella('28w sijoituksen w = pisteiden leveys', sb.w, sj.w, 1e-6); lahella('28x sijoituksen h = pisteiden korkeus', sb.h, sj.h, 1e-6);
  lahella('28y sijoituksen ala säilyy', ala(sj.pisteet), ala(o1.kuva.ulko), 1e-3);
  // saumalisä 0 ja huullos: ei kaadu, ei kaksoispisteitä saumassa
  const nolla = L.laskeKartio({ ...pe, a1: 0, a2: 0, huAla: 20, huYla: 10, saumat: [{ kulma: 0, ed: 0, seur: 0 }] }).osat[0];
  tarkista('28z saumalisä 0 ja huullos toimii', nolla.kuva.ulko.every((q) => Number.isFinite(q[0]) && Number.isFinite(q[1])) && ala(nolla.kuva.ulko) > 0);
  // nelikulmio ei käytä huullosta (vaihe B): sama tulos huullosarvoilla
  const nel = { muoto: 'nelio', W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, saumat: [{ paikka: 0, ed: 10, seur: 10 }], levyTyyppi: 'rulla', levyW: 1250, levyL: 5000 };
  lahella('28å nelikulmio ilman huullosta ei muutu (huullos 0)', L.laskeNelio({ ...nel, huAla: 0, huYla: 0 }).osat[0].ulkoRajat.w, L.laskeNelio(nel).osat[0].ulkoRajat.w, 1e-9);
}

// ===== 29. Taitosviivojen kanttausluvut (v8) =====
{
  const nel = { muoto: 'nelio', W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, saumat: [{ paikka: 0, ed: 10, seur: 10 }], levyTyyppi: 'rulla', levyW: 1250, levyL: 5000 };
  const o = L.laskeNelio(nel).osat[0], vi = o.merkinnat.viivat;
  tarkista('29a viivoja 29, ensimmäinen ja viimeinen = saumareuna (null)', vi.length === 29 && vi[0].taite === null && vi[28].taite === null);
  tarkista('29b muilla viivoilla luku', vi.slice(1, 28).every((v) => typeof v.taite === 'number' && Number.isFinite(v.taite)));
  // käsin: A2–B1 on sivukolmion (A1,B1,A2) ja ensimmäisen viuhkakolmion (A2,B1,B2) välinen taite
  // n0 = (0, −0,99228, 0,12403) (kaltevuus atan(50/400)), n1 = (0,15209, −0,96020, 0,23410) → cos = 0,98183 → 10,93°
  const nm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
  const ristiK = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const vak = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const phi2 = -72 * Math.PI / 180, B1 = [0, -150, 400], B2 = [150 * Math.cos(phi2), 150 * Math.sin(phi2), 400], A2 = [300, -200, 0], A1 = [0, -200, 0];
  const n0 = nm(ristiK(vak(B1, A1), vak(A2, A1))), n1 = nm(ristiK(vak(B1, A2), vak(B2, A2)));
  const kasin = Math.acos(Math.abs(n0[0] * n1[0] + n0[1] * n1[1] + n0[2] * n1[2])) * 180 / Math.PI;
  lahella('29c A2–B1 taite käsin laskettuna (≈ 10,9°)', Math.abs(vi[1].taite), kasin, 1e-9);
  tarkista('29d A2–B1 ≈ 10,9° ja viiva A2–B1', vi[1].nimi === 'A2–B1' && Math.abs(Math.abs(vi[1].taite) - 10.9) < 0.1, String(vi[1].taite));
  // sivun keskiviivat ovat tasossa: 0°
  ['A3–B6', 'A5–B11', 'A7–B16'].forEach((nimi) => { const v = vi.find((x) => x.nimi === nimi); tarkista('29e ' + nimi + ' = 0°', !!v && Math.abs(v.taite) < 1e-6); });
  // kaikki taitokset samaan suuntaan (kupera) keskitetyllä muodolla
  tarkista('29f kaikki taitokset kuperia (≥ 0)', vi.slice(1, 28).every((v) => v.taite >= -1e-9));
  // peilisymmetria: viiva j ja viiva 28 − j
  let ero = 0; for (let j = 1; j < 28; j++) ero = Math.max(ero, Math.abs(vi[j].taite - vi[28 - j].taite));
  lahella('29g peilisymmetria (sauma etusivun keskellä)', ero, 0, 1e-9);
  // riippumaton laskenta: kolmiot A- ja B-renkaista, normaalit ulospäin kolmio kerrallaan
  const ren = L.nelioRenkaat(600, 400, 300, 400, 6, 0, 0), jono = L.nelioJono(6);
  let ia = 0, ib = 0; const tri = [];
  jono.askeleet.forEach((st) => { const a = ren.A[ia], b = ren.B[ib], x = st.k === 'A' ? ren.A[st.i] : ren.B[st.i]; let n = nm(ristiK(vak(b, a), vak(x, a))); const c = [(a[0] + b[0] + x[0]) / 3, (a[1] + b[1] + x[1]) / 3]; if (n[0] * c[0] + n[1] * c[1] < 0) n = n.map((q) => -q); tri.push(n); if (st.k === 'A') ia = st.i; else ib = st.i; });
  let eroR = 0; for (let j = 1; j < tri.length; j++) { const kulma = Math.acos(Math.max(-1, Math.min(1, tri[j - 1][0] * tri[j][0] + tri[j - 1][1] * tri[j][1] + tri[j - 1][2] * tri[j][2]))) * 180 / Math.PI; eroR = Math.max(eroR, Math.abs(kulma - Math.abs(vi[j].taite))); }
  lahella('29h riippumaton laskenta täsmää kaikilla taitteilla', eroR, 0, 1e-6);
  // viuhkan taitteiden summa
  const vh = o.merkinnat.viuhkat.find((x) => x.a === 2);
  lahella('29i nurkan 2 viuhkan taitteiden summa = käsin summa', Math.abs(vh.taiteSumma), vi.slice(1, 7).reduce((a, v) => a + v.taite, 0), 1e-9);
  // N:n vaikutus: enemmän viivoja nurkassa → pienempi suurin taite
  const maxT = (N) => Math.max(...L.laskeNelio({ ...nel, N }).osat[0].merkinnat.viivat.map((v) => v.taite === null ? 0 : Math.abs(v.taite)));
  tarkista('29j suurin taite pienenee kun N kasvaa (4 > 6 > 12)', maxT(4) > maxT(6) && maxT(6) > maxT(12), [maxT(4), maxT(6), maxT(12)].map((x) => x.toFixed(1)).join(' > '));
  // jaettu osiin: jokaisen osan ensimmäinen ja viimeinen viiva saumareunana
  const kaksi = L.laskeNelio({ ...nel, saumat: [{ paikka: 0, ed: 10, seur: 10 }, { paikka: 4, ed: 10, seur: 10 }] });
  tarkista('29k kahdella osalla jokaisen osan päät = sauma', kaksi.osat.every((p) => p.merkinnat.viivat[0].taite === null && p.merkinnat.viivat[p.merkinnat.viivat.length - 1].taite === null));
  // epäkeskoinen ja siirretty ympyrä: ei NaN
  const ep = L.laskeNelio({ ...nel, ox: 40, oy: 30 }).osat[0].merkinnat.viivat;
  tarkista('29l epäkeskoisella ei NaN', ep.every((v) => v.taite === null || Number.isFinite(v.taite)));
  // seinää vasten (ympyrä takareunassa): taite 0 takasivulla (taso on pystysuora vain jos ympyrä tangentti takareunaan)
  const sein = L.laskeNelio({ ...nel, W: 600, D: 400, ylaD: 300, oy: 50 }).osat[0].merkinnat.viivat;
  tarkista('29m seinämallilla taitteet ovat lukuja', sein.every((v) => v.taite === null || Number.isFinite(v.taite)));
}

// ===== 30. Huullos nelikulmio → pyöreä (v9) =====
{
  const nel = { muoto: 'nelio', W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, saumat: [{ paikka: 0, ed: 10, seur: 10 }], levyTyyppi: 'rulla', levyW: 1250, levyL: 5000 };
  const d2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const risti = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const pohja = L.laskeNelio(nel).osat[0];
  const yksi = (o) => L.laskeNelio({ ...nel, ...o }).osat[0];
  // 30a ilman huullosta ääriviiva ennallaan
  const ilman = yksi({ huAla: 0, huYla: 0 });
  tarkista('30a h=0: ulko ennallaan', ilman.kuva.ulko.length === pohja.kuva.ulko.length && !ilman.kuva.huul);
  // 30b alapään huullos 20: viisi suoraa liuskaa (etu alku, oikea, taka, vasen, etu loppu)
  const a20 = yksi({ huAla: 20, huYla: 0 }), hu = a20.kuva.huul;
  tarkista('30b viisi liuskaa', hu.A.runs.length === 5, String(hu.A.runs.length));
  const pit = hu.A.runs.map((r) => Math.round(r.pit));
  tarkista('30c liuskojen sisäreunat 300, 400, 600, 400, 300', JSON.stringify(pit) === JSON.stringify([300, 400, 600, 400, 300]), pit.join(','));
  // 30d jokaisen liuskan keskellä etäisyys reunasta = h
  hu.A.runs.forEach((r, i) => {
    const m = [(r.P[0] + r.Q[0]) / 2, (r.P[1] + r.Q[1]) / 2], mo = [(r.O0[0] + r.O1[0]) / 2, (r.O0[1] + r.O1[1]) / 2];
    const e = [(r.Q[0] - r.P[0]) / r.pit, (r.Q[1] - r.P[1]) / r.pit], n = [-e[1], e[0]];
    const et = Math.abs((mo[0] - m[0]) * n[0] + (mo[1] - m[1]) * n[1]);
    lahella('30d liuska ' + (i + 1) + ' leveys 20', et, 20, 1e-6);
  });
  // 30e rako nurkassa: ulkoreunojen päät 12,5 mm päässä toisistaan (2·h·tan(17,3°))
  const ero = 180 - 145.4; const rakoOdotus = 2 * 20 * Math.sin(ero / 2 * Math.PI / 180);
  lahella('30e rako nurkassa A2 (≈ 11,9 mm = 2·h·sin(17,3°))', d2(hu.A.runs[0].O1, hu.A.runs[1].O0), rakoOdotus, 0.1);
  // 30f liuskan päät sauma-viivan jatkeella: O0 on suoralla b0–a0 (ensimmäinen liuska) ja loppupää suoralla bE–aE
  const kv = a20.kuva;
  tarkista('30f alkupää sauma-viivan jatkeella', Math.abs(risti(kv.Bp[0].p, kv.Ap[0].p, hu.A.runs[0].O0)) < 1e-6);
  tarkista('30g loppupää sauma-viivan jatkeella', Math.abs(risti(kv.Bp[kv.Bp.length - 1].p, kv.Ap[kv.Ap.length - 1].p, hu.A.runs[4].O1)) < 1e-6);
  tarkista('30h ääriviiva kasvaa ja ei leikkaa itseään', a20.ulkoRajat.h > pohja.ulkoRajat.h - 1e-9 && a20.ulkoRajat.w >= pohja.ulkoRajat.w - 1e-9 && !L.laskeNelio({ ...nel, huAla: 20 }).huomautukset.some((x) => /itseään/.test(x)));
  // 30i yläpään huullos: ulkopisteiden etäisyys viereisiin jänteisiin = h (jiiri)
  const y15 = yksi({ huAla: 0, huYla: 15 }), hb = y15.kuva.huul.B, Bp = y15.kuva.Bp.map((x) => x.p);
  const etaisyysViivaan = (p, a, b) => Math.abs(risti(a, b, p)) / d2(a, b);
  let eroY = 0; // keskipisteet: jiiripiste j on etäisyydellä h molemmista viereisistä jänteistä
  for (let j = 1; j < Bp.length - 1; j++) {
    const q = hb.ulko[j];
    eroY = Math.max(eroY, Math.abs(etaisyysViivaan(q, Bp[j - 1], Bp[j]) - 15), Math.abs(etaisyysViivaan(q, Bp[j], Bp[j + 1]) - 15));
  }
  lahella('30i yläpään jiiripisteet 15 mm kaikista jänteistä', eroY, 0, 1e-6);
  tarkista('30j yläpään päät sauma-viivan jatkeella', Math.abs(risti(Bp[0], y15.kuva.Ap[0].p, hb.ulko[0])) < 1e-6 && Math.abs(risti(Bp[Bp.length - 1], y15.kuva.Ap[y15.kuva.Ap.length - 1].p, hb.ulko[hb.ulko.length - 1])) < 1e-6);
  tarkista('30k yläpään liuskan pisteitä 21 (ei viistoja)', hb.ulko.length === 21, String(hb.ulko.length));
  // 30l putken suuntainen taitto: alapää (7,1 / 20,6), yläpää keskiarvo 23,0 vaihteluväli 13,5–27,7 (itsenäinen laskenta plan4)
  const put = yksi({ huAla: 20, huYla: 20, huAlaS: 'putki', huYlaS: 'putki' }).kuva.huul;
  const kulmaA = put.A.runs.map((r) => +r.kulma.toFixed(1));
  tarkista('30l alapään putki-kulmat 7,1 / 20,6 / 7,1 / 20,6 / 7,1', JSON.stringify(kulmaA) === JSON.stringify([7.1, 20.6, 7.1, 20.6, 7.1]), kulmaA.join(','));
  tarkista('30m alapää: sisään', put.A.runs.every((r) => r.taito === 'sisaan'));
  lahella('30n yläpään putki-kulma suurin', put.B.max, 27.7, 0.05);
  lahella('30o yläpään putki-kulma pienin', put.B.min, 13.5, 0.05);
  lahella('30p yläpään putki-kulma keskiarvo', put.B.ka, 23.0, 0.05);
  tarkista('30q yläpää: ulos, ei sekaisin', put.B.taito === 'ulos' && !put.B.seka && put.B.kulmat.length === 20);
  // 30r ulos/sisään käyttää annettua kulmaa
  const kasi = yksi({ huAla: 20, huYla: 20, huAlaS: 'sisaan', huYlaS: 'ulos', huAlaK: 60, huYlaK: 45 }).kuva.huul;
  tarkista('30r annetut kulmat', kasi.A.runs.every((r) => r.kulma === 60 && r.taito === 'sisaan') && kasi.B.min === 45 && kasi.B.max === 45 && kasi.B.taito === 'ulos');
  // 30s liian leveä yläpään huullos → leikkaa itseään
  tarkista('30s liian leveä huullos varoittaa', L.laskeNelio({ ...nel, huYla: 900 }).huomautukset.some((x) => /itseään/.test(x)));
  // 30t kaikki huulloksen pisteet ovat lukuja ja reunavaihtoehdot käyttävät ulkoreunaa
  tarkista('30t ulko ilman NaN', put.ulko.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1])));
  const reunat = a20.reunat.map((r) => r.nimi);
  tarkista('30u reuna-vaihtoehdoissa huulloksen ulkoreuna', reunat.some((x) => /huulloksen ulkoreuna/.test(x)), reunat.join(' | '));
  const ra = a20.reunat.filter((r) => /huulloksen ulkoreuna/.test(r.nimi));
  tarkista('30v ulkoreunan pituus on liuskan ulkopituus', ra.length === 5 && Math.abs(ra[2].pit - hu.A.runs[2].ulkoPit) < 1e-9);
  // 30w sauma nurkassa ja kahdella osalla: ei NaN, liuskat jokaisessa osassa
  const kaksi = L.laskeNelio({ ...nel, huAla: 20, huYla: 20, saumat: [{ paikka: 1, ed: 10, seur: 10 }, { paikka: 5, ed: 10, seur: 10 }] });
  tarkista('30w nurkkasauma + kaksi osaa: huullokset jokaisella osalla', kaksi.osat.every((o) => o.kuva.huul && o.kuva.huul.A.runs.length >= 1 && o.kuva.huul.ulko.every((p) => Number.isFinite(p[0]) && Number.isFinite(p[1]))));
  // 30x sijoitus ottaa huulloksen huomioon: ulkorajat kasvavat molemmilla
  const molemmat = yksi({ huAla: 20, huYla: 20 });
  tarkista('30x pellin tarve kasvaa huulloksen kanssa', molemmat.sijoitus.w * molemmat.sijoitus.h > pohja.sijoitus.w * pohja.sijoitus.h);
}

// ===== 31. Ulkoreunan merkit huullokselle (v9, erä 2) =====
{
  const nel = { muoto: 'nelio', W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, saumat: [{ paikka: 0, ed: 10, seur: 10 }], levyTyyppi: 'rulla', levyW: 1250, levyL: 5000 };
  const d2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const risti = (a, b, c) => (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
  const yksi = (o) => L.laskeNelio({ ...nel, ...o }).osat[0];
  const o = yksi({ huYla: 20 }), mk = o.merkinnat, kv = o.kuva, U = kv.huul.B.ulko;
  tarkista('31a ulkoreunan merkit käytössä', mk.ulko && mk.B.ulko === true);
  tarkista('31b 22 merkkiä (24 taitosviivaa, 2 päättyy kulmaan, 3 keskiviivaa 0°… ei merkkiä)', mk.B.rivit.length === 22, String(mk.B.rivit.length));
  tarkista('31c rivit nimetty U1…U22', mk.B.rivit[0].nimi === 'U1' && mk.B.rivit[21].nimi === 'U22');
  // jokainen merkki on viivan jatkeella ja ulkoreunan murtoviivalla
  let ero1 = 0, ero2 = 0;
  const etSeg = (p, a, b) => { const e = [b[0] - a[0], b[1] - a[1]], l2 = e[0] * e[0] + e[1] * e[1]; let t = ((p[0] - a[0]) * e[0] + (p[1] - a[1]) * e[1]) / l2; t = Math.max(0, Math.min(1, t)); return d2(p, [a[0] + e[0] * t, a[1] + e[1] * t]); };
  mk.B.merkit.forEach((m) => {
    const v = kv.viivat[m.j];
    ero1 = Math.max(ero1, Math.abs(risti(v.a, v.b, m.p)) / d2(v.a, v.b));
    let md = Infinity; for (let q = 0; q + 1 < U.length; q++) md = Math.min(md, etSeg(m.p, U[q], U[q + 1]));
    ero2 = Math.max(ero2, md);
  });
  lahella('31d merkit ovat taitosviivan jatkeella', ero1, 0, 1e-6);
  lahella('31e merkit ovat ulkoreunalla', ero2, 0, 1e-6);
  // käsinlaskettu: A2–B4 on lähes kohtisuorassa → jatke ≈ 20,0; A2–B2 ≈ 23,2 (itsenäinen laskenta plan3)
  const vb = (nimi) => mk.viivat.find((x) => x.nimi === nimi);
  lahella('31f A2–B4 jatke → viivan pituus A:sta ulkoreunalle = 452,1 + 20,0', vb('A2–B4').ulkoPit, 472.1, 0.2);
  lahella('31g A2–B2 viivan pituus = 477,1 + 23,2', vb('A2–B2').ulkoPit, 500.3, 0.2);
  lahella('31h keskiviiva A5–B11 viivan pituus = 403,1 + 20,0', vb('A5–B11').ulkoPit, 423.1, 0.2);
  tarkista('31i keskiviivoilla ei merkkiä', ['A3–B6', 'A5–B11', 'A7–B16'].every((n) => vb(n).umerkki === 0 && !vb(n).kulma));
  tarkista('31j A2–B1 ja A8–B21 päättyvät kulmaan', vb('A2–B1').kulma && vb('A8–B21').kulma && vb('A2–B1').umerkki === 0);
  tarkista('31k merkitty viiva viittaa U-numeroon', vb('A2–B2').umerkki === 1 && vb('A8–B20').umerkki === 22);
  // ketju: välit + loppuväli = ulkoreunan merkkien yhteispituus, suora alkukulmasta jokaiselle merkille
  const summa = mk.B.rivit.reduce((a, r) => a + r.vali, 0) + mk.B.loppuVali;
  lahella('31l välit yhteensä = ketjun pituus (±1 mm pyöristys)', summa, mk.B.reunaPit, 1);
  const r5 = mk.B.rivit[4]; lahella('31m suora alkukulmasta U5', r5.suora, d2(U[0], mk.B.merkit[4].p), 0.5);
  // ulkoreunan merkkien väli on suurempi kuin sisäreunan B-jänne 46,9 (jatke levittää)
  tarkista('31n ulkoreunan välit ≈ 49 mm', mk.B.rivit[1].vali >= 48 && mk.B.rivit[1].vali <= 51, String(mk.B.rivit[1].vali));
  // symmetria: 22 merkkiä (parillinen) → puolikas 11 riviä + keskiväli
  tarkista('31o symmetrinen, parillinen puolikas', mk.B.sym === true && mk.B.puolikas && mk.B.puolikas.parillinen === true && mk.B.puolikas.rivit.length === 11, JSON.stringify(mk.B.puolikas && mk.B.puolikas.rivit.length));
  const pk = mk.B.puolikas; tarkista('31p puolikkaan nimet U1 / U22 … U11 / U12 (puoliväli)', pk.rivit[0].nimi === 'U1 / U22' && pk.rivit[10].nimi === 'U11 / U12 (puoliväli)', pk.rivit[10].nimi);
  lahella('31q keskiväli = suora U11–U12', pk.keskiVali, d2(mk.B.merkit[10].p, mk.B.merkit[11].p), 0.5);
  // puolikkaan suorat mitat täsmäävät peilikuvana: U1 alusta = U22 lopusta
  lahella('31r U1 alkukulmasta = U22 loppukulmasta', d2(U[0], mk.B.merkit[0].p), d2(U[U.length - 1], mk.B.merkit[21].p), 0.01);
  // ilman yläpään huullosta B-merkit ennallaan; vain alapään huullos ei muuta B-merkkejä
  const eiYla = yksi({ huAla: 20, huYla: 0 }).merkinnat;
  tarkista('31s ilman yläpään huullosta merkit B', !eiYla.ulko && eiYla.B.rivit[0].nimi === 'B1' && eiYla.B.rivit.length === 21);
  // nurkkasauma, kaksi osaa: ei NaN, merkit olemassa
  const kaksi = L.laskeNelio({ ...nel, huYla: 20, saumat: [{ paikka: 1, ed: 10, seur: 10 }, { paikka: 5, ed: 10, seur: 10 }] });
  tarkista('31t nurkkasauma + kaksi osaa: merkit lukuja', kaksi.osat.every((p) => p.merkinnat.ulko && p.merkinnat.B.rivit.length >= 1 && p.merkinnat.B.rivit.every((r) => Number.isFinite(r.suora) && Number.isFinite(r.vali)) && p.merkinnat.viivat.every((v) => Number.isFinite(v.ulkoPit))));
  // putki-taitto ei muuta merkkejä
  tarkista('31u taittosuunta ei muuta merkkejä', yksi({ huYla: 20, huYlaS: 'putki' }).merkinnat.B.rivit.map((r) => r.suora).join() === mk.B.rivit.map((r) => r.suora).join());
  // leveämpi huullos → jatke kasvaa: 40 mm → A2–B4 pituus 452,1 + 40
  lahella('31v huullos 40: A2–B4 = 452,1 + 40,0', yksi({ huYla: 40 }).merkinnat.viivat.find((x) => x.nimi === 'A2–B4').ulkoPit, 492.1, 0.4);
  // reunaSymmetrinen toimii nyt parillisellakin määrällä
  tarkista('31w reunaSymmetrinen parillinen: peilikuva kelpaa', L.reunaSymmetrinen([[0, 0], [10, 3], [20, 3], [30, 0]], [-5, -3], [35, -3]) === true);
}

// ===== 32. Leikkauskulmat huullokselle (v9, erä 3) =====
{
  const nel = { muoto: 'nelio', W: 600, D: 400, ylaD: 300, H: 400, N: 6, ox: 0, oy: 0, alaSovite: 'ei', ylaSovite: 'ei', t: 0.5, v: 1, saumat: [{ paikka: 0, ed: 10, seur: 10 }], levyTyyppi: 'rulla', levyW: 1250, levyL: 5000 };
  const d2 = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const yksi = (o) => L.laskeNelio({ ...nel, ...o }).osat[0];
  const o = yksi({ huAla: 20, huYla: 20 });
  const rivit = L.nelioKulmat(o, o.sijoitus, false);
  const nimet = rivit.map((r) => r.nimi).join(',');
  tarkista('32a rivien järjestys', nimet === 'T1,A1,H1,H2,A2,H3,H4,A4,H5,H6,A6,H7,H8,A8,H9,H10,A9,T3,T4,B21,H11,H12,B1,T2', nimet);
  // jokainen taulukon piste on ääriviivan kulmapiste pellillä
  const pist = o.sijoitus.pisteet;
  const loytyy = (p) => pist.some((q) => d2(p, q) < 1e-6);
  tarkista('32b kaikki rivit ovat ääriviivan pisteitä', rivit.every((r) => loytyy(r.p)));
  // ääriviivan kulmat (ilman ulkoreunan kaaren välipisteitä) löytyvät taulukosta
  const U = o.kuva.huul.B.ulko;
  const T = (pt) => { const c = Math.cos(o.sijoitus.kierto * Math.PI / 180), si = Math.sin(o.sijoitus.kierto * Math.PI / 180); return [pt[0] * c - pt[1] * si + o.sijoitus.siirtoX, pt[0] * si + pt[1] * c + o.sijoitus.siirtoY]; };
  const sisaiset = U.slice(1, U.length - 1).map(T);
  const puuttuvat = pist.filter((q) => !sisaiset.some((w) => d2(q, w) < 1e-6) && !rivit.some((r) => d2(r.p, q) < 1e-6));
  tarkista('32c ääriviivan kulmat kaikki taulukossa', puuttuvat.length === 0, String(puuttuvat.length));
  // kaari E → S ilman matkaa
  const kaari = rivit.filter((r) => r.seurPit === null);
  tarkista('32d vain yksi kaari: H11 → H12', kaari.length === 1 && kaari[0].nimi === 'H11' && kaari[0].seurNimi === 'H12');
  // matkat: rako (H2 → A2 = 20, A2 → H3 = 20), huulloksen ulkoreuna = liuskan ulkopituus
  const r = (n) => rivit.find((x) => x.nimi === n);
  lahella('32e H2 → A2 = 20 (huulloksen leveys)', r('H2').seurPit, 20, 1e-6);
  lahella('32f A2 → H3 = 20', r('A2').seurPit, 20, 1e-6);
  lahella('32g H1 → H2 = ensimmäisen liuskan ulkopituus', r('H1').seurPit, o.kuva.huul.A.runs[0].ulkoPit, 1e-6);
  lahella('32h T1 → A1 = saumalisä 10', r('T1').seurPit, 10, 1e-6);
  // peräkkäisten rivien matka = pellillä mitattu etäisyys, ja rivin x,y = piste
  tarkista('32i x,y = piste', rivit.every((q) => Math.abs(q.x - q.p[0]) < 1e-9 && Math.abs(q.y - q.p[1]) < 1e-9));
  // ympyrän pisteet mukaan: U22…U1 korvaa kaaren
  const mukaB = L.nelioKulmat(o, o.sijoitus, true);
  tarkista('32j mukaB: 22 U-merkkiä kaaren tilalla, ei kaarta', mukaB.length === rivit.length + 22 && mukaB.every((q) => q.seurPit !== null) && mukaB.filter((q) => /^U/.test(q.nimi)).length === 22);
  tarkista('32k mukaB: U-merkit ovat ulkoreunan pisteitä', mukaB.filter((q) => /^U/.test(q.nimi)).every((q) => {
    let md = Infinity; for (let i = 0; i + 1 < U.length; i++) { const a = T(U[i]), b = T(U[i + 1]), e = [b[0] - a[0], b[1] - a[1]], l2 = e[0] * e[0] + e[1] * e[1]; let t = ((q.p[0] - a[0]) * e[0] + (q.p[1] - a[1]) * e[1]) / l2; t = Math.max(0, Math.min(1, t)); md = Math.min(md, d2(q.p, [a[0] + e[0] * t, a[1] + e[1] * t])); }
    return md < 1e-6; }));
  // vain alapään huullos: kaari T4 → T2 kuten ennen
  const va = L.nelioKulmat(yksi({ huAla: 20 }), yksi({ huAla: 20 }).sijoitus, false);
  tarkista('32l vain alapää: T4 kaari → T2', va[va.length - 2].nimi === 'T4' && va[va.length - 2].seurPit === null && va.some((q) => q.nimi === 'H1'));
  // vain yläpään huullos: alapuoli ennallaan (T1, A1, A2, A4 …), yläpuolella H-pisteet
  const vy = L.nelioKulmat(yksi({ huYla: 20 }), yksi({ huYla: 20 }).sijoitus, false);
  tarkista('32m vain yläpää: alapuoli kuten ennen, H1–H2 ylhäällä', vy.map((q) => q.nimi).join(',') === 'T1,A2,A4,A6,A8,T3,T4,B21,H1,H2,B1,T2', vy.map((q) => q.nimi).join(','));
  // ilman huullosta ei muutu: ensimmäinen rivi ja kaari T4
  const ei = L.nelioKulmat(yksi({}), yksi({}).sijoitus, false);
  tarkista('32n ilman huullosta ennallaan', ei.map((q) => q.nimi).join(',') === 'T1,A2,A4,A6,A8,T3,T4,T2' && ei[6].seurPit === null);
  // nurkkasauma + kaksi osaa: ei NaN
  const kaksi = L.laskeNelio({ ...nel, huAla: 20, huYla: 20, saumat: [{ paikka: 1, ed: 10, seur: 10 }, { paikka: 5, ed: 10, seur: 10 }] });
  tarkista('32o kaksi osaa: taulukot lukuja', kaksi.osat.every((p) => L.nelioKulmat(p, p.sijoitus, true).every((q) => Number.isFinite(q.x) && Number.isFinite(q.y) && (q.seurPit === null || Number.isFinite(q.seurPit)))));
  // saumalisä 0: T- ja A/B-pisteet yhdistyvät (nimi T1=A1)
  const nolla = L.nelioKulmat(yksi({ huAla: 20, huYla: 20, saumat: [{ paikka: 0, ed: 0, seur: 0 }] }), yksi({ huAla: 20, huYla: 20, saumat: [{ paikka: 0, ed: 0, seur: 0 }] }).sijoitus, false);
  tarkista('32p saumalisä 0: T1=A1 yhdistyy', nolla[0].nimi === 'T1=A1' && nolla.some((q) => /^T4=B21/.test(q.nimi)), nolla.map((q) => q.nimi).join(','));
}

console.log(ok + ' tarkistusta läpi, ' + vika + ' virhettä');
console.log(vika === 0 ? 'KAIKKI TESTIT OK' : vika + ' VIRHETTÄ');
process.exit(vika === 0 ? 0 : 1);