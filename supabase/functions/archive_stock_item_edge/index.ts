import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {

  const body = await req.json()
  const { stock_item_id } = body

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { error } = await supabase.rpc(
    "archive_stock_item",
    { p_stock_item_id: stock_item_id }
  )

  if (error) {
    return new Response(JSON.stringify(error), { status: 400 })
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  )
})
