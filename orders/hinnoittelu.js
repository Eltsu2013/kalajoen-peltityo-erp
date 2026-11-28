/*
 * hinnoittelu.js — Kalajoen Peltityö ERP: yhteinen hintalaskenta (KPT_HINNOITTELU)
 *
 * Vaihe 1 hinnoittelusta (27.11.2026, projektin claude/hinnoittelu_paatokset_2026-11-27.md).
 * Sama malli kuin profiilit.js: kaavat yhdessä paikassa, sivut (tilauksen hintapaneeli, lasku,
 * myöhemmin tarjous) lukevat tämän, joten sama tuote ei voi saada eri hintaa eri sivuilla.
 * Ei käyttöliittymää eikä tietokantakutsuja: sivu hakee hinnaston rivit ja antaa ne tänne.
 *
 * Tomin päätökset 27.11.2026:
 *  1. Metrihinta kaavalla Materiaaleista: round5(aihio m × ostohinta × kerroin + työ €/m).
 *     Hinnan valinta: värin oma hinta → perushinta (väritön rivi) → "Hinta puuttuu".
 *  2. Tavat: lista (Peltilistat, Vakiomallit), materiaali + aika (saunan kouru, piippu,
 *     harjapiippu, huuva, kartio), kappale (kappaletavara, piipun jalat). Neliöhinta =
 *     round5(ostohinta × kerroin) ilman työtä; työ = minuutit × tuntihinta / 60 (tarkasti).
 *  3. Menekki materiaali + aika -tuotteissa = aihioiden pinta-ala tilausriveiltä
 *     (aihion leveys × pituus × kpl) + kourun päätylaput. Kiila: tilausrivin aihio on jo
 *     leveämmän pään mukaan (Peltilistat lähettää sen niin).
 * Hinnat ALV 0 %, kuten hinnasto.
 *
 * Tietojen muoto (kuten kannassa):
 *  materiaalit = pricing_materials-rivit { material, thickness_mm, color, purchase_price, multiplier, work_price }
 *  kiinteat    = pricing_fixed-rivit { product_name, unit, unit_price, ... }
 *  tuote       = order_items-rivi { profile_type, aihio_width_mm, material, color, thickness_mm, quantity,
 *                profile_data: { tyoaika, paatylaputM2, maara, ... }, order_item_rows: [{ mitta_mm, paat_mm, kok_mm, kpl }] }
 *                (tilaus.html:n muistissa olevat rivit { profileType, rows: [{ mitta, paat, kok, kpl }], thickness } ja
 *                kappaletavara { itemType: 'kappale', maara } käyvät myös, vaihe 4a)
 */
