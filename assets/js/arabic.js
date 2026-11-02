"use strict";

/** قسم العربية: مسار دروس بأسلوب الألعاب، يضم الأحاديث والقيم الإسلامية. */
(function () {
  const I = window.PlatformI18n;
  const S = window.PlatformStore;
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const arEl = (tag, cls, text) => {
    const e = el(tag, cls, text);
    e.lang = "ar";
    e.dir = "rtl";
    return e;
  };
  const shuffle = (list) => {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let units = [];
  let lesson = null;

  const lang = () => I.getLanguage();
  const meaning = (item) => item.m[lang()] || item.m.en;
  const local = (obj) => obj[lang()] || obj.en;
  const lessonId = (u, l) => units[u].id + "-" + l;

  /* ---------- النطق بصوت المتصفح ---------- */
  let voice = null;
  function findVoice() {
    if (!("speechSynthesis" in window)) return;
    voice = speechSynthesis.getVoices().find((v) => v.lang && v.lang.toLowerCase().startsWith("ar")) || null;
  }
  function speak(text) {
    if (!voice) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = 0.8;
    speechSynthesis.speak(u);
  }
  function speakButton(text) {
    const b = el("button", "speak-btn", "🔊");
    b.type = "button";
    b.setAttribute("aria-label", I.t("ex.speak"));
    b.title = I.t("ex.speak");
    b.hidden = !voice;
    b.addEventListener("click", () => speak(text));
    return b;
  }

  /* ---------- المسار ---------- */
  function isUnlocked(u, l) {
    if (l > 0) return S.lessonStars(lessonId(u, l - 1)) > 0;
    if (u === 0) return true;
    return S.lessonStars(lessonId(u - 1, 2)) > 0;
  }

  function renderPath() {
    const path = $("path");
    path.textContent = "";
    units.forEach((unit, u) => {
      const section = el("section", "unit unit-" + (u % 4));
      const banner = el("header", "unit-banner");
      const icon = el("span", "unit-icon", unit.icon);
      icon.setAttribute("aria-hidden", "true");
      const copy = el("div");
      copy.append(el("small", "", I.t("arabic.unit", { n: u + 1 })), el("h2", "", local(unit.title)), el("p", "", local(unit.value)));
      banner.append(icon, copy);
      const nodes = el("ol", "lesson-nodes");
      [0, 1, 2].forEach((l) => {
        const stars = S.lessonStars(lessonId(u, l));
        const open = isUnlocked(u, l);
        const li = el("li", "node-wrap node-" + l);
        const b = el("button", "lesson-node " + (stars ? "done" : open ? "open" : "locked"));
        b.type = "button";
        b.disabled = !open;
        b.append(el("span", "node-icon", stars ? "✓" : open ? String(l + 1) : "🔒"));
        const label = el("span", "node-label", I.t("arabic.lesson" + (l + 1)));
        const starRow = el("span", "node-stars", "★".repeat(stars) + "☆".repeat(3 - stars));
        starRow.setAttribute("aria-hidden", "true");
        if (open) b.addEventListener("click", () => startLesson(u, l));
        else b.title = I.t("arabic.locked");
        li.append(b, label, starRow);
        nodes.appendChild(li);
      });
      section.append(banner, nodes);
      path.appendChild(section);
    });
  }

  function renderHadiths() {
    const box = $("hadith-list");
    box.textContent = "";
    box.appendChild(el("p", "hadith-note", I.t("arabic.translationNote")));
    units.forEach((unit) => box.appendChild(hadithCard(unit)));
  }

  function hadithCard(unit) {
    const card = el("article", "hadith-card");
    card.append(el("h3", "", unit.icon + " " + local(unit.title)));
    card.append(el("small", "hadith-lead", I.t("arabic.hadithIntro")));
    card.append(arEl("p", "hadith-text", unit.hadith.ar));
    if (lang() !== "ar") card.append(el("p", "hadith-meaning", meaning(unit.hadith)));
    const learn = el("p", "hadith-learn");
    learn.append(el("strong", "", I.t("arabic.hadithLesson") + " "), document.createTextNode(local(unit.hadith.lesson)));
    card.append(learn);
    const src = lang() === "ar" ? arEl("small", "hadith-source", unit.hadith.src.ar) : el("small", "hadith-source", unit.hadith.src.latin);
    card.append(src);
    return card;
  }

  /* ---------- بناء الدرس ---------- */
  function allWords() {
    return units.reduce((list, unit) => list.concat(unit.words), []);
  }
  function allSentences() {
    return units.reduce((list, unit) => list.concat(unit.sentences), []);
  }
  function distractors(item, pool, count) {
    return shuffle(pool.filter((x) => x !== item && x.ar !== item.ar)).slice(0, count);
  }

  function buildExercises(u, l) {
    const unit = units[u];
    const list = [];
    const pushQuiz = (word, pool) => {
      list.push({ type: "meaning", item: word, options: shuffle([word].concat(distractors(word, pool, 3))) });
      list.push({ type: "arabic", item: word, options: shuffle([word].concat(distractors(word, pool, 3))) });
      if (voice) list.push({ type: "listen", item: word, options: shuffle([word].concat(distractors(word, pool, 3))) });
    };
    if (l < 2) {
      const fresh = unit.words.slice(l * 3, l * 3 + 3);
      const pool = unit.words.concat(allWords());
      fresh.forEach((word) => list.push({ type: "intro", item: word }));
      const quizzes = [];
      const before = list.length;
      fresh.forEach((word) => pushQuiz(word, pool));
      quizzes.push(...list.splice(before));
      list.push(...shuffle(quizzes));
      list.push({ type: "match", items: l === 0 ? fresh : unit.words.slice(0, 5) });
    } else {
      list.push({ type: "match", items: shuffle(unit.words).slice(0, 4) });
      const pool = allSentences();
      unit.sentences.forEach((sentence) => {
        list.push({ type: "meaning", item: sentence, options: shuffle([sentence].concat(distractors(sentence, unit.sentences.concat(pool), 2))) });
        list.push({ type: "build", item: sentence, extra: shuffle(pool.filter((s) => s !== sentence).map((s) => s.ar.split(" ")).flat().filter((w) => !sentence.ar.split(" ").includes(w))).slice(0, 2) });
      });
      list.push({ type: "hadith", unit });
      const others = shuffle(units.filter((x) => x !== unit)).slice(0, 2).map((x) => local(x.hadith.lesson));
      list.push({ type: "hadithQ", unit, options: shuffle([local(unit.hadith.lesson)].concat(others)) });
    }
    return list;
  }

  function startLesson(u, l) {
    findVoice();
    const queue = buildExercises(u, l);
    lesson = { u, l, queue, index: 0, total: queue.length, mistakes: 0, done: 0 };
    $("lesson").hidden = false;
    document.body.classList.add("lesson-open");
    renderExercise();
    $("lesson-close").focus();
  }

  function closeLesson() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    lesson = null;
    $("lesson").hidden = true;
    document.body.classList.remove("lesson-open");
    renderPath();
  }

  /* ---------- عرض التمرين ---------- */
  function setFooter(state, message, detail) {
    const foot = $("lesson-foot");
    foot.className = "lesson-foot " + state;
    $("foot-message").textContent = message || "";
    $("foot-detail").textContent = detail || "";
    $("foot-detail").hidden = !detail;
    if (detail) $("foot-detail").lang = /[؀-ۿ]/.test(detail) ? "ar" : "";
  }

  function setAction(labelKey, enabled, handler) {
    const b = $("lesson-action");
    b.textContent = I.t(labelKey);
    b.disabled = !enabled;
    b.onclick = handler;
  }

  function promptGloss(item) {
    return (item.emoji ? item.emoji + " " : "") + meaning(item);
  }

  function renderExercise() {
    if (!lesson) return;
    if (lesson.index >= lesson.queue.length) return renderFinish();
    const ex = lesson.queue[lesson.index];
    const body = $("lesson-body");
    body.textContent = "";
    $("lesson-progress").style.width = Math.round((lesson.done / lesson.total) * 100) + "%";
    setFooter("", "", "");
    ({ intro: exIntro, meaning: exMeaning, arabic: exArabic, listen: exListen, match: exMatch, build: exBuild, hadith: exHadith, hadithQ: exHadithQ })[ex.type](ex, body);
    body.scrollTop = 0;
  }

  function next(requeue) {
    const ex = lesson.queue[lesson.index];
    lesson.index++;
    if (requeue) lesson.queue.push(ex);
    else lesson.done++;
    renderExercise();
  }

  function answered(correct, ex, answerText) {
    if (correct) {
      setFooter("good", I.t("ex.correct"), "");
    } else {
      lesson.mistakes++;
      setFooter("bad", I.t("ex.wrong"), answerText);
    }
    setAction("ex.continue", true, () => next(!correct));
    $("lesson-action").focus();
  }

  function exIntro(ex, body) {
    const card = el("div", "intro-card");
    card.append(el("small", "ex-tag", I.t("ex.new")), el("div", "intro-emoji", ex.item.emoji));
    const row = el("div", "ar-row");
    row.append(arEl("p", "intro-ar", ex.item.ar), speakButton(ex.item.ar));
    card.append(row, el("p", "intro-tr", ex.item.tr), el("p", "intro-meaning", meaning(ex.item)));
    body.append(card);
    setAction("ex.continue", true, () => next(false));
    if (voice) speak(ex.item.ar);
  }

  function optionsList(options, render, isCorrect, ex, answerText) {
    const box = el("div", "options");
    let chosen = null;
    shuffle(options).forEach((opt) => {
      const b = el("button", "option");
      b.type = "button";
      render(b, opt);
      b.addEventListener("click", () => {
        if (chosen === "locked") return;
        box.querySelectorAll(".option").forEach((o) => o.classList.remove("selected"));
        b.classList.add("selected");
        chosen = { b, opt };
        setAction("ex.check", true, () => {
          const good = isCorrect(chosen.opt);
          chosen.b.classList.add(good ? "right" : "wrong");
          chosen = "locked";
          box.querySelectorAll(".option").forEach((o) => { o.disabled = true; });
          answered(good, ex, answerText);
        });
      });
      box.appendChild(b);
    });
    setAction("ex.check", false, null);
    return box;
  }

  function exMeaning(ex, body) {
    body.append(el("h2", "ex-title", I.t("ex.meaning")));
    const row = el("div", "ar-row");
    row.append(arEl("p", "ex-ar", ex.item.ar), speakButton(ex.item.ar));
    body.append(row, el("p", "ex-tr", ex.item.tr));
    body.append(optionsList(ex.options, (b, o) => { b.textContent = promptGloss(o); }, (o) => o === ex.item, ex, promptGloss(ex.item)));
  }

  function exArabic(ex, body) {
    body.append(el("h2", "ex-title", I.t("ex.chooseArabic")), el("p", "ex-prompt", promptGloss(ex.item)));
    body.append(optionsList(ex.options, (b, o) => { b.textContent = o.ar; b.lang = "ar"; b.dir = "rtl"; b.classList.add("ar-option"); }, (o) => o === ex.item, ex, ex.item.ar));
  }

  function exListen(ex, body) {
    body.append(el("h2", "ex-title", I.t("ex.listen")));
    const b = el("button", "listen-big", "🔊");
    b.type = "button";
    b.setAttribute("aria-label", I.t("ex.speak"));
    b.addEventListener("click", () => speak(ex.item.ar));
    body.append(b);
    body.append(optionsList(ex.options, (o, v) => { o.textContent = v.ar; o.lang = "ar"; o.dir = "rtl"; o.classList.add("ar-option"); }, (v) => v === ex.item, ex, ex.item.ar));
    speak(ex.item.ar);
  }

  function exMatch(ex, body) {
    body.append(el("h2", "ex-title", I.t("ex.match")));
    const grid = el("div", "match-grid");
    const left = el("div", "match-col");
    const right = el("div", "match-col");
    let picked = null;
    let remaining = ex.items.length;
    let hadMistake = false;
    const pick = (b, item, side) => {
      if (picked && picked.side === side) picked.b.classList.remove("selected");
      if (!picked || picked.side === side) {
        b.classList.add("selected");
        picked = { b, item, side };
        if (side === "ar") speak(item.ar);
        return;
      }
      if (picked.item === item) {
        [picked.b, b].forEach((x) => { x.classList.remove("selected"); x.classList.add("right"); x.disabled = true; });
        picked = null;
        remaining--;
        if (remaining === 0) {
          if (hadMistake) lesson.mistakes++;
          setFooter("good", I.t("ex.correct"), "");
          setAction("ex.continue", true, () => next(false));
          $("lesson-action").focus();
        }
      } else {
        hadMistake = true;
        const a = picked.b;
        a.classList.remove("selected");
        [a, b].forEach((x) => { x.classList.add("wrong"); setTimeout(() => x.classList.remove("wrong"), 450); });
        picked = null;
      }
    };
    shuffle(ex.items).forEach((item) => {
      const b = el("button", "option ar-option", item.ar);
      b.type = "button";
      b.lang = "ar";
      b.dir = "rtl";
      b.addEventListener("click", () => pick(b, item, "ar"));
      left.appendChild(b);
    });
    shuffle(ex.items).forEach((item) => {
      const b = el("button", "option", promptGloss(item));
      b.type = "button";
      b.addEventListener("click", () => pick(b, item, "m"));
      right.appendChild(b);
    });
    grid.append(left, right);
    body.append(grid);
    setAction("ex.continue", false, null);
  }

  function exBuild(ex, body) {
    const words = ex.item.ar.split(" ");
    body.append(el("h2", "ex-title", I.t("ex.build")), el("p", "ex-prompt", promptGloss(ex.item)));
    const answer = arEl("div", "build-answer");
    const bank = arEl("div", "build-bank");
    const refresh = () => setAction("ex.check", answer.children.length > 0, check);
    const check = () => {
      const given = Array.from(answer.children).map((c) => c.textContent).join(" ");
      const good = given === ex.item.ar;
      answer.classList.add(good ? "right" : "wrong");
      Array.from(answer.children).concat(Array.from(bank.children)).forEach((c) => { c.disabled = true; });
      answered(good, ex, ex.item.ar);
      if (good) speak(ex.item.ar);
    };
    shuffle(words.concat(ex.extra || [])).forEach((word) => {
      const t = el("button", "tile", word);
      t.type = "button";
      t.addEventListener("click", () => {
        (t.parentNode === bank ? answer : bank).appendChild(t);
        refresh();
      });
      bank.appendChild(t);
    });
    body.append(answer, bank);
    refresh();
  }

  function exHadith(ex, body) {
    body.append(el("h2", "ex-title", I.t("ex.hadith")), hadithCard(ex.unit));
    setAction("ex.continue", true, () => next(false));
  }

  function exHadithQ(ex, body) {
    const right = local(ex.unit.hadith.lesson);
    body.append(el("h2", "ex-title", I.t("ex.hadithQ")), arEl("p", "ex-ar ex-hadith-small", ex.unit.hadith.ar));
    body.append(optionsList(ex.options, (b, o) => { b.textContent = o; }, (o) => o === right, ex, right));
  }

  function renderFinish() {
    const stars = lesson.mistakes === 0 ? 3 : lesson.mistakes <= 2 ? 2 : 1;
    const xp = 10 + stars * 5;
    S.finishLesson(lessonId(lesson.u, lesson.l), stars, xp);
    const body = $("lesson-body");
    body.textContent = "";
    $("lesson-progress").style.width = "100%";
    setFooter("", "", "");
    const card = el("div", "finish-card");
    const mascot = document.getElementById("mascot-template").content.cloneNode(true);
    card.append(mascot, el("h2", "", I.t("ex.doneTitle")), el("p", "finish-stars", "★".repeat(stars) + "☆".repeat(3 - stars)), el("p", "finish-xp", I.t("ex.earned", { n: xp })));
    body.append(card);
    setAction("ex.backPath", true, closeLesson);
    $("lesson-action").focus();
  }

  /* ---------- التشغيل ---------- */
  function renderAll() {
    renderPath();
    renderHadiths();
    updateTabs();
    if (lesson) renderExercise();
  }

  let activeTab = "path";
  function updateTabs() {
    document.querySelectorAll(".tab-btn").forEach((b) => b.setAttribute("aria-selected", b.dataset.tab === activeTab));
    $("path").hidden = activeTab !== "path";
    $("hadith-list").hidden = activeTab !== "hadith";
  }

  async function start() {
    await I.ready;
    findVoice();
    if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", findVoice);
    const response = await fetch(new URL("data/lessons.json", document.baseURI).href);
    units = (await response.json()).units;
    document.querySelectorAll(".tab-btn").forEach((b) => b.addEventListener("click", () => { activeTab = b.dataset.tab; updateTabs(); }));
    $("lesson-close").addEventListener("click", closeLesson);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lesson) closeLesson(); });
    document.addEventListener("platformLanguageChanged", renderAll);
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", start);
})();
