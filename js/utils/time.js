// ฟังก์ชันเวลา/วันที่ (pure functions ไม่พึ่ง DOM) ใช้ได้ทั้งใน browser และ Node test

export const pad = (n) => String(n).padStart(2, '0');

/** "09:30" -> 570 */
export function toMin(t) {
  const [h, m] = String(t).split(':').map(Number);
  return h * 60 + (m || 0);
}

/** 570 -> "09:30" */
export const fromMin = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;

/** Date -> "YYYY-MM-DD" (เวลา ICT - Asia/Bangkok) */
export const toDateStr = (d = new Date()) => {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Bangkok',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  // en-CA formats as YYYY-MM-DD
  return formatter.format(d);
};

/** "YYYY-MM-DD" -> Date (เที่ยงคืนเวลาท้องถิ่น - ICT) */
export function parseDate(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(s, n) {
  const d = parseDate(s);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

/** วันจันทร์ของสัปดาห์ที่มีวันที่นี้ */
export function startOfWeek(s) {
  const d = parseDate(s);
  const offset = (d.getDay() + 6) % 7; // จันทร์ = 0
  return addDays(s, -offset);
}

export function formatDate(s, opts) {
  return parseDate(s).toLocaleDateString(
    'th-TH',
    { timeZone: 'Asia/Bangkok', ...(opts || { day: 'numeric', month: 'short', year: 'numeric' }) }
  );
}

export const formatDateLong = (s) =>
  formatDate(s, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

export const formatWeekday = (s) => formatDate(s, { weekday: 'short' });
