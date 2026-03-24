Kalajoen Peltityö ERP — Tilanne ja tekolista
Projektin tila (maaliskuu 2026)
VALMIS ✅
Varastonhallinta
Tietokantarakenne (Supabase)
Varastorakenne ja -paikat (locations-taulu)
Pellin lisäys, muokkaus, arkistointi, varastopaikan vaihto
Retool desktop UI: Varasto / Kartta / Yhteenveto / Tuotteet välilehdet
Retool mobiili UI: Selaa / Lisää / Muokkaa / Kartta välilehdet
Varastokartta GitHub Pagesissa (interaktiivinen SVG, mobiiliresponsiivinen)
Toinen käyttäjä lisätty (johtaja, viewer-rooli)
Tuotteet-välilehti (lista, suodattimet, lisäys, muokkaus, poisto käytöstä)
ITEM (Kpl) ja BULK (Metri) tyypit käyttöön varastossa
product_code-kenttä lisätty products-tauluun ja funktioihin
GitHub kansiorakenne siistiytyi (docs/, maps/, supabase/functions/)
Tilausmoduuli (GitHub Pages)
peltipiirturi.html — peltiprofiilien piirtotyökalu
Profiilityypit: Alavesipelti, Alavp 2 (ikkunapelti), Ulkonurkka, Sisänurkka, Jiiripelti, Seinänvieripelti, Eturäystäspelti, Päätypelti, Päätypelti huopa, U-lista u/s, Kynnys, Hattulista, Z-lista, Peitelista, Vapaa profiili
SVG-esikatselu reaaliajassa, pintamerkki, kaato/nousu/etenemä/kokonaismitta
Pituustaulukko (mitta, päät, kok, kpl, huomio)
Aihioleveyslaskenta
Nimike-kenttä muokattavissa ennen tilauksen lisäystä
BroadcastChannel-integraatio tilauslomakkeeseen
tilaus.html — tilauslomake
Ryhmät (lisää, kopioi, poista, nimeä uudelleen)
Pellit ryhmitelty aihioleveyden mukaan
Kappalemäärä yhteensä ryhmän otsikossa
Tilauspäivä + toimituspäivä
Materiaali/väri/paksuus haetaan Supabasesta
Asiakkaat haetaan Supabasesta
Tilaus tallentuu Supabaseen (orders + order_items)
Pellin muokkaus jälkikäteen Malliston kautta
Mallisto: kaikki uudet peltityypit (Alavp 2, Päätypelti huopa, Jiiripelti, Peitelista)
Mallisto: materiaali/väri/paksuus-valinta
Tilauslomake: asiakas-haku kirjoittamalla
Tilauslomake: materiaali/väri/paksuus siirretty Mallistoon
Asiakkaat: 10 testiasiakasta lisätty Supabaseen
---
KESKEN / TEKOLISTA ⏳
Pienet karttatyöt
[ ] IN-R-02 klikattavaksi kartalla
[ ] IN-R-01 tasot 1 ja 2 kartalle
[ ] Vasen seinä (IN-L) tarkistus
Tilausmoduuli — viimeistelyä
[ ] Sidebar leveyssäätö tilaus.html:ssä (vetämällä leveämmäksi, localStorage muistaa)
[ ] Vakiomallit yrityksille (erillinen sivu tai "Tallenna malliksi" -toiminto)
[ ] Kappaletavara tilauslomakkeelle (tikkaat ym. ilman piirustusta)
Isommat kokonaisuudet
[ ] Kartta + taulukko yhdistäminen Retoolissa
[ ] QR-koodit hyllyihin
[ ] Leikkausoptimointi (rulla→levy→siivu, parent_stock_item_id)
[ ] Laskutus ja maksuseuranta
[ ] Muut varastot inventointi (Ulkovarasto, Auto, Kontti, Ulkohylly)
[ ] Johtajan resurssioikeudet — vaatii maksullisen Retool-version
---
Ohjeet uuden chat-ketjun aloitukseen
> "Jatketaan Kalajoen Peltityö ERP-projektia. Stack: Supabase + Retool + GitHub Pages. Warehouse ID: e56f3534-50f9-4081-8840-f81f03905113. Liitän projektidokumentit. Tänään tehdään: [mitä tehdään]."
---
Tärkeimmät tiedot pikaisesti
Asia	Arvo
Warehouse ID (Verstas)	e56f3534-50f9-4081-8840-f81f03905113
GitHub repo	eltsu2013/kalajoen-peltityo-erp
Kartta	maps/verstaspohja_mitoitettu.html
Peltipiirturi	orders/peltipiirturi.html
Tilauslomake	orders/tilaus.html
Supabase projekti	hjyeugeqmyavxisndlwp
Supabase anon key	eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWV1Z2VxbXlhdnhpc25kbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDM2NzgsImV4cCI6MjA4NjcxOTY3OH0.ZMuN6lruMUHkASUtwnoShiqHLAg6YBEGsC7zMlymLs4
Edge fn: lisää pelti	create_initial_stock_items
Edge fn: muokkaa	adjust_stock_item_edge
Edge fn: hae pellit	get_stock_items
Edge fn: hae tuotteet	get_products
Edge fn: lisää tuote	create_product
Edge fn: muokkaa tuote	update_product
Edge fn: poista tuote	deactivate_product
