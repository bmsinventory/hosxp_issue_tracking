/* ── UI Utilities ── */

function escHtml(s) {
  return (s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setBtnState(btn, text, disabled) {
  var label = btn.querySelector('.btn-text');
  if (label) label.textContent = text;
  else btn.textContent = text;
  btn.disabled = disabled;
}

/* ── Navigation ── */

// Tabs that require admin password
var ADMIN_TABS = ['hospitals', 'user'];

function gotoTab(id, btn) {
  if (ADMIN_TABS.indexOf(id) >= 0) {
    requireAdmin(function () { gotoTabDirect(id, btn); updateLockBtn(); });
  } else {
    gotoTabDirect(id, btn);
  }
}

function gotoTabDirect(id, btn) {
  document.querySelectorAll('.view').forEach(function (v) { v.classList.remove('active'); });
  document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
  var view = document.getElementById('view-' + id);
  if (view) view.classList.add('active');
  if (btn) btn.classList.add('active');
  document.getElementById('topbarTitle').textContent = TAB_TITLES[id] || id;
  if (window.innerWidth < 900) document.getElementById('sidebar').classList.remove('open');
  if (id === 'user') renderAdminStatus();
}

function toggleSB() {
  document.getElementById('sidebar').classList.toggle('open');
}

/* ── Theme ── */

function setTheme(name) {
  document.documentElement.setAttribute('data-theme', name === 'dark' ? '' : name);
  localStorage.setItem('bms-theme', name);
  document.querySelectorAll('.tsw').forEach(function (el) { el.classList.remove('active'); });
  var sw = document.getElementById('tsw-' + name);
  if (sw) sw.classList.add('active');
}

/* ── Toast Notifications ── */

function toast(msg, type) {
  var el = document.createElement('div');
  el.className = 'toast ' + (type || '');
  var ic = type === 'success' ? '&#10003;' : type === 'error' ? '&#10007;' : '&#9432;';
  var ic_color = type === 'success' ? 'var(--gr)' : type === 'error' ? 'var(--rd)' : 'var(--ac)';
  el.innerHTML = '<span style="color:' + ic_color + '">' + ic + '</span> ' + msg;
  document.getElementById('toastWrap').appendChild(el);
  setTimeout(function () {
    el.style.opacity = '0';
    el.style.transform = 'translateY(6px)';
    el.style.transition = '.3s';
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 300);
  }, 3000);
}

/* ── Responsive ── */

function checkResp() {
  var btn = document.getElementById('menuBtn');
  if (window.innerWidth < 900) {
    btn.style.display = '';
  } else {
    btn.style.display = 'none';
    document.getElementById('sidebar').classList.remove('open');
  }
}
window.addEventListener('resize', checkResp);

/* ── Last Updated ── */

function updateLastUpdate() {
  var label = document.getElementById('lastUpdateLabel');
  var time  = document.getElementById('lastUpdateTime');
  if (!label || !time) return;
  time.textContent = new Date().toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  label.style.display = '';
}

/* ── Auto Refresh ── */

var _arTimer    = null;
var _arCountdown = null;
var _arRemain   = 0;
var _arMinutes  = 0;

function setAutoInterval(val) {
  _arMinutes = parseInt(val) || 0;
  clearAutoTimers();
  localStorage.setItem('bms-auto-interval', _arMinutes);
  if (_arMinutes > 0) {
    startAutoCountdown();
    toast('อัปเดตอัตโนมัติทุก ' + _arMinutes + ' นาที', 'success');
  } else {
    updateAutoBadge(false, 0);
    toast('ปิดอัปเดตอัตโนมัติแล้ว', '');
  }
}

function clearAutoTimers() {
  if (_arTimer)    { clearTimeout(_arTimer);     _arTimer    = null; }
  if (_arCountdown){ clearInterval(_arCountdown); _arCountdown = null; }
}

function startAutoCountdown() {
  clearAutoTimers();
  _arRemain = _arMinutes * 60;
  updateAutoBadge(true, _arRemain);
  _arCountdown = setInterval(function () {
    _arRemain--;
    updateAutoBadge(true, _arRemain);
    if (_arRemain <= 0) {
      clearInterval(_arCountdown);
      _arCountdown = null;
      fetchAll(true);
    }
  }, 1000);
}

function updateAutoBadge(on, secs) {
  var badge = document.getElementById('autoBadge');
  var label = document.getElementById('abLabel');
  if (!badge) return;
  if (!on) { badge.classList.remove('active'); label.textContent = 'ปิดอยู่'; return; }
  badge.classList.add('active');
  var m = Math.floor(secs / 60), s = secs % 60;
  label.textContent = (m > 0 ? m + 'น. ' : '') + String(s).padStart(2, '0') + 'ว.';
}
