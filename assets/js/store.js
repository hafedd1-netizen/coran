"use strict";

/** حفظ تقدّم المتعلّم على هذا الجهاز فقط (لا يوجد خادم ولا حساب). */
(function () {
  const KEY = "coran-progress-v1";
  const empty = () => ({ xp: 0, streak: 0, lastDay: null, lessons: {}, verses: {} });
  let data = empty();
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) data = Object.assign(empty(), JSON.parse(raw));
  } catch (e) { /* يعمل التقدّم في الذاكرة فقط */ }

  const persist = () => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* وضع التصفح الخاص */ }
  };
  const dayString = (d) => d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();

  function touchDay() {
    const now = new Date();
    const today = dayString(now);
    if (data.lastDay === today) return;
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    data.streak = data.lastDay === dayString(y) ? data.streak + 1 : 1;
    data.lastDay = today;
  }

  function currentStreak() {
    if (!data.lastDay) return 0;
    const now = new Date();
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    return data.lastDay === dayString(now) || data.lastDay === dayString(y) ? data.streak : 0;
  }

  const verse = (s, v) => (data.verses[s] && data.verses[s][v]) || {};

  function setVerse(s, v, field, value) {
    data.verses[s] = data.verses[s] || {};
    const entry = data.verses[s][v] || {};
    if (value) entry[field] = 1; else delete entry[field];
    data.verses[s][v] = entry;
    touchDay();
    persist();
  }

  function surahPercent(s, total) {
    const verses = data.verses[s] || {};
    let points = 0;
    Object.keys(verses).forEach((k) => {
      const e = verses[k];
      if (e.m) points += 1; // الآية المحفوظة تحتسب كاملة
      else points += (e.l ? 0.2 : 0) + (e.r ? 0.3 : 0);
    });
    return total ? Math.min(100, Math.round((points / total) * 100)) : 0;
  }

  function memorizedCount(s) {
    const verses = data.verses[s] || {};
    return Object.keys(verses).filter((k) => verses[k].m).length;
  }

  const totalMemorized = () => Object.keys(data.verses).reduce((sum, s) => sum + memorizedCount(s), 0);

  function finishLesson(id, stars, xp) {
    data.lessons[id] = Math.max(data.lessons[id] || 0, stars);
    data.xp += xp;
    touchDay();
    persist();
  }

  function addXp(xp) {
    data.xp += xp;
    touchDay();
    persist();
  }

  window.PlatformStore = {
    verse, setVerse, surahPercent, memorizedCount, totalMemorized, finishLesson, addXp,
    lessonStars: (id) => data.lessons[id] || 0,
    lessonsDone: () => Object.keys(data.lessons).length,
    xp: () => data.xp,
    streak: currentStreak
  };
})();
