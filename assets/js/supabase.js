/* ── Supabase Integration ── */

var sbClient = null;

function initSb() {
  var cfg = null;
  try { cfg = JSON.parse(localStorage.getItem('bms-sb-config') || 'null'); } catch (e) {}
  var url = (cfg && cfg.url) || SB_URL;
  var key = (cfg && cfg.key) || SB_KEY;
  document.getElementById('sbUrl').value = url;
  document.getElementById('sbKey').value = key;
  try {
    sbClient = window.supabase.createClient(url, key);
  } catch (e) {
    toast('Supabase error: ' + e.message, 'error');
    return;
  }
  setSbStatus(true);
  loadAdminPwdFromSb();
  loadColMapFromSb().then(function () {
    loadHospitalsFromSb();
  });
}

function setSbStatus(ok) {
  var dot = document.getElementById('sbStatusDot');
  var txt = document.getElementById('sbStatusText');
  var btn = document.getElementById('sbReloadBtn');
  if (ok) {
    dot.style.background  = '#22c97a';
    dot.style.boxShadow   = '0 0 6px #22c97a80';
    txt.textContent       = 'เชื่อมต่อแล้ว';
    txt.style.color       = '#22c97a';
    if (btn) btn.disabled = false;
  } else {
    dot.style.background  = 'var(--rd)';
    dot.style.boxShadow   = 'none';
    txt.textContent       = 'เชื่อมต่อไม่สำเร็จ';
    txt.style.color       = 'var(--rd)';
    if (btn) btn.disabled = true;
  }
}

function saveSbConfig() {
  var url = document.getElementById('sbUrl').value.trim();
  var key = document.getElementById('sbKey').value.trim();
  if (!url || !key) { toast('กรุณาใส่ Supabase URL และ Anon Key', 'error'); return; }
  localStorage.setItem('bms-sb-config', JSON.stringify({ url: url, key: key }));
  try {
    sbClient = window.supabase.createClient(url, key);
  } catch (e) {
    toast('Supabase error: ' + e.message, 'error');
    return;
  }
  setSbStatus(true);
  toast('เชื่อมต่อ Supabase แล้ว', 'success');
  loadHospitalsFromSb();
}

async function loadHospitalsFromSb() {
  if (!sbClient) return;
  var btn = document.getElementById('sbReloadBtn');
  if (btn) btn.disabled = true;
  var res = await sbClient
    .from('hospital_sheets')
    .select('*')
    .order('hospital_name')
    .order('product');
  if (btn) btn.disabled = false;
  if (res.error) {
    toast('โหลดจาก Supabase ไม่สำเร็จ: ' + res.error.message, 'error');
    setSbStatus(false);
    return;
  }
  hospitals = [];
  allDetectedHeaders = {};
  var rows = res.data || [];
  for (var i = 0; i < rows.length; i++) {
    var row  = rows[i];
    var hosp = null;
    for (var j = 0; j < hospitals.length; j++) {
      if (hospitals[j].name === row.hospital_name) { hosp = hospitals[j]; break; }
    }
    if (!hosp) { hosp = { name: row.hospital_name, sheets: [] }; hospitals.push(hosp); }
    hosp.sheets.push({
      product: row.product,
      url:     row.sheet_url || '',
      gid:     row.gid || '0',
      status:  'wait',
      issues:  []
    });
  }
  renderHospList();
  saveState();
  if (hospitals.length) fetchAll(true);
}

async function saveToSb(name, product, url, gid) {
  if (!sbClient) { toast('กรุณาเชื่อมต่อ Supabase ก่อน', 'error'); return false; }
  var res = await sbClient
    .from('hospital_sheets')
    .upsert(
      { hospital_name: name, product: product, sheet_url: url, gid: gid },
      { onConflict: 'hospital_name,product' }
    );
  if (res.error) { toast('บันทึกไม่สำเร็จ: ' + res.error.message, 'error'); return false; }
  return true;
}

async function loadColMapFromSb() {
  if (!sbClient) return;
  var res = await sbClient
    .from('app_config')
    .select('value')
    .eq('key', 'col_map_settings')
    .maybeSingle();
  if (res.error || !res.data || !res.data.value) return;
  try {
    var cfg = JSON.parse(res.data.value);
    if (cfg.colMap)     colMap     = cfg.colMap;
    if (cfg.statusDone) statusDone = cfg.statusDone;
    if (cfg.statusProg) statusProg = cfg.statusProg;
    if (cfg.statusWait) statusWait = cfg.statusWait;
    saveState();
  } catch (e) {}
}

async function saveColMapToSb() {
  if (!sbClient) return;
  var val = JSON.stringify({ colMap: colMap, statusDone: statusDone, statusProg: statusProg, statusWait: statusWait });
  var res = await sbClient
    .from('app_config')
    .upsert(
      { key: 'col_map_settings', value: val, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );
  if (res.error) toast('บันทึก Column Mapping ไม่สำเร็จ: ' + res.error.message, 'error');
}

async function deleteFromSb(name, product) {
  if (!sbClient) { toast('กรุณาเชื่อมต่อ Supabase ก่อน', 'error'); return false; }
  var res = await sbClient
    .from('hospital_sheets')
    .delete()
    .eq('hospital_name', name)
    .eq('product', product);
  if (res.error) { toast('ลบไม่สำเร็จ: ' + res.error.message, 'error'); return false; }
  return true;
}
