
async function setLanguage(lang) {
  const response = await fetch(`lang/${lang}.json`);
  const translations = await response.json();

  document.querySelectorAll("[data-translate]").forEach(el => {
    const key = el.getAttribute("data-translate");
    if (translations[key]) el.textContent = translations[key];
  });

  localStorage.setItem("language", lang);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedLang = localStorage.getItem("language") || "th";
  setLanguage(savedLang);

  document.getElementById("lang-th")?.addEventListener("click", () => setLanguage("th"));
  document.getElementById("lang-en")?.addEventListener("click", () => setLanguage("en"));
});
async function setLanguage(lang) {
  const response = await fetch(`lang/${lang}.json`);
  const translations = await response.json();

  document.querySelectorAll("[data-translate]").forEach(el => {
    const key = el.getAttribute("data-translate");
    if (translations[key]) {
      // ถ้า element มีลูก span (เช่น cart-count) ให้เปลี่ยนเฉพาะข้อความหลัก
      if (el.querySelector("#cart-count")) {
        const count = el.querySelector("#cart-count").textContent;
        el.firstChild.textContent = translations[key] + " ";
        el.querySelector("#cart-count").textContent = count;
      } else {
        el.textContent = translations[key];
      }
    }
  });

  localStorage.setItem("language", lang);
}
