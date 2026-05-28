/* ── Admin Password — protects Settings tabs only ── */

var adminUnlocked = false;
var ADMIN_PWD_KEY = 'bms-admin-pwd';

/* ── Helpers ── */

function getAdminPwd()  { return localStorage.getItem(ADMIN_PWD_KEY) || ''; }
function isAdminPwdSet(){ return !!getAdminPwd(); }

/* ── Gate: require admin before running callback ── */

function requireAdmin(callback) {
  if (adminUnlocked) { callback(); return; }
  if (!isAdminPwdSet()) {
    // no password set yet → unlock immediately, guide user to set one
    adminUnlocked = true;
    callback();
    toast('ยังไม่ได้ตั้งรหัสผ่าน Admin — ตั้งได้ที่ ผู้ใช้งาน', '');
    return;
  }
  showAdminModal(callback);
}

/* ── Admin Modal ── */

function showAdminModal(callback) {
  var modal = document.getElementById('adminModal');
  var err   = document.getElementById('adminErr');
  var inp   = document.getElementById('adminPwdInput');
  err.textContent = '';
  inp.value = '';
  modal._cb = callback;
  modal.style.display = 'flex';
  setTimeout(function () { inp.focus(); }, 80);
}

function confirmAdminPwd() {
  var inp = document.getElementById('adminPwdInput');
  var err = document.getElementById('adminErr');
  if (inp.value === getAdminPwd()) {
    adminUnlocked = true;
    var cb = document.getElementById('adminModal')._cb;
    closeAdminModal();
    if (cb) cb();
  } else {
    err.textContent = 'รหัสผ่านไม่ถูกต้อง';
    inp.value = '';
    inp.focus();
  }
}

function closeAdminModal() {
  document.getElementById('adminModal').style.display = 'none';
  document.getElementById('adminPwdInput').value = '';
  document.getElementById('adminErr').textContent = '';
}

function adminKeyPress(e) {
  if (e.key === 'Enter') confirmAdminPwd();
}

/* ── Lock Settings ── */

function lockAdmin() {
  adminUnlocked = false;
  // navigate away from settings if currently on one
  var activeView = document.querySelector('.view.active');
  if (activeView && ['view-hospitals','view-user'].indexOf(activeView.id) >= 0) {
    gotoTabDirect('overview');
  }
  toast('ล็อคการตั้งค่าแล้ว', '');
  updateLockBtn();
}

function updateLockBtn() {
  var btn = document.getElementById('lockAdminBtn');
  if (btn) btn.style.display = adminUnlocked ? '' : 'none';
}

/* ── Set / Change Password ── */

function saveAdminPassword() {
  var cur     = document.getElementById('curAdminPwd').value;
  var newPwd  = document.getElementById('newAdminPwd').value.trim();
  var confirm = document.getElementById('confirmAdminPwd').value.trim();

  if (isAdminPwdSet() && cur !== getAdminPwd()) {
    toast('รหัสผ่านปัจจุบันไม่ถูกต้อง', 'error');
    return;
  }
  if (!newPwd) { toast('กรุณาใส่รหัสผ่านใหม่', 'error'); return; }
  if (newPwd !== confirm) { toast('รหัสผ่านใหม่ไม่ตรงกัน', 'error'); return; }

  localStorage.setItem(ADMIN_PWD_KEY, newPwd);
  document.getElementById('curAdminPwd').value     = '';
  document.getElementById('newAdminPwd').value     = '';
  document.getElementById('confirmAdminPwd').value = '';
  toast('ตั้งรหัสผ่าน Admin สำเร็จ', 'success');
  renderAdminStatus();
}

function renderAdminStatus() {
  var el = document.getElementById('adminPwdStatus');
  if (!el) return;
  if (isAdminPwdSet()) {
    el.innerHTML = '<span style="color:var(--gr)">● ตั้งรหัสผ่านแล้ว</span>';
  } else {
    el.innerHTML = '<span style="color:var(--am)">● ยังไม่ได้ตั้งรหัสผ่าน</span>';
  }
  var curRow = document.getElementById('curPwdRow');
  if (curRow) curRow.style.display = isAdminPwdSet() ? '' : 'none';
}
