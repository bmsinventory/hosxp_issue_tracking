/* ── Admin Password — stored in Supabase app_config table ── */

var adminUnlocked  = false;
var cachedAdminPwd = null; // null = not loaded yet, '' = no password set

var ADMIN_CFG_KEY  = 'admin_password';
var ADMIN_PWD_KEY  = 'bms-admin-pwd'; // legacy localStorage fallback

/* ── Load from Supabase ── */

async function loadAdminPwdFromSb() {
  if (!sbClient) return;
  var res = await sbClient
    .from('app_config')
    .select('value')
    .eq('key', ADMIN_CFG_KEY)
    .maybeSingle();
  if (res.error) {
    // table may not exist yet — fall back to localStorage
    cachedAdminPwd = localStorage.getItem(ADMIN_PWD_KEY) || '';
  } else {
    cachedAdminPwd = (res.data && res.data.value) ? res.data.value : '';
    // migrate from localStorage if Supabase has nothing yet
    if (!cachedAdminPwd) {
      var local = localStorage.getItem(ADMIN_PWD_KEY);
      if (local) cachedAdminPwd = local;
    }
  }
  renderAdminStatus();
}

/* ── Helpers ── */

function getAdminPwd()   { return cachedAdminPwd !== null ? cachedAdminPwd : ''; }
function isAdminPwdSet() { return !!getAdminPwd(); }

/* ── Gate: require admin before running callback ── */

function requireAdmin(callback) {
  if (adminUnlocked) { callback(); return; }

  if (cachedAdminPwd === null) {
    toast('กำลังโหลดข้อมูล Admin...', '');
    return;
  }
  if (!isAdminPwdSet()) {
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
  inp.value       = '';
  modal._cb       = callback;
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
  document.getElementById('adminPwdInput').value      = '';
  document.getElementById('adminErr').textContent     = '';
}

function adminKeyPress(e) {
  if (e.key === 'Enter') confirmAdminPwd();
}

/* ── Lock Settings ── */

function lockAdmin() {
  adminUnlocked = false;
  var activeView = document.querySelector('.view.active');
  if (activeView && ['view-hospitals', 'view-user'].indexOf(activeView.id) >= 0) {
    gotoTabDirect('overview');
  }
  toast('ล็อคการตั้งค่าแล้ว', '');
  updateLockBtn();
}

function updateLockBtn() {
  var btn = document.getElementById('lockAdminBtn');
  if (btn) btn.style.display = adminUnlocked ? '' : 'none';
}

/* ── Save Admin Password to Supabase ── */

async function saveAdminPassword() {
  var curEl     = document.getElementById('curAdminPwd');
  var newPwdEl  = document.getElementById('newAdminPwd');
  var confEl    = document.getElementById('confirmAdminPwd');
  var cur       = curEl.value;
  var newPwd    = newPwdEl.value.trim();
  var confirm   = confEl.value.trim();

  if (isAdminPwdSet() && cur !== getAdminPwd()) {
    toast('รหัสผ่านปัจจุบันไม่ถูกต้อง', 'error');
    return;
  }
  if (!newPwd)           { toast('กรุณาใส่รหัสผ่านใหม่', 'error'); return; }
  if (newPwd !== confirm) { toast('รหัสผ่านใหม่ไม่ตรงกัน',  'error'); return; }
  if (!sbClient)          { toast('กรุณาเชื่อมต่อ Supabase ก่อน', 'error'); return; }

  var res = await sbClient
    .from('app_config')
    .upsert(
      { key: ADMIN_CFG_KEY, value: newPwd, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (res.error) {
    toast('บันทึกไม่สำเร็จ: ' + res.error.message, 'error');
    return;
  }

  cachedAdminPwd = newPwd;
  localStorage.removeItem(ADMIN_PWD_KEY); // clean up old localStorage entry

  curEl.value  = '';
  newPwdEl.value = '';
  confEl.value   = '';
  toast('บันทึกรหัสผ่าน Admin ลง Supabase แล้ว', 'success');
  renderAdminStatus();
}

/* ── Render status in User view ── */

function renderAdminStatus() {
  var el = document.getElementById('adminPwdStatus');
  if (!el) return;
  if (cachedAdminPwd === null) {
    el.innerHTML = '<span style="color:var(--tx3)">● กำลังโหลด...</span>';
  } else if (isAdminPwdSet()) {
    el.innerHTML = '<span style="color:var(--gr)">● ตั้งรหัสผ่านแล้ว (Supabase)</span>';
  } else {
    el.innerHTML = '<span style="color:var(--am)">● ยังไม่ได้ตั้งรหัสผ่าน</span>';
  }
  var curRow = document.getElementById('curPwdRow');
  if (curRow) curRow.style.display = isAdminPwdSet() ? '' : 'none';
}
