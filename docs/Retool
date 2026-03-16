# Kalajoen Peltityö ERP — Retool

## Rakenne

Retoolissa on kaksi sovellusta:
1. **Desktop-sovellus** — varastonäkymä selaimessa
2. **Mobiilisovellus** — puhelinkäyttöön

---

## Desktop-sovellus

### Tabbed Container — 4 välilehteä

**Välilehti 1: Varasto**

Suodattimet:
- `materialFilter` — materiaali
- `thicknessFilter` — paksuus
- `colorFilter` — väri
- `button4` — Tyhjennä suodattimet

Päävarastolista:
- `table1` — Data source suodatettu filtereillä (ks. alla)

Lisää tuote -container:
- `typeSelect` — ROLL/SHEET/OFFCUT
- `productSelect` — tuote
- `warehouseSelect` — varasto
- `lengthInput`, `widthInput` — mitat mm
- `inventoryLocationSelect` — varastopaikka
- `noteInput` — huomio
- `quantityInput` — määrä
- `addStockButton` — Lisää

Muokkaa-container:
- `widthAdjustInput`, `lengthAdjustInput` — uudet mitat
- `select1` — varastopaikka
- `button3` — Muokkaa mittoja
- `button2` — Poista pelti

**Välilehti 2: Kartta**
- `iFrame1` — GitHub Pages URL

**Välilehti 3: Yhteenveto**
- `summaryTable` — ryhmitelty materiaali/väri/mitat
- `detailTable` — näyttää yksittäiset pellit kun summaryTable-rivi valittu

**Välilehti 4: Tuotteet**

Suodattimet:
- `productMaterialFilter` — materiaali (Values: `{{ item.material }}`, Label: `{{ item.material }}`)
- `productColorFilter` — väri (Values: `{{ item.color }}`, Label: `{{ item.color }}`)
- `productGroupFilter` — tuoteryhmä (Values: `{{ item.product_group }}`, Label: `{{ item.product_group }}`)
- `clearProductFilters` — Tyhjennä suodattimet (Reset kaikki kolme filteriä)

Tuotetaulukko:
- `productsTable` — Data source suodatettu filtereillä (ks. alla)
- Row action: "Muokkaa" → Control component `editProductContainer` Set showBody
- Näkyvät sarakkeet: material, color, thickness_mm, product_group, unit, manufacturer_country, default_vat_percent, is_active
- Piilotettu: id, created_at

Lisää tuote -container (container4):
- `newMaterial` — Text Input, Label: Materiaali
- `newColor` — Text Input, Label: Väri
- `newThickness` — Number Input, Label: Paksuus (mm)
- `newProductGroup` — Text Input, Label: Tuoteryhmä
- `newUnit` — Text Input, Label: Yksikkö
- `newManufacturerCountry` — Text Input, Label: Valmistusmaa
- `newVat` — Number Input, Label: ALV %, Default value: 25.5
- `addProductButton` — "Lisää tuote"

Muokkaa tuotetta -container (editProductContainer):
- `editMaterial` — Default value: `{{ productsTable.selectedRow.material }}`
- `editColor` — Default value: `{{ productsTable.selectedRow.color }}`
- `editThickness` — Default value: `{{ productsTable.selectedRow.thickness_mm }}`
- `editProductGroup` — Default value: `{{ productsTable.selectedRow.product_group }}`
- `editUnit` — Default value: `{{ productsTable.selectedRow.unit }}`
- `editManufacturerCountry` — Default value: `{{ productsTable.selectedRow.manufacturer_country }}`
- `editVat` — Default value: `{{ productsTable.selectedRow.default_vat_percent }}`
- `updateProductButton` — "Tallenna muutokset"
- `deactivateProductButton` — "Poista käytöstä" (punainen)

### table1 Data source (suodatus)
```javascript
{{
  getStockItems.data.filter(row => {
    const matOk = !materialFilter.value || row.material === materialFilter.value;
    const pakOk = !thicknessFilter.value || row.thickness_mm === thicknessFilter.value;
    const varOk = !colorFilter.value || row.color === colorFilter.value;
    return matOk && pakOk && varOk;
  })
}}
```

