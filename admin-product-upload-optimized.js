
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
  status.textContent = "⏳ กำลังอัปโหลด...";

  const name = document.getElementById('name').value.trim();
  const price = parseFloat(document.getElementById('price').value);
  const category = document.getElementById('category').value.trim();
  const imageInput = document.getElementById('image');
  const imageFile = imageInput.files[0];
  const isEditing = !!editIdInput.value;

  if (!name || isNaN(price) || price <= 0 || !category) {
    status.textContent = "❌ กรุณากรอกข้อมูลให้ครบถ้วน";
    submitBtn.disabled = false;
    return;
  }

  let imageUrl = '';
  let imagePath = '';

  if (isEditing) {
    const existingDoc = await getDoc(doc(db, "products", editIdInput.value));
    const existingData = existingDoc.data();
    imageUrl = existingData.imageUrl;
    imagePath = existingData.imagePath;

    if (imageFile) {
      const compressed = await compressImage(imageFile);
      const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
      await uploadBytes(imageRef, compressed);
      imageUrl = await getDownloadURL(imageRef);
      if (imagePath) await deleteObject(ref(storage, imagePath)).catch(() => {});
      imagePath = imageRef.fullPath;
    }

    await updateDoc(doc(db, "products", editIdInput.value), {
      name,
      price,
      category,
      imageUrl,
      imagePath,
      updatedAt: serverTimestamp()
    });
    status.textContent = "✅ อัปเดตสินค้าเรียบร้อยแล้ว";
  } else {
    if (!imageFile) {
      status.textContent = "❌ กรุณาเลือกรูปภาพ";
      submitBtn.disabled = false;
      return;
    }

    const compressed = await compressImage(imageFile);
    const imageRef = ref(storage, `products/${Date.now()}_${imageFile.name}`);
    await uploadBytes(imageRef, compressed);
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

// 🎯 ย่อขนาดภาพอัตโนมัติผ่าน canvas
function compressImage(file, maxWidth = 800, maxHeight = 800) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxWidth) {
          height *= maxWidth / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width *= maxHeight / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.8);
    };
    img.src = URL.createObjectURL(file);
  });
}

// โหลดสินค้า
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

    card.querySelector('.edit-btn').onclick = () => {
      document.getElementById('name').value = product.name;
      document.getElementById('price').value = product.price;
      document.getElementById('category').value = product.category || "";
      editIdInput.value = doc.id;
      status.textContent = "🔧 กำลังแก้ไขสินค้า...";
    };

    card.querySelector('.delete-btn').onclick = async () => {
      if (confirm("ลบสินค้านี้หรือไม่?")) {
        await deleteDoc(doc.ref);
        if (product.imagePath) await deleteObject(ref(storage, product.imagePath)).catch(() => {});
        status.textContent = "🗑️ ลบสินค้าแล้ว";
      }
    };

    productList.appendChild(card);
  });
});
