document.addEventListener("DOMContentLoaded", () => {
  // ✅ Toggle Sidebar
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

  // 📌 Dropdown Menu
  document.querySelectorAll(".dropdown-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const dropdownContent = btn.nextElementSibling;
      const arrow = btn.querySelector(".arrow");
      dropdownContent?.classList.toggle("show");
      arrow?.classList.toggle("rotate");
    });
  });

  // 📌 Login / Register Logic
  const loginBtn = document.getElementById("login-btn");
  const logoutBtn = document.getElementById("logout-btn");
  const loginModal = document.getElementById("login-modal");
  const closeModal = document.getElementById("close-modal");
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
      alert("Registration successful!");
      registerModal?.classList.add("hidden");
    } else {
      alert("Please fill in both email and password fields.");
    }
  });

  closeRegisterModal?.addEventListener("click", () => {
    registerModal?.classList.add("hidden");
  });

  // 📌 ตะกร้าสินค้า
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
    totalPriceElement.textContent = total.toFixed(2);
  }

  function renderCart() {
    cartItems.innerHTML = "";
    if (cart.length === 0) {
      cartItems.innerHTML = "<li class='empty-cart'>ไม่มีสินค้าในตะกร้า</li>";
      totalPriceElement.textContent = "0";
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

  // 🛒 กดเพิ่มสินค้าจากปุ่ม add-to-cart ที่สร้างแบบ dynamic
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
});
