
// 📁 upload.js (Node.js Express + Multer สำหรับอัปโหลดรูปภาพ)

import express from 'express';
import multer from 'multer';
import path from 'path';
import cors from 'cors';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('uploads'));

// 📦 ตั้งค่าเก็บไฟล์ลงโฟลเดอร์ uploads/
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '_' + file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix);
  }
});

const upload = multer({ storage });

// ✅ เส้นทางอัปโหลดรูปภาพ
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const imageUrl = `${req.protocol}://${req.get('host')}/${req.file.filename}`;
  res.json({ success: true, url: imageUrl });
});

// 🚀 เริ่มเซิร์ฟเวอร์
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