(function () {
'use strict';

// ─── Apufunktiot ───────────────────────────────────────────────────
// Pyöristys lähimpään 5 senttiin (sama kuin hinnaston massapäivitys)
function round5(x) { return Math.round(x * 20) / 20; }
// Pyöristys senteille (rivisummat)
function sentit(x) { return Math.round(x * 100) / 100; }
function luku(v) { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : null; }
// Nimet vertaillaan kirjainkoosta ja välilyönneistä välittämättä (sama kuin hinnasto.html:n hmNimi/hmAvain)
function nimi(t) { return String(t == null ? '' : t).trim().toLowerCase().replace(/\s+/g, ' '); }
function paksuus(t) { const n = luku(t); return n !== null && n > 0 ? Math.round(n * 100) / 100 : null; }

// ─── Materiaalin hinta ─────────────────────────────────────────────
// Etsii Materiaaleista hinnan: ensin värin oma hinta, sitten perushinta (väritön rivi).
// Palauttaa { lahde: 'vari' | 'perus', ostohinta, kerroin, tyo, rivi } tai null (= hinta puuttuu).
function materiaalinHinta(materiaalit, valinta) {
  const v = valinta || {};
  const m = nimi(v.material), p = paksuus(v.thickness != null ? v.thickness : v.thickness_mm), c = nimi(v.color);
  if (!m) return null;
  const sopii = r => nimi(r.material) === m && paksuus(r.thickness_mm) === p && luku(r.purchase_price) !== null;
  const rivit = (materiaalit || []).filter(sopii);
  let r = c ? rivit.find(x => nimi(x.color) === c) : null, lahde = 'vari';
  if (!r) { r = rivit.find(x => !nimi(x.color)); lahde = 'perus'; }
  if (!r) return null;
  const kerroin = luku(r.multiplier), tyo = luku(r.work_price);
  return { lahde: lahde, ostohinta: luku(r.purchase_price), kerroin: kerroin !== null ? kerroin : 1, tyo: tyo !== null ? tyo : 0, rivi: r };
}

// Metrihinta €/m: aihion leveys (mm) × ostohinta × kerroin + työ €/m, pyöristys 5 senttiin
function metrihinta(mh, aihioMm) {
  const a = luku(aihioMm);
  if (!mh || a === null || a <= 0) return null;
  return round5(a / 1000 * mh.ostohinta * mh.kerroin + mh.tyo);
}
// Neliöhinta €/m² ilman työtä (materiaali + aika -tuotteet): ostohinta × kerroin, pyöristys 5 senttiin
function neliohinta(mh) { return mh ? round5(mh.ostohinta * mh.kerroin) : null; }

// ─── Tuntihinta ja työ ─────────────────────────────────────────────
// Tuntihinta kiinteistä hinnoista: rivi "Verstastyö", yksikkö h (28.10.: 50,00 €/h). null = ei löydy.
function tuntihinta(kiinteat) {
  // nimi alkaa "Verstastyö" ja yksikkö on tunti (minuuttirivi "Verstastyö (min)" jää pois yksikön takia).
  // Huom: \b ei toimi ö-kirjaimen jälkeen JavaScriptissä, siksi alun vertailu.
  const r = (kiinteat || []).find(x => nimi(x.product_name).indexOf('verstastyö') === 0 && /^(h|t|tunti|tunnit|€\/h)$/.test(nimi(x.unit)) && luku(x.unit_price) !== null);
  return r ? luku(r.unit_price) : null;
}
// Työn hinta minuuteista: tarkasti tuntihinta / 60 (ei pyöristettyä minuuttihintaa), senteille
function tyonHinta(minuutit, tHinta) {
  const m = luku(minuutit), t = luku(tHinta);
  if (m === null || t === null) return null;
  return sentit(m * t / 60);
}

// ─── Tuotteen tiedot tilausriviltä ─────────────────────────────────
const MATERIAALI_AIKA = ['saunakouru', 'piippu', 'huuva', 'kartio'];
function pd(tuote) { return (tuote && tuote.profile_data) || {}; }
// Pituusrivit muodossa [{ kok, kpl, paat }] (kannan order_item_rows tai tilaus.html:n rows)
function rivit(tuote) {
  const lahde = (tuote && (tuote.order_item_rows || tuote.rows)) || pd(tuote).rows || [];
  return lahde.map(r => {
    const mitta = luku(r.mitta_mm != null ? r.mitta_mm : r.mitta) || 0;
    const paat = luku(r.paat_mm != null ? r.paat_mm : r.paat) || 0;
    const kok = luku(r.kok_mm != null ? r.kok_mm : r.kok) || (mitta + paat);
    return { mitta: mitta, paat: paat, kok: kok, kpl: luku(r.kpl) || 0 };
  }).filter(r => r.kok > 0 && r.kpl > 0);
}
// Hinnoittelutapa: 'lista' | 'materiaali_aika' | 'kappale'
// Tyyppi kummastakin muodosta: kanta profile_type, tilaus.html:n muisti profileType ja kappaletavara itemType 'kappale'
// (vaihe 4a, 27.11.2026: ilman tätä tilauksen piiput ja huuvat olisivat olleet listapeltejä).
function tyyppi(tuote) {
  if (!tuote) return '';
  if (tuote.itemType === 'kappale') return 'kappale';
  return nimi(tuote.profile_type != null ? tuote.profile_type : tuote.profileType);
}
function tapa(tuote) {
  const t = tyyppi(tuote);
  if (t === 'kappale') return 'kappale';
  if (MATERIAALI_AIKA.indexOf(t) >= 0) {
    // piipun jalat ja lisäosat: ei pituutta eikä aihiota → kappale
    if (!rivit(tuote).length || !(luku(tuote.aihio_width_mm) > 0)) return 'kappale';
    return 'materiaali_aika';
  }
  return 'lista';
}
// Kappalemäärä yhteensä (pituusrivien kpl, muuten quantity / kappaletavaran määrä)
function kplYhteensa(tuote) {
  const rr = rivit(tuote);
  if (rr.length) return rr.reduce((s, r) => s + r.kpl, 0);
  return luku(tuote && tuote.quantity) || luku(pd(tuote).maara) || luku(tuote && tuote.maara) || luku(tuote && tuote.kpl) || 0;
}
// Juoksumetrit: leikattava pituus (mitta + päät) × kpl
function juoksumetrit(tuote) { return rivit(tuote).reduce((s, r) => s + r.kok / 1000 * r.kpl, 0); }
// Menekki m²: aihio × leikattava pituus × kpl + erillistä peltiä olevat osat (kourun päätylaput, kaikki kourut yhteensä)
function menekkiM2(tuote) {
  const a = luku(tuote && tuote.aihio_width_mm) || 0;
  return rivit(tuote).reduce((s, r) => s + a / 1000 * r.kok / 1000 * r.kpl, 0) + (luku(pd(tuote).paatylaputM2) || 0);
}
// Työaika-arvio minuutteina { suunnittelu_min, tyo_min, yhteensa_min }, null = ei arviota.
// Peltilistat ja kouru: profile_data.tyoaika. Piippu, Harjapiippu, Huuva, Kartio: syöttöpaketissa profile_data.vals.tyoaika
// (ryhmän ensimmäisellä rivillä, hinnoittelu vaihe 3).
function tyoaikaMin(tuote) {
  const ta = pd(tuote).tyoaika || (pd(tuote).vals && pd(tuote).vals.tyoaika);
  if (!ta) return null;
  const y = luku(ta.yhteensa_min);
  if (y !== null) return y;
  const s = luku(ta.suunnittelu_min), t = luku(ta.tyo_min);
  return s === null && t === null ? null : (s || 0) + (t || 0);
}

// ─── Pään kääntö -lisä (päätetty 28.10.) ───────────────────────────
// Ehdotus: jos pituusriveillä on päitä (paat > 0), normaali × 2 päätä. Muuten ei ehdotusta.
function paanKaantoEhdotus(tuote) {
  return rivit(tuote).some(r => r.paat > 0) ? { taso: 'normaali', paat: 2 } : null;
}
// Tasojen hinnat €/pää kiinteistä hinnoista (ryhmä Työt / Tarvikkeet): "Pään kääntö, helppo / normaali / vaativa".
// Ennen rivien uudelleennimeämistä (SQL 27.11.2026) tunnistetaan myös vanhat nimet: "Pään kääntö" = normaali,
// "Toisen pään taivutus" = helppo. Palauttaa { helppo, normaali, vaativa } (puuttuva taso = null).
function paanKaantoHinnat(kiinteat) {
  const out = { helppo: null, normaali: null, vaativa: null };
  const vanhat = {};
  (kiinteat || []).forEach(x => {
    const n = nimi(x.product_name), h = luku(x.unit_price);
    if (h === null) return;
    const m = n.match(/^pään kääntö,\s*(helppo|normaali|vaativa)$/);
    if (m) out[m[1]] = h;
    else if (n === 'pään kääntö') vanhat.normaali = h;
    else if (n === 'toisen pään taivutus') vanhat.helppo = h;
  });
  Object.keys(vanhat).forEach(k => { if (out[k] === null) out[k] = vanhat[k]; });
  return out;
}
// Lisä € = hinta per pää × päitä (1 tai 2) × kpl
function paanKaantoLisa(hintaPerPaa, paat, kpl) {
  const h = luku(hintaPerPaa), p = luku(paat), k = luku(kpl);
  if (h === null || p === null || k === null) return null;
  return sentit(h * p * k);
}

// ─── Rivin hinta ───────────────────────────────────────────────────
// Palauttaa { tapa, osat: [{ nimi, maara, yksikko, ahinta, summa, selite }], yhteensa, puuttuu: [...], tarvitseeTyon, tyoMukana }
//   puuttuu: 'materiaali' (ei valittu), 'hinta' (Materiaaleista ei löydy), 'aihio', 'pituus', 'tuntihinta', 'kappalehinta'
// ctx = { materiaalit, kiinteat, tuntihinta (valinnainen, muuten kiinteistä), kappalehinta (valinnainen, kappaletuotteille) }
// Materiaali + aika: työ lasketaan, jos rivillä on työaika-arvio (kourussa rivillä itsellään, piipussa ja huuvassa
// ryhmän ensimmäisellä rivillä). Puuttuva työaika todetaan ryhmätasolla (ryhmanHinta), ettei piipun joka pala valita.
function rivinHinta(tuote, ctx) {
  const c = ctx || {};
  const tp = tapa(tuote);
  const tulos = { tapa: tp, osat: [], yhteensa: 0, puuttuu: [], tarvitseeTyon: tp === 'materiaali_aika', tyoMukana: false };
  const puuttuu = k => { if (tulos.puuttuu.indexOf(k) < 0) tulos.puuttuu.push(k); };
  const lisaa = (o) => { tulos.osat.push(o); tulos.yhteensa = sentit(tulos.yhteensa + o.summa); };
  const valinta = { material: tuote && tuote.material, color: tuote && tuote.color, thickness: tuote && (tuote.thickness_mm != null ? tuote.thickness_mm : tuote.thickness) };

  if (tp === 'kappale') {
    const kpl = kplYhteensa(tuote), h = luku(c.kappalehinta);
    if (h === null) puuttuu('kappalehinta');
    else lisaa({ nimi: 'Kappaleet', maara: kpl, yksikko: 'kpl', ahinta: h, summa: sentit(kpl * h) });
    return tulos;
  }

  if (!nimi(valinta.material)) puuttuu('materiaali');
  const mh = materiaalinHinta(c.materiaalit, valinta);
  if (nimi(valinta.material) && !mh) puuttuu('hinta');
  if (!(luku(tuote && tuote.aihio_width_mm) > 0)) puuttuu('aihio');
  if (!rivit(tuote).length) puuttuu('pituus');

  if (tp === 'lista') {
    const mHinta = metrihinta(mh, tuote && tuote.aihio_width_mm), jm = juoksumetrit(tuote);
    if (mHinta !== null && jm > 0) lisaa({ nimi: 'Pelti', maara: Math.round(jm * 1000) / 1000, yksikko: 'm', ahinta: mHinta, summa: sentit(mHinta * jm),
      selite: 'aihio ' + luku(tuote.aihio_width_mm) + ' mm × ' + String(mh.ostohinta).replace('.', ',') + ' €/m² × ' + String(mh.kerroin).replace('.', ',') + ' + työ ' + String(mh.tyo).replace('.', ',') + ' €/m' + (mh.lahde === 'vari' ? ' (värin oma hinta)' : '') });
    return tulos;
  }

  // materiaali + aika
  const nHinta = neliohinta(mh), m2 = menekkiM2(tuote);
  if (nHinta !== null && m2 > 0) lisaa({ nimi: 'Materiaali', maara: Math.round(m2 * 1000) / 1000, yksikko: 'm²', ahinta: nHinta, summa: sentit(nHinta * m2),
    selite: String(mh.ostohinta).replace('.', ',') + ' €/m² × ' + String(mh.kerroin).replace('.', ',') + (mh.lahde === 'vari' ? ' (värin oma hinta)' : '') });
  const min = tyoaikaMin(tuote);
  if (min !== null) {
    tulos.tyoMukana = true;
    const th = luku(c.tuntihinta) !== null ? luku(c.tuntihinta) : tuntihinta(c.kiinteat);
    if (th === null) puuttuu('tuntihinta');
    else if (min > 0) lisaa({ nimi: 'Työ', maara: min, yksikko: 'min', ahinta: th / 60, summa: tyonHinta(min, th), selite: th + ' €/h' });
  }
  return tulos;
}

// ─── Ryhmän hinta ──────────────────────────────────────────────────
// Summa ryhmän riveistä (esim. piippu = palat + jalat + työ). ctx.kappalehinnat = { [tuotteen indeksi]: hinta } (valinnainen).
// Lisää ryhmälle puutteen 'tyoaika', jos ryhmässä on materiaali + aika -tuotteita eikä yhdelläkään ole työaika-arviota.
function ryhmanHinta(tuotteet, ctx) {
  const c = ctx || {};
  const rr = (tuotteet || []).map((t, i) => rivinHinta(t, Object.assign({}, c, { kappalehinta: c.kappalehinnat ? c.kappalehinnat[i] : undefined })));
  const puuttuu = [];
  rr.forEach(r => r.puuttuu.forEach(k => { if (puuttuu.indexOf(k) < 0) puuttuu.push(k); }));
  if (rr.some(r => r.tarvitseeTyon) && !rr.some(r => r.tyoMukana)) puuttuu.push('tyoaika');
  return { rivit: rr, yhteensa: sentit(rr.reduce((s, r) => s + r.yhteensa, 0)), puuttuu: puuttuu };
}

// ─── Käsin muokkaus (vaihe 4b-1, 28.11.2026, suunnitelma projektin claude/vaihe4b_suunnitelma.md) ─
// Muokkaus m (rivin tai ryhmän, tallennetaan tilauksen orders.pricing-lokeroon):
//   { oma_hinta (€/m, listapelti), kappalehinta (€/kpl), paan_kaanto: { taso: 'ei'|'helppo'|'normaali'|'vaativa'|'oma', paat: 1|2, hinta (oma €/pää) },
//     lisa_eur, alennus_pct, alennus_eur, syy (sisäinen), nayta_alennus (laskulla, oletus true) }
// Laskentajärjestys (Tomi 28.11.):
//   1. (oma hinta tai laskettu €/m) × metrit + pään kääntö + lisä
//   2. alennus: % tästä tai € (enintään koko summa)
// Pään kääntö: ilman valintaa ehdotus (normaali × 2, jos riveillä on päitä) on mukana summassa merkinnällä ehdotus
// (Tomi 28.11.: unohtunut lisä on menetettyä rahaa), taso 'ei' poistaa sen.
function ehdotuksenPaanKaanto(tuote, m) {
  if (m && m.paan_kaanto) return { taso: m.paan_kaanto.taso, paat: m.paan_kaanto.paat, hinta: m.paan_kaanto.hinta, ehdotus: false };
  const e = paanKaantoEhdotus(tuote);
  return e ? { taso: e.taso, paat: e.paat, hinta: null, ehdotus: true } : null;
}
// Alennus % lasketaan senteissä, ettei liukuluku pyöristä esim. 8,305 → 8,30.
function alennusOsa(pohja, m) {
  if (!m) return null;
  const pct = luku(m.alennus_pct), eur = luku(m.alennus_eur);
  let summa = 0, selite = '';
  if (pct !== null && pct > 0) { const p = Math.min(pct, 100); summa = Math.round(Math.round(pohja * 100) * p / 100) / 100; selite = String(p).replace('.', ',') + ' %'; }
  else if (eur !== null && eur > 0) { summa = sentit(Math.min(eur, Math.max(pohja, 0))); selite = String(eur).replace('.', ',') + ' €'; }
  if (!(summa > 0)) return null;
  return { nimi: 'Alennus', maara: 1, yksikko: 'erä', ahinta: -summa, summa: -summa, selite: selite, alennus: true, nayta: m.nayta_alennus !== false };
}
function lisaOsa(m) {
  const l = luku(m && m.lisa_eur);
  return l !== null && l !== 0 ? { nimi: 'Lisä', maara: 1, yksikko: 'erä', ahinta: sentit(l), summa: sentit(l), selite: '', lisa: true } : null;
}
function onMuokattu(m) {
  return !!m && (luku(m.oma_hinta) !== null || luku(m.lisa_eur) || luku(m.alennus_pct) > 0 || luku(m.alennus_eur) > 0);
}

// Rivin hinta muokkauksineen. Palauttaa rivinHinnan muodon + { ilmanMuokkausta, muokattu, ehdotus, alennus }.
function rivinHintaMuokattu(tuote, ctx, m) {
  const c = Object.assign({}, ctx || {});
  if (m && luku(m.kappalehinta) !== null) c.kappalehinta = luku(m.kappalehinta);
  const r = rivinHinta(tuote, c);
  r.muokattu = onMuokattu(m); r.ehdotus = false; r.alennus = null;
  if (r.tapa === 'lista') {
    const pelti = r.osat.find(o => o.nimi === 'Pelti');
    const oma = luku(m && m.oma_hinta);
    if (pelti && oma !== null && oma >= 0) {
      pelti.laskettuAhinta = pelti.ahinta; pelti.ahinta = oma; pelti.summa = sentit(oma * pelti.maara); pelti.oma = true;
    }
    const pk = ehdotuksenPaanKaanto(tuote, m);
    if (pk && pk.taso !== 'ei') {
      const hinnat = paanKaantoHinnat(c.kiinteat);
      const hPaa = pk.taso === 'oma' ? luku(pk.hinta) : hinnat[pk.taso];
      const kpl = kplYhteensa(tuote), paat = luku(pk.paat) || 2;
      if (hPaa === null || hPaa === undefined) { if (r.puuttuu.indexOf('paankaanto') < 0) r.puuttuu.push('paankaanto'); }
      else {
        r.osat.push({ nimi: 'Pään kääntö', maara: paat * kpl, yksikko: 'kpl', ahinta: hPaa, summa: sentit(hPaa * paat * kpl),
          selite: pk.taso + ', ' + paat + (paat === 1 ? ' pää' : ' päätä') + ' × ' + kpl + ' kpl', ehdotus: pk.ehdotus, taso: pk.taso, paat: paat });
        r.ehdotus = pk.ehdotus;
      }
    }
  }
  const lo = lisaOsa(m); if (lo) r.osat.push(lo);
  // Hinta ilman käsin tehtyjä muutoksia (oma hinta, lisä, alennus), mutta pään kääntö mukana: yliviivattu luku
  r.ilmanMuokkausta = sentit(r.osat.filter(o => !o.lisa).reduce((s, o) => s + (o.oma ? o.laskettuAhinta * o.maara : o.summa), 0));
  const pohja = sentit(r.osat.reduce((s, o) => s + o.summa, 0));
  const ao = alennusOsa(pohja, m); if (ao) { r.osat.push(ao); r.alennus = ao; }
  r.yhteensa = sentit(r.osat.reduce((s, o) => s + o.summa, 0));
  return r;
}

// Ryhmän hinta muokkauksineen. mk = { rivit: { [indeksi]: m }, ryhma: m (lisä / alennus koko ryhmälle, esim. piippu) }
// ctx.kappalehinnat kuten ryhmanHinnassa (rivin oma kappalehinta voittaa).
function ryhmanHintaMuokattu(tuotteet, ctx, mk) {
  const c = ctx || {}, k = mk || {}, rm = k.rivit || {};
  const rr = (tuotteet || []).map((t, i) => rivinHintaMuokattu(t, Object.assign({}, c, { kappalehinta: c.kappalehinnat ? c.kappalehinnat[i] : undefined }), rm[i]));
  const puuttuu = [];
  rr.forEach(r => r.puuttuu.forEach(x => { if (puuttuu.indexOf(x) < 0) puuttuu.push(x); }));
  if (rr.some(r => r.tarvitseeTyon) && !rr.some(r => r.tyoMukana)) puuttuu.push('tyoaika');
  const valisumma = sentit(rr.reduce((s, r) => s + r.yhteensa, 0));
  const osat = [], lo = lisaOsa(k.ryhma); if (lo) osat.push(lo);
  const pohja = sentit(valisumma + (lo ? lo.summa : 0));
  const ao = alennusOsa(pohja, k.ryhma); if (ao) osat.push(ao);
  return { rivit: rr, valisumma: valisumma, osat: osat, alennus: ao, muokattu: onMuokattu(k.ryhma),
    yhteensa: sentit(pohja + (ao ? ao.summa : 0)), puuttuu: puuttuu };
}

// Tilauksen summa: ryhmien summat + koko tilauksen alennus (% tai €). Palauttaa
// { valisumma, alennus (osa tai null), yhteensa, alennuksetYhteensa (rivit + ryhmät + tilaus, negatiivinen tai 0), ehdotuksia }
function tilauksenHinta(ryhmat, m) {
  const rr = ryhmat || [];
  const valisumma = sentit(rr.reduce((s, g) => s + (g.yhteensa || 0), 0));
  const ao = alennusOsa(valisumma, m);
  let ale = ao ? ao.summa : 0, ehd = 0;
  rr.forEach(g => {
    (g.osat || []).forEach(o => { if (o.alennus) ale += o.summa; });
    (g.rivit || []).forEach(r => { (r.osat || []).forEach(o => { if (o.alennus) ale += o.summa; if (o.ehdotus) ehd++; }); });
  });
  return { valisumma: valisumma, alennus: ao, yhteensa: sentit(valisumma + (ao ? ao.summa : 0)), alennuksetYhteensa: sentit(ale), ehdotuksia: ehd };
}

// Puutteiden tekstit käyttöliittymään (suomeksi)
const PUUTE_TEKSTIT = {
  materiaali: 'Materiaali valitsematta', hinta: 'Hinta puuttuu (Hinnasto → Materiaalit)', aihio: 'Aihion leveys puuttuu',
  pituus: 'Pituus puuttuu', tuntihinta: 'Tuntihinta puuttuu (Hinnasto → Kiinteät hinnat: Verstastyö)',
  kappalehinta: 'Kappalehinta puuttuu', tyoaika: 'Työaika puuttuu',
  paankaanto: 'Pään käännön hinta puuttuu (Hinnasto → Kiinteät hinnat)'
};
function puuteTeksti(k) { return PUUTE_TEKSTIT[k] || k; }

window.KPT_HINNOITTELU = {
  versio: '2026-11-28',
  round5: round5, sentit: sentit,
  materiaalinHinta: materiaalinHinta, metrihinta: metrihinta, neliohinta: neliohinta,
  tuntihinta: tuntihinta, tyonHinta: tyonHinta,
  tyyppi: tyyppi, tapa: tapa, rivit: rivit, kplYhteensa: kplYhteensa, juoksumetrit: juoksumetrit, menekkiM2: menekkiM2, tyoaikaMin: tyoaikaMin,
  paanKaantoEhdotus: paanKaantoEhdotus, paanKaantoHinnat: paanKaantoHinnat, paanKaantoLisa: paanKaantoLisa,
  rivinHinta: rivinHinta, ryhmanHinta: ryhmanHinta, puuteTeksti: puuteTeksti,
  rivinHintaMuokattu: rivinHintaMuokattu, ryhmanHintaMuokattu: ryhmanHintaMuokattu, tilauksenHinta: tilauksenHinta, onMuokattu: onMuokattu
};
})();
