// orders/lahetys.js → KPT_LAHETYS — lähetys tilaukseen (vaihe T1, 25.11.2026)
//
// Ongelma ennen: piippusivu kirjoitti rivit localStorageen (kpt_add_to_order), ja vain toisessa välilehdessä auki oleva
// tilaus.html poimi ne. Jos tilausta ei ollut auki, lähetys katosi, mutta sivu väitti "lähetetty tilaukseen!".
// Kaksi auki olevaa tilausta tallensivat saman lähetyksen kahdesti.
//
// Nyt (Tomi 24.–25.11.2026: "ensin mitat, sitten tilaus" pitää toimia):
//  1. Lähetys tallennetaan odottamaan (kpt_odottavat) ja poistetaan vasta, kun tilaus on tallentanut sen.
//  2. "Ovikello" kpt_add_to_order kertoo auki oleville tilauksille, että lähetys on tullut (sama avain kuin ennen).
//  3. Vain yksi tilaus ottaa sen vastaan: piipun oma tilaus (kohdeTilaus), muuten viimeksi käytetty tilausvälilehti
//     (kpt_aktiivinen_tilaus). Lisäksi lukko (navigator.locks), ettei sama tilaus kahdessa välilehdessä tallenna kahdesti.
//  4. Tilaus kuittaa kahdesti (kpt_lahetys_kuittaus): "vastaanotettu" heti ja "tallennettu" tilausnumeron kanssa.
//  5. Jos kuittausta ei tule noin 1,5 sekunnissa, lähettäjä kysyy: Uusi tilaus / Lisää olemassa olevaan (kaikki tilaukset,
//     myös valmiit, haulla) / Myöhemmin. Avattu tilaus (tilaus.html?odottava=<id>) ottaa lähetyksen heti vastaan.
//  6. Tilaus näyttää avautuessaan muut odottavat lähetykset: "Lisää tähän tilaukseen" / "Hylkää".
//  7. Huomio kulkee lähetyksen mukana, ja tilaus lisää sen tilauksen huomioihin (Tomi 25.11.2026).
//
// Käyttäjät: piippu.html, harjapiippu.html, peltipiirturi.html, vakiomallit.html (lähettäjät, T2 25.11.2026), tilaus.html
// (vastaanotin). Huuva ja Kartio (8.4) tulevat myöhemmin.
// v2 (T2): pellit (ADD_TO_ORDER) eivät korvaa toisiaan odottavien jonossa.
// v3 (8.4a): REPLACE_RYHMA = huuva / kartio (profileType viestissä) korvaa ryhmänsä kuten piippu. Viestit ilman lahetysId:tä (vanhat lähettäjät) käsittelee tilaus.html kuten ennen.
// Testit: testit/lahetys/test_lahetys.js. MUISTA: nosta ?v=-numeroa kaikilla sivuilla, jotka lataavat tämän.
(function () {
  'use strict';

  const ODOTTAVAT = 'kpt_odottavat';
  const KELLO = 'kpt_add_to_order';
  const KUITTAUS = 'kpt_lahetys_kuittaus';
  const AKTIIVINEN = 'kpt_aktiivinen_tilaus';
  const VANHENEE_MS = 14 * 24 * 3600 * 1000;    // odottava lähetys poistuu kahden viikon jälkeen
  const ODOTA_VASTAANOTTOA_MS = 1500;           // näin kauan odotetaan auki olevan tilauksen kuittausta
  const ODOTA_TALLENNUSTA_MS = 45000;           // vastaanotetun lähetyksen tallennus (tilauksen luonti + rivit)

  // ── Puhtaat apufunktiot (testattavissa Nodessa, storage = localStorage-tyyppinen olio) ──────────────
  function lue(storage) {
    try { const a = JSON.parse(storage.getItem(ODOTTAVAT) || '[]'); return Array.isArray(a) ? a : []; } catch (e) { return []; }
  }
  function kirjoita(storage, lista) { storage.setItem(ODOTTAVAT, JSON.stringify(lista)); }
  function uusiId() { return 'l_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8); }

  // Sama ryhmä (piippu) lähetetään usein uudestaan korjattuna: vanha odottava korvataan, ettei samaa piippua jää jonoon kahdesti.
  function lisaaOdottava(storage, l) {
    const lista = lue(storage).filter(x => !(l.ryhma && x.ryhma === l.ryhma));
    lista.push(l);
    kirjoita(storage, lista);
    return l;
  }
  function haeOdottava(storage, id) { return lue(storage).find(x => x.id === id) || null; }
  function poistaOdottava(storage, id) {
    const lista = lue(storage), uusi = lista.filter(x => x.id !== id);
    if (uusi.length !== lista.length) kirjoita(storage, uusi);
    return uusi.length !== lista.length;
  }
  function siivoa(storage, nyt) {
    const raja = (nyt || Date.now()) - VANHENEE_MS;
    const lista = lue(storage), uusi = lista.filter(x => (x.aika || 0) >= raja);
    if (uusi.length !== lista.length) kirjoita(storage, uusi);
    return uusi;
  }
  // Kuuluuko lähetys tälle tilausvälilehdelle? tila = { tabId, orderId }, aktiivinen = kpt_aktiivinen_tilaus
  function onkoMinun(l, tila, aktiivinen) {
    if (!l || !tila) return false;
    if (l.kohdeTilaus) return !!tila.orderId && l.kohdeTilaus === tila.orderId;
    return !!aktiivinen && aktiivinen.tabId === tila.tabId;
  }
  function luoLahetys(viesti, o) {
    o = o || {};
    return {
      id: uusiId(), aika: Date.now(),
      kuvaus: o.kuvaus || 'Työ', lahde: o.lahde || '', huomio: (o.huomio || '').trim(),
      kohdeTilaus: o.kohdeTilaus || null,
      // Vain piippu korvaa koko ryhmän; pellit (ADD_TO_ORDER) ovat erillisiä rivejä, eivät korvaa toisiaan jonossa
      ryhma: viesti && (viesti.type === 'REPLACE_PIIPPU' || viesti.type === 'REPLACE_RYHMA') && viesti.groupId ? viesti.groupId : null,
      viesti,
    };
  }
  // Huomio tilauksen huomioihin: "Lapepiippu 400×450 RR33: huomio". Ei lisätä, jos sama teksti on jo siellä.
  function yhdistaHuomio(nykyinen, kuvaus, huomio) {
    nykyinen = nykyinen || '';
    huomio = (huomio || '').trim();
    if (!huomio || nykyinen.indexOf(huomio) >= 0) return nykyinen;
    const rivi = (kuvaus ? kuvaus + ': ' : '') + huomio;
    return nykyinen.trim() ? nykyinen.replace(/\s+$/, '') + '\n' + rivi : rivi;
  }
  function aikaTeksti(t) {
    const d = new Date(t), pad = n => String(n).padStart(2, '0');
    return d.getDate() + '.' + (d.getMonth() + 1) + '. klo ' + d.getHours() + '.' + pad(d.getMinutes());
  }
  const STATUS_FI = { DRAFT: 'Luonnos', IN_PROGRESS: 'Kesken', QUOTED: 'Tarjottu', ORDERED: 'Tilattu', IN_PRODUCTION: 'Työn alla', COMPLETED: 'Valmis', INVOICED: 'Laskutettu', ARCHIVED: 'Arkisto' };
  function tilausRivi(o) {
    const asiakas = o.customers && o.customers.name ? o.customers.name : 'ei asiakasta';
    const numero = o.order_number || (o.order_date ? String(o.order_date).slice(0, 10).split('-').reverse().join('.') : String(o.id).slice(0, 8));
    return { id: o.id, numero: String(numero), asiakas, kohde: o.kohde || '', tila: STATUS_FI[o.status] || o.status || '' };
  }
  function suodataTilaukset(rivit, haku) {
    const h = (haku || '').trim().toLowerCase();
    if (!h) return rivit;
    return rivit.filter(r => (r.numero + ' ' + r.asiakas + ' ' + r.kohde + ' ' + r.tila).toLowerCase().indexOf(h) >= 0);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  // ── Selaimen osuus ─────────────────────────────────────────────────────────────────────────────
  const selain = typeof window !== 'undefined' && typeof document !== 'undefined';
  const LS = selain ? window.localStorage : null;

  function tyylit() {
    if (!selain || document.getElementById('kpt-lahetys-tyylit')) return;
    const st = document.createElement('style');
    st.id = 'kpt-lahetys-tyylit';
    // Uuden ulkoasun muuttujat, vanhat sivut saavat varavärit (tumma pohja)
    st.textContent = `
.kla-tausta { position: fixed; inset: 0; background: rgba(0,0,0,0.6); z-index: 3000; display: flex; align-items: flex-start; justify-content: center; padding: 24px 12px; overflow-y: auto; }
.kla-ikkuna { background: var(--kpt-paneeli, #1c2532); color: var(--kpt-teksti, #e8eef5); border: 1px solid var(--kpt-reuna, #2a3442); border-radius: 10px; width: 560px; max-width: 100%; padding: 18px; font-family: var(--kpt-fontti, 'IBM Plex Sans', system-ui, sans-serif); box-shadow: 0 10px 40px rgba(0,0,0,0.4); }
.kla-ikkuna h2 { margin: 0 0 4px; font-size: 18px; font-weight: 600; }
.kla-pieni { font-size: 13px; color: var(--kpt-himmea, #94a3b8); margin: 0 0 14px; line-height: 1.45; }
.kla-tyo { font-family: var(--kpt-mono, 'IBM Plex Mono', monospace); font-size: 13px; background: var(--kpt-kentta, #111821); border: 1px solid var(--kpt-reuna, #2a3442); border-radius: 6px; padding: 8px 10px; margin-bottom: 14px; overflow-wrap: anywhere; }
.kla-nappi { display: block; width: 100%; min-height: 48px; border-radius: 8px; border: 1px solid var(--kpt-reuna2, #3a4656); background: var(--kpt-kentta, #111821); color: var(--kpt-teksti, #e8eef5); font: inherit; font-size: 16px; cursor: pointer; padding: 10px 14px; text-align: left; }
.kla-nappi:hover { border-color: var(--kpt-korostus, #22c55e); }
.kla-nappi.ensisijainen { background: var(--kpt-korostus, #22c55e); border-color: var(--kpt-korostus, #22c55e); color: var(--kpt-teksti-korostuksella, #06210f); font-weight: 600; text-align: center; }
.kla-otsikko { font-family: var(--kpt-mono, 'IBM Plex Mono', monospace); font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: var(--kpt-himmea, #94a3b8); margin: 18px 0 8px; }
.kla-haku { width: 100%; min-height: 48px; box-sizing: border-box; border-radius: 8px; border: 1px solid var(--kpt-reuna2, #3a4656); background: var(--kpt-kentta, #111821); color: var(--kpt-teksti, #e8eef5); font: inherit; font-size: 16px; padding: 0 12px; margin-bottom: 8px; }
.kla-lista { max-height: 46vh; overflow-y: auto; display: flex; flex-direction: column; gap: 6px; }
.kla-rivi { display: grid; grid-template-columns: 1fr auto; gap: 2px 10px; text-align: left; }
.kla-rivi b { font-weight: 600; }
.kla-rivi .kla-tila { font-size: 12px; color: var(--kpt-himmea, #94a3b8); align-self: center; }
.kla-rivi .kla-lisa { grid-column: 1 / -1; font-size: 12px; color: var(--kpt-himmea, #94a3b8); }
.kla-rivi.kohde { border-color: var(--kpt-korostus, #22c55e); }
.kla-alas { display: flex; justify-content: flex-end; margin-top: 14px; }
.kla-alas .kla-nappi { width: auto; text-align: center; }
.kla-banneri { margin: 10px 16px; padding: 12px 14px; border-radius: 8px; border: 1px solid #b45309; background: rgba(245,158,11,0.12); color: inherit; font-size: 14px; }
.kla-banneri .kla-brivi { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; padding: 6px 0; border-top: 1px solid rgba(245,158,11,0.25); }
.kla-banneri .kla-brivi:first-of-type { border-top: 0; }
.kla-banneri .kla-bteksti { flex: 1 1 260px; overflow-wrap: anywhere; }
.kla-banneri button { min-height: 40px; border-radius: 6px; padding: 6px 12px; font: inherit; font-size: 14px; cursor: pointer; border: 1px solid #b45309; background: transparent; color: inherit; }
.kla-banneri button.lisaa { background: #f59e0b; border-color: #f59e0b; color: #1a1205; font-weight: 600; }
`;
    document.head.appendChild(st);
  }

  // Tilauslista valintaikkunaan (kaikki tilaukset, myös valmiit: lisämitat tulevat usein valmiiseen tilaukseen, Tomi 25.11.2026)
  async function haeTilaukset(asetukset) {
    const url = asetukset.supabaseUrl, key = asetukset.supabaseKey;
    if (!url || !key) throw new Error('Tietokannan osoite puuttuu');
    const r = await fetch(url + '/rest/v1/orders?select=*,customers(name)&order=order_date.desc,created_at.desc&limit=400',
      { headers: { apikey: key, Authorization: 'Bearer ' + key } });
    if (!r.ok) throw new Error('Tilausten haku epäonnistui (' + r.status + ')');
    return (await r.json()).map(tilausRivi);
  }

  function avaaTilaus(l, orderId) {
    if (orderId) LS.setItem('openOrderId', orderId); else LS.removeItem('openOrderId');
    window.open('tilaus.html?odottava=' + encodeURIComponent(l.id), '_blank');
  }

  function valintaIkkuna(l, asetukset, tila) {
    tyylit();
    const vanha = document.getElementById('kla-valinta'); if (vanha) vanha.remove();
    const t = document.createElement('div');
    t.className = 'kla-tausta'; t.id = 'kla-valinta';
    t.innerHTML = '<div class="kla-ikkuna" role="dialog" aria-modal="true">'
      + '<h2>' + (l.kohdeTilaus ? 'Tilaus ei ole auki' : 'Mihin tilaukseen?') + '</h2>'
      + '<p class="kla-pieni">' + (l.kohdeTilaus ? 'Työn oma tilaus ei ole auki toisessa välilehdessä.' : 'Yhtään tilausta ei ole auki toisessa välilehdessä.')
      + ' Työ on tallessa selaimessa, kunnes se on tallennettu tilaukseen.</p>'
      + '<div class="kla-tyo">' + esc(l.kuvaus) + (l.huomio ? '<br>Huomio: ' + esc(l.huomio) : '') + '</div>'
      + '<button type="button" class="kla-nappi ensisijainen" data-k="uusi">➕ Uusi tilaus</button>'
      + '<div class="kla-otsikko">Tai lisää olemassa olevaan tilaukseen</div>'
      + '<input class="kla-haku" type="search" placeholder="Hae asiakkaalla, kohteella tai numerolla" aria-label="Hae tilausta">'
      + '<div class="kla-lista"><p class="kla-pieni">Haetaan tilauksia…</p></div>'
      + '<div class="kla-alas"><button type="button" class="kla-nappi" data-k="myohemmin">Myöhemmin</button></div>'
      + '</div>';
    document.body.appendChild(t);
    let rivit = [];
    const lista = t.querySelector('.kla-lista'), haku = t.querySelector('.kla-haku');
    const sulje = () => t.remove();
    function piirra() {
      let nayta = suodataTilaukset(rivit, haku.value);
      if (l.kohdeTilaus) nayta = nayta.slice().sort((a, b) => (b.id === l.kohdeTilaus) - (a.id === l.kohdeTilaus));
      lista.innerHTML = nayta.length ? nayta.slice(0, 80).map(r =>
        '<button type="button" class="kla-nappi kla-rivi' + (r.id === l.kohdeTilaus ? ' kohde' : '') + '" data-id="' + esc(r.id) + '">'
        + '<span><b>' + esc(r.asiakas) + '</b> · ' + esc(r.numero) + '</span><span class="kla-tila">' + esc(r.tila) + '</span>'
        + (r.kohde || r.id === l.kohdeTilaus ? '<span class="kla-lisa">' + (r.id === l.kohdeTilaus ? 'Työn oma tilaus' + (r.kohde ? ' · ' : '') : '') + esc(r.kohde) + '</span>' : '')
        + '</button>').join('')
        : '<p class="kla-pieni">Ei tilauksia haulla.</p>';
    }
    haeTilaukset(asetukset).then(r => { rivit = r; piirra(); })
      .catch(e => { lista.innerHTML = '<p class="kla-pieni">' + esc(e.message) + '. Voit silti tehdä uuden tilauksen.</p>'; });
    haku.addEventListener('input', piirra);
    t.addEventListener('click', e => {
      if (e.target === t) { sulje(); tila.myohemmin(); return; }
      const nappi = e.target.closest('button'); if (!nappi) return;
      if (nappi.dataset.k === 'uusi') { avaaTilaus(l, null); sulje(); tila.avattu('uusi tilaus'); }
      else if (nappi.dataset.k === 'myohemmin') { sulje(); tila.myohemmin(); }
      else if (nappi.dataset.id) { avaaTilaus(l, nappi.dataset.id); sulje(); tila.avattu('tilaus'); }
    });
    document.addEventListener('keydown', function escSulje(e) { if (e.key === 'Escape' && document.body.contains(t)) { sulje(); tila.myohemmin(); document.removeEventListener('keydown', escSulje); } });
  }

  // ── Lähettäjä ───────────────────────────────────────────────────────────────────────────────────
  // viesti = sama kuin ennen kpt_add_to_order (esim. { type: 'REPLACE_PIIPPU', groupId, groupName, items })
  // o = { kuvaus, huomio, kohdeTilaus, lahde, supabaseUrl, supabaseKey, ilmoita(teksti, tyyppi), tallennettu(kuittaus) }
  //   tyyppi: 'odota' | 'ok' | 'huom' | 'virhe'
  function laheta(viesti, o) {
    o = o || {};
    const ilmoita = o.ilmoita || function () {};
    siivoa(LS);
    const l = lisaaOdottava(LS, luoLahetys(viesti, o));
    let vastaanotettu = false, valmis = false, ajastin = null, ikkunaAuki = false;

    function lopeta() { valmis = true; clearTimeout(ajastin); window.removeEventListener('storage', kuuntele); }
    function onnistui(k) {
      if (valmis) return;
      lopeta();
      const mihin = [k.numero ? 'tilaukseen ' + k.numero : 'tilaukseen', k.asiakas].filter(Boolean).join(' · ');
      ilmoita('✓ Tallennettu ' + mihin, 'ok');
      if (o.tallennettu) o.tallennettu(k);
    }
    function kuuntele(e) {
      if (!e.newValue) return;
      let k; try { k = JSON.parse(e.newValue); } catch (err) { return; }
      if (e.key === KUITTAUS && k.lahetysId === l.id) {
        if (k.vaihe === 'vastaanotettu') {
          vastaanotettu = true; clearTimeout(ajastin);
          ilmoita('Tallennetaan tilaukseen…', 'odota');
          ajastin = setTimeout(() => { if (!valmis) ilmoita('Tilaus ei vahvistanut tallennusta. Työ on tallessa: avaa tilaus, niin se tarjoaa sen uudelleen.', 'huom'); }, ODOTA_TALLENNUSTA_MS);
        } else if (k.vaihe === 'tallennettu') onnistui(k);
        else if (k.vaihe === 'virhe') { clearTimeout(ajastin); ilmoita((k.viesti || 'Tallennus epäonnistui') + '. Työ on tallessa: avaa tilaus, niin se tarjoaa sen uudelleen.', 'virhe'); }
      }
      // Vanha (ennen T1:tä ladattu) tilaussivu kuittaa piipun vain tällä avaimella: hyväksytään se, ettei tule tuplaa
      if (e.key === 'kpt_piippu_tallennettu' && !vastaanotettu && viesti && k.groupId && k.groupId === viesti.groupId && k.orderId) {
        poistaOdottava(LS, l.id);
        onnistui({ orderId: k.orderId, numero: '', asiakas: '' });
      }
    }
    window.addEventListener('storage', kuuntele);
    ilmoita('Lähetetään…', 'odota');
    LS.setItem(KELLO, JSON.stringify(Object.assign({}, viesti, { lahetysId: l.id, kohdeTilaus: l.kohdeTilaus })));
    ajastin = setTimeout(() => {
      if (vastaanotettu || valmis || ikkunaAuki) return;
      ikkunaAuki = true;
      ilmoita('Valitse tilaus.', 'odota');
      valintaIkkuna(l, o, {
        avattu: () => {
          ilmoita('Tilaus avattiin uuteen välilehteen. Odotetaan tallennusta…', 'odota');
          ajastin = setTimeout(() => { if (!valmis) ilmoita('Työ on tallessa ja tallentuu, kun tilaus avautuu.', 'huom'); }, ODOTA_TALLENNUSTA_MS);
        },
        // Kuuntelu jatkuu: jos tilaus tallentaa työn myöhemmin (banneri), tämä sivu kertoo sen, kun se on vielä auki
        myohemmin: () => { clearTimeout(ajastin); ilmoita('Työ odottaa selaimessa: se tarjotaan, kun avaat tilauksen.', 'huom'); },
      });
    }, ODOTA_VASTAANOTTOA_MS);
    return l;
  }

  // ── Vastaanotin (tilaus.html) ─────────────────────────────────────────────────────────────────
  // o = { tilaus(): { orderId }, kasittele(viesti, l): Promise<{ orderId, numero, asiakas }>, banneri: elementti }
  function vastaanotin(o) {
    const tabId = 't_' + Math.random().toString(36).slice(2, 10);
    const tila = () => ({ tabId, orderId: (o.tilaus() || {}).orderId || null });
    const kasittelyssa = new Set();
    function merkitseAktiivinen() { try { LS.setItem(AKTIIVINEN, JSON.stringify({ tabId, orderId: tila().orderId, aika: Date.now() })); } catch (e) { /* ei tallennusta */ } }
    function aktiivinen() { try { return JSON.parse(LS.getItem(AKTIIVINEN) || 'null'); } catch (e) { return null; } }
    function kuittaa(l, vaihe, lisa) { try { LS.setItem(KUITTAUS, JSON.stringify(Object.assign({ lahetysId: l.id, vaihe, tabId, aika: Date.now() }, lisa || {}))); } catch (e) { /* ei tallennusta */ } }

    // Lukko: sama lähetys käsitellään vain kerran, vaikka sama tilaus olisi auki kahdessa välilehdessä
    function lukossa(id, fn) {
      if (typeof navigator !== 'undefined' && navigator.locks && navigator.locks.request) {
        return navigator.locks.request('kpt-lahetys-' + id, { ifAvailable: true }, lock => lock ? fn() : null);
      }
      return fn();
    }
    async function ota(l) {
      if (!l || kasittelyssa.has(l.id)) return false;
      kasittelyssa.add(l.id);
      try {
        return await lukossa(l.id, async () => {
          if (!haeOdottava(LS, l.id)) return false;      // joku muu ehti jo
          kuittaa(l, 'vastaanotettu');
          try {
            const k = await o.kasittele(l.viesti, l);
            poistaOdottava(LS, l.id);
            kuittaa(l, 'tallennettu', k || {});
            merkitseAktiivinen();
            piirraBanneri();
            return true;
          } catch (e) {
            console.warn('Lähetyksen tallennus epäonnistui', e);
            kuittaa(l, 'virhe', { viesti: e && e.message ? e.message : 'Tallennus epäonnistui' });
            piirraBanneri();
            return false;
          }
        });
      } finally { kasittelyssa.delete(l.id); }
    }

    function piirraBanneri() {
      const el = o.banneri; if (!el) return;
      const lista = siivoa(LS).filter(l => !kasittelyssa.has(l.id));
      if (!lista.length) { el.innerHTML = ''; el.style.display = 'none'; return; }
      tyylit();
      const oma = tila().orderId;
      el.style.display = '';
      el.innerHTML = '<div class="kla-banneri"><b>Lähettämätöntä työtä (' + lista.length + ')</b> — tehty ilman auki olevaa tilausta. Lisää tähän tilaukseen tai hylkää.'
        + lista.map(l => '<div class="kla-brivi"><span class="kla-bteksti">' + esc(l.kuvaus) + ' <small>(' + esc(aikaTeksti(l.aika))
          + (l.kohdeTilaus && l.kohdeTilaus !== oma ? ', tehty toiselle tilaukselle' : '') + ')</small>'
          + (l.huomio ? '<br><small>Huomio: ' + esc(l.huomio) + '</small>' : '') + '</span>'
          + '<button type="button" class="lisaa" data-lisaa="' + esc(l.id) + '">Lisää tähän tilaukseen</button>'
          + '<button type="button" data-hylkaa="' + esc(l.id) + '">Hylkää</button></div>').join('')
        + '</div>';
    }
    if (o.banneri) o.banneri.addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.lisaa) { const l = haeOdottava(LS, b.dataset.lisaa); if (l) { b.disabled = true; b.textContent = 'Tallennetaan…'; ota(l); } }
      if (b.dataset.hylkaa) {
        const l = haeOdottava(LS, b.dataset.hylkaa);
        if (l && confirm('Hylätäänkö lähettämätön työ "' + l.kuvaus + '"? Sitä ei voi palauttaa (mitat voi tehdä uudelleen).')) { poistaOdottava(LS, l.id); piirraBanneri(); }
      }
    });

    window.addEventListener('storage', e => {
      if (e.key === ODOTTAVAT) { piirraBanneri(); return; }
      if (e.key !== KELLO || !e.newValue) return;
      let v; try { v = JSON.parse(e.newValue); } catch (err) { return; }
      if (!v || !v.lahetysId) return;                   // vanha viesti: tilaus.html käsittelee sen kuten ennen
      const l = haeOdottava(LS, v.lahetysId);
      if (l && onkoMinun(l, tila(), aktiivinen())) ota(l);
    });
    window.addEventListener('focus', merkitseAktiivinen);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') merkitseAktiivinen(); });
    merkitseAktiivinen();

    // Kutsutaan, kun tilaus on latautunut: ?odottava=<id> otetaan heti vastaan, muut näytetään bannerissa
    async function aloita() {
      merkitseAktiivinen();
      const id = new URLSearchParams(location.search).get('odottava');
      if (id) {
        try { history.replaceState(null, '', location.pathname); } catch (e) { /* ei historiaa */ }
        const l = haeOdottava(LS, id);
        if (l) await ota(l);
      }
      piirraBanneri();
    }
    return { aloita, merkitseAktiivinen, piirraBanneri, tabId };
  }

  const KPT_LAHETYS = {
    laheta, vastaanotin, valintaIkkuna,
    // testeille ja muille sivuille
    lue, lisaaOdottava, haeOdottava, poistaOdottava, siivoa, onkoMinun, luoLahetys, yhdistaHuomio, tilausRivi, suodataTilaukset, aikaTeksti,
    AVAIMET: { ODOTTAVAT, KELLO, KUITTAUS, AKTIIVINEN }, VANHENEE_MS,
  };
  if (typeof globalThis !== 'undefined') globalThis.KPT_LAHETYS = KPT_LAHETYS;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_LAHETYS;
})();
