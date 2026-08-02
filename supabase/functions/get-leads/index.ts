// Serves advisory_inquiries leads to Studio using the service role key server-side.
// Requires the caller to present the real Studio passcode as a ?passcode= query
// param — this replaces the old approach of Studio querying Supabase directly
// with the anon key, which any anonymous visitor could also use to read every lead.
//
// The passcode is intentionally NOT read from a request header: any custom header
// (Authorization, X-Studio-Passcode, etc.) forces the browser to send a CORS
// preflight (OPTIONS) request first, and Supabase's platform gateway appears to
// intercept that preflight regardless of the function's JWT-verification setting,
// so it never reaches this code. A plain GET with the passcode in the URL is a
// "simple" cross-origin request — no preflight, nothing for the platform to
// intercept before this code runs.
//
// Set the STUDIO_PASSCODE secret before deploying:
//   supabase secrets set STUDIO_PASSCODE=<a long, unique passphrase>
// Do not reuse a word like "alchemy" — this is the only thing standing between
// the public internet and your leads' names/emails/messages, so make it long
// and unique to this dashboard.

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  const provided = new URL(req.url).searchParams.get("passcode") || "";
  const expected = Deno.env.get("STUDIO_PASSCODE") || "";

  if (!expected || !provided || !safeEqual(provided, expected)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/advisory_inquiries?select=*&order=created_at.desc`,
      { headers: { apikey: serviceKey!, Authorization: `Bearer ${serviceKey}` } },
    );
    if (!res.ok) {
      return new Response(JSON.stringify({ error: "Upstream query failed" }), {
        status: 502,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    const leads = await res.json();
    return new Response(JSON.stringify(leads), {
      status: 200,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
