
const form = document.getElementById('product-form');
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const submitBtn = document.getElementById('submit-button');
  submitBtn.disabled = true;

  const name = document.getElementById('name').value.trim();
  const price = parseFloat(document.getElementById('price').value);
  const category = document.getElementById('category').value;
  const imageFile = document.getElementById('image').files[0];

  if (!name || !price || !category || !imageFile) {
    alert("❗ กรุณากรอกข้อมูลให้ครบทุกช่องและเลือกรูปภาพ");
    submitBtn.disabled = false;
    return;
  }

  try {
    const formData = new FormData();
    formData.append("image", imageFile);

    // ✅ Upload image to local Node.js server
    const uploadRes = await fetch("http://localhost:3000/upload", {
      method: "POST",
      body: formData
    });

    const uploadData = await uploadRes.json();
    if (!uploadData.success) throw new Error("อัปโหลดรูปไม่สำเร็จ");

    const imageUrl = uploadData.url;

    // ✅ Add product to Firestore
    await addDoc(collection(db, "products"), {
      name,
      price,
      category,
      imageUrl,
      createdAt: serverTimestamp()
    });

    alert("✅ เพิ่มสินค้าเรียบร้อยแล้ว!");
    form.reset();
  } catch (err) {
    console.error("❌ Error:", err);
    alert("❌ เพิ่มสินค้าไม่สำเร็จ");
  } finally {
    submitBtn.disabled = false;
  }
});
