// 📦 แสดงสินค้าแบบ real-time ในหน้า Product.html / Product2.html
import { db } from './firebase.js';
import { collection, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const productGrid = document.querySelector(".product-grid");
  if (!productGrid) return;

  const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

  onSnapshot(q, (snapshot) => {
    productGrid.innerHTML = "";
    snapshot.forEach((doc) => {
      const product = doc.data();
      const card = document.createElement("div");
      card.className = "product-card";
      card.innerHTML = `
        <img src="${product.imageUrl}" class="product-img" alt="${product.name}">
        <div class="product-body">
          <h5 class="product-title">${product.name}</h5>
          <p class="product-price">฿${product.price} / ชิ้น</p>
          <button class="add-to-cart" data-name="${product.name}" data-price="${product.price}">เพิ่มลงตะกร้า</button>
        </div>
      `;
      productGrid.appendChild(card);
    });
  });
});
