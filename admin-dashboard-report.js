import { db } from './firebase.js';
import {
  collection, getDocs, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-firestore.js";

// 📌 DOM
const totalSalesEl = document.getElementById("total-sales");
const totalOrdersEl = document.getElementById("total-orders");
const salesChartEl = document.getElementById("salesChart");
const dateFilterEl = document.getElementById("date-filter");

const monthlySalesEl = document.createElement("p");
monthlySalesEl.className = "text-sm text-gray-600 mt-1 text-center";
totalSalesEl?.parentElement?.appendChild(monthlySalesEl);

async function loadDashboardData(selectedDate = null, filterMode = null) {
  try {
    const q = query(collection(db, "orders"), orderBy("createdAt"));
    const snapshot = await getDocs(q);

    let totalSales = 0;
    let totalOrders = 0;
    let filteredSales = 0;
    const salesByDate = {};
    const now = new Date();

    snapshot.forEach((doc) => {
      const data = doc.data();
      const createdAt = data.createdAt?.toDate?.();
      if (!createdAt) return;

      const dateKey = createdAt.toISOString().split("T")[0];
      const selectedKey = selectedDate ? new Date(selectedDate).toISOString().split("T")[0] : null;

      const isSelected =
        (selectedDate && dateKey === selectedKey) ||
        (filterMode === "month" && isSameMonth(createdAt, now)) ||
        (filterMode === "year" && isSameYear(createdAt, now)) ||
        (!selectedDate && !filterMode);

      let orderTotal = 0;
      if (Array.isArray(data.cart)) {
        data.cart.forEach((item) => {
          const amount = (item.price || 0) * (item.quantity || 1);
          totalSales += amount;
          if (isSelected) {
            filteredSales += amount;
            orderTotal += amount;
          }
        });
      }

      totalOrders += 1;
      if (isSelected) {
        salesByDate[dateKey] = (salesByDate[dateKey] || 0) + orderTotal;
      }
    });

    totalSalesEl.textContent = `฿${totalSales.toLocaleString()}`;
    totalOrdersEl.textContent = `${totalOrders} รายการ`;

    let label = "ทั้งหมด";
    if (selectedDate) label = `วันที่ ${formatThaiDate(selectedDate)}`;
    else if (filterMode === "month") label = "เดือนนี้";
    else if (filterMode === "year") label = "ปีนี้";

    monthlySalesEl.textContent = `ยอดขาย${label}: ฿${filteredSales.toLocaleString()}`;

    renderSalesChart(salesByDate);
  } catch (err) {
    console.error("โหลดข้อมูลผิดพลาด:", err);
  }
}


function formatThaiDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

let chartInstance = null;
function renderSalesChart(data) {
  const labels = Object.keys(data).sort();
  const values = labels.map(date => data[date]);

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(salesChartEl, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'ยอดขายรายวัน',
        data: values,
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `฿${value.toLocaleString()}`
          }
        }
      }
    }
  });
}

// ✅ โหลดเมื่อเปิดหน้า
document.addEventListener("DOMContentLoaded", () => {
  loadDashboardData();

  dateFilterEl?.addEventListener("change", () => {
    const selected = dateFilterEl.value;
    loadDashboardData(selected);
  });
});
function isSameMonth(date1, date2) {
  return (
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
}

function isSameYear(date1, date2) {
  return date1.getFullYear() === date2.getFullYear();
}

// 🎯 เพิ่มปุ่มควบคุม
document.getElementById("btn-all")?.addEventListener("click", () => loadDashboardData(null));
document.getElementById("btn-month")?.addEventListener("click", () => {
  loadDashboardData(null, "month");
});
document.getElementById("btn-year")?.addEventListener("click", () => {
  loadDashboardData(null, "year");
});

