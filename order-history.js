import { db, auth } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", () => {
  const orderList = document.getElementById("order-list");
  const addressInfo = document.getElementById("address-info");
  const editAddressBtn = document.getElementById("edit-address-btn");
  const searchBtn = document.getElementById("search-btn");
  const filterDate = document.getElementById("filter-date");

  // ✅ โปรไฟล์ฟอร์ม
  const nameInput = document.getElementById("profile-name");
  const lastnameInput = document.getElementById("profile-lastname");
  const usernameInput = document.getElementById("profile-username");
  const phoneInput = document.getElementById("profile-phone");
  const addressInput = document.getElementById("profile-address");
  const emailInput = document.getElementById("profile-email"); // จาก Firebase Auth

  orderList.innerHTML = "<li class='text-center text-gray-500'>⏳ กำลังโหลดข้อมูล...</li>";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("❌ กรุณาเข้าสู่ระบบก่อนใช้งานหน้านี้");
      window.location.href = "Home.html";
      return;
    }

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // ✅ แสดงข้อมูลที่อยู่ล่าสุดใน sidebar
        if (addressInfo) {
          addressInfo.innerHTML = `
            <p><strong>ชื่อ:</strong> <span id="info-name">${data.name || "-"}</span></p>
            <p><strong>เบอร์โทร:</strong> <span id="info-phone">${data.phone || "-"}</span></p>
            <p><strong>ที่อยู่:</strong> <span id="info-address">${data.address || "-"}</span></p>
          `;
        }

        // ✅ เติมข้อมูลในฟอร์มโปรไฟล์
        if (nameInput) nameInput.value = data.name || "";
        if (lastnameInput) lastnameInput.value = data.lastname || "";
        if (usernameInput) usernameInput.value = data.username || "";
        if (phoneInput) phoneInput.value = data.phone || "";
        if (addressInput) addressInput.value = data.address || "";
        if (emailInput) emailInput.value = user.email || ""; // Auth email
      }

      // ✅ ปุ่มแก้ไขที่อยู่
      if (editAddressBtn) {
        editAddressBtn.addEventListener("click", async () => {
          const name = prompt("ชื่อใหม่:", document.getElementById("info-name")?.textContent || "");
          const phone = prompt("เบอร์โทรใหม่:", document.getElementById("info-phone")?.textContent || "");
          const address = prompt("ที่อยู่ใหม่:", document.getElementById("info-address")?.textContent || "");

          if (name && phone && address) {
            await setDoc(docRef, { name, phone, address }, { merge: true });
            addressInfo.innerHTML = `
              <p><strong>ชื่อ:</strong> <span id="info-name">${name}</span></p>
              <p><strong>เบอร์โทร:</strong> <span id="info-phone">${phone}</span></p>
              <p><strong>ที่อยู่:</strong> <span id="info-address">${address}</span></p>
            `;
            alert("✅ แก้ไขที่อยู่เรียบร้อยแล้ว");
          }
        });
      }

      // ✅ โหลดคำสั่งซื้อ
      await loadOrders(user);

      // ✅ ฟิลเตอร์ตามวันที่
      if (searchBtn && filterDate) {
        searchBtn.addEventListener("click", async () => {
          await loadOrders(user, filterDate.value);
        });
      }

    } catch (error) {
      console.error("🔥 เกิดข้อผิดพลาด:", error);
    }
  });

  async function loadOrders(user, selectedDate = "") {
    orderList.innerHTML = "<li class='text-center text-gray-500'>⏳ กำลังโหลดข้อมูล...</li>";

    try {
      const q = query(collection(db, "orders"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        orderList.innerHTML = "<li class='text-center text-gray-500'>ไม่มีประวัติการสั่งซื้อ</li>";
        return;
      }

      orderList.innerHTML = "";

      querySnapshot.forEach((docSnap) => {
        const order = docSnap.data();
        const createdAt = order.createdAt?.toDate?.() || new Date();
        const orderDate = createdAt.toISOString().split("T")[0];
        if (selectedDate && orderDate !== selectedDate) return;

        const items = order.cart || [];
        const orderTotal = items.reduce((sum, item) =>
          sum + (item.quantity || 1) * parseFloat(item.price), 0);
        const discountPercent = parseFloat(order.discountPercent || 0);
        const discountAmount = orderTotal * (discountPercent / 100);
        const finalTotal = orderTotal - discountAmount;

        const itemList = items.map(item => `
          <li class="ml-4">• ${item.name} x${item.quantity || 1} — ฿${item.price}</li>
        `).join("");

        const li = document.createElement("li");
        li.className = "bg-gray-100 p-4 rounded shadow";
        li.innerHTML = `
          <p><strong>🧾 หมายเลขคำสั่งซื้อ:</strong> ${docSnap.id}</p>
          <p><strong>📦 สถานะ:</strong> ${
            order.deliveryStatus === "preparing" ? "🛠 กำลังเตรียมสินค้า" :
            order.deliveryStatus === "shipping" ? "🚚 กำลังจัดส่ง" :
            order.deliveryStatus === "delivered" ? "✅ จัดส่งแล้ว" :
            "⏳ รอดำเนินการ"
          }</p>
          <p><strong>👤 ชื่อผู้รับ:</strong> ${order.name || "-"}</p>
          <p><strong>📞 เบอร์โทร:</strong> ${order.phone || "-"}</p>
          <p><strong>🏠 ที่อยู่:</strong> ${order.address || "-"}</p>
          <p><strong>💰 ยอดรวม:</strong> ฿${finalTotal.toFixed(2)}</p>
          <p><strong>🗓️ เวลา:</strong> ${createdAt.toLocaleString()}</p>
          <p><strong>💳 วิธีชำระเงิน:</strong> ${
            order.paymentMethod === "transfer" ? "โอนเงิน" :
            order.paymentMethod === "cod" ? "เก็บเงินปลายทาง" :
            order.paymentMethod || "-"
          }</p>
          <p><strong>📦 รายการสินค้า:</strong></p>
          <ul class="list-disc ml-5 mt-1">${itemList}</ul>
        `;
        orderList.appendChild(li);
      });
    } catch (err) {
      console.error("🔥 โหลดคำสั่งซื้อล้มเหลว:", err);
      orderList.innerHTML = "<li class='text-red-500'>❌ เกิดข้อผิดพลาดในการโหลดข้อมูล</li>";
    }
  }

  // ✅ Sidebar toggle
  const menuBtn = document.getElementById("menu-btn");
  const closeBtn = document.getElementById("close-btn");
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("overlay");

  if (menuBtn && closeBtn && sidebar && overlay) {
    const toggleSidebar = (show) => {
      sidebar.classList.toggle("show", show);
      overlay.classList.toggle("show", show);
      sidebar.classList.toggle("hidden", !show);
      overlay.classList.toggle("hidden", !show);
    };
    menuBtn.addEventListener("click", () => toggleSidebar(true));
    closeBtn.addEventListener("click", () => toggleSidebar(false));
    overlay.addEventListener("click", () => toggleSidebar(false));
  }

  const saveProfileBtn = document.getElementById("save-profile-btn");

  if (saveProfileBtn) {
    saveProfileBtn.addEventListener("click", async () => {
      const updatedData = {
        name: nameInput?.value.trim() || "",
        lastname: lastnameInput?.value.trim() || "",
        username: usernameInput?.value.trim() || "",
        phone: phoneInput?.value.trim() || "",
        address: addressInput?.value.trim() || ""
      };

      try {
        // ใช้ user.uid จาก onAuthStateChanged เพื่อความถูกต้อง
        await setDoc(doc(db, "users", auth.currentUser.uid), updatedData, { merge: true });
        alert("✅ บันทึกข้อมูลเรียบร้อยแล้ว");
      } catch (err) {
        console.error("❌ บันทึกข้อมูลล้มเหลว:", err);
        alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    });
  }
});
