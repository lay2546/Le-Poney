
import { db } from "./firebase.js";
import {
  collection, query, where, onSnapshot, doc, getDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const productList = document.getElementById("product-list");

const q = query(collection(db, "products"), where("category", "==", "smoothie"));

onSnapshot(q, (snapshot) => {
  productList.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className = "product-card";
    div.innerHTML = `
      <img src="${data.imageUrl}" class="product-img" alt="${data.name}" />
      <h3 class="product-title">${data.name}</h3>
      <p class="product-price">฿${data.price}</p>
      <p class="text-sm ${data.quantity === 0 ? 'text-red-500' : 'text-gray-600'}">
        ${data.quantity === 0 ? '❌ สินค้าหมด' : 'คงเหลือ: ' + data.quantity}
      </p>
      <button class="add-to-cart mt-1"
        data-id="${docSnap.id}"
        data-name="${data.name}"
        data-price="${data.price}"
        data-stock="${data.quantity}"
        ${data.quantity === 0 ? 'disabled class="opacity-50 cursor-not-allowed"' : ''}>
        🛒 หยิบใส่ตะกร้า
      </button>
    `;
    productList.appendChild(div);
  });
});

document.addEventListener("click", async (e) => {
  if (!e.target.classList.contains("add-to-cart")) return;

  const button = e.target;
  const productId = button.dataset.id;
  const name = button.dataset.name;
  const price = parseFloat(button.dataset.price);

  const productRef = doc(db, "products", productId);
  const productSnap = await getDoc(productRef);

  if (!productSnap.exists()) {
    showToast(`❌ ไม่พบสินค้า ${name}`);
    return;
  }

  const product = productSnap.data();
  if (product.quantity <= 0) {
    showToast(`❌ ${name} สินค้าหมด`);
    return;
  }

  const newStock = product.quantity - 1;
  
    await updateDoc(productRef, { quantity: newStock });
    const revert = JSON.parse(localStorage.getItem("revertStock")) || [];
    revert.push({ id: productId, revert: 1 });
    localStorage.setItem("revertStock", JSON.stringify(revert));
    

  const cart = JSON.parse(localStorage.getItem("cart")) || [];
  const existing = cart.find(item => item.id === productId);

  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id: productId, name, price, quantity: 1, stock: newStock });
  }

  if (newStock <= 0) {
    button.disabled = true;
    button.classList.add("opacity-50", "cursor-not-allowed");
    button.previousElementSibling.textContent = "❌ สินค้าหมด";
    button.previousElementSibling.classList.remove("text-gray-600");
    button.previousElementSibling.classList.add("text-red-500");
  } else {
    button.dataset.stock = newStock;
  }
});

function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-message fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-pink-600 text-white px-4 py-2 rounded shadow z-50 transition-opacity duration-300 opacity-0";
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add("opacity-100"), 10);
  setTimeout(() => toast.classList.remove("opacity-100"), 2500);
  setTimeout(() => toast.remove(), 3000);
}

window.addEventListener("beforeunload", async () => {
  const reverted = JSON.parse(localStorage.getItem("revertStock")) || [];
  for (const item of reverted) {
    const productRef = doc(db, "products", item.id);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) continue;
    const current = productSnap.data().quantity || 0;
    await updateDoc(productRef, { quantity: current + item.revert });
  }
  localStorage.removeItem("revertStock");
});



// ✅ คืน stock ทันทีเมื่อกดปุ่ม "ยกเลิกทั้งหมด"
const cancelAllBtn = document.getElementById("cancel-all");
cancelAllBtn?.addEventListener("click", async () => {
  const reverted = JSON.parse(localStorage.getItem("revertStock")) || [];
  for (const item of reverted) {
    const productRef = doc(db, "products", item.id);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) continue;
    const current = productSnap.data().quantity || 0;
    await updateDoc(productRef, { quantity: current + item.revert });
  }
  alert(`✅ คืนสินค้า ${reverted.length} รายการเรียบร้อย`);
  localStorage.removeItem("revertStock");
});

// ✅ ล้าง revertStock อัตโนมัติหลัง 15 นาที (900,000 ms)
setTimeout(() => {
  localStorage.removeItem("revertStock");
}, 60000);

// ✅ แสดงจำนวนที่ถูกคืนบนหน้า
window.addEventListener("DOMContentLoaded", () => {
  const reverted = JSON.parse(localStorage.getItem("revertStock")) || [];
  const revertDisplay = document.getElementById("revert-status");
  if (revertDisplay && reverted.length > 0) {
    revertDisplay.textContent = `📦 มีสินค้า ${reverted.length} รายการที่รอคืน`;
    revertDisplay.classList.remove("hidden");
  }
});

