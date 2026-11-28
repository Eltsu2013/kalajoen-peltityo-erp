// Hintojen lukitus tilaukseen (hinnoittelu vaihe 4b-2, 28.11.2026, suunnitelma projektin claude/vaihe4b_suunnitelma.md).
// Tomi 27.–28.11.: hinnat lukitaan automaattisesti, kun tilaus siirtyy Tarjottu- tai Tilattu-tilaan (tai suoraan
// myöhempään tilaan), mistä tahansa sivusta. Lukitaan yksikköhinnat: hinnaston rivit (Materiaalit + Kiinteät hinnat)
// kopioidaan tilaukseen orders.pricing.lukittu, ja lukitun tilauksen hinnat lasketaan kopiosta (hinnoittelu.js).
// Käyttäjät: tilaus.html, tilaukset.html, tuotanto.html.
//
// orders.pricing = { lukittu: { aika, tila, materiaalit, kiinteat, paivitetty? }, rivit: {}, ryhmat: {}, tilaus: {} }
(function () {
'use strict';

const LUKITTAVAT = ['QUOTED', 'ORDERED', 'IN_PRODUCTION', 'COMPLETED', 'INVOICED'];
const TILAT = { QUOTED: 'Tarjottu', ORDERED: 'Tilattu', IN_PRODUCTION: 'Työn alla', COMPLETED: 'Valmis', INVOICED: 'Laskutettu' };
const MAT_KENTAT = 'material,thickness_mm,color,purchase_price,multiplier,work_price';
const KIINTEAT_KENTAT = 'product_name,unit,unit_price';

function lukitaankoTila(tila) { return LUKITTAVAT.indexOf(tila) >= 0; }
function tilaTeksti(tila) { return TILAT[tila] || tila || ''; }

function otsakkeet(o) {
  return { apikey: o.key, Authorization: 'Bearer ' + o.key, 'Content-Type': 'application/json' };
}
async function hae(o, polku) {
  const r = await fetch(o.url + '/rest/v1/' + polku, { headers: otsakkeet(o) });
  const j = await r.json().catch(() => null);
  if (!r.ok || !Array.isArray(j)) throw new Error(polku.split('?')[0] + ' (' + r.status + ')');
  return j;
}

// Nykyinen hinnasto kopioksi
async function haeHinnasto(o) {
  const [materiaalit, kiinteat] = await Promise.all([
    hae(o, 'pricing_materials?select=' + MAT_KENTAT),
    hae(o, 'pricing_fixed?select=' + KIINTEAT_KENTAT)
  ]);
  return { materiaalit, kiinteat };
}
function kopio(hinnasto, tila, paivitetty) {
  const k = { aika: new Date().toISOString(), tila: tila || null, materiaalit: hinnasto.materiaalit || [], kiinteat: hinnasto.kiinteat || [] };
  if (paivitetty) k.paivitetty = true;
  return k;
}
async function haePricing(o, orderId) {
  const r = await hae(o, 'orders?id=eq.' + encodeURIComponent(orderId) + '&select=pricing');
  return (r[0] && r[0].pricing) || {};
}
async function tallennaPricing(o, orderId, pricing) {
  const r = await fetch(o.url + '/rest/v1/orders?id=eq.' + encodeURIComponent(orderId), {
    method: 'PATCH', headers: Object.assign(otsakkeet(o), { Prefer: 'return=minimal' }), body: JSON.stringify({ pricing: pricing })
  });
  if (!r.ok) throw new Error('orders (' + r.status + ')');
  return pricing;
}

// Lukitsee tilauksen hinnat, jos tila on lukittava eikä lukitusta vielä ole.
// Palauttaa { lukittiin: true|false, pricing } tai heittää virheen. o = { url, key, hinnasto? (valmiiksi haettu) }
async function lukitse(orderId, tila, o) {
  if (!orderId || !lukitaankoTila(tila)) return { lukittiin: false, pricing: null };
  const pricing = await haePricing(o, orderId);   // tuore kannasta: toinen välilehti on voinut jo lukita
  if (pricing.lukittu) return { lukittiin: false, pricing };
  const hinnasto = o.hinnasto || await haeHinnasto(o);
  pricing.lukittu = kopio(hinnasto, tila);
  await tallennaPricing(o, orderId, pricing);
  return { lukittiin: true, pricing };
}

// "Päivitä nykyiseen hinnastoon": vaihtaa hinnastokopion, muokkaukset (rivit, ryhmät, tilaus) säilyvät.
async function paivitaNykyiseen(orderId, tila, o) {
  const pricing = await haePricing(o, orderId);
  const hinnasto = o.hinnasto || await haeHinnasto(o);
  pricing.lukittu = kopio(hinnasto, tila, true);
  await tallennaPricing(o, orderId, pricing);
  return pricing;
}

// Lukitun kopion ja nykyisen hinnaston yhdistelmä laskentaa varten: lukittu rivi voittaa; nykyisestä otetaan rivit,
// joita kopiossa ei ole (esim. materiaali lisättiin hinnastoon lukituksen jälkeen). Palauttaa { materiaalit, kiinteat, uudet }
// (uudet = kopiosta puuttuneet rivit, jotka sivu lisää kopioon, jolloin nekin pysyvät jatkossa lukittuina).
function nimi(t) { return String(t == null ? '' : t).trim().toLowerCase().replace(/\s+/g, ' '); }
function paks(t) { const n = parseFloat(String(t == null ? '' : t).replace(',', '.')); return isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : ''; }
function matAvain(r) { return nimi(r.material) + '|' + paks(r.thickness_mm) + '|' + nimi(r.color); }
function yhdista(lukittu, nykyinen) {
  if (!lukittu) return { materiaalit: (nykyinen && nykyinen.materiaalit) || [], kiinteat: (nykyinen && nykyinen.kiinteat) || [], uudet: null };
  const n = nykyinen || { materiaalit: [], kiinteat: [] };
  const mA = {}; (lukittu.materiaalit || []).forEach(r => { if (r.purchase_price != null) mA[matAvain(r)] = true; });
  const kA = {}; (lukittu.kiinteat || []).forEach(r => { if (r.unit_price != null) kA[nimi(r.product_name) + '|' + nimi(r.unit)] = true; });
  const uM = (n.materiaalit || []).filter(r => r.purchase_price != null && !mA[matAvain(r)]);
  const uK = (n.kiinteat || []).filter(r => r.unit_price != null && !kA[nimi(r.product_name) + '|' + nimi(r.unit)]);
  return {
    materiaalit: (lukittu.materiaalit || []).concat(uM),
    kiinteat: (lukittu.kiinteat || []).concat(uK),
    uudet: (uM.length || uK.length) ? { materiaalit: uM, kiinteat: uK } : null
  };
}

window.KPT_HINTALUKITUS = {
  LUKITTAVAT: LUKITTAVAT, lukitaankoTila: lukitaankoTila, tilaTeksti: tilaTeksti,
  haeHinnasto: haeHinnasto, haePricing: haePricing, tallennaPricing: tallennaPricing,
  lukitse: lukitse, paivitaNykyiseen: paivitaNykyiseen, yhdista: yhdista, kopio: kopio
};
})();
