# Kalajoen Peltityö ERP — Tietokanta

## Stack
- **Backend:** Supabase (PostgreSQL + RLS + Edge Functions)
- **Frontend:** Retool (desktop + mobiili)
- **Kartta:** GitHub Pages (SVG/HTML)
- **Repo:** https://github.com/eltsu2013/kalajoen-peltityo-erp
- **Kartta URL:** https://eltsu2013.github.io/kalajoen-peltityo-erp/verstaspohja_mitoitettu.html

## Supabase
- **Projekti:** hjyeugeqmyavxisndlwp
- **Warehouse ID (Kalajoki/KAL):** `e56f3534-50f9-4081-8840-f81f03905113`

## Käyttäjät
- **Admin:** kalajoen.peltityo@gmail.com (Kalajoen Peltityö Törnvall)
- **Viewer:** kalajoen.peltityo@kotinet.com (johtaja)
- **Huom:** Ilmaisversiossa ei pysty rajoittamaan resurssioikeuksia per käyttäjä → johtajalla ei näy data. Korjataan maksulliseen versioon siirtyessä.

## Taulut

### products
Materiaalit ja pinnoitteet. Kentät: material, thickness_mm, color, product_group, default_vat_percent.

### stock_items
Yksittäiset peltierät. Status: ACTIVE / ARCHIVED. Kentät: product_id, warehouse_id, type (ROLL/SHEET/OFFCUT), width_mm, remaining_width_mm, length_mm, remaining_length_mm, location_id, note, quantity, batch_id, parent_stock_item_id.

### locations
Varastopaikat. Kentät: warehouse_id, code, name, location_type (SHELF/floor/grid/linear/room/movable).

### stock_movements
Liikkeet ja muutokset. Kentät: stock_item_id, movement_type, quantity_change, jne.

### Muut taulut
orders, order_items, customers, suppliers, batches, warehouses, user_warehouses, optimization_batches

## Edge Functions

### create_initial_stock_item
Lisää pellin varastoon. Parametrit: product_id, batch_id, warehouse_id, type, width_mm, length_mm, location_id, note, quantity. Loop quantity-parametrin mukaan.

### adjust_stock_item_edge
Päivittää mitat ja varastopaikan. Parametrit: stock_item_id, new_width, new_length, new_location_id.

### get_stock_items
Hakee kaikki ACTIVE stock_items. Palauttaa type_fi-kentällä (ROLL→Rulla, SHEET→Levy, OFFCUT→Siivu).

## Hyödyllisiä SQL-komentoja

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
```
