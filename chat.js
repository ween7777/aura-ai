const SYSTEM_INSTRUCTION = `Ты — AURA, дружелюбный персональный ИИ-помощник пользователя. Отвечай на русском, если пользователь не просит другой язык. Будь полезной, ясной и честной. Не утверждай, что выполняешь действия вне чата, если у тебя нет соответствующего инструмента. Если не знаешь ответа, скажи об этом. Не проси пароли, API-ключи или другие секреты.`;

export async function onRequestPost({ request, env }) {
  if (!env.GEMINI_API_KEY) {
    return Response.json({ error: "На сервере не настроен GEMINI_API_KEY." }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Некорректный JSON-запрос." }, { status: 400 });
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return Response.json({ error: "Добавь сообщение и попробуй ещё раз." }, { status: 400 });
  }

  const messages = body.messages.slice(-12);
  const contents = [];
  for (const item of messages) {
    if (!item || !["user", "model"].includes(item.role) ||
        typeof item.text !== "string" || item.text.length > 4000) {
      return Response.json({ error: "Сообщение имеет неверный формат или слишком длинное." }, { status: 400 });
    }
    const text = item.text.trim();
    if (text) contents.push({ role: item.role, parts: [{ text }] });
  }

  if (!contents.length || contents[contents.length - 1].role !== "user") {
    return Response.json({ error: "Последнее сообщение должно быть от пользователя." }, { status: 400 });
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
      // Avoid exposing provider response details or secrets to the browser.
      const status = upstream.status === 429 ? 429 : 502;
      const message = upstream.status === 429
        ? "Достигнут временный лимит бесплатного тарифа. Подожди немного и попробуй снова."
        : "ИИ-провайдер временно не ответил. Проверь модель и API-ключ в настройках.";
      return Response.json({ error: message }, { status });
    }

    const reply = (result.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "")
      .join("")
      .trim();

    if (!reply) return Response.json({ error: "Модель не вернула текстовый ответ." }, { status: 502 });
    return Response.json({ reply });
  } catch {
    return Response.json({ error: "Не удалось связаться с ИИ-провайдером. Проверь интернет-соединение." }, { status: 502 });
  }
}