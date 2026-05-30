// Ajouter le chemin des modules
require("module").globalPaths.push("/app/render-server/node_modules");

console.log("📁 Current directory:", __dirname);
console.log("📁 Files:", require("fs").readdirSync(__dirname));

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const Anthropic = require("@anthropic-ai/sdk");
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const RENDERS_DIR = path.join(__dirname, "renders");
const AUDIO_DIR = path.join(__dirname, "audio");
const PHOTOS_DIR = path.join(__dirname, "photos");

fs.mkdirSync(RENDERS_DIR, { recursive: true });
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

const cleanOldFiles = () => {
  const dirs = [RENDERS_DIR, AUDIO_DIR, PHOTOS_DIR];
  const maxAge = 7 * 24 * 60 * 60 * 1000;

  dirs.forEach((dir) => {
    try {
      const files = fs.readdirSync(dir);
      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stats = fs.statSync(filePath);
        const age = Date.now() - stats.mtimeMs;
        if (age > maxAge) {
          fs.unlinkSync(filePath);
          console.log("🗑️ Cleaned:", file);
        }
      });
    } catch (err) {
      console.error("Cleanup error:", err.message);
    }
  });
};

cleanOldFiles();
setInterval(cleanOldFiles, 60 * 60 * 1000);

// Bundle cache — éviter de rebundler à chaque rendu
const bundleCache = new Map();

const getBundleLocation = async () => {
  if (bundleCache.has("bundle")) {
    console.log("📦 Using cached bundle");
    return bundleCache.get("bundle");
  }
  console.log("📦 Building bundle...");
  const location = await require("@remotion/bundler").bundle({
    entryPoint: path.join(__dirname, "remotion", "Root.tsx"),
    webpackOverride: (config) => config,
  });
  bundleCache.set("bundle", location);
  console.log("📦 Bundle cached:", location);
  return location;
};

const toAbsoluteAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${process.env.RENDER_SERVER_URL}${url}`;
};

// ── File d'attente rendu (max 3 simultanés) ───────────
let activeRenders = 0;
const MAX_CONCURRENT = 3;
const queue = [];

const processQueue = () => {
  while (queue.length > 0 && activeRenders < MAX_CONCURRENT) {
    const next = queue.shift();
    next();
  }
};

const addToQueue = (renderFn) => {
  return new Promise((resolve, reject) => {
    const wrapped = async () => {
      activeRenders++;
      try {
        const result = await renderFn();
        resolve(result);
      } catch (err) {
        reject(err);
      } finally {
        activeRenders--;
        processQueue();
      }
    };
    queue.push(wrapped);
    processQueue();
  });
};

const writeJobProgress = (progressPath, progress, status) => {
  fs.writeFileSync(
    progressPath,
    JSON.stringify({
      progress: progress ?? 0,
      status: status || "rendering",
    }),
  );
};

const recalcSceneDurations = (scenes) => {
  const ANTICIPATION = 3;
  let currentFrame = 0;
  return (scenes || []).map((scene, i) => {
    const duration = scene.durationFrames || 90;
    const start = Math.max(0, currentFrame - (i > 0 ? ANTICIPATION : 0));
    const result = {
      startFrame: start,
      durationFrames: duration,
    };
    currentFrame += duration;
    return result;
  });
};

const syncScenesWithVoice = (scenes, phraseTimestamps, fps = 60) => {
  if (!phraseTimestamps || phraseTimestamps.length === 0) {
    console.log("⚠️ No phraseTimestamps — using fixed durations");
    return recalcSceneDurations(scenes);
  }

  const totalVoiceFrames = phraseTimestamps[phraseTimestamps.length - 1]?.endFrame || 0;
  console.log(
    "🎙️ Total voice frames:",
    totalVoiceFrames,
    "— Scenes:",
    scenes.length,
    "— Phrases:",
    phraseTimestamps.length,
  );

  const totalSceneDuration = scenes.reduce((acc, s) => acc + (s.durationFrames || 90), 0);

  let currentFrame = 0;
  const synced = scenes.map((scene) => {
    const baseDuration = scene.durationFrames || 90;
    const scaledDuration = Math.max(
      40,
      Math.round((baseDuration / totalSceneDuration) * totalVoiceFrames),
    );

    const result = {
      startFrame: currentFrame,
      durationFrames: scaledDuration,
    };
    currentFrame += scaledDuration;
    return result;
  });

  const totalSynced = synced.reduce((acc, s) => acc + s.durationFrames, 0);
  if (synced.length > 0 && totalVoiceFrames > 0) {
    const diff = totalVoiceFrames - totalSynced;
    synced[synced.length - 1].durationFrames = Math.max(
      40,
      synced[synced.length - 1].durationFrames + diff,
    );
  }

  console.log(
    "🎙️ Synced — total frames:",
    synced.reduce((acc, s) => acc + s.durationFrames, 0),
    "vs voice:",
    totalVoiceFrames,
  );
  return synced;
};

const generateMockupContent = (scene, prompt) => {
  const p = (prompt || "").toLowerCase();

  const isYoutube = p.includes("youtube");
  const isSpotify =
    p.includes("spotify") || p.includes("musique") || p.includes("music");
  const isNike =
    p.includes("nike") ||
    p.includes("sport") ||
    p.includes("fitness") ||
    p.includes("running");
  const isEcommerce =
    p.includes("shop") ||
    p.includes("achat") ||
    p.includes("boutique") ||
    p.includes("produit") ||
    p.includes("store");
  const isFood =
    p.includes("food") ||
    p.includes("restaurant") ||
    p.includes("cuisine") ||
    p.includes("recette");
  const isFinance =
    p.includes("finance") ||
    p.includes("crypto") ||
    p.includes("bourse") ||
    p.includes("invest");
  const isSocial =
    p.includes("instagram") ||
    p.includes("tiktok") ||
    p.includes("social") ||
    p.includes("reels");
  const isDelivery =
    p.includes("livraison") ||
    p.includes("delivery") ||
    p.includes("uber") ||
    p.includes("commande");

  if (scene.type === "iphone") {
    if (isSpotify) {
      return {
        ...scene,
        mockupContent: "player",
        mockupData: {
          type: "player",
          title: scene.text || "Your Playlist",
          artist: "Spotify",
          progress: 65,
          color: "#1DB954",
        },
      };
    }
    if (isNike) {
      return {
        ...scene,
        mockupContent: "fitness",
        mockupData: {
          type: "fitness",
          steps: "8,420",
          calories: "342",
          km: "6.2",
          color: scene.accentColor || "#FF5722",
        },
      };
    }
    if (isYoutube) {
      return {
        ...scene,
        mockupContent: "video",
        mockupData: {
          type: "video",
          title: scene.text || "Watch Now",
          views: "2.4M views",
          color: "#FF0000",
        },
      };
    }
    if (isEcommerce) {
      return {
        ...scene,
        mockupContent: "product",
        mockupData: {
          type: "product",
          name: scene.text || "Product",
          price: "€99",
          rating: "4.8",
          color: scene.accentColor || "#000000",
        },
      };
    }
    if (isFood) {
      return {
        ...scene,
        mockupContent: "food",
        mockupData: {
          type: "food",
          dish: scene.text || "Commander",
          time: "25 min",
          price: "€12.90",
          color: scene.accentColor || "#FF8F00",
        },
      };
    }
    if (isDelivery) {
      return {
        ...scene,
        mockupContent: "delivery",
        mockupData: {
          type: "delivery",
          status: "En route",
          eta: "12 min",
          steps: ["Commandé", "Préparé", "En route", "Livré"],
          activeStep: 2,
          color: scene.accentColor || "#000000",
        },
      };
    }
    if (isFinance) {
      return {
        ...scene,
        mockupContent: "finance",
        mockupData: {
          type: "finance",
          amount: "+24.5%",
          value: "€12,450",
          change: "+€2,890",
          color: "#2196F3",
        },
      };
    }
    if (isSocial) {
      return {
        ...scene,
        mockupContent: "social",
        mockupData: {
          type: "social",
          likes: "24.5K",
          followers: "142K",
          color: scene.accentColor || "#E1306C",
        },
      };
    }
    return {
      ...scene,
      mockupContent: "saas",
      mockupData: {
        type: "saas",
        title: scene.text || "Dashboard",
        metric: "94%",
        label: "Performance",
        color: scene.accentColor || "#10B981",
      },
    };
  }

  if (scene.type === "macbook" || scene.type === "browser") {
    if (isEcommerce) {
      return {
        ...scene,
        mockupContent: "ecommerce",
        mockupData: {
          type: "ecommerce",
          productName: scene.text || "Product",
          price: "€249",
          color: scene.accentColor || "#000000",
        },
      };
    }
    if (isFinance) {
      return {
        ...scene,
        mockupContent: "chart",
        mockupData: {
          type: "chart",
          title: "Portfolio",
          value: "+24.5%",
          color: "#2196F3",
        },
      };
    }
    return {
      ...scene,
      mockupContent: "landing",
      mockupData: {
        type: "landing",
        headline: scene.text || "Landing Page",
        cta: "Commencer →",
        color: scene.accentColor || "#000000",
      },
    };
  }

  return scene;
};

const generateUIContent = async (siteName, prompt, sceneType) => {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  try {
    console.log("🤖 Generating UI for:", siteName, `(${sceneType})`);

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `Tu es un expert en UI design. Génère le contenu d'une interface ${sceneType === "iphone" ? "mobile iPhone" : "desktop"} pour : "${siteName}" dans le contexte : "${prompt}".

