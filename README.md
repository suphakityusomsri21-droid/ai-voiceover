# AI Voiceover — คู่มือติดตั้ง

## โครงสร้าง
```
voiceover/
├─ server.js          ← API แปลงข้อความเป็น MP3 (+ เสิร์ฟหน้าเว็บ)
├─ package.json
└─ public/index.html  ← หน้าเว็บ (ตั้ง API_URL = '/api/tts' ไว้แล้ว)
```

## ติดตั้ง (เครื่องตัวเอง)
1. ติดตั้ง Node.js 18 ขึ้นไป จาก https://nodejs.org
2. เปิด Terminal ในโฟลเดอร์ `voiceover` แล้วรัน
   ```
   npm install
   npm start
   ```
3. เปิด http://localhost:3000 → พิมพ์ข้อความ → Generate → Download MP3

ทดสอบ API ตรง ๆ:
```
curl -X POST http://localhost:3000/api/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"สวัสดีครับ ทดสอบเสียง","voice":"th-m","speed":1.0}' \
  -o test.mp3
```

## ขึ้นออนไลน์
- **Render / Railway / Fly.io**: อัปโหลดโฟลเดอร์ขึ้น GitHub → สร้าง Web Service
  Build: `npm install` · Start: `npm start` (ระบบกำหนด PORT ให้เอง)
- **VPS**: `npm install` แล้วรันด้วย `pm2 start server.js --name voiceover` และใส่ HTTPS ด้วย Nginx/Caddy

## แยกหน้าเว็บกับ API คนละที่
- ใน `index.html` แก้เป็น `const API_URL = 'https://api.ของคุณ.com/api/tts';`
- ตั้งค่า environment บนเซิร์ฟเวอร์: `ALLOW_ORIGIN=https://เว็บของคุณ.com`

## เพิ่ม / เปลี่ยนเสียง
1. เพิ่มในรายการ `VOICES` ของ `server.js` เช่น `'th-f2': 'th-TH-AcharaNeural'` (ชื่อเสียงของ Microsoft Edge TTS)
2. เพิ่มรายการเดียวกัน (id เดียวกัน) ใน `VOICES` ของ `public/index.html`

## ข้อควรทราบ
- `msedge-tts` ใช้บริการอ่านออกเสียงของ Microsoft Edge แบบไม่เป็นทางการ ฟรีและไม่ต้องมี key เหมาะกับใช้ส่วนตัว/ทดลอง ถ้าจะทำเชิงพาณิชย์หรือคนใช้เยอะ ควรเปลี่ยนฟังก์ชัน `synth()` ไปใช้ Azure Speech หรือ Google Cloud Text-to-Speech (บริการทางการ)
- จำกัดข้อความ 5,000 ตัวอักษรต่อครั้ง (แก้ `MAX_CHARS` ได้) ข้อความยาวให้แบ่งเป็นหลาย Scene
- ถ้าเปิดสาธารณะ ควรเพิ่ม rate limit หรือรหัสผ่านก่อน เพื่อกันคนอื่นใช้โควตาเซิร์ฟเวอร์
