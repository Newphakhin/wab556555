// บริการจัดการการจอง: สร้าง ตรวจซ้ำซ้อน อนุมัติ ปฏิเสธ ยกเลิก ค้นหา/กรอง
import { db, uid } from '../db.js';
import { roomService } from './roomService.js';
import { validateBooking, findConflicts, canUserCancel, countByStatus } from '../domain/rules.js';

function conflictMessage(conflicts) {
  const c = conflicts[0];
  return `ช่วงเวลานี้ทับซ้อนกับรายการที่อนุมัติแล้ว (${c.start_time}–${c.end_time} โดย ${c.requester_name})`;
}

export const bookingService = {
  async list() {
    return await db.getAll('bookings');
  },

  async get(id) {
    return await db.getById('bookings', id);
  },

  /** รายการที่ Approved แล้วและทับซ้อนกับช่วงเวลาที่ระบุ */
  async conflicts(query) {
    return findConflicts(await this.list(), query);
  },

  /** สร้างคำขอจอง: validate -> ตรวจทับซ้อน -> บันทึกเป็น Pending */
  async create(input) {
    const room = await roomService.get(input.room_id);
    const errors = validateBooking(input, room);
    if (Object.keys(errors).length) return { ok: false, errors };

    const conflicts = findConflicts(await this.list(), input);
    if (conflicts.length) {
      return { ok: false, errors: { start_time: conflictMessage(conflicts) }, conflicts };
    }

    const now = new Date().toISOString();
    const booking = {
      id: uid('bk'),
      room_id: input.room_id,
      requester_name: input.requester_name.trim(),
      requester_email: input.requester_email.trim(),
      requester_type: input.requester_type,
      booking_date: input.booking_date,
      start_time: input.start_time,
      end_time: input.end_time,
      purpose: input.purpose.trim(),
      number_of_users: Number(input.number_of_users),
      status: 'Pending',
      admin_comment: '',
      created_at: now,
      updated_at: now,
    };
    
    await db.put('bookings', booking);
    return { ok: true, booking };
  },

  async _update(id, patch) {
    const b = await this.get(id);
    if (!b) return null;
    const updated = { ...b, ...patch, updated_at: new Date().toISOString() };
    await db.put('bookings', updated);
    return updated;
  },

  /** Admin อนุมัติ — ตรวจทับซ้อนซ้ำอีกครั้ง เพราะอาจมีรายการอื่นถูกอนุมัติไปก่อนแล้ว */
  async approve(id) {
    const b = await this.get(id);
    if (!b) return { ok: false, error: 'ไม่พบรายการจอง' };
    if (b.status !== 'Pending') return { ok: false, error: 'อนุมัติได้เฉพาะรายการที่รออนุมัติ' };
    const conflicts = findConflicts(await this.list(), { ...b, excludeId: b.id });
    if (conflicts.length) return { ok: false, error: conflictMessage(conflicts) };
    const updated = await this._update(id, { status: 'Approved', admin_comment: '' });
    return { ok: true, booking: updated };
  },

  /** Admin ปฏิเสธ — ต้องระบุเหตุผล (FR-12) */
  async reject(id, reason) {
    const b = await this.get(id);
    if (!b) return { ok: false, error: 'ไม่พบรายการจอง' };
    if (b.status !== 'Pending') return { ok: false, error: 'ปฏิเสธได้เฉพาะรายการที่รออนุมัติ' };
    if (!String(reason || '').trim()) return { ok: false, error: 'กรุณาระบุเหตุผลในการปฏิเสธ' };
    const updated = await this._update(id, { status: 'Rejected', admin_comment: reason.trim() });
    return { ok: true, booking: updated };
  },

  /**
   * ยกเลิกการจอง
   *  - Admin: ยกเลิกได้ทุกรายการที่ Pending/Approved
   *  - User: ยกเลิกได้เฉพาะของตนเอง (ตามอีเมล) และต้องยังไม่ถึงเวลาเริ่ม
   */
  async cancel(id, { by = 'user', email = '', comment = '' } = {}) {
    const b = await this.get(id);
    if (!b) return { ok: false, error: 'ไม่พบรายการจอง' };
    if (b.status !== 'Pending' && b.status !== 'Approved')
      return { ok: false, error: 'ยกเลิกได้เฉพาะรายการที่รออนุมัติหรืออนุมัติแล้ว' };
    if (by !== 'admin') {
      if (b.requester_email.toLowerCase() !== String(email).toLowerCase())
        return { ok: false, error: 'ไม่สามารถยกเลิกรายการของผู้อื่นได้' };
      if (!canUserCancel(b)) return { ok: false, error: 'ไม่สามารถยกเลิกได้ เนื่องจากถึงเวลาเริ่มใช้งานแล้ว' };
    }
    const note = by === 'admin' ? String(comment).trim() || 'ยกเลิกโดยผู้ดูแลระบบ' : 'ผู้จองยกเลิกเอง';
    const updated = await this._update(id, { status: 'Cancelled', admin_comment: note });
    return { ok: true, booking: updated };
  },

  /** ค้นหา/กรองตาม ข้อความ (ผู้จอง/อีเมล/วัตถุประสงค์), ห้อง, วันที่, สถานะ */
  async search({ q = '', room_id = '', date = '', status = '', email = '' } = {}) {
    const needle = q.trim().toLowerCase();
    const list = await this.list();
    return list.filter((b) => {
      if (room_id && b.room_id !== room_id) return false;
      if (date && b.booking_date !== date) return false;
      if (status && b.status !== status) return false;
      if (email && b.requester_email.toLowerCase() !== email.toLowerCase()) return false;
      if (
        needle &&
        !`${b.requester_name} ${b.requester_email} ${b.purpose}`.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
  },

  async stats() {
    return countByStatus(await this.list());
  },
};
