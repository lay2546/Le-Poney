// 👉 นำเข้า Firebase config ที่เชื่อมกับ Firestore และ Authentication
import { db, auth } from './firebase.js';

// 👉 นำเข้าเมธอดที่ใช้จัดการ Firestore (เพิ่มข้อมูล, อ่านข้อมูล, สร้าง query ฯลฯ)
import {
  collection, addDoc, serverTimestamp, getDoc, doc, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 👉 ใช้สำหรับตรวจสอบสถานะการล็อกอินของผู้ใช้
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// 👉 รอให้โหลด DOM เสร็จเรียบร้อยก่อนเริ่มทำงาน
document.addEventListener("DOMContentLoaded", () => {

  // 🔹 จัดการ Sidebar
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-btn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  // 👉 แสดง/ซ่อน Sidebar
  menuBtn?.addEventListener("click", () => toggleSidebar(true));
  closeBtn?.addEventListener("click", () => toggleSidebar(false));
  overlay?.addEventListener("click", () => toggleSidebar(false));

  function toggleSidebar(show) {
    sidebar?.classList.toggle("show", show);
    overlay?.classList.toggle("show", show);
  }

  // 🔹 เมนู Dropdown
  document.querySelectorAll(".dropdown-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dropdownContent = btn.nextElementSibling;
      dropdownContent?.classList.toggle("show");
    });
  });

  // 🔹 จัดการการล็อกอิน/ออก
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginModal = document.getElementById("login-modal");

  loginBtn?.addEventListener("click", () => loginModal?.classList.remove("hidden"));
  document.getElementById("close-login-modal")?.addEventListener("click", () => loginModal?.classList.add("hidden"));

  // 👉 เปลี่ยนปุ่ม login/logout ตามสถานะผู้ใช้
  onAuthStateChanged(auth, (user) => {
    loginBtn?.classList.toggle("hidden", !!user);
    logoutBtn?.classList.toggle("hidden", !user);
  });

  logoutBtn?.addEventListener("click", async () => {
    await auth.signOut();
    window.location.reload();
  });

  // 🔹 ตัวแปรเกี่ยวกับตะกร้าสินค้า
  const cartCount = document.getElementById("cart-count");
  const cartItems = document.getElementById("cart-items");
  const clearCart = document.getElementById("clear-cart");
  const totalPriceElement = document.getElementById("total-price");
  const totalItemsElement = document.getElementById("total-items");
  const checkoutBtn = document.getElementById("checkout");
  const slipInput = document.getElementById("payment-slip");
  const slipPreview = document.getElementById("slip-preview");

  // 👉 ดึงข้อมูลตะกร้าจาก localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // 👉 แสดงรายการสินค้าในตะกร้าทันทีเมื่อโหลดหน้า
  renderCart();

  function updateCartCount() {
    let totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
    cartCount.textContent = `(${totalItems})`;
  }

  function calculateTotalPrice() {
    let total = cart.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
    totalPriceElement.textContent = total.toFixed(2);
    totalItemsElement.textContent = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  }

  function renderCart() {
    cartItems.innerHTML = "";
    if (cart.length === 0) {
      cartItems.innerHTML = "<li class='text-center text-gray-500'>ไม่มีสินค้าในตะกร้า 🛒</li>";
    } else {
      cart.forEach((item, index) => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center p-2 border-b";
        li.innerHTML = `
          <span>${item.name} (x${item.quantity || 1}) - ฿${item.price}</span>
          <div class="flex items-center gap-2">
            <button class="decrease-qty" data-index="${index}">➖</button>
            <span>${item.quantity || 1}</span>
            <button class="increase-qty" data-index="${index}">➕</button>
            <button class="remove-item text-red-500" data-index="${index}">❌</button>
          </div>
        `;
        cartItems.appendChild(li);
      });
    }
    calculateTotalPrice();
    updateCartCount();
  }

  // 🔹 เพิ่ม/ลบ/ลดจำนวนสินค้าในตะกร้า
  cartItems.addEventListener("click", (event) => {
    let index = event.target.dataset.index;
    if (event.target.classList.contains("increase-qty")) {
      cart[index].quantity = (cart[index].quantity || 1) + 1;
    } else if (event.target.classList.contains("decrease-qty")) {
      if (cart[index].quantity > 1) {
        cart[index].quantity--;
      } else {
        cart.splice(index, 1);
      }
    } else if (event.target.classList.contains("remove-item")) {
      cart.splice(index, 1);
    }
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
  });

  // 🔹 เพิ่มสินค้าจากปุ่ม add-to-cart
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-to-cart")) {
      const user = auth.currentUser;
      if (!user) {
        alert("❌ กรุณาล็อกอินก่อนเพิ่มสินค้า");
        loginModal?.classList.remove("hidden");
        return;
      }

      let name = event.target.dataset.name;
      let price = event.target.dataset.price;
      let existingItem = cart.find(item => item.name === name);

      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.push({ name, price, quantity: 1 });
      }

      localStorage.setItem("cart", JSON.stringify(cart));
      renderCart();
    }
  });

  // 🔹 ล้างตะกร้าทั้งหมด
  clearCart?.addEventListener("click", () => {
    localStorage.removeItem("cart");
    cart = [];
    renderCart();
  });

  // 🔹 สั่งซื้อและบันทึกลง Firestore
  async function submitOrder() {
    const user = auth.currentUser;
    if (!user) {
      alert("กรุณาล็อกอินก่อนทำการสั่งซื้อ");
      loginModal?.classList.remove("hidden");
      return;
    }

    if (cart.length === 0) {
      alert("ไม่มีสินค้าในตะกร้า");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const name = userData.name || "";
      const phone = userData.phone || "";
      const address = userData.address || "";

      if (!address.trim()) {
        alert("❗ กรุณากรอกที่อยู่ก่อน");
        window.location.href = "Delivery.html";
        return;
      }

      const methodSelect = document.getElementById("payment-method");
      const paymentMethod = methodSelect?.value || "cod";

      let slipUrl = "";
      if (paymentMethod === "transfer") {
        slipUrl = currentSlipUrl;
        if (!slipUrl) {
          alert("กรุณาอัปโหลดสลิปโอนเงิน");
          return;
        }
      }

      await addDoc(collection(db, "orders"), {
        uid: user.uid,
        name, phone, address,
        cart,
        paymentMethod,
        slipUrl,
        couponCode: couponInput.value.trim() || null,
        discountPercent: currentDiscount || 0,
        totalAmount: parseFloat(totalPriceElement.textContent) || 0,
        createdAt: serverTimestamp()
      });

      alert("✅ สั่งซื้อเรียบร้อยแล้ว!");
      localStorage.removeItem("cart");
      window.location.href = "orderhistory.html";
    } catch (error) {
      console.error("❌ Error submitting order:", error);
      alert("ไม่สามารถทำการสั่งซื้อได้");
    }
  }

  // 🔹 ปุ่มยืนยันก่อน checkout
  checkoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    confirmModal?.classList.remove('hidden');
  });

  // 🔹 แสดง/ซ่อนช่องอัปโหลดสลิปและ QR PromptPay
  const paymentMethod = document.getElementById('payment-method');
  const slipUpload = document.getElementById('slip-upload-container');
  const qrPreview = document.getElementById("qr-preview");

  paymentMethod?.addEventListener('change', function () {
    if (paymentMethod.value === 'transfer') {
      slipUpload.classList.remove('hidden');
      qrPreview.classList.remove('hidden');
      const qrCanvas = document.getElementById("qr-canvas");
      const amount = totalPriceElement?.textContent || "0.00";
      QRCode.toCanvas(qrCanvas, `promptpay.io/0642715511${amount}`, {
        width: 200,
        color: { dark: "#000", light: "#fff" }
      });
    } else {
      slipUpload.classList.add('hidden');
      qrPreview.classList.add('hidden');
    }
  });

  // 🔹 อัปโหลดภาพสลิปไปยัง Cloudinary
  const uploadSlipToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "upload-slip");
    const res = await fetch("https://api.cloudinary.com/v1_1/dpgru06ox/image/upload", {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    return data.secure_url;
  };

  let currentSlipUrl = "";

  // 🔹 อัปโหลดสลิปเมื่อเลือกไฟล์
  slipInput?.addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (file) {
      currentSlipUrl = await uploadSlipToCloudinary(file);
      slipPreview.src = currentSlipUrl;
      slipPreview.classList.remove('hidden');
    }
  });

  // 🔹 Modal ยืนยันคำสั่งซื้อ
  const confirmModal = document.getElementById('confirm-modal');
  const confirmSubmit = document.getElementById('confirm-submit');
  const cancelSubmit = document.getElementById('cancel-submit');

  cancelSubmit?.addEventListener('click', () => confirmModal?.classList.add('hidden'));
  confirmSubmit?.addEventListener('click', async () => {
    confirmModal?.classList.add('hidden');
    await submitOrder();
  });

  // 🔹 คูปองส่วนลด
  const couponInput = document.getElementById("coupon-input");
  const applyCouponBtn = document.getElementById("apply-coupon");
  const couponResult = document.getElementById("coupon-result");
  const discountValueElement = document.getElementById("discount-value");
  const subtotalElement = document.getElementById("subtotal-price");
  const discountAmountElement = document.getElementById("discount-amount");

  let currentDiscount = 0;

  applyCouponBtn?.addEventListener("click", async () => {
    const code = couponInput.value.trim();
    if (!code) {
      alert("กรุณากรอกรหัสคูปอง");
      return;
    }
    try {
      const q = query(collection(db, "coupons"), where("code", "==", code));
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        alert("❌ คูปองไม่ถูกต้อง");
        return;
      }
      const coupon = querySnap.docs[0].data();
      if (coupon.expired) {
        alert("❌ คูปองหมดอายุแล้ว");
        return;
      }
      currentDiscount = coupon.discount || 0;
      const subtotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * (item.quantity || 1), 0);
      const discountAmount = (subtotal * currentDiscount) / 100;
      const total = subtotal - discountAmount;
      subtotalElement.textContent = subtotal.toFixed(2);
      discountAmountElement.textContent = discountAmount.toFixed(2);
      totalPriceElement.textContent = total.toFixed(2);
      couponResult.classList.remove("hidden");
      discountValueElement.textContent = currentDiscount;
    } catch (err) {
      console.error("Error applying coupon:", err);
      alert("เกิดข้อผิดพลาดในการใช้คูปอง");
    }
  });

  // 🔹 ไปยังหน้าจัดการคูปอง (admin)
  document.getElementById("go-to-coupon-page")?.addEventListener("click", () => {
    window.location.href = "admin_coupon.html";
  });

  // 🔹 Toast แจ้งเตือนการเพิ่มสินค้า
  function showToast(message, type = "info") {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className = `
      toast-message
      ${type === "success" ? "bg-green-500" : type === "error" ? "bg-red-500" : "bg-gray-700"}
      animate-fade-in-out
      show
    `.replace(/\s+/g, ' ');
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  }

});
