// AI Voiceover API — Node.js 18+, ไม่ต้องใช้ API key
// POST /api/tts  {text, voice, speed}  ->  audio/mpeg
const http = require('http');
const fs = require('fs');
const path = require('path');
const { MsEdgeTTS, OUTPUT_FORMAT } = require('msedge-tts');

const PORT = process.env.PORT || 3000;
const ORIGIN = process.env.ALLOW_ORIGIN || '*'; // ถ้าโฮสต์หน้าเว็บคนละโดเมน ให้ใส่โดเมนนั้น
const MAX_CHARS = 5000;

// id ตรงกับ VOICES ใน public/index.html — เพิ่มเสียงใหม่ได้ที่นี่
const VOICES = {
  'th-f': 'th-TH-PremwadeeNeural',
  'th-m': 'th-TH-NiwatNeural',
  'en-f': 'en-US-JennyNeural',
  'en-m': 'en-US-GuyNeural',
};

async function synth(text, voice, speed) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const pct = Math.round((speed - 1) * 100);
  const r = await tts.toStream(text, { rate: `${pct >= 0 ? '+' : ''}${pct}%` });
  const stream = r.audioStream || r; // รองรับ msedge-tts หลายเวอร์ชัน
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

function readBody(req) {
  return new Promise((ok, no) => {
    let b = '';
    req.on('data', (c) => { b += c; if (b.length > 2e5) { no(new Error('too big')); req.destroy(); } });
    req.on('end', () => ok(b));
    req.on('error', no);
  });
}

const send = (res, code, body, type = 'application/json') => {
  res.writeHead(code, {
    'Content-Type': type,
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  });
  res.end(body);
};

http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  if (req.method === 'OPTIONS') return send(res, 204, '');

  if (req.method === 'POST' && url === '/api/tts') {
    try {
      const { text, voice, speed } = JSON.parse(await readBody(req));
      const v = VOICES[voice];
      const rate = Number(speed) || 1;
      if (!v) return send(res, 400, JSON.stringify({ error: 'unknown voice' }));
      if (typeof text !== 'string' || !text.trim()) return send(res, 400, JSON.stringify({ error: 'empty text' }));
      if (text.length > MAX_CHARS) return send(res, 413, JSON.stringify({ error: `max ${MAX_CHARS} chars` }));
      if (rate < 0.5 || rate > 2) return send(res, 400, JSON.stringify({ error: 'bad speed' }));
      const clean = text.replace(/[<>]/g, ' ').replace(/&/g, ' and '); // กันอักขระที่ทำให้ SSML พัง
      const mp3 = await synth(clean, v, rate);
      return send(res, 200, mp3, 'audio/mpeg');
    } catch (e) {
      console.error(e);
      return send(res, 500, JSON.stringify({ error: 'tts failed' }));
    }
  }

  if (req.method === 'GET' && (url === '/' || url === '/index.html')) {
    return send(res, 200, fs.readFileSync(path.join(__dirname, 'public', 'index.html')), 'text/html; charset=utf-8');
  }
  if (url === '/health') return send(res, 200, '{"ok":true}');
  send(res, 404, '{"error":"not found"}');
}).listen(PORT, () => console.log(`AI Voiceover running → http://localhost:${PORT}`));
