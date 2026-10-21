// กฎธุรกิจของระบบจอง (pure functions) — ส่วนสำคัญที่สุดคือการตรวจเวลาทับซ้อน
import { toMin, toDateStr, parseDate } from '../utils/time.js';
import { REQUESTER_TYPES, ROOM_STATUS_LABEL } from './constants.js';

/**
 * ตรวจว่าช่วงเวลา A ทับซ้อนกับช่วงเวลา B หรือไม่ (SRS ข้อ 14)
 *   new_start < existing_end  AND  new_end > existing_start
 * ช่วงที่ "ต่อกันพอดี" เช่น 09:00–11:00 กับ 11:00–12:00 ไม่ถือว่าทับซ้อน
 */
export function isOverlap(newStart, newEnd, existingStart, existingEnd) {
  return toMin(newStart) < toMin(existingEnd) && toMin(newEnd) > toMin(existingStart);
}

/**
 * หารายการจองที่ "Approved" แล้ว ซึ่งทับซ้อนกับคำขอใหม่
 * (ห้องเดียวกัน + วันเดียวกัน + เวลาทับซ้อน). excludeId ใช้ตอนอนุมัติรายการเดิม
 */
export function findConflicts(bookings, { room_id, booking_date, start_time, end_time, excludeId = null }) {
  return bookings.filter(
    (b) =>
      b.status === 'Approved' &&
      b.id !== excludeId &&
      b.room_id === room_id &&
      b.booking_date === booking_date &&
      isOverlap(start_time, end_time, b.start_time, b.end_time)
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * ตรวจความถูกต้องของแบบฟอร์มจอง คืน object { field: ข้อความผิดพลาด } (ว่าง = ผ่าน)
 */
export function validateBooking(input, room, now = new Date()) {
  const e = {};

  if (!input.room_id || !room) e.room_id = 'กรุณาเลือกห้อง';
  else if (room.status !== 'Available')
    e.room_id = `ห้องนี้อยู่ในสถานะ "${ROOM_STATUS_LABEL[room.status] || room.status}" ไม่สามารถจองได้`;

  if (!String(input.requester_name || '').trim()) e.requester_name = 'กรุณากรอกชื่อผู้จอง';

  if (!String(input.requester_email || '').trim()) e.requester_email = 'กรุณากรอกอีเมล';
  else if (!EMAIL_RE.test(input.requester_email.trim())) e.requester_email = 'รูปแบบอีเมลไม่ถูกต้อง';

  if (!REQUESTER_TYPES[input.requester_type]) e.requester_type = 'กรุณาเลือกประเภทผู้จอง';

  if (!input.booking_date) e.booking_date = 'กรุณาเลือกวันที่';
  if (!input.start_time) e.start_time = 'กรุณาเลือกเวลาเริ่มต้น';
  if (!input.end_time) e.end_time = 'กรุณาเลือกเวลาสิ้นสุด';

  if (input.start_time && input.end_time && toMin(input.start_time) >= toMin(input.end_time)) {
    e.end_time = 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น';
  }

  if (input.booking_date) {
    const today = toDateStr(now);
    if (input.booking_date < today) {
      e.booking_date = 'ไม่สามารถจองย้อนหลังได้';
    } else if (input.booking_date === today && input.start_time && !e.end_time) {
      const nowMin = now.getHours() * 60 + now.getMinutes();
      if (toMin(input.start_time) < nowMin) e.start_time = 'เวลาเริ่มต้นผ่านไปแล้ว';
    }
  }

  const n = Number(input.number_of_users);
  if (!Number.isInteger(n) || n < 1) e.number_of_users = 'จำนวนผู้ใช้งานต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป';
  else if (room && n > room.capacity) e.number_of_users = `เกินความจุของห้อง (สูงสุด ${room.capacity} คน)`;

  if (!String(input.purpose || '').trim()) e.purpose = 'กรุณากรอกวัตถุประสงค์การใช้งาน';

  return e;
}

/** วัน-เวลาเริ่มต้นของการจอง (Date) */
export function bookingStart(b) {
  const d = parseDate(b.booking_date);
  d.setMinutes(toMin(b.start_time));
  return d;
}

/** ผู้ใช้ยกเลิกได้เมื่อรายการยัง Pending/Approved และยังไม่ถึงเวลาเริ่ม (SRS ข้อ 7.1) */
export function canUserCancel(b, now = new Date()) {
  return (b.status === 'Pending' || b.status === 'Approved') && bookingStart(b) > now;
}

/** นับจำนวนการจองตามสถานะ */
export function countByStatus(bookings) {
  const out = { total: bookings.length, Pending: 0, Approved: 0, Rejected: 0, Cancelled: 0 };
  for (const b of bookings) if (b.status in out) out[b.status]++;
  return out;
}
