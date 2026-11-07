"use strict";

/** قسم القرآن: اختيار السورة والقارئ، الإخفاء، الكاراوكي، التسجيل، التقدّم. */
(function () {
  const I = window.PlatformI18n;
  const S = window.PlatformStore;
  const $ = (id) => document.getElementById(id);

  const RECITERS = [7, 12, 2, 9, 3, 10];
  const API = "https://api.quran.com/api/v4/chapter_recitations/";
  const TRANSLATION_API = "https://api.alquran.cloud/v1/surah/";
  // ترجمة المعاني بلغة المنصة (وبالعربية: التفسير الميسّر).
  const EDITIONS = { ar: "ar.muyassar", en: "en.sahih", fr: "fr.hamidullah", es: "es.garcia", de: "de.aburida", it: "it.piccardo" };
  const TRANSLIT_EDITION = "en.transliteration";
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
  // نسبة الإخفاء: 0 = بدون إخفاء، ثم 10% → 100% بخطوة 10%.
  let hideLevel = Math.min(100, Math.max(0, Math.round((+pref.get("hideLevel", "0") || 0) / 10) * 10));
  let hideSeed = 1;
  // عدد الآيات التي يحفظها التلميذ دفعة واحدة (0 = كل السورة).
  let groupSize = [0, 1, 2, 3].includes(+pref.get("group", "0")) ? +pref.get("group", "0") : 0;
  let shownGroup = 0;       // أول آية في المجموعة المعروضة حاليًا
  const extrasCache = {};   // ترجمات وطريقة النطق المحمّلة
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
    shownGroup = 0;
    renderVerses();
    selectVerse(1, false);
    updateProgress();
    loadTranslation();
    await loadAudio();
  }

  /* ---------- الإخفاء التدريجي ---------- */
  // ترتيب ثابت للكلمات في كل آية: عند رفع النسبة تبقى الكلمات المخفية مخفية وتُضاف إليها كلمات جديدة.
  function hiddenSet(verseNumber, count) {
    const hidden = new Set();
    if (!hideLevel || !count) return hidden;
    let seed = ((surah ? surah.id : 0) * 1000 + verseNumber) * 7919 + hideSeed * 104729;
    const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
    const order = Array.from({ length: count }, (_, i) => i);
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    const n = Math.max(1, Math.round((count * hideLevel) / 100));
    order.slice(0, n).forEach((i) => hidden.add(i));
    return hidden;
  }

  /* ---------- مجموعات الآيات (1 أو 2 أو 3) ---------- */
  const groupStart = (n) => (groupSize ? Math.floor((n - 1) / groupSize) * groupSize + 1 : 1);
  const groupEnd = (n) => (groupSize ? Math.min(verses.length, groupStart(n) + groupSize - 1) : verses.length);

  function applyGroup() {
    document.querySelectorAll(".group-btn").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.group === groupSize)));
    const start = groupStart(current);
    const end = groupEnd(current);
    shownGroup = start;
    document.querySelectorAll(".verse").forEach((row) => {
      const n = +row.dataset.verse;
      row.hidden = n < start || n > end;
    });
    const b = document.querySelector(".bismillah");
    if (b) b.hidden = start !== 1;
    const label = $("repeat-label");
    label.dataset.i18n = groupSize ? "quran.repeatGroup" : "quran.repeat";
    label.textContent = I.t(label.dataset.i18n);
    $("prev").title = I.t(groupSize ? "quran.prevGroup" : "quran.prev");
    $("next").title = I.t(groupSize ? "quran.nextGroup" : "quran.next");
    $("prev").setAttribute("aria-label", $("prev").title);
    $("next").setAttribute("aria-label", $("next").title);
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
      const tl = document.createElement("p");
      tl.className = "verse-translit";
      tl.hidden = true;
      const tr = document.createElement("p");
      tr.className = "verse-translation";
      tr.hidden = true;
      row.append(text, tl, tr);
      box.appendChild(row);
    });
    applyHide();
    applyGroup();
    paintVerseStates();
  }

  function applyHide() {
    $("hide-off").setAttribute("aria-pressed", String(hideLevel === 0));
    $("hide-range").value = hideLevel;
    $("hide-value").textContent = hideLevel ? hideLevel + "%" : I.t("quran.hideNone");
    $("hide-less").disabled = hideLevel === 0;
    $("hide-more").disabled = hideLevel >= 100;
    $("hide-shuffle").disabled = hideLevel === 0 || hideLevel === 100;
    $("hide-tip").hidden = hideLevel === 0;
    document.querySelectorAll(".verse").forEach((row) => {
      const words = row.querySelectorAll(".word");
      const hidden = hiddenSet(+row.dataset.verse, words.length);
      words.forEach((w, i) => {
        w.classList.toggle("masked", hidden.has(i));
        w.classList.remove("revealed");
      });
      // طريقة النطق تكشف الكلمات المخفية، فتُغطّى أثناء الإخفاء (تظهر بالنقر).
      const tl = row.querySelector(".verse-translit");
      if (tl) tl.classList.toggle("covered", hideLevel > 0);
    });
  }

  function setHideLevel(value) {
    hideLevel = Math.min(100, Math.max(0, value));
    pref.set("hideLevel", String(hideLevel));
    applyHide();
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
    if (groupSize && groupStart(current) !== shownGroup) {
      // مجموعة جديدة: نعيد الإخفاء إلى 10% ليبدأ التلميذ الحفظ تدريجيًا.
      if (hideLevel > 10) setHideLevel(10);
      applyGroup();
    }
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
      if (groupSize) {
        // في وضع المجموعة: نقرأ آيات المجموعة متتالية ثم نكرّر المجموعة كلها.
        if (current < groupEnd(current)) { selectVerse(current + 1, true); return; }
        const first = groupStart(current);
        if (repeatLeft > 0 && timing[first]) {
          repeatLeft--;
          audio.currentTime = timing[first].from / 1000;
          selectVerse(first, true);
          return;
        }
        audio.pause();
        clearWord();
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
    if (n && n !== current && (!groupSize || groupStart(n) === shownGroup)) selectVerse(n, true);
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

  /* ---------- المعنى وطريقة النطق ---------- */
  // طريقة النطق مكتوبة أصلًا بحروف لاتينية على الطريقة الإنجليزية؛ نكيّفها مع قواعد قراءة كل لغة.
  const SOUND_RULES = {
    fr: { oo: "ou", ee: "i", sh: "ch", j: "dj" },
    de: { oo: "u", ee: "i", sh: "sch", j: "dsch", y: "j" },
    es: { oo: "u", ee: "i", kh: "j", j: "y" },
    it: { oo: "u", ee: "i", sh: (next) => (/[ei]/i.test(next) ? "sc" : "sci"), j: (next) => (/[ei]/i.test(next) ? "g" : "gi") }
  };
  function adaptTranslit(text, lang) {
    const clean = text.replace(/<[^>]*>/g, "");
    const rules = SOUND_RULES[lang];
    if (!rules) return clean;
    const pattern = new RegExp(Object.keys(rules).sort((a, b) => b.length - a.length).join("|"), "gi");
    return clean.replace(pattern, (m, offset, all) => {
      const rule = rules[m.toLowerCase()];
      let out = typeof rule === "function" ? rule(all.charAt(offset + m.length)) : rule;
      if (m[0] !== m[0].toLowerCase()) out = out.charAt(0).toUpperCase() + out.slice(1);
      return out;
    });
  }

  async function fetchEditions(id, editions) {
    const missing = editions.filter((e) => !extrasCache[id + "/" + e]);
    if (missing.length) {
      const json = await getJson(TRANSLATION_API + id + "/editions/" + missing.join(","));
      const list = Array.isArray(json.data) ? json.data : [json.data];
      list.forEach((ed, i) => { extrasCache[id + "/" + missing[i]] = ed.ayahs.map((a) => a.text); });
    }
    return editions.map((e) => extrasCache[id + "/" + e]);
  }

  async function loadTranslation() {
    const lang = I.getLanguage();
    const showMeaning = $("show-translation").checked;
    const showTranslit = lang !== "ar" && $("show-translit").checked;
    $("translit-wrap").hidden = lang === "ar";
    document.querySelectorAll(".verse-translation, .verse-translit").forEach((p) => { p.hidden = true; p.textContent = ""; });
    $("translation-error").hidden = true;
    if (!surah || (!showMeaning && !showTranslit)) return;
    const token = loadToken;
    const editions = [];
    if (showTranslit) editions.push(TRANSLIT_EDITION);
    if (showMeaning) editions.push(EDITIONS[lang] || EDITIONS.en);
    try {
      const results = await fetchEditions(surah.id, editions);
      if (token !== loadToken || I.getLanguage() !== lang) return;
      const translit = showTranslit ? results[0] : null;
      const meaning = showMeaning ? results[results.length - 1] : null;
      document.querySelectorAll(".verse").forEach((row) => {
        const i = +row.dataset.verse - 1;
        const tl = row.querySelector(".verse-translit");
        const tr = row.querySelector(".verse-translation");
        if (translit && translit[i]) {
          tl.textContent = adaptTranslit(translit[i], lang);
          tl.lang = lang + "-Latn";
          tl.dir = "ltr";
          tl.hidden = false;
        }
        if (meaning && meaning[i]) {
          tr.textContent = meaning[i];
          tr.lang = lang;
          tr.dir = lang === "ar" ? "rtl" : "ltr";
          tr.hidden = false;
        }
      });
      applyHide();
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
    $("hide-off").addEventListener("click", () => setHideLevel(0));
    $("hide-less").addEventListener("click", () => setHideLevel(hideLevel - 10));
    $("hide-more").addEventListener("click", () => setHideLevel(hideLevel + 10));
    $("hide-range").addEventListener("input", (e) => setHideLevel(+e.target.value));
    $("hide-shuffle").addEventListener("click", () => { hideSeed++; applyHide(); });
    document.querySelectorAll(".group-btn").forEach((b) => {
      b.addEventListener("click", () => {
        groupSize = +b.dataset.group;
        pref.set("group", String(groupSize));
        if (!audio.paused) audio.pause();
        shownGroup = 0;
        if (groupSize && hideLevel > 10) setHideLevel(10);
        applyGroup();
        selectVerse(groupStart(current), true);
      });
    });
    $("verses").addEventListener("click", (e) => {
      const row = e.target.closest(".verse");
      if (!row) return;
      const n = +row.dataset.verse;
      const word = e.target.closest(".word.masked");
      if (word) word.classList.toggle("revealed");
      const tl = e.target.closest(".verse-translit.covered");
      if (tl) tl.classList.add("uncovered");
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
    const step = (dir) => {
      let n;
      if (groupSize) n = dir < 0 ? Math.max(1, groupStart(current) - groupSize) : Math.min(verses.length, groupStart(current) + groupSize);
      else n = Math.max(1, Math.min(verses.length, current + dir));
      if (groupSize && groupStart(n) === shownGroup && n !== current) n = groupStart(n);
      return audio.paused ? selectVerse(n, true) : playVerse(n);
    };
    $("prev").addEventListener("click", () => step(-1));
    $("next").addEventListener("click", () => step(1));
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
    $("show-translit").addEventListener("change", (e) => {
      pref.set("translit", e.target.checked ? "1" : "0");
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
        applyHide();
        applyGroup();
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
    $("show-translit").checked = pref.get("translit", "1") === "1";
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
