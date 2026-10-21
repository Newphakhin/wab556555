// ทดสอบ service layer ด้วย IndexedDB และ LocalStorage จำลอง (รัน: node tests/service.test.js)
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => mem.set(k, String(v)),
  removeItem: (k) => mem.delete(k),
  key: (i) => [...mem.keys()][i],
  get length() { return mem.size; },
};

// จำลอง IndexedDB สำหรับทดสอบใน Node.js
const idbStores = new Map();
function makeReq(fn) {
  const req = { result: undefined, error: null, onsuccess: null, onerror: null };
  queueMicrotask(() => {
    try {
      req.result = fn();
      if (req.onsuccess) req.onsuccess({ target: req });
    } catch (err) {
      req.error = err;
      if (req.onerror) req.onerror({ target: req });
    }
  });
  return req;
}

const mockDB = {
  objectStoreNames: { contains: (name) => idbStores.has(name) },
  createObjectStore(name) {
    if (!idbStores.has(name)) idbStores.set(name, new Map());
    return { createIndex() {} };
  },
  transaction(storeName) {
    if (!idbStores.has(storeName)) idbStores.set(storeName, new Map());
    const map = idbStores.get(storeName);
    return {
      objectStore: () => ({
        getAll: () => makeReq(() => [...map.values()]),
        get: (id) => makeReq(() => map.get(id)),
        put: (item) => makeReq(() => { map.set(item.id, structuredClone(item)); return item; }),
        delete: (id) => makeReq(() => { map.delete(id); }),
        count: () => makeReq(() => map.size),
      }),
    };
  },
};

globalThis.indexedDB = {
  open() {
    const req = { result: mockDB, onupgradeneeded: null, onsuccess: null, onerror: null };
    queueMicrotask(() => {
      if (req.onupgradeneeded) req.onupgradeneeded({ target: req });
      if (req.onsuccess) req.onsuccess({ target: req });
    });
    return req;
  },
};

const { resetSeed } = await import('../js/seed.js');
const { bookingService } = await import('../js/services/bookingService.js');
const { roomService } = await import('../js/services/roomService.js');
const { addDays, toDateStr } = await import('../js/utils/time.js');

let passed = 0;
const test = async (name, fn) => {
  await resetSeed();
  await fn();
  passed++;
  console.log('  ✓', name);
};

const future = addDays(toDateStr(), 20);
const base = {
  room_id: 'room-ce1', requester_name: 'ทดสอบ', requester_email: 'somchai@ksu.ac.th', requester_type: 'Student',
  booking_date: future, start_time: '09:00', end_time: '11:00', number_of_users: 10, purpose: 'ทดสอบระบบ',
};

console.log('seed');
await test('มีห้อง >= 3 และการจอง >= 10', async () => {
  assert.ok((await roomService.list()).length >= 3);
  assert.ok((await bookingService.list()).length >= 10);
});
await test('ข้อมูลตัวอย่างไม่มี Approved ทับซ้อนกันเอง', async () => {
  const ap = (await bookingService.list()).filter((b) => b.status === 'Approved');
  for (const b of ap) {
    assert.equal((await bookingService.conflicts({ ...b, excludeId: b.id })).length, 0, b.id);
  }
});

