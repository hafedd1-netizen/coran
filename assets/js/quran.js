"use strict";

/** قسم القرآن: اختيار السورة والقارئ، الإخفاء، الكاراوكي، التسجيل، التقدّم. */
(function () {
  const I = window.PlatformI18n;
  const S = window.PlatformStore;
  const $ = (id) => document.getElementById(id);

  const RECITERS = [7, 12, 2, 9, 3, 10];
  const API = "https://api.quran.com/api/v4/chapter_recitations/";
  const TRANSLATION_API = "https://api.alquran.cloud/v1/surah/";
  const EDITIONS = { en: "en.sahih", fr: "fr.hamidullah", es: "es.garcia", de: "de.aburida", it: "it.piccardo" };
  const SHORT = (id) => id === 1 || id >= 78;
  const pref = {
    get(k, d) { try { return localStorage.getItem("coran-" + k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("coran-" + k, v); } catch (e) { /* */ } }
  };

  let surahs = [];
  let tab = "short";
  let surah = null;
  let verses = [];          // [{words:[...]}]
  let timing = {};          // رقم الآية ← التوقيتات
  let current = 1;          // الآية المختارة
  let repeatLeft = 0;
  let singleVerse = null;   // دالة تُستدعى عند انتهاء آية واحدة
  let hideMode = pref.get("hide", "none");
  let bismillah = "";
  let loadToken = 0;

  const audio = new Audio();
  audio.preload = "metadata";
  let ticker = null;
  let activeWord = null;
  let recorder = null;
  let recChunks = [];
  let recTimer = null;
  let myAudio = null;

  /* ---------- التخزين المحلي للتسجيلات ---------- */
  const memoryRecordings = new Map();
  let dbPromise = null;
  function db() {
    if (dbPromise) return dbPromise;
    dbPromise = new Promise((resolve) => {
      try {
        const open = indexedDB.open("coran-recordings", 1);
        open.onupgradeneeded = () => open.result.createObjectStore("r");
        open.onsuccess = () => resolve(open.result);
        open.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
    return dbPromise;
  }
  async function recSave(key, blob) {
    memoryRecordings.set(key, blob);
    const d = await db();
    if (d) try { d.transaction("r", "readwrite").objectStore("r").put(blob, key); } catch (e) { /* */ }
  }
  async function recGet(key) {
    if (memoryRecordings.has(key)) return memoryRecordings.get(key);
    const d = await db();
    if (!d) return null;
    return new Promise((resolve) => {
      try {
        const q = d.transaction("r").objectStore("r").get(key);
        q.onsuccess = () => resolve(q.result || null);
        q.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
  }
  async function recDelete(key) {
    memoryRecordings.delete(key);
    const d = await db();
    if (d) try { d.transaction("r", "readwrite").objectStore("r").delete(key); } catch (e) { /* */ }
  }

  /* ---------- النص ---------- */
  // علامات الوقف المنفصلة تُضمّ إلى الكلمة السابقة حتى يطابق الترقيم توقيتات التلاوة.
  function tokenize(text) {
    const out = [];
    text.split(/\s+/).filter(Boolean).forEach((part) => {
      if (out.length && !/[ء-ي]/.test(part)) out[out.length - 1] += " " + part;
      else out.push(part);
    });
    return out;
  }
  const arabicNumber = (n) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[d]);
  const dataUrl = (path) => new URL("data/" + path, document.baseURI).href;
  const getJson = async (url) => {
    const r = await fetch(url);
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.json();
  };

  /* ---------- قائمة السور ---------- */
  function renderPicker() {
    const q = $("surah-search").value.trim().toLowerCase();
    const grid = $("surah-grid");
    grid.textContent = "";
    let list = surahs.filter((s) => (tab === "all" || q ? true : SHORT(s.id)));
    if (tab === "short" && !q) list = list.slice().sort((a, b) => (a.id === 1 ? -1 : b.id === 1 ? 1 : b.id - a.id));
    if (q) list = list.filter((s) => s.name.includes(q) || s.tr.toLowerCase().includes(q) || String(s.id) === q);
    list.forEach((s) => {
      const percent = S.surahPercent(s.id, s.n);
      const a = document.createElement("a");
      a.className = "surah-card";
      a.href = "#s=" + s.id;
      const num = document.createElement("span");
      num.className = "surah-num";
      num.textContent = s.id;
      const body = document.createElement("span");
      body.className = "surah-body";
      const name = document.createElement("span");
      name.className = "surah-name";
      name.lang = "ar";
      name.dir = "rtl";
      name.textContent = s.name;
      const meta = document.createElement("span");
      meta.className = "surah-meta";
      meta.textContent = (I.getLanguage() === "ar" ? "" : s.tr + " · ") + s.n + " " + I.t("quran.verses");
      const bar = document.createElement("span");
      bar.className = "mini-bar";
      const fill = document.createElement("span");
      fill.style.width = percent + "%";
      bar.appendChild(fill);
      body.append(name, meta, bar);
      const pc = document.createElement("span");
      pc.className = "surah-percent";
      pc.textContent = percent + "%";
      a.append(num, body, pc);
      grid.appendChild(a);
    });
  }

  /* ---------- القارئ ---------- */
  function fillReciters() {
    const select = $("reciter");
    const value = select.value || pref.get("reciter", "7");
    select.textContent = "";
    RECITERS.forEach((id) => {
      const o = document.createElement("option");
      o.value = id;
      o.textContent = I.t("reciters." + id);
      select.appendChild(o);
    });
    select.value = RECITERS.includes(+value) ? value : "7";
  }

  async function openSurah(id) {
    stopEverything();
    const token = ++loadToken;
    const meta = surahs.find((s) => s.id === id);
    if (!meta) { location.hash = ""; return; }
    $("picker").hidden = true;
    $("reader").hidden = false;
    $("dock").hidden = false;
    document.body.classList.add("has-dock");
    window.scrollTo(0, 0);
    $("surah-title").textContent = meta.name;
    $("surah-subtitle").textContent = I.getLanguage() === "ar" ? "" : meta.tr;
    $("verses").textContent = "";
    const [data, fatiha] = await Promise.all([
      getJson(dataUrl("quran/" + String(id).padStart(3, "0") + ".json")),
      bismillah ? null : getJson(dataUrl("quran/001.json"))
    ]);
    if (token !== loadToken) return;
    if (fatiha) bismillah = fatiha.verses[0];
    surah = meta;
    verses = data.verses.map((text) => ({ words: tokenize(text) }));
    current = 1;
    renderVerses();
    selectVerse(1, false);
    updateProgress();
    loadTranslation();
    await loadAudio();
  }

  function isWordHidden(i, n) {
    switch (hideMode) {
      case "some": return i % 3 === 2;
      case "half": return i % 2 === 1;
      case "hint": return i > 0;
      case "all": return true;
      default: return false;
    }
  }

  function renderVerses() {
    const box = $("verses");
    box.textContent = "";
    if (surah.id !== 1 && surah.id !== 9) {
      const b = document.createElement("p");
      b.className = "bismillah";
      b.lang = "ar";
      b.dir = "rtl";
      b.textContent = bismillah;
      box.appendChild(b);
    }
    verses.forEach((verse, index) => {
      const n = index + 1;
      const row = document.createElement("article");
      row.className = "verse";
      row.dataset.verse = n;
      const text = document.createElement("p");
      text.className = "verse-text";
      text.lang = "ar";
      text.dir = "rtl";
      verse.words.forEach((word, i) => {
        const w = document.createElement("span");
        w.className = "word";
        w.dataset.i = i;
        w.textContent = word;
        text.append(w, " ");
      });
      const mark = document.createElement("span");
      mark.className = "verse-mark";
      mark.textContent = arabicNumber(n);
      text.appendChild(mark);
      const tr = document.createElement("p");
      tr.className = "verse-translation";
      tr.hidden = true;
      row.append(text, tr);
      box.appendChild(row);
    });
    applyHide();
    paintVerseStates();
  }

  function applyHide() {
    document.querySelectorAll(".hide-btn").forEach((b) => b.setAttribute("aria-pressed", b.dataset.hide === hideMode));
    $("hide-tip").hidden = hideMode === "none";
    document.querySelectorAll(".verse").forEach((row) => {
      row.classList.toggle("verse-masked", hideMode === "verse");
      row.classList.remove("verse-revealed");
      const words = row.querySelectorAll(".word");
      words.forEach((w, i) => {
        w.classList.toggle("masked", isWordHidden(i, words.length));
        w.classList.remove("revealed");
      });
    });
  }

  function paintVerseStates() {
    if (!surah) return;
    document.querySelectorAll(".verse").forEach((row) => {
      const v = S.verse(surah.id, row.dataset.verse);
      row.classList.toggle("is-memorized", !!v.m);
      row.classList.toggle("is-current", +row.dataset.verse === current);
    });
  }

  function updateProgress() {
    const percent = S.surahPercent(surah.id, verses.length);
    $("progress-fill").style.width = percent + "%";
    $("progress-percent").textContent = percent + "%";
    $("progress-bar").setAttribute("aria-valuenow", percent);
    $("progress-count").textContent = I.t("quran.memorizedOf", { n: S.memorizedCount(surah.id), t: verses.length });
  }

  async function selectVerse(n, scroll) {
    current = Math.max(1, Math.min(verses.length, n));
    paintVerseStates();
    $("dock-verse").textContent = I.t("quran.verseN", { n: current });
    const row = document.querySelector('.verse[data-verse="' + current + '"]');
    if (row && scroll) row.scrollIntoView({ block: "center", behavior: "smooth" });
    const v = S.verse(surah.id, current);
    $("mark-mem").textContent = I.t(v.m ? "quran.unmarkMem" : "quran.markMem");
    $("mark-mem").classList.toggle("done", !!v.m);
    const saved = await recGet(surah.id + ":" + current);
    $("rec-tools").hidden = !saved;
  }

  /* ---------- الصوت والكاراوكي ---------- */
  async function loadAudio() {
    const token = loadToken;
    const reciter = $("reciter").value;
    timing = {};
    showAudioError(false);
    $("play").disabled = true;
    try {
      const json = await getJson(API + reciter + "/" + surah.id + "?segments=true");
      if (token !== loadToken) return;
      const file = json.audio_file;
      (file.timestamps || []).forEach((t) => {
        const n = +t.verse_key.split(":")[1];
        timing[n] = { from: t.timestamp_from, to: t.timestamp_to, segments: (t.segments || []).filter((s) => s.length >= 3) };
      });
      audio.src = file.audio_url;
      audio.load();
      $("play").disabled = false;
    } catch (e) {
      console.error(e);
      if (token === loadToken) showAudioError(true);
    }
  }

  function showAudioError(show) {
    $("audio-error").hidden = !show;
  }

  function seekTo(ms) {
    return new Promise((resolve) => {
      const go = () => { audio.currentTime = ms / 1000; resolve(); };
      if (audio.readyState >= 1) go();
      else audio.addEventListener("loadedmetadata", go, { once: true });
    });
  }

  async function playVerse(n) {
    if (myAudio) myAudio.pause();
    await selectVerse(n, true);
    repeatLeft = +$("repeat").value - 1;
    if (timing[current]) await seekTo(timing[current].from);
    audio.playbackRate = +$("speed").value;
    try { await audio.play(); } catch (e) { console.error(e); showAudioError(true); }
  }

  function verseAt(ms) {
    for (let n = 1; n <= verses.length; n++) {
      const t = timing[n];
      if (t && ms >= t.from && ms < t.to) return n;
    }
    return null;
  }

  function clearWord() {
    if (activeWord) activeWord.classList.remove("karaoke");
    activeWord = null;
  }

  function highlight(ms, n) {
    const t = timing[n];
    const row = document.querySelector('.verse[data-verse="' + n + '"]');
    if (!t || !row) return clearWord();
    const words = row.querySelectorAll(".word");
    let segment = null;
    t.segments.forEach((s) => { if (ms >= s[1]) segment = s; });
    if (!segment) return clearWord();
    // في آيات قليلة يختلف تقسيم الكلمات بين الرسم والتوقيتات، فيُحسب الموضع بالتناسب.
    const maxPos = t.segments.reduce((m, s) => Math.max(m, s[0]), 0);
    const pos = maxPos === words.length ? segment[0] - 1 : Math.round(((segment[0] - 1) * (words.length - 1)) / Math.max(1, maxPos - 1));
    const el = words[Math.max(0, Math.min(words.length - 1, pos))];
    if (el !== activeWord) {
      clearWord();
      activeWord = el;
      if (el) el.classList.add("karaoke");
    }
  }

  function markListened(n) {
    if (!S.verse(surah.id, n).l) {
      S.setVerse(surah.id, n, "l", 1);
      updateProgress();
    }
  }

  function tick() {
    if (!surah || audio.paused) return;
    const ms = audio.currentTime * 1000;
    const t = timing[current];
    if (t && ms >= t.to - 40) {
      markListened(current);
      if (singleVerse) {
        const done = singleVerse;
        singleVerse = null;
        audio.pause();
        clearWord();
        done();
        return;
      }
      if (repeatLeft > 0) {
        repeatLeft--;
        audio.currentTime = t.from / 1000;
        return;
      }
      if (current >= verses.length) {
        audio.pause();
        clearWord();
        return;
      }
      repeatLeft = +$("repeat").value - 1;
      selectVerse(current + 1, true);
      return;
    }
    const n = verseAt(ms);
    if (n && n !== current) selectVerse(n, true);
    highlight(ms, n || current);
  }

  function syncPlayButton() {
    const playing = !audio.paused;
    $("play-icon").textContent = playing ? "⏸" : "▶";
    $("play").setAttribute("aria-label", I.t(playing ? "quran.pause" : "quran.play"));
    $("play").setAttribute("title", I.t(playing ? "quran.pause" : "quran.play"));
    clearInterval(ticker);
    if (playing) ticker = setInterval(tick, 70);
  }

  function stopEverything() {
    audio.pause();
    clearWord();
    singleVerse = null;
    if (myAudio) myAudio.pause();
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  /* ---------- التسجيل ---------- */
  function micMessage(key) {
    const box = $("rec-message");
    box.textContent = key ? I.t(key) : "";
    box.hidden = !key;
  }

  async function toggleRecord() {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
      return;
    }
    micMessage(null);
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      micMessage("quran.micUnsupported");
      return;
    }
    let stream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
      micMessage("quran.micDenied");
      return;
    }
    audio.pause();
    if (myAudio) myAudio.pause();
    const key = surah.id + ":" + current;
    const verseNumber = current;
    const surahId = surah.id;
    recChunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size) recChunks.push(e.data); };
    recorder.onstop = async () => {
      clearTimeout(recTimer);
      stream.getTracks().forEach((track) => track.stop());
      setRecordingUi(false);
      if (!recChunks.length) return;
      await recSave(key, new Blob(recChunks, { type: recorder.mimeType || "audio/webm" }));
      if (!S.verse(surahId, verseNumber).r) S.setVerse(surahId, verseNumber, "r", 1);
      if (surah && surah.id === surahId) {
        updateProgress();
        if (current === verseNumber) $("rec-tools").hidden = false;
      }
    };
    recorder.start();
    setRecordingUi(true);
    recTimer = setTimeout(() => { if (recorder.state === "recording") recorder.stop(); }, 180000);
  }

  function setRecordingUi(on) {
    $("record").classList.toggle("recording", on);
    $("record-label").textContent = I.t(on ? "quran.stop" : "quran.record");
    $("record-icon").textContent = on ? "⏹" : "🎤";
  }

  async function playMine(after) {
    const blob = await recGet(surah.id + ":" + current);
    if (!blob) return;
    audio.pause();
    if (myAudio) myAudio.pause();
    myAudio = new Audio(URL.createObjectURL(blob));
    myAudio.onended = () => {
      URL.revokeObjectURL(myAudio.src);
      if (after) after();
    };
    try { await myAudio.play(); } catch (e) { console.error(e); }
  }

  async function compare() {
    if (!timing[current]) { playMine(); return; }
    if (myAudio) myAudio.pause();
    singleVerse = () => playMine();
    await seekTo(timing[current].from);
    audio.playbackRate = +$("speed").value;
    try { await audio.play(); } catch (e) { singleVerse = null; playMine(); }
  }

  /* ---------- الترجمة ---------- */
  async function loadTranslation() {
    const lang = I.getLanguage();
    const wrap = $("translation-wrap");
    wrap.hidden = lang === "ar";
    document.querySelectorAll(".verse-translation").forEach((p) => { p.hidden = true; p.textContent = ""; });
    $("translation-error").hidden = true;
    if (lang === "ar" || !$("show-translation").checked || !surah) return;
    const token = loadToken;
    try {
      const json = await getJson(TRANSLATION_API + surah.id + "/" + EDITIONS[lang]);
      if (token !== loadToken || I.getLanguage() !== lang) return;
      json.data.ayahs.forEach((a) => {
        const row = document.querySelector('.verse[data-verse="' + a.numberInSurah + '"] .verse-translation');
        if (row) {
          row.textContent = a.text;
          row.dir = "auto";
          row.hidden = false;
        }
      });
    } catch (e) {
      console.error(e);
      $("translation-error").hidden = false;
    }
  }

  /* ---------- الاحتفال ---------- */
  function bravo() {
    const toast = $("toast");
    toast.textContent = I.t("quran.bravo");
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2200);
  }

  /* ---------- التوجيه ---------- */
  function route() {
    const m = location.hash.match(/s=(\d+)/);
    if (m) {
      openSurah(+m[1]).catch((e) => { console.error(e); showAudioError(true); });
    } else {
      stopEverything();
      loadToken++;
      surah = null;
      $("reader").hidden = true;
      $("dock").hidden = true;
      document.body.classList.remove("has-dock");
      $("picker").hidden = false;
      renderPicker();
    }
  }

  /* ---------- الربط ---------- */
  function bind() {
    $("surah-search").addEventListener("input", renderPicker);
    document.querySelectorAll(".tab-btn").forEach((b) => {
      b.addEventListener("click", () => {
        tab = b.dataset.tab;
        document.querySelectorAll(".tab-btn").forEach((x) => x.setAttribute("aria-selected", x === b));
        renderPicker();
      });
    });
    document.querySelectorAll(".hide-btn").forEach((b) => {
      b.addEventListener("click", () => {
        hideMode = b.dataset.hide;
        pref.set("hide", hideMode);
        applyHide();
      });
    });
    $("verses").addEventListener("click", (e) => {
      const row = e.target.closest(".verse");
      if (!row) return;
      const n = +row.dataset.verse;
      if (row.classList.contains("verse-masked") && !row.classList.contains("verse-revealed")) {
        row.classList.add("verse-revealed");
      } else {
        const word = e.target.closest(".word.masked");
        if (word && !word.classList.contains("revealed")) word.classList.add("revealed");
      }
      if (n !== current) {
        if (!audio.paused) playVerse(n);
        else selectVerse(n, false);
      }
    });
    $("play").addEventListener("click", () => {
      if (audio.paused) {
        const ms = audio.currentTime * 1000;
        const t = timing[current];
        if (t && ms >= t.from && ms < t.to) {
          audio.playbackRate = +$("speed").value;
          audio.play().catch(() => showAudioError(true));
        } else playVerse(current);
      } else audio.pause();
    });
    $("prev").addEventListener("click", () => (audio.paused ? selectVerse(current - 1, true) : playVerse(Math.max(1, current - 1))));
    $("next").addEventListener("click", () => (audio.paused ? selectVerse(current + 1, true) : playVerse(Math.min(verses.length, current + 1))));
    audio.addEventListener("play", syncPlayButton);
    audio.addEventListener("pause", () => { syncPlayButton(); });
    audio.addEventListener("ended", () => { syncPlayButton(); clearWord(); if (surah) markListened(current); });
    audio.addEventListener("error", () => { if (audio.src) showAudioError(true); });
    $("speed").addEventListener("change", (e) => { audio.playbackRate = +e.target.value; });
    $("repeat").addEventListener("change", (e) => { repeatLeft = +e.target.value - 1; });
    $("reciter").addEventListener("change", (e) => {
      pref.set("reciter", e.target.value);
      audio.pause();
      if (surah) loadAudio();
    });
    $("audio-retry").addEventListener("click", () => { if (surah) loadAudio(); });
    $("show-translation").addEventListener("change", (e) => {
      pref.set("translation", e.target.checked ? "1" : "0");
      loadTranslation();
    });
    $("record").addEventListener("click", toggleRecord);
    $("listen-me").addEventListener("click", () => playMine());
    $("compare").addEventListener("click", compare);
    $("delete-rec").addEventListener("click", async () => {
      await recDelete(surah.id + ":" + current);
      S.setVerse(surah.id, current, "r", 0);
      $("rec-tools").hidden = true;
      updateProgress();
    });
    $("mark-mem").addEventListener("click", () => {
      const was = !!S.verse(surah.id, current).m;
      S.setVerse(surah.id, current, "m", was ? 0 : 1);
      if (!was) { S.addXp(5); bravo(); }
      selectVerse(current, false);
      updateProgress();
    });
    window.addEventListener("hashchange", route);
    document.addEventListener("platformLanguageChanged", () => {
      fillReciters();
      if (surah) {
        $("surah-subtitle").textContent = I.getLanguage() === "ar" ? "" : surah.tr;
        updateProgress();
        selectVerse(current, false);
        syncPlayButton();
        setRecordingUi(!!(recorder && recorder.state === "recording"));
        loadTranslation();
      } else renderPicker();
    });
  }

  async function start() {
    await I.ready;
    fillReciters();
    $("show-translation").checked = pref.get("translation", "1") === "1";
    bind();
    setRecordingUi(false);
    try {
      surahs = await getJson(dataUrl("quran/surahs.json"));
    } catch (e) {
      console.error(e);
      return;
    }
    route();
  }

  document.addEventListener("DOMContentLoaded", start);
})();
