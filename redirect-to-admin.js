
import { auth, db } from './firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

onAuthStateChanged(auth, async (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists() && userSnap.data().role === "admin") {
    const currentPage = window.location.pathname;
    const adminPages = ["/admin_dashboard.html", "/admin_product_upload.html"];
    if (!adminPages.includes(currentPage)) {
      window.location.href = "admin_dashboard.html";
    }
  }
});
