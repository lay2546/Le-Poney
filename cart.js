// 👉 Import Firebase config that connects to Firestore and Authentication
import { db, auth } from './firebase.js';

// 👉 Import Firestore methods (add data, read data, create queries, etc.)
import {
  collection, addDoc, serverTimestamp, getDoc, doc, query, where, getDocs
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 👉 Used to check user login status
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// 👉 Wait for DOM to load before executing
document.addEventListener("DOMContentLoaded", () => {

  // 🔹 Sidebar management
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-btn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  // 👉 Show/hide Sidebar
  menuBtn?.addEventListener("click", () => toggleSidebar(true));
  closeBtn?.addEventListener("click", () => toggleSidebar(false));
  overlay?.addEventListener("click", () => toggleSidebar(false));

  function toggleSidebar(show) {
    sidebar?.classList.toggle("show", show);
    overlay?.classList.toggle("show", show);
  }

  // 🔹 Dropdown menu
  document.querySelectorAll(".dropdown-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dropdownContent = btn.nextElementSibling;
      dropdownContent?.classList.toggle("show");
    });
  });

  // 🔹 Login/Logout handling
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginModal = document.getElementById("login-modal");

  loginBtn?.addEventListener("click", () => loginModal?.classList.remove("hidden"));
  document.getElementById("close-login-modal")?.addEventListener("click", () => loginModal?.classList.add("hidden"));

  // 👉 Toggle login/logout button based on user status
  onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBtn?.classList.add("hidden");
    logoutBtn?.classList.remove("hidden");
  } else {
    loginBtn?.classList.remove("hidden");
    logoutBtn?.classList.add("hidden");
  }
});


  logoutBtn?.addEventListener("click", async () => {
    await auth.signOut();
    window.location.reload();
  });

  // 🔹 Cart-related variables
  const cartCount = document.getElementById("cart-count");
  const cartItems = document.getElementById("cart-items");
  const clearCart = document.getElementById("clear-cart");
  const totalPriceElement = document.getElementById("total-price");
  const totalItemsElement = document.getElementById("total-items");
  const checkoutBtn = document.getElementById("checkout");
  const slipInput = document.getElementById("payment-slip");
  const slipPreview = document.getElementById("slip-preview");

  // 👉 Retrieve cart data from localStorage
  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  // 👉 Render cart items immediately after page load
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
      cartItems.innerHTML = "<li class='text-center text-gray-500'>🛒 Your cart is empty</li>";
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

  // 🔹 Increase/Decrease/Remove item from cart
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

  // 🔹 Add item from "add-to-cart" button
  document.addEventListener("click", (event) => {
    if (event.target.classList.contains("add-to-cart")) {
      const user = auth.currentUser;
      if (!user) {
        alert("❌ Please log in before adding items");
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

  // 🔹 Clear the entire cart
  clearCart?.addEventListener("click", () => {
    localStorage.removeItem("cart");
    cart = [];
    renderCart();
  });

  // 🔹 Submit order and save to Firestore
  async function submitOrder() {
    const user = auth.currentUser;
    if (!user) {
      alert("Please log in before placing an order");
      loginModal?.classList.remove("hidden");
      return;
    }

    if (cart.length === 0) {
      alert("Your cart is empty");
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const name = userData.name || "";
      const phone = userData.phone || "";
      const address = userData.address || "";

      if (!address.trim()) {
        alert("❗ Please fill in your delivery address");
        window.location.href = "Delivery.html";
        return;
      }

      const methodSelect = document.getElementById("payment-method");
      const paymentMethod = methodSelect?.value || "cod";

      let slipUrl = "";
      if (paymentMethod === "transfer") {
        slipUrl = currentSlipUrl;
        if (!slipUrl) {
          alert("Please upload a transfer slip");
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

      alert("✅ Order submitted successfully!");
      localStorage.removeItem("cart");
      window.location.href = "orderhistory.html";
    } catch (error) {
      console.error("❌ Error submitting order:", error);
      alert("Failed to place order");
    }
  }

  // 🔹 Checkout confirmation modal
  checkoutBtn?.addEventListener('click', (e) => {
    e.preventDefault();
    confirmModal?.classList.remove('hidden');
  });

  // 🔹 Show/hide slip upload and QR PromptPay
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

  // 🔹 Upload slip image to Cloudinary
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

  // 🔹 Upload slip when file is selected
  slipInput?.addEventListener("change", async function (e) {
    const file = e.target.files[0];
    if (file) {
      currentSlipUrl = await uploadSlipToCloudinary(file);
      slipPreview.src = currentSlipUrl;
      slipPreview.classList.remove('hidden');
    }
  });

  // 🔹 Confirm order modal
  const confirmModal = document.getElementById('confirm-modal');
  const confirmSubmit = document.getElementById('confirm-submit');
  const cancelSubmit = document.getElementById('cancel-submit');

  cancelSubmit?.addEventListener('click', () => confirmModal?.classList.add('hidden'));
  confirmSubmit?.addEventListener('click', async () => {
    confirmModal?.classList.add('hidden');
    await submitOrder();
  });

  // 🔹 Discount coupon
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
      alert("Please enter a coupon code");
      return;
    }
    try {
      const q = query(collection(db, "coupons"), where("code", "==", code));
      const querySnap = await getDocs(q);
      if (querySnap.empty) {
        alert("❌ Invalid coupon");
        return;
      }
      const coupon = querySnap.docs[0].data();
      if (coupon.expired) {
        alert("❌ Coupon has expired");
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
      alert("Error applying coupon");
    }
  });

  // 🔹 Navigate to admin coupon page
  document.getElementById("go-to-coupon-page")?.addEventListener("click", () => {
    window.location.href = "admin_coupon.html";
  });

  // 🔹 Toast alert for item added
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
