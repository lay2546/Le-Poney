
import fs from 'fs';
import express from 'express';
import multer from 'multer';
import { google } from 'googleapis';

const app = express();
const port = 3000;
const upload = multer({ dest: 'uploads/' });

// โหลด credentials และ auth
const credentials = JSON.parse(fs.readFileSync('credentials.json'));
const { client_id, client_secret, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// 🔐 โหลด token ที่ได้จากการ auth (คุณต้องสร้าง token.json หลัง auth ครั้งแรก)
oAuth2Client.setCredentials(JSON.parse(fs.readFileSync('token.json')));

const drive = google.drive({ version: 'v3', auth: oAuth2Client });

app.post('/upload', upload.single('image'), async (req, res) => {
  const fileMetadata = {
    name: req.file.originalname,
    parents: ['YOUR_FOLDER_ID'] // 👈 เปลี่ยนเป็นโฟลเดอร์ที่คุณสร้างไว้ใน Google Drive
  };
  const media = {
    mimeType: req.file.mimetype,
    body: fs.createReadStream(req.file.path)
  };

  try {
    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id'
    });

    const fileId = file.data.id;

    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    const publicUrl = `https://drive.google.com/uc?id=${fileId}`;
    res.send(`<h2>✅ Upload สำเร็จ</h2><img src="${publicUrl}" width="300"><br><p>ลิงก์: ${publicUrl}</p>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('เกิดข้อผิดพลาด');
  }
});

app.listen(port, () => {
  console.log(`🚀 Server started at http://localhost:${port}`);
});
