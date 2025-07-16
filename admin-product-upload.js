import { db, storage, auth } from './firebase.js';
import {
  collection, addDoc, updateDoc, getDoc, doc,
  serverTimestamp, onSnapshot, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const form = document.getElementById('product-form');
const status = document.getElementById('status');
const productList = document.getElementById('product-list');
const editIdInput = document.getElementById('edit-id');
const submitBtn = document.getElementById('submit-button');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;

  const name = document.getElementById('name').value.trim();
  const price = parseFloat(document.getElementById('price').value);
  const category = document.getElementById('category').value;
  const imageFile = document.getElementById('image').files[0];
  const editId = editIdInput.value;

  if (!name || !price || !category) {
    status.textContent = "❌ กรุณากรอกข้อมูลให้ครบถ้วน";
    submitBtn.disabled = false;
    return;
  }

  // ✅ เช็กขนาดไฟล์ (สูงสุด 2MB)
  if (imageFile && imageFile.size > 2 * 1024 * 1024) {
    status.textContent = "❌ ไฟล์รูปใหญ่เกินไป (สูงสุด 2 MB)";
    submitBtn.disabled = false;
    return;
  }

  status.textContent = "⏳ กำลังบันทึก...";
  console.log("🚀 เริ่มกระบวนการบันทึก");

  try {
    let imageUrl = null;
    let imagePath = null;

    if (imageFile) {
      imagePath = `products/${Date.now()}_${imageFile.name}`;
      const imageRef = ref(storage, imagePath);
      console.log("📤 กำลังอัปโหลดไฟล์...");
      await uploadBytes(imageRef, imageFile);
      console.log("✅ อัปโหลดเสร็จแล้ว");
      imageUrl = await getDownloadURL(imageRef);
      console.log("✅ ได้ URL รูปแล้ว");
    }

    if (editId) {
      const productRef = doc(db, "products", editId);
      const existing = await getDoc(productRef);

      const updateData = {
        name,
        price,
        category,
        updatedAt: serverTimestamp()
      };

      if (imageUrl) {
        updateData.imageUrl = imageUrl;
        updateData.imagePath = imagePath;

        if (existing.exists() && existing.data().imagePath) {
          console.log("🗑️ ลบรูปเก่าออกจาก Storage");
          await deleteObject(ref(storage, existing.data().imagePath));
        }
      }

      console.log("✏️ กำลังแก้ไขสินค้าใน Firestore...");
      await updateDoc(productRef, updateData);
      console.log("✅ แก้ไขสินค้าเรียบร้อย");
      status.textContent = "✅ แก้ไขสินค้าสำเร็จ!";
    } else {
      console.log("➕ กำลังเพิ่มสินค้าใหม่...");
      await addDoc(collection(db, "products"), {
        name,
        price,
        category,
        imageUrl,
        imagePath,
        createdAt: serverTimestamp(),
      });
      console.log("✅ เพิ่มสินค้าเรียบร้อย");
      status.textContent = "✅ เพิ่มสินค้าสำเร็จ!";
    }

    form.reset();
    editIdInput.value = "";
    submitBtn.textContent = "✅ เพิ่มสินค้า";
  } catch (err) {
    console.error(err);
    status.textContent = "❌ ผิดพลาด: " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

// 📦 โหลดสินค้าแบบเรียลไทม์ พร้อมรูป
const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

onSnapshot(q, (snapshot) => {
  productList.innerHTML = "";
  snapshot.forEach((docSnap) => {
    const item = docSnap.data();
    const li = document.createElement("li");
    li.className = "bg-white p-4 rounded shadow flex items-center gap-4";

    li.innerHTML = `
      <img src="${item.imageUrl || 'รูป/default.jpg'}" alt="${item.name}" class="w-20 h-20 object-cover rounded" />
      <div class="flex-1">
        <p class="font-bold">${item.name}</p>
        <p class="text-sm text-gray-600">
          ราคา: ฿${item.price} (${item.category || "ไม่ระบุหมวด"})
        </p>
      </div>
      <div class="flex gap-2">
        <button data-id="${docSnap.id}" class="edit-btn bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">แก้ไข</button>
        <button data-id="${docSnap.id}" data-path="${item.imagePath}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">ลบ</button>
      </div>
    `;
    productList.appendChild(li);
  });
});

productList.addEventListener("click", async (e) => {
  const id = e.target.dataset.id;
  const path = e.target.dataset.path;

  if (e.target.classList.contains("delete-btn")) {
    if (confirm("ต้องการลบสินค้านี้ใช่ไหม?")) {
      try {
        console.log("🗑️ กำลังลบสินค้า...");
        await deleteDoc(doc(db, "products", id));
        if (path) {
          console.log("🗑️ กำลังลบรูปจาก Storage...");
          await deleteObject(ref(storage, path));
        }
        console.log("✅ ลบเสร็จแล้ว");
      } catch (err) {
        alert("❌ ลบไม่สำเร็จ: " + err.message);
      }
    }
  }

  if (e.target.classList.contains("edit-btn")) {
    console.log("✏️ ดึงข้อมูลสินค้าเพื่อแก้ไข...");
    const productRef = doc(db, "products", id);
    const productSnap = await getDoc(productRef);
    if (productSnap.exists()) {
      const product = productSnap.data();
      document.getElementById('name').value = product.name;
      document.getElementById('price').value = product.price;
      document.getElementById('category').value = product.category || "";
      editIdInput.value = id;
      submitBtn.textContent = "💾 บันทึกการแก้ไข";
      window.scrollTo({ top: 0, behavior: 'smooth' });
      console.log("✅ โหลดข้อมูลสินค้าเรียบร้อย");
    }
  }
});

