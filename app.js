const chat = document.querySelector("#chat");
const form = document.querySelector("#composer");
const input = document.querySelector("#prompt");
const mic = document.querySelector("#mic");
const voiceState = document.querySelector("#voiceState");
const speakToggle = document.querySelector("#speakToggle");
let speakEnabled = true;
let history = [];

function addMessage(text, who) {
  const article = document.createElement("article");
  article.className = `message ${who}`;
  const avatar = document.createElement("span");
  avatar.className = "avatar";
  avatar.textContent = who === "assistant" ? "✦" : "Я";
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  const label = document.createElement("b");
  label.textContent = who === "assistant" ? "AURA" : "ТЫ";
  const p = document.createElement("p");
  p.textContent = text;
  bubble.append(label, p);
  article.append(avatar, bubble);
  chat.append(article);
  chat.scrollTop = chat.scrollHeight;
}

function setBusy(busy) {
  const send = form.querySelector(".send");
  send.disabled = busy;
  input.disabled = busy;
  send.textContent = busy ? "…" : "➤";
}

async function askAura(userText) {
  history.push({ role: "user", text: userText });
  // Keep a short rolling context so requests stay small.
  history = history.slice(-12);
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages: history })
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data.error || `Ошибка сервера (${response.status})`;
    throw new Error(message);
  }
  if (!data.reply) throw new Error("ИИ вернул пустой ответ. Попробуй ещё раз.");
  history.push({ role: "model", text: data.reply });
  history = history.slice(-12);
  return data.reply;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text || input.disabled) return;
  addMessage(text, "user");
  input.value = "";
  setBusy(true);
  try {
    const reply = await askAura(text);
    addMessage(reply, "assistant");
    if (speakEnabled && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(reply);
      utterance.lang = "ru-RU";
      window.speechSynthesis.speak(utterance);
    }
  } catch (error) {
    addMessage(`Не удалось получить ответ: ${error.message}. Проверь подключение и настройки сервера.`, "assistant");
    // Don't retain a user turn that failed at the API.
    history.pop();
  } finally {
    setBusy(false);
    input.focus();
  }
});

speakToggle.addEventListener("click", () => {
  speakEnabled = !speakEnabled;
  speakToggle.textContent = `Озвучивать ответы: ${speakEnabled ? "ВКЛ" : "ВЫКЛ"}`;
  if (!speakEnabled && "speechSynthesis" in window) window.speechSynthesis.cancel();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
if (SpeechRecognition) {
  const recognition = new SpeechRecognition();
  recognition.lang = "ru-RU";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onstart = () => voiceState.textContent = "Слушаю тебя…";
  recognition.onend = () => voiceState.textContent = "Голосовой ввод готов.";
  recognition.onerror = () => voiceState.textContent = "Не удалось распознать речь. Проверь разрешение микрофона.";
  recognition.onresult = (event) => {
    input.value = event.results[0][0].transcript;
    form.requestSubmit();
  };
  mic.addEventListener("click", () => {
    try { recognition.start(); } catch (_) {}
  });
} else {
  mic.disabled = true;
  voiceState.textContent = "Голосовой ввод не поддерживается этим браузером. Попробуй Chrome или Edge.";
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./sw.js").catch(() => {}));
}