"use strict";

/**
 * نظام الترجمة المشترك: اللغة التي يختارها المستخدم في أي صفحة
 * تُحفظ وتُطبَّق على كل صفحات المنصة.
 * لإضافة نص: أضف مفتاحه إلى data/translations.json في اللغات الست،
 * ثم ضع data-i18n="اسم.المفتاح" على العنصر.
 */
(function () {
  const scriptUrl = document.currentScript && document.currentScript.src;
  const SUPPORTED = ["ar", "en", "fr", "es", "de", "it"];
  const STORAGE_KEY = "platform-language";
  const FALLBACK = "en"; // جمهور المنصة خارج البلاد العربية

  let translations = {};
  let active = "ar";
  let resolveReady;
  const ready = new Promise((resolve) => { resolveReady = resolve; });

  const readSaved = () => {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  };
  const save = (lang) => {
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* وضع التصفح الخاص */ }
  };
  const nested = (obj, path) => path.split(".").reduce((v, k) => (v == null ? v : v[k]), obj);

  function t(key, vars) {
    let value = nested(translations[active], key);
    if (value == null) value = nested(translations.ar, key);
    if (value == null) value = key;
    if (vars) Object.keys(vars).forEach((k) => { value = value.split("{" + k + "}").join(vars[k]); });
    return value;
  }

  function apply(language) {
    active = SUPPORTED.includes(language) ? language : FALLBACK;
    const root = document.documentElement;
    root.lang = active;
    root.dir = active === "ar" ? "rtl" : "ltr";

    document.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => { el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel)); });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      el.setAttribute("title", t(el.dataset.i18nTitle));
      el.setAttribute("aria-label", t(el.dataset.i18nTitle));
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => { el.setAttribute("placeholder", t(el.dataset.i18nPlaceholder)); });

    document.title = t(document.body.dataset.metaTitleKey || "meta.title");
    const description = document.querySelector('meta[name="description"]');
    if (description) description.setAttribute("content", t("meta.description"));

    document.querySelectorAll(".language-select").forEach((select) => { select.value = active; });
    save(active);
    root.classList.remove("i18n-pending");
    document.dispatchEvent(new CustomEvent("platformLanguageChanged", { detail: { language: active } }));
  }

  async function init() {
    const year = document.getElementById("current-year");
    if (year) year.textContent = new Date().getFullYear();
    try {
      const url = scriptUrl ? new URL("../../data/translations.json", scriptUrl).href : "data/translations.json";
      const response = await fetch(url, { cache: "no-cache" });
      if (!response.ok) throw new Error("translations " + response.status);
      translations = await response.json();
      const saved = readSaved();
      const browser = (navigator.language || "").slice(0, 2).toLowerCase();
      apply(SUPPORTED.includes(saved) ? saved : SUPPORTED.includes(browser) ? browser : FALLBACK);
      document.querySelectorAll(".language-select").forEach((select) => {
        select.addEventListener("change", (event) => apply(event.target.value));
      });
    } catch (error) {
      // يبقى النص العربي الموجود داخل الصفحة ظاهرًا إذا تعذّر تحميل الترجمات.
      console.error(error);
      document.documentElement.classList.remove("i18n-pending");
    }
    resolveReady();
  }

  document.addEventListener("DOMContentLoaded", init);
  window.PlatformI18n = { t, ready, getLanguage: () => active, applyLanguage: apply };
})();
