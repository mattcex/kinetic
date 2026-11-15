(function () {
  'use strict';

  // ---------------------------------------------------------------------------
  // Constants
  // ---------------------------------------------------------------------------

  var STORE_KEY = 'kinetic.v1';
  var TIP_KEY = 'kinetic.tip.dismissed';
  var DAY = 86400000;
  var HEAT_WEEKS = 26;
  var BACKUP_PREFIX = 'KNT1:';

  var GROUPS = [
    { id: 'chest', label: 'Klatka' },
    { id: 'back', label: 'Plecy' },
    { id: 'legs', label: 'Nogi' },
    { id: 'shoulders', label: 'Barki' },
    { id: 'arms', label: 'Ramiona' },
    { id: 'core', label: 'Core' },
    { id: 'other', label: 'Inne' }
  ];
  var GROUP_LABEL = {};
  GROUPS.forEach(function (g) { GROUP_LABEL[g.id] = g.label; });

  var METRICS = [
    { id: 'oneRM', label: 'Szac. 1RM' },
    { id: 'maxWeight', label: 'Ciężar' },
    { id: 'volume', label: 'Wolumen' }
  ];

  var RANGES = [
    { id: '1m', label: '1M', months: 1, caption: 'w ostatnim miesiącu' },
    { id: '3m', label: '3M', months: 3, caption: 'w 3 miesiące' },
    { id: '6m', label: '6M', months: 6, caption: 'w pół roku' },
    { id: '1y', label: '1R', months: 12, caption: 'w rok' },
    { id: 'all', label: 'Całość', months: 0, caption: 'od początku' }
  ];

  var SUGGESTIONS = [
    ['Wyciskanie leżąc', 'chest'], ['Przysiad', 'legs'], ['Martwy ciąg', 'back'],
    ['Wyciskanie nad głowę', 'shoulders'], ['Wiosłowanie sztangą', 'back'], ['Podciąganie', 'back'],
    ['Hip thrust', 'legs'], ['Wyciskanie hantli skos', 'chest'], ['Uginanie ze sztangą', 'arms'],
    ['Pompki na poręczach', 'arms'], ['Wykroki', 'legs'], ['Unoszenie nóg w zwisie', 'core']
  ];

  var ICONS = {
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    back: 'M15 18l-6-6 6-6',
    close: 'M6 6l12 12M18 6L6 18',
    trophy: 'M8 21h8M12 17v4M17 4H7v6a5 5 0 0 0 10 0V4zM17 6h2.5A1.5 1.5 0 0 1 21 7.5V8a4 4 0 0 1-4 4M7 6H4.5A1.5 1.5 0 0 0 3 7.5V8a4 4 0 0 0 4 4',
    flame: 'M12 22c3.9 0 7-2.9 7-6.8 0-2.8-1.6-5.2-3.4-7-.4 1.7-1.5 3-2.9 3.5.3-3.3-1.2-6.4-4.2-8.7.2 3.4-1.6 5.6-3.1 7.6C4.4 12.1 5 13.6 5 15.2 5 19.1 8.1 22 12 22z',
    calendar: 'M4.5 5h15A1.5 1.5 0 0 1 21 6.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-13A1.5 1.5 0 0 1 4.5 5zM3 10h18M8 3v4M16 3v4',
    weight: 'M7 8h10l2.5 12h-15zM9.5 8a2.5 2.5 0 0 1 5 0',
    bars: 'M5 20V11M12 20V4M19 20v-6',
    trash: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
    spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z',
    check: 'M5 12.5l4.5 4.5L19 7',
    up: 'M7 17L17 7M9 7h8v8',
    down: 'M7 7l10 10M17 9v8H9',
    flat: 'M5 12h14',
    share: 'M12 15V3M7.5 7.5L12 3l4.5 4.5M5 13v6.5A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V13',
    copy: 'M10.5 9h9A1.5 1.5 0 0 1 21 10.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 9 19.5v-9A1.5 1.5 0 0 1 10.5 9zM15 9V4.5A1.5 1.5 0 0 0 13.5 3h-9A1.5 1.5 0 0 0 3 4.5v9A1.5 1.5 0 0 0 4.5 15H9',
    restore: 'M12 3v12M7.5 10.5L12 15l4.5-4.5M5 20h14',
    chart: 'M4 19h16M4 15l5-5 4 4 7-7'
  };

  // ---------------------------------------------------------------------------
  // State & persistence
  // ---------------------------------------------------------------------------

  var state = { exercises: [], entries: [], goal: 4 };
  var ui = { route: null, metric: 'oneRM', range: '6m', historyLimit: 12, homeScroll: 0, fromHome: false };
  var detailCtx = null;
  var logCtx = null;
  var addCtx = null;
  var app = document.getElementById('app');

  function clampGoal(g) {
    g = parseInt(g, 10);
    return g >= 2 && g <= 7 ? g : 4;
  }

  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  function validEntry(e) {
    return e && typeof e.id === 'string' && typeof e.exerciseId === 'string' &&
      isNum(e.date) && isNum(e.weight) && e.weight > 0 && isNum(e.reps) && e.reps > 0 && isNum(e.sets) && e.sets > 0;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (!data || !Array.isArray(data.exercises) || !Array.isArray(data.entries)) return;
      state = {
        exercises: data.exercises.filter(function (x) { return x && typeof x.id === 'string' && typeof x.name === 'string'; }),
        entries: data.entries.filter(validEntry),
        goal: clampGoal(data.goal)
      };
    } catch (err) {
      console.warn('Kinetic: could not read saved data', err);
    }
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
      return true;
    } catch (err) {
      toast('Nie udało się zapisać danych');
      return false;
    }
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
  }

  // ---------------------------------------------------------------------------
  // Formatting
  // ---------------------------------------------------------------------------

  var nfInt = new Intl.NumberFormat('pl-PL', { maximumFractionDigits: 0 });
  var nfW = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 0, maximumFractionDigits: 1 });
  var dfDayMonth = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' });
  var dfLong = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  var dfMonth = new Intl.DateTimeFormat('pl-PL', { month: 'short' });

  function fmtInt(v) { return nfInt.format(Math.round(v)); }
  function fmtW(v) { return nfW.format(v); }

  function fmtPct(f) {
    var p = f * 100;
    return (p >= 10 ? String(Math.round(p)) : nfW.format(p)) + '%';
  }

  function plural(n, one, few, many) {
    if (n === 1) return one;
    var m10 = n % 10, m100 = n % 100;
    return (m10 >= 2 && m10 <= 4 && !(m100 >= 12 && m100 <= 14)) ? few : many;
  }

  function pad2(n) { return n < 10 ? '0' + n : String(n); }

  function isoDay(t) {
    var d = new Date(t);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function icon(name, size, stroke) {
    size = size || 18;
    return '<svg class="ic" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' +
      (stroke || 2) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="' + ICONS[name] + '"/></svg>';
  }

  // ---------------------------------------------------------------------------
  // Dates
  // ---------------------------------------------------------------------------

  function startOfDay(t) { var d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function addDays(t, n) { var d = new Date(t); d.setDate(d.getDate() + n); return d.getTime(); }
  function addMonths(t, n) { var d = new Date(t); d.setMonth(d.getMonth() + n); return d.getTime(); }

  /** Monday 00:00 of the week containing t. */
  function weekStart(t) {
    var d = new Date(startOfDay(t));
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  }

  function relative(t) {
    var days = Math.round((startOfDay(Date.now()) - startOfDay(t)) / DAY);
    if (days < 1) return 'dziś';
    if (days === 1) return 'wczoraj';
    if (days < 14) return days + ' dni temu';
    return Math.floor(days / 7) + ' tyg. temu';
  }

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------

  function oneRM(weight, reps) { return reps <= 1 ? weight : weight * (1 + reps / 30); }
  function volumeOf(e) { return e.weight * e.reps * e.sets; }

  function findExercise(id) {
    for (var i = 0; i < state.exercises.length; i++) if (state.exercises[i].id === id) return state.exercises[i];
    return null;
  }

  function entriesFor(id) {
    return state.entries.filter(function (e) { return e.exerciseId === id; })
      .sort(function (a, b) { return a.date - b.date; });
  }

  function bestOf(id, fn) {
    var best = null;
    state.entries.forEach(function (e) {
      if (e.exerciseId !== id) return;
      var v = fn(e);
      if (best === null || v > best) best = v;
    });
    return best;
  }

  function bestOneRM(id) { return bestOf(id, function (e) { return oneRM(e.weight, e.reps); }); }
  function bestWeight(id) { return bestOf(id, function (e) { return e.weight; }); }

  /** One point per training day for the chosen metric. */
  function series(id, metric, since) {
    var map = {};
    state.entries.forEach(function (e) {
      if (e.exerciseId !== id || (since && e.date < since)) return;
      var k = startOfDay(e.date);
      var cur = map[k] || 0;
      if (metric === 'volume') map[k] = cur + volumeOf(e);
      else if (metric === 'maxWeight') map[k] = Math.max(cur, e.weight);
      else map[k] = Math.max(cur, oneRM(e.weight, e.reps));
    });
    return Object.keys(map).map(function (k) { return { date: Number(k), value: map[k] }; })
      .sort(function (a, b) { return a.date - b.date; });
  }

  /** IDs of entries that beat every earlier estimated 1RM for their exercise. */
  function prIds(exerciseId) {
    var best = {}, out = {};
    state.entries
      .filter(function (e) { return !exerciseId || e.exerciseId === exerciseId; })
      .sort(function (a, b) { return a.date - b.date; })
      .forEach(function (e) {
        var v = oneRM(e.weight, e.reps);
        if (best[e.exerciseId] === undefined) best[e.exerciseId] = v;
        else if (v > best[e.exerciseId] + 0.01) { out[e.id] = true; best[e.exerciseId] = v; }
      });
    return out;
  }

  function dailyVolume() {
    var map = {};
    state.entries.forEach(function (e) {
      var k = startOfDay(e.date);
      map[k] = (map[k] || 0) + volumeOf(e);
    });
    return map;
  }

  function uniqueDays(list) {
    var seen = {}, n = 0;
    list.forEach(function (e) { var k = startOfDay(e.date); if (!seen[k]) { seen[k] = true; n++; } });
    return n;
  }

  function inWeek(offset) {
    var s = addDays(weekStart(Date.now()), offset * 7), end = addDays(s, 7);
    return state.entries.filter(function (e) { return e.date >= s && e.date < end; });
  }

  function weekVolume(offset) { return inWeek(offset).reduce(function (sum, e) { return sum + volumeOf(e); }, 0); }
  function trainingDays(offset) { return uniqueDays(inWeek(offset)); }

  /** Consecutive Monday-based weeks with a session; the current week counts once it has one. */
  function weekStreak() {
    var weeks = {};
    state.entries.forEach(function (e) { weeks[weekStart(e.date)] = true; });
    var cursor = weekStart(Date.now());
    if (!weeks[cursor]) cursor = addDays(cursor, -7);
    var n = 0;
    while (weeks[cursor]) { n++; cursor = addDays(cursor, -7); }
    return n;
  }

  function recentPRCount() {
    var ids = prIds(), since = Date.now() - 30 * DAY;
    return state.entries.filter(function (e) { return ids[e.id] && e.date >= since; }).length;
  }

  function sortedExercises() {
    var last = {};
    state.entries.forEach(function (e) { if (!last[e.exerciseId] || e.date > last[e.exerciseId]) last[e.exerciseId] = e.date; });
    return state.exercises.slice().sort(function (a, b) {
      return (last[b.id] || b.createdAt || 0) - (last[a.id] || a.createdAt || 0);
    });
  }

  // ---------------------------------------------------------------------------
  // Demo data (deterministic 26 weeks)
  // ---------------------------------------------------------------------------

  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  function makeDemo() {
    var rnd = mulberry32(2026);
    var today = startOfDay(Date.now());
    var total = 182;
    var lifts = [
      { name: 'Wyciskanie leżąc', group: 'chest', base: 70, gain: 22.5, reps: [3, 8] },
      { name: 'Przysiad', group: 'legs', base: 90, gain: 35, reps: [3, 8] },
      { name: 'Martwy ciąg', group: 'back', base: 110, gain: 40, reps: [2, 6] },
      { name: 'Wyciskanie nad głowę', group: 'shoulders', base: 40, gain: 12.5, reps: [4, 8] },
      { name: 'Podciąganie z obciążeniem', group: 'back', base: 5, gain: 15, reps: [4, 8] },
      { name: 'Uginanie ze sztangą', group: 'arms', base: 25, gain: 10, reps: [8, 12] }
    ];
    lifts.forEach(function (l, i) { l.id = uid() + i; l.createdAt = addDays(today, -(total + 1 + i)); });
    var rotation = [[0, 3, 5], [1, 2], [0, 1, 4], [2, 3, 4, 5]];
    var skipped = { 7: true, 16: true };
    var entries = [], session = 0;

    for (var off = total; off >= 0; off--) {
      var day = addDays(today, -off);
      if (skipped[Math.floor((total - off) / 7)]) continue;
      var wd = new Date(day).getDay();
      var planned = wd === 1 || wd === 3 || wd === 5;
      var bonus = wd === 6 && rnd() < 0.35;
      if (!planned && !bonus) continue;
      if (rnd() < 0.12) continue;
      var progress = (total - off) / total;
      var plan = rotation[session % rotation.length];
      session++;
      var time = day + (7 + Math.floor(rnd() * 13)) * 3600000 + Math.floor(rnd() * 60) * 60000;
      if (time > Date.now()) time = Date.now() - 60000;
      plan.forEach(function (idx) {
        var l = lifts[idx];
        var raw = l.base + l.gain * progress + (rnd() * 2 - 1) * 2.5;
        entries.push({
          id: uid() + idx,
          exerciseId: l.id,
          date: time,
          weight: Math.max(2.5, Math.round(raw / 2.5) * 2.5),
          reps: l.reps[0] + Math.floor(rnd() * (l.reps[1] - l.reps[0] + 1)),
          sets: 3 + Math.floor(rnd() * 3)
        });
      });
    }
    return {
      exercises: lifts.map(function (l) { return { id: l.id, name: l.name, group: l.group, createdAt: l.createdAt }; }),
      entries: entries,
      goal: state.goal
    };
  }

  // ---------------------------------------------------------------------------
  // Backup code / file
  // ---------------------------------------------------------------------------

  function compactData() {
    var idx = {};
    state.exercises.forEach(function (e, i) { idx[e.id] = i; });
    return {
      app: 'kinetic',
      v: 1,
      g: state.goal,
      x: state.exercises.map(function (e) { return [e.name, e.group, Math.round((e.createdAt || Date.now()) / 60000)]; }),
      e: state.entries
        .filter(function (e) { return idx[e.exerciseId] !== undefined; })
        .map(function (e) { return [idx[e.exerciseId], Math.round(e.date / 60000), e.weight, e.reps, e.sets]; })
    };
  }

  function b64encode(s) { return btoa(unescape(encodeURIComponent(s))); }
  function b64decode(s) { return decodeURIComponent(escape(atob(s))); }

  function encodeBackup() { return BACKUP_PREFIX + b64encode(JSON.stringify(compactData())); }

  function decodeBackup(text) {
    text = String(text || '').trim();
    var data = text.indexOf(BACKUP_PREFIX) === 0
      ? JSON.parse(b64decode(text.slice(BACKUP_PREFIX.length).replace(/\s+/g, '')))
      : JSON.parse(text);
    if (!data || data.v !== 1 || !Array.isArray(data.x) || !Array.isArray(data.e)) throw new Error('Unsupported backup');
    var exercises = data.x.map(function (r, i) {
      return {
        id: uid() + 'x' + i,
        name: String(r[0]).slice(0, 60),
        group: GROUP_LABEL[r[1]] ? r[1] : 'other',
        createdAt: isNum(r[2]) ? r[2] * 60000 : Date.now()
      };
    });
    var entries = data.e
      .filter(function (r) { return Array.isArray(r) && exercises[r[0]]; })
      .map(function (r, i) {
        return { id: uid() + 'e' + i, exerciseId: exercises[r[0]].id, date: r[1] * 60000, weight: Number(r[2]), reps: Number(r[3]), sets: Number(r[4]) };
      })
      .filter(validEntry);
    return { exercises: exercises, entries: entries, goal: clampGoal(data.g) };
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).then(function () { return true; }, function () { return fallbackCopy(text); });
    }
    return Promise.resolve(fallbackCopy(text));
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.top = '0';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    ta.setSelectionRange(0, text.length);
    var ok = false;
    try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
    document.body.removeChild(ta);
    return ok;
  }

  function exportFile() {
    var json = JSON.stringify(compactData());
    var name = 'kinetic-kopia-' + isoDay(Date.now()) + '.json';
    try {
      var file = new File([json], name, { type: 'application/json' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file], title: 'Kopia Kinetic' }).catch(function () {});
        return;
      }
    } catch (err) { /* fall back to a download link */ }
    var url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    var a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    toast('Zapisano plik kopii');
  }

  function restoreFrom(text) {
    var data;
    try { data = decodeBackup(text); } catch (err) { toast('To nie jest prawidłowy kod kopii'); return; }
    var hasData = state.exercises.length > 0;
    if (hasData && !window.confirm('Zastąpić obecne dane danymi z kopii?')) return;
    state = data;
    save();
    closeSheet();
    toast('Przywrócono ' + data.entries.length + ' ' + plural(data.entries.length, 'wpis', 'wpisy', 'wpisów'));
    goHome();
  }

  // ---------------------------------------------------------------------------
  // Small UI helpers
  // ---------------------------------------------------------------------------

  function $(sel) { return document.querySelector(sel); }

  var toastTimer = null;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2200);
  }

  function bump(el) {
    if (!el) return;
    el.classList.remove('bump');
    void el.offsetWidth;
    el.classList.add('bump');
  }

  function deltaChip(f, compact) {
    var has = f !== null && f !== undefined && isFinite(f);
    var cls = !has ? 'flat' : (f > 0.0005 ? 'up' : (f < -0.0005 ? 'down' : 'flat'));
    return '<span class="delta ' + cls + (compact ? ' compact' : '') + '">' + icon(cls, compact ? 10 : 11, 3) +
      '<span>' + (has ? fmtPct(Math.abs(f)) : '—') + '</span></span>';
  }

  function tile(ic, value, unit, label, extra) {
    return '<div class="card tile' + (extra ? ' ' + extra : '') + '"><div class="tile-ic">' + icon(ic, 14, 2.2) + '</div>' +
      '<div class="v">' + value + (unit ? '<small>' + unit + '</small>' : '') + '</div><div class="l">' + label + '</div></div>';
  }

  function initials(name) {
    var words = name.trim().split(/\s+/);
    return (words[0].charAt(0) + (words[1] ? words[1].charAt(0) : '')).toUpperCase();
  }

  function animateCounts(root) {
    var els = root.querySelectorAll('[data-count]');
    Array.prototype.forEach.call(els, function (el) {
      var to = parseFloat(el.getAttribute('data-count'));
      var fmt = el.getAttribute('data-fmt') === 'int' ? fmtInt : fmtW;
      var start = null, dur = 1000, delay = 150, done = false;
      el.textContent = fmt(0);
      function step(now) {
        if (done) return;
        if (start === null) start = now + delay;
        var p = Math.min(1, Math.max(0, (now - start) / dur));
        el.textContent = fmt(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step); else done = true;
      }
      requestAnimationFrame(step);
      // Frames can be throttled (background tab, low-power mode); never leave a partial number behind.
      setTimeout(function () { done = true; el.textContent = fmt(to); }, delay + dur + 400);
    });
  }

  function animateRings(root, enter) {
    var bars = root.querySelectorAll('.ring-bar');
    Array.prototype.forEach.call(bars, function (b) {
      if (!enter) { b.style.transition = 'none'; b.style.strokeDashoffset = b.getAttribute('data-offset'); }
    });
    if (!enter || !bars.length) return;
    // Commit the starting offset, then move to the target so the CSS transition runs.
    // A timer (not rAF) keeps this working when frames are throttled.
    bars[0].getBoundingClientRect();
    setTimeout(function () {
      Array.prototype.forEach.call(bars, function (b) { b.style.strokeDashoffset = b.getAttribute('data-offset'); });
    }, 30);
  }

  function isIOS() {
    return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  }

  function isStandalone() {
    return window.navigator.standalone === true || (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
  }

  function showTip() {
    if (isStandalone()) return false;
    try { if (localStorage.getItem(TIP_KEY)) return false; } catch (err) { /* ignore */ }
    return isIOS();
  }

  // ---------------------------------------------------------------------------
  // Charts
  // ---------------------------------------------------------------------------

  /** Monotone cubic interpolation (no overshoot between points). */
  function monotonePath(pts) {
    var n = pts.length;
    if (!n) return '';
    var f = function (v) { return v.toFixed(1); };
    if (n === 1) return 'M' + f(pts[0].x) + ',' + f(pts[0].y);
    var dx = [], m = [], t = [], i;
    for (i = 0; i < n - 1; i++) {
      dx[i] = pts[i + 1].x - pts[i].x;
      m[i] = dx[i] === 0 ? 0 : (pts[i + 1].y - pts[i].y) / dx[i];
    }
    t[0] = m[0];
    t[n - 1] = m[n - 2];
    for (i = 1; i < n - 1; i++) {
      if (m[i - 1] * m[i] <= 0) t[i] = 0;
      else t[i] = 3 * (dx[i - 1] + dx[i]) / ((2 * dx[i] + dx[i - 1]) / m[i - 1] + (dx[i] + 2 * dx[i - 1]) / m[i]);
    }
    var d = 'M' + f(pts[0].x) + ',' + f(pts[0].y);
    for (i = 0; i < n - 1; i++) {
      var h = dx[i] / 3;
      d += 'C' + f(pts[i].x + h) + ',' + f(pts[i].y + t[i] * h) + ' ' + f(pts[i + 1].x - h) + ',' + f(pts[i + 1].y - t[i + 1] * h) +
        ' ' + f(pts[i + 1].x) + ',' + f(pts[i + 1].y);
    }
    return d;
  }

  function niceTicks(lo, hi, count) {
    var span = hi - lo;
    if (span <= 0) return [lo];
    var raw = span / count;
    var mag = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10));
    var norm = raw / mag;
    var step = (norm < 1.5 ? 1 : norm < 3 ? 2 : norm < 7 ? 5 : 10) * mag;
    var out = [];
    for (var v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(Math.round(v * 1e6) / 1e6);
    return out;
  }

  function sparkline(vals) {
    var W = 58, H = 28;
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = Math.max((hi - lo) * 0.2, 0.5), y0 = lo - pad, y1 = hi + pad;
    var pts = vals.map(function (v, i) {
      return { x: 2 + i / (vals.length - 1) * (W - 4), y: 2 + (1 - (v - y0) / (y1 - y0)) * (H - 4) };
    });
    var d = monotonePath(pts);
    var lastX = pts[pts.length - 1].x.toFixed(1), firstX = pts[0].x.toFixed(1);
    return '<svg class="spark" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">' +
      '<path d="' + d + 'L' + lastX + ',' + H + 'L' + firstX + ',' + H + 'Z" fill="rgba(57,211,83,0.14)"/>' +
      '<path d="' + d + '" fill="none" stroke="#39D353" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  }

  var chartGeom = null;
  var chartSel = -1;
  var chartWidth = 0;

  function fmtMetric(v) { return ui.metric === 'volume' ? fmtInt(v) : fmtW(v); }

  function mountChart(el, pts, animate) {
    if (!el) return;
    chartSel = -1;
    if (!pts.length) {
      chartGeom = null;
      el.innerHTML = '<div class="chart-empty">' + icon('chart', 28, 1.6) + '<span>Brak danych w tym zakresie</span></div>';
      return;
    }
    var W = Math.max(el.clientWidth, 200), H = 220, L = 4, R = 44, T = 12, B = 26;
    chartWidth = el.clientWidth;
    var vals = pts.map(function (p) { return p.value; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var pad = Math.max((hi - lo) * 0.25, hi * 0.04, 1);
    var y0 = Math.max(0, lo - pad), y1 = hi + pad;
    var t0 = pts[0].date, t1 = pts[pts.length - 1].date;
    if (t1 - t0 < DAY) { t0 -= 3 * DAY; t1 += 3 * DAY; }
    var base = H - B;
    function sx(t) { return L + (t - t0) / (t1 - t0) * (W - L - R); }
    function sy(v) { return T + (1 - (v - y0) / (y1 - y0)) * (base - T); }

    var xy = pts.map(function (p) { return { x: sx(p.date), y: sy(p.value) }; });
    var line = monotonePath(xy);
    var first = xy[0], last = xy[xy.length - 1];
    var area = line + 'L' + last.x.toFixed(1) + ',' + base + 'L' + first.x.toFixed(1) + ',' + base + 'Z';

    var grid = '';
    niceTicks(y0, y1, 4).forEach(function (v) {
      var y = sy(v).toFixed(1);
      grid += '<line x1="' + L + '" x2="' + (W - R + 4) + '" y1="' + y + '" y2="' + y + '"/>' +
        '<text x="' + (W - R + 10) + '" y="' + y + '" dy="3.5">' + (ui.metric === 'volume' ? fmtInt(v) : fmtW(v)) + '</text>';
    });

    var xl = '', ticks = pts.length < 4 ? pts.map(function (p) { return p.date; }) : [0, 1, 2, 3].map(function (i) { return t0 + (t1 - t0) * i / 3; });
    ticks.forEach(function (t, i) {
      var anchor = ticks.length > 1 && i === 0 ? 'start' : (ticks.length > 1 && i === ticks.length - 1 ? 'end' : 'middle');
      xl += '<text x="' + sx(t).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="' + anchor + '">' + dfDayMonth.format(new Date(t)) + '</text>';
    });

    var defs = '<defs>' +
      '<linearGradient id="ch-line" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="' + W + '" y2="0"><stop offset="0" stop-color="#2EE6A6"/><stop offset="1" stop-color="#39D353"/></linearGradient>' +
      '<linearGradient id="ch-area" gradientUnits="userSpaceOnUse" x1="0" y1="' + T + '" x2="0" y2="' + base + '"><stop offset="0" stop-color="#39D353" stop-opacity="0.32"/><stop offset="1" stop-color="#39D353" stop-opacity="0"/></linearGradient>' +
      '<filter id="ch-glow" filterUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '"><feGaussianBlur stdDeviation="5"/></filter>' +
      '</defs>';

    el.innerHTML = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '">' + defs +
      '<g class="grid">' + grid + '</g>' + xl +
      '<path class="area" d="' + area + '" fill="url(#ch-area)"/>' +
      '<path class="glow" d="' + line + '" stroke="url(#ch-line)" filter="url(#ch-glow)"/>' +
      '<path class="line" d="' + line + '" stroke="url(#ch-line)"/>' +
      '<circle class="last-dot" cx="' + last.x.toFixed(1) + '" cy="' + last.y.toFixed(1) + '" r="4.5"/>' +
      '<g class="cursor" style="display:none"><line class="cur-rule" y1="' + T + '" y2="' + base + '"/>' +
      '<circle class="cur-halo" r="9"/><circle class="cur-dot" r="3.5"/></g>' +
      '<rect x="0" y="0" width="' + W + '" height="' + H + '" fill="transparent"/></svg>';

    chartGeom = { xy: xy, pts: pts };
    if (animate) drawIn(el);
    bindChart(el);
  }

  function drawIn(el) {
    var paths = el.querySelectorAll('.line, .glow');
    var area = el.querySelector('.area'), dot = el.querySelector('.last-dot');
    Array.prototype.forEach.call(paths, function (p) {
      var len = p.getTotalLength ? p.getTotalLength() : 0;
      if (!len) return;
      p.style.strokeDasharray = len + ' ' + len;
      p.style.strokeDashoffset = len;
    });
    area.style.opacity = 0;
    dot.style.opacity = 0;
    el.getBoundingClientRect();
    setTimeout(function () {
      Array.prototype.forEach.call(paths, function (p) {
        p.style.transition = 'stroke-dashoffset 1.1s cubic-bezier(0.3, 0.7, 0.2, 1)';
        p.style.strokeDashoffset = 0;
      });
      area.style.transition = 'opacity 0.8s ease 0.45s';
      area.style.opacity = 1;
      dot.style.transition = 'opacity 0.3s ease 1s';
      dot.style.opacity = 1;
    }, 30);
  }

  function bindChart(el) {
    var svg = el.querySelector('svg');
    if (!svg) return;
    var cursor = svg.querySelector('.cursor'), dot = svg.querySelector('.last-dot');

    function move(clientX) {
      if (!chartGeom) return;
      var x = clientX - svg.getBoundingClientRect().left;
      var bi = 0, bd = Infinity;
      chartGeom.xy.forEach(function (p, i) { var d = Math.abs(p.x - x); if (d < bd) { bd = d; bi = i; } });
      if (bi === chartSel) return;
      chartSel = bi;
      var p = chartGeom.xy[bi];
      cursor.style.display = '';
      var rule = cursor.querySelector('.cur-rule');
      rule.setAttribute('x1', p.x); rule.setAttribute('x2', p.x);
      ['.cur-halo', '.cur-dot'].forEach(function (s) {
        var c = cursor.querySelector(s); c.setAttribute('cx', p.x); c.setAttribute('cy', p.y);
      });
      dot.style.visibility = 'hidden';
      renderHead(chartGeom.pts[bi]);
    }

    function end() {
      if (chartSel === -1) return;
      chartSel = -1;
      cursor.style.display = 'none';
      dot.style.visibility = '';
      renderHead(null);
    }

    if (window.PointerEvent) {
      svg.addEventListener('pointerdown', function (e) { move(e.clientX); });
      svg.addEventListener('pointermove', function (e) { move(e.clientX); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { svg.addEventListener(n, end); });
    } else {
      svg.addEventListener('touchstart', function (e) { move(e.touches[0].clientX); }, { passive: true });
      svg.addEventListener('touchmove', function (e) { move(e.touches[0].clientX); }, { passive: true });
      svg.addEventListener('touchend', end);
      svg.addEventListener('touchcancel', end);
    }
  }

  // ---------------------------------------------------------------------------
  // Home
  // ---------------------------------------------------------------------------

  function renderHome(enter) {
    detailCtx = null;
    chartGeom = null;
    var h = '<div class="view' + (enter ? ' enter' : '') + '">' + homeHeader();
    if (showTip()) h += tipCard();
    if (!state.exercises.length) h += emptyCard();
    else h += heroCard() + statsRow() + heatCard() + exerciseList();
    h += '<p class="foot fx" style="--d:.3s">Dane zapisane na tym urządzeniu · Ustawienia → Kopia zapasowa</p></div>';
    app.innerHTML = h;
    if (enter) animateCounts(app);
    animateRings(app, enter);
    var sc = app.querySelector('.heat-scroll');
    if (sc) sc.scrollLeft = sc.scrollWidth;
  }

  function homeHeader() {
    return '<header class="top fx" style="--d:0s"><div><div class="eyebrow">' + esc(dfLong.format(new Date())) + '</div>' +
      '<h1 class="title">Kinetic</h1></div>' +
      '<button class="icon-btn" data-action="settings" aria-label="Ustawienia">' + icon('more', 22, 3.2) + '</button></header>';
  }

  function tipCard() {
    return '<section class="card tip fx" style="--d:.03s"><span class="tip-ic">' + icon('share', 20, 2) + '</span>' +
      '<p><b>Dodaj Kinetic do ekranu początkowego.</b> Stuknij <b>Udostępnij</b>, potem <b>Do ekranu początkowego</b>. ' +
      'Otworzy się jak aplikacja, zadziała bez internetu, a postępy zostaną zapisane w telefonie.</p>' +
      '<button class="tip-x" data-action="tip-close" aria-label="Zamknij">' + icon('close', 16, 2.2) + '</button></section>';
  }

  function emptyCard() {
    var pattern = '010213024103241020312013423402130231423434';
    var cells = '';
    for (var i = 0; i < pattern.length; i++) cells += '<i class="c l' + pattern.charAt(i) + '" style="--w:' + (i % 14) + '"></i>';
    return '<section class="card empty fx" style="--d:.08s"><div class="mini-grid">' + cells + '</div>' +
      '<h2>Zacznij śledzić swój progres</h2>' +
      '<p class="note">Dodaj ćwiczenia, zapisuj ciężar, powtórzenia i serie. Kinetic pokaże, jak rośnie Twoja siła — dzień po dniu.</p>' +
      '<div class="stack">' +
      '<button class="btn-primary" data-action="add-exercise">' + icon('plus', 16, 2.6) + 'Dodaj pierwsze ćwiczenie</button>' +
      '<button class="btn-ghost" data-action="demo">' + icon('spark', 16, 2) + 'Wypróbuj z danymi demo</button>' +
      '<button class="btn-ghost" data-action="settings-restore">' + icon('restore', 16, 2) + 'Mam kod kopii</button>' +
      '</div></section>';
  }

  function ring(p, label, sub) {
    var r = 41.5, c = 2 * Math.PI * r;
    return '<div class="ring-wrap"><svg class="ring" viewBox="0 0 92 92" width="92" height="92" aria-hidden="true">' +
      '<defs><linearGradient id="ring-g" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="92" y2="92"><stop offset="0" stop-color="#2EE6A6"/><stop offset="1" stop-color="#39D353"/></linearGradient></defs>' +
      '<circle class="ring-track" cx="46" cy="46" r="' + r + '"/>' +
      '<circle class="ring-bar" cx="46" cy="46" r="' + r + '" stroke="url(#ring-g)" transform="rotate(-90 46 46)" stroke-dasharray="' + c.toFixed(2) +
      '" stroke-dashoffset="' + c.toFixed(2) + '" data-offset="' + (c * (1 - p)).toFixed(2) + '"' + (p <= 0 ? ' style="opacity:0"' : '') + '/>' +
      '</svg><div class="ring-label"><b>' + label + '</b><small>' + sub + '</small></div></div>';
  }

  function heroCard() {
    var thisWeek = weekVolume(0), lastWeek = weekVolume(-1);
    var change = lastWeek > 0 ? (thisWeek - lastWeek) / lastWeek : null;
    var days = trainingDays(0);
    return '<section class="card hero fx" style="--d:.05s"><div class="hero-main">' +
      '<div class="eyebrow">Wolumen · ten tydzień</div>' +
      '<div class="big"><span class="num" data-count="' + thisWeek + '" data-fmt="int">' + fmtInt(thisWeek) + '</span><span class="unit">kg</span></div>' +
      '<div class="delta-row">' + deltaChip(change) + '<span class="muted">vs poprzedni</span></div></div>' +
      ring(Math.min(days / state.goal, 1), days + '/' + state.goal, 'dni') + '</section>';
  }

  function statsRow() {
    return '<section class="stats fx" style="--d:.1s">' +
      tile('flame', String(weekStreak()), 'tyg.', 'Seria') +
      tile('calendar', String(uniqueDays(state.entries)), '', 'Treningi') +
      tile('trophy', String(recentPRCount()), '', 'PR · 30 dni') +
      '</section>';
  }

  function heatCard() {
    var vols = dailyVolume();
    var today = startOfDay(Date.now());
    var firstWeek = addDays(weekStart(today), -(HEAT_WEEKS - 1) * 7);
    var cols = [], max = 0, active = 0, w, d;

    for (w = 0; w < HEAT_WEEKS; w++) {
      var col = [];
      for (d = 0; d < 7; d++) {
        var t = addDays(firstWeek, w * 7 + d), v = vols[t] || 0;
        if (t <= today) { if (v > max) max = v; if (v > 0) active++; }
        col.push({ t: t, v: v });
      }
      cols.push(col);
    }

    var labels = cols.map(function (col) {
      var label = '';
      col.forEach(function (c) { if (new Date(c.t).getDate() === 1) label = dfMonth.format(new Date(c.t)); });
      return label;
    });
    if (!labels[0] && !labels[1] && !labels[2]) labels[0] = dfMonth.format(new Date(cols[0][0].t));

    var grid = cols.map(function (col, wi) {
      return '<div class="heat-col">' + col.map(function (c) {
        var future = c.t > today;
        var level = 0;
        if (c.v > 0 && max > 0) { var r = c.v / max; level = r < 0.25 ? 1 : r < 0.5 ? 2 : r < 0.75 ? 3 : 4; }
        return '<i class="c l' + level + (future ? ' future' : '') + (c.t === today ? ' today' : '') + '" style="--w:' + wi + '"' +
          (future ? '' : ' data-action="day" data-t="' + c.t + '" data-v="' + Math.round(c.v) + '"') + '></i>';
      }).join('') + '</div>';
    }).join('');

    return '<section class="card heat fx" style="--d:.15s">' +
      '<div class="heat-head"><span class="eyebrow">Aktywność</span><span class="muted">' + active + ' ' +
      plural(active, 'trening', 'treningi', 'treningów') + ' · 6 mies.</span></div>' +
      '<div class="heat-body"><div class="heat-days"><span>Pn</span><span></span><span>Śr</span><span></span><span>Pt</span><span></span><span>Nd</span></div>' +
      '<div class="heat-scroll"><div class="heat-inner"><div class="heat-months">' +
      labels.map(function (l) { return '<span>' + esc(l) + '</span>'; }).join('') + '</div>' +
      '<div class="heat-grid">' + grid + '</div></div></div></div>' +
      '<div class="heat-foot"><span class="heat-info" id="heat-info">Dotknij dzień</span>' +
      '<span class="legend">Mniej<i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i>Więcej</span></div>' +
      '</section>';
  }

  function exerciseList() {
    var h = '<section class="fx" style="--d:.2s"><div class="sec-head"><span class="eyebrow">Ćwiczenia</span>' +
      '<button class="chip-btn" data-action="add-exercise">' + icon('plus', 13, 2.8) + 'Dodaj</button></div>';
    sortedExercises().forEach(function (ex) {
      var list = entriesFor(ex.id);
      var trend = series(ex.id, 'oneRM', 0).slice(-12).map(function (p) { return p.value; });
      var best = bestWeight(ex.id);
      var change = trend.length > 1 && trend[0] > 0 ? (trend[trend.length - 1] - trend[0]) / trend[0] : null;
      var last = list.length ? list[list.length - 1] : null;
      h += '<a class="card ex-card" href="#/e/' + ex.id + '">' +
        '<span class="badge">' + esc(initials(ex.name)) + '</span>' +
        '<span class="ex-main"><span class="ex-name">' + esc(ex.name) + '</span>' +
        '<span class="ex-sub">' + esc(GROUP_LABEL[ex.group] || 'Inne') + ' · ' + (last ? relative(last.date) : 'brak wpisów') + '</span></span>' +
        (trend.length > 1 ? sparkline(trend) : '') +
        '<span class="ex-val"><span class="ex-w">' + (best !== null ? '<b>' + fmtW(best) + '</b><small>kg</small>' : '<b>—</b>') + '</span>' +
        deltaChip(change, true) + '</span></a>';
    });
    return h + '</section>';
  }

  // ---------------------------------------------------------------------------
  // Exercise detail
  // ---------------------------------------------------------------------------

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return list[0]; }

  function pills(group, items, current) {
    return '<div class="pills no-anim" data-group="' + group + '"><span class="pill-thumb"></span>' +
      items.map(function (it) {
        return '<button class="pill' + (it.id === current ? ' on' : '') + '" data-action="pill" data-group="' + group + '" data-value="' + it.id + '">' + it.label + '</button>';
      }).join('') + '</div>';
  }

  function placeThumbs() {
    Array.prototype.forEach.call(app.querySelectorAll('.pills'), function (p) {
      var on = p.querySelector('.pill.on'), thumb = p.querySelector('.pill-thumb');
      if (!on || !thumb) return;
      thumb.style.left = on.offsetLeft + 'px';
      thumb.style.width = on.offsetWidth + 'px';
      if (p.classList.contains('no-anim')) {
        requestAnimationFrame(function () { requestAnimationFrame(function () { p.classList.remove('no-anim'); }); });
      }
    });
  }

  function currentPoints(ex) {
    var r = byId(RANGES, ui.range);
    return series(ex.id, ui.metric, r.months ? addMonths(Date.now(), -r.months) : 0);
  }

  function renderDetail(id, enter) {
    var ex = findExercise(id);
    if (!ex) { location.replace('#/'); return; }
    app.innerHTML = '<div class="view detail' + (enter ? ' enter' : '') + '">' +
      '<nav class="nav fx" style="--d:0s"><button class="icon-btn" data-action="back" aria-label="Wstecz">' + icon('back', 20, 2.4) + '</button>' +
      '<button class="icon-btn" data-action="delete-exercise" data-id="' + ex.id + '" aria-label="Usuń ćwiczenie">' + icon('trash', 17, 2) + '</button></nav>' +
      '<section id="d-head" class="fx" style="--d:.03s"></section>' +
      '<div class="fx" style="--d:.06s">' + pills('metric', METRICS, ui.metric) + '</div>' +
      '<section class="card chart-card fx" style="--d:.1s"><div class="chart" id="d-chart"></div>' + pills('range', RANGES, ui.range) + '</section>' +
      '<section id="d-stats" class="grid2 fx" style="--d:.15s"></section>' +
      '<section id="d-hist" class="fx" style="--d:.2s"></section>' +
      '</div>' +
      '<div class="bottom-bar"><button class="btn-primary" data-action="log" data-id="' + ex.id + '">' + icon('plus', 16, 2.8) + 'Dodaj serię</button></div>';
    detailCtx = { ex: ex, pts: currentPoints(ex) };
    renderHead(null);
    placeThumbs();
    mountChart($('#d-chart'), detailCtx.pts, true);
    renderStats(ex);
    renderHistory(ex);
  }

  function renderHead(selected) {
    if (!detailCtx) return;
    var pts = detailCtx.pts, ex = detailCtx.ex;
    var shown = selected || (pts.length ? pts[pts.length - 1] : null);
    var sub;
    if (selected) {
      sub = '<span>' + esc(dfLong.format(new Date(selected.date))) + '</span>';
    } else if (pts.length > 1 && pts[0].value > 0) {
      sub = deltaChip((pts[pts.length - 1].value - pts[0].value) / pts[0].value) + '<span class="muted">' + byId(RANGES, ui.range).caption + '</span>';
    } else {
      sub = '<span class="muted">' + (pts.length ? 'Dodaj kolejne serie, aby zobaczyć trend' : 'Brak wpisów w tym okresie') + '</span>';
    }
    $('#d-head').innerHTML = '<div class="eyebrow accent">' + esc(GROUP_LABEL[ex.group] || 'Inne') + '</div>' +
      '<h1 class="d-title">' + esc(ex.name) + '</h1>' +
      '<div class="big xl"><span class="num">' + (shown ? fmtMetric(shown.value) : '—') + '</span><span class="unit">kg</span></div>' +
      '<div class="d-sub">' + sub + '</div>';
  }

  function renderStats(ex) {
    var list = entriesFor(ex.id);
    var b1 = bestOneRM(ex.id), bw = bestWeight(ex.id);
    var total = list.reduce(function (s, e) { return s + volumeOf(e); }, 0);
    $('#d-stats').innerHTML =
      tile('trophy', b1 !== null ? fmtW(b1) : '—', 'kg', 'Rekord · szac. 1RM') +
      tile('weight', bw !== null ? fmtW(bw) : '—', 'kg', 'Najcięższa seria') +
      tile('calendar', String(uniqueDays(list)), '', 'Sesje') +
      tile('bars', total >= 10000 ? fmtW(total / 1000) : fmtInt(total), total >= 10000 ? 't' : 'kg', 'Wolumen łącznie');
  }

  function renderHistory(ex) {
    var list = entriesFor(ex.id).reverse();
    var prs = prIds(ex.id);
    var h = '<div class="sec-head"><span class="eyebrow">Historia</span><span class="muted">' + list.length + ' ' +
      plural(list.length, 'wpis', 'wpisy', 'wpisów') + '</span></div>';
    if (!list.length) {
      h += '<div class="card note-card">Jeszcze nic tu nie ma. Dodaj pierwszą serię przyciskiem poniżej.</div>';
    } else {
      h += '<div class="card hist">' + list.slice(0, ui.historyLimit).map(function (e) {
        return '<div class="hrow"><div><div class="h-date">' + dfDayMonth.format(new Date(e.date)) + '</div>' +
          '<div class="h-sub">1RM ' + fmtW(oneRM(e.weight, e.reps)) + ' kg</div></div>' +
          (prs[e.id] ? '<span class="pr">' + icon('trophy', 10, 2.8) + 'PR</span>' : '') +
          '<div class="h-val"><b>' + fmtW(e.weight) + '</b><small>kg</small><span>× ' + e.reps + ' × ' + e.sets + '</span></div>' +
          '<button class="h-del" data-action="delete-entry" data-id="' + e.id + '" aria-label="Usuń wpis">' + icon('trash', 15, 2) + '</button></div>';
      }).join('') + '</div>';
      if (list.length > ui.historyLimit) h += '<button class="more-btn" data-action="more">Pokaż więcej</button>';
    }
    $('#d-hist').innerHTML = h;
  }

  // ---------------------------------------------------------------------------
  // Sheets
  // ---------------------------------------------------------------------------

  function openSheet(html) {
    var root = $('#sheet-root');
    root.innerHTML = '<div class="sheet-backdrop" data-action="close-sheet"></div>' +
      '<div class="sheet" role="dialog" aria-modal="true"><div class="sheet-grab"></div>' +
      '<button class="icon-btn sheet-close" data-action="close-sheet" aria-label="Zamknij">' + icon('close', 16, 2.4) + '</button>' +
      '<div class="sheet-body">' + html + '</div></div>';
    document.body.classList.add('sheet-open');
    root.getBoundingClientRect();
    requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('open'); }); });
  }

  function closeSheet(immediate) {
    var root = $('#sheet-root');
    if (!root.firstChild) return;
    root.classList.remove('open');
    document.body.classList.remove('sheet-open');
    logCtx = null;
    addCtx = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (immediate) { root.innerHTML = ''; return; }
    setTimeout(function () { if (!root.classList.contains('open')) root.innerHTML = ''; }, 450);
  }

  function parseW(s) {
    var v = parseFloat(String(s).replace(',', '.'));
    return isFinite(v) && v > 0 ? v : 0;
  }

  function inputW(v) { return String(Math.round(v * 100) / 100).replace('.', ','); }

  function counterRow(label, key) {
    return '<div class="card row-card"><span class="lbl">' + label + '</span><div class="counter">' +
      '<button class="round sm" data-action="cnt" data-key="' + key + '" data-step="-1" aria-label="Mniej">' + icon('minus', 18, 2.6) + '</button>' +
      '<b id="c-' + key + '">' + logCtx[key] + '</b>' +
      '<button class="round sm" data-action="cnt" data-key="' + key + '" data-step="1" aria-label="Więcej">' + icon('plus', 18, 2.6) + '</button>' +
      '</div></div>';
  }

  function openLog(exId) {
    var ex = findExercise(exId);
    if (!ex) return;
    var list = entriesFor(exId), last = list.length ? list[list.length - 1] : null;
    logCtx = { ex: ex, reps: last ? last.reps : 5, sets: last ? last.sets : 3, best: bestOneRM(exId), isRecord: false };
    var today = isoDay(Date.now());
    openSheet('<div class="sheet-head"><div class="eyebrow accent">Nowa seria</div><h2>' + esc(ex.name) + '</h2></div>' +
      '<div class="card weight-card">' +
      '<button class="round" data-action="w-step" data-step="-2.5" aria-label="Odejmij 2,5 kg">' + icon('minus', 20, 2.6) + '</button>' +
      '<label class="weight-field"><input id="w-input" type="text" inputmode="decimal" autocomplete="off" value="' + inputW(last ? last.weight : 20) + '" aria-label="Ciężar w kilogramach">' +
      '<span class="eyebrow">Kilogramy</span></label>' +
      '<button class="round filled" data-action="w-step" data-step="2.5" aria-label="Dodaj 2,5 kg">' + icon('plus', 20, 2.6) + '</button></div>' +
      '<div class="chips4">' + [-10, -5, 5, 10].map(function (s) {
        return '<button class="qchip' + (s > 0 ? ' plus' : '') + '" data-action="w-step" data-step="' + s + '">' + (s > 0 ? '+' : '−') + Math.abs(s) + '</button>';
      }).join('') + '</div>' +
      counterRow('Powtórzenia', 'reps') + counterRow('Serie', 'sets') +
      '<div class="card row-card"><span class="lbl">Data</span><input id="d-input" class="date-input" type="date" value="' + today + '" max="' + today + '"></div>' +
      '<div class="sum">' +
      '<div class="card tile s-1rm"><div class="k">Szac. 1RM</div><div class="v" id="s-1rm"></div></div>' +
      '<div class="card tile"><div class="k">Wolumen</div><div class="v" id="s-vol"></div></div>' +
      '<div class="card tile"><div class="k">Rekord</div><div class="v">' + (logCtx.best !== null ? fmtW(logCtx.best) + '<small>kg</small>' : '—') + '</div></div>' +
      '</div>' +
      '<button class="btn-primary" id="save-entry" data-action="save-entry">' + icon('check', 17, 2.8) + '<span>Zapisz</span></button>');
    updateLog();
  }

  function updateLog() {
    if (!logCtx) return;
    var w = parseW($('#w-input').value);
    var est = oneRM(w, logCtx.reps);
    logCtx.isRecord = logCtx.best !== null && w > 0 && est > logCtx.best + 0.01;
    $('#s-1rm').innerHTML = w > 0 ? fmtW(est) + '<small>kg</small>' : '—';
    $('#s-vol').innerHTML = w > 0 ? fmtInt(w * logCtx.reps * logCtx.sets) + '<small>kg</small>' : '—';
    $('.s-1rm').classList.toggle('hl', logCtx.isRecord);
    var btn = $('#save-entry');
    btn.disabled = !(w > 0);
    btn.querySelector('span').textContent = logCtx.isRecord ? 'Zapisz rekord' : 'Zapisz';
  }

  function saveEntry() {
    if (!logCtx) return;
    var w = parseW($('#w-input').value);
    if (!(w > 0)) return;
    var date = Date.now();
    var dv = $('#d-input').value;
    if (dv) {
      var parts = dv.split('-').map(Number);
      var picked = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0).getTime();
      if (isFinite(picked) && startOfDay(picked) !== startOfDay(Date.now())) date = Math.min(picked, Date.now());
    }
    var record = logCtx.isRecord, est = oneRM(w, logCtx.reps), exId = logCtx.ex.id;
    state.entries.push({ id: uid(), exerciseId: exId, date: date, weight: w, reps: logCtx.reps, sets: logCtx.sets });
    save();
    closeSheet();
    refresh();
    if (record) celebrate(est); else toast('Zapisano serię');
  }

  function openAdd() {
    addCtx = { group: 'chest' };
    var existing = {};
    state.exercises.forEach(function (e) { existing[e.name.toLowerCase()] = true; });
    var sugs = SUGGESTIONS.filter(function (s) { return !existing[s[0].toLowerCase()]; });
    openSheet('<div class="sheet-head"><div class="eyebrow accent">Nowe ćwiczenie</div><h2>Co dziś podnosisz?</h2></div>' +
      '<input id="ex-name" class="text-input" type="text" placeholder="Nazwa ćwiczenia" autocomplete="off" maxlength="40" enterkeyhint="done">' +
      '<span class="eyebrow label">Partia</span><div class="groups">' + GROUPS.map(function (g) {
        return '<button class="gchip' + (g.id === addCtx.group ? ' on' : '') + '" data-action="pick-group" data-value="' + g.id + '">' + g.label + '</button>';
      }).join('') + '</div>' +
      (sugs.length ? '<span class="eyebrow label">Popularne</span><div class="sugs">' + sugs.map(function (s) {
        return '<button class="sug" data-action="suggest" data-name="' + esc(s[0]) + '" data-group="' + s[1] + '">' + esc(s[0]) + '</button>';
      }).join('') + '</div>' : '') +
      '<button class="btn-primary sheet-cta" id="add-save" data-action="add-save" disabled>' + icon('plus', 16, 2.8) + 'Dodaj ćwiczenie</button>');
  }

  function pickGroup(id) {
    if (!addCtx) return;
    addCtx.group = id;
    Array.prototype.forEach.call(document.querySelectorAll('.groups .gchip'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-value') === id);
    });
  }

  function updateAdd() {
    var input = $('#ex-name');
    if (!input) return;
    var name = input.value.trim();
    $('#add-save').disabled = !name;
    Array.prototype.forEach.call(document.querySelectorAll('.sug'), function (b) {
      b.classList.toggle('on', b.getAttribute('data-name') === name);
    });
  }

  function addSave() {
    if (!addCtx) return;
    var name = $('#ex-name').value.trim().slice(0, 40);
    if (!name) return;
    var dupe = state.exercises.some(function (e) { return e.name.toLowerCase() === name.toLowerCase(); });
    if (dupe) { toast('To ćwiczenie już jest na liście'); return; }
    var ex = { id: uid(), name: name, group: addCtx.group, createdAt: Date.now() };
    state.exercises.push(ex);
    save();
    closeSheet(true);
    location.hash = '#/e/' + ex.id;
  }

  function openSettings(showRestore) {
    var n = state.exercises.length, m = state.entries.length;
    openSheet('<div class="sheet-head"><div class="eyebrow accent">Ustawienia</div><h2>Kinetic</h2></div>' +
      '<span class="eyebrow label">Cel tygodniowy · dni treningowe</span><div class="goal-row">' +
      [2, 3, 4, 5, 6, 7].map(function (g) {
        return '<button class="gchip' + (g === state.goal ? ' on' : '') + '" data-action="goal" data-value="' + g + '">' + g + '</button>';
      }).join('') + '</div>' +
      '<span class="eyebrow label">Kopia zapasowa</span>' +
      '<p class="note">Dane są zapisane tylko na tym urządzeniu (' + n + ' ' + plural(n, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń') + ', ' + m + ' ' +
      plural(m, 'wpis', 'wpisy', 'wpisów') + '). Kod kopii przenosi je na inny telefon lub przeglądarkę i pozwala je odzyskać po wyczyszczeniu Safari. ' +
      'Zachowaj go np. w Notatkach.</p>' +
      '<div class="stack">' +
      '<button class="btn-ghost" data-action="copy-code">' + icon('copy', 16, 2) + 'Kopiuj kod kopii</button>' +
      '<textarea id="code-out" class="code" readonly hidden aria-label="Kod kopii"></textarea>' +
      '<button class="btn-ghost" data-action="export-file">' + icon('share', 16, 2) + 'Zapisz kopię jako plik</button>' +
      '<button class="btn-ghost" data-action="show-restore">' + icon('restore', 16, 2) + 'Przywróć z kopii</button>' +
      '</div>' +
      '<div id="restore" class="restore"' + (showRestore ? '' : ' hidden') + '>' +
      '<textarea id="code-input" class="code" placeholder="Wklej kod kopii (zaczyna się od KNT1:)" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"></textarea>' +
      '<div class="stack"><button class="btn-primary" data-action="restore-code">' + icon('restore', 16, 2.4) + 'Przywróć z kodu</button>' +
      '<button class="btn-ghost" data-action="pick-file">' + icon('restore', 16, 2) + 'Wybierz plik kopii</button></div>' +
      '<input id="file-input" class="visually-hidden" type="file" accept=".json,application/json,text/plain" tabindex="-1">' +
      '</div>' +
      '<span class="eyebrow label">Dane</span><div class="stack">' +
      '<button class="btn-ghost" data-action="demo">' + icon('spark', 16, 2) + 'Wczytaj dane demo</button>' +
      '<button class="btn-ghost danger" data-action="reset">' + icon('trash', 16, 2) + 'Usuń wszystkie dane</button>' +
      '</div>' +
      '<p class="fine">Kinetic · wersja web 1.0</p>');
  }

  function celebrate(value) {
    var el = document.createElement('div');
    el.className = 'celebrate';
    var rays = '';
    for (var i = 0; i < 12; i++) rays += '<i class="cel-ray" style="transform:rotate(' + (i * 30) + 'deg)"><b></b></i>';
    el.innerHTML = '<div class="cel-glow"></div>' + rays + '<div class="cel-body">' + icon('trophy', 56, 1.8) +
      '<div class="cel-k">Nowy rekord</div><div class="cel-v">' + fmtW(value) + '<small>kg</small></div><div class="cel-s">szacowane 1RM</div></div>';
    var close = function () {
      if (!el.parentNode || el.classList.contains('out')) return;
      el.classList.add('out');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400);
    };
    el.addEventListener('click', close);
    document.body.appendChild(el);
    setTimeout(close, 1900);
  }

  // ---------------------------------------------------------------------------
  // Routing
  // ---------------------------------------------------------------------------

  function route() {
    var match = (location.hash || '').match(/^#\/e\/([A-Za-z0-9_-]+)/);
    var key = match ? 'e:' + match[1] : 'home';
    var prev = ui.route;
    var enter = key !== prev;
    if (enter) {
      if (prev === 'home') ui.homeScroll = window.pageYOffset || 0;
      ui.fromHome = prev === 'home' && !!match;
      ui.historyLimit = 12;
      closeSheet(true);
    }
    ui.route = key;
    if (match) {
      renderDetail(match[1], enter);
      if (enter) window.scrollTo(0, 0);
    } else {
      renderHome(enter);
      if (enter) window.scrollTo(0, ui.homeScroll || 0);
    }
  }

  function refresh() {
    if (ui.route === 'home') renderHome(false);
    else if (ui.route) renderDetail(ui.route.slice(2), false);
  }

  /** Show the overview with its entrance animation, e.g. after loading or restoring data. */
  function goHome() {
    if (ui.route === 'home') { renderHome(true); window.scrollTo(0, 0); }
    else location.hash = '#/';
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-action]') : null;
    if (!t) return;
    var action = t.getAttribute('data-action');

    switch (action) {
      case 'settings': openSettings(false); break;
      case 'settings-restore': openSettings(true); break;
      case 'add-exercise': openAdd(); break;
      case 'close-sheet': closeSheet(); break;
      case 'log': openLog(t.getAttribute('data-id')); break;
      case 'save-entry': saveEntry(); break;
      case 'pick-group': pickGroup(t.getAttribute('data-value')); break;
      case 'add-save': addSave(); break;

      case 'back':
        if (ui.fromHome && window.history.length > 1) window.history.back();
        else location.hash = '#/';
        break;

      case 'tip-close': {
        try { localStorage.setItem(TIP_KEY, '1'); } catch (err) { /* ignore */ }
        var tipEl = t.closest('.tip');
        if (tipEl) tipEl.parentNode.removeChild(tipEl);
        break;
      }

      case 'day': {
        var prevSel = app.querySelector('.c.sel');
        var info = $('#heat-info');
        if (prevSel) prevSel.classList.remove('sel');
        if (prevSel === t) { info.innerHTML = 'Dotknij dzień'; break; }
        t.classList.add('sel');
        var vol = Number(t.getAttribute('data-v'));
        info.innerHTML = '<b>' + dfDayMonth.format(new Date(Number(t.getAttribute('data-t')))) + '</b> · ' +
          (vol > 0 ? fmtInt(vol) + ' kg' : 'odpoczynek');
        break;
      }

      case 'pill': {
        var group = t.getAttribute('data-group'), value = t.getAttribute('data-value');
        if (ui[group] === value) break;
        ui[group] = value;
        Array.prototype.forEach.call(t.parentNode.querySelectorAll('.pill'), function (b) { b.classList.toggle('on', b === t); });
        placeThumbs();
        if (detailCtx) {
          detailCtx.pts = currentPoints(detailCtx.ex);
          renderHead(null);
          mountChart($('#d-chart'), detailCtx.pts, true);
        }
        break;
      }

      case 'more':
        ui.historyLimit += 20;
        if (detailCtx) renderHistory(detailCtx.ex);
        break;

      case 'w-step': {
        var input = $('#w-input');
        var next = Math.max(0, Math.round((parseW(input.value) + parseFloat(t.getAttribute('data-step'))) * 4) / 4);
        input.value = inputW(next);
        bump(input);
        updateLog();
        break;
      }

      case 'cnt': {
        if (!logCtx) break;
        var key = t.getAttribute('data-key');
        var limit = key === 'reps' ? 50 : 20;
        logCtx[key] = Math.min(limit, Math.max(1, logCtx[key] + parseInt(t.getAttribute('data-step'), 10)));
        var counter = $('#c-' + key);
        counter.textContent = logCtx[key];
        bump(counter);
        updateLog();
        break;
      }

      case 'suggest':
        $('#ex-name').value = t.getAttribute('data-name');
        pickGroup(t.getAttribute('data-group'));
        updateAdd();
        break;

      case 'delete-exercise': {
        var ex = findExercise(t.getAttribute('data-id'));
        if (!ex || !window.confirm('Usunąć „' + ex.name + '” i całą jego historię?')) break;
        state.exercises = state.exercises.filter(function (e) { return e.id !== ex.id; });
        state.entries = state.entries.filter(function (e) { return e.exerciseId !== ex.id; });
        save();
        location.replace('#/');
        break;
      }

      case 'delete-entry': {
        if (!window.confirm('Usunąć ten wpis?')) break;
        var entryId = t.getAttribute('data-id');
        state.entries = state.entries.filter(function (e) { return e.id !== entryId; });
        save();
        refresh();
        toast('Usunięto wpis');
        break;
      }

      case 'goal': {
        state.goal = clampGoal(t.getAttribute('data-value'));
        save();
        Array.prototype.forEach.call(document.querySelectorAll('.goal-row .gchip'), function (b) { b.classList.toggle('on', b === t); });
        refresh();
        break;
      }

      case 'copy-code': {
        var code = encodeBackup();
        var out = $('#code-out');
        out.value = code;
        out.hidden = false;
        copyText(code).then(function (ok) {
          if (ok) { toast('Skopiowano kod kopii'); return; }
          out.focus();
          out.select();
          toast('Zaznacz kod i skopiuj go ręcznie');
        });
        break;
      }

      case 'export-file': exportFile(); break;

      case 'show-restore': {
        var box = $('#restore');
        box.hidden = !box.hidden;
        break;
      }

      case 'restore-code': restoreFrom($('#code-input').value); break;
      case 'pick-file': $('#file-input').click(); break;

      case 'demo':
        if (state.exercises.length && !window.confirm('Zastąpić obecne dane przykładowymi?')) break;
        state = makeDemo();
        save();
        closeSheet();
        goHome();
        break;

      case 'reset':
        if (!window.confirm('Usunąć wszystkie ćwiczenia i historię? Tej operacji nie można cofnąć.')) break;
        state = { exercises: [], entries: [], goal: state.goal };
        save();
        closeSheet();
        goHome();
        break;
    }
  });

  document.addEventListener('input', function (ev) {
    if (ev.target.id === 'w-input') updateLog();
    else if (ev.target.id === 'ex-name') updateAdd();
  });

  document.addEventListener('change', function (ev) {
    if (ev.target.id !== 'file-input' || !ev.target.files || !ev.target.files[0]) return;
    var reader = new FileReader();
    reader.onload = function () { restoreFrom(reader.result); };
    reader.onerror = function () { toast('Nie udało się odczytać pliku'); };
    reader.readAsText(ev.target.files[0]);
  });

  document.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' && ev.target.id === 'ex-name') { ev.preventDefault(); addSave(); }
    if (ev.key === 'Escape') closeSheet();
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var el = $('#d-chart');
      if (detailCtx && el && el.clientWidth !== chartWidth) mountChart(el, detailCtx.pts, false);
      placeThumbs();
    }, 150);
  });

  window.addEventListener('hashchange', route);

  // ---------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------

  load();
  if (navigator.storage && navigator.storage.persist) {
    try { navigator.storage.persist(); } catch (err) { /* not supported */ }
  }
  route();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
