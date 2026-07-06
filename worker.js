/**
 * ChantiersPro — Proxy Cloudflare Worker pour l'API Anthropic (Claude)
 * ------------------------------------------------------------------
 * Rôle : recevoir les requêtes de ChantiersPro et les relayer à l'API
 * Anthropic en ajoutant la CLÉ API côté serveur. La clé n'est JAMAIS
 * exposée dans le navigateur ni synchronisée dans le cloud.
 *
 * La clé est stockée comme "secret" Cloudflare (variable ANTHROPIC_API_KEY),
 * pas en dur dans ce code.
 */

export default {
  async fetch(request, env) {

    // --- Autoriser uniquement ton app (CORS) ---
    // Remplace par ton domaine GitHub Pages pour verrouiller l'accès.
    const ALLOWED_ORIGIN = "https://pellizzarimax.github.io";

    const corsHeaders = {
      "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    };

    // Requête de pré-vérification CORS
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // On n'accepte que le POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Méthode non autorisée" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      // Récupérer le corps envoyé par ChantiersPro (modèle, messages, etc.)
      const body = await request.text();

      // Relayer à l'API Anthropic en ajoutant la clé (secret serveur)
      const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: body,
      });

      // Renvoyer la réponse telle quelle à l'app, avec les en-têtes CORS
      const responseText = await anthropicResponse.text();
      return new Response(responseText, {
        status: anthropicResponse.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: "Erreur proxy", detail: String(err) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  },
};
