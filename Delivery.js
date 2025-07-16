import { db, auth } from './firebase.js';
import { collection, addDoc, serverTimestamp, setDoc, doc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
    // 📌 เปิด/ปิด Sidebar
    const menuBtn = document.getElementById("menu-btn");
    const closeBtn = document.getElementById("close-btn");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("overlay");

    // ✅ ย้ายฟังก์ชันขึ้นก่อนใช้งาน
    function toggleSidebar(show) {
        sidebar?.classList.toggle("show", show);
        overlay?.classList.toggle("show", show);
    }

    menuBtn?.addEventListener("click", () => toggleSidebar(true));
    closeBtn?.addEventListener("click", () => toggleSidebar(false));
    overlay?.addEventListener("click", () => toggleSidebar(false));

    // 📌 Dropdown Menu
    document.querySelectorAll(".dropdown-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const dropdownContent = btn.nextElementSibling;
            const arrow = btn.querySelector(".arrow");
            dropdownContent?.classList.toggle("show");
            arrow?.classList.toggle("rotate");
        });
    });

    // 📌 Login / Register Modal
    const loginBtn = document.getElementById("login-btn");
    const logoutBtn = document.getElementById("logout-btn");
    const loginModal = document.getElementById("login-modal");
    const registerModal = document.getElementById("register-modal");
    const closeModal = document.getElementById("close-modal");
    const openRegister = document.getElementById("openRegister");
    const backToLogin = document.getElementById("backToLogin");
    const closeRegisterModal = document.getElementById("close-register-modal");

    loginBtn?.addEventListener("click", () => loginModal?.classList.remove("hidden"));
    closeModal?.addEventListener("click", () => loginModal?.classList.add("hidden"));
    openRegister?.addEventListener("click", () => {
        loginModal?.classList.add("hidden");
        registerModal?.classList.remove("hidden");
    });
    backToLogin?.addEventListener("click", () => {
        registerModal?.classList.add("hidden");
        loginModal?.classList.remove("hidden");
    });
    closeRegisterModal?.addEventListener("click", () => {
        registerModal?.classList.add("hidden");
    });

    const submitLogin = document.getElementById("submit-login");
    const submitRegister = document.getElementById("submit-register");
    let isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    submitLogin?.addEventListener("click", () => {
        localStorage.setItem("isLoggedIn", "true");
        updateAuthUI();
        loginModal?.classList.add("hidden");
    });

    submitRegister?.addEventListener("click", () => {
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        if (email && password) {
            alert("✅ สมัครสมาชิกสำเร็จ (Mock)");
            registerModal?.classList.add("hidden");
        } else {
            alert("❗ กรุณากรอกอีเมลและรหัสผ่านให้ครบ");
        }
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

    // 📌 Cart
    const cartMenu = document.getElementById("cart-menu");
    const cartCount = document.getElementById("cart-count");
    const cartModal = document.getElementById("cart-modal");
    const closeCart = document.getElementById("close-cart");
    const cartItems = document.getElementById("cart-items");
    const clearCart = document.getElementById("clear-cart");
    const totalPriceElement = document.getElementById("total-price");
    const addToCartButtons = document.querySelectorAll(".add-to-cart");

    let cart = JSON.parse(localStorage.getItem("cart")) || [];

    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = `(${totalItems})`;
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
                li.innerHTML = `${item.name} - ฿${item.price} 
                    <button class="remove-item" data-index="${index}">❌</button>`;
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

    addToCartButtons.forEach(button => {
        button.addEventListener("click", function () {
            let name = this.dataset.name;
            let price = this.dataset.price;

            cart.push({ name, price });
            localStorage.setItem("cart", JSON.stringify(cart));
            updateCartCount();
            renderCart();
        });
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
    window.addEventListener("storage", updateCartCount);
});

onAuthStateChanged(auth, async (user) => {
  if (user) {
    // ✅ ให้แน่ใจว่าปุ่มนี้มีอยู่ใน DOM
    const confirmBtn = document.getElementById("confirm-order-btn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value;
        const phone = document.getElementById("phone").value;
        const address = document.getElementById("address").value;
        const deliveryOption = document.getElementById("delivery-option").value;

        if (!name || !phone || !address) {
          alert("❗ กรุณากรอกข้อมูลให้ครบ");
          return;
        }

        try {
          // 🔐 บันทึกข้อมูลจัดส่งไว้ที่ users/{uid}
          const deliveryRef = doc(db, "users", user.uid);
          await setDoc(deliveryRef, {
            name,
            phone,
            address,
            deliveryOption,
            deliverySavedAt: serverTimestamp()
          }, { merge: true });

          alert("✅ บันทึกข้อมูลจัดส่งเรียบร้อยแล้ว");

          // ล้างฟอร์ม
          document.getElementById("name").value = "";
          document.getElementById("phone").value = "";
          document.getElementById("address").value = "";
          document.getElementById("delivery-option").value = "grab";

        } catch (err) {
          console.error("❌ บันทึกข้อมูลล้มเหลว:", err);
          alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        }
      });
    }
  }

    // ✅ ฟีเจอร์ใหม่: บันทึกอัตโนมัติเมื่อกรอกข้อมูล
    const userRef = doc(db, "users", user.uid);

    function autoSaveInput(id, key) {
      const input = document.getElementById(id);
      input?.addEventListener("blur", async () => {
        const value = input.value.trim();
        if (value) {
          await setDoc(userRef, { [key]: value }, { merge: true });
          console.log(`📥 บันทึก ${key} แล้ว`);
        }
      });
    }

    autoSaveInput("name", "name");
    autoSaveInput("phone", "phone");
    autoSaveInput("address", "address");
});
