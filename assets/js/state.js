/* ── Global State ── */

var hospitals            = [];
var allIssues            = [];
var charts               = {};
var lastDetectedHeaders  = [];
var lastDetectedStatuses = [];
var allDetectedHeaders   = {};

var colMap = {
  sequence:     'ลำดับ',
  date:         'วันที่รับปัญหา',
  dept:         'หน่วยงาน',
  topic:        'ปัญหา',
  type:         'กลุ่มปัญหา',
  status:       'สถานะ',
  fixMethod:    'วิธีการแก้ไข',
  reporter:     'ผู้แจ้งปัญหา',
  assignee:     'ผู้รับปัญหา',
  resolver:     'ผู้แก้ไข',
  resolvedDate: 'วันที่แก้ไขปัญหา'
};

var statusDone = 'เสร็จแล้ว,Closed,Done,Resolved,แก้ไขแล้ว';
var statusProg = 'กำลังแก้ไข,In Progress,กำลังดำเนินการ,Processing';
var statusWait = 'รอตอบกลับ,Pending,waiting,Hold,On Hold';

/* ── Persistence ── */

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      hospitals:   hospitals,
      colMap:      colMap,
      statusDone:  statusDone,
      statusProg:  statusProg,
      statusWait:  statusWait
    }));
  } catch (e) {}
}

function loadState() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    var data = JSON.parse(raw);
    if (Array.isArray(data.hospitals)) {
      hospitals = data.hospitals;
      // backward-compat: old format {name,url,gid,status,issues}
      for (var i = 0; i < hospitals.length; i++) {
        if (!hospitals[i].sheets) {
          hospitals[i].sheets = [{
            product: '',
            url:     hospitals[i].url    || '',
            gid:     hospitals[i].gid    || '0',
            status:  hospitals[i].status || 'wait',
            issues:  hospitals[i].issues || []
          }];
        }
      }
    }
    if (data.colMap)     colMap     = data.colMap;
    if (data.statusDone) statusDone = data.statusDone;
    if (data.statusProg) statusProg = data.statusProg;
    if (data.statusWait) statusWait = data.statusWait;
  } catch (e) {
    hospitals = [];
  }
}
