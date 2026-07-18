
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

  // تسمح كل صفحة بتخصيص عنوانها ووصفها عبر data-meta-title-key/data-meta-description-key
  // على وسم body، وإلا سيُستخدم عنوان الصفحة الرئيسية كقيمة افتراضية.
  const titleKey = document.body.dataset.metaTitleKey || "meta.title";
  const descriptionKey = document.body.dataset.metaDescriptionKey || "meta.description";

  document.title = translate(titleKey, safeLanguage);

  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", translate(descriptionKey, safeLanguage));
  }

  const languageSelect = document.getElementById("language-select");
  if (languageSelect) {
    languageSelect.value = safeLanguage;
  }

  localStorage.setItem(I18N_CONFIG.storageKey, safeLanguage);

  // تستطيع الصفحات المستقبلية الاستماع إلى هذا الحدث لتحديث محتواها الخاص.
  document.dispatchEvent(
    new CustomEvent("platformLanguageChanged", {
      detail: { language: safeLanguage, direction: document.documentElement.dir }
    })
  );
}

async function loadTranslations() {
  const response = await fetch(I18N_CONFIG.translationsPath, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`تعذر تحميل ملف الترجمات: ${response.status}`);
  }

  translations = await response.json();
}

async function initializePlatform() {
  const year = document.getElementById("current-year");
  if (year) year.textContent = new Date().getFullYear();

  try {
    await loadTranslations();

    const savedLanguage = localStorage.getItem(I18N_CONFIG.storageKey);
    const browserLanguage = navigator.language.slice(0, 2).toLowerCase();
    const initialLanguage = I18N_CONFIG.supportedLanguages.includes(savedLanguage)
      ? savedLanguage
      : I18N_CONFIG.supportedLanguages.includes(browserLanguage)
        ? browserLanguage
        : I18N_CONFIG.defaultLanguage;

    applyTranslations(initialLanguage);

    const languageSelect = document.getElementById("language-select");
    languageSelect?.addEventListener("change", (event) => {
      applyTranslations(event.target.value);
    });
  } catch (error) {
    console.error(error);

    // يبقى النص العربي الموجود داخل HTML ظاهراً إذا كان الملف مفقوداً.
    const notice = document.getElementById("section-notice");
    if (notice) {
      notice.textContent = "تعذر تحميل ملف الترجمات. تأكد من وضع translations.json داخل مجلد data.";
      notice.hidden = false;
    }
  }
}

document.addEventListener("DOMContentLoaded", initializePlatform);

// واجهة عامة سنستخدمها لاحقاً داخل صفحات القرآن والحديث واللغة.
window.PlatformI18n = {
  applyLanguage: applyTranslations,
  getLanguage: () => activeLanguage,
  t: translate
};
