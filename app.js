const $ = s => document.querySelector(s);

const messages = $("#messages");
const input = $("#userInput");
const form = $("#chatForm");
const API_URL = "https://jarvis-api.dylanroulliaux.workers.dev";

let lastReply = "Je suis opérationnel, Monsieur. Comment puis-je vous assister ?";
let history = [];
let busy = false;

function addMessage(who, text) {
  const el = document.createElement("article");
  el.className = "message " + who;

  const tag = document.createElement("div");
  tag.className = "message-tag";
  tag.textContent = who === "jarvis" ? "JARVIS" : "MONSIEUR";

  const p = document.createElement("p");
  p.textContent = text;

  el.append(tag, p);
  messages.append(el);
  messages.scrollTop = messages.scrollHeight;

  if (who === "jarvis") lastReply = text;
}

async function askJarvis(text) {
  history.push({ role: "user", content: text });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ messages: history })
  });

  const data = await response.json();

  if (!response.ok) {
    history.pop();
    throw new Error(data.details || data.error || "Erreur de connexion");
  }

  const reply = data.reply || "Je n'ai pas reçu de réponse.";
  history.push({ role: "assistant", content: reply });

  return reply;
}

form.addEventListener("submit", async e => {
  e.preventDefault();

  const text = input.value.trim();
  if (!text || busy) return;

  addMessage("user", text);
  input.value = "";
  busy = true;

  if ($("#reactorLabel")) $("#reactorLabel").textContent = "ANALYSE";
  if ($("#subtitle")) $("#subtitle").textContent = "Connexion à mon intelligence artificielle...";

  try {
    const reply = await askJarvis(text);
    addMessage("jarvis", reply);

    if ($("#reactorLabel")) $("#reactorLabel").textContent = "OPÉRATIONNEL";
    if ($("#subtitle")) $("#subtitle").textContent = "Je suis à votre disposition, Monsieur.";
  } catch (error) {
    addMessage("jarvis", "Je rencontre un problème de connexion, Monsieur : " + error.message);

    if ($("#reactorLabel")) $("#reactorLabel").textContent = "ALERTE";
    if ($("#subtitle")) $("#subtitle").textContent = "Vérification de la connexion nécessaire.";
  } finally {
    busy = false;
    input.focus();
  }
});

$("#voiceButton").addEventListener("click", () => {
  if (!("speechSynthesis" in window)) {
    alert("La synthèse vocale n'est pas disponible.");
    return;
  }

  speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(lastReply);
  utterance.lang = "fr-FR";
  utterance.rate = 0.92;
  utterance.pitch = 0.85;

  speechSynthesis.speak(utterance);
});

$("#clearButton").addEventListener("click", () => {
  history = [];
  messages.replaceChildren();
  addMessage("jarvis", "Conversation réinitialisée, Monsieur.");

  if ($("#reactorLabel")) $("#reactorLabel").textContent = "OPÉRATIONNEL";
  if ($("#subtitle")) $("#subtitle").textContent = "Tous les systèmes sont prêts.";
});

$("#modelSelect").addEventListener("change", e => {
  const labels = {
    auto: "Sélection automatique",
    fast: "Mode rapide",
    advanced: "Mode avancé",
    local: "Mode local / démonstration"
  };

  $("#subtitle").textContent =
    labels[e.target.value] + " sélectionné. Le modèle Mammouth recommandé reste utilisé.";
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