Réponds UNIQUEMENT en JSON avec cette structure exacte :
{
  "appName": "Nom de l'app",
  "primaryColor": "#couleur_hex",
  "bgColor": "#couleur_fond",
  "textColor": "#couleur_texte",
  "elements": [
    {
      "type": "header",
      "content": "texte ou emoji",
      "style": "bold|normal|small"
    },
    {
      "type": "metric",
      "label": "label",
      "value": "valeur",
      "trend": "+12%"
    },
    {
      "type": "bar",
      "values": [60, 80, 45, 90, 70],
      "color": "#hex"
    },
    {
      "type": "list",
      "items": ["item1", "item2", "item3"]
    },
    {
      "type": "button",
      "text": "texte bouton",
      "color": "#hex"
    },
    {
      "type": "progress",
      "value": 75,
      "label": "label"
    },
    {
      "type": "avatar",
      "emoji": "👤",
      "name": "nom",
      "sub": "sous-titre"
    },
    {
      "type": "grid",
      "items": ["emoji1", "emoji2", "emoji3", "emoji4"]
    }
  ]
}

RÈGLES :
- Maximum 4-5 éléments pour ne pas surcharger l'écran
- Couleurs cohérentes avec la marque/contexte
- Contenu RÉEL et pertinent pour "${siteName}"
- Style moderne et premium
- Réponds UNIQUEMENT en JSON valide, pas de markdown`,
      }],
    });

    const text = response.content[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch (err) {
    console.error("🤖 UI generation error:", err.message);
    return null;
  }
};

const enrichMockupsWithAI = async (scenes, prompt) => {
  const p = (prompt || "").toLowerCase();

  const isWebContext = (
    p.includes("app") || p.includes("site") || p.includes("web") ||
    p.includes("saas") || p.includes("dashboard") || p.includes("plateforme") ||
    p.includes("spotify") || p.includes("netflix") || p.includes("youtube") ||
    p.includes("instagram") || p.includes("tiktok") || p.includes("airbnb") ||
    p.includes("uber") || p.includes("notion") || p.includes("stripe") ||
    p.includes("figma") || p.includes("linear") || p.includes("vercel") ||
    p.includes("amazon") || p.includes("shopify") || p.includes(".com") ||
    p.includes(".fr") || p.includes(".app") || p.includes("mobile") ||
    p.includes("interface") || p.includes("ui") || p.includes("ux")
  );

  if (!isWebContext) return scenes;

  const siteRegex = /([a-zA-Z0-9-]+\.(com|fr|app|io|co|net|org))/i;
  const siteMatch = prompt.match(siteRegex);
  const siteName = siteMatch ? siteMatch[0] : prompt.slice(0, 50);

  const mockupTypes = new Set(["iphone", "macbook", "browser", "doubledevice", "dashboard"]);
  const hasMockups = scenes.some((scene) => mockupTypes.has(scene.type));
  if (!hasMockups) return scenes;

  const needsMobile = scenes.some((scene) => scene.type === "iphone");
  const needsDesktop = scenes.some(
    (scene) => mockupTypes.has(scene.type) && scene.type !== "iphone",
  );

  const [mobileUI, desktopUI] = await Promise.all([
    needsMobile ? generateUIContent(siteName, prompt, "iphone") : Promise.resolve(null),
    needsDesktop ? generateUIContent(siteName, prompt, "desktop") : Promise.resolve(null),
  ]);

  console.log("🤖 AI UI generated:", {
    mobile: !!mobileUI,
    desktop: !!desktopUI,
    site: siteName,
  });

  return scenes.map((scene) => {
    if (!mockupTypes.has(scene.type)) return scene;

    const isMobile = scene.type === "iphone";
    const uiData = isMobile ? mobileUI : desktopUI;
    if (!uiData) return scene;

    return {
      ...scene,
      aiUI: uiData,
      websiteUrl: siteName,
    };
  });
};

// Chrome persistant
let browserInstance = null;

const getChrome = async () => {
  if (browserInstance) return browserInstance;
  const { openBrowser } = require("@remotion/renderer");
  browserInstance = await openBrowser("chrome", {
    browserExecutable: "/usr/bin/chromium",
    chromiumOptions: {
      disableWebSecurity: true,
      ignoreCertificateErrors: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });
  console.log("🌐 Chrome instance cached");
  return browserInstance;
};

// ── Health check ──────────────────────────────────────
app.get("/health", (req, res) => res.json({ status: "ok" }));

// ── Voix ElevenLabs ───────────────────────────────────
app.post("/voice", async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.85,
            style: 0.3,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return res.status(500).json({ error: `ElevenLabs error: ${err}` });
    }

    const data = await response.json();

    const audioBuffer = Buffer.from(data.audio_base64, "base64");
    const audioFileName = `${uuidv4()}.mp3`;
    const audioPath = path.join(AUDIO_DIR, audioFileName);
    fs.writeFileSync(audioPath, audioBuffer);

    const audioUrl = `${process.env.RENDER_SERVER_URL}/audio/${audioFileName}`;
    console.log("🎵 Audio URL:", audioUrl);

    const fps = 60;
    const alignment = data.alignment || {};
    const characters = alignment.characters || [];
    const charStartTimes = alignment.character_start_times_seconds || [];
    const charEndTimes = alignment.character_end_times_seconds || [];

    const lines = text.split("\n").filter((l) => l.trim());

    let charIndex = 0;
    const phraseTimestamps = lines
      .map((line) => {
        const cleanLine = line.trim();
        if (!cleanLine) return null;

        while (
          charIndex < characters.length &&
          typeof characters[charIndex] === "string" &&
          /\s/.test(characters[charIndex])
        ) {
          charIndex += 1;
        }

        const lineChars = cleanLine.replace(/\s/g, "").length;
        const startTime = charStartTimes[charIndex] || 0;

        let endCharIdx = charIndex;
        let charsFound = 0;
        while (endCharIdx < characters.length && charsFound < lineChars) {
          if (characters[endCharIdx] && characters[endCharIdx] !== " ") {
            charsFound += 1;
          }
          endCharIdx += 1;
        }

        const endTime =
          charEndTimes[Math.max(0, endCharIdx - 1)] || startTime + 1.5;
        charIndex = endCharIdx;

        const startFrame = Math.round(startTime * fps);
        const endFrame = Math.round(endTime * fps);

        return {
          phrase: cleanLine,
          startFrame,
          endFrame,
          durationFrames: Math.max(60, endFrame - startFrame),
        };
      })
      .filter(Boolean);

    console.log(
      "🎙️ phraseTimestamps:",
      phraseTimestamps.map(
        (p) => `"${p.phrase.slice(0, 20)}" [${p.startFrame}-${p.endFrame}]`,
      ),
    );

    const durationSeconds = charEndTimes[charEndTimes.length - 1] || 30;

    res.json({ audioUrl, durationSeconds, phraseTimestamps, alignment });
  } catch (err) {
    console.error("Voice error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Musique locale ────────────────────────────────────
app.post("/music", async (req, res) => {
  try {
    const { formatId } = req.body;
    const musicMap = {
      corporate: "corporate.mp3",
      tech: "tech.mp3",
      ambient: "ambient.mp3",
      energetic: "energetic.mp3",
      cinematic: "cinematic.mp3",
      elegant: "elegant.mp3",
      emotional: "emotional.mp3",
      adventure: "adventure.mp3",
    };

    const moodMap = {
      pub: "energetic",
      motivation: "energetic",
      educatif: "ambient",
      storytelling: "cinematic",
      luxe: "elegant",
      corporate: "corporate",
      tech: "tech",
    };

    const mood = moodMap[formatId] || "ambient";
    const file = musicMap[mood] || "ambient.mp3";
    const musicUrl = `${process.env.RENDER_SERVER_URL}/music/${file}`;

    res.json({ musicUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const fetchPhotoForScene = async (query) => {
  console.log("📸 Fetching photo for:", query);
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=3&orientation=landscape`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } },
    );
    const data = await res.json();
    const photos = data.photos || [];
    console.log("📸 Found", photos.length, "photos for:", query);
    if (photos.length === 0) return null;
    const photo = photos[Math.floor(Math.random() * photos.length)];
    const url = photo.src.large2x || photo.src.large;
    console.log("📸 Photo URL:", url);
    return url;
  } catch (err) {
    console.error("📸 Pexels error:", err.message);
    return null;
  }
};

