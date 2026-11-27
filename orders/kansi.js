// Kalajoen Peltityö ERP — piipun kansi: lomake, kuva ja reikätaulukko (orders/kansi.js → KPT_KANSI)
//
// Vaihe 7b (23.11.2026), mockup piippu/kansi-mockup.html. Laskenta on piippu-laskenta.js:ssä (KPT_PIIPPU.laskeKansi),
// tämä tiedosto piirtää. Käyttäjät: piippu.html, harjapiippu.html (lomake + kuva) ja piippu_tuotanto.html (kuva, taulukko,
// mitattu ulkomitta, työkortin kansisivu). Vaatii piippu-laskenta.js:n (lataa ensin).
//
//   const lomake = KPT_KANSI.lomake(elementti, { muutos: () => laske() });
//   lomake.arvo()       → vals.kansi ilman mitattua ulkomittaa ({ tyyppi, T, lovi, viite, vaaka, syva, reiat })
//   lomake.aseta(kansi) → täyttää lomakkeen (muokkaus)
//   KPT_KANSI.kuva(k, { mista: 'leikkuu' | 'taitettu' })  → SVG (k = KPT_PIIPPU.laskeKansi(...)). Värit ovat
//       KPT_TYOKORTTI.paperille-muunnoksen tuntemia, joten sama kuva kelpaa paperille.
//   KPT_KANSI.reikaTaulu(k, { mista })  → HTML-taulukko reikien alku / keski / loppu kannen reunasta
//   KPT_KANSI.tiedot(k) → [[otsikko, teksti], ...] (aihio, taitos, kulmat) listoihin ja työkorttiin
//   KPT_KANSI.sivuKortti(el, { muutos, kortti }) → piippusivujen kansikortti (lomake + kuva + taulukko + mitattu), ks. alla
// Kuva: tasoaihio, ETU vasemmalla ja VASEN alhaalla (kuten piippusivuilla). Tomi 27.11.: katsotaan piipun yläpuolelta vasemman sivun
// puolelta, väri katsojaan päin (teksti oli ennen virheellisesti "alapuolelta katsottuna").
// Versiot: v1 23.11.2026. v2 24.11.2026: karvauksen profiilikuvake ei pieneen reikään (reiän muoto näkyy).
//          v3 24.11.2026: reikien mitat oletuksena muuratusta piipusta (Tomi), hupun pinta kuvaan omana viivanaan.
//          v5 26.11.2026 (ulkoasuremontti R2b): tyylit uuden ulkoasun muuttujilla (--kpt-*) vanhat varalla; sivuKortti(el, { kuvaMuunnos })
//             = kuvan SVG sivun muunnoksen läpi (Piippu: värillinen paperi). Ilman niitä (Tuotanto, Harjapiippu) ennallaan.
//          v4 24.11.2026: piippusivujen kortti kiinni oletuksena, reikien määrä otsikossa, aukeaa muokattaessa jos reikiä.
(function () {
  const PI = globalThis.KPT_PIIPPU || (typeof require === 'function' ? require('./piippu-laskenta.js') : null);
  const esc = s => String(s === null || s === undefined ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const mm = x => { const r = Math.round(x * 10) / 10; return (Object.is(r, -0) ? 0 : r).toLocaleString('fi-FI', { maximumFractionDigits: 1 }); };
  const f1 = x => x.toFixed(1);

  const CSS = `
  .kpk-lomake { font-size: 13px; }
  .kpk-rivi { display: flex; align-items: center; gap: 8px; margin: 5px 0; flex-wrap: wrap; }
  .kpk-rivi > label { flex: 1 1 150px; color: var(--kpt-himmea, var(--text2, #6b8fa8)); font-size: 12px; }
  .kpk-lomake input[type=number] { width: 76px; background: var(--kpt-kentta, var(--bg, #0a0f1a)); color: var(--kpt-teksti, var(--text, #e2eef5)); border: 1px solid var(--kpt-reuna2, var(--border, #1e3a4a)); border-radius: 3px; padding: 5px 6px; font-size: 13px; }
  .kpk-lomake select { background: var(--kpt-kentta, var(--bg, #0a0f1a)); color: var(--kpt-teksti, var(--text, #e2eef5)); border: 1px solid var(--kpt-reuna2, var(--border, #1e3a4a)); border-radius: 3px; padding: 5px 6px; font-size: 12px; max-width: 100%; }
  .kpk-reika { background: var(--kpt-paneeli2, var(--bg3, #1a2332)); border: 1px solid var(--kpt-reuna2, var(--border, #1e3a4a)); border-radius: 4px; padding: 6px 8px; margin: 6px 0; }
  .kpk-reika .kpk-rivi > label { flex: 0 0 82px; }
  .kpk-reika-otsikko { display: flex; justify-content: space-between; align-items: center; gap: 6px; font-weight: 600; font-size: 12px; }
  .kpk-nappi { background: var(--kpt-paneeli2, var(--bg3, #1a2332)); color: var(--kpt-teksti, var(--text, #e2eef5)); border: 1px solid var(--kpt-reuna2, var(--border, #1e3a4a)); border-radius: 3px; padding: 5px 10px; font-size: 12px; cursor: pointer; }
  .kpk-nappi:hover { border-color: var(--kpt-korostus, var(--accent, #22c55e)); }
  .kpk-poista { color: var(--kpt-virhe, #ef4444); padding: 3px 8px; }
  .kpk-vihje { color: var(--kpt-himmea, var(--text2, #6b8fa8)); font-size: 11px; margin: 3px 0; }
  .kpk-kuva svg { width: 100%; height: auto; display: block; margin: 0 auto; }
  .kpk-kuva .kpk-alle { color: var(--kpt-himmea, var(--text2, #6b8fa8)); font-size: 11px; text-align: center; margin: 2px 0; }
  .kpk-taulu { width: 100%; border-collapse: collapse; font-size: 12px; }
  .kpk-taulu th, .kpk-taulu td { border-bottom: 1px solid var(--kpt-reuna2, var(--border, #1e3a4a)); padding: 4px 5px; text-align: right; white-space: nowrap; }
  .kpk-taulu th:first-child, .kpk-taulu td:first-child { text-align: left; }
  .kpk-taulu th { color: var(--kpt-himmea, var(--text2, #6b8fa8)); font-weight: 600; }
  .kpk-taulu th.kpk-ryhma { text-align: center; color: var(--kpt-teksti, var(--text, #e2eef5)); }
  .kpk-taulu td.kpk-iso { font-weight: 700; color: var(--kpt-korostus, var(--accent, #22c55e)); }
  .kpk-taulu-vieritys { overflow-x: auto; }
  .kpk-varoitus { color: var(--kpt-huom, #f59e0b); font-size: 12px; margin: 4px 0; }
  .kpk-grid { display: grid; grid-template-columns: minmax(240px, 330px) minmax(0, 1fr); gap: 14px; margin-top: 10px; align-items: start; }
  @media (max-width: 900px) { .kpk-grid { grid-template-columns: minmax(0, 1fr); } }
  .kpk-mitattu { margin: 6px 0; padding: 6px 8px; border: 1px solid var(--kpt-huom, #f59e0b); border-radius: 4px; font-size: 12px; color: var(--kpt-huom, #fcd34d); }
  `;
  function lisaaCss() {
    if (typeof document === 'undefined' || document.getElementById('kpk-css')) return;
    const st = document.createElement('style'); st.id = 'kpk-css'; st.textContent = CSS; document.head.appendChild(st);
  }

  // ---------- Lomake (piippusivut) ----------
  const TAVAT = [['keski', 'Keskellä'], ['reuna', 'Reunasta reiän reunaan'], ['keskelle', 'Reunasta reiän keskelle']];
  const uusiReika = o => Object.assign({ muoto: 'nelio', d: 150, l: 150, s: 150, sTapa: 'keski', sMm: 0, vTapa: 'keski', vMm: 0, karvaus: true, karvMm: 7 }, o || {});
  const valinta = (nimi, arvo, vaihtoehdot) => '<select data-k="' + nimi + '">' +
    vaihtoehdot.map(([v, t]) => '<option value="' + v + '"' + (v === arvo ? ' selected' : '') + '>' + t + '</option>').join('') + '</select>';
  const luku = (nimi, arvo, extra) => '<input type="number" data-k="' + nimi + '" value="' + esc(arvo === null || arvo === undefined ? '' : arvo) + '"' + (extra || '') + '>';

  function lomake(el, opts) {
    lisaaCss();
    const o = opts || {};
    let tila = { tyyppi: 'tupla', T: null, lovi: '45', viite: 'piippu', vaaka: 'vasen', syva: 'etu', reiat: [] };
    let oletusT = 20;
    const muutos = () => { if (typeof o.muutos === 'function') o.muutos(); };

    function piirra() {
      const syva = tila.syva === 'etu' ? 'edestä' : 'takaa', vaaka = tila.vaaka === 'vasen' ? 'vasemmasta' : 'oikeasta';
      let h = '<div class="kpk-lomake">' +
        '<div class="kpk-rivi"><label>Kannen reunan taitos</label>' + valinta('tyyppi', tila.tyyppi, [['tupla', 'Tupla (yläreunan päälle)'], ['90', '90° alas']]) + '</div>' +
        '<div class="kpk-rivi"><label>Taitoksen leveys (mm)</label>' + luku('T', tila.T, ' placeholder="' + esc(oletusT) + '"') + '</div>' +
        '<div class="kpk-rivi"><label>Kulmat</label>' + valinta('lovi', tila.lovi, [['45', '45° viisto'], ['suora', 'Suora lovi']]) + '</div>' +
        '<div class="kpk-rivi"><label>Reikien mitat mitattu</label>' + valinta('viite', tila.viite, [['piippu', 'muuratusta piipusta'], ['huppu', 'hupun pellin ulkopinnasta']]) + '</div>' +
        '<div class="kpk-rivi"><label>Etu–taka-mitat</label>' + valinta('syva', tila.syva, [['etu', 'edestä taaksepäin'], ['taka', 'takaa eteenpäin']]) + '</div>' +
        '<div class="kpk-rivi"><label>Vasen–oikea-mitat</label>' + valinta('vaaka', tila.vaaka, [['vasen', 'vasemmasta'], ['oikea', 'oikeasta']]) + '</div>';
      tila.reiat.forEach((r, i) => {
        const p = 'r' + i + '.';
        const koko = r.muoto === 'pyorea'
          ? '<div class="kpk-rivi"><label>Halkaisija</label>' + luku(p + 'd', r.d) + ' mm</div>'
          : '<div class="kpk-rivi"><label>Koko</label>' + luku(p + 's', r.s, ' title="etu–taka"') + ' × ' + luku(p + 'l', r.l, ' title="vasen–oikea"') + ' mm</div>';
        const mitta = (tapa, nimi, arvo) => tapa === 'keski' ? '' : ' ' + luku(p + nimi, arvo) + ' mm';
        h += '<div class="kpk-reika">' +
          '<div class="kpk-reika-otsikko"><span>Reikä ' + (i + 1) + '</span><span>' +
          valinta(p + 'muoto', r.muoto, [['nelio', 'Suorakulmio'], ['pyorea', 'Pyöreä']]) +
          ' <button type="button" class="kpk-nappi kpk-poista" data-poista="' + i + '" title="Poista reikä">✕</button></span></div>' +
          koko +
          '<div class="kpk-rivi"><label>Etu–taka</label>' + valinta(p + 'sTapa', r.sTapa, TAVAT) + mitta(r.sTapa, 'sMm', r.sMm) + '</div>' +
          '<div class="kpk-rivi"><label>Vasen–oikea</label>' + valinta(p + 'vTapa', r.vTapa, TAVAT) + mitta(r.vTapa, 'vMm', r.vMm) + '</div>' +
          '<div class="kpk-rivi"><label>Karvaus</label><input type="checkbox" data-k="' + p + 'karvaus"' + (r.karvaus ? ' checked' : '') + '>' +
          (r.karvaus ? ' ' + luku(p + 'karvMm', r.karvMm) + ' mm ylöspäin' : ' <span class="kpk-vihje">ei karvausta</span>') + '</div>' +
          '<div class="kpk-vihje">Etu–taka ' + syva + ', vasen–oikea ' + vaaka + ' reunasta (' + (tila.viite === 'huppu' ? 'hupun pellin pinnasta' : 'muuratusta piipusta') + '). Koko: etu–taka × vasen–oikea.</div>' +
          '</div>';
      });
      h += (tila.reiat.length < PI.KANSI_REIKIA_MAX ? '<button type="button" class="kpk-nappi" data-lisaa="1">+ Lisää reikä</button>' : '') +
        '<div class="kpk-vihje">Enintään ' + PI.KANSI_REIKIA_MAX + ' reikää. Jokainen mitta mitataan valitusta piipun reunasta, ei edellisestä reiästä.</div></div>';
      el.innerHTML = h;
    }

    // Kentän muutos: numerot päivittyvät hiljaa (fokus säilyy), valinnat ja ruksit piirtävät lomakkeen uudelleen.
    function kasittele(e, piirraUudelleen) {
      const k = e.target.getAttribute('data-k');
      if (!k) return;
      const m = k.match(/^r(\d+)\.(\w+)$/);
      const kohde = m ? tila.reiat[Number(m[1])] : tila, nimi = m ? m[2] : k;
      if (!kohde) return;
      if (e.target.type === 'checkbox') kohde[nimi] = e.target.checked;
      else if (e.target.tagName === 'SELECT') kohde[nimi] = e.target.value;
      else kohde[nimi] = e.target.value === '' ? (nimi === 'T' ? null : 0) : Number(e.target.value);
      if (piirraUudelleen) piirra();
      muutos();
    }
    el.addEventListener('input', e => { if (e.target.tagName === 'INPUT' && e.target.type === 'number') kasittele(e, false); });
    el.addEventListener('change', e => { if (e.target.tagName === 'SELECT' || e.target.type === 'checkbox') kasittele(e, true); });
    el.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      if (b.hasAttribute('data-lisaa')) {
        const ed = tila.reiat[tila.reiat.length - 1];
        tila.reiat.push(uusiReika(ed ? Object.assign({}, ed) : {}));
      } else if (b.hasAttribute('data-poista')) tila.reiat.splice(Number(b.getAttribute('data-poista')), 1);
      else return;
      piirra(); muutos();
    });

    piirra();
    return {
      arvo: () => JSON.parse(JSON.stringify(tila)),
      aseta: k => {
        const a = k || {};
        tila = {
          tyyppi: a.tyyppi === '90' ? '90' : 'tupla', T: a.T === undefined || a.T === '' ? null : a.T, lovi: a.lovi === 'suora' ? 'suora' : '45',
          viite: a.viite === 'huppu' ? 'huppu' : 'piippu', vaaka: a.vaaka === 'oikea' ? 'oikea' : 'vasen', syva: a.syva === 'taka' ? 'taka' : 'etu',
          reiat: (Array.isArray(a.reiat) ? a.reiat : []).slice(0, PI.KANSI_REIKIA_MAX).map(r => uusiReika(r)),
        };
        piirra();
      },
      oletusT: n => { if (n !== oletusT) { oletusT = n; const i = el.querySelector('[data-k="T"]'); if (i) i.placeholder = n; } },
    };
  }

  // ---------- Kuva ----------
  // Värit: #e2eef5 ääriviiva, #22c55e 90° taitos, #f59e0b tupla, #6b8fa8 piippu ja nimet, #38bdf8 reiät ja mitat, #ef4444 karvaus.
  function kuva(k, opts) {
    const o = opts || {};
    const AU = k.S.aihio, AW = k.L.aihio, D = k.D, as = k.as;
    const nimet = k.harja ? { etu: 'ETU 1', taka: 'ETU 2' } : { etu: 'ETU', taka: 'TAKA' };
    const margX = 74, margY = 70;
    const skaala = Math.min(560 / AU, 640 / AW);
    const W = AU * skaala + 2 * margX, H = AW * skaala + 2 * margY + 18;
    const ox = margX, oy = margY;
    const X = u => ox + u * skaala, Y = w => oy + (AW - w) * skaala;
    const P = q => f1(X(q[0])) + ' ' + f1(Y(q[1]));
    const CI = '#38bdf8', CR = '#ef4444', CA = '#f59e0b', CG = '#22c55e', C1 = '#e2eef5', C2 = '#6b8fa8', fs = 13;

    // ääriviiva: kulmissa 45° viisto (T kumpaankin suuntaan) tai suora lovi T × T
    const kulma = (cu, cw, su, sw) => {
      const pt = (du, dw) => [cu + su * du, cw + sw * dw];
      return as.lovi === 'suora' ? [pt(D, 0), pt(D, D), pt(0, D)] : [pt(D, 0), pt(0, D)];
    };
    const k1 = kulma(0, 0, 1, 1), k2 = kulma(AU, 0, -1, 1), k3 = kulma(AU, AW, -1, -1), k4 = kulma(0, AW, 1, -1);
    const polku = 'M' + [].concat(k1, k4.slice().reverse(), k3, k2.slice().reverse()).map(P).join(' L') + ' Z';
    const id = 'kpk-raja-' + Math.random().toString(36).slice(2, 8);

    let s = '<svg viewBox="0 0 ' + Math.round(W) + ' ' + Math.round(H) + '" style="max-width:' + Math.round(W * 1.15) + 'px" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">';
    s += '<defs><clipPath id="' + id + '"><path d="' + polku + '"/></clipPath></defs>';
    s += '<path d="' + polku + '" fill="#1a2332" stroke="' + C1 + '" stroke-width="1.6"/>';
    s += '<rect x="' + f1(X(D)) + '" y="' + f1(Y(AW - D)) + '" width="' + f1((AU - 2 * D) * skaala) + '" height="' + f1((AW - 2 * D) * skaala) +
      '" fill="none" stroke="' + (as.tyyppi === 'tupla' ? CA : CG) + '" stroke-width="1.1" stroke-dasharray="7 5" clip-path="url(#' + id + ')"/>';
    const pu0 = D + k.S.piippuSiirto, pw0 = D + k.L.piippuSiirto;
    s += '<rect x="' + f1(X(pu0)) + '" y="' + f1(Y(pw0 + k.L.piippu)) + '" width="' + f1(k.S.piippu * skaala) + '" height="' + f1(k.L.piippu * skaala) +
      '" fill="none" stroke="' + C2 + '" stroke-width="1" stroke-dasharray="2 4"/>';
    s += '<text x="' + f1(X(pu0) + 4) + '" y="' + f1(Y(pw0 + k.L.piippu) + 12) + '" font-size="10" fill="' + C2 + '">muurattu piippu</text>';
    // Hupun pellin pinta omana viivanaan, kun reikien mitat on annettu siitä (Tomi 24.11.2026: muuten mitta näytti alkavan piipusta)
    if (as.viite === 'huppu' && k.S.huppu > k.S.piippu + 0.5) {
      const hu0 = D + (k.S.sisa - k.S.huppu) / 2, hw0 = D + (k.L.sisa - k.L.huppu) / 2;
      s += '<rect x="' + f1(X(hu0)) + '" y="' + f1(Y(hw0 + k.L.huppu)) + '" width="' + f1(k.S.huppu * skaala) + '" height="' + f1(k.L.huppu * skaala) +
        '" fill="none" stroke="' + C2 + '" stroke-width="1" stroke-dasharray="8 3 2 3"/>';
      s += '<text x="' + f1(X(hu0 + k.S.huppu) - 4) + '" y="' + f1(Y(hw0 + k.L.huppu) - 3) + '" text-anchor="end" font-size="10" fill="' + C2 + '">hupun pinta</text>';
    }

    const pois = o.mista === 'taitettu' ? D : 0;
    const uAlku = as.syva === 'etu' ? pois : AU - pois, wAlku = as.vaaka === 'vasen' ? pois : AW - pois;
    const sMitta = u => Math.abs(u - uAlku), vMitta = w => Math.abs(w - wAlku);

    k.reiat.forEach(r => {
      const cx = X(r.u), cy = Y(r.w), hw = r.du / 2 * skaala, hh = r.dw / 2 * skaala;
      const x0 = cx - hw, x1 = cx + hw, y0 = cy - hh, y1 = cy + hh;
      if (r.muoto === 'pyorea') s += '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(hw) + '" fill="#111827" stroke="' + CI + '" stroke-width="1.5"/>';
      else s += '<rect x="' + f1(x0) + '" y="' + f1(y0) + '" width="' + f1(2 * hw) + '" height="' + f1(2 * hh) + '" rx="' + f1(r.rReika * skaala) + '" fill="#111827" stroke="' + CI + '" stroke-width="1.5"/>';
      if (r.karvaus && r.leikDw > 0 && r.leikDu > 0) {
        const kk = r.karvaus * skaala;
        if (r.muoto === 'pyorea') s += '<circle cx="' + f1(cx) + '" cy="' + f1(cy) + '" r="' + f1(hw - kk) + '" fill="none" stroke="' + CR + '" stroke-width="1.2" stroke-dasharray="5 3"/>';
        else s += '<rect x="' + f1(x0 + kk) + '" y="' + f1(y0 + kk) + '" width="' + f1(2 * hw - 2 * kk) + '" height="' + f1(2 * hh - 2 * kk) + '" rx="' + f1(r.rLeik * skaala) + '" fill="none" stroke="' + CR + '" stroke-width="1.2" stroke-dasharray="5 3"/>';
        // pieni profiilikuva: pelti ja ylös käännetty reuna (ei pieneen reikään, jottei peitä sitä; karvaus näkyy taulukossa)
        if (Math.min(hw, hh) >= 28) {
        const ix = cx - 13, iy = r.muoto === 'pyorea' ? cy + Math.min(hw * 0.55, hw - 6) : cy + 16;
        s += '<rect x="' + f1(ix - 4) + '" y="' + f1(iy - 14) + '" width="34" height="20" rx="3" fill="#1a2332" stroke="' + CR + '" stroke-width="0.6"/>' +
          '<path d="M' + f1(ix) + ' ' + f1(iy + 1) + ' H' + f1(ix + 12) + ' V' + f1(iy - 10) + '" fill="none" stroke="' + CR + '" stroke-width="2"/>' +
          '<text x="' + f1(ix + 15) + '" y="' + f1(iy - 1) + '" font-size="10" fill="' + CR + '">' + mm(r.karvaus) + '</text>';
        }
      }
      const ny = r.muoto === 'pyorea' ? cy - Math.min(hw * 0.4, 30) : cy - (r.karvaus && Math.min(hw, hh) >= 28 ? 2 : -5);
      s += '<text x="' + f1(cx) + '" y="' + f1(ny) + '" text-anchor="middle" font-size="15" font-weight="700" fill="' + CI + '">' + r.nro + '</text>';
      if (r.muoto === 'pyorea') {
        const vas = X(uAlku) <= cx, ala = Y(wAlku) >= cy;
        s += '<line x1="' + (cx - 5) + '" y1="' + cy + '" x2="' + (cx + 5) + '" y2="' + cy + '" stroke="' + CI + '"/><line x1="' + cx + '" y1="' + (cy - 5) + '" x2="' + cx + '" y2="' + (cy + 5) + '" stroke="' + CI + '"/>';
        s += viiva(X(uAlku), cy, cx, cy, CI) + teksti(cx + (vas ? -hw - 4 : hw + 4), cy - 4, mm(sMitta(r.u)), vas ? 'end' : 'start', CI);
        s += viiva(cx, Y(wAlku), cx, cy, CI) + teksti(cx + 13, cy + (ala ? hh + 4 : -hh - 4), mm(vMitta(r.w)), ala ? 'end' : 'start', CI, true);
      } else {
        // etu–taka: alku reiän yläpuolelle, loppu alapuolelle; vasen–oikea: alku vasemmalle, loppu oikealle (Tomi 23.11.)
        const uLahi = as.syva === 'etu' ? r.u - r.du / 2 : r.u + r.du / 2, uKauka = as.syva === 'etu' ? r.u + r.du / 2 : r.u - r.du / 2;
        s += mittaVaaka(X(uAlku), X(uLahi), y0 - 7, mm(sMitta(uLahi)), 'yla', CI);
        s += mittaVaaka(X(uAlku), X(uKauka), y1 + 7, mm(sMitta(uKauka)), 'ala', CI);
        const wLahi = as.vaaka === 'vasen' ? r.w - r.dw / 2 : r.w + r.dw / 2, wKauka = as.vaaka === 'vasen' ? r.w + r.dw / 2 : r.w - r.dw / 2;
        s += mittaPysty(x0 - 7, Y(wAlku), Y(wLahi), mm(vMitta(wLahi)), 'vasen', CI);
        s += mittaPysty(x1 + 7, Y(wAlku), Y(wKauka), mm(vMitta(wKauka)), 'oikea', CI);
      }
    });

    s += mittaVaaka(X(0), X(AU), oy - 22, k.aihio.pit + ' mm', 'yla', C1, true);
    s += mittaPysty(X(AU) + 22, Y(0), Y(AW), k.aihio.lev + ' mm', 'oikea', C1, true);
    const ky = oy + AW * skaala / 2;
    s += '<text transform="translate(' + (ox - 28) + ' ' + f1(ky) + ') rotate(-90)" text-anchor="middle" font-size="' + fs + '" font-weight="700" fill="' + CG + '">' + nimet.etu + '</text>';
    s += '<text transform="translate(' + f1(X(AU) + 58) + ' ' + f1(ky) + ') rotate(90)" text-anchor="middle" font-size="' + fs + '" fill="' + C2 + '">' + nimet.taka + '</text>';
    s += '<text x="' + f1(ox + AU * skaala / 2) + '" y="' + f1(Y(0) + 24) + '" text-anchor="middle" font-size="' + fs + '" font-weight="700" fill="' + C1 + '">VASEN</text>';
    s += '<text x="' + f1(ox + AU * skaala / 2) + '" y="' + (oy - 46) + '" text-anchor="middle" font-size="' + fs + '" fill="' + C2 + '">OIKEA</text>';

    const sy = H - 8;
    let sx = 8;
    const selite = (vari, viivat, t) => {
      s += '<line x1="' + sx + '" y1="' + (sy - 4) + '" x2="' + (sx + 20) + '" y2="' + (sy - 4) + '" stroke="' + vari + '" stroke-width="1.4" stroke-dasharray="' + viivat + '"/>' +
        '<text x="' + (sx + 24) + '" y="' + sy + '" font-size="11" fill="' + C2 + '">' + t + '</text>';
      sx += 32 + t.length * 6;
    };
    if (as.tyyppi === 'tupla') selite(CA, '7 5', 'tupla (180°)'); else selite(CG, '7 5', '90° alas');
    if (k.reiat.some(r => r.karvaus)) selite(CR, '5 3', 'leikkaus (karvaus)');
    s += '</svg>';
    return s;
  }
  const alateksti = opts => 'Etu vasemmalla, vasen alhaalla (kansi yläpuolelta vasemman sivun puolelta katsottuna, väri ylöspäin). Mitat ' +
    ((opts || {}).mista === 'taitettu' ? 'taitetun kannen reunasta.' : 'tasoaihion leikkuureunasta.');

  function teksti(x, y, t, anchor, vari, pysty) {
    const tyyli = ' font-size="12" fill="' + vari + '" paint-order="stroke" stroke="#111827" stroke-width="3"';
    return pysty
      ? '<text transform="translate(' + f1(x) + ' ' + f1(y) + ') rotate(-90)" text-anchor="' + anchor + '"' + tyyli + '>' + t + '</text>'
      : '<text x="' + f1(x) + '" y="' + f1(y) + '" text-anchor="' + anchor + '"' + tyyli + '>' + t + '</text>';
  }
  function mittaVaaka(xa, xb, y, t, puoli, vari, keski) {
    const oik = xb >= xa;
    return viiva(xa, y, xb, y, vari) + teksti(keski ? (xa + xb) / 2 : xb + (oik ? -4 : 4), puoli === 'yla' ? y - 4 : y + 13, t, keski ? 'middle' : (oik ? 'end' : 'start'), vari);
  }
  function mittaPysty(x, ya, yb, t, puoli, vari, keski) {
    const ylos = yb < ya;
    return viiva(x, ya, x, yb, vari) + teksti(puoli === 'vasen' ? x - 4 : x + 13, keski ? (ya + yb) / 2 : yb + (ylos ? 4 : -4), t, keski ? 'middle' : (ylos ? 'end' : 'start'), vari, true);
  }
  function viiva(x1, y1, x2, y2, vari) {
    const nuoli = (xa, ya, xb, yb) => {
      const L = Math.hypot(xb - xa, yb - ya) || 1, ux = (xb - xa) / L, uy = (yb - ya) / L, k = 6;
      return '<path d="M' + f1(xb) + ' ' + f1(yb) + ' L' + f1(xb - ux * k - uy * 3) + ' ' + f1(yb - uy * k + ux * 3) + ' L' + f1(xb - ux * k + uy * 3) + ' ' + f1(yb - uy * k - ux * 3) + 'Z" fill="' + vari + '"/>';
    };
    return '<line x1="' + f1(x1) + '" y1="' + f1(y1) + '" x2="' + f1(x2) + '" y2="' + f1(y2) + '" stroke="' + vari + '" stroke-width="0.9"/>' + nuoli(x1, y1, x2, y2) + nuoli(x2, y2, x1, y1);
  }

  // ---------- Taulukot ----------
  function reikaTaulu(k, opts) {
    lisaaCss();
    const o = opts || {};
    if (!k.reiat.length) return '';
    const as = k.as;
    const sNimi = as.syva === 'etu' ? (k.harja ? 'Etu 1:stä' : 'Edestä') : (k.harja ? 'Etu 2:sta' : 'Takaa');
    const vNimi = as.vaaka === 'vasen' ? 'Vasemmasta' : 'Oikeasta';
    let h = '<div class="kpk-taulu-vieritys"><table class="kpk-taulu"><tr><th></th><th></th><th class="kpk-ryhma" colspan="3">' + sNimi + '</th><th class="kpk-ryhma" colspan="3">' + vNimi + '</th><th></th></tr>' +
      '<tr><th>Reikä</th><th>Koko</th><th>alku</th><th>keski</th><th>loppu</th><th>alku</th><th>keski</th><th>loppu</th><th>Karvaus</th></tr>';
    k.reiat.forEach(r => {
      const m = PI.kansiReianMitat(r, k, o.mista);
      const pyorea = r.muoto === 'pyorea';
      const koko = pyorea ? 'Ø' + mm(r.dw) : mm(r.du) + '×' + mm(r.dw);
      const karv = r.karvaus ? mm(r.karvaus) + ' mm (leikataan ' + (pyorea ? 'Ø' + mm(r.leikDw) : mm(r.leikDu) + '×' + mm(r.leikDw)) + ')' : '–';
      const td = (x, iso) => '<td' + (iso ? ' class="kpk-iso"' : '') + '>' + mm(x) + '</td>';
      h += '<tr><td>' + r.nro + '</td><td>' + koko + '</td>' + td(m.sAlku, !pyorea) + td(m.sKeski, pyorea) + td(m.sLoppu, !pyorea) +
        td(m.vAlku, !pyorea) + td(m.vKeski, pyorea) + td(m.vLoppu, !pyorea) + '<td>' + karv + '</td></tr>';
    });
    return h + '</table></div>';
  }

  function tiedot(k) {
    const as = k.as;
    return [
      ['Aihio', k.aihio.pit + ' × ' + k.aihio.lev + ' mm (etu–taka × vasen–oikea)'],
      ['Taitos', (as.tyyppi === 'tupla' ? 'tupla 180° yläreunan päälle' : '90° alas') + ', ' + mm(k.D) + ' mm reunasta'],
      ['Kulmat', as.lovi === 'suora' ? 'suora lovi ' + mm(k.D) + ' × ' + mm(k.D) + ' mm' : '45° viisto, ' + mm(k.D) + ' mm kulmasta'],
      ['Sisämitta', mm(k.S.sisa) + ' × ' + mm(k.L.sisa) + ' mm (piippu ulkoreunasta ' + mm(k.S.ulko) + ' × ' + mm(k.L.ulko) + ' + väljyys ' + mm(as.valjyys) + ')'],
    ];
  }

  // ---------- Piippusivujen kansikortti ----------
  // Rakentaa kortin sisällön elementtiin el (lomake + kuva + varoitukset + reikätaulukko) ja hoitaa Tuotannossa mitatun
  // ulkomitan (kansi.mitattu): se säilyy muokattaessa, kunnes käyttäjä poistaa sen. Kortti piilotetaan, kun kantta ei lasketa.
  //   const kortti = KPT_KANSI.sivuKortti(document.getElementById('kansi-kortti-sisalto'), { muutos: () => laske(), kortti: <details> });
  //   vals.kansi = kortti.arvo();  ...  kortti.piirra(tulos.kansi, vals);  muokkauksessa kortti.aseta(v.kansi)
  function sivuKortti(el, opts) {
    lisaaCss();
    const o = opts || {};
    el.innerHTML = '<div class="kpk-grid"><div><div class="kpk-mitattu-paikka"></div><div class="kpk-lomake-paikka"></div></div>' +
      '<div><div class="kpk-kuva"></div><div class="kpk-varoitukset"></div><div class="kpk-taulu-paikka"></div></div></div>';
    const q = c => el.querySelector('.' + c);
    let mitattu = null;
    const muutos = () => { if (typeof o.muutos === 'function') o.muutos(); };
    const lom = lomake(q('kpk-lomake-paikka'), { muutos });
    q('kpk-mitattu-paikka').addEventListener('click', e => { if (e.target.closest('[data-poista-mitattu]')) { mitattu = null; muutos(); } });
    return {
      arvo: () => { const k = lom.arvo(); if (mitattu) k.mitattu = mitattu; return k; },
      aseta: k => {
        lom.aseta(k); const m = k && k.mitattu; mitattu = m && (Number(m.lev) > 0 || Number(m.syv) > 0) ? { lev: m.lev || null, syv: m.syv || null } : null;
        if (o.kortti && k && ((Array.isArray(k.reiat) && k.reiat.length) || mitattu)) o.kortti.open = true;   // kortti kiinni oletuksena, auki jos reikiä
      },
      piirra: (k, vals) => {
        if (o.kortti) o.kortti.style.display = k ? '' : 'none';
        if (!k) return;
        // Reikien määrä otsikkoon, koska kortti on oletuksena kiinni (24.11.2026)
        const ots = o.kortti && o.kortti.querySelector('summary'), n = k.reiat.length;
        if (ots) ots.textContent = 'Kansi ja reiät' + (n ? ' · ' + n + (n === 1 ? ' reikä' : ' reikää') : ' · ei reikiä');
        try {
          const v = vals || {};
          lom.oletusT((v.ylaTyyppi || 'ulos') === 'ulos' && Number(v.ylareunaV) > 0 ? Number(v.ylareunaV) : 20);
          q('kpk-mitattu-paikka').innerHTML = mitattu
            ? '<div class="kpk-mitattu">Tuotannossa mitattu piipun ulkomitta on käytössä (etu–taka ' + (mitattu.syv || '–') + ', vasen–oikea ' + (mitattu.lev || '–') + ' mm). ' +
              '<button type="button" class="kpk-nappi" data-poista-mitattu="1">Poista mitattu</button></div>' : '';
          q('kpk-kuva').innerHTML = (typeof o.kuvaMuunnos === 'function' ? o.kuvaMuunnos(kuva(k)) : kuva(k)) + '<div class="kpk-alle">' + alateksti() + '</div>';
          q('kpk-varoitukset').innerHTML = k.varoitukset.map(t => '<div class="kpk-varoitus">⚠ ' + esc(t) + '</div>').join('');
          q('kpk-taulu-paikka').innerHTML = reikaTaulu(k);
        } catch (e) { console.error('Kansi:', e); q('kpk-kuva').innerHTML = '<p class="kpk-vihje">Kannen kuvan piirto epäonnistui.</p>'; }
      },
    };
  }

  const KPT_KANSI = { lomake, sivuKortti, kuva, alateksti, reikaTaulu, tiedot, CSS };
  globalThis.KPT_KANSI = KPT_KANSI;
  if (typeof module !== 'undefined' && module.exports) module.exports = KPT_KANSI;
})();
