/* ── Charts & Visualizations ── */

function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

function renderCharts() {
  if (!allIssues.length) return;

  /* ── Aggregate by Product ── */
  var prodData = {};
  for (var i = 0; i < allIssues.length; i++) {
    var x = allIssues[i], pn = x.product || 'ไม่ระบุ';
    if (!prodData[pn]) prodData[pn] = { total: 0, open: 0, prog: 0, done: 0, wait: 0, types: {} };
    prodData[pn].total++;
    var st = x.status;
    if      (st === 'รอดำเนินการ') prodData[pn].open++;
    else if (st === 'กำลังแก้ไข')  prodData[pn].prog++;
    else if (st === 'เสร็จแล้ว')   prodData[pn].done++;
    else                           prodData[pn].wait++;
    var tn = x.type || 'ไม่ระบุ';
    prodData[pn].types[tn] = (prodData[pn].types[tn] || 0) + 1;
  }
  var prods = Object.keys(prodData).sort(function (a, b) { return prodData[b].total - prodData[a].total; });

  /* ── KPI Cards ── */
  var chtml = '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(175px,1fr));gap:12px">';
  for (var pi = 0; pi < prods.length; pi++) {
    var pn  = prods[pi], pd = prodData[pn];
    var rate = pd.total ? Math.round(pd.done / pd.total * 100) : 0;
    var col  = getProdColor(pn, pi);
    var rc   = rate >= 60 ? '#22c97a' : rate >= 30 ? '#f5a623' : '#f04060';
    chtml += '<div style="background:var(--bg3);border:1px solid var(--bdr);border-top:3px solid ' + col + ';border-radius:var(--r);padding:16px 18px;position:relative;overflow:hidden">'
      + '<div style="position:absolute;top:0;right:0;width:90px;height:90px;background:' + col + ';opacity:.05;border-radius:0 0 0 90px;pointer-events:none"></div>'
      + '<div style="font-size:11px;font-weight:600;color:' + col + ';margin-bottom:12px;font-family:var(--mono);letter-spacing:.03em">' + pn + '</div>'
      + '<div style="font-size:38px;font-weight:700;color:var(--tx);font-family:var(--mono);line-height:1;margin-bottom:2px">' + pd.total + '</div>'
      + '<div style="font-size:9px;color:var(--tx3);font-family:var(--mono);letter-spacing:.08em;margin-bottom:12px;text-transform:uppercase">รายการทั้งหมด</div>'
      + '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:2px;border-top:1px solid var(--bdr);padding-top:10px;margin-bottom:12px">'
      + '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#f04060;font-family:var(--mono)">' + pd.open + '</div><div style="font-size:9px;color:var(--tx3);font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase">รอ</div></div>'
      + '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#f5a623;font-family:var(--mono)">' + pd.prog + '</div><div style="font-size:9px;color:var(--tx3);font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase">แก้ไข</div></div>'
      + '<div style="text-align:center"><div style="font-size:20px;font-weight:700;color:#22c97a;font-family:var(--mono)">' + pd.done + '</div><div style="font-size:9px;color:var(--tx3);font-family:var(--mono);letter-spacing:.05em;text-transform:uppercase">เสร็จ</div></div>'
      + '</div>'
      + '<div style="display:flex;align-items:center;gap:8px">'
      + '<div style="flex:1;height:3px;background:var(--bg4);border-radius:2px;overflow:hidden"><div style="height:100%;width:' + rate + '%;background:' + rc + ';border-radius:2px;transition:width .5s"></div></div>'
      + '<span style="font-size:12px;font-family:var(--mono);color:' + rc + ';font-weight:700;min-width:36px;text-align:right">' + rate + '%</span>'
      + '</div></div>';
  }
  chtml += '</div>';
  document.getElementById('prodCards').innerHTML = chtml;

  /* ── Status per Product ── */
  destroyChart('cProdStatus');
  charts.cProdStatus = new Chart(document.getElementById('cProdStatus'), {
    type: 'bar',
    data: {
      labels: prods,
      datasets: [
        { label: 'รอดำเนินการ', data: prods.map(function (n) { return prodData[n].open; }), backgroundColor: '#f04060', borderSkipped: false },
        { label: 'กำลังแก้ไข',  data: prods.map(function (n) { return prodData[n].prog; }), backgroundColor: '#f5a623', borderSkipped: false },
        { label: 'รอตอบกลับ',   data: prods.map(function (n) { return prodData[n].wait; }), backgroundColor: 'rgba(99,132,180,.4)', borderSkipped: false },
        { label: 'เสร็จแล้ว',   data: prods.map(function (n) { return prodData[n].done; }), backgroundColor: '#22c97a', borderSkipped: false }
      ]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8899bb', font: { size: 11, family: 'IBM Plex Mono' }, boxWidth: 8, padding: 12 } } },
      scales: {
        x: { stacked: true, ticks: { color: '#8899bb', font: { size: 11 } }, grid: { color: 'rgba(99,132,180,.08)' } },
        y: { stacked: true, ticks: { color: '#8899bb', font: { size: 11 } } }
      },
      onClick: function (e, items) {
        if (!items.length) return;
        var prod     = prods[items[0].index];
        var stat     = ['รอดำเนินการ', 'กำลังแก้ไข', 'รอตอบกลับ', 'เสร็จแล้ว'][items[0].datasetIndex];
        var filtered = allIssues.filter(function (x) { return x.product === prod && x.status === stat; });
        showChartPopup(prod + ' — ' + stat + ' (' + filtered.length + ')', buildIssueListPopup(filtered));
      }
    }
  });

  /* ── Issue Types per Product ── */
  var typeTotal = {};
  for (var pk in prodData) for (var tk in prodData[pk].types) typeTotal[tk] = (typeTotal[tk] || 0) + prodData[pk].types[tk];
  var topT = Object.keys(typeTotal).sort(function (a, b) { return typeTotal[b] - typeTotal[a]; }).slice(0, 7);
  destroyChart('cProdType');
  charts.cProdType = new Chart(document.getElementById('cProdType'), {
    type: 'bar',
    data: {
      labels: prods,
      datasets: topT.map(function (tn, ti) {
        return { label: tn, data: prods.map(function (n) { return prodData[n].types[tn] || 0; }), backgroundColor: COLORS[ti % COLORS.length], borderSkipped: false };
      })
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#8899bb', font: { size: 10, family: 'IBM Plex Mono' }, boxWidth: 8, padding: 10 } } },
      scales: {
        x: { stacked: true, ticks: { color: '#8899bb', font: { size: 11 } }, grid: { color: 'rgba(99,132,180,.08)' } },
        y: { stacked: true, ticks: { color: '#8899bb', font: { size: 11 } } }
      },
      onClick: function (e, items) {
        if (!items.length) return;
        var prod     = prods[items[0].index];
        var tp       = topT[items[0].datasetIndex];
        var filtered = allIssues.filter(function (x) { return x.product === prod && x.type === tp; });
        showChartPopup(prod + ' — ' + tp + ' (' + filtered.length + ')', buildIssueListPopup(filtered));
      }
    }
  });

  /* ── Hospital × Product Matrix ── */
  var allP = [];
  for (var hi = 0; hi < hospitals.length; hi++) {
    for (var si = 0; si < hospitals[hi].sheets.length; si++) {
      var pp = hospitals[hi].sheets[si].product;
      if (pp && allP.indexOf(pp) < 0) allP.push(pp);
    }
  }
  allP.sort();
  var mh = '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse"><thead><tr>'
    + '<th style="text-align:left;padding:9px 16px;font-size:10px;font-family:var(--mono);color:var(--tx3);letter-spacing:.06em;text-transform:uppercase;border-bottom:1px solid var(--bdr);white-space:nowrap;min-width:150px">โรงพยาบาล</th>';
  for (var pi = 0; pi < allP.length; pi++) {
    var ac = getProdColor(allP[pi], pi);
    mh += '<th style="text-align:center;padding:9px 14px;font-size:10px;font-family:var(--mono);color:' + ac + ';border-bottom:1px solid var(--bdr);white-space:nowrap;min-width:115px">'
      + '<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:' + ac + ';margin-right:5px;vertical-align:middle"></span>' + allP[pi] + '</th>';
  }
  mh += '</tr></thead><tbody>';
  for (var hi = 0; hi < hospitals.length; hi++) {
    var h   = hospitals[hi];
    var _hn = h.name.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    mh += '<tr><td style="padding:8px 16px;border-bottom:1px solid var(--bdr);color:var(--tx);font-weight:500;white-space:nowrap;font-size:13px">' + h.name + '</td>';
    for (var pi = 0; pi < allP.length; pi++) {
      var sh2 = null;
      for (var si = 0; si < h.sheets.length; si++) if (h.sheets[si].product === allP[pi]) { sh2 = h.sheets[si]; break; }
      if (!sh2) { mh += '<td style="padding:8px 14px;border-bottom:1px solid var(--bdr);text-align:center"><span style="color:var(--bdr);font-size:18px;letter-spacing:-.05em">—</span></td>'; continue; }
      var oc = 0, dc = 0, tot = sh2.issues.length;
      for (var k = 0; k < sh2.issues.length; k++) {
        if (sh2.issues[k].status === 'รอดำเนินการ') oc++;
        if (sh2.issues[k].status === 'เสร็จแล้ว')   dc++;
      }
      var rt   = tot ? Math.round(dc / tot * 100) : 0;
      var dotC = oc > 0 ? '#f04060' : (dc === tot && tot > 0) ? '#22c97a' : '#f5a623';
      var bgC  = oc > 0 ? 'rgba(240,64,96,.08)' : (dc === tot && tot > 0) ? 'rgba(34,201,122,.08)' : 'rgba(245,166,35,.07)';
      var _pn  = allP[pi].replace(/\\/g, '\\\\').replace(/'/g, "\\'");
      mh += '<td style="padding:6px 14px;border-bottom:1px solid var(--bdr);text-align:center">'
        + '<div class="matrix-cell" onclick="showHospProdPopup(\'' + _hn + '\',\'' + _pn + '\')" title="' + h.name + ' — ' + allP[pi] + '" style="display:inline-block;background:' + bgC + ';border:1px solid ' + dotC + '30;border-radius:8px;padding:7px 12px;min-width:80px">'
        + '<div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-bottom:4px">'
        + '<span style="width:7px;height:7px;border-radius:50%;background:' + dotC + ';flex-shrink:0;box-shadow:0 0 6px ' + dotC + '80"></span>'
        + '<span style="font-family:var(--mono);font-size:16px;font-weight:700;color:var(--tx)">' + tot + '</span></div>'
        + '<div style="font-size:10px;font-family:var(--mono);color:var(--tx3);line-height:1.4">'
        + (oc > 0 ? '<span style="color:#f04060;font-weight:600">' + oc + ' รอ</span>  ' : '') + rt + '%'
        + '</div></div></td>';
    }
    mh += '</tr>';
  }
  mh += '</tbody></table></div>';
  document.getElementById('prodMatrix').innerHTML = mh;

  /* ── Hospital Completion Rate ── */
  var hospRateData = [];
  for (var hi = 0; hi < hospitals.length; hi++) {
    var h = hospitals[hi], hTot = 0, hDone = 0, hOpen = 0;
    for (var si = 0; si < h.sheets.length; si++) {
      for (var ki = 0; ki < h.sheets[si].issues.length; ki++) {
        hTot++;
        var ss = h.sheets[si].issues[ki].status;
        if (ss === 'เสร็จแล้ว')   hDone++;
        if (ss === 'รอดำเนินการ') hOpen++;
      }
    }
    if (hTot > 0) hospRateData.push({ name: h.name, total: hTot, done: hDone, open: hOpen, rate: Math.round(hDone / hTot * 100) });
  }
  hospRateData.sort(function (a, b) { return a.rate - b.rate; });
  destroyChart('cHospRate');
  var hrEl = document.getElementById('cHospRate');
  if (hrEl && hospRateData.length) {
    charts.cHospRate = new Chart(hrEl, {
      type: 'bar',
      data: {
        labels: hospRateData.map(function (x) { return x.name; }),
        datasets: [
          { label: 'รอดำเนินการ', data: hospRateData.map(function (x) { return x.open; }),               backgroundColor: 'rgba(240,64,96,.75)',  borderSkipped: false, stack: 's' },
          { label: 'อื่นๆ',        data: hospRateData.map(function (x) { return x.total - x.done - x.open; }), backgroundColor: 'rgba(99,132,180,.3)', borderSkipped: false, stack: 's' },
          { label: 'เสร็จแล้ว',   data: hospRateData.map(function (x) { return x.done; }),               backgroundColor: 'rgba(34,201,122,.75)',  borderSkipped: false, stack: 's' }
        ]
      },
      options: {
        indexAxis: 'y', responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { labels: { color: '#8899bb', font: { size: 11, family: 'IBM Plex Mono' }, boxWidth: 8, padding: 12 } },
          tooltip: { callbacks: { footer: function (items) { var d = hospRateData[items[0].dataIndex]; return 'แก้ไขแล้ว ' + d.rate + '% (' + d.done + '/' + d.total + ')'; } } }
        },
        scales: {
          x: { stacked: true, ticks: { color: '#8899bb', font: { size: 11 } }, grid: { color: 'rgba(99,132,180,.08)' } },
          y: { stacked: true, ticks: { color: '#8899bb', font: { size: 11 } } }
        },
        onClick: function (e, items) {
          if (!items.length) return;
          var d = hospRateData[items[0].index];
          showChartPopup('ภาพรวม: ' + d.name, buildHospPopup(d.name));
        }
      }
    });
  }
}

