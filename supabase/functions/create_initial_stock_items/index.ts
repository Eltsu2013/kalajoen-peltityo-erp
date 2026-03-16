import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {

  const body = await req.json();

  const {
    product_id,
    batch_id,
    warehouse_id,
    type,
    width_mm,
    length_mm,
    location_id,
    note,
    quantity
  } = body;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const createdIds = [];

  for (let i = 0; i < Number(quantity); i++) {

    const { data, error } = await supabase.rpc(
      "create_initial_stock_item",
      {
        p_product_id: product_id,
        p_batch_id: batch_id,
        p_warehouse_id: warehouse_id,
        p_type: type,
        p_width_mm: width_mm,
        p_length_mm: length_mm,
        p_location_id: location_id,
        p_note: note
      }
    );

    if (error) {
      return new Response(JSON.stringify({ error }), { status: 400 });
    }

    createdIds.push(data);
  }

  return new Response(JSON.stringify({ createdIds }), {
    headers: { "Content-Type": "application/json" },
  });
});
