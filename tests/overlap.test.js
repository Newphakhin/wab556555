// ทดสอบ logic หลัก: การตรวจเวลาทับซ้อน + validation (รัน: node tests/overlap.test.js)
import assert from 'node:assert/strict';
import { isOverlap, findConflicts, validateBooking, canUserCancel, countByStatus } from '../js/domain/rules.js';

let passed = 0;
const test = (name, fn) => {
  fn();
  passed++;
  console.log('  ✓', name);
};

console.log('isOverlap — ตัวอย่างตาม SRS ข้อ 14');
test('09:00–11:00 vs 10:00–12:00 => ซ้ำซ้อน', () => assert.equal(isOverlap('10:00', '12:00', '09:00', '11:00'), true));
test('09:00–11:00 vs 08:00–09:30 => ซ้ำซ้อน', () => assert.equal(isOverlap('08:00', '09:30', '09:00', '11:00'), true));
test('09:00–11:00 vs 11:00–12:00 => ไม่ซ้ำซ้อน (ต่อกันพอดี)', () => assert.equal(isOverlap('11:00', '12:00', '09:00', '11:00'), false));
test('13:00–15:00 vs 09:00–12:00 => ไม่ซ้ำซ้อน', () => assert.equal(isOverlap('09:00', '12:00', '13:00', '15:00'), false));

console.log('isOverlap — กรณีขอบ');
test('เวลาเหมือนกันทุกประการ => ซ้ำซ้อน', () => assert.equal(isOverlap('09:00', '11:00', '09:00', '11:00'), true));
test('ช่วงใหม่ครอบช่วงเดิม => ซ้ำซ้อน', () => assert.equal(isOverlap('08:00', '12:00', '09:00', '11:00'), true));
test('ช่วงใหม่อยู่ภายในช่วงเดิม => ซ้ำซ้อน', () => assert.equal(isOverlap('09:30', '10:30', '09:00', '11:00'), true));
test('ต่อกันพอดีด้านหน้า (08:00–09:00 vs 09:00–11:00) => ไม่ซ้ำซ้อน', () => assert.equal(isOverlap('08:00', '09:00', '09:00', '11:00'), false));
test('เปรียบเทียบเป็นตัวเลข ไม่ใช่สตริง (9:30 vs 10:00)', () => assert.equal(isOverlap('09:30', '10:00', '10:00', '11:00'), false));

console.log('findConflicts');
const bookings = [
  { id: 'a', room_id: 'r1', booking_date: '2030-01-10', start_time: '09:00', end_time: '11:00', status: 'Approved' },
  { id: 'b', room_id: 'r1', booking_date: '2030-01-10', start_time: '13:00', end_time: '15:00', status: 'Pending' },
  { id: 'c', room_id: 'r2', booking_date: '2030-01-10', start_time: '09:00', end_time: '11:00', status: 'Approved' },
  { id: 'd', room_id: 'r1', booking_date: '2030-01-11', start_time: '09:00', end_time: '11:00', status: 'Approved' },
  { id: 'e', room_id: 'r1', booking_date: '2030-01-10', start_time: '16:00', end_time: '17:00', status: 'Cancelled' },
];
const q = (o) => ({ room_id: 'r1', booking_date: '2030-01-10', start_time: '10:00', end_time: '12:00', ...o });
test('ชนกับรายการ Approved ในห้อง/วันเดียวกัน', () => assert.deepEqual(findConflicts(bookings, q()).map((b) => b.id), ['a']));
test('ไม่นับรายการ Pending', () => assert.equal(findConflicts(bookings, q({ start_time: '13:30', end_time: '14:00' })).length, 0));
test('ไม่นับรายการ Cancelled', () => assert.equal(findConflicts(bookings, q({ start_time: '16:00', end_time: '17:00' })).length, 0));
test('ห้องอื่นไม่ชน', () => assert.deepEqual(findConflicts(bookings, q({ room_id: 'r3' })), []));
test('วันอื่นไม่ชน', () => assert.deepEqual(findConflicts(bookings, q({ booking_date: '2030-01-12' })), []));
test('excludeId ข้ามรายการตัวเอง', () => assert.deepEqual(findConflicts(bookings, q({ excludeId: 'a' })), []));

console.log('validateBooking');
const room = { id: 'r1', capacity: 20, status: 'Available' };
const good = {
  room_id: 'r1', requester_name: 'ทดสอบ', requester_email: 'a@b.co', requester_type: 'Student',
  booking_date: '2030-01-10', start_time: '09:00', end_time: '10:00', number_of_users: 10, purpose: 'เรียน',
};
const now = new Date(2030, 0, 1, 12, 0);
test('ข้อมูลถูกต้อง => ไม่มี error', () => assert.deepEqual(validateBooking(good, room, now), {}));
test('เวลาเริ่ม >= เวลาสิ้นสุด', () => assert.ok(validateBooking({ ...good, start_time: '10:00', end_time: '10:00' }, room, now).end_time));
test('ห้อง Maintenance จองไม่ได้', () => assert.ok(validateBooking(good, { ...room, status: 'Maintenance' }, now).room_id));
test('ห้อง Closed จองไม่ได้', () => assert.ok(validateBooking(good, { ...room, status: 'Closed' }, now).room_id));
test('จำนวนคนเกินความจุ', () => assert.ok(validateBooking({ ...good, number_of_users: 21 }, room, now).number_of_users));
test('จำนวนคน 0 ไม่ผ่าน', () => assert.ok(validateBooking({ ...good, number_of_users: 0 }, room, now).number_of_users));
test('จองย้อนหลังไม่ได้', () => assert.ok(validateBooking({ ...good, booking_date: '2029-12-31' }, room, now).booking_date));
test('วันนี้แต่เวลาเริ่มผ่านไปแล้ว', () => assert.ok(validateBooking({ ...good, booking_date: '2030-01-01', start_time: '09:00', end_time: '10:00' }, room, now).start_time));
test('อีเมลผิดรูปแบบ', () => assert.ok(validateBooking({ ...good, requester_email: 'abc' }, room, now).requester_email));
test('ฟิลด์ว่างทั้งหมด => error หลายฟิลด์', () => assert.ok(Object.keys(validateBooking({}, room, now)).length >= 6));

console.log('canUserCancel / countByStatus');
const future = { status: 'Pending', booking_date: '2030-01-10', start_time: '09:00' };
test('ยกเลิกได้ก่อนถึงเวลา', () => assert.equal(canUserCancel(future, now), true));
test('ยกเลิกไม่ได้เมื่อเลยเวลาเริ่ม', () => assert.equal(canUserCancel({ ...future, booking_date: '2029-12-31' }, now), false));
test('ยกเลิกไม่ได้เมื่อ Rejected', () => assert.equal(canUserCancel({ ...future, status: 'Rejected' }, now), false));
test('นับตามสถานะ', () => assert.deepEqual(countByStatus(bookings), { total: 5, Pending: 1, Approved: 3, Rejected: 0, Cancelled: 1 }));

console.log(`\nผ่านทั้งหมด ${passed} เทสต์`);
