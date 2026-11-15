
const SYSTEM_INSTRUCTION = `Ты — AURA, дружелюбный персональный ИИ-помощник пользователя. Отвечай на русском, если пользователь не просит другой язык. Будь полезной, ясной и честной. Не утверждай, что выполняешь действия вне чата, если у тебя нет соответствующего инструмента. Если не знаешь ответа, скажи об этом. Не проси пароли, API-ключи или другие секреты.`;

const ALLOWED_ORIGINS = [
  "https://aura-ai-1tm.pages.dev",
  "https://localhost",
  "capacitor://localhost"
];

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "";
  const headers = new Headers({
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });

  if (ALLOWED_ORIGINS.includes(origin)) {
    headers.set("Access-Control-Allow-Origin", origin);
  }

  return headers;
}

function jsonResponse(data, status, request) {
  const headers = corsHeaders(request);
  headers.set("Content-Type", "application/json; charset=utf-8");
  return new Response(JSON.stringify(data), { status, headers });
}

export async function onRequestOptions({ request }) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(request)
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return jsonResponse({ error: "На сервере не настроен GEMINI_API_KEY." }, 503, request);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: "Некорректный JSON-запрос." }, 400, request);
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return jsonResponse({ error: "Добавь сообщение и попробуй ещё раз." }, 400, request);
  }

  const messages = body.messages.slice(-12);
  const contents = [];

  for (const item of messages) {
    if (!item || !["user", "model"].includes(item.role) ||
        typeof item.text !== "string" || item.text.length > 4000) {
      return jsonResponse({ error: "Сообщение имеет неверный формат или слишком длинное." }, 400, request);
    }

    const text = item.text.trim();
    if (text) contents.push({ role: item.role, parts: [{ text }] });
  }

  if (!contents.length || contents[contents.length - 1].role !== "user") {
    return jsonResponse({ error: "Последнее сообщение должно быть от пользователя." }, 400, request);
  }

  const model = env.GEMINI_MODEL || "gemini-3.1-flash-lite";
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  try {
    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": env.GEMINI_API_KEY
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents,
        generationConfig: { temperature: 0.7, maxOutputTokens: 900 }
      })
    });

    const result = await upstream.json().catch(() => ({}));

    if (!upstream.ok) {
      const status = upstream.status === 429 ? 429 : 502;
      const message = upstream.status === 429
        ? "Достигнут временный лимит бесплатного тарифа. Подожди немного и попробуй снова."
        : "ИИ-провайдер временно не ответил. Проверь модель и API-ключ в настройках.";

      return jsonResponse({ error: message }, status, request);
    }

    const reply = (result.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) {
      return jsonResponse({ error: "Модель не вернула текстовый ответ." }, 502, request);
    }

    return jsonResponse({ reply }, 200, request);

  } catch {
    return jsonResponse({
      error: "Не удалось связаться с ИИ-провайдером. Проверь интернет-соединение."
    }, 502, request);
  }
}
