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
  trackVisit();
  loadAdminPwdFromSb();
  loadColMapFromSb().then(function () {
    loadHospitalsFromSb();
  });
}

/* ── Visit Counter ── */

async function trackVisit() {
  if (!sbClient) return;
  try {
    var today   = new Date().toISOString().slice(0, 10);
    var newVisit = (localStorage.getItem('bms-last-track') !== today);

    var res = await sbClient
      .from('app_config')
      .select('key, value')
      .in('key', ['visit_count', 'visit_today', 'visit_date']);

    var map = {};
    if (res.data) res.data.forEach(function (r) { map[r.key] = r.value; });

    var total      = parseInt(map['visit_count'] || '0') + 1;
    var prevDate   = map['visit_date'] || '';
    var todayCnt   = (prevDate === today ? parseInt(map['visit_today'] || '0') : 0);
    if (newVisit) {
      todayCnt++;
      localStorage.setItem('bms-last-track', today);
    }

    await sbClient.from('app_config').upsert([
      { key: 'visit_count', value: String(total),    updated_at: new Date().toISOString() },
      { key: 'visit_today', value: String(todayCnt), updated_at: new Date().toISOString() },
      { key: 'visit_date',  value: today,            updated_at: new Date().toISOString() }
    ], { onConflict: 'key' });

    _renderVisitStats(total, todayCnt, today);
  } catch (e) {}
}

function _renderVisitStats(total, todayCnt, date) {
  var el = document.getElementById('visitStats');
  if (!el) return;
  var thDate = new Date(date).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' });
  el.innerHTML =
    '<div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-end">'
    + '<div><div style="font-size:32px;font-weight:700;font-family:var(--mono);color:var(--ac);line-height:1">' + total.toLocaleString() + '</div>'
    + '<div style="font-size:10px;color:var(--tx3);font-family:var(--mono);letter-spacing:.07em;text-transform:uppercase;margin-top:3px">ครั้งทั้งหมด</div></div>'
    + '<div><div style="font-size:32px;font-weight:700;font-family:var(--mono);color:var(--gr);line-height:1">' + todayCnt + '</div>'
    + '<div style="font-size:10px;color:var(--tx3);font-family:var(--mono);letter-spacing:.07em;text-transform:uppercase;margin-top:3px">วันนี้ (' + thDate + ')</div></div>'
    + '</div>';
  var foot = document.getElementById('visitFooter');
  if (foot) foot.textContent = total.toLocaleString() + ' ครั้ง';
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
