// orders/materiaali.js → KPT_MATERIAALI — materiaali, väri ja paksuus tuotelistasta (vaihe 8.4a, 25.11.2026)
//
// Huuva ja Kartio tarvitsevat tilausriville materiaalin, värin ja paksuuden (tilaus, Tuotanto, varasto).
// v2 (25.11.2026, Tomin testi): samanlainen kuin Peltilistoissa — materiaaliin ja väriin voi kirjoittaa, lista suodattuu
// (ei pitkää pudotusvalikkoa), tuotteina vain levytuotteet (unit = m², kuten Peltilistat), ja väri on vapaaehtoinen, jos
// materiaalilla ei ole värejä (esim. Stucco-alumiini: ennen herjasi "valitse väri", eikä väriä voinut valita).
// Viimeisin valinta muistetaan selaimessa (oma avain sivulle). Isompi materiaalivalinnan uudistus suunnitellaan erikseen.
//
// valitsin(el, { avain, muutos(arvo, mikaMuuttui) }) → { arvo(), aseta(a), puuttuu(), valmis: Promise }
//   arvo() = { material, color (null, jos materiaalilla ei värejä), thickness }; puuttuu() = 'materiaali' | 'väri' | 'paksuus' | null
// v3 (26.11.2026, Tomi): tuoteryhmä (product_group: Pinnoitettu teräs, Alumiini, Rakenneteräs…) ja järjestys
//   Tuoteryhmä → Väri → Materiaali → Paksuus: väri rajaa materiaalit (RR20 → lähes aina Glossy) ja materiaali värit.
//   Tuoteryhmät verrataan kirjainkoosta välittämättä ("Pinnoitettu teräs" = "Pinnoitettu Teräs"), oletus Pinnoitettu teräs.
//   listat(tuotteet, { ryhma, vari, materiaali }) → { varit, materiaalit, paksuudet, ryhmallaVareja }, ryhmat(), oletusRyhma(),
//   ryhmaTuotteelle(). Käyttäjät: peltipiirturi.html, vakiomallit.html; valitsin() samassa järjestyksessä (Huuva, Kartio),
//   oletus Pinnoitettu teräs, ei enää edellisen valinnan muistia (avain-asetus jätetään huomiotta).
// v5: valitsin(el, { tiivis: true }) = yksi rivi ilman näkyviä otsikoita (piippu.html, harjapiippu.html yläpalkissa).
// Käyttäjät: huuva.html, kartio.html, peltipiirturi.html, vakiomallit.html. MUISTA: nosta ?v=-numeroa sivuilla, jotka lataavat tämän.
(function () {
  'use strict';
  const SUPABASE_URL = 'https://hjyeugeqmyavxisndlwp.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWV1Z2VxbXlhdnhpc25kbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDM2NzgsImV4cCI6MjA4NjcxOTY3OH0.ZMuN6lruMUHkASUtwnoShiqHLAg6YBEGsC7zMlymLs4';

  // ── Puhtaat apufunktiot (testattavissa) ──
  const uniikit = a => [...new Set(a)];
  const jarj = (a, b) => String(a).localeCompare(String(b), 'fi');
  function materiaalit(tuotteet) { return uniikit(tuotteet.map(p => p.material).filter(Boolean)).sort(jarj); }
  function varit(tuotteet, mat) { return uniikit(tuotteet.filter(p => p.material === mat).map(p => p.color).filter(Boolean)).sort(jarj); }
  // Värittömällä materiaalilla (tai kun väriä ei ole valittu) kaikki materiaalin paksuudet, kuten Peltilistoissa
  function paksuudet(tuotteet, mat, vari) {
    return uniikit(tuotteet.filter(p => p.material === mat && (!vari || p.color === vari)).map(p => Number(p.thickness_mm)).filter(x => x > 0)).sort((a, b) => a - b);
  }
  function suodata(lista, haku) {
    const h = String(haku || '').trim().toLowerCase();
    return h ? lista.filter(v => String(v).toLowerCase().indexOf(h) >= 0) : lista;
  }
  // v3: väri kysytään ennen materiaalia (järjestys Väri → Materiaali), väri vain jos ryhmällä / materiaalilla on värejä
  function puuttuu(tuotteet, a) {
    a = a || {};
    if (!a.material) return (!a.color && listat(tuotteet, { ryhma: a.group }).ryhmallaVareja) ? 'väri' : 'materiaali';
    if (!a.color && listat(tuotteet, { ryhma: a.group, materiaali: a.material }).varit.length) return 'väri';
    if (!a.thickness) return 'paksuus';
    return null;
  }
  function teksti(a) { return a && a.material ? [a.material, a.color, a.thickness ? String(a.thickness).replace('.', ',') + ' mm' : ''].filter(Boolean).join(' ') : ''; }

  // ── v3: tuoteryhmä ja väri ennen materiaalia ──
  const ryhmaAvain = s => String(s == null ? '' : s).trim().toLowerCase();
  const OLETUSRYHMA = 'Pinnoitettu teräs';
  // Tuoteryhmät kerran kukin, kirjainkoosta välittämättä; näytetään yleisin kirjoitusasu
  function ryhmat(tuotteet) {
    const m = new Map();
    tuotteet.forEach(p => {
      if (!p.product_group || !ryhmaAvain(p.product_group)) return;
      const k = ryhmaAvain(p.product_group), r = m.get(k) || {};
      r[p.product_group] = (r[p.product_group] || 0) + 1;
      m.set(k, r);
    });
    return [...m.values()].map(r => Object.keys(r).sort((a, b) => r[b] - r[a] || jarj(a, b))[0]).sort(jarj);
  }
  const samaRyhma = (a, b) => ryhmaAvain(a) === ryhmaAvain(b);
  function rajaa(tuotteet, v) {
    v = v || {};
    return tuotteet.filter(p => (!v.ryhma || samaRyhma(p.product_group, v.ryhma))
      && (!v.materiaali || p.material === v.materiaali) && (!v.vari || p.color === v.vari));
  }
  // Listat nykyisen valinnan mukaan: värit rajautuvat materiaalilla ja materiaalit värillä (kumpi tahansa ensin)
  function listat(tuotteet, v) {
    v = v || {};
    const ryhmassa = rajaa(tuotteet, { ryhma: v.ryhma });
    return {
      varit: uniikit(rajaa(ryhmassa, { materiaali: v.materiaali }).map(p => p.color).filter(Boolean)).sort(jarj),
      materiaalit: uniikit(rajaa(ryhmassa, { vari: v.vari }).map(p => p.material).filter(Boolean)).sort(jarj),
      paksuudet: v.materiaali ? uniikit(rajaa(ryhmassa, { materiaali: v.materiaali, vari: v.vari }).map(p => Number(p.thickness_mm)).filter(x => x > 0)).sort((a, b) => a - b) : [],
      ryhmallaVareja: ryhmassa.some(p => p.color),
    };
  }
  function oletusRyhma(tuotteet, toive) { return ryhmat(tuotteet).find(g => samaRyhma(g, toive || OLETUSRYHMA)) || ''; }
  // Vanhoilla riveillä ei ehkä ole tuoteryhmää: päätellään materiaalista (ja väristä)
  function ryhmaTuotteelle(tuotteet, materiaali, vari) {
    const p = rajaa(tuotteet, { materiaali, vari }).find(x => x.product_group) || rajaa(tuotteet, { materiaali }).find(x => x.product_group);
    return p ? (ryhmat(tuotteet).find(g => samaRyhma(g, p.product_group)) || p.product_group) : '';
  }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  let tuotteetLupaus = null;
  function haeTuotteet() {
    if (!tuotteetLupaus) {
      tuotteetLupaus = fetch(SUPABASE_URL + '/rest/v1/products?is_active=eq.true&unit=eq.m%C2%B2&select=product_group,material,color,thickness_mm&order=material,color',
        { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []);
    }
    return tuotteetLupaus;
  }

  function tyylit() {
    if (typeof document === 'undefined' || document.getElementById('kma-tyylit')) return;
    const st = document.createElement('style');
    st.id = 'kma-tyylit';
    st.textContent = `
.kma-haku { position: relative; }
.kma-lista { display: none; position: absolute; left: 0; right: 0; top: 100%; z-index: 50; max-height: 240px; overflow-y: auto;
  background: var(--kpt-paneeli, #1c2532); border: 1px solid var(--kpt-reuna2, #3a4656); border-top: 0; border-radius: 0 0 6px 6px; box-shadow: 0 8px 20px rgba(0,0,0,0.25); }
.kma-lista.auki { display: block; }
.kma-lista button { display: block; width: 100%; text-align: left; min-height: 44px; padding: 8px 12px; border: 0; border-bottom: 1px solid var(--kpt-reuna, #2a3442);
  background: transparent; color: var(--kpt-teksti, #e8eef5); font: inherit; font-size: 15px; cursor: pointer; }
.kma-lista button:hover, .kma-lista button.valittu { background: var(--kpt-kentta, #111821); }
.kma-lista .kma-tyhja { padding: 10px 12px; font-size: 13px; color: var(--kpt-himmea, #94a3b8); }
.kma-haku input:disabled { opacity: 0.6; }
/* v5: tiivis rivi vanhojen sivujen yläpalkkiin (piiput): ei näkyviä otsikoita, kentän nimi paikkatekstinä */
.kma-tiivis { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
.kma-tiivis .kpt-kentta { margin: 0; }
.kma-tiivis label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.kma-tiivis { flex-wrap: nowrap; }
.kma-tiivis [data-m="group"] { width: 136px; } .kma-tiivis [data-m="color"] { width: 92px; }
.kma-tiivis [data-m="material"] { width: 112px; } .kma-tiivis .kma-paksuus { width: 84px; }
.kma-tiivis input, .kma-tiivis select { width: 100%; box-sizing: border-box; background: var(--kpt-kentta, var(--bg3, #111821)); color: var(--kpt-teksti, var(--text1, var(--text, #e8eef5)));
  border: 1px solid var(--kpt-reuna2, var(--border, #3a4656)); border-radius: 4px; padding: 4px 8px; font: inherit; font-size: 13px; }
.kma-tiivis .kma-lista { z-index: 1000; min-width: 180px; }
@media (max-width: 700px) {
  .kma-tiivis { width: 100%; flex-wrap: wrap; }
  .kma-tiivis [data-m="group"] { width: 100%; } .kma-tiivis [data-m="color"], .kma-tiivis [data-m="material"] { flex: 1 1 0; width: auto; min-width: 0; }
  .kma-tiivis .kma-paksuus { flex: 0 0 96px; }
  .kma-tiivis input, .kma-tiivis select { font-size: 16px; padding: 8px; }
}
`;
    document.head.appendChild(st);
  }

  // Hakukenttä + suodattuva lista (kuten Peltilistoissa). Arvo hyväksytään vain listasta (klikkaus, Enter tai tarkka nimi).
  function hakuKentta(el, nimi, o) {
    const paikka = o.paikka || 'Kirjoita tai valitse';
    el.innerHTML = '<label>' + esc(nimi) + '</label><div class="kma-haku"><input type="text" autocomplete="off" spellcheck="false" aria-label="' + esc(nimi) + '" placeholder="' + esc(paikka) + '"><div class="kma-lista" role="listbox"></div></div>';
    const inp = el.querySelector('input'), lista = el.querySelector('.kma-lista');
    let arvo = '', vaihtoehdot = [];
    function nayta() {
      const v = suodata(vaihtoehdot, inp.value === arvo ? '' : inp.value);
      lista.innerHTML = v.length ? v.slice(0, 60).map((x, i) => '<button type="button" data-v="' + esc(x) + '"' + (i === 0 ? ' class="valittu"' : '') + '>' + esc(x) + '</button>').join('')
        : '<div class="kma-tyhja">Ei osumia</div>';
      lista.classList.add('auki');
    }
    function valitse(x) {
      arvo = x || ''; inp.value = arvo; lista.classList.remove('auki');
      o.valittu(arvo);
    }
    inp.addEventListener('focus', () => { inp.select(); nayta(); });
    inp.addEventListener('input', nayta);
    inp.addEventListener('keydown', e => {
      if (e.key === 'Enter') { e.preventDefault(); const b = lista.querySelector('button'); if (b) valitse(b.dataset.v); }
      if (e.key === 'Escape') { inp.value = arvo; lista.classList.remove('auki'); inp.blur(); }
    });
    // mousedown ennen blur-tapahtumaa, jotta klikkaus listassa ehtii
    lista.addEventListener('mousedown', e => { const b = e.target.closest('button'); if (b) { e.preventDefault(); valitse(b.dataset.v); } });
    inp.addEventListener('blur', () => {
      setTimeout(() => {
        lista.classList.remove('auki');
        if (inp.value === arvo) return;
        const tarkka = vaihtoehdot.find(x => String(x).toLowerCase() === inp.value.trim().toLowerCase());
        if (tarkka) valitse(tarkka); else inp.value = arvo;   // vain listan arvo kelpaa
      }, 120);
    });
    return {
      aseta(x) { arvo = x || ''; inp.value = arvo; },
      vaihtoehdot(v, tyhjaTeksti) {
        vaihtoehdot = v || [];
        inp.disabled = !vaihtoehdot.length;
        inp.placeholder = vaihtoehdot.length ? paikka : (tyhjaTeksti || '');
      },
      arvo: () => arvo,
    };
  }

  // v3: Tuoteryhmä → Väri → Materiaali → Paksuus, uudella työllä oletus Pinnoitettu teräs (ei enää edellisen valinnan muistia,
  // Tomi 26.11.2026). arvo() = { group, material, color, thickness }. aseta(a): ryhmä päätellään materiaalista, jos se puuttuu.
  function valitsin(el, o) {
    o = o || {};
    tyylit();
    let tuotteet = [];
    let tila = { group: '', color: null, material: null, thickness: null };
    const tiivis = !!o.tiivis;   // v5: yksi rivi ilman näkyviä otsikoita (piippusivujen yläpalkki)
    el.innerHTML = '<div class="' + (tiivis ? 'kma-tiivis' : 'kpt-kentat') + '">'
      + '<div class="kpt-kentta" data-m="group"></div>'
      + '<div class="kpt-kentta" data-m="color"></div>'
      + '<div class="kpt-kentta" data-m="material"></div>'
      + '<div class="kpt-kentta kma-paksuus"><label>Paksuus</label><select data-m="thickness" aria-label="Paksuus"><option value="">Paksuus</option></select></div>'
      + '</div>';
    const paikka = nimi => tiivis ? nimi : null;
    const pk = el.querySelector('select[data-m="thickness"]');
    const kRyhma = hakuKentta(el.querySelector('[data-m="group"]'), 'Tuoteryhmä', { paikka: paikka('Tuoteryhmä'), valittu: g => {
      muutos('group', samaRyhma(g, tila.group) ? Object.assign({}, tila, { group: g }) : { group: g, color: null, material: null, thickness: null });
    } });
    const kVari = hakuKentta(el.querySelector('[data-m="color"]'), 'Väri', { paikka: paikka('Väri'), valittu: v => {
      const a = Object.assign({}, tila, { color: v || null });
      const mats = listat(tuotteet, { ryhma: a.group, vari: a.color }).materiaalit;
      if (a.material && mats.indexOf(a.material) < 0) a.material = null;   // materiaali ei käy uudelle värille
      if (!a.material && mats.length === 1) a.material = mats[0];         // vain yksi materiaali tässä värissä
      muutos('color', a);
    } });
    const kMat = hakuKentta(el.querySelector('[data-m="material"]'), 'Materiaali', { paikka: paikka('Materiaali'), valittu: m => {
      const a = Object.assign({}, tila, { material: m || null });
      if (a.color && listat(tuotteet, { ryhma: a.group, materiaali: a.material }).varit.indexOf(a.color) < 0) a.color = null;
      muutos('material', a);
    } });
    const lisaa = (lista, x) => x ? uniikit(lista.concat([x])) : lista;   // tallennettu, poistunut tuote näkyy silti
    function arvo() {
      const t = parseFloat(pk.value);
      return { group: tila.group || null, material: tila.material || null, color: tila.color || null, thickness: t > 0 ? t : null };
    }
    function tayta(a) {
      tila = { group: a.group || '', color: a.color || null, material: a.material || null, thickness: a.thickness || null };
      const lad = !tuotteet.length;
      kRyhma.vaihtoehdot(lisaa(ryhmat(tuotteet), tila.group).sort(jarj), lad ? 'Haetaan…' : 'Ei tuoteryhmiä');
      kRyhma.aseta(tila.group);
      const varitR = lisaa(listat(tuotteet, { ryhma: tila.group }).varit, tila.color).sort(jarj);
      kVari.vaihtoehdot(varitR, lad ? 'Haetaan…' : 'Ei värejä');
      kVari.aseta(tila.color);
      const L = listat(tuotteet, { ryhma: tila.group, vari: tila.color, materiaali: tila.material });
      kMat.vaihtoehdot(lisaa(L.materiaalit, tila.material).sort(jarj), lad ? 'Haetaan…' : 'Ei materiaaleja');
      kMat.aseta(tila.material);
      const pks = lisaa(L.paksuudet, tila.thickness ? Number(tila.thickness) : null).sort((x, y) => x - y);
      pk.innerHTML = '<option value="">Paksuus</option>' + pks.map(x => '<option value="' + x + '">' + String(x).replace('.', ',') + ' mm</option>').join('');
      pk.value = tila.thickness ? String(Number(tila.thickness)) : '';
    }
    function muutos(mika, a) {
      // Ainoa paksuus valitaan valmiiksi, kun materiaali on valittu (ja väri, jos sillä on värejä); kelpaava paksuus säilyy
      if (mika !== 'thickness' && a.material) {
        const L = listat(tuotteet, { ryhma: a.group, vari: a.color, materiaali: a.material });
        const variTarvitaan = !a.color && listat(tuotteet, { ryhma: a.group, materiaali: a.material }).varit.length;
        if (a.thickness && L.paksuudet.indexOf(Number(a.thickness)) < 0) a.thickness = null;
        if (!a.thickness && !variTarvitaan && L.paksuudet.length === 1) a.thickness = L.paksuudet[0];
      } else if (mika !== 'thickness') a.thickness = null;
      tayta(a);
      if (o.muutos) o.muutos(arvo(), mika);
    }
    pk.addEventListener('change', () => { tila.thickness = parseFloat(pk.value) || null; muutos('thickness', Object.assign({}, tila)); });
    tayta({});
    const valmis = haeTuotteet().then(t => {
      tuotteet = Array.isArray(t) ? t : [];
      if (!tila.group && !tila.material) tayta({ group: oletusRyhma(tuotteet) });
      else tayta(tila);
      if (o.muutos) o.muutos(arvo(), 'alku');
    });
    function aseta(a) {
      a = Object.assign({}, a || {});
      if (!a.group && a.material) a.group = ryhmaTuotteelle(tuotteet, a.material, a.color);
      if (a.group) a.group = ryhmat(tuotteet).find(g => samaRyhma(g, a.group)) || a.group;
      tayta(a);
    }
    return {
      arvo, valmis,
      aseta: a => valmis.then(() => aseta(a)),
      puuttuu: () => puuttuu(tuotteet, arvo()),
      teksti: () => teksti(arvo()),
    };
  }

  const KPT_MATERIAALI = { valitsin, materiaalit, varit, paksuudet, suodata, puuttuu, teksti, ryhmat, samaRyhma, rajaa, listat, oletusRyhma, ryhmaTuotteelle, OLETUSRYHMA, SUPABASE_URL, SUPABASE_KEY };
  if (typeof globalThis !== 'undefined') globalThis.KPT_MATERIAALI = KPT_MATERIAALI;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_MATERIAALI;
})();
