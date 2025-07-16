// admin_coupon.js
import { db } from './firebase.js';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  Timestamp,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

const couponTable = document.getElementById("couponTable");
const addBtn = document.getElementById("addCoupon");

const codeInput = document.getElementById("code");
const discountInput = document.getElementById("discount");
const expireDateInput = document.getElementById("expireDate");

const couponsRef = collection(db, "coupons");
const ordersRef = collection(db, "orders");

// ✅ แสดงข้อความแจ้งเตือนแบบง่าย
function showMessage(msg, color = "green") {
  const div = document.createElement("div");
  div.textContent = msg;
  div.className = `fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-${color}-500 text-white px-4 py-2 rounded shadow z-50`;
  document.body.appendChild(div);
  setTimeout(() => div.remove(), 3000);
}

// 🔁 โหลดคูปองทั้งหมด
async function loadCoupons() {
  couponTable.innerHTML = "";
  const snapshot = await getDocs(couponsRef);
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const row = document.createElement("tr");

    const expire = data.expireDate?.toDate()?.toLocaleString() ?? "-";

    row.innerHTML = `
      <td class="p-2 font-semibold">${data.code ?? docSnap.id}</td>
      <td class="p-2">${data.discount}%</td>
      <td class="p-2">${expire}</td>
      <td class="p-2">
        <button class="bg-red-500 text-white px-2 py-1 rounded delete-btn" data-id="${docSnap.id}">ลบ</button>
      </td>
    `;

    couponTable.appendChild(row);
  });

  // 🎯 ปุ่มลบคูปอง
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      const id = e.target.dataset.id;
      if (confirm(`ลบคูปอง ${id}?`)) {
        await deleteDoc(doc(db, "coupons", id));
        loadCoupons();
        showMessage("ลบคูปองแล้ว", "red");
      }
    });
  });

  // 🧾 โหลดคำสั่งซื้อที่ใช้คูปอง
  loadCouponOrders();
}

// 🧾 โหลดคำสั่งซื้อที่ใช้คูปอง
async function loadCouponOrders() {
  const list = document.getElementById("couponOrders");
  if (!list) return;
  list.innerHTML = "";

  // ✅ ใช้ couponCode และ discountPercent ตามโครงสร้างใหม่
  const q = query(ordersRef, where("couponCode", "!=", null));
  const snapshot = await getDocs(q);

  snapshot.forEach(order => {
    const data = order.data();
    const li = document.createElement("li");
    li.textContent = `📦 ออเดอร์ของ UID: ${data.uid} ใช้โค้ด ${data.couponCode} (${data.discountPercent}%)`;
    list.appendChild(li);
  });
}

// ➕ เพิ่มคูปองใหม่
addBtn.addEventListener("click", async () => {
  const code = codeInput.value.trim().toUpperCase();
  const discount = Number(discountInput.value.trim());
  const expireDate = new Date(expireDateInput.value);

  if (!code || isNaN(discount) || isNaN(expireDate.getTime())) {
    return alert("กรอกข้อมูลให้ครบถ้วน");
  }

  try {
    await addDoc(couponsRef, {
      code,
      discount,
      expireDate: Timestamp.fromDate(expireDate),
      isActive: true,
      createdAt: serverTimestamp(),
    });

    codeInput.value = "";
    discountInput.value = "";
    expireDateInput.value = "";
    loadCoupons();
    showMessage("เพิ่มคูปองสำเร็จ 🎉");
  } catch (err) {
    console.error("❌ เพิ่มคูปองล้มเหลว:", err);
    alert("เพิ่มคูปองไม่สำเร็จ: " + err.message);
  }
});

// 🔃 โหลดเมื่อเริ่มต้น
loadCoupons();