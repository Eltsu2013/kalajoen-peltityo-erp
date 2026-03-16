import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async () => {

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

 const { data, error } = await supabase
  .from("products")
  .select("id, material, thickness_mm, color, product_group, unit, manufacturer_country, default_vat_percent, is_active")
  .eq("is_active", true)
  .order("material")
  const formatted = data?.map(p => ({
  id: p.id,
  label: `${p.material} ${p.thickness_mm}mm ${p.color ?? ''}`.trim()
}));

  if (error) {
    return new Response(JSON.stringify(formatted), {
  headers: { "Content-Type": "application/json" },
});
  }

  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" },
  });
});
