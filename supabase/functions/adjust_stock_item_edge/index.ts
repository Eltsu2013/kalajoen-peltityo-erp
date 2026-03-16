import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {

  const body = await req.json();
  const { stock_item_id, new_width, new_length, new_location_id } = body;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { error } = await supabase.rpc(
    "adjust_stock_item",
    {
      p_stock_item_id: stock_item_id,
      p_new_width: new_width,
      p_new_length: new_length
    }
  );

  if (error) {
    return new Response(JSON.stringify(error), { status: 400 });
  }

  // Jos uusi varastopaikka annettu, päivitetään se
  if (new_location_id) {
    const { error: locError } = await supabase
      .from("stock_items")
      .update({ location_id: new_location_id })
      .eq("id", stock_item_id);

    if (locError) {
      return new Response(JSON.stringify(locError), { status: 400 });
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { headers: { "Content-Type": "application/json" } }
  );
});
