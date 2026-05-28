/* ── Data Fetching & CSV Parsing ── */

function toCSVUrl(url, gid) {
  var m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (!m) return null;
  return 'https://docs.google.com/spreadsheets/d/' + m[1] + '/export?format=csv&gid=' + (gid || 0);
}

function findCol(hdrs, cands) {
  var ca = cands.split(',');
  for (var i = 0; i < ca.length; i++) {
    var c = ca[i].trim().toLowerCase();
    if (!c) continue;
    for (var j = 0; j < hdrs.length; j++) if (hdrs[j] === c) return j;
  }
  return -1;
}

function scoreHeaderRow(rowCells) {
  var hdrs  = rowCells.map(function (h) { return h.trim().toLowerCase(); });
  var score = 0;
  var keys  = Object.keys(colMap);
  for (var i = 0; i < keys.length; i++) {
    var cands = colMap[keys[i]].split(',');
    for (var c = 0; c < cands.length; c++) {
      if (hdrs.indexOf(cands[c].trim().toLowerCase()) >= 0) { score++; break; }
    }
  }
  return score;
}

function findHeaderRow(rows) {
  var best = 0, bestScore = scoreHeaderRow(rows[0] || []);
  for (var r = 1; r < Math.min(rows.length, 6); r++) {
    var s = scoreHeaderRow(rows[r]);
    if (s > bestScore) { bestScore = s; best = r; }
  }
  return best;
}

function getVal(cols, idx, def) {
  if (def === undefined) def = '';
  if (idx < 0 || cols[idx] == null) return def;
  var v = cols[idx].trim();
  return v || def;
}

function parseCSV(text) {
  var rows = [], cols = [], cur = '', inQ = false;
  for (var i = 0; i < text.length; i++) {
    var ch = text[i];
    if (ch === '"') {
      if (inQ && text[i + 1] === '"') { cur += '"'; i++; }
      else { inQ = !inQ; }
    } else if (ch === ',' && !inQ) {
      cols.push(cur); cur = '';
    } else if ((ch === '\r' || ch === '\n') && !inQ) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      cols.push(cur); cur = '';
      var ok = false;
      for (var j = 0; j < cols.length; j++) if (cols[j].trim()) { ok = true; break; }
      if (ok) rows.push(cols);
      cols = [];
    } else {
      cur += ch;
    }
  }
  if (cur || cols.length) {
    cols.push(cur);
    var ok = false;
    for (var j = 0; j < cols.length; j++) if (cols[j].trim()) { ok = true; break; }
    if (ok) rows.push(cols);
  }
  return rows;
}

function normStatus(raw) {
  if (!raw) return 'รอดำเนินการ';
  var v    = raw.toLowerCase();
  var done = statusDone.toLowerCase().split(',');
  for (var i = 0; i < done.length; i++) { var c = done[i].trim(); if (c && v.indexOf(c) >= 0) return 'เสร็จแล้ว'; }
  var prog = statusProg.toLowerCase().split(',');
  for (var i = 0; i < prog.length; i++) { var c = prog[i].trim(); if (c && v.indexOf(c) >= 0) return 'กำลังแก้ไข'; }
  var wait = statusWait.toLowerCase().split(',');
  for (var i = 0; i < wait.length; i++) { var c = wait[i].trim(); if (c && v.indexOf(c) >= 0) return 'รอตอบกลับ'; }
  return 'รอดำเนินการ';
}

function parseDate(raw) {
  if (!raw) return null;
  raw = raw.trim();
  var m = raw.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) { var y = parseInt(m[3]); if (y > 2400) y -= 543; return new Date(y, parseInt(m[2]) - 1, parseInt(m[1])); }
  m = raw.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
  if (m) { var y = parseInt(m[1]); if (y > 2400) y -= 543; return new Date(y, parseInt(m[2]) - 1, parseInt(m[3])); }
  var d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

function weekKey(date) {
  var d = new Date(date.getTime());
  d.setDate(d.getDate() - d.getDay() + 1);
  return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
}

function weekLabel(key) {
  var p = key.split('-');
  return p[2] + '/' + p[1];
}

function parseSheet(text, hname, product) {
  text = text.replace(/^﻿/, '');
  var rows = parseCSV(text);
  if (rows.length < 2) return [];

  var hdrRow          = findHeaderRow(rows);
  lastDetectedHeaders = rows[hdrRow].map(function (h) { return h.trim(); });
  var hdrs            = lastDetectedHeaders.map(function (h) { return h.toLowerCase(); });

  var idx  = {};
  var keys = Object.keys(colMap);
  for (var i = 0; i < keys.length; i++) idx[keys[i]] = findCol(hdrs, colMap[keys[i]]);

  var matched = 0;
  for (var k in idx) if (idx[k] >= 0) matched++;
  if (matched === 0 && hdrs.length > 0) {
    setTimeout(function () {
      toast(hname + ': ไม่พบคอลัมน์ที่ตรงกัน — เปิด Column Mapping เพื่อตรวจสอบ', 'error');
    }, 300);
  }

  var res = [];
  for (var r = hdrRow + 1; r < rows.length; r++) {
    var cols     = rows[r];
    var rawSt    = getVal(cols, idx.status, 'รอดำเนินการ');
    var rawDt    = getVal(cols, idx.date, '');
    var rawTopic = getVal(cols, idx.topic, '');
    if (!rawTopic) continue;
    var dobj = parseDate(rawDt);
    var wk   = dobj ? weekKey(dobj) : null;
    res.push({
      sequence:     getVal(cols, idx.sequence, ''),
      hospital:     hname,
      product:      (product || ''),
      date:         rawDt || '—',
      dateObj:      dobj,
      weekKey:      wk,
      weekLabel:    wk ? weekLabel(wk) : null,
      dept:         getVal(cols, idx.dept, '—'),
      topic:        rawTopic,
      type:         getVal(cols, idx.type, 'ไม่ระบุ'),
      status:       normStatus(rawSt),
      rawStatus:    rawSt || 'รอดำเนินการ',
      fixMethod:    getVal(cols, idx.fixMethod, ''),
      reporter:     getVal(cols, idx.reporter, '—'),
      assignee:     getVal(cols, idx.assignee, '—'),
      resolver:     getVal(cols, idx.resolver, '—'),
      resolvedDate: getVal(cols, idx.resolvedDate, '')
    });
  }
  return res;
}

function fetchSheet(h, sh, cb) {
  sh.status = 'loading';
  renderHospList();
  var key = h.name + '|' + sh.product;
  var csv = toCSVUrl(sh.url, sh.gid);
  if (!csv) {
    sh.status = 'error';
    toast('ลิงก์ไม่ถูกต้อง: ' + h.name + ' ' + sh.product, 'error');
    cb();
    return;
  }
  fetch(csv, { mode: 'cors' })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.text();
    })
    .then(function (text) {
      sh.issues = parseSheet(text, h.name, sh.product);
      sh.status = 'ok';
      sh.lastSyncAt = Date.now();
      allDetectedHeaders[key] = lastDetectedHeaders;
      cb();
    })
    .catch(function () {
      sh.status = 'error';
      toast('โหลด ' + h.name + ' (' + sh.product + ') ไม่สำเร็จ', 'error');
      cb();
    });
}
