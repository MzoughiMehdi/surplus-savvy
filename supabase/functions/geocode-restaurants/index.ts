import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: restaurants, error } = await supabase
      .from("restaurants")
      .select("id, address, postal_code, city")
      .or("latitude.is.null,longitude.is.null");

    if (error) throw error;
    if (!restaurants || restaurants.length === 0) {
      return new Response(JSON.stringify({ message: "No restaurants to geocode" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    console.log(`Geocoding ${restaurants.length} restaurants...`);
    const results: { id: string; status: string }[] = [];

    for (const r of restaurants) {
      const fullAddress = [r.address, [r.postal_code, r.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");
      if (!fullAddress) { results.push({ id: r.id, status: "skipped_no_address" }); continue; }

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json&limit=1`,
          { headers: { "Accept-Language": "fr", "User-Agent": "LovableApp/1.0" } }
        );
        const data = await res.json();

        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          await supabase.from("restaurants").update({ latitude: lat, longitude: lon }).eq("id", r.id);
          console.log(`✅ ${r.id}: ${lat}, ${lon}`);
          results.push({ id: r.id, status: "ok" });
        } else {
          // Retry with ", France"
          const res2 = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress + ", France")}&format=json&limit=1`,
            { headers: { "Accept-Language": "fr", "User-Agent": "LovableApp/1.0" } }
          );
          const data2 = await res2.json();
          if (data2.length > 0) {
            const lat = parseFloat(data2[0].lat);
            const lon = parseFloat(data2[0].lon);
            await supabase.from("restaurants").update({ latitude: lat, longitude: lon }).eq("id", r.id);
            console.log(`✅ ${r.id} (retry): ${lat}, ${lon}`);
            results.push({ id: r.id, status: "ok_retry" });
          } else {
            console.warn(`❌ ${r.id}: not found for "${fullAddress}"`);
            results.push({ id: r.id, status: "not_found" });
          }
        }
        // Respect Nominatim rate limit
        await new Promise((resolve) => setTimeout(resolve, 1100));
      } catch (e) {
        console.error(`Error geocoding ${r.id}:`, e);
        results.push({ id: r.id, status: "error" });
      }
    }

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Geocode function error:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