### productsTable Data source (suodatus)
```javascript
{{
  getProducts.data.filter(row => {
    const matOk = !productMaterialFilter.value || row.material === productMaterialFilter.value;
    const colOk = !productColorFilter.value || row.color === productColorFilter.value;
    const grpOk = !productGroupFilter.value || row.product_group === productGroupFilter.value;
    return matOk && colOk && grpOk;
  })
}}
```

---

## Desktop-kyselyt (Tuotteet-välilehti)

### getProducts
- Resource: ERP Functions
- Method: GET
- URL: get_products
- Run automatically: päällä

### createProduct
- Resource: ERP Functions
- Method: POST
- URL: create_product
- Body: material, color, thickness_mm, product_group, unit, manufacturer_country, default_vat_percent

### updateProduct
- Resource: ERP Functions
- Method: POST
- URL: update_product
- Body: id `{{ productsTable.selectedRow.id }}`, material `{{ editMaterial.value }}`, color `{{ editColor.value }}`, thickness_mm `{{ editThickness.value }}`, product_group `{{ editProductGroup.value }}`, unit `{{ editUnit.value }}`, manufacturer_country `{{ editManufacturerCountry.value }}`, default_vat_percent `{{ editVat.value }}`

### deactivateProduct
- Resource: ERP Functions
- Method: POST
- URL: deactivate_product
- Body: id `{{ productsTable.selectedRow.id }}`

---

## Mobiilisovellus — 4 välilehteä

### Selaa-välilehti
- `materialFilter2` — materiaali suodatin
- `mColorFilter` — värisuodatin (näyttää vain valitun materiaalin värit)
- Taulukko — suodatettu, Mitat-sarake: `currentSourceRow.remaining_length_mm + " × " + currentSourceRow.remaining_width_mm + " / " + currentSourceRow.thickness_mm + "mm"`

### Lisää-välilehti
- `mTypeSelect` — Value={{item}}, Label={{item==="ROLL"?"Rulla":item==="SHEET"?"Levy":"Siivu"}}
- `mProductSelect` — tuote
- `mWarehouseSelect` — varasto
- `mLengthInput`, `mWidthInput`, `mQuantityInput`, `mNoteInput`
- `mLocationSelect` — varastopaikka
- `mAddButton` — Event handler: Run script (validointi + mCreateStockItem.trigger() + getStockItems.trigger()) + Show notification

Query: `mCreateStockItem` (duplicate createInitialStockItems)

### Muokkaa-välilehti
- `mEditMaterialFilter` — materiaali suodatin
- `mEditColorFilter` — värisuodatin (suodattuu materiaalin mukaan)
- `mEditTable` — taulukko, valittu rivi käytetään muokkauksessa
- `mNewLengthInput`, `mNewWidthInput` — uudet mitat
- `mNewLocationSelect` — uusi varastopaikka
- `mEditButton` — muokkaa mittoja ja/tai varastopaikkaa
- `mDeleteButton` — poista pelti (punainen)

Query: `mAdjustStockItem` (duplicate adjustStockItem)
- stock_item_id: `{{ mEditTable.selectedRow.id }}`
- new_width: `{{ mNewWidthInput.value }}`
- new_length: `{{ mNewLengthInput.value }}`
- new_location_id: `{{ mNewLocationSelect.value || null }}`

Query: `mArchiveStockItem` (duplicate archiveStockItem)
- stock_item_id: `{{ mEditTable.selectedRow.id }}`

### Kartta-välilehti
- iFrame — GitHub Pages URL

---

## Tärkeät huomiot

- **Tallenna aina** ennen kuin testaat queryä Retoolissa!
- Mobiilisovellus toimii selaimessa puhelimella (ei erillistä appia)
- Johtajan tunnuksilla ei näy data ilmaisversiossa (resurssioikeusongelma)
- mTypeSelect: Value-kentässä pitää olla englanninkielinen arvo (ROLL/SHEET/OFFCUT), label suomeksi
- Retool versio 3.356.0 — Text Input -komponentissa ei ole Value-kenttää, käytä Default value
