import { db } from './firebase.js';
import {
  collection, getDocs, deleteDoc, doc, getDoc,
  query, where, getCountFromServer
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

document.addEventListener("DOMContentLoaded", async () => {
  const userTableBody = document.getElementById("user-table-body");
  const searchInput = document.getElementById("search-user");

  let users = [];

  async function loadUsers() {
    const snapshot = await getDocs(collection(db, "users"));
    users = [];

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const uid = docSnap.id;

      users.push({
        id: uid,
        name: data.name || "-",
        email: data.email || "-",
        phone: data.phone || "-",
        createdAt: formatDate(data.createdAt?.toDate?.())
      });
    }

    renderTable(users);
  }

  function formatDate(date) {
    if (!date) return "-";
    return date.toLocaleDateString("th-TH", {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  async function loadAddress(uid) {
    const ref = doc(db, "users", uid);
    const docSnap = await getDoc(ref);
    return docSnap.exists() ? (docSnap.data().address || "-") : "-";
  }

  async function loadOrderCount(uid) {
    const q = query(collection(db, "orders"), where("uid", "==", uid));
    const snap = await getCountFromServer(q);
    return snap.data().count || 0;
  }

  async function renderTable(data) {
    userTableBody.innerHTML = "";

    for (const user of data) {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="py-2 px-3">${user.name}</td>
        <td class="py-2 px-3">${user.email}</td>
        <td class="py-2 px-3">${user.phone}</td>
        <td class="py-2 px-3">${user.createdAt}</td>
        <td class="py-2 px-3" id="order-${user.id}" class="italic text-gray-400">⏳</td>
        <td class="py-2 px-3" id="address-${user.id}" class="italic text-gray-400">⏳</td>
        <td class="py-2 px-3 text-center">
          <button class="delete-user bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1 rounded shadow" data-id="${user.id}">🗑 ลบ</button>
        </td>
      `;
      userTableBody.appendChild(tr);

      loadAddress(user.id).then(addr => {
        const td = document.getElementById(`address-${user.id}`);
        if (td) td.textContent = addr;
      });

      loadOrderCount(user.id).then(count => {
        const td = document.getElementById(`order-${user.id}`);
        if (td) td.textContent = count;
      });
    }
  }

  // 🔍 ค้นหา
  searchInput?.addEventListener("input", () => {
    const term = searchInput.value.trim().toLowerCase();
    const filtered = users.filter(u =>
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term)
    );
    renderTable(filtered);
  });

  // ✅ ลบผู้ใช้ พร้อม try-catch
  userTableBody.addEventListener("click", async (e) => {
    const target = e.target;
    if (target.classList.contains("delete-user")) {
      const id = target.dataset.id;
      const confirmDelete = confirm("⚠️ คุณแน่ใจว่าต้องการลบผู้ใช้นี้?");
      if (confirmDelete) {
        try {
          await deleteDoc(doc(db, "users", id));
          alert("✅ ลบผู้ใช้เรียบร้อยแล้ว");
          loadUsers();
        } catch (err) {
          console.error("❌ เกิดข้อผิดพลาดในการลบ:", err);
          alert("เกิดข้อผิดพลาดในการลบผู้ใช้นี้ กรุณาตรวจสอบสิทธิ์หรือสถานะเอกสาร");
        }
      }
    }
  });

  loadUsers();
});
