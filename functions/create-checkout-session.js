const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS });
}

export async function onRequestPost(context) {
  const { STRIPE_SECRET_KEY } = context.env;

  if (!STRIPE_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'Stripe key not configured' }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  const origin = context.request.headers.get('Origin') || 'https://stellapolarispublishing.com';
  const returnUrl = `${origin}/advisory-portal-payment.html?success=true`;

  // Build body manually so bracket keys are NOT percent-encoded
  const params = [
    ['ui_mode', 'embedded'],
    ['line_items[0][price_data][currency]', 'usd'],
    ['line_items[0][price_data][product]', 'prod_Ua13BdcOHo17Ay'],
    ['line_items[0][price_data][unit_amount]', '49700'],
    ['line_items[0][quantity]', '1'],
    ['mode', 'payment'],
    ['return_url', returnUrl],
  ];
  const body = params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

  const stripeRes = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const session = await stripeRes.json();

  if (!stripeRes.ok) {
    return new Response(JSON.stringify({ error: session.error?.message || 'Stripe error' }), {
      status: 400,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}
