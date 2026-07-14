"use strict";

/**
 * نظام التنقل بين أقسام المنصة
 * يربط بين أزرار الأقسام وصفحاتها الخاصة
 */

const SECTION_ROUTES = {
  quran: "pages/quran.html",
  hadith: "pages/hadith.html",
  arabic: "pages/arabic.html"
};

function navigateToSection(sectionKey) {
  if (!SECTION_ROUTES[sectionKey]) {
    console.error(`قسم غير معروف: ${sectionKey}`);
    return;
  }

  const path = SECTION_ROUTES[sectionKey];
  window.location.href = path;
}

function initializeNavigation() {
  // ربط الأزرار بوظائف التنقل
  const quranBtn = document.querySelector(".quran-card .card-action");
  const hadithBtn = document.querySelector(".hadith-card .card-action");
  const arabicBtn = document.querySelector(".arabic-card .card-action");

  if (quranBtn) {
    quranBtn.addEventListener("click", () => navigateToSection("quran"));
  }

  if (hadithBtn) {
    hadithBtn.addEventListener("click", () => navigateToSection("hadith"));
  }

  if (arabicBtn) {
    arabicBtn.addEventListener("click", () => navigateToSection("arabic"));
  }
}

document.addEventListener("DOMContentLoaded", initializeNavigation);
