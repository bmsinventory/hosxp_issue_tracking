/* ── Rendering & Filters ── */

/* ── Metrics ── */

function updateMetrics() {
  var tot = allIssues.length, open = 0, prog = 0, done = 0;
  for (var i = 0; i < allIssues.length; i++) {
    var s = allIssues[i].status;
    if      (s === 'รอดำเนินการ') open++;
    else if (s === 'กำลังแก้ไข')  prog++;
    else if (s === 'เสร็จแล้ว')   done++;
  }
  var rate = tot ? Math.round(done / tot * 100) : 0;
  document.getElementById('mTotal').textContent = tot  || '—';
  document.getElementById('mOpen').textContent  = open || '—';
  document.getElementById('mProg').textContent  = prog || '—';
  document.getElementById('mDone').textContent  = done || '—';
  document.getElementById('mRate').textContent  = tot  ? rate + '%' : '—';
  document.getElementById('mBar').style.width   = rate + '%';
  document.getElementById('mSub').textContent   = 'จาก ' + hospitals.length + ' โรงพยาบาล';
  var badge = document.getElementById('navBadge');
  if (open > 0) { badge.style.display = ''; badge.textContent = open; }
  else            badge.style.display = 'none';
}

/* ── Issue Cards ── */

function pillClass(s) {
  if (s === 'รอดำเนินการ') return 'pill-open';
  if (s === 'กำลังแก้ไข')  return 'pill-prog';
  if (s === 'เสร็จแล้ว')   return 'pill-done';
  return 'pill-wait';
}

function icClass(s) {
  if (s === 'รอดำเนินการ') return 'ic-open';
  if (s === 'กำลังแก้ไข')  return 'ic-prog';
  if (s === 'เสร็จแล้ว')   return 'ic-done';
  return 'ic-wait';
}

function buildCard(x, showHosp) {
  var pc  = pillClass(x.status), cc = icClass(x.status);
  var raw = x.rawStatus || x.status;
  var h   = '<div class="ic ' + cc + '">';

  h += '<div class="ic-head">';
  if (x.sequence)              h += '<span class="ic-seq">#' + x.sequence + '</span>';
  h += '<span class="pill ' + pc + '">' + raw + '</span>';

  /* Aging badge — only for non-done issues with a date */
  if (x.dateObj && x.status !== 'เสร็จแล้ว') {
    var days = Math.floor((Date.now() - x.dateObj.getTime()) / 86400000);
    if (days >= 1) {
      var ac = days >= 14 ? '#f04060' : days >= 7 ? '#f5a623' : 'var(--tx3)';
      h += '<span class="aging-badge" style="color:' + ac + ';border-color:' + ac + '">'
        + days + 'ว. ค้าง</span>';
    }
  }

  if (x.date && x.date !== '—') h += '<span class="ic-date">' + x.date + '</span>';
  if (x.type && x.type !== 'ไม่ระบุ') h += '<span class="pill pill-type">' + x.type + '</span>';
  if (x.product)               h += '<span class="prod-badge" style="font-size:9px;padding:1px 6px">' + x.product + '</span>';
  if (showHosp && x.hospital)  h += '<span class="ic-hosp">' + x.hospital + '</span>';
  h += '</div>';

  h += '<div class="ic-body">';
  h += '<span class="ic-bl">ปัญหา</span><span class="ic-bv">' + (x.topic || '—') + '</span>';
  if (x.fixMethod) {
    h += '<div class="ic-divider"></div>';
    h += '<span class="ic-bl">วิธีแก้ไข</span><span class="ic-bv ic-fix">' + x.fixMethod + '</span>';
  }
  h += '</div>';

  var hasMeta = (x.dept && x.dept !== '—') || (x.reporter && x.reporter !== '—') ||
                (x.assignee && x.assignee !== '—') || (x.resolver && x.resolver !== '—') || x.resolvedDate;
  if (hasMeta) {
    h += '<div class="ic-meta">';
    if (x.dept     && x.dept     !== '—') h += '<div class="ic-m"><div class="ic-ml">หน่วยงาน</div><div class="ic-mv">' + x.dept     + '</div></div>';
    if (x.reporter && x.reporter !== '—') h += '<div class="ic-m"><div class="ic-ml">ผู้แจ้ง</div><div class="ic-mv">'   + x.reporter + '</div></div>';
    if (x.assignee && x.assignee !== '—') h += '<div class="ic-m"><div class="ic-ml">ผู้รับ</div><div class="ic-mv">'    + x.assignee + '</div></div>';
    if (x.resolver && x.resolver !== '—') h += '<div class="ic-m"><div class="ic-ml">ผู้แก้ไข</div><div class="ic-mv">' + x.resolver + '</div></div>';
    if (x.resolvedDate) h += '<div class="ic-m"><div class="ic-ml">วันแก้ไข</div><div class="ic-mv ic-date">' + x.resolvedDate + '</div></div>';
    h += '</div>';
  }
  h += '</div>';
  return h;
}