const enrichScenesWithPhotos = async (scenes, mainPrompt) => {
  const enriched = await Promise.all(
    scenes.map(async (scene) => {
      if (
        scene.type === "photoreveal" ||
        scene.type === "photocollage" ||
        scene.type === "kenburns"
      ) {
        const query = scene.photoQuery || scene.text || mainPrompt;

        const photo1 = await fetchPhotoForScene(query);
        const photo2 =
          scene.type === "photocollage"
            ? await fetchPhotoForScene(`${query} team`)
            : null;
        const photo3 =
          scene.type === "photocollage"
            ? await fetchPhotoForScene(`${query} product`)
            : null;

        return {
          ...scene,
          photoUrl: photo1 || scene.photoUrl,
          photoUrl2: photo2 || scene.photoUrl2,
          photoUrl3: photo3 || scene.photoUrl3,
        };
      }
      return scene;
    }),
  );
  return enriched;
};

// ── Photos Pexels ─────────────────────────────────────
app.post("/photos", async (req, res) => {
  try {
    const { query } = req.body;
    const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

    if (!PEXELS_API_KEY) {
      console.log("⚠️ No Pexels API key");
      return res.json({ photoUrl: null });
    }

    console.log("🖼️ Fetching photo for:", query);

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    const data = await response.json();
    const photo = data.photos?.[0];

    if (!photo) {
      console.log("⚠️ No photo found for:", query);
      return res.json({ photoUrl: null });
    }

    const photoResponse = await fetch(photo.src.large2x || photo.src.large);
    const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());
    const photoFileName = `${uuidv4()}.jpg`;
    const photoPath = path.join(PHOTOS_DIR, photoFileName);
    fs.writeFileSync(photoPath, photoBuffer);

    const photoUrl = `${process.env.RENDER_SERVER_URL}/photos/${photoFileName}`;
    console.log("✅ Photo saved:", photoUrl);

    res.json({ photoUrl });
  } catch (err) {
    console.error("❌ Photo error:", err.message);
    res.json({ photoUrl: null });
  }
});

