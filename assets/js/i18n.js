"use strict";

/**
 * نظام الترجمة المشترك بين جميع صفحات المنصة.
 * لإضافة نص جديد:
 * 1) أضف مفتاحه إلى data/translations.json في اللغات الست.
 * 2) ضع data-i18n="اسم.المفتاح" على العنصر المطلوب.
 */

const i18nScriptUrl = document.currentScript?.src;

const I18N_CONFIG = {
  // يُحسب المسار انطلاقاً من مكان ملف JavaScript، لذلك يعمل من الصفحة
  // الرئيسية ومن الصفحات الداخلية أيضاً.
  translationsPath: i18nScriptUrl
    ? new URL("../../data/translations.json", i18nScriptUrl).href
    : "data/translations.json",
  defaultLanguage: "ar",
  supportedLanguages: ["ar", "en", "fr", "es", "de", "it"],
  storageKey: "platform-language"
};

let translations = {};
let activeLanguage = I18N_CONFIG.defaultLanguage;

/**
 * تحقق من توفر localStorage
 */
function isLocalStorageAvailable() {
  try {
    const test = "__localStorage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

function getNestedValue(object, path) {
  return path.split(".").reduce((value, key) => value?.[key], object);
}

function translate(key, language = activeLanguage) {
  return (
    getNestedValue(translations[language], key) ??
    getNestedValue(translations[I18N_CONFIG.defaultLanguage], key) ??
    key
  );
}

function applyTranslations(language) {
  const safeLanguage = I18N_CONFIG.supportedLanguages.includes(language)
    ? language
    : I18N_CONFIG.defaultLanguage;

  activeLanguage = safeLanguage;

  document.documentElement.lang = safeLanguage;
  document.documentElement.dir = safeLanguage === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const value = translate(element.dataset.i18n, safeLanguage);
    element.textContent = value;
  });

  document.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const value = translate(element.dataset.i18nAriaLabel, safeLanguage);
    element.setAttribute("aria-label", value);
  });

  document.title = translate("meta.title", safeLanguage);

  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", translate("meta.description", safeLanguage));
  }

  const languageSelect = document.getElementById("language-select");
  if (languageSelect) {
    languageSelect.value = safeLanguage;
  }

  // حفظ اللغة في localStorage فقط إذا كانت متاحة
  if (isLocalStorageAvailable()) {
    localStorage.setItem(I18N_CONFIG.storageKey, safeLanguage);
  }

  // تستطيع الصفحات المستقبلية الاستماع إلى هذا الحدث لتحديث محتواها الخاص.
  document.dispatchEvent(
    new CustomEvent("platformLanguageChanged", {
      detail: { language: safeLanguage, direction: document.documentElement.dir }
    })
  );
}

async function loadTranslations() {
  try {
    const response = await fetch(I18N_CONFIG.translationsPath, { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`خطأ HTTP: ${response.status}`);
    }

    const data = await response.json();
    
    // تحقق من صحة البيانات
    if (!data || typeof data !== "object" || Object.keys(data).length === 0) {
      throw new Error("ملف الترجمات فارغ أو غير صحيح");
    }

    translations = data;
  } catch (error) {
    console.error("خطأ في تحميل ملف الترجمات:", error);
    throw new Error(`تعذر تحميل ملف الترجمات: ${error.message}`);
  }
}

function showSectionNotice() {
  const notice = document.getElementById("section-notice");
  if (!notice) return;

  notice.textContent = translate("home.nextStepNotice");
  notice.hidden = false;
  notice.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function initializePlatform() {
  const year = document.getElementById("current-year");
  if (year) year.textContent = new Date().getFullYear();

  try {
    await loadTranslations();

    let initialLanguage = I18N_CONFIG.defaultLanguage;

    // حاول الحصول على اللغة المحفوظة من localStorage
    if (isLocalStorageAvailable()) {
      const savedLanguage = localStorage.getItem(I18N_CONFIG.storageKey);
      if (I18N_CONFIG.supportedLanguages.includes(savedLanguage)) {
        initialLanguage = savedLanguage;
      }
    }

    // إذا لم تكن هناك لغة محفوظة، جرب لغة المتصفح
    if (initialLanguage === I18N_CONFIG.defaultLanguage) {
      const browserLanguage = navigator.language.slice(0, 2).toLowerCase();
      if (I18N_CONFIG.supportedLanguages.includes(browserLanguage)) {
        initialLanguage = browserLanguage;
      }
    }

    applyTranslations(initialLanguage);

    const languageSelect = document.getElementById("language-select");
    languageSelect?.addEventListener("change", (event) => {
      applyTranslations(event.target.value);

      const notice = document.getElementById("section-notice");
      if (notice && !notice.hidden) {
        notice.textContent = translate("home.nextStepNotice");
      }
    });

    document.querySelectorAll(".card-action").forEach((button) => {
      button.addEventListener("click", showSectionNotice);
    });
  } catch (error) {
    console.error("خطأ في تهيئة المنصة:", error);

    // يبقى النص العربي الموجود داخل HTML ظاهراً إذا كان الملف مفقوداً.
    const notice = document.getElementById("section-notice");
    if (notice) {
      notice.textContent = "⚠️ تعذر تحميل ملف الترجمات. تأكد من وضع translations.json داخل مجلد data.";
      notice.hidden = false;
      notice.style.backgroundColor = "#fff3cd";
      notice.style.borderColor = "#ffc107";
      notice.style.color = "#856404";
    }
  }
}

document.addEventListener("DOMContentLoaded", initializePlatform);

// واجهة عامة سنستخدمها لاحقاً داخل صفحات القرآن والحديث واللغة.
window.PlatformI18n = {
  applyLanguage: applyTranslations,
  getLanguage: () => activeLanguage,
  t: translate,
  isLocalStorageAvailable: isLocalStorageAvailable
};