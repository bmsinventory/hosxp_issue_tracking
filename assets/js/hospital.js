/* ── Hospital Management ── */

var pendingProducts = [];
var editingSheet    = null;

/* ── Edit Sheet (inline) ── */

function toggleEditSheet(hi, si) {
  editingSheet = (editingSheet && editingSheet.hi === hi && editingSheet.si === si)
    ? null
    : { hi: hi, si: si };
  renderHospList();
}

function cancelEditSheet() {
  editingSheet = null;
  renderHospList();
}

function autoFillEditGid(url, gidId) {
  var m = url.match(/[#?&]gid=(\d+)/);
  if (m) { var el = document.getElementById(gidId); if (el) el.value = m[1]; }
}

async function saveEditedSheet(hi, si) {
  var urlEl = document.getElementById('editUrl_' + hi + '_' + si);
  var gidEl = document.getElementById('editGid_' + hi + '_' + si);
  if (!urlEl) return;
  var newUrl = urlEl.value.trim();
  var newGid = gidEl ? (gidEl.value.trim() || '0') : '0';
  var h = hospitals[hi], sh = h.sheets[si];
  var saved = await saveToSb(h.name, sh.product, newUrl, newGid);
  if (!saved) return;
  sh.url = newUrl;
  sh.gid = newGid;
  editingSheet = null;
  renderHospList();
  saveState();
  toast('อัปเดตลิงก์ ' + sh.product + ' แล้ว', 'success');
}

/* ── Add Product (pending flow) ── */

function autoFillGid(url) {
  var m = url.match(/[#?&]gid=(\d+)/);
  if (m) document.getElementById('sheetGid').value = m[1];
}

function onHospNameInput() {
  if (pendingProducts.length > 0) renderPendingList();
}

function stagePendingProduct() {
  var name    = document.getElementById('hospName').value.trim();
  var product = document.getElementById('hospProduct').value.trim();
  var url     = document.getElementById('sheetUrl').value.trim();
  var gid     = document.getElementById('sheetGid').value.trim() || '0';

  if (!name)    { toast('กรุณาใส่ชื่อโรงพยาบาล', 'error'); return; }
  if (!product) { toast('กรุณาเลือก Product',    'error'); return; }

  for (var i = 0; i < pendingProducts.length; i++) {
    if (pendingProducts[i].product === product) { toast('เพิ่ม ' + product + ' ซ้ำแล้ว', 'error'); return; }
  }
  for (var i = 0; i < hospitals.length; i++) {
    if (hospitals[i].name === name) {
      for (var j = 0; j < hospitals[i].sheets.length; j++) {
        if (hospitals[i].sheets[j].product === product) {
          toast(name + ' มี ' + product + ' อยู่แล้ว', 'error'); return;
        }
      }
    }
  }

  pendingProducts.push({ product: product, url: url, gid: gid });
  document.getElementById('hospProduct').value = '';
  document.getElementById('sheetUrl').value    = '';
  document.getElementById('sheetGid').value    = '0';
  renderPendingList();
  toast('เพิ่ม ' + product + ' ในรายการ กด "บันทึกทั้งหมด" เพื่อบันทึก', '');
}

function renderPendingList() {
  var name = document.getElementById('hospName').value.trim();
  var box  = document.getElementById('pendingBox');
  var list = document.getElementById('pendingList');
  var cnt  = document.getElementById('pendingCount');
  if (!pendingProducts.length) { box.style.display = 'none'; return; }
  box.style.display = 'block';
  cnt.textContent   = pendingProducts.length;
  var html = '';
  for (var i = 0; i < pendingProducts.length; i++) {
    var p   = pendingProducts[i];
    var col = PROD_COLORS[p.product] || '#8899bb';
    html += '<div style="display:flex;align-items:center;gap:10px;background:var(--bg4);border:1px solid var(--bdr);border-radius:6px;padding:8px 12px">';
    html += '<span style="width:10px;height:10px;border-radius:50%;background:' + col + ';flex-shrink:0;display:inline-block"></span>';
    if (name) html += '<span style="font-size:12px;color:var(--tx3);font-family:var(--mono)">' + escHtml(name) + '</span><span style="color:var(--tx3)">›</span>';
    html += '<span style="font-size:13px;font-weight:600;color:var(--tx)">' + escHtml(p.product) + '</span>';
    if (p.url) html += '<span style="font-size:11px;font-family:var(--mono);color:var(--tx3);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0">' + escHtml(p.url.replace('https://docs.google.com/spreadsheets/d/', '…/')) + '</span>';
    else       html += '<span style="font-size:11px;font-family:var(--mono);color:var(--tx3);flex:1">— ไม่มีลิงก์ —</span>';
    html += '<span style="font-size:10px;font-family:var(--mono);color:var(--tx3)">GID:' + escHtml(p.gid) + '</span>';
    html += '<button class="btn btn-danger btn-sm btn-icon" onclick="removePending(' + i + ')" title="ลบออก"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
    html += '</div>';
  }
  list.innerHTML = html;
}

function removePending(i) {
  pendingProducts.splice(i, 1);
  renderPendingList();
}

function clearPending() {
  pendingProducts = [];
  renderPendingList();
}

async function saveAllPending() {
  var name = document.getElementById('hospName').value.trim();
  if (!name)                  { toast('กรุณาใส่ชื่อโรงพยาบาล', 'error'); return; }
  if (!pendingProducts.length){ toast('ยังไม่มี Product ในรายการ', 'error'); return; }

  var btn = document.getElementById('saveAllBtn');
  btn.disabled    = true;
  btn.textContent = 'กำลังบันทึก…';

  var hosp = null;
  for (var i = 0; i < hospitals.length; i++) if (hospitals[i].name === name) { hosp = hospitals[i]; break; }
  if (!hosp) { hosp = { name: name, sheets: [] }; hospitals.push(hosp); }

  var ok = 0, fail = 0;
  for (var i = 0; i < pendingProducts.length; i++) {
    var p     = pendingProducts[i];
    var saved = await saveToSb(name, p.product, p.url, p.gid);
    if (saved) { hosp.sheets.push({ product: p.product, url: p.url, gid: p.gid, status: 'wait', issues: [] }); ok++; }
    else fail++;
  }

  btn.disabled  = false;
  btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><polyline points="20 6 9 17 4 12"/></svg> บันทึกทั้งหมด';

  if (ok > 0) {
    pendingProducts = [];
    renderPendingList();
    document.getElementById('hospProduct').value = '';
    document.getElementById('sheetUrl').value    = '';
    document.getElementById('sheetGid').value    = '0';
    renderHospList();
    saveState();
    toast('บันทึก ' + name + ' — ' + ok + ' Product สำเร็จ' + (fail > 0 ? ' (ล้มเหลว ' + fail + ')' : ''), 'success');
  }
}

async function removeSheet(hi, si) {
  var h  = hospitals[hi];
  var sh = h.sheets[si];
  var deleted = await deleteFromSb(h.name, sh.product);
  if (!deleted) return;
  var key = h.name + '|' + sh.product;
  delete allDetectedHeaders[key];
  allIssues = allIssues.filter(function (x) {
    return !(x.hospital === h.name && x.product === sh.product);
  });
  h.sheets.splice(si, 1);
  if (h.sheets.length === 0) hospitals.splice(hi, 1);
  renderHospList();
  updateMetrics();
  saveState();
  toast('ลบ ' + h.name + ' — ' + (sh.product || 'Sheet') + ' แล้ว', '');
}

/* ── Render Hospital List ── */

function renderHospList() {
  var el          = document.getElementById('hospList');
  var totalSheets = 0;
  for (var i = 0; i < hospitals.length; i++) totalSheets += hospitals[i].sheets.length;
  document.getElementById('hospCount').textContent  = hospitals.length;
  document.getElementById('sheetCount').textContent = totalSheets;

  var dl = document.getElementById('hospNameList');
  if (dl) {
    var dlh = '';
    for (var i = 0; i < hospitals.length; i++) dlh += '<option value="' + hospitals[i].name + '">';
    dl.innerHTML = dlh;
  }

  if (!hospitals.length) {
    el.innerHTML = '<div class="empty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>ยังไม่มีโรงพยาบาล</div>';
    return;
  }

  var html = '';
  for (var i = 0; i < hospitals.length; i++) {
    var h = hospitals[i];
    var totalIss = 0, totalOpen = 0;
    for (var j = 0; j < h.sheets.length; j++) {
      for (var k = 0; k < h.sheets[j].issues.length; k++) {
        totalIss++;
        var st = h.sheets[j].issues[k].status;
        if (st === 'รอดำเนินการ' || st === 'รอตอบกลับ') totalOpen++;
      }
    }
    html += '<div style="background:var(--bg3);border:1px solid var(--bdr);border-radius:var(--r);margin-bottom:10px;overflow:hidden">';
    html += '<div style="padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid var(--bdr)">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="color:var(--tx3)"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg>';
    html += '<span style="font-weight:600;color:var(--tx);font-size:14px">' + h.name + '</span>';
    html += '<span style="font-size:11px;font-family:var(--mono);color:var(--tx3)">' + h.sheets.length + ' Product</span>';
    if (totalIss > 0)  html += '<span style="font-size:11px;font-family:var(--mono);color:var(--tx3)">'   + totalIss  + ' รายการ</span>';
    if (totalOpen > 0) html += '<span style="font-size:11px;font-family:var(--mono);color:var(--rd)">'    + totalOpen + ' รอ</span>';
    html += '</div>';

    for (var j = 0; j < h.sheets.length; j++) {
      var sh      = h.sheets[j];
      var open    = 0, done = 0;
      for (var k = 0; k < sh.issues.length; k++) {
        if (sh.issues[k].status === 'รอดำเนินการ' || sh.issues[k].status === 'รอตอบกลับ') open++;
        if (sh.issues[k].status === 'เสร็จแล้ว') done++;
      }
      var rate = sh.issues.length ? Math.round(done / sh.issues.length * 100) : 0;
      var statTxt = '';
      if      (sh.status === 'ok')      statTxt = '<span style="color:var(--tx3)">' + sh.issues.length + ' รายการ</span><span style="color:' + (open > 0 ? 'var(--rd)' : 'var(--gr)') + '">' + (open > 0 ? open + ' รอ' : 'ครบ') + '</span><span style="color:var(--tx3)">' + rate + '%</span>';
      else if (sh.status === 'loading') statTxt = '<span style="color:var(--am)">กำลังโหลด...</span>';
      else if (sh.status === 'error')   statTxt = '<span style="color:var(--rd)">ดึงไม่ได้</span>';
      else                              statTxt = '<span style="color:var(--tx3)">รอดึงข้อมูล</span>';

      var urlTxt    = sh.url || '(ยังไม่ได้ใส่ลิงก์)';
      var isEditing = (editingSheet && editingSheet.hi === i && editingSheet.si === j);

      html += '<div class="sheet-row">';
      html += '<div class="hosp-dot ' + sh.status + '"></div>';
      html += '<span class="prod-badge">' + sh.product + '</span>';
      html += '<span style="font-size:11px;color:var(--tx3);font-family:var(--mono);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + escHtml(sh.url) + '">' + escHtml(urlTxt.replace('https://docs.google.com/spreadsheets/d/', '…/spreadsheets/d/')) + '</span>';
      html += '<div style="display:flex;gap:8px;font-size:11px;font-family:var(--mono);white-space:nowrap">' + statTxt + '</div>';
      html += '<button class="btn btn-sm btn-icon" onclick="toggleEditSheet(' + i + ',' + j + ')" title="แก้ไขลิงก์"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg></button>';
      html += '<button class="btn btn-danger btn-sm btn-icon" onclick="removeSheet(' + i + ',' + j + ')" title="ลบ"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>';
      html += '</div>';

      if (isEditing) {
        html += '<div class="sheet-edit-row">';
        html += '<div class="field" style="flex:1;min-width:200px"><label>ลิงก์ Google Sheets</label><input id="editUrl_' + i + '_' + j + '" value="' + escHtml(sh.url) + '" oninput="autoFillEditGid(this.value,\'editGid_' + i + '_' + j + '\')" style="font-size:12px"></div>';
        html += '<div class="field" style="width:80px"><label>GID</label><input id="editGid_' + i + '_' + j + '" value="' + escHtml(sh.gid || '0') + '" style="font-size:12px"></div>';
        html += '<button class="btn btn-primary btn-sm" onclick="saveEditedSheet(' + i + ',' + j + ')" style="height:34px;white-space:nowrap">บันทึก</button>';
        html += '<button class="btn btn-sm" onclick="cancelEditSheet()" style="height:34px">ยกเลิก</button>';
        html += '</div>';
      }
    }
    html += '</div>';
  }
  el.innerHTML = html;
}
