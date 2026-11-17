/**
 * nav.js — Kalajoen Peltityö ERP: yhteinen ☰-valikko kaikille sivuille
 *
 * Valikon sisältö on vain tässä tiedostossa. Uusi sivu lisätään valikkoon
 * lisäämällä yksi rivi alla olevaan VALIKKO-listaan.
 *
 * Sivulla tarvitaan:
 *   <div class="nav-dropdown" id="navDropdown"> ... </div>   (tai id="navDropdownLasku")
 *   <script src="nav.js?v=1"></script>   heti valikon jälkeen
 * Valikon avaus/sulku ja ulkoasu (.nav-item, .nav-divider jne.) ovat sivun omia.
 *
 * Toiminta:
 *   - Ylimpänä Etusivu ja kolme viimeksi käytettyä sivua (muistetaan selaimessa).
 *   - Kategoriat ovat kiinni, paitsi se jossa nykyinen sivu on.
 *   - Kategorian otsikon napautus avaa tai sulkee sen.
 */
(function () {
  'use strict';

  const ETUSIVU = { href: 'etusivu.html', label: '🏠 Etusivu' };

  const VALIKKO = [
    { nimi: 'Tilaukset', sivut: [
      { href: 'tilaukset.html',     label: '📋 Tilaukset' },
      { href: 'tilaus.html',        label: '✏️ Uusi tilaus' },
      { href: 'asiakkaat.html',     label: '👤 Asiakkaat' },
      { href: 'lasku.html',         label: '🧾 Laskutus' },
    ]},
    { nimi: 'Tuotanto', sivut: [
      { href: 'tuotanto.html',      label: '⚙️ Tuotanto' },
      { href: 'peltipiirturi.html', label: '🔨 Mallisto' },
      { href: 'vakiomallit.html',   label: '🔧 Vakiomallit' },
      { href: 'piippu.html',        label: '🏭 Piippu' },
      { href: 'laskin.html',        label: '🧮 Laskin' },
    ]},
    { nimi: 'Varasto', sivut: [
      { href: 'varasto.html',       label: '📦 Varasto' },
      { href: 'varastotyo.html',    label: '📱 Varastotyö' },
      { href: '../maps/verstaspohja_mitoitettu.html', label: '🗺 Varastokartta' },
    ]},
    { nimi: 'Ajat ja henkilöstö', sivut: [
      { href: 'tunnit.html',        label: '⏱ Tunnit' },
      { href: 'ajanseuranta.html',  label: '⏲ Ajanseuranta' },
      { href: 'henkilosto.html',    label: '👥 Henkilöstö' },
    ]},
    { nimi: 'Toimisto', sivut: [
      { href: 'tehtavat.html',      label: '✅ Tehtävät' },
      { href: 'kalenteri.html',     label: '📅 Kalenteri' },
      { href: 'hinnasto.html',      label: '💰 Hinnasto' },
    ]},
  ];

  // Sivut, jotka eivät ole valikossa, mutta kuuluvat jonkin valikkosivun alle
  const ALISIVUT = {
    'piippu_tuotanto.html': 'tuotanto.html',
    'varasto_qr.html':      'varasto.html',
  };

  const LS_VIIMEISET = 'kpt_nav_viimeiset';
  const VIIMEISIA = 3;

  const dd = document.getElementById('navDropdown') || document.getElementById('navDropdownLasku');
  if (!dd) return;

  const kaikki = [ETUSIVU];
  VALIKKO.forEach(k => k.sivut.forEach(s => kaikki.push(s)));
  const sivuHrefilla = href => kaikki.find(s => s.href === href);

  const tiedosto = (location.pathname.split('/').pop() || 'etusivu.html').toLowerCase();
  const nykyinen = ALISIVUT[tiedosto] || tiedosto;
  const onAlisivu = !!ALISIVUT[tiedosto];

  // ── Viimeksi käytetyt (selaimen muistissa) ──
  function lueViimeiset() {
    try {
      const v = JSON.parse(localStorage.getItem(LS_VIIMEISET) || '[]');
      return Array.isArray(v) ? v.filter(h => typeof h === 'string' && sivuHrefilla(h)) : [];
    } catch (e) { return []; }
  }
  // Kirjataan vain oikeat valikkosivut (ei etusivua, ei alisivuja kuten QR-tarrat)
  if (!onAlisivu && nykyinen !== ETUSIVU.href && sivuHrefilla(nykyinen)) {
    try {
      const v = lueViimeiset().filter(h => h !== nykyinen);
      v.unshift(nykyinen);
      localStorage.setItem(LS_VIIMEISET, JSON.stringify(v.slice(0, 8)));
    } catch (e) { /* yksityinen selaustila tms. — valikko toimii ilman muistia */ }
  }

  // Auki on se kategoria, jossa nykyinen sivu on
  const auki = new Set();
  VALIKKO.forEach(k => { if (k.sivut.some(s => s.href === nykyinen)) auki.add(k.nimi); });

  // ── Valikon omat lisätyylit (muut tyylit tulevat sivulta) ──
  if (!document.getElementById('kpt-nav-tyylit')) {
    const st = document.createElement('style');
    st.id = 'kpt-nav-tyylit';
    st.textContent = `
      #navDropdown .nav-kat, #navDropdownLasku .nav-kat {
        display: flex; align-items: center; justify-content: space-between; gap: 8px;
        font-weight: 600; width: 100%;
      }
      #navDropdown .nav-kat .nav-maara, #navDropdownLasku .nav-kat .nav-maara {
        font-weight: 400; opacity: 0.55; margin-left: 6px;
      }
      #navDropdown .nav-kat .nav-nuoli, #navDropdownLasku .nav-kat .nav-nuoli {
        opacity: 0.6; font-size: 0.9em; transition: transform 0.15s;
      }
      #navDropdown .nav-kat[aria-expanded="true"] .nav-nuoli,
      #navDropdownLasku .nav-kat[aria-expanded="true"] .nav-nuoli { transform: rotate(180deg); }
      #navDropdown .nav-ala .nav-item, #navDropdownLasku .nav-ala .nav-item { padding-left: 30px; }
    `;
    document.head.appendChild(st);
  }

  // ── Piirto ──
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const linkki = s =>
    `<a class="nav-item${s.href === nykyinen ? ' current' : ''}" href="${esc(s.href)}">${esc(s.label)}</a>`;

  function piirra() {
    let h = linkki(ETUSIVU);

    const viimeiset = lueViimeiset().filter(x => x !== nykyinen).slice(0, VIIMEISIA);
    if (viimeiset.length) {
      h += '<div class="nav-section-label">Viimeksi käytetyt</div>';
      viimeiset.forEach(x => { h += linkki(sivuHrefilla(x)); });
    }
    h += '<hr class="nav-divider">';

    VALIKKO.forEach((k, i) => {
      const onAuki = auki.has(k.nimi);
      h += `<button type="button" class="nav-item nav-kat" data-kat="${i}" aria-expanded="${onAuki}">` +
           `<span>${esc(k.nimi)}${onAuki ? '' : `<span class="nav-maara">${k.sivut.length}</span>`}</span>` +
           `<span class="nav-nuoli" aria-hidden="true">▾</span></button>`;
      if (onAuki) h += '<div class="nav-ala">' + k.sivut.map(linkki).join('') + '</div>';
    });

    dd.innerHTML = h;
  }

  // Kategorian avaus/sulku. stopPropagation: muuten sivun "klikkaus muualle sulkee valikon" sulkisi koko valikon.
  dd.addEventListener('click', e => {
    const b = e.target.closest('.nav-kat');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    const nimi = VALIKKO[+b.dataset.kat].nimi;
    if (auki.has(nimi)) auki.delete(nimi); else auki.add(nimi);
    piirra();
    const uusi = dd.querySelector(`.nav-kat[data-kat="${b.dataset.kat}"]`);
    if (uusi) uusi.focus({ preventScroll: true });
  });

  piirra();
})();
