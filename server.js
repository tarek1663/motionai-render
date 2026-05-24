// Ajouter le chemin des modules
require("module").globalPaths.push("/app/render-server/node_modules");

console.log("📁 Current directory:", __dirname);
console.log("📁 Files:", require("fs").readdirSync(__dirname));

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const app = express();
app.use(cors());
app.use(express.json({ limit: "50mb" }));

const RENDERS_DIR = path.join(__dirname, "renders");
const AUDIO_DIR = path.join(__dirname, "audio");
const PHOTOS_DIR = path.join(__dirname, "photos");

fs.mkdirSync(RENDERS_DIR, { recursive: true });
fs.mkdirSync(AUDIO_DIR, { recursive: true });
fs.mkdirSync(PHOTOS_DIR, { recursive: true });

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
    const charTimes = data.alignment?.character_start_times_seconds || [];
    const charEndTimes = data.alignment?.character_end_times_seconds || [];

    const fullText = text;
    const sentences = fullText.split(/(?<=[.!?\n])\s*/).filter((s) => s.trim().length > 0);
    let charIndex = 0;
    const phraseTimestamps = sentences.map((sentence) => {
      const startTime = charTimes[charIndex] || 0;
      const endIndex = Math.min(charIndex + sentence.length - 1, charTimes.length - 1);
      const endTime = charEndTimes[endIndex] || startTime + 2;
      charIndex += sentence.length + 1;
      return {
        phrase: sentence.trim(),
        startFrame: Math.round(startTime * fps),
        endFrame: Math.round(endTime * fps),
        durationFrames: Math.round((endTime - startTime) * fps),
      };
    });

    const durationSeconds = charEndTimes[charEndTimes.length - 1] || 30;

    res.json({ audioUrl, durationSeconds, phraseTimestamps });
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
  const jobId = uuidv4();
  const {
    scenes,
    sceneDurations,
    totalFrames,
    format,
    audioUrl,
    musicUrl,
    musicVolume,
    prompt,
    duration,
    accentColor,
    formatName,
  } = req.body;

  const outPath = path.join(RENDERS_DIR, `${jobId}.mp4`);
  const metaPath = path.join(RENDERS_DIR, `${jobId}.meta.json`);

  fs.writeFileSync(
    metaPath,
    JSON.stringify({
      prompt,
      format,
      duration,
      accentColor,
      formatName,
    })
  );

  const inputProps = {
    scenes,
    sceneDurations,
    totalFrames,
    format: format || "9:16",
    audioSrc: audioUrl || null,
    musicSrc: musicUrl || null,
    musicVolume: musicVolume || 0.07,
  };

  (async () => {
    try {
      console.log("📐 Props totalFrames:", inputProps.totalFrames);
      console.log("📐 Expected duration:", inputProps.totalFrames / 60, "seconds");

      const { renderMedia, selectComposition } = require("@remotion/renderer");

      const bundleLocation = await getBundleLocation();

      const totalFrames = inputProps.totalFrames || 1800;

      const renderInputProps = {
        ...inputProps,
        totalFrames,
        audioSrc: inputProps.audioSrc?.startsWith("http")
          ? inputProps.audioSrc
          : inputProps.audioSrc
            ? `${process.env.RENDER_SERVER_URL}${inputProps.audioSrc}`
            : null,
        musicSrc: inputProps.musicSrc?.startsWith("http")
          ? inputProps.musicSrc
          : inputProps.musicSrc
            ? `${process.env.RENDER_SERVER_URL}${inputProps.musicSrc}`
            : null,
      };

      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: "MotionVideo",
        inputProps: renderInputProps,
      });

      composition.durationInFrames = totalFrames;
      console.log(
        "📐 Final duration:",
        composition.durationInFrames,
        "frames =",
        composition.durationInFrames / 60,
        "seconds"
      );

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
          ],
        },
        concurrency: 1,
        crf: 22,
        pixelFormat: "yuv420p",
        onProgress: ({ progress }) => {
          console.log(`📊 Render progress: ${Math.round(progress * 100)}%`);
        },
      });

      console.log("✅ Render done:", jobId);
    } catch (err) {
      console.error("❌ Render error:", err.message);
      fs.writeFileSync(
        path.join(RENDERS_DIR, `${jobId}.error`),
        err.message
      );
    }
  })();

  res.json({ jobId });
});

// ── Status rendu ──────────────────────────────────────
app.get("/render/:jobId", (req, res) => {
  const { jobId } = req.params;
  const outPath = path.join(RENDERS_DIR, `${jobId}.mp4`);
  const errPath = path.join(RENDERS_DIR, `${jobId}.error`);

  console.log("🔍 Checking render:", jobId);
  console.log("🔍 File exists:", fs.existsSync(outPath));

  if (fs.existsSync(errPath)) {
    const err = fs.readFileSync(errPath, "utf-8");
    console.log("❌ Error file:", err);
    return res.json({ status: "error", error: err });
  }

  if (fs.existsSync(outPath)) {
    const videoUrl = `${process.env.RENDER_SERVER_URL}/video/${jobId}.mp4`;
    console.log("✅ Video URL:", videoUrl);
    return res.json({ status: "done", videoUrl });
  }

  console.log("⏳ Still rendering...");
  res.json({ status: "rendering" });
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
app.listen(PORT, () => console.log(`🎬 Render server on port ${PORT}`));
