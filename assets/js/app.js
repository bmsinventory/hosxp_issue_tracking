/* ── Application Entry Point ── */

function fetchAll(isAuto) {
  if (!hospitals.length) {
    if (!isAuto) toast('กรุณาเพิ่มโรงพยาบาลก่อน', 'error');
    if (_arMinutes > 0) startAutoCountdown();
    return;
  }
  var btn  = document.getElementById('fetchBtn');
  var icon = document.getElementById('fetchIcon');
  setBtnState(btn, 'กำลังดึง...', true);
  if (icon) icon.style.animation = 'spin .7s linear infinite';

  var queue = [];
  for (var i = 0; i < hospitals.length; i++) {
    for (var j = 0; j < hospitals[i].sheets.length; j++) {
      queue.push({ h: hospitals[i], sh: hospitals[i].sheets[j] });
    }
  }

  if (!queue.length) {
    setBtnState(btn, 'ดึงข้อมูล', false);
    if (icon) icon.style.animation = '';
    if (_arMinutes > 0) startAutoCountdown();
    return;
  }

  var done = 0, total = queue.length;

  function onSheetDone() {
    done++;
    setBtnState(btn, 'กำลังดึง... ' + done + '/' + total, true);
    renderHospList();
    if (done < total) return;
    allIssues = [];
    for (var i = 0; i < hospitals.length; i++) {
      for (var j = 0; j < hospitals[i].sheets.length; j++) {
        allIssues = allIssues.concat(hospitals[i].sheets[j].issues);
      }
    }
    setBtnState(btn, 'ดึงข้อมูล', false);
    if (icon) icon.style.animation = '';
    postLoad();
    saveState();
    updateLastUpdate();
    if (_arMinutes > 0) startAutoCountdown();
  }

  for (var i = 0; i < queue.length; i++) {
    fetchSheet(queue[i].h, queue[i].sh, onSheetDone);
  }
}

function postLoad() {
  var sm = {};
  for (var i = 0; i < allIssues.length; i++) if (allIssues[i].rawStatus) sm[allIssues[i].rawStatus] = 1;
  lastDetectedStatuses = Object.keys(sm).sort();
  renderHospList();
  updateMetrics();
  renderCharts();
  renderTimeline();
  renderByHosp();
  populateFilters();
  renderAll();
}

function initApp() {
  loadState();
  updateProductDatalist();
  renderHospList();
  populateFilters();
  checkResp();
  initSb();

  // restore theme
  var th = localStorage.getItem('bms-theme') || 'light';
  setTheme(th);

  // restore auto-refresh
  var savedInterval = parseInt(localStorage.getItem('bms-auto-interval')) || 0;
  if (savedInterval > 0) {
    _arMinutes = savedInterval;
    var sel = document.getElementById('intervalSel');
    if (sel) sel.value = savedInterval;
    startAutoCountdown();
  }
}

window.addEventListener('DOMContentLoaded', initApp);
