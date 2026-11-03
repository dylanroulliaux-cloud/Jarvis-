
const SYSTEM_PROMPT = `Tu es JARVIS, un assistant personnel intelligent.
Tu t'exprimes toujours en français.
Tu appelles ton utilisateur "Monsieur".
Tu es calme, élégant, professionnel, précis et légèrement spirituel.
Tu aides concrètement et tu ne prétends jamais avoir effectué une action que tu n'as pas réalisée.
Tu utilises le contexte des conversations précédentes pour assurer la continuité des échanges.`;

const ALLOWED_ORIGIN = "https://dylanroulliaux-cloud.github.io";
const CONVERSATION_ID = "default";
const MAX_HISTORY = 20;

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin");

    const headers = {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers });
    }

    if (origin !== ALLOWED_ORIGIN) {
      return new Response("Origine non autorisée", {
        status: 403,
        headers
      });
    }

    if (request.method !== "POST") {
      return Response.json(
        { error: "Méthode non autorisée" },
        { status: 405, headers }
      );
    }

    try {
      if (!env.MAMMOUTH_API_KEY) {
        throw new Error("Clé API Mammouth absente");
      }

      if (!env.JARVIS_DB) {
        throw new Error("Base D1 JARVIS_DB non connectée");
      }

      const body = await request.json();

      if (!Array.isArray(body.messages)) {
        return Response.json(
          { error: "Messages manquants" },
          { status: 400, headers }
        );
      }

      const lastMessage = body.messages[body.messages.length - 1];

      if (
        !lastMessage ||
        lastMessage.role !== "user" ||
        typeof lastMessage.content !== "string" ||
        !lastMessage.content.trim()
      ) {
        return Response.json(
          { error: "Message utilisateur manquant" },
          { status: 400, headers }
        );
      }

      // Création automatique de la table si elle n'existe pas.
      await env.JARVIS_DB.prepare(`
        CREATE TABLE IF NOT EXISTS messages (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          conversation_id TEXT NOT NULL,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `).run();

      // Récupération des anciens messages.
      const previous = await env.JARVIS_DB.prepare(`
        SELECT role, content
        FROM messages
        WHERE conversation_id = ?
        ORDER BY id DESC
        LIMIT 19
      `).bind(CONVERSATION_ID).all();

      const history = (previous.results || []).reverse();

      // Enregistrement du nouveau message utilisateur.
      const userMessage = lastMessage.content.slice(0, 8000);

      await env.JARVIS_DB.prepare(`
        INSERT INTO messages (conversation_id, role, content)
        VALUES (?, 'user', ?)
      `).bind(CONVERSATION_ID, userMessage).run();

      const messages = [
        ...history,
        { role: "user", content: userMessage }
      ];

      // Envoi à Mammouth AI.
      const response = await fetch(
        "https://api.mammouth.ai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.MAMMOUTH_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mammouth-recommended",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...messages
            ],
            temperature: 0.7,
            max_tokens: 1200
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return Response.json(
          {
            error: "Erreur du service IA",
            details: data.error?.message || "Erreur API"
          },
          { status: response.status, headers }
        );
      }

      const reply =
        data.choices?.[0]?.message?.content ||
        "Je n'ai pas reçu de réponse.";

      // Enregistrement de la réponse de JARVIS.
      await env.JARVIS_DB.prepare(`
        INSERT INTO messages (conversation_id, role, content)
        VALUES (?, 'assistant', ?)
      `).bind(CONVERSATION_ID, reply).run();

      return Response.json({ reply }, { headers });

    } catch (error) {
      return Response.json(
        { error: error.message || "Erreur interne" },
        { status: 500, headers }
      );
    }
  }
};
