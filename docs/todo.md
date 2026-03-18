Kalajoen Peltityö ERP — Tilanne ja tekolista
Projektin tila (maaliskuu 2026)
VALMIS ✅
Tietokantarakenne (Supabase)
Varastorakenne ja -paikat (locations-taulu)
Pellin lisäys, muokkaus, arkistointi, varastopaikan vaihto
Retool desktop UI: Varasto / Kartta / Yhteenveto / Tuotteet välilehdet
Retool mobiili UI: Selaa / Lisää / Muokkaa / Kartta välilehdet
Varastokartta GitHub Pagesissa (interaktiivinen SVG, mobiiliresponsiivinen)
Toinen käyttäjä lisätty (johtaja, viewer-rooli)
Tuotteet-välilehti (lista, suodattimet, lisäys, muokkaus, poisto käytöstä)
Tuoteryhmäsuodatin desktop ja mobiili
Uudet varastot: Verstas (ent. Kalajoki), Ulkovarasto, Auto, Kontti, Ulkohylly
Kourutarvikkeet K ja P lisätty tuotteisiin (RR 20, RR 23, RR 32, RR 33)
Kattoturvatuotteet lisätty tuotteisiin (RR 20, RR 23, RR 32, RR 33, RR 750)
Tarvikkeet lisätty tuotteisiin (kateruuvit, harjatiiviste, poraruuvi)
ITEM (Kpl) ja BULK (Metri) tyypit käyttöön varastossa
product_code-kenttä lisätty products-tauluun ja funktioihin
GitHub siistiytyi — kansiorakenne, dokumentit ja Edge Functionit talteen
KESKEN / TEKOLISTA ⏳
Pienet karttatyöt
[ ] IN-R-02 klikattavaksi kartalla (näkyy mutta ei reagoi)
[ ] IN-R-01 tasot 1 ja 2 kartalle
[ ] Vasen seinä (IN-L) tarkistus ja mahdolliset päivitykset
Käyttäjähallinta
[ ] Johtajan resurssioikeudet Retoolissa — vaatii maksullisen version
Isommat kokonaisuudet (uusia chat-ketjuja varten)
[ ] Kartta + taulukko yhdistäminen (karttaklikkauksesta suodattuu taulukko Retoolissa)
[ ] QR-koodit hyllyihin
[ ] Tilausmoduuli (asiakkaat, tarjoukset, tilaukset)
[ ] Leikkausoptimointi (rulla→levy→siivu ketju, parent_stock_item_id käyttöön)
[ ] Laskutus ja maksuseuranta
[ ] Muut varastot inventointi (Ulkovarasto, Auto, Kontti, Ulkohylly)
[ ] GitHub siistiminen (SQL-skriptit, dokumentit talteen)
---
Ohjeet uuden chat-ketjun aloitukseen
Liitä uuden chatin alkuun:
> "Jatketaan Kalajoen Peltityö ERP-projektia. Stack: Supabase + Retool + GitHub Pages. Warehouse ID: e56f3534-50f9-4081-8840-f81f03905113. Liitän projektidokumentit. Tänään tehdään: [mitä tehdään]."
Liitä mukaan tarvittavat .md-tiedostot tästä docs-kansiosta.
---
Tärkeimmät tiedot pikaisesti
Asia	Arvo
Warehouse ID (Verstas)	e56f3534-50f9-4081-8840-f81f03905113
GitHub repo	eltsu2013/kalajoen-peltityo-erp
Kartta	maps/verstaspohja_mitoitettu.html
Supabase projekti	hjyeugeqmyavxisndlwp
Edge fn: lisää pelti	create_initial_stock_items
Edge fn: muokkaa	adjust_stock_item_edge
Edge fn: hae pellit	get_stock_items
Edge fn: hae tuotteet	get_products
Edge fn: lisää tuote	create_product
Edge fn: muokkaa tuote	update_product
Edge fn: poista tuote	deactivate_product
