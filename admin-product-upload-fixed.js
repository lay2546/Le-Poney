
import { db, storage } from './firebase.js';
import {
  collection, addDoc, updateDoc, getDoc, doc,
  serverTimestamp, onSnapshot, deleteDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";
import {
  ref, uploadBytes, getDownloadURL, deleteObject
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-storage.js";

const form = document.getElementById('product-form');
const status = document.getElementById('status');
const productList = document.getElementById('product-list');
const editIdInput = document.getElementById('edit-id');
const submitBtn = document.getElementById('submit-button');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.disabled = true;

  const name = document.getElementById('name').value.trim();
  const price = parseFloat(document.getElementById('price').value);
  const category = document.getElementById('category').value.trim();
  const imageFile = document.getElementById('image').files[0];


  const isEditing = !!editIdInput.value;
  let imageUrl = '';
  let imagePath = '';

  if (isEditing) {
    const existingDoc = await getDoc(doc(db, "products", editIdInput.value));
    const existingData = existingDoc.data();
    imagePath = existingData.imagePath;

    if (imageFile) {
      const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, imageFile);
      imageUrl = await getDownloadURL(imageRef);

      if (imagePath) {
        await deleteObject(ref(storage, imagePath)).catch(() => {});
      }

      imagePath = imageRef.fullPath;
    } else {
      imageUrl = existingData.imageUrl;
    }

    const updateData = {
      name,
      price,
      category,
      imageUrl,
      imagePath,
      updatedAt: serverTimestamp()
    };

    await updateDoc(doc(db, "products", editIdInput.value), updateData);
    status.textContent = "✅ อัปเดตสินค้าเรียบร้อยแล้ว";
  } else {
    const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, imageFile);
    imageUrl = await getDownloadURL(imageRef);
    imagePath = imageRef.fullPath;

    await addDoc(collection(db, "products"), {
      name,
      price,
      category,
      imageUrl,
      imagePath,
      createdAt: serverTimestamp()
    });

    status.textContent = "✅ เพิ่มสินค้าเรียบร้อยแล้ว";
  }

  form.reset();
  editIdInput.value = '';
  submitBtn.disabled = false;
});

// โหลดข้อมูลสินค้า
const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
  productList.innerHTML = "";
  snapshot.forEach(doc => {
    const product = doc.data();
    const card = document.createElement('div');
    card.className = "border p-3 rounded shadow-sm flex justify-between items-center";
    card.innerHTML = `
      <div>
        <p><strong>${product.name}</strong> - ฿${product.price} (${product.category})</p>
      </div>
      <div class="space-x-2">
        <button class="edit-btn text-blue-500">แก้ไข</button>
        <button class="delete-btn text-red-500">ลบ</button>
      </div>
    `;
    const editBtn = card.querySelector('.edit-btn');
    const deleteBtn = card.querySelector('.delete-btn');

    editBtn.addEventListener('click', () => {
      document.getElementById('name').value = product.name;
      document.getElementById('price').value = product.price;
      document.getElementById('category').value = product.category || "";
      editIdInput.value = doc.id;
      status.textContent = "🔄 แก้ไขสินค้า...";
    });

    deleteBtn.addEventListener('click', async () => {
      if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบสินค้า?")) {
        await deleteDoc(doc.ref);
        if (product.imagePath) {
          await deleteObject(ref(storage, product.imagePath)).catch(() => {});
        }
        status.textContent = "🗑️ ลบสินค้าเรียบร้อยแล้ว";
      }
    });

    productList.appendChild(card);
  });
});