// ── Lancer un rendu ───────────────────────────────────
app.post("/render", async (req, res) => {
  try {
    const jobId = uuidv4();
    const {
      scenes,
      totalFrames: requestedTotalFrames,
      format,
      audioUrl,
      musicUrl,
      musicVolume,
      prompt,
      duration,
      accentColor,
      formatName,
      plan = "free",
      showWatermark: requestedShowWatermark,
      quality = "fast",
      phraseTimestamps = [],
    } = req.body;

    const outPath = path.join(RENDERS_DIR, `${jobId}.mp4`);
    const errPath = path.join(RENDERS_DIR, `${jobId}.error`);
    const metaPath = path.join(RENDERS_DIR, `${jobId}.meta.json`);
    const progressPath = path.join(RENDERS_DIR, `${jobId}.progress`);

    const qualitySettings = {
      fast: { crf: 28, concurrency: 8, scale: 0.75 },
      high: { crf: 18, concurrency: 4, scale: 1 },
    };
    const settings = qualitySettings[quality] || qualitySettings.fast;

    if (fs.existsSync(errPath)) fs.unlinkSync(errPath);
    if (fs.existsSync(progressPath)) fs.unlinkSync(progressPath);
    writeJobProgress(progressPath, 0, "queued");

    fs.writeFileSync(
      metaPath,
      JSON.stringify({
        prompt,
        format,
        duration,
        accentColor,
        formatName,
        quality,
      }),
    );

    console.log(
      `📥 Render queued: ${jobId} (queue: ${queue.length + 1}, active: ${activeRenders}/${MAX_CONCURRENT})`,
    );

    res.json({ jobId });

    void addToQueue(async () => {
      try {
        writeJobProgress(progressPath, 0, "rendering");

        const enrichedScenes = await enrichScenesWithPhotos(scenes || [], prompt || "");
        const enrichedWithMockup = enrichedScenes.map((scene) =>
          generateMockupContent(scene, prompt || ""),
        );
        const enrichedWithAI = await enrichMockupsWithAI(enrichedWithMockup, prompt || "");

        const sceneDurations = syncScenesWithVoice(enrichedWithAI, phraseTimestamps, 60);
        const computedTotalFrames = sceneDurations.reduce(
          (acc, s) => acc + s.durationFrames,
          0,
        );
        const adjustedTotalFrames = Math.max(
          computedTotalFrames || requestedTotalFrames || 1800,
          enrichedWithAI.length * 60,
        );

        console.log("🎬 Total frames:", adjustedTotalFrames, "— Scenes:", enrichedWithAI.length);

        const inputProps = {
          scenes: enrichedWithAI,
          sceneDurations,
          totalFrames: adjustedTotalFrames,
          phraseTimestamps,
          format: format || "9:16",
          audioSrc: audioUrl || null,
          musicSrc: musicUrl || null,
          musicVolume: musicVolume || 0.07,
          showWatermark: requestedShowWatermark ?? plan === "free",
          plan: plan || "free",
          prompt,
          duration,
          accentColor,
          formatName,
          quality,
          audioUrl,
          musicUrl,
        };

        const { renderMedia, selectComposition } = require("@remotion/renderer");
        const bundleLocation = await getBundleLocation();
        const totalFrames = inputProps.totalFrames || 1800;

        const renderInputProps = {
          ...inputProps,
          totalFrames,
          audioSrc: toAbsoluteAssetUrl(inputProps.audioSrc),
          musicSrc: toAbsoluteAssetUrl(inputProps.musicSrc),
        };

        const composition = await selectComposition({
          serveUrl: bundleLocation,
          id: "MotionVideo",
          inputProps: renderInputProps,
        });

        composition.durationInFrames = totalFrames;

        await renderMedia({
          composition,
          serveUrl: bundleLocation,
          codec: "h264",
          outputLocation: outPath,
          inputProps: renderInputProps,
          browserExecutable: "/usr/bin/chromium",
          chromiumOptions: {
            disableWebSecurity: true,
            ignoreCertificateErrors: true,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-dev-shm-usage",
              "--disable-gpu",
              "--single-process",
              "--no-zygote",
            ],
          },
          concurrency: settings.concurrency,
          crf: settings.crf,
          pixelFormat: "yuv420p",
          onProgress: ({ progress }) => {
            const pct = Math.round(progress * 100);
            writeJobProgress(progressPath, pct, "rendering");
            console.log(`📊 Render progress: ${pct}%`);
          },
        });

        writeJobProgress(progressPath, 100, "rendering");
        console.log("✅ Render done:", jobId);
      } catch (err) {
        console.error("❌ Render error:", err.message);
        fs.writeFileSync(errPath, err.message);
      }
    });
  } catch (err) {
    console.error("Render setup error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── Status rendu ──────────────────────────────────────
app.get("/render/:jobId", (req, res) => {
  const { jobId } = req.params;
  const outPath = path.join(RENDERS_DIR, `${jobId}.mp4`);
  const errPath = path.join(RENDERS_DIR, `${jobId}.error`);
  const progressPath = path.join(RENDERS_DIR, `${jobId}.progress`);

  if (fs.existsSync(errPath)) {
    return res.json({ status: "error", error: fs.readFileSync(errPath, "utf-8") });
  }

  if (fs.existsSync(outPath)) {
    return res.json({
      status: "done",
      videoUrl: `${process.env.RENDER_SERVER_URL}/video/${jobId}.mp4`,
      progress: 100,
    });
  }

  let progress = 0;
  let status = "rendering";
  if (fs.existsSync(progressPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(progressPath, "utf-8"));
      progress = data.progress || 0;
      if (data.status === "queued" || data.status === "rendering") {
        status = data.status;
      }
    } catch {
      /* ignore */
    }
  }

  res.json({ status, progress });
});

// ── Metadata ──────────────────────────────────────────
app.get("/meta/:jobId", (req, res) => {
  const metaPath = path.join(RENDERS_DIR, `${req.params.jobId}.meta.json`);
  if (fs.existsSync(metaPath)) {
    return res.json(JSON.parse(fs.readFileSync(metaPath, "utf-8")));
  }
  res.json({});
});

// ── Fichiers statiques ────────────────────────────────
app.use("/video", express.static(RENDERS_DIR));
app.use("/audio", express.static(AUDIO_DIR));
app.use("/photos", express.static(PHOTOS_DIR));
app.use("/music", express.static(path.join(__dirname, "public", "music")));

const PORT = process.env.PORT || 3001;
console.log(
  "🔑 PEXELS_API_KEY:",
  process.env.PEXELS_API_KEY ? "✅ Définie" : "❌ MANQUANTE",
);
console.log(
  "🔑 ELEVENLABS_API_KEY:",
  process.env.ELEVENLABS_API_KEY ? "✅ Définie" : "❌ MANQUANTE",
);
app.listen(PORT, () => console.log(`🎬 Render server on port ${PORT}`));
