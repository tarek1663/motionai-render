// Ajouter le chemin des modules
require("module").globalPaths.push("/app/render-server/node_modules");

console.log("📁 Current directory:", __dirname);
console.log("📁 Files:", require("fs").readdirSync(__dirname));

const express = require("express");
const cors = require("cors");
const { exec } = require("child_process");
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
          voice_settings: { stability: 0.5, similarity_boost: 0.75 },
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

    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=portrait`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );

    const data = await response.json();
    const photo = data.photos?.[0];
    if (!photo) return res.json({ photoUrl: null });

    const photoResponse = await fetch(photo.src.large);
    const photoBuffer = Buffer.from(await photoResponse.arrayBuffer());
    const photoFileName = `${uuidv4()}.jpg`;
    const photoPath = path.join(PHOTOS_DIR, photoFileName);
    fs.writeFileSync(photoPath, photoBuffer);

    const photoUrl = `${process.env.RENDER_SERVER_URL}/photos/${photoFileName}`;
    res.json({ photoUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
  const propsPath = path.join(RENDERS_DIR, `${jobId}.props.json`);

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

  fs.writeFileSync(
    propsPath,
    JSON.stringify({
      scenes,
      sceneDurations,
      totalFrames,
      format: format || "9:16",
      audioSrc: audioUrl || null,
      musicSrc: musicUrl || null,
      musicVolume: musicVolume || 0.07,
    })
  );

  const getDimensions = (fmt) => {
    if (fmt === "16:9") return { width: 1920, height: 1080 };
    if (fmt === "1:1") return { width: 1080, height: 1080 };
    return { width: 1080, height: 1920 };
  };
  const { width, height } = getDimensions(format || "9:16");

  const rootPath = path.join(__dirname, "remotion", "Root.tsx");

  const cmd = [
    "npx --yes remotion@4.0.305 render",
    `"${rootPath}"`,
    "MotionVideo",
    `"${outPath}"`,
    `--props="${propsPath}"`,
    `--width=${width}`,
    `--height=${height}`,
    "--codec=h264",
    "--crf=18",
  ].join(" ");

  exec(
    cmd,
    {
      cwd: path.join(__dirname, ".."),
      maxBuffer: 1024 * 1024 * 500,
      env: {
        ...process.env,
        NODE_ENV: "production",
      },
    },
    (err) => {
      if (err) {
        console.error("Render error:", err.message);
        fs.writeFileSync(path.join(RENDERS_DIR, `${jobId}.error`), err.message);
      }
    }
  );

  res.json({ jobId });
});

// ── Status rendu ──────────────────────────────────────
app.get("/render/:jobId", (req, res) => {
  const { jobId } = req.params;
  const outPath = path.join(RENDERS_DIR, `${jobId}.mp4`);
  const errPath = path.join(RENDERS_DIR, `${jobId}.error`);

  if (fs.existsSync(errPath)) {
    return res.json({ status: "error", error: fs.readFileSync(errPath, "utf-8") });
  }
  if (fs.existsSync(outPath)) {
    return res.json({
      status: "done",
      videoUrl: `${process.env.RENDER_SERVER_URL}/video/${jobId}.mp4`,
    });
  }
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
app.use("/music", express.static(path.join(__dirname, "..", "public", "music")));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🎬 Render server on port ${PORT}`));
