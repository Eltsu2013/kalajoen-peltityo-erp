import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const body = await req.json();
const { data, error } = await supabase
    .from("products")
    .insert({
      material: body.material,
      color: body.color,
      thickness_mm: body.thickness_mm,
      product_group: body.product_group,
      unit: body.unit,
      manufacturer_country: body.manufacturer_country,
      default_vat_percent: body.default_vat_percent,
      product_code: body.product_code,
      is_active: true
    });
  

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" },
  });
});
