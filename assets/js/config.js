/* ── Application Constants & Defaults ── */

var STORAGE_KEY = 'bms-inv-tracking-v2';

var SB_URL = 'https://fduftnedexdvpokmegay.supabase.co';
var SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZkdWZ0bmVkZXhkdnBva21lZ2F5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5Mzk0ODMsImV4cCI6MjA5NTUxNTQ4M30.lGTF97DvyEyTQWiYpVy-bOZl_bzKBM4jKEZUQnnBttI';

var COLORS = [
  '#3d8ef8','#22c97a','#f5a623','#f04060',
  '#18c8c8','#8870f8','#ff6b6b','#4ecdc4','#45b7d1','#96ceb4'
];

var PROD_COLORS = {
  'HOSxP XE':           '#3d8ef8',
  'ระบบคลังสินค้า':     '#22c97a',
  'ระบบครุภัณฑ์':       '#f5a623',
  'ระบบบัญชี Account':  '#8870f8',
  'IPD Paperless':      '#18c8c8'
};

var TAB_TITLES = {
  timeline:  'Timeline รายสัปดาห์',
  overview:  'ภาพรวมจังหวัด',
  byhosp:    'รายโรงพยาบาล',
  all:       'ปัญหาทั้งหมด',
  hospitals: 'จัดการโรงพยาบาล',
  user:      'ผู้ใช้งาน'
};

var MAP_FIELDS = [
  { key: 'sequence',     label: 'ลำดับ' },
  { key: 'date',         label: 'วันที่รับปัญหา *' },
  { key: 'dept',         label: 'หน่วยงาน' },
  { key: 'topic',        label: 'ปัญหา' },
  { key: 'type',         label: 'กลุ่มปัญหา' },
  { key: 'status',       label: 'สถานะ' },
  { key: 'fixMethod',    label: 'วิธีการแก้ไข' },
  { key: 'reporter',     label: 'ผู้แจ้งปัญหา' },
  { key: 'assignee',     label: 'ผู้รับปัญหา' },
  { key: 'resolver',     label: 'ผู้แก้ไข' },
  { key: 'resolvedDate', label: 'วันที่แก้ไขปัญหา' }
];

function getProdColor(p, i) {
  return PROD_COLORS[p] || COLORS[i % COLORS.length];
}
