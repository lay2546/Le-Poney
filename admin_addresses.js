import { db } from './firebase.js';
import {
  collectionGroup, getDocs, deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 📌 ดึงทุกที่อยู่จากทุกผู้ใช้
const snapshot = await getDocs(collectionGroup(db, "addresses"));

snapshot.forEach(docSnap => {
  const addressData = docSnap.data(); // => ข้อมูลที่อยู่
  const userId = docSnap.ref.parent.parent.id; // => UID ของผู้ใช้
  const addressId = docSnap.id; // => ID ของ document ที่อยู่

  console.log("👤 UID:", userId);
  console.log("📍 Address:", addressData);
});

const listContainer = document.getElementById("address-list");

// ✅ ดึงทุก address ของทุกผู้ใช้จาก subcollection
async function loadAddresses() {
  listContainer.innerHTML = "<p>⏳ กำลังโหลดข้อมูลที่อยู่...</p>";
  try {
    const snapshot = await getDocs(collectionGroup(db, "addresses"));
    const grouped = {};

    snapshot.forEach(docSnap => {
      const data = docSnap.data();
      const userId = docSnap.ref.parent.parent.id;
      if (!grouped[userId]) grouped[userId] = [];
      grouped[userId].push({ id: docSnap.id, ...data });
    });

    listContainer.innerHTML = "";

    for (const [uid, addresses] of Object.entries(grouped)) {
      const section = document.createElement("div");
      section.className = "bg-white p-4 rounded shadow";

      const header = document.createElement("h3");
      header.className = "font-bold text-lg mb-2 text-pink-600";
      header.textContent = `👤 ผู้ใช้: ${uid}`;

      const ul = document.createElement("ul");
      ul.className = "space-y-2";

      addresses.forEach(addr => {
        const li = document.createElement("li");
        li.className = "border p-3 rounded flex justify-between items-center";

        li.innerHTML = `
          <div>
            <p><strong>${addr.nickname || "ไม่มีชื่อเล่น"}</strong></p>
            <p class="text-sm text-gray-600 whitespace-pre-line">${addr.address}</p>
            <p class="text-sm">📞 ${addr.phone || "-"}</p>
          </div>
          <button class="bg-red-500 text-white px-3 py-1 rounded delete-btn" data-uid="${uid}" data-id="${addr.id}">ลบ</button>
        `;

        ul.appendChild(li);
      });

      section.appendChild(header);
      section.appendChild(ul);
      listContainer.appendChild(section);
    }

    // ✅ ลบที่อยู่
    document.querySelectorAll(".delete-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const uid = btn.dataset.uid;
        const id = btn.dataset.id;
        if (confirm("ต้องการลบที่อยู่นี้หรือไม่?")) {
          await deleteDoc(doc(db, `users/${uid}/addresses/${id}`));
          alert("✅ ลบที่อยู่เรียบร้อยแล้ว");
          loadAddresses(); // reload
        }
      });
    });

  } catch (err) {
    console.error("❌ เกิดข้อผิดพลาด:", err);
    listContainer.innerHTML = "<p class='text-red-600'>เกิดข้อผิดพลาดในการโหลดข้อมูล</p>";
  }
}

loadAddresses();
