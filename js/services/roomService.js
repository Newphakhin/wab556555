// บริการจัดการข้อมูลห้องปฏิบัติการ (CRUD)
import { db, uid } from '../db.js';
import { toDateStr } from '../utils/time.js';
import { ROOM_STATUS_LABEL } from '../domain/constants.js';

export function validateRoom(input, existing, editingId = null) {
  const e = {};
  if (!String(input.room_name || '').trim()) e.room_name = 'กรุณากรอกชื่อห้อง';
  const code = String(input.room_code || '').trim();
  if (!code) e.room_code = 'กรุณากรอกรหัสห้อง';
  else if (existing.some((r) => r.id !== editingId && r.room_code.toLowerCase() === code.toLowerCase()))
    e.room_code = 'รหัสห้องนี้ถูกใช้แล้ว';
  if (!String(input.location || '').trim()) e.location = 'กรุณากรอกสถานที่';
  const cap = Number(input.capacity);
  if (!Number.isInteger(cap) || cap < 1) e.capacity = 'ความจุต้องเป็นจำนวนเต็มตั้งแต่ 1 ขึ้นไป';
  if (!ROOM_STATUS_LABEL[input.status]) e.status = 'กรุณาเลือกสถานะห้อง';
  return e;
}

function normalize(input) {
  const equipment = Array.isArray(input.equipment)
    ? input.equipment
    : String(input.equipment || '').split(',');
  return {
    room_name: input.room_name.trim(),
    room_code: input.room_code.trim(),
    location: input.location.trim(),
    capacity: Number(input.capacity),
    equipment: equipment.map((s) => s.trim()).filter(Boolean),
    description: String(input.description || '').trim(),
    status: input.status,
  };
}

export const roomService = {
  async list() {
    return await db.getAll('rooms');
  },

  async get(id) {
    return await db.getById('rooms', id);
  },

  async create(input) {
    const rooms = await this.list();
    const errors = validateRoom(input, rooms);
    if (Object.keys(errors).length) return { ok: false, errors };
    const room = { id: uid('room'), ...normalize(input), created_at: new Date().toISOString() };
    await db.put('rooms', room);
    return { ok: true, room };
  },

  async update(id, input) {
    const rooms = await this.list();
    const idx = rooms.findIndex((r) => r.id === id);
    if (idx < 0) return { ok: false, errors: { _form: 'ไม่พบห้องที่ต้องการแก้ไข' } };
    const errors = validateRoom(input, rooms, id);
    if (Object.keys(errors).length) return { ok: false, errors };
    const updatedRoom = { ...rooms[idx], ...normalize(input) };
    await db.put('rooms', updatedRoom);
    return { ok: true, room: updatedRoom };
  },

  /** ลบห้อง — ไม่อนุญาตหากมีการจอง Pending/Approved ตั้งแต่วันนี้เป็นต้นไป */
  async remove(id) {
    const today = toDateStr();
    const bookings = await db.getAll('bookings');
    const active = bookings.filter(
      (b) =>
        b.room_id === id &&
        (b.status === 'Pending' || b.status === 'Approved') &&
        b.booking_date >= today
    );
    if (active.length)
      return { ok: false, error: `ไม่สามารถลบได้ เนื่องจากมีการจองที่ยังใช้งานอยู่ ${active.length} รายการ` };
    
    await db.delete('rooms', id);
    return { ok: true };
  },
};
