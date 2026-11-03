
/* ==========================================
   J.A.R.V.I.S. — SPOTIFY PREMIUM PLAYER
   Version 2.0
   ========================================== */

const SPOTIFY_CLIENT_ID = "b583b5914b3644faa2cc977d3fa20861";
const SPOTIFY_REDIRECT_URI =
  "https://dylanroulliaux-cloud.github.io/Jarvis-/";

const SPOTIFY_SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing"
].join(" ");

const TOKEN_KEY = "jarvis_spotify_tokens";
const VERIFIER_KEY = "jarvis_spotify_verifier";
const STATE_KEY = "jarvis_spotify_state";

const $ = id => document.getElementById(id);

const statusElement = $("spotifyStatus");
const connectButton = $("spotifyConnect");
const previousButton = $("spotifyPrevious");
const playButton = $("spotifyPlayPause");
const nextButton = $("spotifyNext");

let currentPlayer = null;
let refreshInterval = null;
let isSeeking = false;

/* ==========================================
   STYLE DU LECTEUR
   ========================================== */

function installPlayerStyle() {
  if ($("jarvisSpotifyStyle")) return;

  const style = document.createElement("style");
  style.id = "jarvisSpotifyStyle";

  style.textContent = `
    .jarvis-player {
      margin-top: 20px;
      padding: 16px;
      border: 1px solid rgba(72,190,255,.24);
      border-radius: 16px;
      background: linear-gradient(
        145deg,
        rgba(13,35,57,.96),
        rgba(4,13,25,.98)
      );
      box-shadow: 0 0 24px rgba(0,145,255,.08);
      color: #eaf7ff;
    }

    .jarvis-player-top {
      display: flex;
      align-items: center;
      gap: 15px;
    }

    .jarvis-cover {
      width: 104px;
      height: 104px;
      flex-shrink: 0;
      border-radius: 12px;
      object-fit: cover;
      background: #10283c;
      box-shadow: 0 0 18px rgba(0,160,255,.15);
    }

    .jarvis-track-info {
      min-width: 0;
      flex: 1;
    }

    .jarvis-track-title {
      font-size: 16px;
      font-weight: 700;
      margin-bottom: 7px;
      overflow-wrap: anywhere;
    }

    .jarvis-track-artist {
      color: #9bbbd2;
      font-size: 13px;
      overflow-wrap: anywhere;
    }

    .jarvis-track-album {
      color: #668ba8;
      font-size: 11px;
      margin-top: 7px;
    }

    .jarvis-player-label {
      color: #51caff;
      font-size: 10px;
      letter-spacing: 2px;
      margin-bottom: 10px;
    }

    .jarvis-progress {
      margin-top: 19px;
    }

    .jarvis-progress input {
      width: 100%;
      accent-color: #42caff;
      cursor: pointer;
    }

    .jarvis-times {
      display: flex;
      justify-content: space-between;
      color: #8caec7;
      font-size: 11px;
      margin-top: 4px;
      font-variant-numeric: tabular-nums;
    }

    .jarvis-controls {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 23px;
      margin-top: 17px;
    }

    .jarvis-controls button {
      border: 0;
      background: transparent;
      color: #d9f2ff;
      font-size: 25px;
      cursor: pointer;
      padding: 6px;
    }

    .jarvis-controls .jarvis-main-control {
      width: 49px;
      height: 49px;
      border-radius: 50%;
      background: linear-gradient(135deg,#65d8ff,#148de0);
      color: #031322;
      font-size: 22px;
      box-shadow: 0 0 18px rgba(55,190,255,.3);
    }

    .jarvis-volume {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 17px;
      color: #9bbbd2;
      font-size: 13px;
    }

    .jarvis-volume input {
      flex: 1;
      accent-color: #42caff;
    }

    .jarvis-device {
      color: #6f9dbb;
      text-align: center;
      font-size: 10px;
      letter-spacing: 1px;
      margin-top: 15px;
    }

    .jarvis-no-track {
      text-align: center;
      padding: 22px 5px;
      color: #91b1c9;
      font-size: 13px;
    }

    .jarvis-player button:disabled {
      opacity: .4;
      cursor: default;
    }

    @media(max-width:380px) {
      .jarvis-cover {
        width: 85px;
        height: 85px;
      }
      .jarvis-track-title {
        font-size: 14px;
      }
    }
  `;

  document.head.appendChild(style);
}

