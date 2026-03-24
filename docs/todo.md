Kalajoen Peltityö ERP — Tilanne ja tekolista
Projektin tila (24. maaliskuuta 2026)
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
Supabase unit-arvot päivitetty: mm/Mm → m², m/M → m, kpl/Kpl → kpl
Tilausmoduuli (GitHub Pages)
peltipiirturi.html — peltiprofiilien piirtotyökalu (Mallisto)
Profiilityypit: Alavesipelti, Alavp 2 (ikkunapelti), Ulkonurkka, Sisänurkka, Jiiripelti, Seinänvieripelti, Eturäystäspelti, Päätypelti, Päätypelti huopa, U-lista u/s, Kynnys, Hattulista, Z-lista, Peitelista, Vapaa profiili
Napit ryhmitelty: MUUT ja KATOLLE osiot
SVG-esikatselu reaaliajassa, pintamerkki, kaato/nousu/etenemä/kokonaismitta
Pituustaulukko (mitta, päät, kok, kpl, huomio)
Aihioleveyslaskenta
Nimike-kenttä muokattavissa ennen tilauksen lisäystä
BroadcastChannel-integraatio tilauslomakkeeseen
Tuoteryhmä/materiaali/väri/paksuus-valinta — hakee Supabasesta, suodattuu unit=m² mukaan
Sidebar resize — vetoelementti, muistaa leveyden, 2/3/4 saraketta leveyden mukaan
tilaus.html — tilauslomake
Ryhmät (lisää, kopioi, poista, nimeä uudelleen)
Pellit ryhmitelty aihioleveyden mukaan ryhmän sisällä
Kappalemäärä yhteensä ryhmän otsikossa
Tilauspäivä + toimituspäivä
Asiakkaat haetaan Supabasesta, haku kirjoittamalla
Tilaus tallentuu Supabaseen (orders + order_items)
Pellin muokkaus jälkikäteen Malliston kautta
Materiaali/väri/paksuus valitaan Mallistossa — näkyy tilausrivillä
Kappaletavara-lomake (nimike, pituus m, määrä, yksikkö, huomio) — nimike hakee Supabasesta unit=m ja kpl tuotteet
Sidebar resize — vetoelementti, muistaa leveyden, kaksi saraketta leveällä näytöllä
10 asiakasta lisätty Supabaseen
---
KESKEN / TEKOLISTA ⏳
Pienet karttatyöt
[ ] IN-R-02 klikattavaksi kartalla
[ ] IN-R-01 tasot 1 ja 2 kartalle
[ ] Vasen seinä (IN-L) tarkistus
Tilausmoduuli — viimeistelyä
[ ] Seinänvieripelti: kulma ei toimi oikein (seinälle-viiva pysyy pystysuorana mutta muut viivat eivät seuraa sitä)
[ ] Asiakkaan muokkausnappi tilauslomakkeeseen — pieni Muokkaa-nappi asiakkaan vieressä laskutustietojen päivitykseen
[ ] Vakiomallit yrityksille — uusi chat
Isommat kokonaisuudet
[ ] Kartta + taulukko yhdistäminen Retoolissa
[ ] QR-koodit hyllyihin
[ ] Leikkausoptimointi (rulla → levy → siivu, parent_stock_item_id)
[ ] Laskutus ja maksuseuranta
[ ] Muut varastot inventointi (Ulkovarasto, Auto, Kontti, Ulkohylly)
[ ] Johtajan resurssioikeudet — vaatii maksullisen Retool-version
---
Ohjeet uuden chat-ketjun aloitukseen
"Jatketaan Kalajoen Peltityö ERP-projektia. Stack: Supabase + Retool + GitHub Pages. Warehouse ID: e56f3534-50f9-4081-8840-f81f03905113. Liitän projektidokumentit. Tänään tehdään: [mitä tehdään]."
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
