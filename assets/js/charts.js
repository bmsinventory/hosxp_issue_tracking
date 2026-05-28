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
    var h = hospitals[hi];
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
      mh += '<td style="padding:6px 14px;border-bottom:1px solid var(--bdr);text-align:center">'
        + '<div style="display:inline-block;background:' + bgC + ';border:1px solid ' + dotC + '30;border-radius:8px;padding:7px 12px;min-width:80px">'
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

function buildIssueListPopup(issues) {
  if (!issues.length) return '<div class="empty">ไม่มีรายการ</div>';
  var h = '<div style="font-size:11px;font-family:var(--mono);color:var(--tx3);margin-bottom:10px">' + issues.length + ' รายการ</div>';
  for (var i = 0; i < Math.min(issues.length, 50); i++) {
    var x  = issues[i];
    var pc = pillClass(x.status);
    h += '<div style="padding:8px 0;border-bottom:1px solid var(--bdr);display:flex;align-items:flex-start;gap:8px">';
    h += '<span class="pill ' + pc + '" style="font-size:9px;flex-shrink:0">' + x.status + '</span>';
    h += '<div style="flex:1;min-width:0">';
    h += '<div style="font-size:12px;color:var(--tx);font-weight:500;white-space:normal">' + escHtml(x.topic || '—') + '</div>';
    if (x.hospital || x.product) h += '<div style="font-size:10px;font-family:var(--mono);color:var(--tx3);margin-top:2px">' + (x.hospital ? escHtml(x.hospital) + ' · ' : '') + escHtml(x.product || '') + '</div>';
    if (x.dept) h += '<div style="font-size:10px;font-family:var(--mono);color:var(--tx3)">' + escHtml(x.dept) + '</div>';
    h += '</div></div>';
  }
  if (issues.length > 50) h += '<div style="font-size:11px;font-family:var(--mono);color:var(--tx3);margin-top:8px">...และอีก ' + (issues.length - 50) + ' รายการ</div>';
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