/* ==========================================
   CRÉATION DU LECTEUR
   ========================================== */

function createPlayer() {
  const card = connectButton?.closest(".media-card");

  if (!card || $("jarvisSpotifyPlayer")) return;

  installPlayerStyle();

  const player = document.createElement("div");
  player.id = "jarvisSpotifyPlayer";
  player.className = "jarvis-player";

  player.innerHTML = `
    <div class="jarvis-player-label">
      J.A.R.V.I.S. · AUDIO SYSTEM
    </div>

    <div class="jarvis-player-top">
      <img
        id="jarvisCover"
        class="jarvis-cover"
        alt="Pochette de l'album"
        src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect width='100%25' height='100%25' fill='%230d263c'/%3E%3Ctext x='50%25' y='54%25' font-size='55' text-anchor='middle' fill='%2342caff'%3E♫%3C/text%3E%3C/svg%3E"
      >

      <div class="jarvis-track-info">
        <div id="jarvisTrackTitle" class="jarvis-track-title">
          En attente de lecture
        </div>

        <div id="jarvisTrackArtist" class="jarvis-track-artist">
          Lancez Spotify pour commencer
        </div>

        <div id="jarvisTrackAlbum" class="jarvis-track-album">
          SPOTIFY PREMIUM
        </div>
      </div>
    </div>

    <div class="jarvis-progress">
      <input
        id="jarvisSeek"
        type="range"
        min="0"
        max="1000"
        value="0"
        aria-label="Progression du morceau"
      >

      <div class="jarvis-times">
        <span id="jarvisElapsed">0:00</span>
        <span id="jarvisDuration">0:00</span>
      </div>
    </div>

    <div class="jarvis-controls">
      <button id="jarvisPrevious" aria-label="Précédent">⏮</button>
      <button
        id="jarvisPlay"
        class="jarvis-main-control"
        aria-label="Lecture ou pause"
      >▶</button>
      <button id="jarvisNext" aria-label="Suivant">⏭</button>
    </div>

    <div class="jarvis-volume">
      <span>VOL</span>
      <input
        id="jarvisVolume"
        type="range"
        min="0"
        max="100"
        value="50"
        aria-label="Volume Spotify"
      >
      <span id="jarvisVolumeValue">50%</span>
    </div>

    <div id="jarvisDevice" class="jarvis-device">
      EN ATTENTE D'UN APPAREIL
    </div>
  `;

  const controls = card.querySelector(".media-buttons");

  if (controls) {
    card.insertBefore(player, controls);
  } else {
    card.appendChild(player);
  }

  $("jarvisPrevious").addEventListener(
    "click",
    () => spotifyCommand("previous")
  );

  $("jarvisNext").addEventListener(
    "click",
    () => spotifyCommand("next")
  );

  $("jarvisPlay").addEventListener(
    "click",
    spotifyTogglePlayback
  );

  $("jarvisSeek").addEventListener("change", async event => {
    if (!currentPlayer?.item) return;

    const position = Math.round(
      Number(event.target.value) / 1000 *
      currentPlayer.item.duration_ms
    );

    try {
      await spotifyApi(
        "/me/player/seek?position_ms=" + position,
        "PUT"
      );
      await updateSpotifyPlayer();
    } catch (error) {
      setStatus(error.message);
    }
  });

  $("jarvisVolume").addEventListener("change", async event => {
    const volume = Number(event.target.value);
    $("jarvisVolumeValue").textContent = volume + "%";

    try {
      await spotifyApi(
        "/me/player/volume?volume_percent=" + volume,
        "PUT"
      );
    } catch (error) {
      setStatus(error.message);
    }
  });
}

