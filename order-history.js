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

  // ✅ Profile form
  const nameInput = document.getElementById("profile-name");
  const lastnameInput = document.getElementById("profile-lastname");
  const usernameInput = document.getElementById("profile-username");
  const phoneInput = document.getElementById("profile-phone");
  const addressInput = document.getElementById("profile-address");
  const emailInput = document.getElementById("profile-email"); // From Firebase Auth

  orderList.innerHTML = "<li class='text-center text-gray-500'>⏳ Loading data...</li>";

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      alert("❌ Please login to access this page.");
      window.location.href = "Home.html";
      return;
    }

    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();

        // ✅ Show latest address info in sidebar
        if (addressInfo) {
          addressInfo.innerHTML = `
            <p><strong>Name:</strong> <span id="info-name">${data.name || "-"}</span></p>
            <p><strong>Phone:</strong> <span id="info-phone">${data.phone || "-"}</span></p>
            <p><strong>Address:</strong> <span id="info-address">${data.address || "-"}</span></p>
          `;
        }

        // ✅ Fill profile form
        if (nameInput) nameInput.value = data.name || "";
        if (lastnameInput) lastnameInput.value = data.lastname || "";
        if (usernameInput) usernameInput.value = data.username || "";
        if (phoneInput) phoneInput.value = data.phone || "";
        if (addressInput) addressInput.value = data.address || "";
        if (emailInput) emailInput.value = user.email || ""; // Auth email
      }

      // ✅ Edit address button
      if (editAddressBtn) {
        editAddressBtn.addEventListener("click", async () => {
          const name = prompt("New name:", document.getElementById("info-name")?.textContent || "");
          const phone = prompt("New phone:", document.getElementById("info-phone")?.textContent || "");
          const address = prompt("New address:", document.getElementById("info-address")?.textContent || "");

          if (name && phone && address) {
            await setDoc(docRef, { name, phone, address }, { merge: true });
            addressInfo.innerHTML = `
              <p><strong>Name:</strong> <span id="info-name">${name}</span></p>
              <p><strong>Phone:</strong> <span id="info-phone">${phone}</span></p>
              <p><strong>Address:</strong> <span id="info-address">${address}</span></p>
            `;
            alert("✅ Address updated successfully.");
          }
        });
      }

      // ✅ Load orders
      await loadOrders(user);

      // ✅ Filter by date
      if (searchBtn && filterDate) {
        searchBtn.addEventListener("click", async () => {
          await loadOrders(user, filterDate.value);
        });
      }

    } catch (error) {
      console.error("🔥 Error occurred:", error);
    }
  });

  async function loadOrders(user, selectedDate = "") {
    orderList.innerHTML = "<li class='text-center text-gray-500'>⏳ Loading orders...</li>";

    try {
      const q = query(collection(db, "orders"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        orderList.innerHTML = "<li class='text-center text-gray-500'>No order history found.</li>";
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
          <p><strong>🧾 Order ID:</strong> ${docSnap.id}</p>
          <p><strong>📦 Status:</strong> ${
            order.deliveryStatus === "preparing" ? "🛠 Preparing" :
            order.deliveryStatus === "shipping" ? "🚚 Shipping" :
            order.deliveryStatus === "delivered" ? "✅ Delivered" :
            "⏳ Pending"
          }</p>
          <p><strong>👤 Recipient:</strong> ${order.name || "-"}</p>
          <p><strong>📞 Phone:</strong> ${order.phone || "-"}</p>
          <p><strong>🏠 Address:</strong> ${order.address || "-"}</p>
          <p><strong>💰 Total:</strong> ฿${finalTotal.toFixed(2)}</p>
          <p><strong>🗓️ Date:</strong> ${createdAt.toLocaleString()}</p>
          <p><strong>💳 Payment Method:</strong> ${
            order.paymentMethod === "transfer" ? "Bank Transfer" :
            order.paymentMethod === "cod" ? "Cash on Delivery" :
            order.paymentMethod || "-"
          }</p>
          <p><strong>📦 Items:</strong></p>
          <ul class="list-disc ml-5 mt-1">${itemList}</ul>
        `;
        orderList.appendChild(li);
      });
    } catch (err) {
      console.error("🔥 Failed to load orders:", err);
      orderList.innerHTML = "<li class='text-red-500'>❌ Failed to load data</li>";
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
        // Use user.uid from onAuthStateChanged for accuracy
        await setDoc(doc(db, "users", auth.currentUser.uid), updatedData, { merge: true });
        alert("✅ Profile updated successfully.");
      } catch (err) {
        console.error("❌ Failed to save profile:", err);
        alert("❌ Error occurred while saving profile.");
      }
    });
  }
});
