/* ── Authentication (Supabase Auth) ── */

var currentUser = null;

/* ── Session Management ── */

async function checkAuth() {
  try {
    var result  = await sbClient.auth.getSession();
    var session = result.data.session;
    if (session) {
      currentUser = session.user;
      onAuthSuccess();
    } else {
      showLoginScreen();
    }
  } catch (e) {
    showLoginScreen();
  }

  // React to auth state changes (login / logout from another tab, token refresh)
  sbClient.auth.onAuthStateChange(function (event, session) {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      onAuthSuccess();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      // clear app state
      hospitals  = [];
      allIssues  = [];
      renderHospList();
      updateMetrics();
      showLoginScreen();
    }
  });
}

function onAuthSuccess() {
  hideLoginScreen();
  updateUserInfo();
  loadHospitalsFromSb();
}

/* ── Login / Logout ── */

async function doLogin() {
  var email = (document.getElementById('loginEmail').value || '').trim();
  var pwd   =  document.getElementById('loginPwd').value   || '';
  var errEl =  document.getElementById('loginErr');
  var btn   =  document.getElementById('loginBtn');

  errEl.textContent = '';
  if (!email || !pwd) { errEl.textContent = 'กรุณากรอกอีเมล์และรหัสผ่าน'; return; }

  btn.disabled    = true;
  btn.textContent = 'กำลังเข้าสู่ระบบ...';

  var result = await sbClient.auth.signInWithPassword({ email: email, password: pwd });

  btn.disabled    = false;
  btn.textContent = 'เข้าสู่ระบบ';

  if (result.error) {
    errEl.textContent = 'อีเมล์หรือรหัสผ่านไม่ถูกต้อง';
    document.getElementById('loginPwd').value = '';
    document.getElementById('loginPwd').focus();
  }
  // success is handled by onAuthStateChange → SIGNED_IN
}

async function doLogout() {
  await sbClient.auth.signOut();
  // SIGNED_OUT event will handle the rest
}

async function sendPasswordReset() {
  if (!currentUser) return;
  var result = await sbClient.auth.resetPasswordForEmail(currentUser.email);
  if (result.error) {
    toast('ส่งลิงก์ไม่สำเร็จ: ' + result.error.message, 'error');
  } else {
    toast('ส่งลิงก์รีเซ็ตรหัสผ่านไปที่ ' + currentUser.email + ' แล้ว', 'success');
  }
}

/* ── UI Helpers ── */

function showLoginScreen() {
  var sc = document.getElementById('loginScreen');
  if (sc) sc.style.display = 'flex';
  // clear password field for security
  var pwd = document.getElementById('loginPwd');
  if (pwd) pwd.value = '';
  setTimeout(function () {
    var em = document.getElementById('loginEmail');
    if (em) em.focus();
  }, 100);
}

function hideLoginScreen() {
  var sc = document.getElementById('loginScreen');
  if (sc) sc.style.display = 'none';
}

function updateUserInfo() {
  if (!currentUser) return;
  var email    = currentUser.email || '';
  var lastSign = currentUser.last_sign_in_at
    ? new Date(currentUser.last_sign_in_at).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' })
    : '—';

  var letter = email ? email[0].toUpperCase() : 'U';

  var sEl = document.getElementById('sidebarUserEmail');
  if (sEl) sEl.textContent = email;

  var saEl = document.getElementById('sidebarUserAvatar');
  if (saEl) saEl.textContent = letter;

  var uaEl = document.getElementById('userViewAvatar');
  if (uaEl) uaEl.textContent = letter;

  var uEl = document.getElementById('userViewEmail');
  if (uEl) uEl.textContent = email;

  var lEl = document.getElementById('userViewLastLogin');
  if (lEl) lEl.textContent = lastSign;

  var idEl = document.getElementById('userViewId');
  if (idEl) idEl.textContent = currentUser.id ? currentUser.id.slice(0, 8) + '…' : '—';
}

/* ── Enter key on password field ── */
function loginKeyPress(e) {
  if (e.key === 'Enter') doLogin();
}
