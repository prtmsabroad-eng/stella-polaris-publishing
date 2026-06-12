import webpush from "npm:web-push";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: cors });
  }

  try {
    const { name, email, q1, q2, q3 } = await req.json();

    const html = `
      <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;background:#faf9f7;border-radius:12px;">
        <h2 style="color:#4A0D5C;font-size:1.3rem;margin-bottom:4px">✦ New Advisory Inquiry</h2>
        <p style="color:#888;font-size:0.85rem;margin-bottom:20px">Someone just submitted your intake form on stellapolarispublishing.com</p>

        <div style="background:white;border-radius:8px;padding:16px;margin-bottom:12px;border-left:4px solid #C9A84C;">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#C9A84C;margin-bottom:6px">Contact</div>
          <div style="font-size:1rem;font-weight:600;color:#1A0A2E">${name}</div>
          <div style="font-size:0.9rem;color:#555;margin-top:4px">${email}</div>
        </div>

        ${q1 ? `<div style="background:white;border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7B2D9E;margin-bottom:6px">What brought them here</div>
          <div style="font-size:0.88rem;color:#333;line-height:1.5">${q1}</div>
        </div>` : ""}

        ${q2 ? `<div style="background:white;border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7B2D9E;margin-bottom:6px">Birth time available</div>
          <div style="font-size:0.88rem;color:#333;line-height:1.5">${q2}</div>
        </div>` : ""}

        ${q3 ? `<div style="background:white;border-radius:8px;padding:16px;margin-bottom:12px;">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#7B2D9E;margin-bottom:6px">Their message</div>
          <div style="font-size:0.88rem;color:#333;line-height:1.5">${q3}</div>
        </div>` : ""}

        <a href="mailto:${email}?subject=Re%3A%20Your%20Stella%20Polaris%20Advisory%20Inquiry"
           style="display:inline-block;margin-top:8px;background:#4A0D5C;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-size:0.88rem;font-weight:600;letter-spacing:1px">
          Reply to ${name} →
        </a>

        <p style="font-size:0.72rem;color:#bbb;margin-top:24px">Stella Polaris Publishing — Advisory Intake System</p>
      </div>
    `;

    // Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Stella Polaris <onboarding@resend.dev>",
          to: ["poshmamamindset@gmail.com"],
          subject: `✦ New Advisory Inquiry — ${name}`,
          html,
        }),
      });
      if (!res.ok) console.error("Resend error:", await res.text());
    }

    // Send web push notification
    const vapidPublic = Deno.env.get("VAPID_PUBLIC_KEY");
    const vapidPrivate = Deno.env.get("VAPID_PRIVATE_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (vapidPublic && vapidPrivate && supabaseUrl && serviceKey) {
      webpush.setVapidDetails("mailto:poshmamamindset@gmail.com", vapidPublic, vapidPrivate);

      const subsRes = await fetch(`${supabaseUrl}/rest/v1/push_subscriptions?select=subscription`, {
        headers: {
          "apikey": serviceKey,
          "Authorization": `Bearer ${serviceKey}`,
        },
      });

      if (subsRes.ok) {
        const subs = await subsRes.json();
        const payload = JSON.stringify({
          title: `✦ New Lead — ${name}`,
          body: `${email} just submitted your advisory form`,
          url: "/studio.html",
        });

        for (const row of subs) {
          try {
            await webpush.sendNotification(row.subscription, payload);
          } catch (e) {
            console.error("Push failed:", e.message);
          }
        }
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 200,
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ ok: false }), {
      headers: { ...cors, "Content-Type": "application/json" }, status: 200,
    });
  }
});
