// product-smoothie.js
import { db } from "./firebase.js";
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const productList = document.getElementById("product-list");

const q = query(collection(db, "products"), where("category", "==", "smoothie")); // ✅ หมวด smoothie

onSnapshot(q, (snapshot) => {
  productList.innerHTML = "";
  snapshot.forEach(doc => {
    const data = doc.data();
    const div = document.createElement("div");
    div.className = "product-card"; // ใช้คลาสเดียวกันกับ bakery
    div.innerHTML = `
      <img src="${data.imageUrl}" class="product-img" alt="${data.name}" />
      <h3 class="product-title">${data.name}</h3>
      <p class="product-price">฿${data.price}</p>
      <button class="add-to-cart" data-name="${data.name}" data-price="${data.price}">
        🛒 หยิบใส่ตะกร้า
      </button>
    `;
    productList.appendChild(div);
  });
});


// 🛒 เพิ่มสินค้าใส่ตะกร้า พร้อม Toast
document.addEventListener("click", (e) => {
  if (e.target.classList.contains("add-to-cart")) {
    const name = e.target.dataset.name;
    const price = parseFloat(e.target.dataset.price);
    const cart = JSON.parse(localStorage.getItem("cart")) || [];

    const existing = cart.find(item => item.name === name);
    if (existing) {
      existing.quantity += 1;
    } else {
      cart.push({ name, price, quantity: 1 });
    }

    localStorage.setItem("cart", JSON.stringify(cart));

    showToast(`🛒 เพิ่ม ${name} ลงตะกร้าแล้ว`);
  }
});

// ✅ ฟังก์ชันแสดง Toast
function showToast(message) {
  const toast = document.createElement("div");
  toast.className = "toast-message";
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => toast.classList.add("show"), 10); // fade in
  setTimeout(() => toast.classList.remove("show"), 2500); // fade out
  setTimeout(() => toast.remove(), 3000); // remove element
}
