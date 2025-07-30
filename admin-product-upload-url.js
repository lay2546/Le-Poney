import { db } from './firebase.js';
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, getDoc, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// ฟังก์ชันหักสต็อกสินค้า
export async function deductStock(productId, quantityToDeduct) {
  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);
  if (!productSnap.exists()) throw new Error("สินค้าไม่พบ");
  const currentQuantity = productSnap.data().quantity ?? 0;
  if (currentQuantity < quantityToDeduct) {
    throw new Error("จำนวนสินค้าที่ขอสั่งเกินจากจำนวนคงเหลือ");
  }
  const newQuantity = currentQuantity - quantityToDeduct;
  await updateDoc(productRef, { quantity: newQuantity });
}

const form = document.getElementById('product-form');
const status = document.getElementById('status');
const productList = document.getElementById('product-list');
const editIdInput = document.getElementById('edit-id');
const submitButton = document.querySelector('button[type="submit"]');
const filterSelect = document.getElementById('filter-category');
const sortSelect = document.getElementById('sort-select');
const imageUrlInput = document.getElementById('imageUrlInput');
const imageFileInput = document.getElementById('imageFileInput');
const hiddenImageUrl = document.getElementById('imageUrl');
const imagePreview = document.getElementById('imagePreview');

let allProducts = [];

editIdInput.addEventListener('input', () => {
  submitButton.textContent = editIdInput.value
    ? "✏️ บันทึกการแก้ไข"
    : "✅ เพิ่มสินค้า";
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitButton.disabled = true;

  const name = document.getElementById('name').value.trim();
  const price = parseFloat(document.getElementById('price').value);
  const category = document.getElementById('category').value;
  const quantity = parseInt(document.getElementById('quantity').value);
  const imageUrl = hiddenImageUrl?.value.trim();
  const editId = editIdInput.value;

  if (!name || !price || isNaN(quantity)) {
    status.textContent = "❗ กรุณากรอกชื่อ ราคา และจำนวนสินค้า";
    submitButton.disabled = false;
    return;
  }

  try {
    if (editId) {
      await updateDoc(doc(db, "products", editId), {
        name, price, category, imageUrl, quantity,
        updatedAt: serverTimestamp()
      });
      status.textContent = "✅ แก้ไขสินค้าสำเร็จ";
    } else {
      await addDoc(collection(db, "products"), {
        name, price, category, imageUrl, quantity,
        createdAt: serverTimestamp()
      });
      status.textContent = "✅ เพิ่มสินค้าสำเร็จ";
    }

    form.reset();
    editIdInput.value = "";
    imagePreview.classList.add("hidden");
  } catch (error) {
    status.textContent = "❌ เกิดข้อผิดพลาด: " + error.message;
  }

  submitButton.disabled = false;
});

onSnapshot(collection(db, "products"), (snapshot) => {
  allProducts = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));
  renderFiltered();
});

filterSelect?.addEventListener("change", renderFiltered);
sortSelect?.addEventListener("change", renderFiltered);

function renderFiltered() {
  const category = filterSelect?.value || "all";
  let filtered = category === "all"
    ? allProducts
    : allProducts.filter(p => p.category === category);

  const sortValue = sortSelect?.value;
  if (sortValue === "price") {
    filtered.sort((a, b) => a.price - b.price);
  } else if (sortValue === "quantity") {
    filtered.sort((a, b) => (b.quantity ?? 0) - (a.quantity ?? 0));
  } else {
    filtered.sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0));
  }

  renderProducts(filtered);
}

function renderProducts(products) {
  productList.innerHTML = "";

  products.forEach(data => {
    const li = document.createElement("li");
    const isOutOfStock = (data.quantity ?? 0) <= 0;
    li.className = `bg-white p-4 rounded shadow flex items-center justify-between space-x-4 mt-2 ${isOutOfStock ? 'opacity-60' : ''}`;
    li.innerHTML = `
      <div class="flex items-center space-x-4">
        <img src="${data.imageUrl}" alt="${data.name}" class="w-20 h-20 object-cover rounded">
        <div>
          <p class="font-bold">${data.name}</p>
          <p class="text-sm text-gray-600">฿${data.price}</p>
          <p class="text-sm ${isOutOfStock ? 'text-red-500 font-bold' : 'text-gray-600'}">
            ${isOutOfStock ? '❗ สินค้าหมด' : `เหลือ: ${data.quantity} ชิ้น`}
          </p>
        </div>
      </div>
      <div class="space-x-2">
        <button class="edit-btn bg-yellow-500 text-white px-3 py-1 rounded" data-id="${data.id}">✏️ แก้ไข</button>
        <button class="delete-btn bg-red-600 text-white px-3 py-1 rounded" data-id="${data.id}">🗑 ลบ</button>
      </div>
    `;
    productList.appendChild(li);
  });

  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const docRef = doc(db, "products", id);
      const docSnap = await getDoc(docRef);
      const data = docSnap.data();

      document.getElementById("name").value = data.name;
      document.getElementById("price").value = data.price;
      document.getElementById("category").value = data.category;
      document.getElementById("quantity").value = data.quantity ?? 0;
      imageUrlInput.value = data.imageUrl;
      hiddenImageUrl.value = data.imageUrl;
      imagePreview.src = data.imageUrl;
      imagePreview.classList.remove("hidden");
      editIdInput.value = id;
      status.textContent = "📝 กำลังแก้ไขสินค้า...";
    });
  });

  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (confirm("คุณต้องการลบสินค้านี้หรือไม่?")) {
        await deleteDoc(doc(db, "products", id));
        alert("✅ ลบสินค้าแล้ว");
      }
    });
  });
}

imageUrlInput?.addEventListener('input', () => {
  const url = imageUrlInput.value.trim();
  if (url.match(/^https?:\/\/.*\.(jpg|jpeg|png|gif|webp)$/i)) {
    hiddenImageUrl.value = url;
    imagePreview.src = url;
    imagePreview.classList.remove("hidden");
    imageFileInput.value = "";
  } else {
    imagePreview.classList.add("hidden");
  }
});

imageFileInput?.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (file) {
    imageUrlInput.value = "";
    try {
      const url = await uploadImageToCloudinary(file);
      hiddenImageUrl.value = url;
      imagePreview.src = url;
      imagePreview.classList.remove("hidden");
    } catch (error) {
      alert("❌ อัปโหลดรูปภาพไม่สำเร็จ: " + error.message);
    }
  }
});

async function uploadImageToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append("upload_preset", "upload-slip");
  const response = await fetch('https://api.cloudinary.com/v1_1/dpgru06ox/image/upload', {
    method: 'POST',
    body: formData
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Upload failed");
  return data.secure_url;
}