/* ── Timeline Chart ── */

function renderTimeline() {
  if (!allIssues.length) return;
  var dated = allIssues.filter(function (x) { return x.dateObj; });
  if (!dated.length) {
    document.getElementById('weekBars').innerHTML = '<div class="empty">ไม่พบวันที่ที่อ่านได้ — ตรวจสอบ Column Mapping</div>';
    return;
  }
  var wm = {};
  for (var i = 0; i < dated.length; i++) {
    var x = dated[i], wk = x.weekKey;
    if (!wm[wk]) wm[wk] = { key: wk, label: x.weekLabel, dateObj: x.dateObj, total: 0, open: 0, prog: 0, done: 0 };
    wm[wk].total++;
    if      (x.status === 'รอดำเนินการ') wm[wk].open++;
    else if (x.status === 'กำลังแก้ไข')  wm[wk].prog++;
    else if (x.status === 'เสร็จแล้ว')   wm[wk].done++;
  }
  var wks = [];
  for (var k in wm) wks.push(wm[k]);
  wks.sort(function (a, b) { return new Date(a.key) - new Date(b.key); });
  if (wks.length > 12) wks = wks.slice(wks.length - 12);
  var labels = wks.map(function (w) { return w.label; });

  destroyChart('cTimeline');
  charts.cTimeline = new Chart(document.getElementById('cTimeline'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'รอดำเนินการ', data: wks.map(function (w) { return w.open; }),  borderColor: '#f04060', backgroundColor: 'rgba(240,64,96,.08)', tension: .4, fill: true,  pointRadius: 4, pointHoverRadius: 6, borderWidth: 2 },
        { label: 'กำลังแก้ไข',  data: wks.map(function (w) { return w.prog; }),  borderColor: '#f5a623', backgroundColor: 'rgba(245,166,35,.05)', tension: .4, fill: false, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2, borderDash: [5, 3] },
        { label: 'เสร็จแล้ว',   data: wks.map(function (w) { return w.done; }),  borderColor: '#22c97a', backgroundColor: 'rgba(34,201,122,.05)', tension: .4, fill: false, pointRadius: 4, pointHoverRadius: 6, borderWidth: 2 },
        { label: 'รวม',          data: wks.map(function (w) { return w.total; }), borderColor: '#3d8ef8', backgroundColor: 'rgba(61,142,248,.04)', tension: .4, fill: false, pointRadius: 3, pointHoverRadius: 5, borderWidth: 1.5, borderDash: [2, 2] }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { labels: { color: '#8899bb', font: { size: 11, family: 'IBM Plex Mono' }, boxWidth: 10 } } },
      scales: {
        x: { ticks: { color: '#8899bb', font: { size: 11 }, autoSkip: false, maxRotation: 40 }, grid: { color: 'rgba(99,132,180,.06)' } },
        y: { min: 0, ticks: { color: '#8899bb', stepSize: 1 }, grid: { color: 'rgba(99,132,180,.08)' } }
      }
    }
  });

  var mx = 1;
  for (var i = 0; i < wks.length; i++) if (wks[i].total > mx) mx = wks[i].total;
  var rev  = wks.slice().reverse();
  var bars = '';
  for (var i = 0; i < rev.length; i++) {
    var w    = rev[i];
    var rate = Math.round(w.done / w.total * 100);
    var rc   = rate >= 60 ? '#22c97a' : rate >= 30 ? '#f5a623' : '#f04060';
    bars += '<div class="week-bar">'
      + '<div class="week-lbl">' + w.label + '</div>'
      + '<div class="week-track">'
      + '<div class="week-seg" style="width:' + Math.round(w.open / mx * 100) + '%;background:var(--rd)"></div>'
      + '<div class="week-seg" style="width:' + Math.round(w.prog / mx * 100) + '%;background:var(--am)"></div>'
      + '<div class="week-seg" style="width:' + Math.round(w.done / mx * 100) + '%;background:var(--gr)"></div>'
      + '</div>'
      + '<div class="week-nums"><span>' + w.total + ' รวม</span><span style="color:' + rc + ';font-weight:600">' + rate + '%</span></div>'
      + '</div>';
  }
  document.getElementById('weekBars').innerHTML = bars || '<div class="empty">ไม่มีข้อมูล</div>';
}

