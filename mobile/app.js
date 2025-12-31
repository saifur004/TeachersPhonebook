(function () {

  "use strict";



  var STORAGE_OVERRIDE_KEY = "phonebook_override_v1";

  var ADMIN_SESSION_MS = 10 * 60 * 1000;

  var ADMIN_LOCK_KEY = "phonebook_admin_lock_v1";

  var DEFAULT_ADMIN_PASSWORD = "CHANGE_THIS_PASSWORD";

  var PHOTO_FIELD = "Photo";

  var GROUP_FIELD = "__group";



  var adminSession = { loggedIn: false, expiresAt: 0 };



  var rawMeta = window.PHONEBOOK_META && typeof window.PHONEBOOK_META === "object" ? window.PHONEBOOK_META : null;

  var normalized = normalizeIncomingData(window.PHONEBOOK_DATA, rawMeta);

  var baseData = normalized.rows;

  var groups = normalized.groups;

  var meta = normalized.meta;

  var data = baseData;

  var activeUpdatedAt = meta && meta.generatedAt ? meta.generatedAt : null;



  var elSearch = document.getElementById("searchInput");

  var elSubject = document.getElementById("subjectFilter");

  var elGroup = document.getElementById("groupFilter");

  var elDesignation = document.getElementById("designationFilter");

  var elClear = document.getElementById("clearBtn");

  var elList = document.getElementById("list");

  var elCount = document.getElementById("countText");

  var elUpdated = document.getElementById("updatedText");

  var elEmpty = document.getElementById("emptyState");

  var elNoData = document.getElementById("noDataState");



  var elPageHome = document.getElementById("pageHome");

  var elPagePhonebook = document.getElementById("pagePhonebook");

  var elPageAdmin = document.getElementById("pageAdmin");

  var elEnterBtn = document.getElementById("enterBtn");

  var elAdminEnterBtn = document.getElementById("adminEnterBtn");

  var elAdminCornerBtn = document.getElementById("adminCornerBtn");

  var elBackBtn = document.getElementById("backBtn");

  var elHomeCount = document.getElementById("homeCountChip");

  var elHomeUpdated = document.getElementById("homeUpdatedChip");

  var elLogoImg = document.getElementById("logoImg");

  var elTopbarSub = document.getElementById("topbarSub");



  var elModal = document.getElementById("modal");

  var elModalTitle = document.getElementById("modalTitle");

  var elModalSubtitle = document.getElementById("modalSubtitle");

  var elModalBody = document.getElementById("modalBody");

  var elModalCall = document.getElementById("modalCall");

  var elModalEmail = document.getElementById("modalEmail");

  var elModalCopy = document.getElementById("modalCopy");

  var elModalCopyEmail = document.getElementById("modalCopyEmail");

  var elThemeToggle = document.getElementById("themeToggle");



  var elAdminLoggedOut = document.getElementById("adminLoggedOut");

  var elAdminLoggedIn = document.getElementById("adminLoggedIn");

  var elAdminPassword = document.getElementById("adminPassword");

  var elAdminLoginBtn = document.getElementById("adminLoginBtn");

  var elAdminCancelBtn = document.getElementById("adminCancelBtn");

  var elAdminLoginHint = document.getElementById("adminLoginHint");

  var elAdminLogoutBtn = document.getElementById("adminLogoutBtn");

  var elAdminAddBtn = document.getElementById("adminAddBtn");

  var elAdminSaveBtn = document.getElementById("adminSaveBtn");

  var elAdminExportJsBtn = document.getElementById("adminExportJsBtn");

  var elAdminExportJsonBtn = document.getElementById("adminExportJsonBtn");

  var elAdminImportJson = document.getElementById("adminImportJson");

  var elAdminResetBtn = document.getElementById("adminResetBtn");

  var elAdminSearch = document.getElementById("adminSearch");

  var elAdminCount = document.getElementById("adminCount");

  var elAdminList = document.getElementById("adminList");

  var elAdminEmptyForm = document.getElementById("adminEmptyForm");

  var elAdminForm = document.getElementById("adminForm");

  var elAdminFields = document.getElementById("adminFields");

  var elAdminDeleteBtn = document.getElementById("adminDeleteBtn");

  var elAdminUpdateBtn = document.getElementById("adminUpdateBtn");

  var elAdminPhotoPreview = document.getElementById("adminPhotoPreview");

  var elAdminPhotoInput = document.getElementById("adminPhotoInput");

  var elAdminPhotoClear = document.getElementById("adminPhotoClear");



  function normalizeText(value) {

    return String(value || "")

      .trim()

      .toLowerCase();

  }



  function sanitizePhone(value) {

    var text = String(value || "").trim();

    var out = "";

    for (var i = 0; i < text.length; i++) {

      var ch = text[i];

      if ((ch >= "0" && ch <= "9") || (ch === "+" && out.length === 0)) {

        out += ch;

      }

    }

    return out;

  }



  function getAdminPassword() {

    var p = window.PHONEBOOK_ADMIN_PASSWORD;

    return typeof p === "string" ? p.trim() : "";

  }



  function getAdminPasswordSalt() {

    var s = window.PHONEBOOK_ADMIN_PASSWORD_SALT;

    return typeof s === "string" ? s : "";

  }



  function normalizeHashText(hashText) {

    var t = String(hashText || "").trim();

    if (!t) return "";

    if (t.indexOf("sha256:") === 0) t = t.slice(7);

    return t.toLowerCase();

  }



  function getAdminPasswordHash() {

    return normalizeHashText(window.PHONEBOOK_ADMIN_PASSWORD_HASH);

  }



  function shouldHideAdminEntry() {

    return false;

  }



  function computeGroupsFromRows(rows) {

    if (!Array.isArray(rows) || !rows.length) return [];

    var counts = Object.create(null);

    for (var i = 0; i < rows.length; i++) {

      var rec = rows[i];

      if (!rec || typeof rec !== "object") continue;

      var g = rec[GROUP_FIELD];

      if (!g) continue;

      counts[g] = (counts[g] || 0) + 1;

    }

    var out = [];

    for (var key in counts) {

      if (Object.prototype.hasOwnProperty.call(counts, key)) out.push({ id: key, label: key, count: counts[key] });

    }

    out.sort(function (a, b) {

      return a.label.localeCompare(b.label, undefined, { numeric: true, sensitivity: "base" });

    });

    return out;

  }



  function normalizeIncomingData(rawData, rawMeta) {

    var metaOut = rawMeta && typeof rawMeta === "object" ? rawMeta : null;

    var groupsOut = [];



    if (rawData && !Array.isArray(rawData) && typeof rawData === "object") {

      if (!metaOut && rawData.meta && typeof rawData.meta === "object") metaOut = rawData.meta;

      var combined = [];

      for (var key in rawData) {

        if (!Object.prototype.hasOwnProperty.call(rawData, key)) continue;

        if (key === "meta") continue;

        var bucket = rawData[key];

        if (!Array.isArray(bucket)) continue;

        groupsOut.push({ id: key, label: key, count: bucket.length });

        for (var i = 0; i < bucket.length; i++) {

          var rec = deepClone(bucket[i]);

          rec[GROUP_FIELD] = rec[GROUP_FIELD] || key;

          combined.push(rec);

        }

      }

      return { rows: combined, groups: groupsOut, meta: metaOut };

    }



    var rows = Array.isArray(rawData) ? deepClone(rawData) : [];

    return { rows: rows, groups: computeGroupsFromRows(rows), meta: metaOut };

  }



  function isAdminConfigured() {

    var hash = getAdminPasswordHash();

    if (hash) return true;

    var p = getAdminPassword();

    return !!p && p !== DEFAULT_ADMIN_PASSWORD && p.length >= 8;

  }



  function isAdminLoggedIn() {

    if (!adminSession.loggedIn) return false;

    if (adminSession.expiresAt && Date.now() > adminSession.expiresAt) {

      adminSession.loggedIn = false;

      adminSession.expiresAt = 0;

      return false;

    }

    return true;

  }



  function setAdminLoggedIn(value) {

    adminSession.loggedIn = !!value;

    adminSession.expiresAt = value ? Date.now() + ADMIN_SESSION_MS : 0;

  }



  function loadAdminLock() {

    try {

      var raw = localStorage.getItem(ADMIN_LOCK_KEY);

      if (!raw) return { fails: 0, lockedUntil: 0 };

      var obj = JSON.parse(raw);

      if (!obj || typeof obj !== "object") return { fails: 0, lockedUntil: 0 };

      var fails = typeof obj.fails === "number" && isFinite(obj.fails) ? Math.max(0, Math.floor(obj.fails)) : 0;

      var lockedUntil =

        typeof obj.lockedUntil === "number" && isFinite(obj.lockedUntil) ? Math.max(0, Math.floor(obj.lockedUntil)) : 0;

      return { fails: fails, lockedUntil: lockedUntil };

    } catch (e) {

      return { fails: 0, lockedUntil: 0 };

    }

  }



  function saveAdminLock(lock) {

    try {

      localStorage.setItem(ADMIN_LOCK_KEY, JSON.stringify(lock));

    } catch (e) {}

  }



  function clearAdminLock() {

    try {

      localStorage.removeItem(ADMIN_LOCK_KEY);

    } catch (e) {}

  }



  function lockoutDurationMs(fails) {

    if (fails < 5) return 0;

    if (fails < 8) return 30 * 1000;

    if (fails < 11) return 2 * 60 * 1000;

    if (fails < 15) return 10 * 60 * 1000;

    return 60 * 60 * 1000;

  }



  function formatDuration(ms) {

    var s = Math.max(0, Math.round(ms / 1000));

    if (s < 60) return s + "s";

    var m = Math.floor(s / 60);

    var rs = s % 60;

    if (m < 60) return m + "m" + (rs ? " " + rs + "s" : "");

    var h = Math.floor(m / 60);

    var rm = m % 60;

    return h + "h" + (rm ? " " + rm + "m" : "");

  }



  function bufferToHex(buffer) {

    var bytes = new Uint8Array(buffer);

    var hex = "";

    for (var i = 0; i < bytes.length; i++) {

      hex += ("0" + bytes[i].toString(16)).slice(-2);

    }

    return hex;

  }



  function utf8ToBytes(text) {

    var str = String(text || "");

    if (typeof TextEncoder !== "undefined") {

      try {

        return Array.prototype.slice.call(new TextEncoder().encode(str));

      } catch (e) {}

    }

    var utf8 = unescape(encodeURIComponent(str));

    var out = [];

    for (var i = 0; i < utf8.length; i++) out.push(utf8.charCodeAt(i));

    return out;

  }



  function rotr(x, n) {

    return (x >>> n) | (x << (32 - n));

  }



  function sha256HexSync(text) {

    var bytes = utf8ToBytes(text);

    var bitLen = bytes.length * 8;



    bytes.push(0x80);

    while (bytes.length % 64 !== 56) bytes.push(0);



    var hi = Math.floor(bitLen / 0x100000000);

    var lo = bitLen >>> 0;

    bytes.push((hi >>> 24) & 255, (hi >>> 16) & 255, (hi >>> 8) & 255, hi & 255);

    bytes.push((lo >>> 24) & 255, (lo >>> 16) & 255, (lo >>> 8) & 255, lo & 255);



    var h0 = 0x6a09e667;

    var h1 = 0xbb67ae85;

    var h2 = 0x3c6ef372;

    var h3 = 0xa54ff53a;

    var h4 = 0x510e527f;

    var h5 = 0x9b05688c;

    var h6 = 0x1f83d9ab;

    var h7 = 0x5be0cd19;



    var k = [

      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,

      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,

      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,

      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,

      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,

      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,

      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,

      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,

    ];



    var w = new Array(64);



    for (var i = 0; i < bytes.length; i += 64) {

      for (var t = 0; t < 16; t++) {

        var j = i + t * 4;

        w[t] = ((bytes[j] << 24) | (bytes[j + 1] << 16) | (bytes[j + 2] << 8) | bytes[j + 3]) >>> 0;

      }

      for (var tt = 16; tt < 64; tt++) {

        var x = w[tt - 15];

        var y = w[tt - 2];

        var s0 = rotr(x, 7) ^ rotr(x, 18) ^ (x >>> 3);

        var s1 = rotr(y, 17) ^ rotr(y, 19) ^ (y >>> 10);

        w[tt] = (w[tt - 16] + s0 + w[tt - 7] + s1) >>> 0;

      }



      var a = h0;

      var b = h1;

      var c = h2;

      var d = h3;

      var e = h4;

      var f = h5;

      var g = h6;

      var h = h7;



      for (var r = 0; r < 64; r++) {

        var S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);

        var ch = (e & f) ^ (~e & g);

        var temp1 = (h + S1 + ch + k[r] + w[r]) >>> 0;

        var S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);

        var maj = (a & b) ^ (a & c) ^ (b & c);

        var temp2 = (S0 + maj) >>> 0;



        h = g;

        g = f;

        f = e;

        e = (d + temp1) >>> 0;

        d = c;

        c = b;

        b = a;

        a = (temp1 + temp2) >>> 0;

      }



      h0 = (h0 + a) >>> 0;

      h1 = (h1 + b) >>> 0;

      h2 = (h2 + c) >>> 0;

      h3 = (h3 + d) >>> 0;

      h4 = (h4 + e) >>> 0;

      h5 = (h5 + f) >>> 0;

      h6 = (h6 + g) >>> 0;

      h7 = (h7 + h) >>> 0;

    }



    function toHex(n) {

      return ("00000000" + n.toString(16)).slice(-8);

    }



    return (toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7)).toLowerCase();

  }



  function sha256Hex(text) {

    var input = String(text || "");

    try {

      if (window.crypto && window.crypto.subtle && typeof TextEncoder !== "undefined") {

        var data = new TextEncoder().encode(input);

        return window.crypto.subtle.digest("SHA-256", data).then(function (buf) {

          return bufferToHex(buf);

        });

      }

    } catch (e) {}

    return Promise.resolve(sha256HexSync(input));

  }



  function verifyAdminPassword(input) {

    var hash = getAdminPasswordHash();

    if (hash) {

      var salt = getAdminPasswordSalt();

      return sha256Hex(salt + ":" + input).then(

        function (computed) {

          return normalizeHashText(computed) === hash;

        },

        function () {

          return false;

        }

      );

    }

    return Promise.resolve(input === getAdminPassword());

  }



  function loadOverride() {

    try {

      var raw = localStorage.getItem(STORAGE_OVERRIDE_KEY);

      if (!raw) return null;

      var obj = JSON.parse(raw);

      if (!obj || typeof obj !== "object") return null;

      if (!Array.isArray(obj.data)) return null;

      return {

        data: obj.data,

        savedAt: typeof obj.savedAt === "string" ? obj.savedAt : null,

      };

    } catch (e) {

      return null;

    }

  }



  function saveOverride(rows) {

    var payload = { data: rows, savedAt: new Date().toISOString() };

    try {

      localStorage.setItem(STORAGE_OVERRIDE_KEY, JSON.stringify(payload));

      return payload;

    } catch (e) {

      return null;

    }

  }



  function clearOverride() {

    try {

      localStorage.removeItem(STORAGE_OVERRIDE_KEY);

      return true;

    } catch (e) {

      return false;

    }

  }



  var override = loadOverride();

  if (override && Array.isArray(override.data)) {

    data = deepClone(override.data);

    var overrideGroups = computeGroupsFromRows(data);

    if (overrideGroups.length) groups = overrideGroups;

    if (override.savedAt) activeUpdatedAt = override.savedAt;

  }



  function findKey(keys, patterns) {

    var lowered = keys.map(function (k) {

      return [k, normalizeText(k)];

    });

    for (var p = 0; p < patterns.length; p++) {

      var pat = patterns[p];

      for (var i = 0; i < lowered.length; i++) {

        if (lowered[i][1].indexOf(pat) !== -1) {

          return lowered[i][0];

        }

      }

    }

    return null;

  }



  function getKeys() {

    if (!data.length) return [];

    var set = Object.create(null);

    var max = Math.min(data.length, 200);

    for (var i = 0; i < max; i++) {

      var record = data[i];

      if (!record || typeof record !== "object") continue;

      for (var k in record) {

        if (Object.prototype.hasOwnProperty.call(record, k)) set[k] = true;

      }

    }

    if (set[PHOTO_FIELD]) set[PHOTO_FIELD] = true;

    var keys = [];

    for (var kk in set) keys.push(kk);

    keys.sort(function (a, b) {

      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

    });

    return keys;

  }



  var keys = getKeys();

  var idKey = findKey(keys, ["id", "আইডি", "পিডিএস"]);

  var nameKey =

    findKey(keys, ["name", "নাম"]) ||

    findKey(keys, ["teacher"]) ||

    (keys.length ? keys[0] : null);

  var phoneKey = findKey(keys, ["phone", "mobile", "tel", "contact", "cell", "ফোন", "মোবাইল", "নম্বর", "নং"]);

  var emailKey = findKey(keys, ["email", "e-mail", "ই-মেইল", "মেইল"]);

  var subjectKey = findKey(keys, ["subject", "department", "dept", "বিষয়", "বিভাগ"]);

  var designationKey = findKey(keys, ["designation", "পদবি"]);

  var postTypeKey = findKey(keys, ["পদের ধরন", "type"]);

  var photoKey = findKey(keys, ["photo", "image", "picture", "ছবি"]) || (keys.indexOf(PHOTO_FIELD) !== -1 ? PHOTO_FIELD : null);

  var serialKey = findKey(keys, ["serial", "ক্রমিক", "ক্রম"]);

  var bcsBatchKey = findKey(keys, ["বিসিএস", "bcs", "batch", "বিসিএস ব্যাচ"]);



  var SUBJECT_ALIASES = {

    "রসায়ন বিভাগ": "রসায়ন বিভাগ",

    "রসায়ন বিভাগ": "রসায়ন বিভাগ",

    "islamic studies": "Islamic Studies",

    "ইসলামি স্টাডিজ বিভাগ": "ইসলামিক স্টাডিজ বিভাগ",

    "ইসলামিক স্টাডিজ বিভাগ": "ইসলামিক স্টাডিজ বিভাগ",

    "আরবী ও ইসলামী শিক্ষা বিভাগ": "ইসলামিক স্টাডিজ বিভাগ",

    "পদার্থবিজ্ঞান বিভাগ": "পদার্থবিদ্যা বিভাগ",

    "পদার্থবিজ্ঞান": "পদার্থবিদ্যা বিভাগ",

    "পদার্থবিদ্যা বিভাগ": "পদার্থবিদ্যা বিভাগ",

    "পদার্থবিদ্যা": "পদার্থবিদ্যা বিভাগ",

    "উদ্ভিদবিজ্ঞান বিভাগ": "উদ্ভিদ ও প্রাণিবিজ্ঞান বিভাগ",

    "উদ্ভিদ ও প্রাণিবিজ্ঞান বিভাগ": "উদ্ভিদ ও প্রাণিবিজ্ঞান বিভাগ",

    "প্রাণীবিদ্যা বিভাগ": "উদ্ভিদ ও প্রাণিবিজ্ঞান বিভাগ",

    "প্রাণিবিদ্যা বিভাগ": "উদ্ভিদ ও প্রাণিবিজ্ঞান বিভাগ",

    "প্রাণীবিদ্যা": "উদ্ভিদ ও প্রাণিবিজ্ঞান বিভাগ",

    "প্রাণিবিদ্যা": "উদ্ভিদ ও প্রাণিবিজ্ঞান বিভাগ",

  };



  function normalizeSubjectValue(value) {

    var text = String(value || "").trim().replace(/\s+/g, " ");

    var key = text.toLowerCase();

    if (SUBJECT_ALIASES[key]) return SUBJECT_ALIASES[key];

    return text;

  }



  function parseBcsNumber(text) {
    var match = /(\d+)/.exec(String(text || ""));
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
  }

  var derived = data.map(function (record, idx) {

    var parts = [];

    for (var i = 0; i < keys.length; i++) {

      var key = keys[i];

      if (key === PHOTO_FIELD || key === photoKey) continue;

      var value = record && record[key] != null ? String(record[key]) : "";

      if (!value) continue;

      if (value.length > 300 && value.indexOf("data:image") === 0) continue;

      parts.push(value);

    }

    return { record: record, search: normalizeText(parts.join(" ")), originalIndex: idx };

  });

  derived.sort(function (a, b) {
    var officerGroup = "কর্মকর্তা";
    var ga = a.record[GROUP_FIELD];
    var gb = b.record[GROUP_FIELD];

    if (ga === officerGroup && gb === officerGroup) {
      var ba = bcsBatchKey ? parseBcsNumber(a.record[bcsBatchKey]) : Number.MAX_SAFE_INTEGER;
      var bb = bcsBatchKey ? parseBcsNumber(b.record[bcsBatchKey]) : Number.MAX_SAFE_INTEGER;
      if (ba !== bb) return ba - bb;
    }

    return a.originalIndex - b.originalIndex;
  });

  function uniqueSorted(values) {

    var seen = Object.create(null);

    var out = [];

    for (var i = 0; i < values.length; i++) {

      var v = String(values[i] || "").trim();

      if (!v) continue;

      if (seen[v]) continue;

      seen[v] = true;

      out.push(v);

    }

    out.sort(function (a, b) {

      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

    });

    return out;

  }



  function fillSelect(selectEl, values) {

    if (!selectEl) return;

    var current = selectEl.value;

    while (selectEl.options.length > 1) selectEl.remove(1);

    for (var i = 0; i < values.length; i++) {

      var opt = document.createElement("option");

      opt.value = values[i];

      opt.textContent = values[i];

      selectEl.appendChild(opt);

    }

    if (current) selectEl.value = current;

  }



  function initFilters() {

    if (elGroup) {

      if (groups && groups.length) {

        fillSelect(

          elGroup,

          groups.map(function (g) {

            return g.id;

          })

        );

        elGroup.disabled = false;

        elGroup.parentElement.classList.remove("is-disabled");

      } else {

        elGroup.disabled = true;

        elGroup.parentElement.classList.add("is-disabled");

      }

    }



    if (subjectKey) {

      var subjects = uniqueSorted(

        data.map(function (r) {

          return normalizeSubjectValue(r[subjectKey]);

        })

      );

      fillSelect(elSubject, subjects);

    } else {

      elSubject.disabled = true;

      elSubject.parentElement.classList.add("is-disabled");

    }



    if (designationKey) {

      var designations = uniqueSorted(

        data.map(function (r) {

          return r[designationKey] || "";

        })

      );

      fillSelect(elDesignation, designations);

    } else {

      elDesignation.disabled = true;

      elDesignation.parentElement.classList.add("is-disabled");

    }

  }



  function formatUpdatedText() {

    if (!activeUpdatedAt) return "";

    var d = new Date(activeUpdatedAt);

    if (isNaN(d.getTime())) return "";

    return (

      "Updated: " +

      d.toLocaleDateString(undefined, {

        year: "numeric",

        month: "short",

        day: "2-digit",

      })

    );

  }



  function showToast(message) {

    var toast = document.getElementById("toast");

    if (!toast) {

      toast = document.createElement("div");

      toast.id = "toast";

      toast.className = "toast";

      document.body.appendChild(toast);

    }

    toast.textContent = message;

    toast.hidden = false;

    clearTimeout(showToast._t);

    showToast._t = setTimeout(function () {

      toast.hidden = true;

    }, 1700);

  }



  function copyText(text) {

    var value = String(text || "").trim();

    if (!value) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {

      navigator.clipboard

        .writeText(value)

        .then(function () {

          showToast("Copied to clipboard");

        })

        .catch(function () {

          fallbackCopy(value);

        });

      return;

    }

    fallbackCopy(value);

  }



  function fallbackCopy(text) {

    var ta = document.createElement("textarea");

    ta.value = text;

    ta.setAttribute("readonly", "readonly");

    ta.style.position = "fixed";

    ta.style.left = "-9999px";

    document.body.appendChild(ta);

    ta.select();

    try {

      document.execCommand("copy");

      showToast("Copied to clipboard");

    } catch (e) {

      showToast("Copy not supported");

    }

    document.body.removeChild(ta);

  }



  function clearList() {

    while (elList.firstChild) elList.removeChild(elList.firstChild);

  }



  function stopAndPrevent(e) {

    e.preventDefault();

    e.stopPropagation();

  }



  function stopPropagation(e) {

    e.stopPropagation();

  }



  function hasSelectionInElement(el) {

    try {

      if (!el || !window.getSelection) return false;

      var sel = window.getSelection();

      if (!sel || sel.rangeCount === 0) return false;

      if (sel.isCollapsed) return false;

      var range = sel.getRangeAt(0);

      var node = range.commonAncestorContainer;

      if (!node) return false;

      if (node.nodeType === 3) node = node.parentNode;

      return !!(node && el.contains && el.contains(node));

    } catch (e) {

      return false;

    }

  }



  function downloadText(filename, text, mime) {

    var blob = new Blob([text], { type: mime || "text/plain;charset=utf-8" });

    var url = URL.createObjectURL(blob);

    var a = document.createElement("a");

    a.href = url;

    a.download = filename;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    setTimeout(function () {

      URL.revokeObjectURL(url);

    }, 500);

  }



  function deepClone(value) {

    try {

      return JSON.parse(JSON.stringify(value));

    } catch (e) {

      return [];

    }

  }



  function collectKeysFromRows(rows) {

    var set = Object.create(null);

    var max = Math.min(rows.length, 200);

    for (var i = 0; i < max; i++) {

      var record = rows[i];

      if (!record || typeof record !== "object") continue;

      for (var k in record) {

        if (Object.prototype.hasOwnProperty.call(record, k)) set[k] = true;

      }

    }

    if (set[PHOTO_FIELD]) set[PHOTO_FIELD] = true;

    var keys = [];

    for (var kk in set) keys.push(kk);

    keys.sort(function (a, b) {

      return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

    });

    return keys;

  }



  function getPhotoValue(record) {

    if (!record || typeof record !== "object") return "";

    var v = "";

    if (photoKey && record[photoKey]) v = record[photoKey];

    else if (record[PHOTO_FIELD]) v = record[PHOTO_FIELD];

    return String(v || "").trim();

  }



  function getInitials(name) {

    var text = String(name || "").trim();

    if (!text) return "—";

    var parts = text.replace(/\s+/g, " ").split(" ").filter(Boolean);

    var out = "";

    for (var i = 0; i < parts.length && out.length < 2; i++) {

      out += parts[i].slice(0, 1).toUpperCase();

    }

    return out || text.slice(0, 1).toUpperCase();

  }



  function buildAvatarNode(photo, label, extraClass) {

    var avatar = document.createElement("div");

    avatar.className = "avatar" + (extraClass ? " " + extraClass : "");

    if (photo) {

      var img = document.createElement("img");

      img.className = "avatar__img";

      img.alt = "";

      img.loading = "lazy";

      img.src = photo;

      avatar.appendChild(img);

    } else {

      avatar.classList.add("avatar--placeholder");

      avatar.textContent = getInitials(label);

    }

    return avatar;

  }



  function buildPhonebookDataJs(rows, savedAt) {

    var metaObj = meta && typeof meta === "object" ? deepClone(meta) : {};

    if (!metaObj || typeof metaObj !== "object") metaObj = {};



    for (var mk in metaObj) {

      if (Object.prototype.hasOwnProperty.call(metaObj, mk) && mk.indexOf("count_") === 0) delete metaObj[mk];

    }



    metaObj.generatedAt = savedAt;

    metaObj.source = "Admin Panel";

    metaObj.count = rows.length;

    metaObj.count_actual = rows.length;

    metaObj.count_declared = rows.length;



    var grouped = Object.create(null);

    var groupNames = [];

    var groupCounts = Object.create(null);

    var uncategorized = [];

    var hasGroups = false;



    for (var i = 0; i < rows.length; i++) {

      var rec = deepClone(rows[i]);

      var groupName = String(rec[GROUP_FIELD] || "").trim();

      if (groupName) {

        hasGroups = true;

        if (!grouped[groupName]) {

          grouped[groupName] = [];

          groupNames.push(groupName);

        }

        groupCounts[groupName] = (groupCounts[groupName] || 0) + 1;

        delete rec[GROUP_FIELD];

        grouped[groupName].push(rec);

      } else {

        uncategorized.push(rec);

      }

    }



    var payload = rows;

    if (hasGroups) {

      for (var g = 0; g < groupNames.length; g++) {

        var name = groupNames[g];

        metaObj["count_" + name] = groupCounts[name] || 0;

      }

      if (uncategorized.length) {

        grouped.uncategorized = uncategorized;

        metaObj.count_uncategorized = uncategorized.length;

      }

      payload = grouped;

    }



    return (

      "// Phone book data (exported from Admin Panel)\n" +

      "// Replace your mobile/phonebook_data.js with this file.\n" +

      "// Generated: " +

      savedAt +

      "\n\n" +

      "window.PHONEBOOK_DATA = " +

      JSON.stringify(payload, null, 2) +

      ";\n\n" +

      "window.PHONEBOOK_META = " +

      JSON.stringify(metaObj, null, 2) +

      ";\n"

    );

  }



  var adminData = null;

  var adminKeys = null;

  var adminSelectedIndex = null;



  function ensureAdminData() {

    if (!isAdminLoggedIn()) return false;

    if (!adminData) adminData = deepClone(data);

    if (!adminKeys) adminKeys = collectKeysFromRows(adminData);

    if (adminKeys.indexOf(PHOTO_FIELD) === -1) adminKeys.push(PHOTO_FIELD);

    return true;

  }



  function adminDisplayName(record) {

    if (nameKey && record && record[nameKey]) return String(record[nameKey]).trim();

    if (idKey && record && record[idKey]) return String(record[idKey]).trim();

    return "(No name)";

  }



  function adminDisplayPhone(record) {

    if (phoneKey && record && record[phoneKey]) return String(record[phoneKey]).trim();

    return "";

  }



  function setAdminPhotoPreview(photo, label) {

    if (!elAdminPhotoPreview) return;

    while (elAdminPhotoPreview.firstChild) elAdminPhotoPreview.removeChild(elAdminPhotoPreview.firstChild);

    elAdminPhotoPreview.className = "avatar avatar--large";

    if (photo) {

      var img = document.createElement("img");

      img.className = "avatar__img";

      img.alt = "";

      img.src = photo;

      elAdminPhotoPreview.appendChild(img);

    } else {

      elAdminPhotoPreview.classList.add("avatar--placeholder");

      elAdminPhotoPreview.textContent = getInitials(label);

    }

  }



  function clearAdminForm() {

    adminSelectedIndex = null;

    if (elAdminFields) while (elAdminFields.firstChild) elAdminFields.removeChild(elAdminFields.firstChild);

    if (elAdminForm) elAdminForm.hidden = true;

    if (elAdminEmptyForm) elAdminEmptyForm.hidden = false;

    setAdminPhotoPreview("", "");

  }



  function resetAdminWorkingState() {

    adminData = null;

    adminKeys = null;

    adminSelectedIndex = null;

    if (elAdminSearch) elAdminSearch.value = "";

    if (elAdminCount) elAdminCount.textContent = "";

    if (elAdminList) while (elAdminList.firstChild) elAdminList.removeChild(elAdminList.firstChild);

    clearAdminForm();

  }



  function buildAdminField(key, value) {

    var wrap = document.createElement("label");

    wrap.className = "adminField";



    var lbl = document.createElement("span");

    lbl.className = "adminField__label";

    lbl.textContent = key;

    wrap.appendChild(lbl);



    var input = document.createElement("input");

    input.className = "adminField__input";

    input.value = String(value || "");

    input.dataset.key = key;



    if (emailKey && key === emailKey) {

      input.type = "email";

      input.inputMode = "email";

    } else if (phoneKey && key === phoneKey) {

      input.type = "tel";

      input.inputMode = "tel";

    } else {

      input.type = "text";

    }

    wrap.appendChild(input);

    return wrap;

  }



  function selectAdminIndex(index) {

    if (!ensureAdminData()) return;

    if (index < 0 || index >= adminData.length) return;

    adminSelectedIndex = index;



    var record = adminData[index];

    var label = adminDisplayName(record);

    setAdminPhotoPreview(getPhotoValue(record), label);



    if (elAdminFields) {

      while (elAdminFields.firstChild) elAdminFields.removeChild(elAdminFields.firstChild);

      for (var i = 0; i < adminKeys.length; i++) {

        var key = adminKeys[i];

        if (key === PHOTO_FIELD || key === photoKey) continue;

        elAdminFields.appendChild(buildAdminField(key, record[key]));

      }

    }



    if (elAdminForm) elAdminForm.hidden = false;

    if (elAdminEmptyForm) elAdminEmptyForm.hidden = true;

    renderAdminList();

  }



  function renderAdminList() {

    if (!elAdminList || !elAdminSearch || !elAdminCount) return;

    if (!ensureAdminData()) return;



    var query = normalizeText(elAdminSearch.value);

    var items = [];

    for (var i = 0; i < adminData.length; i++) {

      var record = adminData[i];

      var text = adminDisplayName(record) + " " + adminDisplayPhone(record);

      if (query && normalizeText(text).indexOf(query) === -1) continue;

      items.push({ index: i, record: record });

    }



    elAdminCount.textContent = items.length + " / " + adminData.length + " records";

    while (elAdminList.firstChild) elAdminList.removeChild(elAdminList.firstChild);



    for (var j = 0; j < items.length; j++) {

      var item = items[j];

      var row = document.createElement("div");

      row.className = "adminItem";

      row.setAttribute("role", "listitem");

      row.tabIndex = 0;

      row.dataset.index = String(item.index);

      if (adminSelectedIndex === item.index) row.classList.add("adminItem--active");



      row.appendChild(buildAvatarNode(getPhotoValue(item.record), adminDisplayName(item.record), "avatar--sm"));



      var col = document.createElement("div");

      col.className = "adminItem__col";



      var title = document.createElement("div");

      title.className = "adminItem__title";

      title.textContent = adminDisplayName(item.record);



      var sub = document.createElement("div");

      sub.className = "adminItem__sub";

      sub.textContent = adminDisplayPhone(item.record) || "—";



      col.appendChild(title);

      col.appendChild(sub);

      row.appendChild(col);



      var btn = document.createElement("button");

      btn.type = "button";

      btn.className = "button button--secondary adminItem__btn";

      btn.textContent = "Edit";

      btn.addEventListener("click", function (e) {

        stopAndPrevent(e);

        var idx = Number(this.parentElement && this.parentElement.dataset ? this.parentElement.dataset.index : -1);

        if (isNaN(idx) || idx < 0) return;

        selectAdminIndex(idx);

      });

      row.appendChild(btn);



      row.addEventListener("click", function () {

        var idx2 = Number(this.dataset.index);

        if (isNaN(idx2) || idx2 < 0) return;

        selectAdminIndex(idx2);

      });

      row.addEventListener("keydown", function (e) {

        if (e.key === "Enter" || e.key === " ") {

          e.preventDefault();

          var idx3 = Number(this.dataset.index);

          if (isNaN(idx3) || idx3 < 0) return;

          selectAdminIndex(idx3);

        }

      });



      elAdminList.appendChild(row);

    }

  }



  function syncAdminView() {

    if (!elAdminLoggedOut || !elAdminLoggedIn) return;



    var loggedIn = isAdminLoggedIn();

    elAdminLoggedOut.hidden = loggedIn;

    elAdminLoggedIn.hidden = !loggedIn;



    if (!loggedIn) {

      resetAdminWorkingState();

      if (elAdminLoginHint) {

        elAdminLoginHint.textContent = isAdminConfigured()

          ? ""

          : "Set a password in mobile/admin_config.js (PHONEBOOK_ADMIN_PASSWORD_HASH recommended, or PHONEBOOK_ADMIN_PASSWORD 8+ chars).";

      }

      return;

    }



    if (!ensureAdminData()) return;

    renderAdminList();

  }



  function requireAdmin() {

    if (isAdminLoggedIn()) return true;

    showToast("Admin login required");

    syncAdminView();

    return false;

  }



  function readImageAsDataUrl(file, maxSize, quality) {

    return new Promise(function (resolve, reject) {

      if (!file) return reject(new Error("No file"));

      var reader = new FileReader();

      reader.onerror = function () {

        reject(new Error("Could not read file"));

      };

      reader.onload = function () {

        var src = String(reader.result || "");

        var img = new Image();

        img.onerror = function () {

          reject(new Error("Invalid image"));

        };

        img.onload = function () {

          var w = img.naturalWidth || img.width;

          var h = img.naturalHeight || img.height;

          var scale = 1;

          if (maxSize && (w > maxSize || h > maxSize)) scale = Math.min(maxSize / w, maxSize / h);

          var cw = Math.max(1, Math.round(w * scale));

          var ch = Math.max(1, Math.round(h * scale));

          var canvas = document.createElement("canvas");

          canvas.width = cw;

          canvas.height = ch;

          var ctx = canvas.getContext("2d");

          ctx.drawImage(img, 0, 0, cw, ch);

          try {

            resolve(canvas.toDataURL("image/jpeg", quality || 0.82));

          } catch (e) {

            resolve(src);

          }

        };

        img.src = src;

      };

      reader.readAsDataURL(file);

    });

  }



  function wireAdminHandlers() {

    if (elAdminSearch)

      elAdminSearch.addEventListener("input", function () {

        if (!isAdminLoggedIn()) return;

        renderAdminList();

      });



    if (elAdminPassword && elAdminLoginBtn) {

      elAdminPassword.addEventListener("keydown", function (e) {

        if (e.key === "Enter") {

          e.preventDefault();

          elAdminLoginBtn.click();

        }

      });

    }



    if (elAdminLoginBtn) {

      elAdminLoginBtn.addEventListener("click", function () {

        if (!isAdminConfigured()) {

          if (elAdminLoginHint)

            elAdminLoginHint.textContent =

              "Set PHONEBOOK_ADMIN_PASSWORD_HASH (recommended) or PHONEBOOK_ADMIN_PASSWORD (8+ chars) in mobile/admin_config.js.";

          showToast("Admin password is not configured");

          return;

        }



        var lock = loadAdminLock();

        var now = Date.now();

        if (lock.lockedUntil && now < lock.lockedUntil) {

          var remaining = lock.lockedUntil - now;

          if (elAdminLoginHint) elAdminLoginHint.textContent = "Locked. Try again in " + formatDuration(remaining) + ".";

          showToast("Too many attempts. Try later.");

          return;

        }



        var input = elAdminPassword ? String(elAdminPassword.value || "").trim() : "";

        if (!input) {

          if (elAdminLoginHint) elAdminLoginHint.textContent = "Enter your admin password.";

          return;

        }



        elAdminLoginBtn.disabled = true;

        verifyAdminPassword(input).then(

          function (ok) {

            elAdminLoginBtn.disabled = false;

            if (!ok) {

              var fails = (lock && lock.fails ? lock.fails : 0) + 1;

              var dur = lockoutDurationMs(fails);

              var until = dur ? Date.now() + dur : 0;

              saveAdminLock({ fails: fails, lockedUntil: until });

              if (elAdminLoginHint)

                elAdminLoginHint.textContent = dur

                  ? "Wrong password. Locked for " + formatDuration(dur) + "."

                  : "Wrong password.";

              return;

            }

            clearAdminLock();

            if (elAdminPassword) elAdminPassword.value = "";

            if (elAdminLoginHint) elAdminLoginHint.textContent = "";

            setAdminLoggedIn(true);

            showToast("Admin mode enabled");

            syncAdminView();

          },

          function () {

            elAdminLoginBtn.disabled = false;

            showToast("Could not verify password");

          }

        );

      });

    }



    if (elAdminCancelBtn) {

      elAdminCancelBtn.addEventListener("click", function () {

        setRoute("home");

      });

    }



    if (elAdminLogoutBtn) {

      elAdminLogoutBtn.addEventListener("click", function () {

        setAdminLoggedIn(false);

        resetAdminWorkingState();

        if (elAdminPassword) elAdminPassword.value = "";

        if (elAdminLoginHint) elAdminLoginHint.textContent = "";

        showToast("Logged out");

        setRoute("home");

      });

    }



    if (elAdminAddBtn) {

      elAdminAddBtn.addEventListener("click", function () {

        if (!requireAdmin()) return;

        if (!ensureAdminData()) return;

        var record = {};

        for (var i = 0; i < adminKeys.length; i++) record[adminKeys[i]] = "";

        if (idKey && record[idKey] === "") record[idKey] = String(Date.now());

        if (groups && groups.length) record[GROUP_FIELD] = groups[0].id;

        adminData.unshift(record);

        selectAdminIndex(0);

        showToast("New entry added");

      });

    }



    if (elAdminUpdateBtn) {

      elAdminUpdateBtn.addEventListener("click", function (e) {

        stopAndPrevent(e);

        if (!requireAdmin()) return;

        if (adminSelectedIndex == null) return;

        if (!ensureAdminData()) return;

        var record = adminData[adminSelectedIndex];

        if (!record) return;

        if (elAdminFields) {

          var inputs = elAdminFields.querySelectorAll("[data-key]");

          for (var i = 0; i < inputs.length; i++) {

            var input = inputs[i];

            record[input.dataset.key] = String(input.value || "").trim();

          }

        }

        renderAdminList();

        showToast("Updated");

      });

    }



    if (elAdminDeleteBtn) {

      elAdminDeleteBtn.addEventListener("click", function (e) {

        stopAndPrevent(e);

        if (!requireAdmin()) return;

        if (adminSelectedIndex == null) return;

        if (!ensureAdminData()) return;

        var record = adminData[adminSelectedIndex];

        var label = record ? adminDisplayName(record) : "this teacher";

        if (!confirm("Delete " + label + "?")) return;

        adminData.splice(adminSelectedIndex, 1);

        clearAdminForm();

        renderAdminList();

        showToast("Deleted");

      });

    }



    if (elAdminSaveBtn) {

      elAdminSaveBtn.addEventListener("click", function () {

        if (!requireAdmin()) return;

        if (!ensureAdminData()) return;

        var saved = saveOverride(adminData);

        if (!saved) {

          showToast("Could not save (storage blocked)");

          return;

        }

        showToast("Saved. Reloading...");

        setTimeout(function () {

          location.reload();

        }, 600);

      });

    }



    if (elAdminExportJsonBtn) {

      elAdminExportJsonBtn.addEventListener("click", function () {

        if (!requireAdmin()) return;

        if (!ensureAdminData()) return;

        downloadText("phonebook_data.json", JSON.stringify(adminData, null, 2), "application/json;charset=utf-8");

      });

    }



    if (elAdminExportJsBtn) {

      elAdminExportJsBtn.addEventListener("click", function () {

        if (!requireAdmin()) return;

        if (!ensureAdminData()) return;

        downloadText(

          "phonebook_data.js",

          buildPhonebookDataJs(adminData, new Date().toISOString()),

          "text/javascript;charset=utf-8"

        );

      });

    }



    if (elAdminResetBtn) {

      elAdminResetBtn.addEventListener("click", function () {

        if (!requireAdmin()) return;

        if (!confirm("Reset to original data and remove local edits?")) return;

        clearOverride();

        showToast("Reset. Reloading...");

        setTimeout(function () {

          location.reload();

        }, 600);

      });

    }



    if (elAdminImportJson) {

      elAdminImportJson.addEventListener("change", function () {

        if (!requireAdmin()) {

          this.value = "";

          return;

        }

        var file = this.files && this.files[0];

        if (!file) return;

        var reader = new FileReader();

        reader.onerror = function () {

          showToast("Could not read file");

        };

        reader.onload = function () {

          try {

            var parsed = JSON.parse(String(reader.result || ""));

            var normalizedImport = normalizeIncomingData(parsed && parsed.data ? parsed.data : parsed, null);

            var rows = normalizedImport.rows;

            if (!rows) throw new Error("Invalid JSON");

            adminData = deepClone(rows);

            adminKeys = collectKeysFromRows(adminData);

            if (adminKeys.indexOf(PHOTO_FIELD) === -1) adminKeys.push(PHOTO_FIELD);

            clearAdminForm();

            renderAdminList();

            showToast("Imported");

          } catch (e) {

            showToast("Invalid JSON file");

          }

        };

        reader.readAsText(file);

        this.value = "";

      });

    }



    if (elAdminPhotoInput) {

      elAdminPhotoInput.addEventListener("change", function () {

        if (!requireAdmin()) {

          this.value = "";

          return;

        }

        if (adminSelectedIndex == null) return;

        var file = this.files && this.files[0];

        if (!file) return;

        var inputEl = this;

        readImageAsDataUrl(file, 320, 0.82).then(

          function (dataUrl) {

            if (!ensureAdminData()) return;

            var record = adminData[adminSelectedIndex];

            record[PHOTO_FIELD] = dataUrl;

            setAdminPhotoPreview(dataUrl, adminDisplayName(record));

            renderAdminList();

            showToast("Photo updated");

            inputEl.value = "";

          },

          function () {

            showToast("Could not load image");

            inputEl.value = "";

          }

        );

      });

    }



    if (elAdminPhotoClear) {

      elAdminPhotoClear.addEventListener("click", function (e) {

        stopAndPrevent(e);

        if (!requireAdmin()) return;

        if (adminSelectedIndex == null) return;

        if (!ensureAdminData()) return;

        var record = adminData[adminSelectedIndex];

        record[PHOTO_FIELD] = "";

        setAdminPhotoPreview("", adminDisplayName(record));

        renderAdminList();

        showToast("Photo removed");

      });

    }

  }



  function makeIconButton(kind, label) {

    var btn = document.createElement(kind === "a" ? "a" : "button");

    btn.className = "icon-button small-icon";

    if (kind === "button") btn.type = "button";

    btn.setAttribute("aria-label", label);

    btn.title = label;

    return btn;

  }



  function iconSvg(name) {

    var wrap = document.createElement("span");

    if (name === "phone") {

      wrap.innerHTML =

        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M22 16.92v3a2 2 0 0 1-2.18 2A19.9 19.9 0 0 1 3 5.18 2 2 0 0 1 5.11 3h3a2 2 0 0 1 2 1.72c.12.86.3 1.7.54 2.5a2 2 0 0 1-.45 2.11L9.09 10.91a16 16 0 0 0 4 4l1.58-1.1a2 2 0 0 1 2.11-.45c.8.24 1.64.42 2.5.54A2 2 0 0 1 22 16.92Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      return wrap.firstChild;

    }

    if (name === "copy") {

      wrap.innerHTML =

        '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M8 8h12v12H8zM4 16H3a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v1" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

      return wrap.firstChild;

    }

    return document.createTextNode("");

  }



  function renderCard(item) {

    var record = item.record;

    var name = nameKey ? String(record[nameKey] || "").trim() : "";

    var phone = phoneKey ? String(record[phoneKey] || "").trim() : "";

    var phoneHref = sanitizePhone(phone);

    var email = emailKey ? String(record[emailKey] || "").trim() : "";

    var photo = getPhotoValue(record);

    var subject = subjectKey ? String(record[subjectKey] || "").trim() : "";

    var designation = designationKey ? String(record[designationKey] || "").trim() : "";

    var postType = postTypeKey ? String(record[postTypeKey] || "").trim() : "";

    var bcsBatch = bcsBatchKey ? String(record[bcsBatchKey] || "").trim() : "";

    var groupName = record[GROUP_FIELD];



    var card = document.createElement("div");

    card.className = "card";

    card.setAttribute("role", "listitem");

    card.tabIndex = 0;

    card.dataset.index = String(item.index);



    var top = document.createElement("div");

    top.className = "card__top";



    var left = document.createElement("div");

    left.className = "card__left";

    left.appendChild(buildAvatarNode(photo, name || "(No name)", "avatar--sm"));



    var leftText = document.createElement("div");

    leftText.className = "card__text";

    var title = document.createElement("div");

    title.className = "card__name";

    title.textContent = name || "(No name)";

    leftText.appendChild(title);



    var metaLine = [];

    if (subject) metaLine.push(subject);

    var metaText = metaLine.join(" • ");

    if (metaText) {

      var metaEl = document.createElement("div");

      metaEl.className = "card__meta";

      metaEl.textContent = metaText;

      leftText.appendChild(metaEl);

    }



    if (designation) {

      var pill = document.createElement("div");

      pill.className = "pill pill--accent";

      pill.textContent = designation;

      pill.style.marginTop = "10px";

      leftText.appendChild(pill);

    }



    if (groupName === "\u0995\u09b0\u09cd\u09ae\u0995\u09b0\u09cd\u09a4\u09be" && bcsBatch) {
      var badge = document.createElement("div");
      badge.className = "pill";
      badge.textContent = "বিসিএস ব্যাচ: " + bcsBatch;
      badge.title = badge.textContent;
      badge.style.marginTop = designation ? "8px" : "10px";
      leftText.appendChild(badge);
    }


    left.appendChild(leftText);



    var actions = document.createElement("div");

    actions.className = "card__actions";



    var call = makeIconButton("a", phone ? "Call" : "No phone");

    call.appendChild(iconSvg("phone"));

    if (phoneHref) {

      call.href = "tel:" + phoneHref;

      call.addEventListener("click", stopPropagation);

    } else {

      call.href = "#";

      call.setAttribute("aria-disabled", "true");

    }



    var copy = makeIconButton("button", phone ? "Copy phone" : "No phone");

    copy.appendChild(iconSvg("copy"));

    if (phone) {

      copy.addEventListener("click", function (e) {

        stopAndPrevent(e);

        copyText(phone);

      });

    } else {

      copy.disabled = true;

    }



    actions.appendChild(call);

    actions.appendChild(copy);



    top.appendChild(left);

    top.appendChild(actions);

    card.appendChild(top);



    var bottom = document.createElement("div");

    bottom.className = "card__row";



    var phoneEl = document.createElement("div");

    phoneEl.className = "card__phone";

    phoneEl.textContent = phone || "-";

    bottom.appendChild(phoneEl);



    var links = document.createElement("div");

    links.className = "card__links";



    if (email) {

      var emailA = document.createElement("a");

      emailA.className = "link";

      emailA.href = "mailto:" + email;

      emailA.textContent = "Email";

      emailA.title = email;

      emailA.addEventListener("click", stopPropagation);

      links.appendChild(emailA);

    }



    var detailsA = document.createElement("a");

    detailsA.className = "link";

    detailsA.href = "#";

    detailsA.textContent = "Details";

    detailsA.addEventListener("click", function (e) {

      stopAndPrevent(e);

      openModal(record);

    });

    links.appendChild(detailsA);



    bottom.appendChild(links);

    card.appendChild(bottom);



    card.addEventListener("click", function () {

      if (hasSelectionInElement(card)) return;

      openModal(record);

    });

    card.addEventListener("keydown", function (e) {

      if (e.key === "Enter" || e.key === " ") {

        e.preventDefault();

        openModal(record);

      }

    });



    return card;

  }



  function openModal(record) {

    if (!record) return;

    var name = nameKey ? String(record[nameKey] || "").trim() : "Teacher";

    var subject = subjectKey ? String(record[subjectKey] || "").trim() : "";

    var designation = designationKey ? String(record[designationKey] || "").trim() : "";

    var phone = phoneKey ? String(record[phoneKey] || "").trim() : "";

    var phoneHref = sanitizePhone(phone);

    var email = emailKey ? String(record[emailKey] || "").trim() : "";

    var photo = getPhotoValue(record);



    elModalTitle.textContent = name || "Teacher";

    var subtitle = [designation, subject].filter(Boolean).join(" • ");

    elModalSubtitle.textContent = subtitle;



    if (phoneHref) {

      elModalCall.href = "tel:" + phoneHref;

      elModalCall.style.pointerEvents = "auto";

      elModalCall.style.opacity = "1";

    } else {

      elModalCall.href = "#";

      elModalCall.style.pointerEvents = "none";

      elModalCall.style.opacity = "0.55";

    }



    elModalCopy.disabled = !phone;

    elModalCopy.onclick = function () {

      copyText(phone);

    };



    if (elModalEmail) {

      if (email) {

        elModalEmail.href = "mailto:" + email;

        elModalEmail.title = email;

        elModalEmail.style.pointerEvents = "auto";

        elModalEmail.style.opacity = "1";

      } else {

        elModalEmail.href = "#";

        elModalEmail.title = "";

        elModalEmail.style.pointerEvents = "none";

        elModalEmail.style.opacity = "0.55";

      }

    }



    if (elModalCopyEmail) {

      elModalCopyEmail.disabled = !email;

      elModalCopyEmail.onclick = email

        ? function () {

            copyText(email);

          }

        : null;

    }



    while (elModalBody.firstChild) elModalBody.removeChild(elModalBody.firstChild);



    if (photo) {

      var photoWrap = document.createElement("div");

      photoWrap.className = "modalPhoto";

      var img = document.createElement("img");

      img.className = "modalPhoto__img";

      img.alt = "";

      img.loading = "lazy";

      img.src = photo;

      photoWrap.appendChild(img);

      elModalBody.appendChild(photoWrap);

    }



    var kv = document.createElement("div");

    kv.className = "kv";

    var displayKeys = [];

    if (phoneKey) displayKeys.push(phoneKey);

    if (emailKey && emailKey !== phoneKey) displayKeys.push(emailKey);

    for (var i = 0; i < keys.length; i++) {

      var k0 = keys[i];

      if (displayKeys.indexOf(k0) !== -1) continue;

      displayKeys.push(k0);

    }

    for (var j = 0; j < displayKeys.length; j++) {

      var key = displayKeys[j];

      if (key === PHOTO_FIELD || key === photoKey) continue;

      var value = String(record[key] || "").trim();

      if (!value) continue;

      var item = document.createElement("div");

      item.className = "kv__item";

      var kEl = document.createElement("div");

      kEl.className = "kv__key";

      kEl.textContent = key;

      var vEl = document.createElement("div");

      vEl.className = "kv__value";

      vEl.textContent = value;

      item.appendChild(kEl);

      item.appendChild(vEl);

      kv.appendChild(item);

    }

    elModalBody.appendChild(kv);



    elModal.hidden = false;

    document.body.style.overflow = "hidden";

  }



  function closeModal() {

    elModal.hidden = true;

    document.body.style.overflow = "";

  }



  function getRoute() {

    var h = String(location.hash || "").replace("#", "").toLowerCase();

    if (h === "phonebook" || h === "list") return "phonebook";

    if (h === "admin") return "home";

    return "home";

  }



  function setRoute(route, replace) {

    var nextHash = route === "phonebook" ? "#phonebook" : route === "admin" ? "#admin" : "#home";

    if (replace) {

      try {

        history.replaceState(null, "", nextHash);

      } catch (e) {

        location.hash = nextHash;

      }

    } else {

      location.hash = nextHash;

    }

    syncRoute();

  }



  var lastRoute = null;



  function syncRoute() {

    var route = getRoute();

    if (lastRoute === "admin" && route !== "admin") {

      setAdminLoggedIn(false);

      resetAdminWorkingState();

      if (elAdminPassword) elAdminPassword.value = "";

      if (elAdminLoginHint) elAdminLoginHint.textContent = "";

    }

    lastRoute = route;

    var showHome = route === "home";

    var showPhonebook = route === "phonebook";

    var showAdmin = route === "admin";



    if (elPageHome) elPageHome.hidden = !showHome;

    if (elPagePhonebook) elPagePhonebook.hidden = !showPhonebook;

    if (elPageAdmin) elPageAdmin.hidden = !showAdmin;

    if (elBackBtn) elBackBtn.hidden = showHome;



    if (elTopbarSub) {

      elTopbarSub.textContent = showAdmin ? "Admin Panel" : showPhonebook ? "Phone Book" : "Teacher Phone Book";

    }



    if (!showPhonebook) closeModal();



    if (showPhonebook) {

      setTimeout(function () {

        if (elSearch) elSearch.focus();

      }, 0);

      return;

    }



    if (showAdmin) {

      syncAdminView();

      setTimeout(function () {

        if (!isAdminLoggedIn() && elAdminPassword) elAdminPassword.focus();

      }, 0);

    }

  }



  function applyFilters() {

    var q = normalizeText(elSearch.value);

    var subject = elSubject.value;

    var designation = elDesignation.value;

    var group = elGroup ? elGroup.value : "";



    var out = [];

    for (var i = 0; i < derived.length; i++) {

      var item = derived[i];

      var record = item.record;

      if (q && item.search.indexOf(q) === -1) continue;

      if (subjectKey && subject && normalizeSubjectValue(record[subjectKey]) !== subject) continue;

      if (designationKey && designation && String(record[designationKey] || "").trim() !== designation) continue;

      if (group && record[GROUP_FIELD] !== group) continue;

      out.push(record);

    }

    return out;

  }



  function render(records) {

    clearList();

    elEmpty.hidden = true;



    if (!records.length) {

      elEmpty.hidden = false;

      elCount.textContent = "0 entries";

      return;

    }



    for (var i = 0; i < records.length; i++) {

      elList.appendChild(renderCard({ record: records[i], index: i }));

    }

    var label = records.length === 1 ? "entry" : "entries";

    elCount.textContent = records.length + " " + label;

  }



  function onUpdate() {

    if (!data.length) return;

    render(applyFilters());

  }



  function initTheme() {

    var saved = null;

    try {

      saved = localStorage.getItem("phonebook_theme");

    } catch (e) {}

    if (saved === "light" || saved === "dark") {

      document.documentElement.setAttribute("data-theme", saved);

    }

    elThemeToggle.addEventListener("click", function () {

      var current = document.documentElement.getAttribute("data-theme");

      var next = current === "dark" ? "light" : "dark";

      document.documentElement.setAttribute("data-theme", next);

      try {

        localStorage.setItem("phonebook_theme", next);

      } catch (e) {}

    });

  }



  function initModal() {

    elModal.addEventListener("click", function (e) {

      var target = e.target;

      if (!target) return;

      if (target.closest) {

        if (target.closest('[data-close="true"]')) closeModal();

        return;

      }

      var node = target;

      while (node) {

        if (node.getAttribute && node.getAttribute("data-close") === "true") {

          closeModal();

          return;

        }

        node = node.parentElement;

      }

    });

    document.addEventListener("keydown", function (e) {

      if (e.key === "Escape" && !elModal.hidden) closeModal();

    });

  }



  function wireLongPress(el, ms, onTrigger) {

    if (!el) return;

    var timer = null;



    function start() {

      if (timer) clearTimeout(timer);

      timer = setTimeout(function () {

        timer = null;

        onTrigger();

      }, ms || 1200);

    }



    function cancel() {

      if (!timer) return;

      clearTimeout(timer);

      timer = null;

    }



    if (window.PointerEvent) {

      el.addEventListener("pointerdown", start);

      el.addEventListener("pointerup", cancel);

      el.addEventListener("pointercancel", cancel);

      el.addEventListener("pointerleave", cancel);

      return;

    }



    el.addEventListener("mousedown", start);

    el.addEventListener("mouseup", cancel);

    el.addEventListener("mouseleave", cancel);

    el.addEventListener("touchstart", start, { passive: true });

    el.addEventListener("touchend", cancel);

    el.addEventListener("touchcancel", cancel);

  }



  function init() {

    initTheme();

    initModal();

    wireAdminHandlers();



    if (elLogoImg) {

      elLogoImg.addEventListener("error", function () {

        var fallback = elLogoImg.getAttribute("data-fallback");

        if (!fallback) return;

        if (elLogoImg.dataset.fallbackUsed) return;

        elLogoImg.dataset.fallbackUsed = "true";

        elLogoImg.src = fallback;

      });

    }



    var updatedText = formatUpdatedText();

    if (elHomeUpdated) {

      if (updatedText) {

        elHomeUpdated.textContent = updatedText;

        elHomeUpdated.style.display = "";

      } else {

        elHomeUpdated.textContent = "";

        elHomeUpdated.style.display = "none";

      }

    }

    if (elHomeCount) {

      if (groups && groups.length) {

        var parts = groups.map(function (g) {

          return (g.label || g.id || "Group") + ": " + g.count;

        });

        elHomeCount.textContent = parts.join(" • ");

      } else {

        elHomeCount.textContent = "Records: " + data.length;

      }

    }



    if (elEnterBtn) {

      elEnterBtn.addEventListener("click", function () {

        setRoute("phonebook");

      });

    }

    if (elAdminEnterBtn) {

      elAdminEnterBtn.addEventListener("click", function () {

        setRoute("home");

      });

    }



    var hideAdminEntry = shouldHideAdminEntry();

    if (elAdminEnterBtn) elAdminEnterBtn.hidden = true;

    if (elAdminCornerBtn) elAdminCornerBtn.hidden = true;

    if (hideAdminEntry) {

      wireLongPress(elLogoImg, 1400, function () {

        setRoute("admin");

      });

      wireLongPress(document.querySelector(".topbar__title"), 1600, function () {

        setRoute("admin");

      });

    }

    if (elBackBtn) {

      elBackBtn.addEventListener("click", function () {

        setRoute("home");

      });

    }

    window.addEventListener("hashchange", syncRoute);

    if (!location.hash) setRoute("home", true);

    else syncRoute();



    if (!data.length) {

      elNoData.hidden = false;

      elEmpty.hidden = true;

      elCount.textContent = "0 entries";

      if (elEnterBtn) elEnterBtn.disabled = true;

      return;

    }



    elUpdated.textContent = updatedText;

    initFilters();



    elSearch.addEventListener("input", onUpdate);

    elSubject.addEventListener("change", onUpdate);

    if (elGroup) elGroup.addEventListener("change", onUpdate);

    elDesignation.addEventListener("change", onUpdate);

    elClear.addEventListener("click", function () {

      elSearch.value = "";

      elSubject.value = "";

      if (elGroup) elGroup.value = "";

      elDesignation.value = "";

      onUpdate();

    });



    onUpdate();

  }



  init();

})();

