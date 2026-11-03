
const SYSTEM_PROMPT = `Tu es JARVIS, un assistant personnel intelligent.
Tu t'exprimes toujours en français.
Tu appelles ton utilisateur "Monsieur".
Tu es calme, élégant, professionnel, précis et légèrement spirituel.
Tu aides concrètement et tu ne prétends jamais avoir effectué une action que tu n'as pas réalisée.`;

const ALLOWED_ORIGIN = "https://dylanroulliaux-cloud.github.io";

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
      return new Response("Origine non autorisée", { status: 403 });
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

      const body = await request.json();

      if (!Array.isArray(body.messages)) {
        return Response.json(
          { error: "Messages manquants" },
          { status: 400, headers }
        );
      }

      const messages = body.messages
        .filter(m =>
          ["user", "assistant"].includes(m.role) &&
          typeof m.content === "string"
        )
        .slice(-20)
        .map(m => ({
          role: m.role,
          content: m.content.slice(0, 8000)
        }));

      if (!messages.length || messages[messages.length - 1].role !== "user") {
        return Response.json(
          { error: "Message utilisateur manquant" },
          { status: 400, headers }
        );
      }

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
          { error: "Erreur du service IA", details: data.error?.message || "Erreur API" },
          { status: response.status, headers }
        );
      }

      return Response.json({
        reply: data.choices?.[0]?.message?.content || "Je n'ai pas reçu de réponse."
      }, { headers });

    } catch (error) {
      return Response.json(
        { error: error.message || "Erreur interne" },
        { status: 500, headers }
      );
    }
  }
};
