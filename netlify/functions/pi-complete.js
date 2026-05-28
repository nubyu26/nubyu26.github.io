export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "PI_API_KEY not configured" }) };
  }

  let paymentId, txid;
  try {
    ({ paymentId, txid } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!paymentId || !txid) {
    return { statusCode: 400, body: JSON.stringify({ error: "paymentId and txid are required" }) };
  }

  const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
    method: "POST",
    headers: {
      Authorization: `Key ${apiKey.trim()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ txid }),
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      statusCode: res.status,
      body: JSON.stringify({ error: data.error_message || data.message || "Complete failed" }),
    };
  }

  return { statusCode: 200, body: JSON.stringify({ message: "Completed", payment: data }) };
}
