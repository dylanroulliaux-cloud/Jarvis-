
const SPOTIFY_CLIENT_ID = "b583b5914b3644faa2cc977d3fa20861";
const SPOTIFY_REDIRECT_URI = "https://dylanroulliaux-cloud.github.io/Jarvis-/";

const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing"
].join(" ");

const TOKEN_KEY = "jarvis_spotify_tokens";
const VERIFIER_KEY = "jarvis_spotify_verifier";
const STATE_KEY = "jarvis_spotify_state";

const spotifyStatus = document.getElementById("spotifyStatus");
const spotifyConnect = document.getElementById("spotifyConnect");

function setSpotifyStatus(message) {
  if (spotifyStatus) spotifyStatus.textContent = message;
}

function randomString(length = 64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(values, value => chars[value % chars.length]).join("");
}

function base64UrlEncode(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function createChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

async function connectSpotify() {
  try {
    const verifier = randomString();
    const state = randomString(32);
    const challenge = await createChallenge(verifier);

    localStorage.setItem(VERIFIER_KEY, verifier);
    localStorage.setItem(STATE_KEY, state);

    const params = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      response_type: "code",
      redirect_uri: SPOTIFY_REDIRECT_URI,
      scope: SPOTIFY_SCOPES,
      state,
      code_challenge_method: "S256",
      code_challenge: challenge
    });

    window.location.href =
      "https://accounts.spotify.com/authorize?" + params.toString();

  } catch (error) {
    setSpotifyStatus("Impossible de lancer la connexion Spotify.");
    console.error(error);
  }
}

function saveTokens(data, previousRefreshToken = null) {
  const tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || previousRefreshToken,
    expires_at: Date.now() + data.expires_in * 1000
  };

  localStorage.setItem(TOKEN_KEY, JSON.stringify(tokens));
  return tokens;
}

async function exchangeCode(code) {
  const verifier = localStorage.getItem(VERIFIER_KEY);

  if (!verifier) {
    throw new Error("Code de vérification introuvable. Reconnectez Spotify.");
  }

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: "authorization_code",
        code,
        redirect_uri: SPOTIFY_REDIRECT_URI,
        code_verifier: verifier
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error_description || "Échec de connexion Spotify.");
  }

  saveTokens(data);

  localStorage.removeItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);

  window.history.replaceState({}, document.title, window.location.pathname);
  setSpotifyStatus("Spotify connecté avec succès !");
}

async function refreshSpotifyToken(tokens) {
  if (!tokens.refresh_token) {
    throw new Error("Reconnectez votre compte Spotify.");
  }

  const response = await fetch(
    "https://accounts.spotify.com/api/token",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        client_id: SPOTIFY_CLIENT_ID,
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token
      })
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Impossible de renouveler la connexion Spotify.");
  }

  return saveTokens(data, tokens.refresh_token);
}

async function getSpotifyToken() {
  const saved = localStorage.getItem(TOKEN_KEY);

  if (!saved) {
    throw new Error("Connectez d'abord Spotify.");
  }

  let tokens = JSON.parse(saved);

  if (Date.now() >= tokens.expires_at - 60000) {
    tokens = await refreshSpotifyToken(tokens);
  }

  return tokens.access_token;
}

async function spotifyApi(endpoint, method = "GET") {
  const token = await getSpotifyToken();

  const response = await fetch(
    "https://api.spotify.com/v1" + endpoint,
    {
      method,
      headers: {
        Authorization: "Bearer " + token
      }
    }
  );

  if (response.status === 204) return null;

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      setSpotifyStatus("Session expirée. Reconnectez Spotify.");
    }

    if (response.status === 403) {
      throw new Error("Action non autorisée par Spotify.");
    }

    if (response.status === 404) {
      throw new Error("Aucun appareil Spotify actif.");
    }

    throw new Error("Erreur Spotify : " + response.status);
  }

  return response.json();
}

async function spotifyAction(action) {
  try {
    setSpotifyStatus("Commande en cours...");

    await spotifyApi("/me/player/" + action, "POST");

    setSpotifyStatus("Commande envoyée à Spotify.");

  } catch (error) {
    setSpotifyStatus(error.message);
  }
}

async function spotifyPlayPause() {
  try {
    setSpotifyStatus("Vérification de la lecture...");

    const player = await spotifyApi("/me/player");

    if (!player || !player.device) {
      throw new Error("Ouvre Spotify sur un appareil actif.");
    }

    if (player.is_playing) {
      await spotifyApi("/me/player/pause", "PUT");
      setSpotifyStatus("Lecture en pause.");
    } else {
      await spotifyApi("/me/player/play", "PUT");
      setSpotifyStatus("Lecture en cours.");
    }

  } catch (error) {
    setSpotifyStatus(error.message);
  }
}

// Bouton de connexion
if (spotifyConnect) {
  spotifyConnect.addEventListener("click", connectSpotify);
}

// Commandes musicales
document.getElementById("spotifyPrevious")?.addEventListener(
  "click",
  () => spotifyAction("previous")
);

document.getElementById("spotifyNext")?.addEventListener(
  "click",
  () => spotifyAction("next")
);

document.getElementById("spotifyPlayPause")?.addEventListener(
  "click",
  spotifyPlayPause
);

// Retour depuis Spotify après autorisation
(async function initializeSpotify() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    setSpotifyStatus("Connexion refusée par Spotify.");
    window.history.replaceState({}, document.title, window.location.pathname);
    return;
  }

  if (code) {
    const savedState = localStorage.getItem(STATE_KEY);

    if (!state || state !== savedState) {
      setSpotifyStatus("Erreur de sécurité. Recommencez la connexion.");
      return;
    }

    try {
      setSpotifyStatus("Finalisation de la connexion...");
      await exchangeCode(code);
    } catch (error) {
      setSpotifyStatus(error.message);
      console.error(error);
    }

    return;
  }

  if (localStorage.getItem(TOKEN_KEY)) {
    setSpotifyStatus("Compte Spotify enregistré sur cet appareil.");
  }
})();