/* ==========================================
   STATUT
   ========================================== */

function setStatus(message) {
  if (statusElement) {
    statusElement.textContent = message;
  }
}

/* ==========================================
   AUTHENTIFICATION SPOTIFY PKCE
   ========================================== */

function randomString(length = 64) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";

  const values = crypto.getRandomValues(new Uint8Array(length));

  return Array.from(
    values,
    value => chars[value % chars.length]
  ).join("");
}

function base64UrlEncode(buffer) {
  return btoa(
    String.fromCharCode(...new Uint8Array(buffer))
  )
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

    window.location.assign(
      "https://accounts.spotify.com/authorize?" +
      params.toString()
    );

  } catch (error) {
    setStatus("Impossible de lancer Spotify.");
    console.error(error);
  }
}

/* ==========================================
   GESTION DES JETONS
   ========================================== */

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
    throw new Error("Code de vérification introuvable.");
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
    throw new Error(
      data.error_description || "Connexion Spotify impossible."
    );
  }

  saveTokens(data);

  localStorage.removeItem(VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);

  setStatus("Spotify connecté avec succès !");

  // Retour à l'adresse propre de JARVIS.
  window.location.replace(SPOTIFY_REDIRECT_URI);
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
    localStorage.removeItem(TOKEN_KEY);
    throw new Error("Session Spotify expirée. Reconnectez-vous.");
  }

  return saveTokens(data, tokens.refresh_token);
}

async function getSpotifyToken() {
  const saved = localStorage.getItem(TOKEN_KEY);

  if (!saved) {
    throw new Error("Connectez Spotify à JARVIS.");
  }

  let tokens = JSON.parse(saved);

  if (Date.now() >= tokens.expires_at - 60000) {
    tokens = await refreshSpotifyToken(tokens);
  }

  return tokens.access_token;
}

/* ==========================================
   API SPOTIFY
   ========================================== */

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
      throw new Error("Session expirée. Reconnectez Spotify.");
    }

    if (response.status === 403) {
      throw new Error("Commande non autorisée par Spotify.");
    }

    if (response.status === 404) {
      throw new Error("Aucun appareil Spotify actif.");
    }

    throw new Error("Erreur Spotify : " + response.status);
  }

  return response.json();
}

/* ==========================================
   COMMANDES DE LECTURE
   ========================================== */

async function spotifyCommand(action) {
  try {
    await spotifyApi("/me/player/" + action, "POST");
    setStatus("Commande Spotify envoyée.");
    setTimeout(updateSpotifyPlayer, 800);
  } catch (error) {
    setStatus(error.message);
  }
}

async function spotifyTogglePlayback() {
  try {
    const player = await spotifyApi("/me/player");

    if (!player || !player.device) {
      throw new Error("Ouvrez Spotify sur un appareil actif.");
    }

    if (player.is_playing) {
      await spotifyApi("/me/player/pause", "PUT");
    } else {
      await spotifyApi("/me/player/play", "PUT");
    }

    setTimeout(updateSpotifyPlayer, 500);

  } catch (error) {
    setStatus(error.message);
  }
}

/* ==========================================
   LECTEUR : AFFICHAGE DU MORCEAU
   ========================================== */

