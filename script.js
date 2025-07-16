import { auth, provider, db } from './firebase.js';
import {
  signInWithPopup,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  // ✅ Sidebar Toggle
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-btn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (menuBtn && closeBtn && sidebar && overlay) {
    menuBtn.addEventListener("click", () => toggleSidebar(true));
    closeBtn.addEventListener("click", () => toggleSidebar(false));
    overlay.addEventListener("click", () => toggleSidebar(false));
    function toggleSidebar(show) {
      sidebar.classList.toggle("show", show);
      overlay.classList.toggle("show", show);
      sidebar.classList.toggle("hidden", !show);
      overlay.classList.toggle("hidden", !show);
    }
  }

  // 🔽 Dropdown Menu
  document.querySelectorAll(".dropdown-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dropdownContent = btn.nextElementSibling;
      const arrow = btn.querySelector(".arrow");
      dropdownContent?.classList.toggle("show");
      arrow?.classList.toggle("rotate");
    });
  });

  // 🔐 Login/Register
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginModal = document.getElementById("login-modal");
  const closeModal = document.getElementById("close-login-modal");
  const submitLogin = document.getElementById("submit-login");

  let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  loginBtn?.addEventListener("click", () => loginModal?.classList.remove("hidden"));
  closeModal?.addEventListener("click", () => loginModal?.classList.add("hidden"));

  submitLogin?.addEventListener("click", () => {
    localStorage.setItem("isLoggedIn", "true");
    updateAuthUI();
    loginModal?.classList.add("hidden");
  });

  logoutBtn?.addEventListener("click", () => {
    localStorage.setItem("isLoggedIn", "false");
    updateAuthUI();
  });

  function updateAuthUI() {
    isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
    loginBtn?.classList.toggle("hidden", isLoggedIn);
    logoutBtn?.classList.toggle("hidden", !isLoggedIn);
  }

  updateAuthUI();

  const registerBtn = document.getElementById("submit-register");
  const registerModal = document.getElementById("register-modal");
  const closeRegisterModal = document.getElementById("close-register-modal");

  registerBtn?.addEventListener("click", () => {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    if (email && password) {
      alert("✅ สมัครสมาชิกสำเร็จ (Demo เท่านั้น)");
      registerModal?.classList.add("hidden");
    } else {
      alert("⚠️ กรุณากรอกอีเมลและรหัสผ่าน");
    }
  });

  closeRegisterModal?.addEventListener("click", () => {
    registerModal?.classList.add("hidden");
  });

  // 🛒 Cart
  const cartMenu = document.getElementById("cart-menu");
  const cartCount = document.getElementById("cart-count");
  const cartModal = document.getElementById("cart-modal");
  const closeCart = document.getElementById("close-cart");
  const cartItems = document.getElementById("cart-items");
  const clearCart = document.getElementById("clear-cart");
  const totalPriceElement = document.getElementById("total-price");

  let cart = JSON.parse(localStorage.getItem("cart")) || [];

  function updateCartCount() {
    cartCount.textContent = `(${cart.length})`;
  }

  function calculateTotalPrice() {
    let total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);
    if (totalPriceElement) totalPriceElement.textContent = total.toFixed(2);
  }

  function renderCart() {
    if (!cartItems) return;
    cartItems.innerHTML = "";
    if (cart.length === 0) {
      cartItems.innerHTML = "<li class='empty-cart'>ไม่มีสินค้าในตะกร้า</li>";
      if (totalPriceElement) totalPriceElement.textContent = "0";
    } else {
      cart.forEach((item, index) => {
        let li = document.createElement("li");
        li.innerHTML = `${item.name} - ฿${item.price} <button class="remove-item" data-index="${index}">❌</button>`;
        cartItems.appendChild(li);
      });
      document.querySelectorAll(".remove-item").forEach(button => {
        button.addEventListener("click", function () {
          let index = this.dataset.index;
          cart.splice(index, 1);
          localStorage.setItem("cart", JSON.stringify(cart));
          renderCart();
          updateCartCount();
          calculateTotalPrice();
        });
      });
    }
    calculateTotalPrice();
  }

  document.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-to-cart")) {
      let name = e.target.dataset.name;
      let price = e.target.dataset.price;

      cart.push({ name, price });
      localStorage.setItem("cart", JSON.stringify(cart));
      updateCartCount();
      renderCart();
    }
  });

  cartMenu?.addEventListener("click", () => {
    cartModal?.classList.remove("hidden");
    renderCart();
  });

  closeCart?.addEventListener("click", () => cartModal?.classList.add("hidden"));

  clearCart?.addEventListener("click", () => {
    cart = [];
    localStorage.setItem("cart", JSON.stringify(cart));
    renderCart();
    updateCartCount();
    calculateTotalPrice();
  });

  updateCartCount();
  calculateTotalPrice();

  // 🔐 Google Login
  const googleLoginBtn = document.getElementById("google-login-btn");
  googleLoginBtn?.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          email: user.email,
          name: user.displayName || "",
          phone: user.phoneNumber || "",
          role: "user",
          createdAt: serverTimestamp()
        });
      }

      alert("✅ เข้าสู่ระบบด้วย Google สำเร็จ: " + user.email);
      localStorage.setItem("isLoggedIn", "true");
      window.location.href = "Home.html";
    } catch (error) {
      console.error("Google login failed:", error);
      alert("❌ เข้าสู่ระบบไม่สำเร็จ: " + error.message);
    }
  });

  // 🔁 Reset Password
  document.getElementById("reset-password-link")?.addEventListener("click", async () => {
    const email = prompt("กรุณากรอกอีเมลที่ใช้สมัครสมาชิก:");
    if (!email) return alert("⚠️ กรุณากรอกอีเมล");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("📨 ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณแล้ว");
    } catch (error) {
      console.error("Error:", error);
      alert("❌ ไม่สามารถรีเซ็ตรหัสผ่านได้: " + error.message);
    }
  });

  // 🎠 Slide Show แบบใหม่
  const slidesContainer = document.getElementById('slides');
  const dots = document.querySelectorAll('.dot');
  if (slidesContainer && dots.length > 0) {
    let currentIndex = 0;
    const totalSlides = dots.length;

    function updateSlide() {
      slidesContainer.style.transform = `translateX(-${currentIndex * 100}%)`;
      dots.forEach((dot, i) => {
        dot.classList.remove('opacity-70');
        dot.classList.add('opacity-50');
        if (i === currentIndex) {
          dot.classList.add('opacity-70');
          dot.classList.remove('opacity-50');
        }
      });
    }

    function nextSlide() {
      currentIndex = (currentIndex + 1) % totalSlides;
      updateSlide();
    }

    function prevSlide() {
      currentIndex = (currentIndex - 1 + totalSlides) % totalSlides;
      updateSlide();
    }

    window.goToSlide = function (index) {
      currentIndex = index;
      updateSlide();
    };

    window.nextSlide = nextSlide;
    window.prevSlide = prevSlide;

    setInterval(nextSlide, 5000);
    updateSlide();
  }
});

// 📦 Sync ตะกร้าในหลายแท็บ
window.addEventListener("storage", () => {
  let cart = JSON.parse(localStorage.getItem("cart")) || [];
  let totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const cartCountEl = document.getElementById("cart-count");
  if (cartCountEl) cartCountEl.textContent = `(${totalItems})`;
});
const slides = document.getElementById("slides");
const slideCount = slides.children.length;
let currentIndex = 0;

function showSlide(index) {
  const offset = -index * 100;
  slides.style.transform = `translateX(${offset}%)`;
}

function nextSlide() {
  currentIndex = (currentIndex + 1) % slideCount;
  showSlide(currentIndex);
}

function prevSlide() {
  currentIndex = (currentIndex - 1 + slideCount) % slideCount;
  showSlide(currentIndex);
}

// ✅ Auto Slide every 4 seconds
setInterval(nextSlide, 4000);
