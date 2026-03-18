import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {

  const url = new URL(req.url)
  const statusFilter = url.searchParams.get("status")

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  let query = supabase
    .from("stock_items")
    .select(`
  *,
  locations (
    code,
    name
  ),
  products (
    material,
    thickness_mm,
    color,
    product_group
  )
`)
    .order("created_at", { ascending: false })

  if (statusFilter) {
    query = query.eq("status", statusFilter)
  }

  const { data, error } = await query

  if (error) {
    return new Response(JSON.stringify(error), { status: 400 })
  }

  const dataFlat = data?.map(row => ({
    ...row,
    material: row.products?.material || null,
    thickness_mm: row.products?.thickness_mm || null,
    color: row.products?.color || null,
    product_group: row.products?.product_group || null,
    type_fi:
      row.type === "ROLL" ? "Rulla" :
      row.type === "SHEET" ? "Levy" :
      row.type === "OFFCUT" ? "Siivu" :
      row.type === "ITEM" ? "Kpl" :
      row.type === "BULK" ? "Metri" :
      row.type
  }))

  return new Response(JSON.stringify(dataFlat), {
    headers: { "Content-Type": "application/json" },
  })
})