function formatTime(milliseconds) {
  const total = Math.floor((milliseconds || 0) / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;

  return minutes + ":" + String(seconds).padStart(2, "0");
}

function displayTrack(player) {
  const item = player?.item;

  if (!item) {
    $("jarvisTrackTitle").textContent = "Aucun morceau en cours";
    $("jarvisTrackArtist").textContent = "Lancez une musique sur Spotify";
    $("jarvisTrackAlbum").textContent = "SPOTIFY PREMIUM";
    return;
  }

  $("jarvisTrackTitle").textContent = item.name || "Titre inconnu";

  $("jarvisTrackArtist").textContent =
    item.artists?.map(artist => artist.name).join(", ") ||
    "Artiste inconnu";

  $("jarvisTrackAlbum").textContent =
    item.album?.name || "Album inconnu";

  const images = item.album?.images || [];

  if (images.length) {
    $("jarvisCover").src =
      images.find(image => image.width <= 300)?.url ||
      images[images.length - 1].url;
  }

  const duration = item.duration_ms || 0;
  const progress = player.progress_ms || 0;

  $("jarvisElapsed").textContent = formatTime(progress);
  $("jarvisDuration").textContent = formatTime(duration);

  if (!isSeeking) {
    $("jarvisSeek").value = duration
      ? Math.round(progress / duration * 1000)
      : 0;
  }

  $("jarvisSeek").disabled = !duration;

  $("jarvisPlay").textContent =
    player.is_playing ? "Ⅱ" : "▶";

  $("jarvisDevice").textContent =
    player.device?.name
      ? "APPAREIL ACTIF · " + player.device.name
      : "SPOTIFY PREMIUM";
  
  if (player.device?.volume_percent !== null &&
      player.device?.volume_percent !== undefined) {
    $("jarvisVolume").value = player.device.volume_percent;
    $("jarvisVolumeValue").textContent =
      player.device.volume_percent + "%";
  }

  currentPlayer = player;
}

/* ==========================================
   ACTUALISATION AUTOMATIQUE
   ========================================== */

async function updateSpotifyPlayer() {
  if (!localStorage.getItem(TOKEN_KEY)) return;

  try {
    const player = await spotifyApi("/me/player");

    if (!player) {
      setStatus("Spotify connecté · En attente de lecture.");
      return;
    }

    displayTrack(player);

    setStatus(
      player.is_playing
        ? "Spotify · Lecture en cours"
        : "Spotify · En pause"
    );

  } catch (error) {
    setStatus(error.message);
  }
}

function startPlayerUpdates() {
  if (refreshInterval) clearInterval(refreshInterval);

  updateSpotifyPlayer();

  refreshInterval = setInterval(() => {
    if (!document.hidden) {
      updateSpotifyPlayer();
    }
  }, 5000);
}

/* ==========================================
   INITIALISATION
   ========================================== */

async function initializeSpotify() {
  createPlayer();

  if (connectButton) {
    connectButton.addEventListener("click", connectSpotify);
  }

  // Commandes déjà présentes dans ton HTML.
  previousButton?.addEventListener(
    "click",
    () => spotifyCommand("previous")
  );

  nextButton?.addEventListener(
    "click",
    () => spotifyCommand("next")
  );

  playButton?.addEventListener(
    "click",
    spotifyTogglePlayback
  );

  // Retour de l'autorisation Spotify.
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  const error = params.get("error");

  if (error) {
    setStatus("Autorisation Spotify refusée.");
    window.history.replaceState(
      null,
      document.title,
      window.location.pathname
    );
    return;
  }

  if (code) {
    const savedState = localStorage.getItem(STATE_KEY);

    if (!state || state !== savedState) {
      setStatus("Erreur de sécurité. Recommencez la connexion.");
      return;
    }

    try {
      setStatus("Connexion Spotify en cours...");
      await exchangeCode(code);
    } catch (error) {
      setStatus(error.message);
      console.error(error);
    }

    return;
  }

  if (localStorage.getItem(TOKEN_KEY)) {
    setStatus("Spotify connecté · Synchronisation...");
    startPlayerUpdates();
  } else {
    setStatus("Spotify non connecté");
  }
}

// Barre de progression : permet de déplacer la lecture.
document.addEventListener("input", event => {
  if (event.target?.id === "jarvisSeek") {
    isSeeking = true;

    if (currentPlayer?.item?.duration_ms) {
      const position =
        Number(event.target.value) / 1000 *
        currentPlayer.item.duration_ms;

      $("jarvisElapsed").textContent = formatTime(position);
    }
  }
});

document.addEventListener("change", event => {
  if (event.target?.id === "jarvisSeek") {
    isSeeking = false;
  }
});

initializeSpotify();