console.log('create');
await test('จองสำเร็จ => สถานะ Pending', async () => {
  const r = await bookingService.create(base);
  assert.equal(r.ok, true);
  assert.equal(r.booking.status, 'Pending');
});
await test('จองชนกับ Approved => ถูกปฏิเสธ', async () => {
  const first = await bookingService.create(base);
  assert.equal((await bookingService.approve(first.booking.id)).ok, true);
  const r = await bookingService.create({ ...base, start_time: '10:00', end_time: '12:00', requester_name: 'อีกคน' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.start_time);
});
await test('จองต่อกันพอดีหลัง Approved => สำเร็จ', async () => {
  const first = await bookingService.create(base);
  await bookingService.approve(first.booking.id);
  assert.equal((await bookingService.create({ ...base, start_time: '11:00', end_time: '12:00' })).ok, true);
});
await test('จองซ้อนกับ Pending ได้ (ยังไม่อนุมัติ)', async () => {
  await bookingService.create(base);
  assert.equal((await bookingService.create({ ...base, start_time: '10:00', end_time: '12:00' })).ok, true);
});

console.log('approve / reject / cancel');
await test('อนุมัติรายการที่ชนกับ Approved ไม่ได้', async () => {
  const a = (await bookingService.create(base)).booking;
  const b = (await bookingService.create({ ...base, start_time: '10:00', end_time: '12:00' })).booking;
  assert.equal((await bookingService.approve(a.id)).ok, true);
  const r = await bookingService.approve(b.id);
  assert.equal(r.ok, false);
  assert.equal((await bookingService.get(b.id)).status, 'Pending');
});
await test('ปฏิเสธต้องมีเหตุผล', async () => {
  const a = (await bookingService.create(base)).booking;
  assert.equal((await bookingService.reject(a.id, '  ')).ok, false);
  const r = await bookingService.reject(a.id, 'ห้องไม่ว่าง');
  assert.equal(r.ok, true);
  assert.equal(r.booking.status, 'Rejected');
  assert.equal(r.booking.admin_comment, 'ห้องไม่ว่าง');
});
await test('User ยกเลิกของตนเองได้', async () => {
  const a = (await bookingService.create(base)).booking;
  assert.equal((await bookingService.cancel(a.id, { email: base.requester_email })).ok, true);
  assert.equal((await bookingService.get(a.id)).status, 'Cancelled');
});
await test('User ยกเลิกของคนอื่นไม่ได้', async () => {
  const a = (await bookingService.create(base)).booking;
  assert.equal((await bookingService.cancel(a.id, { email: 'other@ksu.ac.th' })).ok, false);
});
await test('Admin ยกเลิกรายการที่ Approved ได้', async () => {
  const a = (await bookingService.create(base)).booking;
  await bookingService.approve(a.id);
  assert.equal((await bookingService.cancel(a.id, { by: 'admin' })).ok, true);
});
await test('หลังยกเลิก Approved แล้ว ช่วงเวลานั้นจองใหม่ได้', async () => {
  const a = (await bookingService.create(base)).booking;
  await bookingService.approve(a.id);
  await bookingService.cancel(a.id, { by: 'admin' });
  assert.equal((await bookingService.create(base)).ok, true);
});

console.log('search / rooms');
await test('กรองตามสถานะ', async () => {
  const r = await bookingService.search({ status: 'Pending' });
  assert.ok(r.length > 0 && r.every((b) => b.status === 'Pending'));
});
await test('ค้นหาด้วยข้อความ', async () => {
  assert.ok((await bookingService.search({ q: 'cisco' })).length >= 1);
});
await test('กรองตามห้อง + สถานะ', async () => {
  const r = await bookingService.search({ room_id: 'room-net', status: 'Approved' });
  assert.ok(r.every((b) => b.room_id === 'room-net' && b.status === 'Approved'));
});
await test('จองห้อง Maintenance ไม่ได้', async () => {
  const room = await roomService.get('room-ce1');
  await roomService.update('room-ce1', { ...room, status: 'Maintenance' });
  assert.equal((await bookingService.create(base)).ok, false);
});
await test('ลบห้องที่มีการจองที่ยังใช้งานไม่ได้', async () => {
  assert.equal((await roomService.remove('room-ce1')).ok, false);
});
await test('เพิ่ม/แก้ไข/ลบห้องใหม่', async () => {
  const c = await roomService.create({ room_name: 'ห้องทดสอบ', room_code: 'TEST-01', location: 'ชั้น 1', capacity: 5, equipment: 'PC, TV', status: 'Available' });
  assert.equal(c.ok, true);
  assert.deepEqual(c.room.equipment, ['PC', 'TV']);
  assert.equal((await roomService.update(c.room.id, { ...c.room, capacity: 8 })).room.capacity, 8);
  assert.equal((await roomService.remove(c.room.id)).ok, true);
});
await test('รหัสห้องซ้ำไม่ได้', async () => {
  const r = await roomService.create({ room_name: 'x', room_code: 'ce-lab-01', location: 'x', capacity: 5, status: 'Available' });
  assert.equal(r.ok, false);
  assert.ok(r.errors.room_code);
});

console.log(`\nผ่านทั้งหมด ${passed} เทสต์`);
