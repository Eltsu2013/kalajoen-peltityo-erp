// tyokortti.js — yhteinen työkortin pohja (vaihe 7, 23.11.2026). window.KPT_TYOKORTTI
//
// Mustavalkoinen pysty-A4: logo (logo-musta.png), otsikko, QR-koodi, tilauksen tiedot, huomio, sivunvaihdot,
// ruudut ja kpl-laatikot, tulostusaika. Sivu rakentaa kortin sisällön itse (HTML-merkkijono) ja antaa sen tälle
// tiedostolle; tämä hoitaa tyylit, tulostuksen ja sen, että paperille tulee VAIN työkortti.
// Käyttäjät: piippu_tuotanto.html (7.1). Myöhemmin tuotanto.html, Huuva ja Kartio (suunnitelma claude/tyokortti_suunnitelma.md).
//
// QR-koodi tarvitsee kirjaston qrcode-generator (sama kuin tuotanto.html):
//   <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
// Ilman sitä kortti tulostuu ilman QR:ää.
//
// Käyttö:
//   KPT_TYOKORTTI.asenna(valinnat => html, { valinnat: [{ id, teksti, oletus }], avain });   // Ctrl+P ja tulosta() käyttävät tätä
//   KPT_TYOKORTTI.tulostaKysyen();           // "Tulosta"-nappi: valintaikkuna, sitten tulostus
//   html = T.sivu(T.ylaosa({...}) + T.tiedot({...}) + ... + T.alaosa())
//
// MUISTA: kun tätä tiedostoa muutetaan, nosta tyokortti.js?v=-numeroa kaikilla sivuilla, jotka lataavat sen.
// v5 (25.11.2026, vaihe 8.4c): asetaTilaus({ numero, ryhma, orderId, ...tiedot }) — sivu on avattu Tuotannosta tilauksen
//   ryhmälle: ensimmäiselle sivulle lisätään yläosan alle tilausrivi, tilauksen tiedot ja QR (tuotanto.html?tilaus=<id>).
//   Ilman asetaTilausta kortit ennallaan. Käyttäjät: huuva.html, kartio.html.
// Versiot: v1 (23.11.2026) pohja ja piipun etusivu. v2 (23.11.2026) rajaa() ja kuvat rinnakkain (.tkk-kuvat). v3: ylaosaPieni() ja palasivujen tyylit. v4: tulostusikkuna valintoineen (tulostaKysyen).
(function () {
  'use strict';
  const ID = 'tkk';

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const pvm = iso => { const [y, m, d] = String(iso || '').slice(0, 10).split('-'); return d ? `${+d}.${+m}.${y}` : ''; };
  function nytTeksti() {
    const n = new Date();
    return `${n.getDate()}.${n.getMonth() + 1}.${n.getFullYear()} klo ${String(n.getHours()).padStart(2, '0')}.${String(n.getMinutes()).padStart(2, '0')}`;
  }
  const STATUS_FI = { DRAFT: 'Luonnos', IN_PROGRESS: 'Kesken', QUOTED: 'Tarjottu', ORDERED: 'Tilattu', IN_PRODUCTION: 'Työn alla', COMPLETED: 'Valmis', INVOICED: 'Laskutettu', ARCHIVED: 'Arkistoitu' };

  // ---------- Tyylit ----------
  // Ruudulla kortti on piilossa. Tulostettaessa body saa luokan tkk-tulostus, ja silloin näkyy vain kortti.
  const CSS = `
#${ID} { display: none; }
#tkk-ikkuna { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; align-items: center; justify-content: center; z-index: 9999; padding: 16px; }
#tkk-ikkuna .tkk-ikk-laatikko { background: #1f2937; color: #f1f5f9; border: 1px solid #475569; border-radius: 8px; padding: 18px 20px; width: 100%; max-width: 380px; font-family: 'IBM Plex Sans', Arial, sans-serif; }
#tkk-ikkuna h3 { margin: 0 0 12px; font-size: 16px; }
#tkk-ikkuna label { display: flex; gap: 10px; align-items: center; padding: 8px 0; font-size: 15px; cursor: pointer; }
#tkk-ikkuna input[type=checkbox] { width: 20px; height: 20px; }
#tkk-ikkuna .tkk-ikk-napit { display: flex; gap: 10px; justify-content: flex-end; margin-top: 14px; }
#tkk-ikkuna button { padding: 9px 16px; border-radius: 6px; border: 1px solid #475569; background: transparent; color: #f1f5f9; font-size: 14px; cursor: pointer; }
#tkk-ikkuna button.tkk-ikk-ok { background: #f97316; border-color: #f97316; color: #111; font-weight: 700; }
@media print { #tkk-ikkuna { display: none !important; } }
@media print {
  @page { size: A4 portrait; margin: 10mm; }
  body.tkk-tulostus { background: #fff !important; }
  body.tkk-tulostus > *:not(#${ID}) { display: none !important; }
  body.tkk-tulostus #${ID} { display: block !important; }
  #${ID} { font-family: 'IBM Plex Sans', Arial, sans-serif; font-size: 9.5pt; color: #000; line-height: 1.3; }
  #${ID} * { color: #000 !important; background: transparent !important; box-shadow: none !important; }
  #${ID} .tkk-sivu { break-after: page; page-break-after: always; }
  #${ID} .tkk-sivu:last-child { break-after: auto; page-break-after: auto; }
  #${ID} .tkk-yla { display: grid; grid-template-columns: auto 1fr auto; gap: 6mm; align-items: start; border-bottom: 2px solid #000; padding-bottom: 3mm; }
  #${ID} .tkk-yla img.tkk-logo { height: 13mm; width: auto; display: block; }
  #${ID} .tkk-otsikko h1 { margin: 0; font-size: 16pt; letter-spacing: 0.04em; }
  #${ID} .tkk-otsikko .tkk-ala { font-size: 12pt; font-weight: 700; margin-top: 1mm; }
  #${ID} .tkk-otsikko .tkk-pieni { font-size: 9pt; }
  #${ID} .tkk-qr { text-align: center; font-size: 6.5pt; line-height: 1.2; }
  #${ID} .tkk-qr svg { width: 22mm; height: 22mm; display: block; margin: 0 auto 0.5mm; }
  #${ID} .tkk-tilausrivi { display: flex; gap: 5mm; align-items: flex-start; border: 0.3mm solid #000; padding: 2mm 3mm; margin: 2mm 0 3mm; }
  #${ID} .tkk-tilausrivi > div:last-child { flex: 1; }
  #${ID} .tkk-tilausotsikko { font-weight: 700; font-size: 11pt; }
  #${ID} .tkk-tiedot { display: grid; grid-template-columns: 1.3fr 1.3fr 1fr; gap: 1.2mm 6mm; margin: 2.5mm 0; }
  #${ID} .tkk-lab { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.08em; color: #444 !important; }
  #${ID} .tkk-arvo { font-weight: 600; white-space: pre-line; }
  #${ID} .tkk-yht { font-family: 'IBM Plex Mono', monospace; font-size: 9pt; margin-top: 0.5mm; overflow-wrap: anywhere; }
  #${ID} .tkk-iso { font-size: 13pt; font-weight: 700; }
  #${ID} .tkk-laatikko { border: 1px solid #000; padding: 1.5mm 3mm; margin: 0 0 3mm; white-space: pre-line; }
  #${ID} .tkk-huomio { border: 2px solid #000; padding: 1.5mm 3mm; margin: 0 0 3mm; font-weight: 700; white-space: pre-line; }
  #${ID} h2 { font-size: 11pt; margin: 2.5mm 0 1mm; border-bottom: 1px solid #000; padding-bottom: 0.8mm; display: flex; justify-content: space-between; gap: 4mm; break-after: avoid; }
  #${ID} h2 span { font-size: 9pt; font-weight: 400; }
  #${ID} .tkk-kuva svg { width: 100%; height: auto; max-height: 50mm; display: block; }
  #${ID} .tkk-kuvat { display: grid; grid-template-columns: minmax(0,3fr) minmax(0,2fr); gap: 5mm; align-items: center; }
  #${ID} .tkk-kuvat .tkk-kuva svg { max-height: 56mm; margin: 0 auto; }
  #${ID} .tkk-yla-pieni { display: grid; grid-template-columns: auto 1fr auto; gap: 4mm; align-items: center; border-bottom: 1.5px solid #000; padding-bottom: 1.5mm; margin-bottom: 2mm; font-size: 9pt; }
  #${ID} .tkk-yla-pieni img.tkk-logo { height: 7mm; width: auto; display: block; }
  #${ID} h1.tkk-pala { font-size: 17pt; margin: 1mm 0 1mm; display: flex; align-items: center; gap: 4mm; }
  #${ID} h1.tkk-pala .tkk-kpl { font-size: 15pt; }
  #${ID} .tkk-levitys svg { width: 100%; height: auto; max-height: 92mm; display: block; }
  #${ID} .tkk-selite { font-size: 7.5pt; margin: 0.5mm 0 1mm; }
  #${ID} .tkk-lahi { display: grid; grid-template-columns: repeat(5, 1fr); gap: 2mm; }
  #${ID} .tkk-lahi svg { width: 100%; height: auto; display: block; border: 0.5px solid #999; }
  #${ID} .tkk-merk-iso svg { width: 100%; height: auto; max-height: 140mm; display: block; margin: 2mm 0; }
  #${ID} .tkk-pisteet .pt-wrap { display: flex; gap: 6mm; align-items: flex-start; }
  #${ID} .tkk-pisteet table { width: auto; min-width: 45mm; margin: 0; }
  #${ID} .tkk-pisteet td, #${ID} .tkk-pisteet th { padding: 0.6mm 3mm; font-size: 10.5pt; text-align: right; }
  #${ID} .tkk-kaksi { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; align-items: start; }
  #${ID} .tkk-rivi { display: flex; flex-wrap: wrap; gap: 1mm 6mm; font-size: 9.5pt; margin: 1mm 0; }
  #${ID} .tkk-rivi b { font-family: 'IBM Plex Mono', monospace; }
  #${ID} table { width: 100%; border-collapse: collapse; margin-top: 1.5mm; table-layout: fixed; break-inside: auto; }
  #${ID} tr { break-inside: avoid; }
  #${ID} th { font-size: 7pt; text-transform: uppercase; letter-spacing: 0.06em; text-align: left; border-bottom: 1px solid #000; padding: 0.8mm 1.2mm; }
  #${ID} td { border-bottom: 0.5px solid #999; padding: 0.5mm 1.2mm; font-family: 'IBM Plex Mono', monospace; font-size: 9.5pt; vertical-align: top; overflow-wrap: anywhere; }
  #${ID} td.tkk-teksti { font-family: 'IBM Plex Sans', Arial, sans-serif; font-size: 9.5pt; }
  #${ID} td .tkk-lisa { display: block; font-family: 'IBM Plex Sans', Arial, sans-serif; font-size: 7.5pt; }
  #${ID} .tkk-c { text-align: center; }
  #${ID} .tkk-r { text-align: right; }
  #${ID} .tkk-ruutu { display: inline-block; width: 4mm; height: 4mm; border: 1.2px solid #000; vertical-align: middle; }
  #${ID} .tkk-kpl { display: inline-block; border: 2px solid #000; border-radius: 2mm; padding: 0 2.5mm; font-weight: 700; white-space: nowrap; }
  #${ID} .tkk-mitat { columns: 2; column-gap: 8mm; font-size: 8pt; line-height: 1.2; }
  #${ID} .tkk-mitat .mitta-row { display: flex; justify-content: space-between; gap: 3mm; break-inside: avoid; font-family: 'IBM Plex Mono', monospace; }
  #${ID} .tkk-mitat > div { display: block !important; }
    #${ID} .tkk-viivat { height: 13mm; background: repeating-linear-gradient(transparent, transparent 6.5mm, #999 6.5mm, #999 6.8mm) !important; }
  #${ID} .tkk-aika { display: flex; align-items: baseline; flex-wrap: wrap; gap: 1mm 2mm; margin-top: 1.8mm; font-size: 9pt; font-family: 'IBM Plex Sans', Arial, sans-serif; }
  #${ID} .tkk-aika .tkk-viiva { display: inline-block; width: 20mm; border-bottom: 1px solid #000; height: 3.5mm; }
  #${ID} .tkk-aika .tkk-vali { display: inline-block; width: 5mm; }
  #${ID} .tkk-aika .tkk-arvio { margin-left: auto; font-size: 7.5pt; }
  #${ID} .tkk-alaosa { margin-top: 2.5mm; border-top: 1px solid #000; padding-top: 1.5mm; font-size: 7.5pt; display: flex; justify-content: space-between; }
}`;
  function lisaaTyylit() {
    if (typeof document === 'undefined' || document.getElementById('tkk-tyylit')) return;
    const st = document.createElement('style');
    st.id = 'tkk-tyylit';
    st.textContent = CSS;
    document.head.appendChild(st);
  }
  function elementti() {
    let el = document.getElementById(ID);
    if (!el) { el = document.createElement('div'); el.id = ID; document.body.appendChild(el); }
    return el;
  }

  // ---------- Palikat ----------
  function qrSvg(teksti) {
    if (typeof qrcode !== 'function' || !teksti) return '';
    try {
      const qr = qrcode(0, 'M');
      qr.addData(teksti);
      qr.make();
      return qr.createSvgTag({ cellSize: 2, margin: 0, scalable: true });
    } catch (e) { console.warn('QR-koodi:', e); return ''; }
  }

  // o = { otsikko, alaotsikko, pieni, qr (linkki), qrTeksti }
  function ylaosa(o) {
    const qr = qrSvg(o.qr);
    return `<div class="tkk-yla">
      <img class="tkk-logo" src="logo-musta.png" alt="Kalajoen Peltityö">
      <div class="tkk-otsikko"><h1>${esc(o.otsikko || 'TYÖKORTTI')}</h1>${o.alaotsikko ? `<div class="tkk-ala">${esc(o.alaotsikko)}</div>` : ''}${o.pieni ? `<div class="tkk-pieni">${esc(o.pieni)}</div>` : ''}</div>
      ${qr ? `<div class="tkk-qr">${qr}${esc(o.qrTeksti || 'Avaa puhelimella')}</div>` : '<div></div>'}
    </div>`;
  }

  // Jatkosivun ohut yläosa: logo, otsikko ja sivunumero (o = { otsikko, alaotsikko, sivu })
  function ylaosaPieni(o) {
    return `<div class="tkk-yla-pieni"><img class="tkk-logo" src="logo-musta.png" alt="Kalajoen Peltityö"><div><b>${esc(o.otsikko || 'TYÖKORTTI')}</b>${o.alaotsikko ? ' · ' + esc(o.alaotsikko) : ''}</div><div class="tkk-r">${esc(o.sivu || '')}</div></div>`;
  }

  // t = { asiakas, puhelin, email, kohde, toimitus (ISO), osoite, tilattu (ISO), ohjeet }
  function tiedot(t) {
    const tieto = (lab, arvo, luokka) => arvo ? `<div><div class="tkk-lab">${lab}</div><div class="${luokka || 'tkk-arvo'}">${esc(arvo)}</div></div>` : '';
    const yht = [t.puhelin, t.email].map(v => String(v || '').trim()).filter(Boolean).map(v => `<div class="tkk-yht">${esc(v)}</div>`).join('');
    let h = `<div class="tkk-tiedot">
      <div><div class="tkk-lab">Asiakas</div><div class="tkk-arvo">${esc(t.asiakas || '—')}</div>${yht}</div>
      ${tieto('Kohde', t.kohde)}
      ${tieto('Toimitus', pvm(t.toimitus), 'tkk-iso')}
      ${tieto('Työmaan osoite', t.osoite)}
      ${tieto('Tilattu', pvm(t.tilattu))}
    </div>`;
    if (t.ohjeet) h += `<div class="tkk-lab">Ohjeet</div><div class="tkk-laatikko">${esc(t.ohjeet)}</div>`;
    return h;
  }

  const huomio = teksti => teksti ? `<div class="tkk-huomio">⚠ ${esc(teksti)}</div>` : '';
  const ruutu = () => '<span class="tkk-ruutu"></span>';
  const kpl = n => `<span class="tkk-kpl">${esc(n)} kpl</span>`;
  const sivu = sisalto => `<section class="tkk-sivu">${sisalto}</section>`;
  // Työaika paperille (v6, 27.11.2026, Tomi): kirjoitustila suunnittelu- ja työajalle, jotta paperin mukaan tehty työ ja
  // sen aika kulkevat toimistoon. ta = { suunnittelu_min, tyo_min } (profile_data.tyoaika tai vals.tyoaika); arvio pienellä.
  function aikaRivi(ta) {
    const t = ta || {}, luku = x => (Number(x) > 0 ? esc(String(x)) : '–');
    const arvio = (Number(t.suunnittelu_min) > 0 || Number(t.tyo_min) > 0) ? `<span class="tkk-arvio">arvio ${luku(t.suunnittelu_min)} / ${luku(t.tyo_min)} min</span>` : '';
    return `<div class="tkk-aika">Suunnitteluaika <span class="tkk-viiva"></span> min<span class="tkk-vali"></span>Työaika <span class="tkk-viiva"></span> min${arvio}</div>`;
  }
  const alaosa = teksti => `<div class="tkk-alaosa"><span>Kalajoen Peltityö Oy · ${esc(teksti || 'Työkortti')}</span><span>Tulostettu ${nytTeksti()}</span></div>`;

  // Ruudun tummat värit paperille: värit vaihdetaan mustaksi / harmaaksi suoraan SVG-merkkijonossa, jolloin kuva on
  // oikein myös PDF:nä tallennettuna eikä riipu CSS:n ohituksista. Tuntemattomat värit jäävät ennalleen.
  const PAPERI = {
    '#f1f5f9': '#000', '#e2eef5': '#000', '#ededf0': '#000',
    '#22c55e': '#000', '#ef4444': '#000', '#f97316': '#000',
    '#64748b': '#666', '#6b8fa8': '#666', '#847f72': '#666', '#9595a0': '#666', '#3a5468': '#999',
    '#38bdf8': '#333', '#f5b942': '#444', '#f59e0b': '#444', '#e8a020': '#444',
    '#1a2332': 'none', '#111827': 'none', '#0f172a': 'none',
  };
  function paperille(svg) {
    return String(svg || '')
      .replace(/(fill|stroke)="(#[0-9a-fA-F]{3,6})"/g, (m, a, c) => { const u = PAPERI[c.toLowerCase()]; return u ? `${a}="${u}"` : m; })
      .replace(/rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)/g, (m, r, g, b, a) => `rgba(0,0,0,${Math.min(0.12, Number(a)).toFixed(2)})`);
  }

  // Rajaa SVG:n tyhjät reunat pois (viewBox sisällön mukaan), jotta kuva ja tekstit ovat paperilla isompia.
  // Toimii vain selaimessa (mittaa piirretyn sisällön); muuten ja virheessä palauttaa kuvan ennallaan.
  function rajaa(svg, vara) {
    if (typeof document === 'undefined' || !svg) return svg;
    const v = vara === undefined ? 8 : vara;
    const apu = document.createElement('div');
    apu.style.cssText = 'position:absolute;left:-10000px;top:0;width:900px;visibility:hidden;';
    try {
      apu.innerHTML = svg;
      document.body.appendChild(apu);
      const el = apu.querySelector('svg');
      if (!el || !el.getBBox) return svg;
      const b = el.getBBox();
      if (!(b.width > 0 && b.height > 0)) return svg;
      el.setAttribute('viewBox', [b.x - v, b.y - v, b.width + 2 * v, b.height + 2 * v].map(x => Math.round(x * 10) / 10).join(' '));
      el.removeAttribute('width'); el.removeAttribute('height');
      return el.outerHTML;
    } catch (e) { console.warn('Rajaus:', e); return svg; }
    finally { if (apu.parentNode) apu.parentNode.removeChild(apu); }
  }

  // ---------- Tulostus ----------
  // Valinnat (7.3): asenna(fn, { valinnat: [{ id, teksti, oletus }], avain }) näyttää Tulosta-napista ikkunan, jossa valinnat
  // ovat rasteina. Valinnat muistetaan (localStorage), ja Ctrl+P käyttää viimeksi valittuja. fn saa { id: true/false }.
  let rakentaja = null, valmisteltu = false, maaritys = { valinnat: [], avain: 'kpt_tyokortti_valinnat' };
  function lueValinnat() {
    let talletettu = {};
    try { talletettu = JSON.parse(localStorage.getItem(maaritys.avain) || '{}') || {}; } catch (e) { talletettu = {}; }
    const v = {};
    maaritys.valinnat.forEach(x => { v[x.id] = typeof talletettu[x.id] === 'boolean' ? talletettu[x.id] : x.oletus !== false; });
    return v;
  }
  function tallennaValinnat(v) { try { localStorage.setItem(maaritys.avain, JSON.stringify(v)); } catch (e) {} }
  // ---------- Tilauksen tiedot ensimmäiselle sivulle (v5) ----------
  // v7 (27.11.2026): t.tyoaikaRivi = true → lohkon loppuun kirjoitustila ajalle (aikaRivi, t.tyoaika = arvio). Huuva ja Kartio tuotantotilassa.
  let tilaus = null;
  function asetaTilaus(t) { tilaus = t || null; }
  function tilausLohko(t) {
    const linkki = t.orderId && typeof location !== 'undefined' ? location.origin + location.pathname.replace(/[^/]*$/, 'tuotanto.html') + '?tilaus=' + encodeURIComponent(t.orderId) : '';
    const qr = linkki ? qrSvg(linkki) : '';
    return `<div class="tkk-tilausrivi">${qr ? `<div class="tkk-qr">${qr}Tilaus Tuotannossa</div>` : ''}<div>
      <div class="tkk-tilausotsikko">Tilaus ${esc(t.numero || '')}${t.ryhma ? ' · ' + esc(t.ryhma) : ''}${t.status ? ' · ' + esc(STATUS_FI[t.status] || t.status) : ''}</div>
      ${tiedot(t)}${t.tyoaikaRivi ? aikaRivi(t.tyoaika) : ''}</div></div>`;
  }
  // Lisää lohkon ensimmäisen yläosan (tkk-yla / tkk-yla-pieni) perään; jos yläosaa ei löydy, ensimmäisen sivun alkuun
  function lisaaEnsimmaiselle(html, lohko) {
    const alku = html.search(/<div class="tkk-yla(-pieni)?"/);
    if (alku < 0) { const m = html.match(/<section[^>]*>/); return m ? html.replace(m[0], m[0] + lohko) : lohko + html; }
    let syv = 0, i = alku;
    const re = /<div\b|<\/div>/g;
    re.lastIndex = alku;
    let m;
    while ((m = re.exec(html))) {
      syv += m[0] === '</div>' ? -1 : 1;
      if (syv === 0) { i = m.index + m[0].length; break; }
    }
    return html.slice(0, i) + lohko + html.slice(i);
  }
  function rakenna(valinnat) {
    if (!rakentaja) return false;
    let html = '';
    try { html = rakentaja(valinnat || lueValinnat()) || ''; } catch (e) { console.error('Työkortti:', e); html = ''; }
    if (!html) return false;
    if (tilaus) html = lisaaEnsimmaiselle(html, tilausLohko(tilaus));
    lisaaTyylit();
    elementti().innerHTML = html;
    return true;
  }
  // rakenna = (valinnat) => HTML. Palauttaa false/tyhjän, jos korttia ei voi tehdä (silloin tulostuu sivu sellaisenaan).
  function asenna(rakennaFn, asetukset) {
    rakentaja = rakennaFn;
    if (asetukset) maaritys = Object.assign({}, maaritys, asetukset);
    lisaaTyylit();
    if (asenna._kuuntelijat) return;
    asenna._kuuntelijat = true;
    window.addEventListener('beforeprint', () => {
      const ok = valmisteltu || rakenna();
      valmisteltu = false;
      document.body.classList.toggle('tkk-tulostus', !!ok);
    });
    window.addEventListener('afterprint', () => document.body.classList.remove('tkk-tulostus'));
  }
  // Tulostus suoraan annetuilla (tai muistetuilla) valinnoilla. Pieni viive, jotta selain ehtii piirtää kortin ennen tulostusikkunaa.
  function tulosta(valinnat) {
    const ok = rakenna(valinnat);
    valmisteltu = ok;
    document.body.classList.toggle('tkk-tulostus', ok);
    setTimeout(() => window.print(), 80);
  }
  // Tulosta-nappi: valintaikkuna, jos valintoja on; muuten suoraan
  function tulostaKysyen() {
    if (!maaritys.valinnat.length) { tulosta(); return; }
    const v = lueValinnat();
    let ikk = document.getElementById('tkk-ikkuna');
    if (ikk) ikk.remove();
    ikk = document.createElement('div');
    ikk.id = 'tkk-ikkuna';
    ikk.innerHTML = `<div class="tkk-ikk-laatikko" role="dialog" aria-label="Tulosta työkortti">
      <h3>Tulosta työkortti</h3>
      ${maaritys.valinnat.map(x => `<label><input type="checkbox" data-id="${esc(x.id)}"${v[x.id] ? ' checked' : ''}> ${esc(x.teksti)}</label>`).join('')}
      <div class="tkk-ikk-napit"><button type="button" data-t="peru">Peruuta</button><button type="button" data-t="ok" class="tkk-ikk-ok">🖨 Tulosta</button></div>
    </div>`;
    document.body.appendChild(ikk);
    const sulje = () => ikk.remove();
    ikk.addEventListener('click', e => { if (e.target === ikk) sulje(); });
    ikk.querySelector('[data-t="peru"]').onclick = sulje;
    ikk.querySelector('[data-t="ok"]').onclick = () => {
      const uusi = {};
      ikk.querySelectorAll('input[data-id]').forEach(i => { uusi[i.getAttribute('data-id')] = i.checked; });
      tallennaValinnat(uusi);
      sulje();
      tulosta(uusi);
    };
    ikk.querySelector('[data-t="ok"]').focus();
  }

  const KPT_TYOKORTTI = { VERSIO: 7, aikaRivi, asetaTilaus, lisaaEnsimmaiselle, esc, pvm, nytTeksti, STATUS_FI, qrSvg, ylaosa, ylaosaPieni, tiedot, huomio, ruutu, kpl, sivu, alaosa, paperille, rajaa, asenna, tulosta, tulostaKysyen, lueValinnat, rakenna, CSS };
  if (typeof window !== 'undefined') window.KPT_TYOKORTTI = KPT_TYOKORTTI;
  if (typeof module !== 'undefined') module.exports = KPT_TYOKORTTI;
})();
