export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  const apiKey = process.env.PI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "PI_API_KEY not configured" }) };
  }

  let paymentId;
  try {
    ({ paymentId } = JSON.parse(event.body));
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid request body" }) };
  }

  if (!paymentId) {
    return { statusCode: 400, body: JSON.stringify({ error: "paymentId is required" }) };
  }

  const res = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
    method: "POST",
    headers: { Authorization: `Key ${apiKey.trim()}` },
  });

  const data = await res.json();

  if (!res.ok) {
    return {
      statusCode: res.status,
      body: JSON.stringify({ error: data.error_message || data.message || "Approve failed" }),
    };
  }

  return { statusCode: 200, body: JSON.stringify({ message: "Approved", payment: data }) };
}
