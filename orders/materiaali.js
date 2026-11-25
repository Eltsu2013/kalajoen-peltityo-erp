// orders/materiaali.js → KPT_MATERIAALI — materiaali, väri ja paksuus tuotelistasta (vaihe 8.4a, 25.11.2026)
//
// Huuva ja Kartio tarvitsevat tilausriville materiaalin, värin ja paksuuden (tilaus, Tuotanto, varasto). Sama valinta kuin
// piippusivuilla (sel-materiaali / sel-vari / sel-paksuus), mutta yhteisenä, uuden ulkoasun kentillä (kpt-kentta).
// Tuotteet: products, is_active = true. Viimeisin valinta muistetaan selaimessa (oma avain sivulle).
//
// valitsin(el, { avain, muutos(arvo, mikaMuuttui) }) → { arvo(): { material, color, thickness }, aseta(arvo), valmis: Promise }
// Käyttäjät: huuva.html, kartio.html. MUISTA: nosta ?v=-numeroa sivuilla, jotka lataavat tämän.
(function () {
  'use strict';
  const SUPABASE_URL = 'https://hjyeugeqmyavxisndlwp.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWV1Z2VxbXlhdnhpc25kbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDM2NzgsImV4cCI6MjA4NjcxOTY3OH0.ZMuN6lruMUHkASUtwnoShiqHLAg6YBEGsC7zMlymLs4';

  // Puhtaat apufunktiot (testattavissa)
  const uniikit = a => [...new Set(a)];
  function materiaalit(tuotteet) { return uniikit(tuotteet.map(p => p.material).filter(Boolean)).sort((a, b) => a.localeCompare(b, 'fi')); }
  function varit(tuotteet, mat) { return uniikit(tuotteet.filter(p => p.material === mat).map(p => p.color).filter(Boolean)).sort((a, b) => a.localeCompare(b, 'fi')); }
  function paksuudet(tuotteet, mat, vari) { return uniikit(tuotteet.filter(p => p.material === mat && p.color === vari).map(p => Number(p.thickness_mm)).filter(x => x > 0)).sort((a, b) => a - b); }
  function teksti(a) { return a && a.material ? [a.material, a.color, a.thickness ? String(a.thickness).replace('.', ',') + ' mm' : ''].filter(Boolean).join(' ') : ''; }

  let tuotteetLupaus = null;
  function haeTuotteet() {
    if (!tuotteetLupaus) {
      tuotteetLupaus = fetch(SUPABASE_URL + '/rest/v1/products?is_active=eq.true&select=material,color,thickness_mm&order=material,color',
        { headers: { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + SUPABASE_KEY } })
        .then(r => r.ok ? r.json() : [])
        .catch(() => []);
    }
    return tuotteetLupaus;
  }

  function valitsin(el, o) {
    o = o || {};
    const avain = o.avain || 'kpt_materiaali';
    let tuotteet = [];
    el.innerHTML = '<div class="kpt-kentat">'
      + '<div class="kpt-kentta"><label>Materiaali</label><select data-m="material"><option value="">Haetaan…</option></select></div>'
      + '<div class="kpt-kentta"><label>Väri</label><select data-m="color"><option value="">Väri</option></select></div>'
      + '<div class="kpt-kentta"><label>Paksuus</label><select data-m="thickness"><option value="">Paksuus</option></select></div>'
      + '</div>';
    const sel = k => el.querySelector('select[data-m="' + k + '"]');
    const optiot = (s, lista, tyhja, nimi) => { s.innerHTML = '<option value="">' + tyhja + '</option>' + lista.map(v => '<option value="' + String(v).replace(/"/g, '&quot;') + '">' + (nimi ? nimi(v) : v) + '</option>').join(''); };
    function arvo() {
      const t = parseFloat(sel('thickness').value);
      return { material: sel('material').value || null, color: sel('color').value || null, thickness: t > 0 ? t : null };
    }
    function muista() { try { localStorage.setItem(avain, JSON.stringify(arvo())); } catch (e) { /* ei tallennusta */ } }
    function tayta(a) {
      a = a || {};
      optiot(sel('material'), uniikit(materiaalit(tuotteet).concat(a.material ? [a.material] : [])), 'Materiaali');   // tallennettu, poistunut tuote näkyy silti
      sel('material').value = a.material || '';
      optiot(sel('color'), a.material ? uniikit(varit(tuotteet, a.material).concat(a.color ? [a.color] : [])) : [], 'Väri');
      sel('color').value = a.color || '';
      const pk = a.material && a.color ? uniikit(paksuudet(tuotteet, a.material, a.color).concat(a.thickness ? [Number(a.thickness)] : [])).sort((x, y) => x - y) : [];
      optiot(sel('thickness'), pk, 'Paksuus', v => String(v).replace('.', ',') + ' mm');
      sel('thickness').value = a.thickness ? String(Number(a.thickness)) : '';
    }
    el.addEventListener('change', e => {
      const k = e.target && e.target.dataset ? e.target.dataset.m : null;
      if (!k) return;
      const a = arvo();
      if (k === 'material') { a.color = null; a.thickness = null; }
      if (k === 'color') {
        a.thickness = null;
        const pk = paksuudet(tuotteet, a.material, a.color);
        if (pk.length === 1) a.thickness = pk[0];   // ainoa paksuus valitaan valmiiksi
      }
      tayta(a);
      muista();
      if (o.muutos) o.muutos(arvo(), k);
    });
    const valmis = haeTuotteet().then(t => {
      tuotteet = Array.isArray(t) ? t : [];
      let muistettu = null;
      try { muistettu = JSON.parse(localStorage.getItem(avain) || 'null'); } catch (e) { /* ei muistettua */ }
      tayta(muistettu || {});
      if (o.muutos) o.muutos(arvo(), 'alku');
    });
    return { arvo, aseta: a => valmis.then(() => { tayta(a); }), valmis, teksti: () => teksti(arvo()) };
  }

  const KPT_MATERIAALI = { valitsin, materiaalit, varit, paksuudet, teksti, SUPABASE_URL, SUPABASE_KEY };
  if (typeof globalThis !== 'undefined') globalThis.KPT_MATERIAALI = KPT_MATERIAALI;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_MATERIAALI;
})();
