/**
 * kartta-zoom.js — Kalajoen Peltityö ERP: varastokartan zoomaus ja siirto
 *
 * Käyttö:  const zoom = KarttaZoom.liita(svgElementti);
 *          zoom.zoomaaElementtiin(el)   // liu'uta ja zoomaa paikkaan
 *          zoom.nollaa()                // koko kartta näkyviin
 *
 * Käytössä: maps/verstaspohja_mitoitettu.html ja orders/varasto.html (kartta-paneeli + Kartta-välilehti).
 *
 * Miten zoomataan:
 *   - napit ＋ / − / ⤢ kartan oikeassa yläkulmassa
 *   - kosketusnäyttö: kahden sormen nipistys; zoomattuna yhdellä sormella vedetään
 *   - läppäri: kosketuslevyn nipistys tai Ctrl + hiiren rulla; zoomattuna kahden sormen
 *     vieritys tai hiirellä vetäminen siirtää karttaa; tuplaklikkaus zoomaa
 *   - kun karttaa ei ole zoomattu, vieritys ja yhden sormen pyyhkäisy vierittävät sivua normaalisti
 *
 * Zoomaus muuttaa SVG:n viewBoxia, joten kartta pysyy terävänä millä suurennoksella tahansa.
 */
(function () {
  'use strict';

  const MAX_ZOOM = 8;       // enintään 8-kertainen suurennos
  const NAPPI_KERROIN = 1.6;
  const ANIM_MS = 220;
  const VETO_RAJA = 6;      // px: tätä pidempi liike on vetämistä, ei klikkausta

  function lisaaTyylit() {
    if (document.getElementById('kz-tyylit')) return;
    const st = document.createElement('style');
    st.id = 'kz-tyylit';
    st.textContent = `
      .kz-kehys { position: relative; width: 100%; }
      .kz-kehys > svg { display: block; width: 100%; height: auto; }
      .kz-napit { position: absolute; top: 8px; right: 8px; display: flex; flex-direction: column; gap: 6px; z-index: 5; }
      .kz-napit button {
        width: 40px; height: 40px; padding: 0; margin: 0;
        display: flex; align-items: center; justify-content: center;
        font: 600 20px/1 'IBM Plex Mono', monospace;
        color: #c8cdd3; background: rgba(22, 25, 28, 0.88);
        border: 1px solid #3a4450; border-radius: 6px; cursor: pointer;
        -webkit-tap-highlight-color: transparent; user-select: none;
      }
      .kz-napit button:hover { border-color: #d4921a; color: #d4921a; }
      .kz-napit button:active { transform: scale(0.95); }
      .kz-napit button[disabled] { opacity: 0.35; cursor: default; }
      @media (pointer: coarse) { .kz-napit button { width: 44px; height: 44px; } }
      @media print { .kz-napit { display: none; } }
    `;
    document.head.appendChild(st);
  }

  function liita(svg, asetukset) {
    if (!svg || svg.__kz) return svg && svg.__kz;
    const opt = Object.assign({ napit: true }, asetukset || {});
    lisaaTyylit();

    const vb0 = svg.viewBox && svg.viewBox.baseVal;
    if (!vb0 || !vb0.width) return null;
    const base = { x: vb0.x, y: vb0.y, w: vb0.width, h: vb0.height };
    const suhde = base.h / base.w;
    let vb = Object.assign({}, base);
    let anim = null;

    // Kehys napeille. Säilytetään kartan alkuperäinen maksimileveys.
    const kehys = document.createElement('div');
    kehys.className = 'kz-kehys';
    if (svg.style.maxWidth) { kehys.style.maxWidth = svg.style.maxWidth; svg.style.maxWidth = ''; }
    svg.removeAttribute('height');
    svg.parentNode.insertBefore(kehys, svg);
    kehys.appendChild(svg);

    let napit = null;
    if (opt.napit) {
      napit = document.createElement('div');
      napit.className = 'kz-napit';
      napit.innerHTML =
        '<button type="button" data-kz="in" title="Lähennä (myös nipistys tai Ctrl + rulla)" aria-label="Lähennä">＋</button>' +
        '<button type="button" data-kz="out" title="Loitonna" aria-label="Loitonna">−</button>' +
        '<button type="button" data-kz="koko" title="Koko kartta" aria-label="Koko kartta">⤢</button>';
      kehys.appendChild(napit);
      napit.addEventListener('click', e => {
        const b = e.target.closest('button');
        if (!b) return;
        e.stopPropagation();
        const k = { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
        if (b.dataset.kz === 'in') animoi(zoomattuna(NAPPI_KERROIN, k));
        else if (b.dataset.kz === 'out') animoi(zoomattuna(1 / NAPPI_KERROIN, k));
        else animoi(Object.assign({}, base));
      });
    }

    // ── Apufunktiot ──
    function rajaa(v) {
      let w = Math.min(base.w, Math.max(base.w / MAX_ZOOM, v.w));
      let h = w * suhde;
      let x = Math.min(base.x + base.w - w, Math.max(base.x, v.x));
      let y = Math.min(base.y + base.h - h, Math.max(base.y, v.y));
      return { x, y, w, h };
    }
    function onZoomattu() { return vb.w < base.w - 0.5; }
    function aseta(v) {
      vb = rajaa(v);
      svg.setAttribute('viewBox', `${vb.x.toFixed(2)} ${vb.y.toFixed(2)} ${vb.w.toFixed(2)} ${vb.h.toFixed(2)}`);
      // Zoomaamattomana sormi vierittää sivua; zoomattuna kaikki eleet ovat kartan omia
      svg.style.touchAction = onZoomattu() ? 'none' : 'pan-y';
      if (napit) {
        napit.querySelector('[data-kz="in"]').disabled = vb.w <= base.w / MAX_ZOOM + 0.5;
        napit.querySelector('[data-kz="out"]').disabled = !onZoomattu();
        napit.querySelector('[data-kz="koko"]').disabled = !onZoomattu();
      }
    }
    // Uusi näkymä, kun zoomataan kertoimella pisteen p (kartan koordinaatit) ympäri
    function zoomattuna(kerroin, p, lahto) {
      const v = lahto || vb;
      const w = v.w / kerroin;
      return { x: p.x - (p.x - v.x) * (w / v.w), y: p.y - (p.y - v.y) * (w / v.w), w, h: w * suhde };
    }
    // Näytön piste → kartan koordinaatit
    function karttaPiste(clientX, clientY) {
      const m = svg.getScreenCTM();
      if (!m) return { x: vb.x + vb.w / 2, y: vb.y + vb.h / 2 };
      const p = new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
      return { x: p.x, y: p.y };
    }
    function pikseliKoko() { return vb.w / (svg.getBoundingClientRect().width || 1); }

    function animoi(kohde) {
      kohde = rajaa(kohde);
      if (anim) cancelAnimationFrame(anim);
      if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { aseta(kohde); return; }
      const alku = Object.assign({}, vb), t0 = performance.now();
      const askel = t => {
        const s = Math.min(1, (t - t0) / ANIM_MS), e = 1 - Math.pow(1 - s, 3);
        aseta({ x: alku.x + (kohde.x - alku.x) * e, y: alku.y + (kohde.y - alku.y) * e,
                w: alku.w + (kohde.w - alku.w) * e, h: 0 });
        anim = s < 1 ? requestAnimationFrame(askel) : null;
      };
      anim = requestAnimationFrame(askel);
    }

    // ── Rulla ja kosketuslevy ──
    svg.addEventListener('wheel', e => {
      if (e.ctrlKey) {
        // Kosketuslevyn nipistys tai Ctrl + rulla
        e.preventDefault();
        if (anim) { cancelAnimationFrame(anim); anim = null; }
        const kerroin = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.15 : 0.01));
        aseta(zoomattuna(kerroin, karttaPiste(e.clientX, e.clientY)));
      } else if (onZoomattu()) {
        // Zoomattuna vieritys siirtää karttaa
        e.preventDefault();
        const yks = e.deltaMode === 1 ? 16 : (e.deltaMode === 2 ? 400 : 1);
        const pk = pikseliKoko();
        const dx = (e.shiftKey && !e.deltaX ? e.deltaY : e.deltaX) * yks * pk;
        const dy = (e.shiftKey && !e.deltaX ? 0 : e.deltaY) * yks * pk;
        aseta({ x: vb.x + dx, y: vb.y + dy, w: vb.w, h: vb.h });
      }
      // Muuten sivu vierittyy normaalisti
    }, { passive: false });

    svg.addEventListener('dblclick', e => {
      e.preventDefault();
      animoi(zoomattuna(2, karttaPiste(e.clientX, e.clientY)));
    });

    // ── Vetäminen ja nipistys (hiiri ja kosketus) ──
    const osoittimet = new Map();
    let veto = null;      // { x, y, vb } yhden osoittimen veto
    let nipistys = null;  // { d, keski, vb }
    let liikkui = false;  // estää klikkauksen vetämisen jälkeen

    const etaisyys = () => { const [a, b] = [...osoittimet.values()]; return Math.hypot(a.x - b.x, a.y - b.y) || 1; };
    const keskikohta = () => { const [a, b] = [...osoittimet.values()]; return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; };

    svg.addEventListener('pointerdown', e => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      osoittimet.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (osoittimet.size === 1) {
        veto = { x: e.clientX, y: e.clientY, vb: Object.assign({}, vb) };
        liikkui = false;
      } else if (osoittimet.size === 2) {
        const k = keskikohta();
        nipistys = { d: etaisyys(), keski: karttaPiste(k.x, k.y), vb: Object.assign({}, vb) };
        veto = null; liikkui = true;
        try { osoittimet.forEach((_, id) => svg.setPointerCapture(id)); } catch (err) { /* ei haittaa */ }
      }
    });

    svg.addEventListener('pointermove', e => {
      if (!osoittimet.has(e.pointerId)) return;
      osoittimet.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (nipistys && osoittimet.size >= 2) {
        e.preventDefault();
        if (anim) { cancelAnimationFrame(anim); anim = null; }
        aseta(zoomattuna(etaisyys() / nipistys.d, nipistys.keski, nipistys.vb));
        return;
      }
      if (!veto) return;
      const dx = e.clientX - veto.x, dy = e.clientY - veto.y;
      if (!liikkui) {
        if (Math.hypot(dx, dy) < VETO_RAJA || !onZoomattu()) return;
        liikkui = true;
        // Kaapataan vasta kun tiedetään, että kyse on vetämisestä: muuten paikan klikkaus ei toimisi
        try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ei haittaa */ }
      }
      e.preventDefault();
      if (anim) { cancelAnimationFrame(anim); anim = null; }
      const pk = veto.vb.w / (svg.getBoundingClientRect().width || 1);
      aseta({ x: veto.vb.x - dx * pk, y: veto.vb.y - dy * pk, w: veto.vb.w, h: veto.vb.h });
    });

    function lopeta(e) {
      osoittimet.delete(e.pointerId);
      if (osoittimet.size < 2) nipistys = null;
      if (osoittimet.size === 1) {
        // Nipistyksen jälkeen jäljelle jäänyt sormi jatkaa vetämistä hyppäämättä
        const [p] = [...osoittimet.values()];
        veto = { x: p.x, y: p.y, vb: Object.assign({}, vb) };
      } else if (osoittimet.size === 0) {
        veto = null;
      }
    }
    svg.addEventListener('pointerup', lopeta);
    svg.addEventListener('pointercancel', lopeta);

    // Vetämisen tai nipistyksen päätteeksi ei avata paikan tietoja
    svg.addEventListener('click', e => {
      if (liikkui) { e.stopPropagation(); e.preventDefault(); liikkui = false; }
    }, true);

    // ── Julkiset toiminnot ──
    function zoomaaElementtiin(el, asetus) {
      if (!el || typeof el.getBBox !== 'function') return;
      let bb;
      try { bb = el.getBBox(); } catch (err) { return; }
      if (!bb || (!bb.width && !bb.height)) return;
      const o = Object.assign({ marginaali: 4, minW: base.w / 3 }, asetus || {});
      let w = Math.max(bb.width * o.marginaali, (bb.height * o.marginaali) / suhde, base.w / MAX_ZOOM);
      w = Math.min(w, o.minW, base.w);
      const kx = bb.x + bb.width / 2, ky = bb.y + bb.height / 2;
      if (vb.w <= w) {
        // Ollaan jo tarpeeksi lähellä: siirretään vain, jos paikka ei ole kokonaan näkyvissä
        const nakyy = bb.x >= vb.x && bb.y >= vb.y && bb.x + bb.width <= vb.x + vb.w && bb.y + bb.height <= vb.y + vb.h;
        if (nakyy) return;
        w = vb.w;
      }
      animoi({ x: kx - w / 2, y: ky - (w * suhde) / 2, w, h: w * suhde });
    }

    aseta(vb);
    const api = { zoomaaElementtiin, nollaa: () => animoi(Object.assign({}, base)), kehys };
    svg.__kz = api;
    return api;
  }

  window.KarttaZoom = { liita };
})();