/* ── Chart Popup ── */

function buildHospPopup(hospName) {
  var hosp = null;
  for (var i = 0; i < hospitals.length; i++) if (hospitals[i].name === hospName) { hosp = hospitals[i]; break; }
  if (!hosp) return '';
  var issues = [];
  for (var j = 0; j < hosp.sheets.length; j++) issues = issues.concat(hosp.sheets[j].issues);
  return buildIssueListPopup(issues);
}

/* ── Popup Pagination State ── */
var _popupAllIssues = [];
var POPUP_PAGE_SIZE = 50;

function buildIssueListPopup(issues) {
  _popupAllIssues = issues;
  return renderPopupPage(1);
}

function popupGotoPage(page) {
  var el = document.getElementById('cpBody');
  if (el) { el.innerHTML = renderPopupPage(page); el.scrollTop = 0; }
}

function buildPageBar(page, total) {
  var h = '<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">';
  h += '<button class="btn btn-sm" onclick="popupGotoPage(' + (page - 1) + ')"' + (page <= 1 ? ' disabled' : '') + '>&#8249;</button>';
  var pages = [];
  if (total <= 7) {
    for (var i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (page > 3) pages.push('…');
    for (var i = Math.max(2, page - 1); i <= Math.min(total - 1, page + 1); i++) pages.push(i);
    if (page < total - 2) pages.push('…');
    pages.push(total);
  }
  for (var pi = 0; pi < pages.length; pi++) {
    if (pages[pi] === '…') {
      h += '<span style="font-size:12px;font-family:var(--mono);color:var(--tx3);padding:0 2px">…</span>';
    } else {
      var pg = pages[pi];
      h += '<button class="btn btn-sm' + (pg === page ? ' btn-primary' : '') + '" onclick="popupGotoPage(' + pg + ')"' + (pg === page ? ' disabled' : '') + '>' + pg + '</button>';
    }
  }
  h += '<button class="btn btn-sm" onclick="popupGotoPage(' + (page + 1) + ')"' + (page >= total ? ' disabled' : '') + '>&#8250;</button>';
  h += '</div>';
  return h;
}

function renderPopupPage(page) {
  var issues = _popupAllIssues;
  if (!issues.length) return '<div class="empty">ไม่มีรายการ</div>';

  var totalPages = Math.ceil(issues.length / POPUP_PAGE_SIZE);
  var start      = (page - 1) * POPUP_PAGE_SIZE;
  var end        = Math.min(start + POPUP_PAGE_SIZE, issues.length);
  var slice      = issues.slice(start, end);

  // ─ Type summary from ALL issues ─
  var typeTotals = {}, typeOrder = [];
  for (var i = 0; i < issues.length; i++) {
    var t = issues[i].type || 'ไม่ระบุกลุ่ม';
    if (!typeTotals[t]) { typeTotals[t] = 0; typeOrder.push(t); }
    typeTotals[t]++;
  }
  typeOrder.sort(function (a, b) { return typeTotals[b] - typeTotals[a]; });

  // ─ Count type occurrences before this page (for continuous per-type numbering) ─
  var typePreCount = {};
  for (var i = 0; i < start; i++) {
    var t = issues[i].type || 'ไม่ระบุกลุ่ม';
    typePreCount[t] = (typePreCount[t] || 0) + 1;
  }

  // ─ Group current page: Product → Type, seq resets per type ─
  var groups = {}, prodOrder = [], typeLocalCount = {};
  for (var i = 0; i < slice.length; i++) {
    var p = slice[i].product || 'ไม่ระบุ Product';
    var t = slice[i].type    || 'ไม่ระบุกลุ่ม';
    if (!groups[p]) { groups[p] = { types: {}, typeOrder: [] }; prodOrder.push(p); }
    if (!groups[p].types[t]) { groups[p].types[t] = []; groups[p].typeOrder.push(t); }
    typeLocalCount[t] = (typeLocalCount[t] || 0) + 1;
    groups[p].types[t].push({ iss: slice[i], seq: (typePreCount[t] || 0) + typeLocalCount[t] });
  }
  var singleProd = prodOrder.length === 1;

  var h = '';

  // ─ Top bar ─
  h += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:10px">';
  h += '<span style="font-size:11px;font-family:var(--mono);color:var(--tx3)">'
    + issues.length + ' รายการ · #' + (start + 1) + '–#' + end
    + (totalPages > 1 ? ' · หน้า ' + page + '/' + totalPages : '') + '</span>';
  if (totalPages > 1) h += buildPageBar(page, totalPages);
  h += '</div>';

  // ─ Type summary strip (full counts, shown when > 1 type) ─
  if (typeOrder.length > 1) {
    h += '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;padding:9px 12px;background:var(--bg3);border-radius:var(--r2);border:1px solid var(--bdr)">';
    for (var ti = 0; ti < typeOrder.length; ti++) {
      var tk = typeOrder[ti];
      h += '<span style="display:inline-flex;align-items:center;gap:5px;font-size:11px;font-family:var(--mono);color:var(--tx2)">'
        + escHtml(tk)
        + '<span style="background:var(--bg4);color:var(--ac);padding:0 7px;border-radius:99px;font-size:10px;font-weight:700">' + typeTotals[tk] + '</span>'
        + '</span>';
      if (ti < typeOrder.length - 1) h += '<span style="color:var(--bdr2)">·</span>';
    }
    h += '</div>';
  }

  // ─ Items: Product → Type sub-groups ─
  for (var gi = 0; gi < prodOrder.length; gi++) {
    var prod = prodOrder[gi];
    var grp  = groups[prod];
    var pCol = PROD_COLORS[prod] || '#8899bb';

    if (!singleProd) {
      var prodTotal = 0;
      for (var ti = 0; ti < grp.typeOrder.length; ti++) prodTotal += grp.types[grp.typeOrder[ti]].length;
      h += '<div style="display:flex;align-items:center;gap:8px;margin:' + (gi > 0 ? '18px' : '0') + ' 0 6px">';
      h += '<span style="width:8px;height:8px;border-radius:50%;background:' + pCol + ';flex-shrink:0"></span>';
      h += '<span style="font-size:12px;font-weight:700;font-family:var(--mono);color:' + pCol + '">' + escHtml(prod) + '</span>';
      h += '<span style="background:var(--bg4);color:var(--tx3);padding:0 7px;border-radius:99px;font-size:10px;font-family:var(--mono)">' + prodTotal + '</span>';
      h += '<div style="flex:1;height:1px;background:var(--bdr)"></div></div>';
    }

    for (var ti = 0; ti < grp.typeOrder.length; ti++) {
      var typeName = grp.typeOrder[ti];
      var typeList = grp.types[typeName];
      var pInd     = singleProd ? 0 : 14;

      h += '<div style="display:flex;align-items:center;gap:6px;margin:' + (ti > 0 ? '10px' : (singleProd ? '0' : '6px')) + ' 0 5px ' + pInd + 'px">';
      h += '<span style="width:5px;height:5px;border-radius:50%;background:var(--ac);opacity:.8;flex-shrink:0"></span>';
      h += '<span style="font-size:11px;font-family:var(--mono);color:var(--tx2);font-weight:600">' + escHtml(typeName) + '</span>';
      h += '<span style="background:rgba(61,142,248,.12);color:var(--ac);padding:0 8px;border-radius:99px;font-size:10px;font-family:var(--mono);font-weight:700">' + typeList.length + '</span>';
      h += '<div style="flex:1;height:1px;background:var(--bdr);opacity:.5"></div></div>';

      var iInd = pInd + 12;
      for (var i = 0; i < typeList.length; i++) {
        var x = typeList[i].iss, sq = typeList[i].seq, pc = pillClass(x.status);
        h += '<div style="padding:6px 0 6px ' + iInd + 'px;border-bottom:1px solid var(--bdr);display:flex;align-items:flex-start;gap:8px">';
        h += '<span style="font-size:10px;font-family:var(--mono);color:var(--tx3);min-width:28px;flex-shrink:0;padding-top:3px;text-align:right">' + sq + '.</span>';
        h += '<span class="pill ' + pc + '" style="font-size:9px;flex-shrink:0">' + x.status + '</span>';
        h += '<div style="flex:1;min-width:0">';
        h += '<div style="font-size:13px;color:var(--tx);font-weight:500;white-space:normal">' + escHtml(x.topic || '—') + '</div>';
        var meta = [];
        if (x.hospital)              meta.push(escHtml(x.hospital));
        if (singleProd && x.product) meta.push(escHtml(x.product));
        if (x.dept)                  meta.push(escHtml(x.dept));
        if (meta.length) h += '<div style="font-size:10px;font-family:var(--mono);color:var(--tx3);margin-top:3px">' + meta.join(' · ') + '</div>';
        h += '</div></div>';
      }
    }
  }

  // ─ Bottom pagination ─
  if (totalPages > 1) {
    h += '<div style="display:flex;justify-content:center;margin-top:16px;padding-top:14px;border-top:1px solid var(--bdr)">';
    h += buildPageBar(page, totalPages);
    h += '</div>';
  }

  return h;
}

function showChartPopup(title, body) {
  document.getElementById('cpTitle').textContent = title;
  document.getElementById('cpBody').innerHTML    = body;
  document.getElementById('chartPopup').style.display = 'flex';
}

function closeChartPopup() {
  document.getElementById('chartPopup').style.display = 'none';
}
