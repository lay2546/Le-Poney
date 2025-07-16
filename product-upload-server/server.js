import fs from "fs";
const dataFile = path.join(__dirname, "data/products.json");

// 📤 รับการอัปโหลด
app.post("/upload", upload.single("image"), (req, res) => {
  const imageUrl = `/images/${req.file.filename}`;
  const name = req.body.name;
  const price = parseFloat(req.body.price);

  const newProduct = {
    name,
    price,
    imageUrl,
    createdAt: new Date().toISOString()
  };

  // 📄 อ่านไฟล์เดิมแล้วเพิ่มใหม่
  let products = [];
  if (fs.existsSync(dataFile)) {
    const raw = fs.readFileSync(dataFile);
    products = JSON.parse(raw);
  }
  products.push(newProduct);
  fs.writeFileSync(dataFile, JSON.stringify(products, null, 2));

  res.send(`
    <h2>✅ บันทึกสินค้าเรียบร้อย</h2>
    <img src="${imageUrl}" width="250"><br>
    <p>ชื่อ: ${name}</p>
    <p>ราคา: ${price} บาท</p>
    <p><a href="/">🔙 กลับ</a> | <a href="/products">📋 ดูรายการสินค้า</a></p>
  `);
});
app.get("/products", (req, res) => {
  if (!fs.existsSync(dataFile)) return res.send("<p>ยังไม่มีสินค้า</p>");

  const products = JSON.parse(fs.readFileSync(dataFile));
  const html = `
    <h1>📋 รายการสินค้า</h1>
    <table border="1" cellpadding="10">
      <tr><th>รูป</th><th>ชื่อสินค้า</th><th>ราคา</th><th>วันที่</th></tr>
      ${products.map(p => `
        <tr>
          <td><img src="${p.imageUrl}" width="100"></td>
          <td>${p.name}</td>
          <td>${p.price} บาท</td>
          <td>${new Date(p.createdAt).toLocaleString()}</td>
        </tr>`).join("")}
    </table>
    <p><a href="/">➕ เพิ่มสินค้าใหม่</a></p>
  `;
  res.send(html);
});
