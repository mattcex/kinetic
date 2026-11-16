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
  /** Ranks bodyweight sets against each other when no body weight has been logged yet. */
  var DEFAULT_BODY_WEIGHT = 70;

  var BUILTIN_GROUPS = [
    { id: 'chest', label: 'Klatka' },
    { id: 'back', label: 'Plecy' },
    { id: 'legs', label: 'Nogi' },
    { id: 'glutes', label: 'Pośladki' },
    { id: 'shoulders', label: 'Barki' },
    { id: 'arms', label: 'Ramiona' },
    { id: 'core', label: 'Core' },
    { id: 'other', label: 'Inne' }
  ];

  var METRICS = {
    weight: [
      { id: 'oneRM', label: 'Szac. 1RM', unit: 'kg' },
      { id: 'maxWeight', label: 'Ciężar', unit: 'kg' },
      { id: 'volume', label: 'Wolumen', unit: 'kg' }
    ],
    bodyweight: [
      { id: 'maxReps', label: 'Maks. powt.', unit: 'powt.' },
      { id: 'totalReps', label: 'Powtórzenia', unit: 'powt.' },
      { id: 'load', label: 'Obciążenie', unit: 'kg' }
    ]
  };

  var RANGES = [
    { id: '1m', label: '1M', months: 1, caption: 'w ostatnim miesiącu' },
    { id: '3m', label: '3M', months: 3, caption: 'w 3 miesiące' },
    { id: '6m', label: '6M', months: 6, caption: 'w pół roku' },
    { id: '1y', label: '1R', months: 12, caption: 'w rok' },
    { id: 'all', label: 'Całość', months: 0, caption: 'od początku' }
  ];

  var SUGGESTIONS = [
    ['Wyciskanie leżąc', 'chest', 'weight'], ['Przysiad', 'legs', 'weight'], ['Martwy ciąg', 'back', 'weight'],
    ['Wyciskanie nad głowę', 'shoulders', 'weight'], ['Hip thrust', 'glutes', 'weight'], ['Wiosłowanie sztangą', 'back', 'weight'],
    ['Pompki', 'chest', 'bodyweight'], ['Podciąganie', 'back', 'bodyweight'], ['Pompki na poręczach', 'chest', 'bodyweight'],
    ['Przysiad bułgarski', 'legs', 'weight'], ['Martwy ciąg rumuński', 'glutes', 'weight'], ['Uginanie ze sztangą', 'arms', 'weight'],
    ['Unoszenie nóg w zwisie', 'core', 'bodyweight'], ['Wykroki', 'legs', 'weight']
  ];

  var BODY_FIELDS = ['weight', 'bodyFat', 'waist', 'neck', 'hips', 'shoulders'];
  var BODY_META = {
    weight: { label: 'Waga', unit: 'kg', min: 25, max: 350 },
    bodyFat: { label: 'Tkanka tłuszczowa', unit: '%', min: 2, max: 70 },
    waist: { label: 'Talia', unit: 'cm', min: 40, max: 250 },
    neck: { label: 'Szyja', unit: 'cm', min: 20, max: 80 },
    hips: { label: 'Biodra', unit: 'cm', min: 50, max: 250 },
    shoulders: { label: 'Barki', unit: 'cm', min: 60, max: 250 }
  };

  var ICONS = {
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    more: 'M5 12h.01M12 12h.01M19 12h.01',
    back: 'M15 18l-6-6 6-6',
    chevron: 'M9 6l6 6-6 6',
    close: 'M6 6l12 12M18 6L6 18',
    edit: 'M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4',
    user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 21a7.5 7.5 0 0 1 15 0',
    trophy: 'M8 21h8M12 17v4M17 4H7v6a5 5 0 0 0 10 0V4zM17 6h2.5A1.5 1.5 0 0 1 21 7.5V8a4 4 0 0 1-4 4M7 6H4.5A1.5 1.5 0 0 0 3 7.5V8a4 4 0 0 0 4 4',
    flame: 'M12 22c3.9 0 7-2.9 7-6.8 0-2.8-1.6-5.2-3.4-7-.4 1.7-1.5 3-2.9 3.5.3-3.3-1.2-6.4-4.2-8.7.2 3.4-1.6 5.6-3.1 7.6C4.4 12.1 5 13.6 5 15.2 5 19.1 8.1 22 12 22z',
    calendar: 'M4.5 5h15A1.5 1.5 0 0 1 21 6.5v13a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 19.5v-13A1.5 1.5 0 0 1 4.5 5zM3 10h18M8 3v4M16 3v4',
    weight: 'M7 8h10l2.5 12h-15zM9.5 8a2.5 2.5 0 0 1 5 0',
    bars: 'M5 20V11M12 20V4M19 20v-6',
    reps: 'M4 12h3l2-5 4 10 2-5h5',
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

  function emptyState(goal) {
    return { exercises: [], entries: [], goal: goal || 4, groups: [], profile: { sex: null, height: null }, body: [] };
  }

  var state = emptyState(4);
  var ui = {
    route: null, metricW: 'oneRM', metricB: 'maxReps', range: '6m', bodyRange: 'all',
    historyLimit: 12, bodyLimit: 8, homeScroll: 0, fromHome: false
  };
  var detailCtx = null;
  var bodyCtx = null;
  var logCtx = null;
  var exCtx = null;
  var profileCtx = null;
  var app = document.getElementById('app');

  /** Native helpers provided by the Android app (MainActivity.Bridge); absent in browsers. */
  var bridge = window.AndroidBridge || null;

  /** Bumped on every change so derived lookups are rebuilt only when data changes. */
  var dataVersion = 0;

  function clampGoal(g) {
    g = parseInt(g, 10);
    return g >= 2 && g <= 7 ? g : 4;
  }

  function isNum(v) { return typeof v === 'number' && isFinite(v); }

  function validEntry(e) {
    return e && typeof e.id === 'string' && typeof e.exerciseId === 'string' &&
      isNum(e.date) && isNum(e.weight) && e.weight >= 0 && isNum(e.reps) && e.reps > 0 && isNum(e.sets) && e.sets > 0;
  }

  function cleanBody(b) {
    var out = { id: b.id, date: b.date };
    BODY_FIELDS.forEach(function (f) { if (isNum(b[f]) && b[f] > 0) out[f] = b[f]; });
    return out;
  }

  function hasMeasurement(b) {
    return BODY_FIELDS.some(function (f) { return b[f] !== undefined; });
  }

  function normalize(data) {
    var s = emptyState(clampGoal(data.goal));
    s.groups = (Array.isArray(data.groups) ? data.groups : []).filter(function (g) {
      return g && typeof g.id === 'string' && typeof g.label === 'string' && g.label.trim();
    });
    s.exercises = (Array.isArray(data.exercises) ? data.exercises : [])
      .filter(function (x) { return x && typeof x.id === 'string' && typeof x.name === 'string'; })
      .map(function (x) {
        return {
          id: x.id, name: x.name, group: typeof x.group === 'string' ? x.group : 'other',
          type: x.type === 'bodyweight' ? 'bodyweight' : 'weight', createdAt: isNum(x.createdAt) ? x.createdAt : Date.now()
        };
      });
    s.entries = (Array.isArray(data.entries) ? data.entries : []).filter(validEntry);
    var p = data.profile || {};
    s.profile = {
      sex: p.sex === 'm' || p.sex === 'f' ? p.sex : null,
      height: isNum(p.height) && p.height >= 120 && p.height <= 230 ? p.height : null
    };
    s.body = (Array.isArray(data.body) ? data.body : [])
      .filter(function (b) { return b && typeof b.id === 'string' && isNum(b.date); })
      .map(cleanBody)
      .filter(hasMeasurement);
    return s;
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data === 'object') state = normalize(data);
    } catch (err) {
      console.warn('Kinetic: could not read saved data', err);
    }
  }

  /** Persist after a change. */
  function commit() {
    dataVersion++;
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
  var nf2 = new Intl.NumberFormat('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var dfDayMonth = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'short' });
  var dfLong = new Intl.DateTimeFormat('pl-PL', { weekday: 'long', day: 'numeric', month: 'long' });
  var dfMonth = new Intl.DateTimeFormat('pl-PL', { month: 'short' });

  function fmtInt(v) { return nfInt.format(Math.round(v)); }
  function fmtW(v) { return nfW.format(v); }
  function fmt2(v) { return nf2.format(v); }

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

  /** Parses "82,5" or "82.5"; returns NaN for empty or invalid input. */
  function parseNum(s) {
    var t = String(s == null ? '' : s).trim().replace(',', '.');
    if (!t) return NaN;
    var v = Number(t);
    return isFinite(v) ? v : NaN;
  }

  function inputNum(v) { return String(Math.round(v * 100) / 100).replace('.', ','); }

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

  /** Value of a <input type="date">: today keeps the current time, other days use noon. */
  function pickedDate(value) {
    if (!value) return Date.now();
    var parts = value.split('-').map(Number);
    var t = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0).getTime();
    if (!isFinite(t) || startOfDay(t) === startOfDay(Date.now())) return Date.now();
    return Math.min(t, Date.now());
  }

  // ---------------------------------------------------------------------------
  // Lookups (rebuilt when data changes)
  // ---------------------------------------------------------------------------

  var cacheVersion = -1;
  var cache = null;

  function cached() {
    if (cacheVersion === dataVersion && cache) return cache;
    var exMap = {};
    state.exercises.forEach(function (x) { exMap[x.id] = x; });
    var latest = {};
    state.body.slice().sort(function (a, b) { return a.date - b.date; }).forEach(function (b) {
      BODY_FIELDS.forEach(function (f) { if (b[f] !== undefined) latest[f] = { value: b[f], date: b.date }; });
    });
    var groupLabels = {};
    BUILTIN_GROUPS.forEach(function (g) { groupLabels[g.id] = g.label; });
    state.groups.forEach(function (g) { groupLabels[g.id] = g.label; });
    cache = { exMap: exMap, latest: latest, groupLabels: groupLabels };
    cacheVersion = dataVersion;
    return cache;
  }

  function findExercise(id) { return cached().exMap[id] || null; }
  function latestBody(field) { return cached().latest[field] || null; }
  function bodyWeightNow() { var w = latestBody('weight'); return w ? w.value : null; }
  function groupLabel(id) { return cached().groupLabels[id] || 'Inne'; }
  function allGroups() { return BUILTIN_GROUPS.concat(state.groups); }

  function isBodyweight(exerciseId) {
    var ex = findExercise(exerciseId);
    return !!ex && ex.type === 'bodyweight';
  }

  // ---------------------------------------------------------------------------
  // Training calculations
  // ---------------------------------------------------------------------------

  function oneRM(weight, reps) { return reps <= 1 ? weight : weight * (1 + reps / 30); }

  /** Load moved per rep: body weight plus added weight for bodyweight exercises. */
  function loadOf(e) { return isBodyweight(e.exerciseId) ? (bodyWeightNow() || 0) + e.weight : e.weight; }
  function volumeOf(e) { return loadOf(e) * e.reps * e.sets; }

  /** Comparable strength score used for personal records. */
  function scoreOf(e) {
    if (isBodyweight(e.exerciseId)) return oneRM((bodyWeightNow() || DEFAULT_BODY_WEIGHT) + e.weight, e.reps);
    return oneRM(e.weight, e.reps);
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

  function bestScore(id) { return bestOf(id, scoreOf); }
  function bestOneRM(id) { return bestOf(id, function (e) { return oneRM(e.weight, e.reps); }); }
  function bestWeight(id) { return bestOf(id, function (e) { return e.weight; }); }
  function bestReps(id) { return bestOf(id, function (e) { return e.reps; }); }

  /** One point per training day for the chosen metric. */
  function series(id, metric, since) {
    var map = {};
    state.entries.forEach(function (e) {
      if (e.exerciseId !== id || (since && e.date < since)) return;
      var k = startOfDay(e.date);
      var cur = map[k] || 0;
      switch (metric) {
        case 'volume': map[k] = cur + volumeOf(e); break;
        case 'maxWeight': map[k] = Math.max(cur, e.weight); break;
        case 'maxReps': map[k] = Math.max(cur, e.reps); break;
        case 'totalReps': map[k] = cur + e.reps * e.sets; break;
        case 'load': map[k] = Math.max(cur, e.weight); break;
        default: map[k] = Math.max(cur, oneRM(e.weight, e.reps));
      }
    });
    return Object.keys(map).map(function (k) { return { date: Number(k), value: map[k] }; })
      .sort(function (a, b) { return a.date - b.date; });
  }

  /** IDs of entries that beat every earlier score for their exercise. */
  function prIds(exerciseId) {
    var best = {}, out = {};
    state.entries
      .filter(function (e) { return !exerciseId || e.exerciseId === exerciseId; })
      .sort(function (a, b) { return a.date - b.date; })
      .forEach(function (e) {
        var v = scoreOf(e);
        if (best[e.exerciseId] === undefined) best[e.exerciseId] = v;
        else if (v > best[e.exerciseId] + 0.01) { out[e.id] = true; best[e.exerciseId] = v; }
      });
    return out;
  }

  /** Per day: number of sets (activity intensity) and volume in kg. */
  function dailyActivity() {
    var map = {};
    state.entries.forEach(function (e) {
      var k = startOfDay(e.date);
      var d = map[k] || (map[k] = { sets: 0, volume: 0 });
      d.sets += e.sets;
      d.volume += volumeOf(e);
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

  function metricsFor(ex) { return METRICS[ex.type === 'bodyweight' ? 'bodyweight' : 'weight']; }
  function metricKey(ex) { return ex.type === 'bodyweight' ? 'metricB' : 'metricW'; }

  function currentMetric(ex) {
    var list = metricsFor(ex), id = ui[metricKey(ex)];
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return list[0];
  }

  // ---------------------------------------------------------------------------
  // Body composition & physique indices
  // ---------------------------------------------------------------------------

  function navyBodyFat(sex, height, waist, neck, hips) {
    var v;
    if (sex === 'm') {
      if (waist <= neck) return null;
      v = 495 / (1.0324 - 0.19077 * Math.log10(waist - neck) + 0.15456 * Math.log10(height)) - 450;
    } else {
      if (!hips || waist + hips <= neck) return null;
      v = 495 / (1.29579 - 0.35004 * Math.log10(waist + hips - neck) + 0.221 * Math.log10(height)) - 450;
    }
    return isFinite(v) && v >= 2 && v <= 60 ? v : null;
  }

  /** DOTS powerlifting score for a squat + bench + deadlift total. */
  function dots(total, bw, sex) {
    var c = sex === 'f'
      ? [-57.96288, 13.6175032, -0.1126655495, 0.0005158568, -0.0000010706]
      : [-307.75076, 24.0900756, -0.1918759221, 0.0007391293, -0.000001093];
    var x = Math.min(Math.max(bw, 40), sex === 'f' ? 150 : 210);
    var den = c[0] + c[1] * x + c[2] * x * x + c[3] * Math.pow(x, 3) + c[4] * Math.pow(x, 4);
    return total * 500 / den;
  }

  var LIFTS = [
    { key: 'squat', label: 'Przysiad', test: function (n) { return /^przysiad|squat/.test(n) && !/bułgar|goblet|wykrok|split|przedni|front/.test(n); } },
    { key: 'bench', label: 'Wyciskanie', test: function (n) { return /wyciskanie leżąc|bench/.test(n) && !/hantl|skos|incline|dumbbell/.test(n); } },
    { key: 'deadlift', label: 'Martwy ciąg', test: function (n) { return /martwy ciąg|deadlift/.test(n) && !/rumuń|romanian|prostych|stiff/.test(n); } }
  ];

  function bestLift(test) {
    var best = null;
    state.exercises.forEach(function (x) {
      if (x.type === 'bodyweight' || !test(x.name.toLowerCase())) return;
      var v = bestOneRM(x.id);
      if (v && (!best || v > best.value)) best = { value: v, ex: x };
    });
    return best;
  }

  function indices() {
    var p = state.profile, h = p.height, sex = p.sex;
    var w = latestBody('weight'), waist = latestBody('waist'), neck = latestBody('neck');
    var hips = latestBody('hips'), shoulders = latestBody('shoulders'), manual = latestBody('bodyFat');
    var out = { sex: sex, height: h, weight: w ? w.value : null };

    var navy = null;
    if (sex && h && waist && neck) {
      var v = navyBodyFat(sex, h, waist.value, neck.value, hips && hips.value);
      if (v !== null) navy = { value: v, date: Math.max(waist.date, neck.date) };
    }
    if (manual && (!navy || manual.date >= navy.date)) { out.bodyFat = manual.value; out.bodyFatSource = 'wpisana ręcznie'; }
    else if (navy) { out.bodyFat = navy.value; out.bodyFatSource = 'metoda US Navy'; }
    else out.bodyFat = null;

    out.lbm = out.weight && out.bodyFat !== null ? out.weight * (1 - out.bodyFat / 100) : null;
    if (out.lbm && h) {
      var m = h / 100;
      out.ffmi = out.lbm / (m * m);
      out.ffmiNorm = out.ffmi + 6.1 * (1.8 - m);
    } else {
      out.ffmi = out.ffmiNorm = null;
    }
    out.vRatio = shoulders && waist ? shoulders.value / waist.value : null;
    out.whtr = waist && h ? waist.value / h : null;
    out.whr = waist && hips ? waist.value / hips.value : null;

    out.strength = [];
    out.dots = null;
    if (out.weight) {
      out.strength = state.exercises
        .filter(function (x) { return x.type !== 'bodyweight'; })
        .map(function (x) { var b = bestOneRM(x.id); return b ? { ex: x, oneRM: b, ratio: b / out.weight } : null; })
        .filter(Boolean)
        .sort(function (a, b) { return b.ratio - a.ratio; })
        .slice(0, 6);
      var lifts = LIFTS.map(function (l) { var b = bestLift(l.test); return b ? { label: l.label, value: b.value } : null; });
      if (sex && lifts[0] && lifts[1] && lifts[2]) {
        var total = lifts[0].value + lifts[1].value + lifts[2].value;
        out.dots = { value: dots(total, out.weight, sex), total: total, lifts: lifts };
      }
    }
    return out;
  }

  function tone(label, t) { return { label: label, tone: t }; }

  function verdictBodyFat(v, sex) {
    if (!sex) return null;
    var t = sex === 'f' ? [14, 21, 25, 32] : [6, 14, 18, 25];
    if (v < t[0]) return tone('Zawodniczy', 'info');
    if (v < t[1]) return tone('Atletyczny', 'good');
    if (v < t[2]) return tone('Fitness', 'good');
    if (v < t[3]) return tone('Przeciętny', 'mid');
    return tone('Wysoki', 'bad');
  }

  function verdictFFMI(v, sex) {
    if (!sex) return null;
    var t = sex === 'f' ? [14, 16, 17.5, 19, 21] : [18, 20, 22, 23, 25];
    if (v < t[0]) return tone('Poniżej przeciętnej', 'mid');
    if (v < t[1]) return tone('Przeciętny', 'neutral');
    if (v < t[2]) return tone('Dobry', 'good');
    if (v < t[3]) return tone('Bardzo dobry', 'good');
    if (v < t[4]) return tone('Wybitny', 'info');
    return tone('Granica naturalna', 'info');
  }

  function verdictV(v) {
    if (v >= 1.6) return tone('Złota proporcja', 'info');
    if (v >= 1.45) return tone('Wyraźne V', 'good');
    if (v >= 1.3) return tone('Dobra', 'neutral');
    return tone('Prosta', 'mid');
  }

  function verdictWHtR(v) {
    if (v < 0.4) return tone('Bardzo niski', 'mid');
    if (v < 0.5) return tone('Zdrowy', 'good');
    if (v < 0.6) return tone('Podwyższony', 'mid');
    return tone('Wysoki', 'bad');
  }

  function verdictWHR(v, sex) {
    if (!sex) return null;
    return v <= (sex === 'f' ? 0.85 : 0.9) ? tone('Prawidłowy', 'good') : tone('Podwyższony', 'bad');
  }

  function verdictDOTS(v) {
    if (v < 250) return tone('Początkujący', 'neutral');
    if (v < 350) return tone('Średniozaawansowany', 'good');
    if (v < 450) return tone('Zaawansowany', 'good');
    if (v < 550) return tone('Elita', 'info');
    return tone('Poziom światowy', 'info');
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
      { name: 'Podciąganie', group: 'back', type: 'bodyweight', base: -5, gain: 20, reps: [5, 10] },
      { name: 'Hip thrust', group: 'glutes', base: 80, gain: 50, reps: [6, 10] },
      { name: 'Pompki', group: 'chest', type: 'bodyweight', base: 0, gain: 0, reps: [15, 32] }
    ];
    lifts.forEach(function (l, i) { l.id = uid() + i; l.createdAt = addDays(today, -(total + 1 + i)); });
    var rotation = [[0, 3, 6], [1, 2, 5], [0, 1, 4], [2, 3, 4, 5, 6]];
    var skipped = { 7: true, 16: true };
    var entries = [], body = [], session = 0;

    for (var off = total; off >= 0; off--) {
      var day = addDays(today, -off);
      var progress = (total - off) / total;
      if (off % 7 === 0) {
        var m = { id: uid() + 'b' + off, date: day + 7 * 3600000, weight: Math.round((84 - 3.6 * progress + (rnd() - 0.5) * 0.8) * 10) / 10 };
        if (off % 28 === 0) {
          m.waist = Math.round((89 - 5 * progress) * 2) / 2;
          m.neck = 39.5;
          m.hips = Math.round((101 - 2 * progress) * 2) / 2;
          m.shoulders = Math.round((117 + 4 * progress) * 2) / 2;
        }
        body.push(m);
      }
      if (skipped[Math.floor((total - off) / 7)]) continue;
      var wd = new Date(day).getDay();
      var planned = wd === 1 || wd === 3 || wd === 5;
      var bonus = wd === 6 && rnd() < 0.35;
      if (!planned && !bonus) continue;
      if (rnd() < 0.12) continue;
      var plan = rotation[session % rotation.length];
      session++;
      var time = day + (7 + Math.floor(rnd() * 13)) * 3600000 + Math.floor(rnd() * 60) * 60000;
      if (time > Date.now()) time = Date.now() - 60000;
      plan.forEach(function (idx) {
        var l = lifts[idx];
        var weight, reps;
        if (l.type === 'bodyweight' && l.gain === 0) {
          weight = 0;
          reps = Math.round(l.reps[0] + (l.reps[1] - l.reps[0]) * progress + (rnd() * 2 - 1) * 2);
        } else {
          var raw = l.base + l.gain * progress + (rnd() * 2 - 1) * 2.5;
          weight = Math.max(l.type === 'bodyweight' ? 0 : 2.5, Math.round(raw / 2.5) * 2.5);
          reps = l.reps[0] + Math.floor(rnd() * (l.reps[1] - l.reps[0] + 1));
        }
        entries.push({ id: uid() + idx, exerciseId: l.id, date: time, weight: weight, reps: Math.max(1, reps), sets: 3 + Math.floor(rnd() * 3) });
      });
    }
    return {
      exercises: lifts.map(function (l) {
        return { id: l.id, name: l.name, group: l.group, type: l.type || 'weight', createdAt: l.createdAt };
      }),
      entries: entries,
      goal: state.goal,
      groups: state.groups.slice(),
      profile: { sex: 'm', height: 181 },
      body: body
    };
  }

  // ---------------------------------------------------------------------------
  // Backup code / file
  // ---------------------------------------------------------------------------

  function opt(v) { return v === undefined ? null : v; }

  function compactData() {
    var idx = {};
    state.exercises.forEach(function (e, i) { idx[e.id] = i; });
    return {
      app: 'kinetic',
      v: 2,
      g: state.goal,
      c: state.groups.map(function (g) { return [g.id, g.label]; }),
      p: [state.profile.sex, state.profile.height],
      x: state.exercises.map(function (e) {
        return [e.name, e.group, Math.round((e.createdAt || Date.now()) / 60000), e.type === 'bodyweight' ? 1 : 0];
      }),
      e: state.entries
        .filter(function (e) { return idx[e.exerciseId] !== undefined; })
        .map(function (e) { return [idx[e.exerciseId], Math.round(e.date / 60000), e.weight, e.reps, e.sets]; }),
      b: state.body.map(function (b) {
        return [Math.round(b.date / 60000)].concat(BODY_FIELDS.map(function (f) { return opt(b[f]); }));
      })
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
    if (!data || (data.v !== 1 && data.v !== 2) || !Array.isArray(data.x) || !Array.isArray(data.e)) throw new Error('Unsupported backup');
    var groups = (Array.isArray(data.c) ? data.c : [])
      .filter(function (r) { return Array.isArray(r) && typeof r[0] === 'string' && typeof r[1] === 'string'; })
      .map(function (r) { return { id: r[0], label: r[1].slice(0, 24) }; });
    var known = {};
    BUILTIN_GROUPS.concat(groups).forEach(function (g) { known[g.id] = true; });
    var exercises = data.x.map(function (r, i) {
      return {
        id: uid() + 'x' + i,
        name: String(r[0]).slice(0, 60),
        group: known[r[1]] ? r[1] : 'other',
        type: r[3] === 1 ? 'bodyweight' : 'weight',
        createdAt: isNum(r[2]) ? r[2] * 60000 : Date.now()
      };
    });
    var entries = data.e.map(function (r, i) {
      if (!Array.isArray(r) || !exercises[r[0]]) return null;
      return { id: uid() + 'e' + i, exerciseId: exercises[r[0]].id, date: r[1] * 60000, weight: Number(r[2]), reps: Number(r[3]), sets: Number(r[4]) };
    }).filter(validEntry);
    var body = (Array.isArray(data.b) ? data.b : []).map(function (r, i) {
      if (!Array.isArray(r) || !isNum(r[0])) return null;
      var b = { id: uid() + 'b' + i, date: r[0] * 60000 };
      BODY_FIELDS.forEach(function (f, j) { if (isNum(r[j + 1])) b[f] = r[j + 1]; });
      return b;
    }).filter(function (b) { return b && hasMeasurement(b); });
    var p = Array.isArray(data.p) ? data.p : [];
    return normalize({ goal: data.g, groups: groups, exercises: exercises, entries: entries, profile: { sex: p[0], height: p[1] }, body: body });
  }

  function copyText(text) {
    if (bridge) {
      try { bridge.copy(text); return Promise.resolve(true); } catch (err) { /* fall through */ }
    }
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
    if (bridge) {
      // Android share sheet: save to Drive, send to yourself, keep in notes…
      bridge.share('Kopia Kinetic ' + isoDay(Date.now()), json);
      return;
    }
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
    var hasData = state.exercises.length > 0 || state.body.length > 0;
    if (hasData && !window.confirm('Zastąpić obecne dane danymi z kopii?')) return;
    state = data;
    commit();
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
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
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

  /** Neutral change chip for body weight, where up or down is not good or bad by itself. */
  function changeChip(diff, unit) {
    var sign = diff > 0.05 ? '+' : (diff < -0.05 ? '−' : '±');
    return '<span class="delta flat">' + sign + fmtW(Math.abs(diff)) + ' ' + unit + '</span>';
  }

  function tile(ic, value, unit, label, extra) {
    return '<div class="card tile' + (extra ? ' ' + extra : '') + '"><div class="tile-ic">' + icon(ic, 14, 2.2) + '</div>' +
      '<div class="v">' + value + (unit ? '<small>' + unit + '</small>' : '') + '</div><div class="l">' + label + '</div></div>';
  }

  function tag(v) { return v ? '<span class="tag ' + v.tone + '">' + v.label + '</span>' : ''; }

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

  /**
   * Draws a glowing line chart into el.
   * opts.fmt formats axis values; opts.onSelect(point|null) runs while the user drags across it.
   */
  function mountChart(el, pts, animate, opts) {
    if (!el) return;
    chartSel = -1;
    if (!pts.length) {
      chartGeom = null;
      el.innerHTML = '<div class="chart-empty">' + icon('chart', 28, 1.6) + '<span>' + (opts.empty || 'Brak danych w tym zakresie') + '</span></div>';
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
        '<text x="' + (W - R + 10) + '" y="' + y + '" dy="3.5">' + opts.fmt(v) + '</text>';
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

    chartGeom = { xy: xy, pts: pts, onSelect: opts.onSelect };
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
      chartGeom.onSelect(chartGeom.pts[bi]);
    }

    function end() {
      if (chartSel === -1 || !chartGeom) return;
      chartSel = -1;
      cursor.style.display = 'none';
      dot.style.visibility = '';
      chartGeom.onSelect(null);
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
  // Shared pieces
  // ---------------------------------------------------------------------------

  function byId(list, id) { for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i]; return list[0]; }

  /** Segmented control; the highlight is positioned in CSS from --i (selected index) and --n (count). */
  function pills(group, items, current) {
    var index = 0;
    items.forEach(function (it, i) { if (it.id === current) index = i; });
    return '<div class="pills no-anim" data-group="' + group + '" style="--i:' + index + ';--n:' + items.length + '"><span class="pill-thumb"></span>' +
      items.map(function (it) {
        return '<button class="pill' + (it.id === current ? ' on' : '') + '" data-action="pill" data-group="' + group + '" data-value="' + it.id + '">' + it.label + '</button>';
      }).join('') + '</div>';
  }

  function placeThumbs() {
    Array.prototype.forEach.call(app.querySelectorAll('.pills'), function (p) {
      var buttons = p.querySelectorAll('.pill');
      for (var i = 0; i < buttons.length; i++) if (buttons[i].classList.contains('on')) p.style.setProperty('--i', i);
      if (p.classList.contains('no-anim')) {
        setTimeout(function () { p.classList.remove('no-anim'); }, 60);
      }
    });
  }

  function rangeStart(id) {
    var r = byId(RANGES, id);
    return r.months ? addMonths(Date.now(), -r.months) : 0;
  }

  // ---------------------------------------------------------------------------
  // Home
  // ---------------------------------------------------------------------------

  function renderHome(enter) {
    detailCtx = null;
    bodyCtx = null;
    chartGeom = null;
    var h = '<div class="view' + (enter ? ' enter' : '') + '">' + homeHeader();
    if (showTip()) h += tipCard();
    if (!state.exercises.length) h += emptyCard() + bodyCard();
    else h += heroCard() + statsRow() + bodyCard() + heatCard() + exerciseList();
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

  function bodyCard() {
    var idx = indices();
    if (!idx.weight && !state.profile.height) {
      return '<a class="card body-card fx" style="--d:.12s" href="#/body">' +
        '<div class="row-between"><span class="eyebrow">Sylwetka</span><span class="chev">' + icon('chevron', 16, 2.4) + '</span></div>' +
        '<p class="note tight">Dodaj wagę, wzrost i obwody. Kinetic policzy tkankę tłuszczową, FFMI, proporcje sylwetki i siłę względną.</p>' +
        '<span class="chip-btn">' + icon('plus', 13, 2.8) + 'Uzupełnij profil</span></a>';
    }
    function cell(value, unit, label) {
      return '<div><b>' + (value === null ? '—' : value + (unit ? '<small>' + unit + '</small>' : '')) + '</b><span>' + label + '</span></div>';
    }
    return '<a class="card body-card fx" style="--d:.12s" href="#/body">' +
      '<div class="row-between"><span class="eyebrow">Sylwetka</span><span class="chev">' + icon('chevron', 16, 2.4) + '</span></div>' +
      '<div class="trio">' +
      cell(idx.weight ? fmtW(idx.weight) : null, 'kg', 'Waga') +
      cell(idx.bodyFat !== null ? fmtW(idx.bodyFat) : null, '%', 'Tłuszcz') +
      cell(idx.ffmiNorm ? fmtW(idx.ffmiNorm) : null, '', 'FFMI') +
      '</div></a>';
  }

  function heatCard() {
    var activity = dailyActivity();
    var today = startOfDay(Date.now());
    var firstWeek = addDays(weekStart(today), -(HEAT_WEEKS - 1) * 7);
    var cols = [], max = 0, active = 0, w, d;

    for (w = 0; w < HEAT_WEEKS; w++) {
      var col = [];
      for (d = 0; d < 7; d++) {
        var t = addDays(firstWeek, w * 7 + d), a = activity[t] || { sets: 0, volume: 0 };
        if (t <= today) { if (a.sets > max) max = a.sets; if (a.sets > 0) active++; }
        col.push({ t: t, sets: a.sets, volume: a.volume });
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
        if (c.sets > 0 && max > 0) { var r = c.sets / max; level = r < 0.25 ? 1 : r < 0.5 ? 2 : r < 0.75 ? 3 : 4; }
        return '<i class="c l' + level + (future ? ' future' : '') + (c.t === today ? ' today' : '') + '" style="--w:' + wi + '"' +
          (future ? '' : ' data-action="day" data-t="' + c.t + '" data-s="' + c.sets + '" data-v="' + Math.round(c.volume) + '"') + '></i>';
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
      var bw = ex.type === 'bodyweight';
      var list = entriesFor(ex.id);
      var trend = series(ex.id, bw ? 'maxReps' : 'oneRM', 0).slice(-12).map(function (p) { return p.value; });
      var best = bw ? bestReps(ex.id) : bestWeight(ex.id);
      var change = trend.length > 1 && trend[0] > 0 ? (trend[trend.length - 1] - trend[0]) / trend[0] : null;
      var last = list.length ? list[list.length - 1] : null;
      h += '<a class="card ex-card" href="#/e/' + ex.id + '">' +
        '<span class="badge">' + esc(initials(ex.name)) + '</span>' +
        '<span class="ex-main"><span class="ex-name">' + esc(ex.name) + '</span>' +
        '<span class="ex-sub">' + esc(groupLabel(ex.group)) + (bw ? ' · masa ciała' : '') + ' · ' + (last ? relative(last.date) : 'brak wpisów') + '</span></span>' +
        (trend.length > 1 ? sparkline(trend) : '') +
        '<span class="ex-val"><span class="ex-w">' + (best !== null ? '<b>' + (bw ? fmtInt(best) : fmtW(best)) + '</b><small>' + (bw ? 'powt.' : 'kg') + '</small>' : '<b>—</b>') + '</span>' +
        deltaChip(change, true) + '</span></a>';
    });
    return h + '</section>';
  }

  // ---------------------------------------------------------------------------
  // Exercise detail
  // ---------------------------------------------------------------------------

  function currentPoints(ex) {
    return series(ex.id, currentMetric(ex).id, rangeStart(ui.range));
  }

  function chartOptsFor(ex) {
    var metric = currentMetric(ex);
    return {
      fmt: metric.unit === 'kg' && metric.id !== 'volume' ? fmtW : fmtInt,
      onSelect: renderHead
    };
  }

  function renderDetail(id, enter) {
    var ex = findExercise(id);
    if (!ex) { location.replace('#/'); return; }
    bodyCtx = null;
    var key = metricKey(ex);
    app.innerHTML = '<div class="view detail' + (enter ? ' enter' : '') + '">' +
      '<nav class="nav fx" style="--d:0s"><button class="icon-btn" data-action="back" aria-label="Wstecz">' + icon('back', 20, 2.4) + '</button>' +
      '<div class="nav-actions">' +
      '<button class="icon-btn" data-action="edit-exercise" data-id="' + ex.id + '" aria-label="Edytuj ćwiczenie">' + icon('edit', 17, 2) + '</button>' +
      '<button class="icon-btn" data-action="delete-exercise" data-id="' + ex.id + '" aria-label="Usuń ćwiczenie">' + icon('trash', 17, 2) + '</button>' +
      '</div></nav>' +
      '<section id="d-head" class="fx" style="--d:.03s"></section>' +
      '<div class="fx" style="--d:.06s">' + pills(key, metricsFor(ex), currentMetric(ex).id) + '</div>' +
      '<section class="card chart-card fx" style="--d:.1s"><div class="chart" id="d-chart"></div>' + pills('range', RANGES, ui.range) + '</section>' +
      '<section id="d-stats" class="grid2 fx" style="--d:.15s"></section>' +
      '<section id="d-hist" class="fx" style="--d:.2s"></section>' +
      '</div>' +
      '<div class="bottom-bar"><button class="btn-primary" data-action="log" data-id="' + ex.id + '">' + icon('plus', 16, 2.8) + 'Dodaj serię</button></div>';
    detailCtx = { ex: ex, pts: currentPoints(ex) };
    renderHead(null);
    placeThumbs();
    mountChart($('#d-chart'), detailCtx.pts, true, chartOptsFor(ex));
    renderStats(ex);
    renderHistory(ex);
  }

  function renderHead(selected) {
    if (!detailCtx) return;
    var pts = detailCtx.pts, ex = detailCtx.ex, metric = currentMetric(ex);
    var shown = selected || (pts.length ? pts[pts.length - 1] : null);
    var fmt = chartOptsFor(ex).fmt;
    var sub;
    if (selected) {
      sub = '<span>' + esc(dfLong.format(new Date(selected.date))) + '</span>';
    } else if (pts.length > 1 && pts[0].value > 0) {
      sub = deltaChip((pts[pts.length - 1].value - pts[0].value) / pts[0].value) + '<span class="muted">' + byId(RANGES, ui.range).caption + '</span>';
    } else {
      sub = '<span class="muted">' + (pts.length ? 'Dodaj kolejne serie, aby zobaczyć trend' : 'Brak wpisów w tym okresie') + '</span>';
    }
    $('#d-head').innerHTML = '<div class="eyebrow accent">' + esc(groupLabel(ex.group)) + (ex.type === 'bodyweight' ? ' · masa ciała' : '') + '</div>' +
      '<h1 class="d-title">' + esc(ex.name) + '</h1>' +
      '<div class="big xl"><span class="num">' + (shown ? fmt(shown.value) : '—') + '</span><span class="unit">' + metric.unit + '</span></div>' +
      '<div class="d-sub">' + sub + '</div>';
  }

  function renderStats(ex) {
    var list = entriesFor(ex.id);
    var total = list.reduce(function (s, e) { return s + volumeOf(e); }, 0);
    if (ex.type === 'bodyweight') {
      var reps = list.reduce(function (s, e) { return s + e.reps * e.sets; }, 0);
      var maxAdded = bestWeight(ex.id);
      $('#d-stats').innerHTML =
        tile('trophy', bestReps(ex.id) !== null ? fmtInt(bestReps(ex.id)) : '—', 'powt.', 'Rekord w serii') +
        tile('weight', maxAdded ? '+' + fmtW(maxAdded) : '—', maxAdded ? 'kg' : '', 'Najw. obciążenie') +
        tile('calendar', String(uniqueDays(list)), '', 'Sesje') +
        tile('reps', fmtInt(reps), '', 'Powtórzeń łącznie');
      return;
    }
    var b1 = bestOneRM(ex.id), bw = bestWeight(ex.id);
    $('#d-stats').innerHTML =
      tile('trophy', b1 !== null ? fmtW(b1) : '—', 'kg', 'Rekord · szac. 1RM') +
      tile('weight', bw !== null ? fmtW(bw) : '—', 'kg', 'Najcięższa seria') +
      tile('calendar', String(uniqueDays(list)), '', 'Sesje') +
      tile('bars', total >= 10000 ? fmtW(total / 1000) : fmtInt(total), total >= 10000 ? 't' : 'kg', 'Wolumen łącznie');
  }

  function renderHistory(ex) {
    var bw = ex.type === 'bodyweight';
    var list = entriesFor(ex.id).reverse();
    var prs = prIds(ex.id);
    var h = '<div class="sec-head"><span class="eyebrow">Historia</span><span class="muted">' + list.length + ' ' +
      plural(list.length, 'wpis', 'wpisy', 'wpisów') + '</span></div>';
    if (!list.length) {
      h += '<div class="card note-card">Jeszcze nic tu nie ma. Dodaj pierwszą serię przyciskiem poniżej.</div>';
    } else {
      h += '<div class="card hist">' + list.slice(0, ui.historyLimit).map(function (e) {
        var sub = bw ? (e.weight > 0 ? '+' + fmtW(e.weight) + ' kg obciążenia' : 'masa ciała') : '1RM ' + fmtW(oneRM(e.weight, e.reps)) + ' kg';
        var val = bw
          ? '<b>' + e.reps + '</b><small>powt.</small><span>× ' + e.sets + '</span>'
          : '<b>' + fmtW(e.weight) + '</b><small>kg</small><span>× ' + e.reps + ' × ' + e.sets + '</span>';
        return '<div class="hrow"><div><div class="h-date">' + dfDayMonth.format(new Date(e.date)) + '</div>' +
          '<div class="h-sub">' + sub + '</div></div>' +
          (prs[e.id] ? '<span class="pr">' + icon('trophy', 10, 2.8) + 'PR</span>' : '') +
          '<div class="h-val">' + val + '</div>' +
          '<button class="h-del" data-action="delete-entry" data-id="' + e.id + '" aria-label="Usuń wpis">' + icon('trash', 15, 2) + '</button></div>';
      }).join('') + '</div>';
      if (list.length > ui.historyLimit) h += '<button class="more-btn" data-action="more">Pokaż więcej</button>';
    }
    $('#d-hist').innerHTML = h;
  }

  // ---------------------------------------------------------------------------
  // Body screen
  // ---------------------------------------------------------------------------

  function bodyPoints() {
    var since = rangeStart(ui.bodyRange);
    return state.body
      .filter(function (b) { return b.weight !== undefined && (!since || b.date >= since); })
      .map(function (b) { return { date: b.date, value: b.weight }; })
      .sort(function (a, b) { return a.date - b.date; });
  }

  var bodyChartOpts = { fmt: fmtW, onSelect: renderBodyHead, empty: 'Dodaj pomiar wagi, aby zobaczyć wykres' };

  function renderBody(enter) {
    detailCtx = null;
    var idx = indices();
    var p = state.profile;
    var missing = !p.sex || !p.height;
    app.innerHTML = '<div class="view detail' + (enter ? ' enter' : '') + '">' +
      '<nav class="nav fx" style="--d:0s"><button class="icon-btn" data-action="back" aria-label="Wstecz">' + icon('back', 20, 2.4) + '</button>' +
      '<button class="icon-btn" data-action="profile" aria-label="Profil">' + icon('user', 18, 2) + '</button></nav>' +
      '<section id="b-head" class="fx" style="--d:.03s"></section>' +
      (missing ? '<section class="card cta fx" style="--d:.05s"><p class="note tight"><b>Uzupełnij profil.</b> Płeć i wzrost są potrzebne do tkanki tłuszczowej, FFMI i DOTS.</p>' +
        '<button class="chip-btn" data-action="profile">' + icon('user', 13, 2.4) + 'Profil</button></section>' : '') +
      '<section class="card chart-card fx" style="--d:.08s"><div class="chart" id="b-chart"></div>' + pills('bodyRange', RANGES, ui.bodyRange) + '</section>' +
      indicesSection(idx) +
      strengthSection(idx) +
      '<section id="b-log" class="fx" style="--d:.24s"></section>' +
      '<p class="fine fx" style="--d:.28s">Wskaźniki są orientacyjne i nie zastępują porady lekarza ani pomiaru DEXA.</p>' +
      '</div>' +
      '<div class="bottom-bar"><button class="btn-primary" data-action="measure">' + icon('plus', 16, 2.8) + 'Dodaj pomiar</button></div>';
    bodyCtx = { pts: bodyPoints() };
    renderBodyHead(null);
    placeThumbs();
    mountChart($('#b-chart'), bodyCtx.pts, true, bodyChartOpts);
    renderBodyLog();
  }

  function renderBodyHead(selected) {
    if (!bodyCtx) return;
    var pts = bodyCtx.pts;
    var shown = selected || (pts.length ? pts[pts.length - 1] : null);
    var sub;
    if (selected) sub = '<span>' + esc(dfLong.format(new Date(selected.date))) + '</span>';
    else if (pts.length > 1) sub = changeChip(pts[pts.length - 1].value - pts[0].value, 'kg') + '<span class="muted">' + byId(RANGES, ui.bodyRange).caption + '</span>';
    else sub = '<span class="muted">' + (pts.length ? 'Dodawaj pomiary regularnie, np. raz w tygodniu' : 'Brak pomiarów wagi') + '</span>';
    var h = state.profile.height;
    $('#b-head').innerHTML = '<div class="eyebrow accent">Ciało' + (h ? ' · ' + fmtInt(h) + ' cm' : '') + '</div>' +
      '<h1 class="d-title">Sylwetka</h1>' +
      '<div class="big xl"><span class="num">' + (shown ? fmtW(shown.value) : '—') + '</span><span class="unit">kg</span></div>' +
      '<div class="d-sub">' + sub + '</div>';
  }

  function indexCard(label, value, unit, verdict, note, hint) {
    var body = value === null
      ? '<div class="v muted-v">—</div><div class="hint">' + hint + '</div>'
      : '<div class="v">' + value + (unit ? '<small>' + unit + '</small>' : '') + '</div>' + tag(verdict) + (note ? '<div class="hint">' + note + '</div>' : '');
    return '<div class="card tile idx"><div class="k">' + label + '</div>' + body + '</div>';
  }

  function indicesSection(idx) {
    var sex = idx.sex;
    var needProfile = !sex || !idx.height ? 'Uzupełnij płeć i wzrost' : null;
    var bfHint = needProfile || (sex === 'f' ? 'Dodaj talię, szyję i biodra' : 'Dodaj obwód talii i szyi') + ' albo wpisz % tłuszczu';
    var ffmiHint = !idx.weight ? 'Dodaj wagę' : (idx.bodyFat === null ? 'Potrzebny % tłuszczu' : 'Uzupełnij wzrost');
    return '<section class="fx" style="--d:.14s"><div class="sec-head"><span class="eyebrow">Wskaźniki</span><span class="muted">dla trenujących</span></div>' +
      '<div class="grid2">' +
      indexCard('Tkanka tłuszczowa', idx.bodyFat !== null ? fmtW(idx.bodyFat) : null, '%', idx.bodyFat !== null ? verdictBodyFat(idx.bodyFat, sex) : null, idx.bodyFatSource, bfHint) +
      indexCard('FFMI', idx.ffmiNorm ? fmtW(idx.ffmiNorm) : null, '', idx.ffmiNorm ? verdictFFMI(idx.ffmiNorm, sex) : null, idx.ffmi ? 'znormalizowany · surowy ' + fmtW(idx.ffmi) : '', ffmiHint) +
      indexCard('Sylwetka V', idx.vRatio ? fmt2(idx.vRatio) : null, '', idx.vRatio ? verdictV(idx.vRatio) : null, 'barki : talia', 'Dodaj obwód barków i talii') +
      indexCard('Masa beztłuszczowa', idx.lbm ? fmtW(idx.lbm) : null, 'kg', null, idx.lbm ? 'mięśnie, kości, woda' : '', ffmiHint) +
      indexCard('Talia : wzrost', idx.whtr ? fmt2(idx.whtr) : null, '', idx.whtr ? verdictWHtR(idx.whtr) : null, 'cel poniżej 0,50', idx.height ? 'Dodaj obwód talii' : 'Uzupełnij wzrost i talię') +
      indexCard('Talia : biodra', idx.whr ? fmt2(idx.whr) : null, '', idx.whr ? verdictWHR(idx.whr, sex) : null, 'WHR', 'Dodaj obwód talii i bioder') +
      '</div></section>';
  }

  function strengthSection(idx) {
    var h = '<section class="fx" style="--d:.19s"><div class="sec-head"><span class="eyebrow">Siła względna</span><span class="muted">szac. 1RM ÷ masa ciała</span></div>';
    if (!idx.weight) return h + '<div class="card note-card">Dodaj pomiar wagi, aby porównać siłę z masą ciała.</div></section>';
    if (!idx.strength.length && !idx.dots) return h + '<div class="card note-card">Zapisz serie z ciężarem, aby zobaczyć siłę względną.</div></section>';
    h += '<div class="card str">';
    if (idx.dots) {
      h += '<div class="str-dots"><div><div class="k">DOTS</div><div class="dots-v">' + fmtInt(idx.dots.value) + '</div></div>' +
        '<div class="dots-side">' + tag(verdictDOTS(idx.dots.value)) + '<div class="hint">' +
        idx.dots.lifts.map(function (l) { return esc(l.label) + ' ' + fmtInt(l.value); }).join(' + ') + ' = ' + fmtInt(idx.dots.total) + ' kg</div></div></div>';
    }
    h += idx.strength.map(function (s) {
      var pct = Math.min(s.ratio / 3, 1) * 100;
      return '<div class="str-row"><div class="str-top"><span class="str-name">' + esc(s.ex.name) + '</span>' +
        '<span class="str-ratio"><b>' + fmt2(s.ratio) + '</b>×</span></div>' +
        '<div class="str-bar"><i style="width:' + pct.toFixed(1) + '%"></i></div>' +
        '<div class="hint">szac. 1RM ' + fmtW(s.oneRM) + ' kg</div></div>';
    }).join('');
    return h + '</div></section>';
  }

  function renderBodyLog() {
    var el = $('#b-log');
    if (!el) return;
    var list = state.body.slice().sort(function (a, b) { return b.date - a.date; });
    var latest = ['waist', 'neck', 'hips', 'shoulders'].map(function (f) {
      var l = latestBody(f);
      return '<div><b>' + (l ? fmtW(l.value) + '<small>cm</small>' : '—') + '</b><span>' + BODY_META[f].label + '</span></div>';
    }).join('');
    var h = '<div class="sec-head"><span class="eyebrow">Pomiary</span><span class="muted">' + list.length + ' ' +
      plural(list.length, 'wpis', 'wpisy', 'wpisów') + '</span></div>' +
      '<div class="card quad">' + latest + '</div>';
    if (list.length) {
      h += '<div class="card hist">' + list.slice(0, ui.bodyLimit).map(function (b) {
        var parts = [];
        ['bodyFat', 'waist', 'neck', 'hips', 'shoulders'].forEach(function (f) {
          if (b[f] !== undefined) parts.push(BODY_META[f].label.toLowerCase().split(' ')[0] + ' ' + fmtW(b[f]) + (f === 'bodyFat' ? '%' : ''));
        });
        return '<div class="hrow"><div class="h-main"><div class="h-date">' + dfDayMonth.format(new Date(b.date)) + '</div>' +
          '<div class="h-sub">' + (parts.length ? esc(parts.join(' · ')) : 'tylko waga') + '</div></div>' +
          '<div class="h-val">' + (b.weight !== undefined ? '<b>' + fmtW(b.weight) + '</b><small>kg</small>' : '') + '</div>' +
          '<button class="h-del" data-action="delete-body" data-id="' + b.id + '" aria-label="Usuń pomiar">' + icon('trash', 15, 2) + '</button></div>';
      }).join('') + '</div>';
      if (list.length > ui.bodyLimit) h += '<button class="more-btn" data-action="more-body">Pokaż więcej</button>';
    }
    el.innerHTML = h;
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
    exCtx = null;
    profileCtx = null;
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    if (immediate) { root.innerHTML = ''; return; }
    setTimeout(function () { if (!root.classList.contains('open')) root.innerHTML = ''; }, 450);
  }

  // ----- Log a set -----

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
    var bw = ex.type === 'bodyweight';
    var list = entriesFor(exId), last = list.length ? list[list.length - 1] : null;
    logCtx = {
      ex: ex, bw: bw, reps: last ? last.reps : (bw ? 10 : 5), sets: last ? last.sets : 3,
      best: bestScore(exId), bestReps: bestReps(exId), isRecord: false
    };
    var today = isoDay(Date.now());
    var startWeight = last ? last.weight : (bw ? 0 : 20);
    var bodyNow = bodyWeightNow();
    openSheet('<div class="sheet-head"><div class="eyebrow accent">Nowa seria' + (bw ? ' · masa ciała' : '') + '</div><h2>' + esc(ex.name) + '</h2></div>' +
      '<div class="card weight-card">' +
      '<button class="round" data-action="w-step" data-step="-2.5" aria-label="Odejmij 2,5 kg">' + icon('minus', 20, 2.6) + '</button>' +
      '<label class="weight-field"><input id="w-input" type="text" inputmode="decimal" autocomplete="off" value="' + inputNum(startWeight) + '" aria-label="' + (bw ? 'Dodatkowe obciążenie w kilogramach' : 'Ciężar w kilogramach') + '">' +
      '<span class="eyebrow">' + (bw ? 'Dodatkowe kg' : 'Kilogramy') + '</span></label>' +
      '<button class="round filled" data-action="w-step" data-step="2.5" aria-label="Dodaj 2,5 kg">' + icon('plus', 20, 2.6) + '</button></div>' +
      (bw ? '<p class="note tight center">' + (bodyNow ? 'Liczymy Twoją masę ciała (' + fmtW(bodyNow) + ' kg) + dodatkowe obciążenie.' : 'Zostaw 0, jeśli ćwiczysz bez obciążenia. Dodaj wagę w „Sylwetka”, aby liczyć wolumen.') + '</p>' : '') +
      '<div class="chips4">' + [-10, -5, 5, 10].map(function (s) {
        return '<button class="qchip' + (s > 0 ? ' plus' : '') + '" data-action="w-step" data-step="' + s + '">' + (s > 0 ? '+' : '−') + Math.abs(s) + '</button>';
      }).join('') + '</div>' +
      counterRow('Powtórzenia', 'reps') + counterRow('Serie', 'sets') +
      '<div class="card row-card"><span class="lbl">Data</span><input id="d-input" class="date-input" type="date" value="' + today + '" max="' + today + '"></div>' +
      '<div class="sum">' +
      '<div class="card tile s-1rm"><div class="k">' + (bw ? 'Powt. łącznie' : 'Szac. 1RM') + '</div><div class="v" id="s-1rm"></div></div>' +
      '<div class="card tile"><div class="k">' + (bw ? 'Obciążenie' : 'Wolumen') + '</div><div class="v" id="s-vol"></div></div>' +
      '<div class="card tile"><div class="k">Rekord</div><div class="v">' + recordText() + '</div></div>' +
      '</div>' +
      '<button class="btn-primary" id="save-entry" data-action="save-entry">' + icon('check', 17, 2.8) + '<span>Zapisz</span></button>');
    updateLog();
  }

  function recordText() {
    if (logCtx.bw) return logCtx.bestReps !== null ? fmtInt(logCtx.bestReps) + '<small>powt.</small>' : '—';
    return logCtx.best !== null ? fmtW(logCtx.best) + '<small>kg</small>' : '—';
  }

  function logWeight() {
    var v = parseNum($('#w-input').value);
    if (!isFinite(v)) return logCtx.bw ? 0 : NaN;
    return v;
  }

  function updateLog() {
    if (!logCtx) return;
    var w = logWeight();
    var valid = logCtx.bw ? w >= 0 : w > 0;
    var score = valid ? (logCtx.bw ? oneRM((bodyWeightNow() || DEFAULT_BODY_WEIGHT) + w, logCtx.reps) : oneRM(w, logCtx.reps)) : 0;
    logCtx.isRecord = valid && logCtx.best !== null && score > logCtx.best + 0.01;
    if (logCtx.bw) {
      var bodyNow = bodyWeightNow();
      $('#s-1rm').innerHTML = fmtInt(logCtx.reps * logCtx.sets) + '<small>powt.</small>';
      $('#s-vol').innerHTML = valid ? (bodyNow ? fmtW(bodyNow + w) + '<small>kg</small>' : (w > 0 ? '+' + fmtW(w) + '<small>kg</small>' : 'ciało')) : '—';
    } else {
      $('#s-1rm').innerHTML = valid ? fmtW(score) + '<small>kg</small>' : '—';
      $('#s-vol').innerHTML = valid ? fmtInt(w * logCtx.reps * logCtx.sets) + '<small>kg</small>' : '—';
    }
    $('.s-1rm').classList.toggle('hl', logCtx.isRecord);
    var btn = $('#save-entry');
    btn.disabled = !valid;
    btn.querySelector('span').textContent = logCtx.isRecord ? 'Zapisz rekord' : 'Zapisz';
  }

  function saveEntry() {
    if (!logCtx) return;
    var w = logWeight();
    if (logCtx.bw ? !(w >= 0) : !(w > 0)) return;
    var ctx = logCtx;
    var date = pickedDate($('#d-input').value);
    state.entries.push({ id: uid(), exerciseId: ctx.ex.id, date: date, weight: w, reps: ctx.reps, sets: ctx.sets });
    commit();
    closeSheet();
    refresh();
    if (!ctx.isRecord) { toast('Zapisano serię'); return; }
    if (ctx.bw) celebrate(fmtInt(ctx.reps), 'powt.', w > 0 ? 'z obciążeniem +' + fmtW(w) + ' kg' : 'masa ciała');
    else celebrate(fmtW(oneRM(w, ctx.reps)), 'kg', 'szacowane 1RM');
  }

  // ----- Add / edit exercise -----

  function groupChips(selected) {
    return allGroups().map(function (g) {
      return '<button class="gchip' + (g.id === selected ? ' on' : '') + '" data-action="pick-group" data-value="' + esc(g.id) + '">' + esc(g.label) + '</button>';
    }).join('') + '<button class="gchip add" data-action="new-group">' + icon('plus', 12, 2.6) + 'Nowa</button>';
  }

  function openExerciseSheet(editId) {
    var ex = editId ? findExercise(editId) : null;
    exCtx = { editId: ex ? ex.id : null, group: ex ? ex.group : 'chest', type: ex ? ex.type : 'weight' };
    var existing = {};
    state.exercises.forEach(function (e) { existing[e.name.toLowerCase()] = true; });
    var sugs = ex ? [] : SUGGESTIONS.filter(function (s) { return !existing[s[0].toLowerCase()]; });
    openSheet('<div class="sheet-head"><div class="eyebrow accent">' + (ex ? 'Edytuj ćwiczenie' : 'Nowe ćwiczenie') + '</div><h2>' + (ex ? esc(ex.name) : 'Co dziś podnosisz?') + '</h2></div>' +
      '<input id="ex-name" class="text-input" type="text" placeholder="Nazwa ćwiczenia" autocomplete="off" maxlength="40" enterkeyhint="done" value="' + (ex ? esc(ex.name) : '') + '">' +
      '<span class="eyebrow label">Rodzaj</span><div class="types">' +
      '<button class="gchip' + (exCtx.type === 'weight' ? ' on' : '') + '" data-action="pick-type" data-value="weight">' + icon('weight', 14, 2) + 'Z ciężarem</button>' +
      '<button class="gchip' + (exCtx.type === 'bodyweight' ? ' on' : '') + '" data-action="pick-type" data-value="bodyweight">' + icon('user', 14, 2) + 'Masa ciała</button>' +
      '</div>' +
      '<span class="eyebrow label">Kategoria</span><div class="groups" id="group-chips">' + groupChips(exCtx.group) + '</div>' +
      '<div id="new-group" class="inline-add" hidden><input id="group-name" class="text-input sm" type="text" placeholder="Nazwa kategorii, np. Łydki" maxlength="24" autocomplete="off">' +
      '<button class="btn-primary sm" data-action="save-group">Dodaj</button></div>' +
      (sugs.length ? '<span class="eyebrow label">Popularne</span><div class="sugs">' + sugs.map(function (s) {
        return '<button class="sug" data-action="suggest" data-name="' + esc(s[0]) + '" data-group="' + s[1] + '" data-type="' + s[2] + '">' +
          esc(s[0]) + (s[2] === 'bodyweight' ? '<small>masa ciała</small>' : '') + '</button>';
      }).join('') + '</div>' : '') +
      '<button class="btn-primary sheet-cta" id="add-save" data-action="add-save"' + (ex ? '' : ' disabled') + '>' +
      icon(ex ? 'check' : 'plus', 16, 2.8) + (ex ? 'Zapisz zmiany' : 'Dodaj ćwiczenie') + '</button>');
  }

  function setChoice(selector, value) {
    Array.prototype.forEach.call(document.querySelectorAll(selector), function (b) {
      b.classList.toggle('on', b.getAttribute('data-value') === value);
    });
  }

  function pickGroup(id) {
    if (!exCtx) return;
    exCtx.group = id;
    setChoice('#group-chips .gchip[data-action="pick-group"]', id);
  }

  function pickType(type) {
    if (!exCtx) return;
    exCtx.type = type;
    setChoice('.types .gchip', type);
  }

  function saveGroup() {
    var input = $('#group-name');
    var label = input.value.trim().slice(0, 24);
    if (!label) { input.focus(); return; }
    var dupe = null;
    allGroups().forEach(function (g) { if (g.label.toLowerCase() === label.toLowerCase()) dupe = g; });
    var id = dupe ? dupe.id : 'c_' + uid();
    if (!dupe) {
      state.groups.push({ id: id, label: label.charAt(0).toUpperCase() + label.slice(1) });
      commit();
    }
    $('#group-chips').innerHTML = groupChips(id);
    pickGroup(id);
    input.value = '';
    $('#new-group').hidden = true;
    toast(dupe ? 'Ta kategoria już istnieje' : 'Dodano kategorię');
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
    if (!exCtx) return;
    var name = $('#ex-name').value.trim().slice(0, 40);
    if (!name) return;
    var editId = exCtx.editId;
    var dupe = state.exercises.some(function (e) { return e.id !== editId && e.name.toLowerCase() === name.toLowerCase(); });
    if (dupe) { toast('To ćwiczenie już jest na liście'); return; }
    if (editId) {
      var ex = findExercise(editId);
      ex.name = name;
      ex.group = exCtx.group;
      ex.type = exCtx.type;
      commit();
      closeSheet();
      refresh();
      toast('Zapisano zmiany');
      return;
    }
    var created = { id: uid(), name: name, group: exCtx.group, type: exCtx.type, createdAt: Date.now() };
    state.exercises.push(created);
    commit();
    closeSheet(true);
    location.hash = '#/e/' + created.id;
  }

  // ----- Profile -----

  function openProfile() {
    var p = state.profile;
    profileCtx = { sex: p.sex };
    openSheet('<div class="sheet-head"><div class="eyebrow accent">Profil</div><h2>O Tobie</h2></div>' +
      '<p class="note">Płeć i wzrost są potrzebne do wzorów na tkankę tłuszczową, FFMI i DOTS. Dane zostają w telefonie.</p>' +
      '<span class="eyebrow label">Płeć</span><div class="types">' +
      '<button class="gchip' + (p.sex === 'm' ? ' on' : '') + '" data-action="pick-sex" data-value="m">Mężczyzna</button>' +
      '<button class="gchip' + (p.sex === 'f' ? ' on' : '') + '" data-action="pick-sex" data-value="f">Kobieta</button></div>' +
      '<span class="eyebrow label">Wzrost</span>' +
      '<label class="field"><input id="p-height" class="text-input" type="text" inputmode="decimal" autocomplete="off" placeholder="np. 180" value="' + (p.height ? inputNum(p.height) : '') + '"><span>cm</span></label>' +
      '<button class="btn-primary sheet-cta" data-action="save-profile">' + icon('check', 17, 2.8) + 'Zapisz profil</button>');
  }

  function saveProfile() {
    if (!profileCtx) return;
    var raw = $('#p-height').value;
    var h = parseNum(raw);
    if (String(raw).trim() && !(h >= 120 && h <= 230)) { toast('Wpisz wzrost w cm, np. 180'); return; }
    state.profile = { sex: profileCtx.sex, height: isFinite(h) ? Math.round(h * 10) / 10 : null };
    commit();
    closeSheet();
    refresh();
    toast('Zapisano profil');
  }

  // ----- Measurements -----

  function openMeasure() {
    var today = isoDay(Date.now());
    var fields = ['weight', 'bodyFat', 'waist', 'neck', 'hips', 'shoulders'].map(function (f) {
      var meta = BODY_META[f], last = latestBody(f);
      return '<label class="field mfield"><span class="eyebrow">' + meta.label + '</span>' +
        '<span class="field-row"><input id="m-' + f + '" class="text-input" type="text" inputmode="decimal" autocomplete="off" placeholder="' +
        (last ? inputNum(last.value) : (f === 'bodyFat' ? 'opcjonalnie' : '—')) + '"><span>' + meta.unit + '</span></span></label>';
    }).join('');
    openSheet('<div class="sheet-head"><div class="eyebrow accent">Nowy pomiar</div><h2>Ciało</h2></div>' +
      '<p class="note">Wpisz tylko to, co mierzysz dziś. Szare liczby to ostatnie wartości. Mierz rano, na czczo, centymetrem krawieckim.</p>' +
      '<div class="card row-card"><span class="lbl">Data</span><input id="m-date" class="date-input" type="date" value="' + today + '" max="' + today + '"></div>' +
      '<div class="mgrid">' + fields + '</div>' +
      '<p class="note small">Talia — na wysokości pępka · szyja — tuż pod krtanią · biodra — w najszerszym miejscu pośladków · barki — obwód w najszerszym miejscu, ramiona luźno.</p>' +
      '<button class="btn-primary sheet-cta" data-action="save-measure">' + icon('check', 17, 2.8) + 'Zapisz pomiar</button>');
  }

  function saveMeasure() {
    var values = {}, count = 0, bad = null;
    BODY_FIELDS.forEach(function (f) {
      var raw = $('#m-' + f).value;
      if (!String(raw).trim()) return;
      var v = parseNum(raw), meta = BODY_META[f];
      if (!(v >= meta.min && v <= meta.max)) { bad = bad || meta; return; }
      values[f] = Math.round(v * 10) / 10;
      count++;
    });
    if (bad) { toast(bad.label + ': wpisz wartość w ' + bad.unit); return; }
    if (!count) { toast('Wpisz co najmniej jedną wartość'); return; }
    var date = pickedDate($('#m-date').value);
    var day = startOfDay(date);
    var existing = null;
    state.body.forEach(function (b) { if (startOfDay(b.date) === day) existing = b; });
    if (existing) Object.keys(values).forEach(function (f) { existing[f] = values[f]; });
    else state.body.push(merge({ id: uid(), date: date }, values));
    commit();
    closeSheet();
    refresh();
    toast(existing ? 'Zaktualizowano pomiar z tego dnia' : 'Zapisano pomiar');
  }

  function merge(target, src) { Object.keys(src).forEach(function (k) { target[k] = src[k]; }); return target; }

  // ----- Settings -----

  function openSettings(showRestore) {
    var n = state.exercises.length, m = state.entries.length;
    var custom = state.groups.length
      ? '<div class="custom-groups">' + state.groups.map(function (g) {
        return '<span class="cg">' + esc(g.label) + '<button data-action="delete-group" data-id="' + esc(g.id) + '" aria-label="Usuń kategorię ' + esc(g.label) + '">' + icon('close', 12, 2.6) + '</button></span>';
      }).join('') + '</div>'
      : '<p class="note small">Własne kategorie dodasz przy tworzeniu lub edycji ćwiczenia (przycisk „Nowa”).</p>';
    openSheet('<div class="sheet-head"><div class="eyebrow accent">Ustawienia</div><h2>Kinetic</h2></div>' +
      '<span class="eyebrow label">Cel tygodniowy · dni treningowe</span><div class="goal-row">' +
      [2, 3, 4, 5, 6, 7].map(function (g) {
        return '<button class="gchip' + (g === state.goal ? ' on' : '') + '" data-action="goal" data-value="' + g + '">' + g + '</button>';
      }).join('') + '</div>' +
      '<span class="eyebrow label">Profil</span>' +
      '<div class="stack"><button class="btn-ghost" data-action="go-body">' + icon('user', 16, 2) + 'Sylwetka, waga i pomiary</button></div>' +
      '<span class="eyebrow label">Własne kategorie</span>' + custom +
      '<span class="eyebrow label">Kopia zapasowa</span>' +
      '<p class="note">Dane są zapisane tylko na tym urządzeniu (' + n + ' ' + plural(n, 'ćwiczenie', 'ćwiczenia', 'ćwiczeń') + ', ' + m + ' ' +
      plural(m, 'wpis', 'wpisy', 'wpisów') + ', ' + state.body.length + ' ' + plural(state.body.length, 'pomiar', 'pomiary', 'pomiarów') +
      '). Kod kopii przenosi je na inny telefon lub przeglądarkę i pozwala je odzyskać po wyczyszczeniu danych. Zachowaj go np. w Notatkach.</p>' +
      '<div class="stack">' +
      '<button class="btn-ghost" data-action="copy-code">' + icon('copy', 16, 2) + 'Kopiuj kod kopii</button>' +
      '<textarea id="code-out" class="code" readonly hidden aria-label="Kod kopii"></textarea>' +
      '<button class="btn-ghost" data-action="export-file">' + icon('share', 16, 2) + (bridge ? 'Udostępnij kopię' : 'Zapisz kopię jako plik') + '</button>' +
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
      '<p class="fine">Kinetic · wersja web 1.1</p>');
  }

  function celebrate(value, unit, caption) {
    var el = document.createElement('div');
    el.className = 'celebrate';
    var rays = '';
    for (var i = 0; i < 12; i++) rays += '<i class="cel-ray" style="transform:rotate(' + (i * 30) + 'deg)"><b></b></i>';
    el.innerHTML = '<div class="cel-glow"></div>' + rays + '<div class="cel-body">' + icon('trophy', 56, 1.8) +
      '<div class="cel-k">Nowy rekord</div><div class="cel-v">' + value + '<small>' + unit + '</small></div><div class="cel-s">' + caption + '</div></div>';
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

  function parseRoute() {
    var hash = location.hash || '';
    if (/^#\/body/.test(hash)) return { key: 'body' };
    var match = hash.match(/^#\/e\/([A-Za-z0-9_-]+)/);
    if (match) return { key: 'e:' + match[1], id: match[1] };
    return { key: 'home' };
  }

  function route() {
    var r = parseRoute();
    var prev = ui.route;
    var enter = r.key !== prev;
    if (enter) {
      if (prev === 'home') ui.homeScroll = window.pageYOffset || 0;
      ui.fromHome = prev === 'home' && r.key !== 'home';
      ui.historyLimit = 12;
      ui.bodyLimit = 8;
      closeSheet(true);
    }
    ui.route = r.key;
    if (r.key === 'body') {
      renderBody(enter);
      if (enter) window.scrollTo(0, 0);
    } else if (r.id) {
      renderDetail(r.id, enter);
      if (enter) window.scrollTo(0, 0);
    } else {
      renderHome(enter);
      if (enter) window.scrollTo(0, ui.homeScroll || 0);
    }
  }

  function refresh() {
    if (ui.route === 'home') renderHome(false);
    else if (ui.route === 'body') renderBody(false);
    else if (ui.route) renderDetail(ui.route.slice(2), false);
  }

  /** Show the overview with its entrance animation, e.g. after loading or restoring data. */
  function goHome() {
    if (ui.route === 'home') { renderHome(true); window.scrollTo(0, 0); }
    else location.hash = '#/';
  }

  function goBack() {
    if (ui.fromHome && window.history.length > 1) window.history.back();
    else location.hash = '#/';
  }

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------

  document.addEventListener('click', function (ev) {
    var t = ev.target.closest ? ev.target.closest('[data-action]') : null;
    if (!t) return;
    var action = t.getAttribute('data-action');
    var target;

    switch (action) {
      case 'settings': openSettings(false); break;
      case 'settings-restore': openSettings(true); break;
      case 'add-exercise': openExerciseSheet(null); break;
      case 'edit-exercise': openExerciseSheet(t.getAttribute('data-id')); break;
      case 'close-sheet': closeSheet(); break;
      case 'log': openLog(t.getAttribute('data-id')); break;
      case 'save-entry': saveEntry(); break;
      case 'pick-group': pickGroup(t.getAttribute('data-value')); break;
      case 'pick-type': pickType(t.getAttribute('data-value')); break;
      case 'add-save': addSave(); break;
      case 'back': goBack(); break;
      case 'profile': openProfile(); break;
      case 'save-profile': saveProfile(); break;
      case 'measure': openMeasure(); break;
      case 'save-measure': saveMeasure(); break;
      case 'save-group': saveGroup(); break;

      case 'go-body':
        closeSheet(true);
        location.hash = '#/body';
        break;

      case 'new-group': {
        var box = $('#new-group');
        box.hidden = !box.hidden;
        if (!box.hidden) $('#group-name').focus();
        break;
      }

      case 'pick-sex':
        if (!profileCtx) break;
        profileCtx.sex = t.getAttribute('data-value');
        setChoice('.types .gchip', profileCtx.sex);
        break;

      case 'delete-group': {
        var gid = t.getAttribute('data-id');
        var used = state.exercises.filter(function (e) { return e.group === gid; }).length;
        if (used && !window.confirm('Ćwiczenia z tej kategorii (' + used + ') trafią do „Inne”. Usunąć kategorię?')) break;
        state.groups = state.groups.filter(function (g) { return g.id !== gid; });
        state.exercises.forEach(function (e) { if (e.group === gid) e.group = 'other'; });
        commit();
        var chip = t.closest('.cg');
        if (chip) chip.parentNode.removeChild(chip);
        refresh();
        break;
      }

      case 'tip-close': {
        try { localStorage.setItem(TIP_KEY, '1'); } catch (err) { /* ignore */ }
        target = t.closest('.tip');
        if (target) target.parentNode.removeChild(target);
        break;
      }

      case 'day': {
        var prevSel = app.querySelector('.c.sel');
        var info = $('#heat-info');
        if (prevSel) prevSel.classList.remove('sel');
        if (prevSel === t) { info.innerHTML = 'Dotknij dzień'; break; }
        t.classList.add('sel');
        var sets = Number(t.getAttribute('data-s')), vol = Number(t.getAttribute('data-v'));
        info.innerHTML = '<b>' + dfDayMonth.format(new Date(Number(t.getAttribute('data-t')))) + '</b> · ' +
          (sets > 0 ? sets + ' ' + plural(sets, 'seria', 'serie', 'serii') + (vol > 0 ? ' · ' + fmtInt(vol) + ' kg' : '') : 'odpoczynek');
        break;
      }

      case 'pill': {
        var group = t.getAttribute('data-group'), value = t.getAttribute('data-value');
        if (ui[group] === value) break;
        ui[group] = value;
        Array.prototype.forEach.call(t.parentNode.querySelectorAll('.pill'), function (b) { b.classList.toggle('on', b === t); });
        placeThumbs();
        if (group === 'bodyRange' && bodyCtx) {
          bodyCtx.pts = bodyPoints();
          renderBodyHead(null);
          mountChart($('#b-chart'), bodyCtx.pts, true, bodyChartOpts);
        } else if (detailCtx) {
          detailCtx.pts = currentPoints(detailCtx.ex);
          renderHead(null);
          mountChart($('#d-chart'), detailCtx.pts, true, chartOptsFor(detailCtx.ex));
        }
        break;
      }

      case 'more':
        ui.historyLimit += 20;
        if (detailCtx) renderHistory(detailCtx.ex);
        break;

      case 'more-body':
        ui.bodyLimit += 20;
        renderBodyLog();
        break;

      case 'w-step': {
        if (!logCtx) break;
        var input = $('#w-input');
        var current = parseNum(input.value);
        var next = Math.max(0, Math.round(((isFinite(current) ? current : 0) + parseFloat(t.getAttribute('data-step'))) * 4) / 4);
        input.value = inputNum(next);
        bump(input);
        updateLog();
        break;
      }

      case 'cnt': {
        if (!logCtx) break;
        var key = t.getAttribute('data-key');
        var limit = key === 'reps' ? (logCtx.bw ? 300 : 100) : 20;
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
        pickType(t.getAttribute('data-type'));
        updateAdd();
        break;

      case 'delete-exercise': {
        var ex = findExercise(t.getAttribute('data-id'));
        if (!ex || !window.confirm('Usunąć „' + ex.name + '” i całą jego historię?')) break;
        state.exercises = state.exercises.filter(function (e) { return e.id !== ex.id; });
        state.entries = state.entries.filter(function (e) { return e.exerciseId !== ex.id; });
        commit();
        location.replace('#/');
        break;
      }

      case 'delete-entry': {
        if (!window.confirm('Usunąć ten wpis?')) break;
        var entryId = t.getAttribute('data-id');
        state.entries = state.entries.filter(function (e) { return e.id !== entryId; });
        commit();
        refresh();
        toast('Usunięto wpis');
        break;
      }

      case 'delete-body': {
        if (!window.confirm('Usunąć ten pomiar?')) break;
        var bodyId = t.getAttribute('data-id');
        state.body = state.body.filter(function (b) { return b.id !== bodyId; });
        commit();
        refresh();
        toast('Usunięto pomiar');
        break;
      }

      case 'goal': {
        state.goal = clampGoal(t.getAttribute('data-value'));
        commit();
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
        var restoreBox = $('#restore');
        restoreBox.hidden = !restoreBox.hidden;
        break;
      }

      case 'restore-code': restoreFrom($('#code-input').value); break;
      case 'pick-file': $('#file-input').click(); break;

      case 'demo':
        if ((state.exercises.length || state.body.length) && !window.confirm('Zastąpić obecne dane przykładowymi?')) break;
        state = normalize(makeDemo());
        commit();
        closeSheet();
        goHome();
        break;

      case 'reset':
        if (!window.confirm('Usunąć wszystkie ćwiczenia, historię i pomiary? Tej operacji nie można cofnąć.')) break;
        state = emptyState(state.goal);
        commit();
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
    if (ev.key === 'Enter' && ev.target.id === 'group-name') { ev.preventDefault(); saveGroup(); }
    if (ev.key === 'Escape') closeSheet();
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var el = $('#d-chart'), bel = $('#b-chart');
      if (detailCtx && el && el.clientWidth !== chartWidth) mountChart(el, detailCtx.pts, false, chartOptsFor(detailCtx.ex));
      if (bodyCtx && bel && bel.clientWidth !== chartWidth) mountChart(bel, bodyCtx.pts, false, bodyChartOpts);
      placeThumbs();
    }, 150);
  });

  window.addEventListener('hashchange', route);

  /**
   * Called by the Android app on the system Back gesture.
   * Returns true when the page handled it (closed a sheet or left a sub-screen).
   */
  window.kineticHandleBack = function () {
    var root = $('#sheet-root');
    if (root.firstChild && root.classList.contains('open')) { closeSheet(); return true; }
    if (ui.route && ui.route !== 'home') { goBack(); return true; }
    return false;
  };

  // ---------------------------------------------------------------------------
  // Start
  // ---------------------------------------------------------------------------

  load();
  if (navigator.storage && navigator.storage.persist) {
    try { navigator.storage.persist(); } catch (err) { /* not supported */ }
  }
  route();

  // The Android app serves files from the APK itself, so only the website needs offline caching.
  if (!bridge && 'serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();