/* ── By Hospital View ── */

function renderByHosp() {
  var el = document.getElementById('byHospCont');
  if (!hospitals.length) { el.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>ดึงข้อมูลก่อน</div>'; return; }
  var hasAny = false;
  for (var i = 0; i < hospitals.length; i++) for (var j = 0; j < hospitals[i].sheets.length; j++) if (hospitals[i].sheets[j].issues.length) { hasAny = true; break; }
  if (!hasAny) { el.innerHTML = '<div class="empty">ยังไม่มีข้อมูล — กด "ดึงข้อมูล" ก่อน</div>'; return; }

  var fsel = document.getElementById('fBHosp');
  if (fsel) {
    var cur = fsel.value;
    var opt = '<option value="">โรงพยาบาลทั้งหมด</option>';
    for (var i = 0; i < hospitals.length; i++) opt += '<option' + (hospitals[i].name === cur ? ' selected' : '') + '>' + hospitals[i].name + '</option>';
    fsel.innerHTML = opt;
  }
  var filterH   = fsel ? fsel.value : '';
  var filteredH = hospitals.filter(function (h) { return !filterH || h.name === filterH; });
  var sumEl     = document.getElementById('bhSummary');
  if (sumEl) sumEl.textContent = filteredH.length + ' โรงพยาบาล';

  var html = '';
  for (var i = 0; i < filteredH.length; i++) {
    var h      = filteredH[i];
    var allIss = [];
    for (var j = 0; j < h.sheets.length; j++) allIss = allIss.concat(h.sheets[j].issues);
    if (!allIss.length) continue;

    var totOpen = 0, totProg = 0, totWait = 0, totDone = 0;
    for (var k = 0; k < allIss.length; k++) {
      var s = allIss[k].status;
      if      (s === 'รอดำเนินการ') totOpen++;
      else if (s === 'กำลังแก้ไข')  totProg++;
      else if (s === 'รอตอบกลับ')   totWait++;
      else if (s === 'เสร็จแล้ว')   totDone++;
    }
    var rate = Math.round(totDone / allIss.length * 100);
    var rc   = rate >= 70 ? 'var(--gr)' : rate >= 40 ? 'var(--am)' : 'var(--rd)';
    var _hn  = h.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    html += '<div class="hov-card">';
    html += '<div class="hov-hdr hov-clickable" onclick="showHospProdPopup(\'' + _hn + '\',null)" title="ดูรายการทั้งหมด — ' + escHtml(h.name) + '">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="color:var(--tx3);flex-shrink:0"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>';
    html += '<h3>' + escHtml(h.name) + '</h3>';
    html += '<span style="font-size:11px;font-family:var(--mono);color:var(--tx3)">' + allIss.length + ' รายการ &bull; ' + h.sheets.filter(function (s) { return s.issues.length > 0; }).length + ' Product</span>';
    if (totOpen) html += '<span class="pill pill-open">รอ ' + totOpen + '</span>';
    if (totProg) html += '<span class="pill pill-prog">แก้ ' + totProg + '</span>';
    if (totWait) html += '<span class="pill pill-wait">รอตอบ ' + totWait + '</span>';
    if (totDone) html += '<span class="pill pill-done">เสร็จ ' + totDone + '</span>';
    html += '<span class="hov-rate" style="color:' + rc + '">' + rate + '%</span>';
    html += '</div>';

    html += '<div class="hov-body">';
    for (var j = 0; j < h.sheets.length; j++) {
      var sh   = h.sheets[j];
      if (!sh.issues.length) continue;
      var pCol = PROD_COLORS[sh.product] || '#8899bb';
      var pOpen = 0, pProg = 0, pWait = 0, pDone = 0;
      for (var k = 0; k < sh.issues.length; k++) {
        var ps = sh.issues[k].status;
        if      (ps === 'รอดำเนินการ') pOpen++;
        else if (ps === 'กำลังแก้ไข')  pProg++;
        else if (ps === 'รอตอบกลับ')   pWait++;
        else if (ps === 'เสร็จแล้ว')   pDone++;
      }
      var pTotal = sh.issues.length;
      var wOpen  = pTotal ? Math.round(pOpen / pTotal * 100) : 0;
      var wProg  = pTotal ? Math.round(pProg / pTotal * 100) : 0;
      var wWait  = pTotal ? Math.round(pWait / pTotal * 100) : 0;
      var wDone  = pTotal ? Math.round(pDone / pTotal * 100) : 0;
      var wSum   = wOpen + wProg + wWait + wDone;
      if (wSum < 100 && pDone) wDone += 100 - wSum;
      else if (wSum < 100 && pOpen) wOpen += 100 - wSum;

      var _pn  = sh.product.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      html += '<div class="hov-prod-row hov-clickable" onclick="showHospProdPopup(\'' + _hn + '\',\'' + _pn + '\')" title="' + escHtml(h.name) + ' — ' + escHtml(sh.product) + '">';
      html += '<div class="hov-prod-name"><span class="hov-prod-dot" style="background:' + pCol + '"></span><span class="hov-prod-label">' + escHtml(sh.product) + '</span><span class="hov-prod-cnt">' + pTotal + '</span></div>';
      html += '<div class="hov-sbar">';
      if (wOpen) html += '<div class="hov-sbar-seg" style="width:' + wOpen + '%;background:var(--rd);opacity:.85" title="รอดำเนินการ ' + pOpen + '"></div>';
      if (wProg) html += '<div class="hov-sbar-seg" style="width:' + wProg + '%;background:var(--am);opacity:.85" title="กำลังแก้ไข ' + pProg + '"></div>';
      if (wWait) html += '<div class="hov-sbar-seg" style="width:' + wWait + '%;background:var(--tl);opacity:.85" title="รอตอบกลับ ' + pWait + '"></div>';
      if (wDone) html += '<div class="hov-sbar-seg" style="width:' + wDone + '%;background:var(--gr);opacity:.85" title="เสร็จแล้ว ' + pDone + '"></div>';
      html += '</div>';
      html += '<div class="hov-stat-pills">';
      if (pOpen) html += '<span style="font-size:10px;font-family:var(--mono);color:var(--rd)">รอ ' + pOpen + '</span>';
      if (pProg) html += '<span style="font-size:10px;font-family:var(--mono);color:var(--am)">แก้ ' + pProg + '</span>';
      if (pWait) html += '<span style="font-size:10px;font-family:var(--mono);color:var(--tl)">รอตอบ ' + pWait + '</span>';
      if (pDone) html += '<span style="font-size:10px;font-family:var(--mono);color:var(--gr)">เสร็จ ' + pDone + '</span>';
      html += '</div></div>';
    }

    /* ─ Dept breakdown ─ */
    var deptMap = {};
    for (var k = 0; k < allIss.length; k++) {
      var d = allIss[k].dept;
      if (d && d !== '—') deptMap[d] = (deptMap[d] || 0) + 1;
    }
    var depts = [];
    for (var depKey in deptMap) depts.push([depKey, deptMap[depKey]]);
    depts.sort(function (a, b) { return b[1] - a[1]; });
    if (depts.length) {
      var maxDept = depts[0][1];
      html += '<div class="hov-dept-section">';
      html += '<div class="hov-dept-header">หน่วยงานที่แจ้งปัญหา (' + depts.length + ')</div>';
      html += '<div class="hov-dept-grid">';
      for (var di = 0; di < depts.length; di++) {
        var barW = Math.max(4, Math.round(depts[di][1] / maxDept * 100));
        html += '<div class="hov-dept-item">';
        html += '<span class="hov-dept-name" title="' + escHtml(depts[di][0]) + '">' + escHtml(depts[di][0]) + '</span>';
        html += '<div class="hov-dept-bar-wrap"><div class="hov-dept-bar-fill" style="width:' + barW + '%"></div></div>';
        html += '<span class="hov-dept-num">' + depts[di][1] + '</span>';
        html += '</div>';
      }
      html += '</div></div>';
    }

    /* ─ Issue type breakdown (Top 5) ─ */
    var typeMap = {};
    for (var k = 0; k < allIss.length; k++) {
      var t = allIss[k].type;
      if (t && t !== 'ไม่ระบุ') typeMap[t] = (typeMap[t] || 0) + 1;
    }
    var types = [];
    for (var tKey in typeMap) types.push([tKey, typeMap[tKey]]);
    types.sort(function (a, b) { return b[1] - a[1]; });
    types = types.slice(0, 5);
    if (types.length) {
      var maxType = types[0][1];
      html += '<div class="hov-dept-section">';
      html += '<div class="hov-dept-header">กลุ่มปัญหาสูงสุด</div>';
      html += '<div class="hov-dept-grid">';
      for (var ti = 0; ti < types.length; ti++) {
        var tBarW = Math.max(4, Math.round(types[ti][1] / maxType * 100));
        html += '<div class="hov-dept-item">';
        html += '<span class="hov-dept-name" title="' + escHtml(types[ti][0]) + '">' + escHtml(types[ti][0]) + '</span>';
        html += '<div class="hov-dept-bar-wrap"><div class="hov-dept-bar-fill" style="width:' + tBarW + '%;background:var(--ac)"></div></div>';
        html += '<span class="hov-dept-num">' + types[ti][1] + '</span>';
        html += '</div>';
      }
      html += '</div></div>';
    }

    html += '</div></div>';
  }
  el.innerHTML = html || '<div class="empty">ยังไม่มีข้อมูล</div>';
}

/* ── Hospital × Product Popup ── */

function showHospProdPopup(hospName, product) {
  var issues = [];
  for (var i = 0; i < hospitals.length; i++) {
    if (hospitals[i].name !== hospName) continue;
    for (var j = 0; j < hospitals[i].sheets.length; j++) {
      if (!product || hospitals[i].sheets[j].product === product) {
        issues = issues.concat(hospitals[i].sheets[j].issues);
      }
    }
  }
  var title = (product ? hospName + ' — ' + product : hospName) + ' (' + issues.length + ' รายการ)';
  showChartPopup(title, buildIssueListPopup(issues));
}

/* ── Date Input Helper ── */

function parseDateInput(str, endOfDay) {
  if (!str) return null;
  var p = str.split('-');
  if (p.length !== 3) return null;
  return endOfDay
    ? new Date(+p[0], +p[1] - 1, +p[2], 23, 59, 59)
    : new Date(+p[0], +p[1] - 1, +p[2]);
}

/* ── Cascading Filter Definitions ── */

var CASCADE_DEFS = [
  { id: 'fHosp',    field: 'hospital',  label: 'โรงพยาบาลทั้งหมด' },
  { id: 'fProduct', field: 'product',   label: 'Product ทั้งหมด' },
  { id: 'fDept',    field: 'dept',      label: 'หน่วยงานทั้งหมด' },
  { id: 'fType',    field: 'type',      label: 'กลุ่มปัญหาทั้งหมด' },
  { id: 'fStatus',  field: 'rawStatus', label: 'สถานะทั้งหมด' }
];

function _filterBy(arr, field, val) {
  var out = [];
  for (var i = 0; i < arr.length; i++) if (arr[i][field] === val) out.push(arr[i]);
  return out;
}

function _rebuildSelect(el, src, field, label) {
  var curV = el.value;
  var vals = {};
  for (var i = 0; i < src.length; i++) { var v = src[i][field]; if (v) vals[v] = 1; }
  var arr  = Object.keys(vals).sort();
  var html = '<option value="">' + label + '</option>';
  for (var i = 0; i < arr.length; i++) {
    html += '<option' + (arr[i] === curV ? ' selected' : '') + '>' + arr[i] + '</option>';
  }
  el.innerHTML = html;
  if (curV && !vals[curV]) el.value = '';
}

function _rebuildWeek(src) {
  var wSel = document.getElementById('fWeek');
  if (!wSel) return;
  var curV = wSel.value, wm = {};
  for (var i = 0; i < src.length; i++) if (src[i].weekKey) wm[src[i].weekKey] = 1;
  var wa   = Object.keys(wm).sort();
  var html = '<option value="">สัปดาห์ทั้งหมด</option>';
  for (var i = 0; i < wa.length; i++) {
    html += '<option value="' + wa[i] + '"' + (wa[i] === curV ? ' selected' : '') + '>' + weekLabel(wa[i]) + '</option>';
  }
  wSel.innerHTML = html;
  if (curV && !wm[curV]) wSel.value = '';
}

/* เมื่อ filter ใดเปลี่ยน → rebuild เฉพาะ filter ที่อยู่ถัดลงมาในลำดับ */
function onFilterChange(changedId) {
  var pos = -1;
  for (var i = 0; i < CASCADE_DEFS.length; i++) {
    if (CASCADE_DEFS[i].id === changedId) { pos = i; break; }
  }
  if (pos < 0) { renderAll(); return; }

  /* src = allIssues กรองด้วย filter 0..pos */
  var src = allIssues;
  for (var i = 0; i <= pos; i++) {
    var def = CASCADE_DEFS[i];
    var el  = document.getElementById(def.id);
    var v   = el ? el.value : '';
    if (!v) continue;
    src = _filterBy(src, def.field, v);
  }

  /* rebuild filter pos+1 เป็นต้นไป */
  for (var i = pos + 1; i < CASCADE_DEFS.length; i++) {
    var def = CASCADE_DEFS[i];
    var el  = document.getElementById(def.id);
    if (el) _rebuildSelect(el, src, def.field, def.label);
  }
  _rebuildWeek(src);

  renderAll();
}

function populateFilters() {
  var hs    = document.getElementById('fHosp');
  var hhtml = '<option value="">โรงพยาบาลทั้งหมด</option>';
  for (var i = 0; i < hospitals.length; i++) hhtml += '<option>' + hospitals[i].name + '</option>';
  hs.innerHTML = hhtml;
  for (var i = 1; i < CASCADE_DEFS.length; i++) {
    var def = CASCADE_DEFS[i];
    var el  = document.getElementById(def.id);
    if (el) _rebuildSelect(el, allIssues, def.field, def.label);
  }
  _rebuildWeek(allIssues);
}

function clearAllFilters() {
  var ids = ['fHosp','fProduct','fDept','fType','fStatus','fWeek'];
  for (var i = 0; i < ids.length; i++) {
    var el = document.getElementById(ids[i]);
    if (el) el.value = '';
  }
  var fSearch   = document.getElementById('fSearch');
  var fDateFrom = document.getElementById('fDateFrom');
  var fDateTo   = document.getElementById('fDateTo');
  if (fSearch)   fSearch.value   = '';
  if (fDateFrom) fDateFrom.value = '';
  if (fDateTo)   fDateTo.value   = '';
  for (var i = 1; i < CASCADE_DEFS.length; i++) {
    var def = CASCADE_DEFS[i];
    var el  = document.getElementById(def.id);
    if (el) _rebuildSelect(el, allIssues, def.field, def.label);
  }
  _rebuildWeek(allIssues);
  renderAll();
}

/* ── Shared Filter Logic ── */

function getFilteredIssues() {
  var fh  = document.getElementById('fHosp').value;
  var fp  = document.getElementById('fProduct').value;
  var ft  = document.getElementById('fType').value;
  var fd  = document.getElementById('fDept').value;
  var fs  = document.getElementById('fStatus').value;
  var fw  = document.getElementById('fWeek').value;
  var fsr = document.getElementById('fSearch');
  var fdf = document.getElementById('fDateFrom');
  var fdt = document.getElementById('fDateTo');
  var sq  = fsr ? fsr.value.trim().toLowerCase() : '';
  var df  = parseDateInput(fdf ? fdf.value : '');
  var dt  = parseDateInput(fdt ? fdt.value : '', true);

  var iss = [];
  for (var i = 0; i < allIssues.length; i++) {
    var x = allIssues[i];
    if (fh && x.hospital  !== fh) continue;
    if (fp && x.product   !== fp) continue;
    if (ft && x.type      !== ft) continue;
    if (fd && x.dept      !== fd) continue;
    if (fs && x.rawStatus !== fs) continue;
    if (fw && x.weekKey   !== fw) continue;
    if (sq) {
      var hay = [(x.topic||''),(x.dept||''),(x.type||''),(x.hospital||''),(x.fixMethod||''),(x.reporter||'')].join(' ').toLowerCase();
      if (hay.indexOf(sq) < 0) continue;
    }
    if (df && x.dateObj && x.dateObj < df) continue;
    if (dt && x.dateObj && x.dateObj > dt) continue;
    iss.push(x);
  }
  return iss;
}

/* ── All Issues View ── */

function renderAll() {
  var iss = getFilteredIssues();

  /* Stats strip */
  var sc = document.getElementById('fstatStrip');
  if (sc) {
    var stOpen = 0, stProg = 0, stWait = 0, stDone = 0;
    for (var i = 0; i < iss.length; i++) {
      var s = iss[i].status;
      if      (s === 'รอดำเนินการ') stOpen++;
      else if (s === 'กำลังแก้ไข')  stProg++;
      else if (s === 'รอตอบกลับ')   stWait++;
      else if (s === 'เสร็จแล้ว')   stDone++;
    }
    var rate = iss.length ? Math.round(stDone / iss.length * 100) : 0;
    document.getElementById('fst-total').textContent = iss.length;
    document.getElementById('fst-open').textContent  = stOpen;
    document.getElementById('fst-prog').textContent  = stProg;
    document.getElementById('fst-wait').textContent  = stWait;
    document.getElementById('fst-done').textContent  = stDone;
    document.getElementById('fst-rate').textContent  = rate + '%';
    sc.style.display = allIssues.length ? 'flex' : 'none';
  }

  var el = document.getElementById('allCont');
  if (!iss.length) { el.innerHTML = '<div class="empty">ไม่พบรายการที่ตรงเงื่อนไข</div>'; return; }
  var html = '';
  for (var i = 0; i < iss.length; i++) html += buildCard(iss[i], hospitals.length > 1);
  el.innerHTML = html;
}

/* ── Export CSV ── */

function exportCSV() {
  var iss = getFilteredIssues();
  if (!iss.length) { toast('ไม่มีข้อมูลที่จะดาวน์โหลด', 'error'); return; }

  var headers = ['ลำดับ','โรงพยาบาล','Product','วันที่','หน่วยงาน','ปัญหา','กลุ่มปัญหา','สถานะ','วิธีการแก้ไข','ผู้แจ้งปัญหา','ผู้รับปัญหา','ผู้แก้ไข','วันที่แก้ไข'];
  var rows = [headers];
  for (var i = 0; i < iss.length; i++) {
    var x = iss[i];
    rows.push([
      x.sequence || '', x.hospital || '', x.product || '', x.date || '',
      x.dept || '', x.topic || '', x.type || '', x.rawStatus || x.status || '',
      x.fixMethod || '', x.reporter || '', x.assignee || '', x.resolver || '', x.resolvedDate || ''
    ]);
  }
  var csv = rows.map(function (r) {
    return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\r\n');

  var blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url;
  a.download = 'bms_issues_' + new Date().toISOString().slice(0, 10) + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('ดาวน์โหลด ' + iss.length + ' รายการแล้ว', 'success');
}

/* ── Column Mapping Modal ── */

function openMap() {
  requireAdmin(function () { _openMap(); updateLockBtn(); });
}
function _openMap() {
  var el   = document.getElementById('mapFields');
  var html = '';
  for (var i = 0; i < MAP_FIELDS.length; i++) {
    var f = MAP_FIELDS[i];
    html += '<div class="field"><label>' + f.label + '</label><input id="mc_' + f.key + '" value="' + (colMap[f.key] || '') + '" placeholder="ชื่อคอลัมน์ (คั่นด้วย ,)"></div>';
  }
  el.innerHTML = html;
  document.getElementById('mapDone').value = statusDone;
  document.getElementById('mapProg').value = statusProg;
  document.getElementById('mapWait').value = statusWait;
  renderStatusChips();

  var hdrEl  = document.getElementById('detectedHdrBox');
  var hnames = Object.keys(allDetectedHeaders);
  if (hnames.length) {
    hdrEl.style.display = '';
    var hdrHtml = '';
    for (var hi = 0; hi < hnames.length; hi++) {
      var hn = hnames[hi];
      hdrHtml += '<div style="margin-bottom:6px">'
        + '<span style="font-size:10px;color:var(--tl);font-family:var(--mono)">' + hn + '</span>'
        + '<div style="margin-top:3px;font-size:12px;color:var(--ac);word-break:break-all">' + allDetectedHeaders[hn].join('  |  ') + '</div></div>';
    }
    document.getElementById('detectedHdrList').innerHTML = hdrHtml;
  } else if (lastDetectedHeaders.length) {
    hdrEl.style.display = '';
    document.getElementById('detectedHdrList').textContent = lastDetectedHeaders.join('  |  ');
  } else {
    hdrEl.style.display = 'none';
  }
  document.getElementById('mapModal').style.display = 'flex';
}

function closeMap()  { document.getElementById('mapModal').style.display = 'none'; }
function bgClose(e)  { if (e.target.id === 'mapModal') closeMap(); }

function getChipGroup(val) {
  var v = val.toLowerCase();
  if (document.getElementById('mapDone').value.toLowerCase().split(',').some(function (x) { return x.trim() === v; })) return 'done';
  if (document.getElementById('mapProg').value.toLowerCase().split(',').some(function (x) { return x.trim() === v; })) return 'prog';
  if (document.getElementById('mapWait').value.toLowerCase().split(',').some(function (x) { return x.trim() === v; })) return 'wait';
  return 'open';
}

function toggleStatusChip(val) {
  var cur    = getChipGroup(val);
  var next   = { open: 'done', done: 'prog', prog: 'wait', wait: 'open' }[cur];
  var fields = { done: 'mapDone', prog: 'mapProg', wait: 'mapWait' };
  Object.keys(fields).forEach(function (g) {
    var inp = document.getElementById(fields[g]);
    var arr = inp.value.split(',').map(function (x) { return x.trim(); }).filter(function (x) { return x && x.toLowerCase() !== val.toLowerCase(); });
    inp.value = arr.join(',');
  });
  if (next !== 'open') {
    var inp = document.getElementById(fields[next]);
    var arr = inp.value.split(',').map(function (x) { return x.trim(); }).filter(Boolean);
    arr.push(val);
    inp.value = arr.join(',');
  }
  renderStatusChips();
}

function renderStatusChips() {
  var box       = document.getElementById('statusChipBox');
  var container = document.getElementById('statusChips');
  if (!lastDetectedStatuses.length) { box.style.display = 'none'; return; }
  box.style.display = '';
  var colors = { done: 'var(--gr)', prog: 'var(--am)', wait: 'var(--tl)', open: 'var(--tx3)' };
  var html   = '';
  for (var i = 0; i < lastDetectedStatuses.length; i++) {
    var v = lastDetectedStatuses[i], g = getChipGroup(v);
    html += '<span onclick="toggleStatusChip(\'' + v.replace(/'/g, "\\'") + '\')" style="cursor:pointer;display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:9999px;font-size:12px;font-family:var(--mono);border:1px solid ' + colors[g] + ';color:' + colors[g] + ';background:rgba(0,0,0,.2);user-select:none">'
      + '<span style="width:7px;height:7px;border-radius:50%;background:' + colors[g] + ';flex-shrink:0"></span>' + v + '</span>';
  }
  container.innerHTML = html;
}

function autoMap() {
  var hnames = Object.keys(allDetectedHeaders);
  if (!hnames.length && !lastDetectedHeaders.length) { toast('โหลดข้อมูลจากชีตก่อน', 'error'); return; }
  var allSets = hnames.length ? hnames.map(function (k) { return allDetectedHeaders[k]; }) : [lastDetectedHeaders];
  var mapped  = 0;
  for (var i = 0; i < MAP_FIELDS.length; i++) {
    var f   = MAP_FIELDS[i];
    var inp = document.getElementById('mc_' + f.key);
    if (!inp) continue;
    var label     = f.label.replace(/\s*\*/, '').trim().toLowerCase();
    var foundVals = [];
    for (var s = 0; s < allSets.length; s++) {
      var raw = allSets[s];
      var low = raw.map(function (h) { return h.toLowerCase(); });
      var idx = -1;
      for (var j = 0; j < low.length; j++) if (low[j] === label)                                 { idx = j; break; }
      if (idx < 0) idx = findCol(low, colMap[f.key]);
      if (idx < 0) for (var j = 0; j < low.length; j++) if (label.length >= 3 && low[j].indexOf(label) >= 0) { idx = j; break; }
      if (idx < 0) for (var j = 0; j < low.length; j++) if (low[j].length >= 3 && label.indexOf(low[j]) >= 0) { idx = j; break; }
      if (idx >= 0) { var val = raw[idx]; if (foundVals.indexOf(val) < 0) foundVals.push(val); }
    }
    if (foundVals.length) { inp.value = foundVals.join(','); mapped++; }
  }
  toast('จับคู่ได้ ' + mapped + '/' + MAP_FIELDS.length + ' คอลัมน์ จาก ' + allSets.length + ' Sheet — ตรวจสอบแล้วกด บันทึก', 'success');
}

function saveMap() {
  for (var i = 0; i < MAP_FIELDS.length; i++) colMap[MAP_FIELDS[i].key] = document.getElementById('mc_' + MAP_FIELDS[i].key).value;
  statusDone = document.getElementById('mapDone').value;
  statusProg = document.getElementById('mapProg').value;
  statusWait = document.getElementById('mapWait').value;
  saveState();
  saveColMapToSb();
  closeMap();
  if (allIssues.length) { updateMetrics(); renderCharts(); renderTimeline(); renderByHosp(); renderAll(); }
  toast('บันทึก Column Mapping แล้ว', 'success');
}
