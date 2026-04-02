Kalajoen Peltityö ERP — Tietokanta
Stack
Backend: Supabase (PostgreSQL + RLS + Edge Functions)
Frontend: Retool (desktop + mobiili)
Kartta + tilausmoduuli: GitHub Pages (SVG/HTML)
Repo: https://github.com/eltsu2013/kalajoen-peltityo-erp
GitHub Pages: https://eltsu2013.github.io/kalajoen-peltityo-erp/
Supabase
Projekti: hjyeugeqmyavxisndlwp
Warehouse ID (Verstas): e56f3534-50f9-4081-8840-f81f03905113
Anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqeWV1Z2VxbXlhdnhpc25kbHdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExNDM2NzgsImV4cCI6MjA4NjcxOTY3OH0.ZMuN6lruMUHkASUtwnoShiqHLAg6YBEGsC7zMlymLs4
Käyttäjät
Admin: kalajoen.peltityo@gmail.com (Kalajoen Peltityö Törnvall)
Viewer: kalajoen.peltityo@kotinet.com (johtaja)
Huom: Ilmaisversiossa ei pysty rajoittamaan resurssioikeuksia per käyttäjä — johtajalla ei näy data. Korjataan maksulliseen versioon siirtyessä.
Taulut
products
Materiaalit ja pinnoitteet.
Kentät: material, thickness_mm, color, product_group, default_vat_percent, product_code, unit, manufacturer_country, is_active.
Unit-arvot:
m² = peltitavara (rulla, levy, siivu) — näkyy Mallistossa
m = metritavara (kouru ym.) — näkyy kappaletavarassa
kpl = kappaletavara — näkyy kappaletavarassa
stock_items
Yksittäiset peltierät. Status: ACTIVE / ARCHIVED.
Kentät: product_id, warehouse_id, type (ROLL/SHEET/OFFCUT/ITEM/BULK), width_mm, remaining_width_mm, length_mm, remaining_length_mm, location_id, note, quantity, batch_id, parent_stock_item_id.
locations
Varastopaikat.
Kentät: warehouse_id, code, name, location_type (SHELF/floor/grid/linear/room/movable).
stock_movements
Liikkeet ja muutokset.
Kentät: stock_item_id, movement_type (IN/CUT/TRANSFER/ADJUST/ARCHIVE), quantity_change, jne.
orders
Tilaukset. customer_id on nullable.
Kentät: customer_id, order_date, delivery_date, status, notes, kohde.
Status-arvot (englanti → UI suomeksi):
DRAFT → Luonnos
IN_PROGRESS → Kesken
QUOTED → Tarjottu
ORDERED → Tilattu
IN_PRODUCTION → Työn alla
COMPLETED → Valmis
INVOICED → Laskutettu
RLS-politiikat:
SELECT, INSERT, UPDATE: anon sallittu
order_items
Tilausrivit.
Kentät: order_id, group_name, group_order, item_order, nimike, profile_type, profile_data (jsonb), aihio_width_mm, quantity, material, color, thickness_mm, product_group.
profile_data (jsonb) — varmuuskopio, sisältää piirturin vals/opts-arvot
material, color, thickness_mm, product_group — omat sarakkeet leikkausoptimointia varten
RLS-politiikat:
SELECT: "Allow select order_items" — anon saa lukea
INSERT: "Allow insert order_items" — anon saa lisätä
UPDATE: "Allow anon update order_items" — anon saa päivittää
DELETE: "Allow anon delete order_items" — anon saa poistaa
order_item_rows
Tilausrivin pituusrivit. Yksi rivi per pituus/kappalemäärä-kombinaatio.
Liittyy order_items:iin — CASCADE poistaa rivit kun order_item poistetaan.
Kentät: order_item_id, row_order, mitta_mm, paat_mm, kok_mm, kpl, huomio.
Käyttötarkoitus: leikkausoptimointi, tulostus, työkortti.
RLS-politiikat: SELECT, INSERT, UPDATE, DELETE — anon sallittu.
order_item_angles
Kanttikoneen taivutuskulmat per tilausrivi, järjestyksessä.
Liittyy order_items:iin — CASCADE poistaa rivit kun order_item poistetaan.
Kentät: order_item_id, position_index, angle_value.
Käyttötarkoitus: kanttikoneen ohjaus (tuleva ominaisuus), työkortti.
RLS-politiikat: SELECT, INSERT, UPDATE, DELETE — anon sallittu.
order_item_widths
Aihioleveys per tilausrivi. Toistaiseksi yksi rivi per item, tulevaisuudessa useampi leveys per profiili.
Liittyy order_items:iin — CASCADE poistaa rivit kun order_item poistetaan.
Kentät: order_item_id, position_index, width_mm.
Käyttötarkoitus: leikkausoptimointi.
RLS-politiikat: SELECT, INSERT, UPDATE, DELETE — anon sallittu.
order_item_extra_lengths
Limitysvara saumoille. Tulevaisuuden ominaisuus — käytetään kun tilaus tulee metrimääränä (esim. 60m) ja ohjelma laskee tarvittavan kokonaismateriaalin limitysvarat huomioiden.
Liittyy order_items:iin — CASCADE poistaa rivit kun order_item poistetaan.
Kentät: order_item_id, extra_length_mm.
customers
Asiakkaat. Täytetään Access-siirrolla.
Kentät:
id, created_at, is_active
name — asiakasnimi
contact_person — yhteyshenkilö (lisätty 27.3.2026)
customer_number — asiakasnumero (lisätty 27.3.2026)
business_id — Y-tunnus
billing_address — laskutusosoite
billing_postal_code — postinumero
billing_city — kaupunki
billing_country — maa
phone — puhelin
email — sähköposti
email2 — sähköposti 2 (lisätty 27.3.2026)
ovt_number — OVT-numero verkkolaskutusta varten (lisätty 27.3.2026)
notes — muistiinpanot (huom: vanhoilla asiakkailla notes-kentässä voi olla yhteyshenkilötietoja ennen contact_person-sarakkeen lisäystä — korjataan Access-siirrossa)
RLS-politiikat:
SELECT: anon saa lukea (oletuksena)
INSERT: "Allow anon insert customers" — anon saa lisätä
UPDATE: "Allow anon update customers" — anon saa päivittää
Muut taulut
suppliers, batches, warehouses, user_warehouses, optimization_batches.
Edge Functions
create_initial_stock_items
Lisää pellin varastoon. Parametrit: product_id, batch_id, warehouse_id, type, width_mm, length_mm, location_id, note, quantity.
adjust_stock_item_edge
Päivittää mitat ja varastopaikan. Parametrit: stock_item_id, new_width, new_length, new_location_id.
get_stock_items
Hakee kaikki ACTIVE stock_items. Palauttaa type_fi-kentällä.
get_products
Hakee kaikki aktiiviset tuotteet.
create_product / update_product / deactivate_product
Tuotteiden hallinta. Tukee product_code-kenttää.
GitHub Pages -tiedostot
Tiedosto	Kuvaus
maps/verstaspohja_mitoitettu.html	Interaktiivinen varastokartta
orders/peltipiirturi.html	Peltiprofiilien piirtotyökalu (Mallisto)
orders/vakiomallit.html	Parmaco-vakiomallit (yhtenäinen sivu)
orders/tilaus.html	Tilauslomake
orders/asiakkaat.html	Asiakashallinta ja -arkisto
Hyödyllisiä SQL-komentoja
```sql
-- Kaikki varastopaikat
SELECT code, name, location_type FROM locations
WHERE warehouse_id = 'e56f3534-50f9-4081-8840-f81f03905113'
ORDER BY code;

-- Kaikki tuotteet
SELECT * FROM products ORDER BY material, color;

-- Aktiiviset varastoerät
SELECT si.*, p.material, p.color, p.thickness_mm, l.code as location
FROM stock_items si
JOIN products p ON si.product_id = p.id
LEFT JOIN locations l ON si.location_id = l.id
WHERE si.status = 'ACTIVE'
AND si.warehouse_id = 'e56f3534-50f9-4081-8840-f81f03905113';

-- Tilaukset ja rivit materiaaleittain (leikkausoptimointia varten)
SELECT oi.nimike, oi.material, oi.color, oi.thickness_mm, oi.aihio_width_mm,
  r.mitta_mm, r.paat_mm, r.kok_mm, r.kpl
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.id
JOIN order_items oi ON oi.order_id = o.id
JOIN order_item_rows r ON r.order_item_id = oi.id
WHERE o.status IN ('IN_PROGRESS','ORDERED','IN_PRODUCTION')
ORDER BY oi.material, oi.color, oi.thickness_mm, oi.aihio_width_mm;

-- Asiakkaiden sarakkeet
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'customers' ORDER BY ordinal_position;
```
