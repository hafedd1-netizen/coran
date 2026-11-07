"use strict";

/**
 * قسم العربية: مسار دروس بأسلوب الألعاب.
 * المرحلة الأولى: الحروف والحركات. المرحلة الثانية: كلمات وجمل وقصص وأحاديث عن القيم.
 * الاستماع: صوت المتصفح العربي. النطق: التعرّف على الكلام (Chrome/Edge) أو التدرّب الذاتي.
 */
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
  const pickOne = (list) => list[Math.floor(Math.random() * list.length)];

  const DAILY_GOAL = 3;
  let data = { units: [], stages: [], chars: {} };
  let units = [];
  let lesson = null;

  const lang = () => I.getLanguage();
  const local = (obj) => (obj ? obj[lang()] || obj.en : "");
  const meaning = (item) => (item.m ? item.m[lang()] || (lang() === "ar" ? "" : item.m.en) : "");
  const lessonId = (u, l) => units[u].id + "-" + l;

  /* ---------- الصوت: النطق بصوت المتصفح ---------- */
  let voice = null;
  function findVoice() {
    if (!("speechSynthesis" in window)) return;
    const voices = speechSynthesis.getVoices().filter((v) => v.lang && v.lang.toLowerCase().startsWith("ar"));
    // الأصوات الطبيعية (Edge/Google/أجهزة Apple) أوضح بكثير للأطفال.
    const score = (v) => (/natural|neural|online|google|premium|enhanced/i.test(v.name) ? 2 : 0) + (/sa|eg/i.test(v.lang) ? 1 : 0);
    voice = voices.sort((a, b) => score(b) - score(a))[0] || null;
    const note = $("voice-note");
    if (note) note.hidden = !!voice;
  }
  function speak(text, rate) {
    if (!voice) { toast(I.t("arabic.noVoiceShort")); return; }
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.voice = voice;
    u.lang = voice.lang;
    u.rate = rate || 0.8;
    speechSynthesis.speak(u);
  }
  function speakButton(text) {
    const b = el("button", "speak-btn", "🔊");
    b.type = "button";
    b.setAttribute("aria-label", I.t("ex.speak"));
    b.title = I.t("ex.speak");
    b.addEventListener("click", (e) => { e.stopPropagation(); speak(text); });
    return b;
  }

  /* ---------- النطق: التعرّف على الكلام ---------- */
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const normalize = (t) => t
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي").replace(/ؤ/g, "و").replace(/ئ/g, "ي")
    .replace(/[^ء-ي ]/g, " ").replace(/\s+/g, " ").trim();
  function similarity(a, b) {
    a = normalize(a); b = normalize(b);
    if (!a || !b) return 0;
    if (a === b || a.includes(b)) return 1;
    const m = a.length, n = b.length;
    let prev = Array.from({ length: n + 1 }, (_, j) => j);
    for (let i = 1; i <= m; i++) {
      const cur = [i];
      for (let j = 1; j <= n; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      }
      prev = cur;
    }
    return 1 - prev[n] / Math.max(m, n);
  }

  /* ---------- رسائل قصيرة ---------- */
  let toastTimer = null;
  function toast(text) {
    const t = $("toast");
    if (!t) return;
    t.textContent = text;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
  }

  /* ---------- بنية الدروس في كل وحدة ---------- */
  function lessonPlan(unit) {
    if (unit.kind === "letters") {
      return [{ kind: "letters", from: 0, label: "arabic.lLetters" }, { kind: "letters", from: 2, label: "arabic.lLetters" }, { kind: "review", label: "arabic.lReview" }];
    }
    const plan = [];
    const wordLessons = Math.ceil(unit.words.length / 3);
    for (let i = 0; i < wordLessons; i++) plan.push({ kind: "words", from: i * 3, label: i === 0 ? "arabic.lesson1" : "arabic.lesson2" });
    plan.push({ kind: "sentences", label: unit.hadith ? "arabic.lesson3" : "arabic.lSentences" });
    if (unit.story) plan.push({ kind: "story", label: "arabic.lStory" });
    return plan;
  }

  const unitDone = (u) => lessonPlan(units[u]).every((_, l) => S.lessonStars(lessonId(u, l)) > 0);
  const unitStarted = (u) => lessonPlan(units[u]).some((_, l) => S.lessonStars(lessonId(u, l)) > 0);
  const firstValues = () => units.findIndex((x) => x.stage === "values");
  const lettersSkipped = () => S.flag("skipLetters") || units.some((x, u) => x.stage === "values" && unitStarted(u));

  function isUnlocked(u, l) {
    if (l > 0) return S.lessonStars(lessonId(u, l - 1)) > 0;
    if (u === 0 || unitStarted(u)) return true;
    if (u === firstValues() && lettersSkipped()) return true;
    return unitDone(u - 1);
  }

  /* ---------- لوحة اليوم والحديقة ---------- */
  function renderDash() {
    const box = $("dash");
    box.textContent = "";
    const top = el("div", "dash-row");
    const today = Math.min(DAILY_GOAL, S.todayLessons());
    const goal = el("div", "dash-goal");
    goal.append(el("strong", "", I.t("arabic.todayGoal", { n: today, g: DAILY_GOAL })));
    const track = el("div", "progress-track");
    const fill = el("span");
    fill.style.width = Math.round((today / DAILY_GOAL) * 100) + "%";
    track.appendChild(fill);
    goal.append(track);
    const chips = el("div", "dash-chips");
    chips.append(el("span", "chip", "🔥 " + S.streak()), el("span", "chip", "⭐ " + S.xp()));
    top.append(goal, chips);
    box.append(top);

    const garden = el("div", "garden");
    garden.append(el("strong", "garden-title", "🌿 " + I.t("arabic.garden")));
    const plants = el("div", "garden-plants");
    units.forEach((unit, u) => {
      const p = el("span", "plant", unitDone(u) ? (unit.stage === "letters" ? "🌷" : "🌳") : unitStarted(u) ? "🌱" : "🌰");
      if (!unitStarted(u)) p.classList.add("seed");
      p.title = local(unit.title);
      plants.appendChild(p);
    });
    garden.append(plants, el("small", "garden-help", I.t("arabic.gardenHelp")));
    box.append(garden);

    const note = el("p", "voice-note alert");
    note.id = "voice-note";
    note.textContent = I.t("arabic.noVoice");
    note.hidden = !!voice;
    box.append(note);
  }

  /* ---------- المسار ---------- */
  function renderPath() {
    renderDash();
    const path = $("path");
    path.textContent = "";
    let stage = null;
    units.forEach((unit, u) => {
      if (unit.stage !== stage) {
        stage = unit.stage;
        const st = data.stages.find((s) => s.id === stage);
        if (st) {
          const head = el("header", "stage-head");
          head.append(el("span", "stage-icon", st.icon), el("h2", "", local(st.title)), el("p", "", local(st.desc)));
          if (stage === "letters" && !lettersSkipped()) {
            const skip = el("button", "link-btn stage-skip", I.t("arabic.skipLetters"));
            skip.type = "button";
            skip.addEventListener("click", () => {
              S.setFlag("skipLetters", 1);
              renderPath();
              const target = document.querySelector('[data-unit="' + units[firstValues()].id + '"]');
              if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
            });
            head.append(skip);
          }
          path.appendChild(head);
        }
      }
      const section = el("section", "unit unit-" + (u % 4));
      section.dataset.unit = unit.id;
      const banner = el("header", "unit-banner");
      const icon = el("span", "unit-icon", unit.icon);
      icon.setAttribute("aria-hidden", "true");
      const copy = el("div");
      copy.append(el("small", "", I.t("arabic.unit", { n: u + 1 })), el("h2", "", local(unit.title)), el("p", "", local(unit.value)));
      banner.append(icon, copy);
      section.append(banner);

      const plan = lessonPlan(unit);
      const nodes = el("ol", "lesson-nodes");
      plan.forEach((step, l) => {
        const stars = S.lessonStars(lessonId(u, l));
        const open = isUnlocked(u, l);
        const li = el("li", "node-wrap node-" + (l % 2));
        const b = el("button", "lesson-node " + (stars ? "done" : open ? "open" : "locked"));
        b.type = "button";
        b.disabled = !open;
        b.append(el("span", "node-icon", stars ? "✓" : open ? (step.kind === "story" ? "📖" : String(l + 1)) : "🔒"));
        const starRow = el("span", "node-stars", "★".repeat(stars) + "☆".repeat(3 - stars));
        starRow.setAttribute("aria-hidden", "true");
        if (open) b.addEventListener("click", () => startLesson(u, l));
        else b.title = I.t("arabic.locked");
        li.append(b, el("span", "node-label", I.t(step.label)), starRow);
        nodes.appendChild(li);
      });
      section.append(nodes);

      // تحدّي الحياة اليومية: يظهر بعد إكمال درس القصة
      if (unit.challenge && S.lessonStars(lessonId(u, plan.length - 1)) > 0) {
        const done = S.flag("challenge-" + unit.id);
        const box = el("div", "challenge-strip" + (done ? " done" : ""));
        box.append(el("span", "", "🎯 " + local(unit.challenge)));
        if (!done) {
          const ok = el("button", "pill-btn", I.t("arabic.challengeDoneBtn"));
          ok.type = "button";
          ok.addEventListener("click", () => {
            S.setFlag("challenge-" + unit.id, 1);
            S.addXp(20);
            toast(I.t("arabic.challengeThanks"));
            renderPath();
          });
          box.append(ok);
        } else box.append(el("strong", "", "✓"));
        section.append(box);
      }
      path.appendChild(section);
    });
  }

  function renderHadiths() {
    const box = $("hadith-list");
    box.textContent = "";
    box.appendChild(el("p", "hadith-note", I.t("arabic.translationNote")));
    units.filter((u) => u.hadith).forEach((unit) => box.appendChild(hadithCard(unit)));
  }

  function hadithCard(unit) {
    const card = el("article", "hadith-card");
    card.append(el("h3", "", unit.icon + " " + local(unit.title)));
    card.append(el("small", "hadith-lead", I.t("arabic.hadithIntro")));
    const row = el("div", "ar-row");
    row.append(arEl("p", "hadith-text", unit.hadith.ar), speakButton(unit.hadith.ar));
    card.append(row);
    if (lang() !== "ar") card.append(el("p", "hadith-meaning", meaning(unit.hadith)));
    const learn = el("p", "hadith-learn");
    learn.append(el("strong", "", I.t("arabic.hadithLesson") + " "), document.createTextNode(local(unit.hadith.lesson)));
    card.append(learn);
    const src = lang() === "ar" ? arEl("small", "hadith-source", unit.hadith.src.ar) : el("small", "hadith-source", unit.hadith.src.latin);
    card.append(src);
    return card;
  }

  /* ---------- مخزون الكلمات للمشتّتات ---------- */
  const allWords = () => units.reduce((list, unit) => list.concat(unit.words || []), []);
  const allSentences = () => units.reduce((list, unit) => list.concat(unit.sentences || []), []);
  const allLetters = () => units.reduce((list, unit) => list.concat(unit.letters || []), []);
  const distractors = (item, pool, count, key) => {
    const k = key || "ar";
    const seen = new Set([item[k]]);
    return shuffle(pool).filter((x) => { if (seen.has(x[k])) return false; seen.add(x[k]); return true; }).slice(0, count);
  };
  const choices = (item, pool, count, key) => shuffle([item].concat(distractors(item, pool, count, key)));
  const letterWordItem = (lt) => ({ ar: lt.word, tr: lt.wtr, emoji: lt.emoji, m: lt.m });
  const letterAsItem = (lt) => {
    const label = lt.name + " · " + lt.tr;
    return { ar: lt.ch, m: { ar: label, en: label, fr: label, es: label, de: label, it: label } };
  };

  /* ---------- بناء التمارين ---------- */
  function buildExercises(u, l) {
    const unit = units[u];
    const step = lessonPlan(unit)[l];
    const list = [];
    const wordPool = allWords().concat(unit.words || []);

    const wordQuizzes = (word, pool) => {
      const q = [
        { type: "meaning", item: word, options: choices(word, pool, 3) },
        { type: "arabic", item: word, options: choices(word, pool, 3) }
      ];
      if (voice) q.push({ type: "listen", item: word, options: choices(word, pool, 3) });
      return q;
    };

    if (step.kind === "letters" || step.kind === "review") {
      const letters = allLetters();
      const mine = step.kind === "review" ? unit.letters : unit.letters.slice(step.from, step.from + 2);
      const quizzesFor = (lt) => {
        const q = [
          { type: "letterName", item: lt, options: choices(lt, letters, 3, "ch") },
          { type: "letterStart", item: lt, options: choices(lt, letters, 3, "ch") }
        ];
        if (voice) q.push({ type: "letterListen", item: lt, options: choices(lt, letters, 3, "ch") });
        return q;
      };
      if (step.kind === "letters") {
        mine.forEach((lt) => list.push({ type: "letterIntro", item: lt }));
        list.push(...shuffle(mine.map(quizzesFor).flat()));
        const before = letters.slice(0, letters.indexOf(mine[0])).slice(-2);
        list.push({ type: "match", items: mine.concat(before).map(letterAsItem) });
        list.push({ type: "speak", item: letterWordItem(pickOne(mine)) });
      } else {
        list.push({ type: "match", items: mine.map(letterAsItem) });
        list.push(...shuffle(mine.map(quizzesFor).flat()).slice(0, 7));
        const words = mine.map(letterWordItem);
        list.push({ type: "match", items: words });
        shuffle(words).slice(0, 2).forEach((w) => list.push({ type: "speak", item: w }));
      }
      return list;
    }

    if (step.kind === "words") {
      const fresh = unit.words.slice(step.from, step.from + 3);
      fresh.forEach((word) => list.push({ type: "intro", item: word }));
      list.push(...shuffle(fresh.map((w) => wordQuizzes(w, wordPool)).flat()));
      const seen = unit.words.slice(0, step.from + 3);
      list.push({ type: "match", items: shuffle(seen).slice(0, Math.min(5, Math.max(3, seen.length))) });
      list.push({ type: "speak", item: pickOne(fresh) });
      return list;
    }

    if (step.kind === "sentences") {
      list.push({ type: "match", items: shuffle(unit.words).slice(0, 4) });
      const pool = allSentences();
      unit.sentences.forEach((sentence) => {
        list.push({ type: "meaning", item: sentence, options: choices(sentence, unit.sentences.concat(pool), 2) });
        const own = sentence.ar.split(" ");
        list.push({ type: "build", item: sentence, extra: shuffle(pool.filter((s) => s !== sentence).map((s) => s.ar.split(" ")).flat().filter((w) => !own.includes(w))).slice(0, 2) });
      });
      list.push({ type: "speak", item: pickOne(unit.sentences) });
      if (unit.hadith) {
        list.push({ type: "hadith", unit });
        const others = shuffle(units.filter((x) => x !== unit && x.hadith)).slice(0, 2).map((x) => local(x.hadith.lesson));
        list.push({ type: "hadithQ", unit, options: shuffle([local(unit.hadith.lesson)].concat(others)) });
      }
      return list;
    }

    // درس القصة
    const story = unit.story;
    list.push({ type: "story", unit });
    list.push({ type: "storyQ", unit });
    const lines = story.lines.slice().sort((a, b) => a.ar.length - b.ar.length);
    const buildLine = lines.find((x) => x.ar.split(" ").length >= 3) || lines[0];
    list.push({ type: "build", item: { ar: buildLine.ar.replace(/[.!؟?،]/g, "").trim(), tr: buildLine.tr, m: buildLine.m }, extra: [] });
    list.push({ type: "speak", item: lines[0] });
    list.push({ type: "match", items: shuffle(unit.words).slice(0, 4) });
    if (unit.challenge) list.push({ type: "challenge", unit });
    return list;
  }

  function startLesson(u, l) {
    findVoice();
    const queue = buildExercises(u, l);
    lesson = { u, l, queue, index: 0, total: queue.length, mistakes: 0, done: 0, combo: 0, bonus: 0, wasDone: unitDone(u) };
    $("lesson").hidden = false;
    document.body.classList.add("lesson-open");
    renderExercise();
    $("lesson-close").focus();
  }

  function closeLesson() {
    if ("speechSynthesis" in window) speechSynthesis.cancel();
    stopListening();
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

  const promptGloss = (item) => (item.emoji ? item.emoji + " " : "") + meaning(item);

  const RENDER = {};
  function renderExercise() {
    if (!lesson) return;
    stopListening();
    if (lesson.index >= lesson.queue.length) return renderFinish();
    const ex = lesson.queue[lesson.index];
    const body = $("lesson-body");
    body.textContent = "";
    $("lesson-progress").style.width = Math.round((lesson.done / lesson.total) * 100) + "%";
    setFooter("", "", "");
    RENDER[ex.type](ex, body);
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
      lesson.combo++;
      if (lesson.combo >= 3) lesson.bonus++;
      setFooter("good", lesson.combo >= 3 ? I.t("ex.combo", { n: lesson.combo }) : I.t("ex.correct"), "");
    } else {
      lesson.combo = 0;
      lesson.mistakes++;
      setFooter("bad", I.t("ex.wrong"), answerText);
    }
    setAction("ex.continue", true, () => next(!correct));
    $("lesson-action").focus();
  }

  function optionsList(options, render, isCorrect, ex, answerText) {
    const box = el("div", "options");
    let chosen = null;
    options.forEach((opt) => {
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
  const arOption = (b, text) => { b.textContent = text; b.lang = "ar"; b.dir = "rtl"; b.classList.add("ar-option"); };

  RENDER.intro = (ex, body) => {
    const card = el("div", "intro-card");
    card.append(el("small", "ex-tag", I.t("ex.new")), el("div", "intro-emoji", ex.item.emoji));
    const row = el("div", "ar-row");
    row.append(arEl("p", "intro-ar", ex.item.ar), speakButton(ex.item.ar));
    card.append(row, el("p", "intro-tr", ex.item.tr), el("p", "intro-meaning", meaning(ex.item)));
    body.append(card);
    setAction("ex.continue", true, () => next(false));
    if (voice) speak(ex.item.ar);
  };

  RENDER.meaning = (ex, body) => {
    body.append(el("h2", "ex-title", I.t("ex.meaning")));
    const row = el("div", "ar-row");
    row.append(arEl("p", "ex-ar", ex.item.ar), speakButton(ex.item.ar));
    body.append(row, el("p", "ex-tr", ex.item.tr));
    body.append(optionsList(ex.options, (b, o) => { b.textContent = promptGloss(o); }, (o) => o === ex.item, ex, promptGloss(ex.item)));
  };

  RENDER.arabic = (ex, body) => {
    body.append(el("h2", "ex-title", I.t("ex.chooseArabic")), el("p", "ex-prompt", promptGloss(ex.item)));
    body.append(optionsList(ex.options, (b, o) => arOption(b, o.ar), (o) => o === ex.item, ex, ex.item.ar));
  };

  RENDER.listen = (ex, body) => {
    body.append(el("h2", "ex-title", I.t("ex.listen")));
    const b = el("button", "listen-big", "🔊");
    b.type = "button";
    b.setAttribute("aria-label", I.t("ex.speak"));
    b.addEventListener("click", () => speak(ex.item.ar));
    const slow = el("button", "listen-slow", "🐢");
    slow.type = "button";
    slow.title = I.t("ex.slow");
    slow.addEventListener("click", () => speak(ex.item.ar, 0.5));
    const row = el("div", "listen-row");
    row.append(b, slow);
    body.append(row);
    body.append(optionsList(ex.options, (o, v) => arOption(o, v.ar), (v) => v === ex.item, ex, ex.item.ar));
    speak(ex.item.ar);
  };

  /* --- تمارين الحروف --- */
  function letterForms(lt) {
    const t = "ـ";
    return lt.join ? [lt.ch, lt.ch + t, t + lt.ch + t, t + lt.ch] : [lt.ch, t + lt.ch];
  }

  RENDER.letterIntro = (ex, body) => {
    const lt = ex.item;
    const card = el("div", "intro-card letter-card");
    card.append(el("small", "ex-tag", I.t("ex.letterNew")));
    const big = arEl("button", "big-letter", lt.ch);
    big.type = "button";
    big.addEventListener("click", () => speak(lt.name));
    card.append(big);
    const row = el("div", "ar-row");
    row.append(arEl("p", "letter-name", lt.name), el("span", "letter-sound", "/" + lt.tr + "/"), speakButton(lt.name));
    card.append(row);
    card.append(el("small", "forms-label", I.t("ex.forms")));
    const forms = arEl("div", "letter-forms");
    letterForms(lt).forEach((f) => forms.append(el("span", "", f)));
    card.append(forms);
    const example = el("div", "letter-example");
    const exRow = el("div", "ar-row");
    exRow.append(el("span", "intro-emoji small", lt.emoji), arEl("span", "example-ar", lt.word), speakButton(lt.word));
    example.append(exRow, el("p", "intro-tr", lt.wtr + " — " + meaning(lt)));
    card.append(example);
    if (lt.tip && lang() !== "ar") card.append(el("p", "letter-tip", "💡 " + local(lt.tip)));
    else if (lt.tip) card.append(el("p", "letter-tip", "💡 " + lt.tip.ar));
    body.append(card);
    setAction("ex.continue", true, () => next(false));
    if (voice) { speak(lt.name); setTimeout(() => { if (lesson && lesson.queue[lesson.index] === ex) speak(lt.word); }, 1400); }
  };

  RENDER.letterName = (ex, body) => {
    body.append(el("h2", "ex-title", I.t("ex.letterName")), arEl("p", "big-letter static", ex.item.ch));
    body.append(optionsList(ex.options, (b, o) => { b.textContent = o.name + "  ·  /" + o.tr + "/"; }, (o) => o === ex.item, ex, ex.item.name + " /" + ex.item.tr + "/"));
  };

  RENDER.letterStart = (ex, body) => {
    body.append(el("h2", "ex-title", I.t("ex.letterStart")));
    const row = el("div", "ar-row");
    row.append(el("span", "intro-emoji small", ex.item.emoji), arEl("p", "ex-ar", ex.item.word), speakButton(ex.item.word));
    body.append(row, el("p", "ex-tr", ex.item.wtr + " — " + meaning(ex.item)));
    const grid = optionsList(ex.options, (b, o) => arOption(b, o.ch), (o) => o === ex.item, ex, ex.item.ch);
    grid.classList.add("letter-options");
    body.append(grid);
  };

  RENDER.letterListen = (ex, body) => {
    body.append(el("h2", "ex-title", I.t("ex.letterListen")));
    const b = el("button", "listen-big", "🔊");
    b.type = "button";
    b.addEventListener("click", () => speak(ex.item.name));
    body.append(b);
    const grid = optionsList(ex.options, (o, v) => arOption(o, v.ch), (v) => v === ex.item, ex, ex.item.ch + " — " + ex.item.name);
    grid.classList.add("letter-options");
    body.append(grid);
    speak(ex.item.name);
  };

  /* --- المطابقة والترتيب --- */
  RENDER.match = (ex, body) => {
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
        if (side === "ar" && voice) speak(item.ar.length === 1 ? item.m.ar.split(" · ")[0] : item.ar);
        return;
      }
      if (picked.item === item) {
        [picked.b, b].forEach((x) => { x.classList.remove("selected"); x.classList.add("right"); x.disabled = true; });
        picked = null;
        remaining--;
        if (remaining === 0) {
          if (hadMistake) { lesson.mistakes++; lesson.combo = 0; } else lesson.combo++;
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
  };

  RENDER.build = (ex, body) => {
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
  };

  /* --- النطق --- */
  let recognizer = null;
  function stopListening() {
    if (recognizer) { try { recognizer.abort(); } catch (e) { /* */ } recognizer = null; }
  }

  RENDER.speak = (ex, body) => {
    const item = ex.item;
    body.append(el("h2", "ex-title", I.t("ex.speakTitle")));
    const card = el("div", "speak-card");
    const row = el("div", "ar-row");
    row.append(arEl("p", "ex-ar", item.ar), speakButton(item.ar));
    card.append(row, el("p", "ex-tr", item.tr), el("p", "ex-prompt", promptGloss(item)));
    body.append(card);
    const status = el("p", "speak-status");
    const skip = el("button", "link-btn speak-skip", I.t("ex.speakSkip"));
    skip.type = "button";
    skip.addEventListener("click", () => { stopListening(); lesson.done++; lesson.index++; renderExercise(); });

    if (!Recognition) {
      // بلا تعرّف على الكلام: الطفل يستمع ثم يردّد بصوت عالٍ.
      status.textContent = I.t("ex.speakSelf");
      body.append(status);
      setAction("ex.saidIt", true, () => { lesson.combo++; next(false); });
      if (voice) speak(item.ar);
      return;
    }

    let tries = 0;
    const mic = el("button", "mic-btn", "🎤");
    mic.type = "button";
    mic.setAttribute("aria-label", I.t("ex.speakTap"));
    status.textContent = I.t("ex.speakTap");
    const listen = () => {
      stopListening();
      if ("speechSynthesis" in window) speechSynthesis.cancel();
      const r = new Recognition();
      recognizer = r;
      r.lang = "ar-SA";
      r.interimResults = false;
      r.maxAlternatives = 5;
      mic.classList.add("listening");
      status.textContent = I.t("ex.listening");
      r.onresult = (e) => {
        const heard = Array.from(e.results[0]).map((a) => a.transcript);
        const best = Math.max(...heard.map((h) => similarity(h, item.ar)));
        tries++;
        if (best >= 0.6) {
          status.textContent = I.t("ex.heard", { t: heard[0] });
          mic.disabled = true;
          setFooter("good", I.t("ex.speakGood"), "");
          lesson.combo++;
          if (lesson.combo >= 3) lesson.bonus++;
          setAction("ex.continue", true, () => next(false));
          $("lesson-action").focus();
        } else {
          status.textContent = I.t("ex.heard", { t: heard[0] || "…" }) + " — " + I.t("ex.speakTry");
          if (tries >= 2) setAction("ex.continue", true, () => next(false));
        }
      };
      r.onerror = (e) => {
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          status.textContent = I.t("ex.micDenied");
          setAction("ex.continue", true, () => next(false));
        } else if (e.error !== "aborted") status.textContent = I.t("ex.speakTry");
      };
      r.onend = () => { mic.classList.remove("listening"); if (recognizer === r) recognizer = null; };
      try { r.start(); } catch (err) { status.textContent = I.t("ex.speakTry"); }
    };
    mic.addEventListener("click", listen);
    body.append(mic, status, skip);
    setAction("ex.continue", false, null);
    if (voice) speak(item.ar);
  };

  /* --- القصة والحديث والتحدّي --- */
  RENDER.story = (ex, body) => {
    const story = ex.unit.story;
    body.append(el("h2", "ex-title", "📖 " + I.t("ex.story")), el("p", "ex-tr", I.t("ex.storyTap")));
    const chat = el("div", "story-chat");
    let shown = 0;
    const showNext = () => {
      if (shown >= story.lines.length) return;
      const line = story.lines[shown];
      const ch = data.chars[line.who] || { emoji: "🙂", name: {} };
      const side = ["yusuf", "maryam"].includes(line.who) ? "me" : "other";
      const bubble = el("div", "bubble " + side);
      const who = el("span", "bubble-who", ch.emoji);
      const content = el("div", "bubble-body");
      content.append(el("small", "bubble-name", local(ch.name)), arEl("p", "bubble-ar", line.ar), el("p", "bubble-tr", line.tr));
      if (lang() !== "ar") content.append(el("p", "bubble-m", meaning(line)));
      bubble.append(who, content);
      bubble.addEventListener("click", () => speak(line.ar));
      chat.append(bubble);
      bubble.scrollIntoView({ behavior: "smooth", block: "nearest" });
      speak(line.ar);
      shown++;
      if (shown >= story.lines.length) setAction("ex.continue", true, () => next(false));
      else setAction("ex.nextLine", true, showNext);
    };
    body.append(chat);
    showNext();
  };

  RENDER.storyQ = (ex, body) => {
    const story = ex.unit.story;
    body.append(el("h2", "ex-title", I.t("ex.storyQ")), el("p", "ex-prompt", local(story.q)));
    const right = local(story.options[0]);
    const opts = shuffle(story.options.map(local));
    body.append(optionsList(opts, (b, o) => { b.textContent = o; }, (o) => o === right, ex, right));
  };

  RENDER.hadith = (ex, body) => {
    body.append(el("h2", "ex-title", I.t("ex.hadith")), hadithCard(ex.unit));
    setAction("ex.continue", true, () => next(false));
  };

  RENDER.hadithQ = (ex, body) => {
    const right = local(ex.unit.hadith.lesson);
    body.append(el("h2", "ex-title", I.t("ex.hadithQ")), arEl("p", "ex-ar ex-hadith-small", ex.unit.hadith.ar));
    body.append(optionsList(ex.options, (b, o) => { b.textContent = o; }, (o) => o === right, ex, right));
  };

  RENDER.challenge = (ex, body) => {
    const card = el("div", "intro-card challenge-card");
    card.append(el("div", "intro-emoji", "🎯"), el("h2", "", I.t("ex.challengeTitle")), el("p", "challenge-text", local(ex.unit.challenge)), el("small", "", I.t("ex.challengeHint")));
    body.append(card);
    setAction("ex.challengeBtn", true, () => next(false));
  };

  /* ---------- نهاية الدرس ---------- */
  function renderFinish() {
    const stars = lesson.mistakes === 0 ? 3 : lesson.mistakes <= 2 ? 2 : 1;
    const xp = 10 + stars * 5 + lesson.bonus;
    S.finishLesson(lessonId(lesson.u, lesson.l), stars, xp);
    const grewTree = !lesson.wasDone && unitDone(lesson.u);
    const body = $("lesson-body");
    body.textContent = "";
    $("lesson-progress").style.width = "100%";
    setFooter("", "", "");
    const card = el("div", "finish-card");
    const mascot = document.getElementById("mascot-template").content.cloneNode(true);
    card.append(mascot, el("h2", "", I.t("ex.doneTitle")), el("p", "finish-stars", "★".repeat(stars) + "☆".repeat(3 - stars)), el("p", "finish-xp", I.t("ex.earned", { n: xp })));
    if (lesson.bonus) card.append(el("p", "finish-bonus", I.t("ex.bonus", { n: lesson.bonus })));
    const today = S.todayLessons();
    card.append(el("p", "finish-goal", today >= DAILY_GOAL ? I.t("ex.goalReached") : I.t("arabic.todayGoal", { n: today, g: DAILY_GOAL })));
    if (grewTree) card.append(el("p", "finish-tree", I.t("ex.unitDone")));
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
    $("path-wrap").hidden = activeTab !== "path";
    $("hadith-list").hidden = activeTab !== "hadith";
  }

  async function start() {
    await I.ready;
    findVoice();
    if ("speechSynthesis" in window) speechSynthesis.addEventListener("voiceschanged", findVoice);
    const response = await fetch(new URL("data/lessons.json", document.baseURI).href);
    data = await response.json();
    units = data.units;
    document.querySelectorAll(".tab-btn").forEach((b) => b.addEventListener("click", () => { activeTab = b.dataset.tab; updateTabs(); }));
    $("lesson-close").addEventListener("click", closeLesson);
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && lesson) closeLesson(); });
    document.addEventListener("platformLanguageChanged", renderAll);
    renderAll();
  }

  document.addEventListener("DOMContentLoaded", start);
})();
