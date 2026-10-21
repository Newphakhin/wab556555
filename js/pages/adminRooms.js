import { roomService } from '../services/roomService.js';
import { esc, toast, openModal, confirmDialog } from '../utils/dom.js';
import { roomBadge, emptyState } from '../utils/format.js';
import { ROOM_STATUS_LABEL } from '../domain/constants.js';

const FIELDS = ['room_name', 'room_code', 'location', 'capacity', 'equipment', 'status', 'description'];

export async function adminRoomsPage({ app }) {
  app.innerHTML = `
    <div class="page-head"><div><h2>จัดการห้องปฏิบัติการ</h2><p>เพิ่ม แก้ไข และลบข้อมูลห้อง</p></div>
      <button class="btn btn-primary" id="addRoom" type="button">+ เพิ่มห้อง</button></div>
    <div id="tableBox"></div>`;

  const draw = async () => {
    const rooms = await roomService.list();
    const box = app.querySelector('#tableBox');
    if (!rooms.length) { box.innerHTML = `<div class="card">${emptyState('🏫', 'ยังไม่มีห้องปฏิบัติการ', 'กด "เพิ่มห้อง" เพื่อเริ่มต้น')}</div>`; return; }
    box.innerHTML = `<div class="table-wrap"><table class="responsive">
      <thead><tr><th>รหัส</th><th>ชื่อห้อง</th><th>สถานที่</th><th>ความจุ</th><th>อุปกรณ์</th><th>สถานะ</th><th>การทำงาน</th></tr></thead>
      <tbody>${rooms.map((r) => `<tr data-id="${esc(r.id)}">
        <td data-label="รหัส"><b>${esc(r.room_code)}</b></td>
        <td data-label="ชื่อห้อง">${esc(r.room_name)}</td>
        <td data-label="สถานที่">${esc(r.location)}</td>
        <td data-label="ความจุ">${r.capacity}</td>
        <td data-label="อุปกรณ์"><div class="chips" style="justify-content:flex-end">${r.equipment.map((e) => `<span class="chip">${esc(e)}</span>`).join('')}</div></td>
        <td data-label="สถานะ">${roomBadge(r.status)}</td>
        <td class="actions-cell"><div class="actions"><button class="btn btn-ghost btn-sm" data-act="edit">แก้ไข</button><button class="btn btn-danger btn-sm" data-act="delete">ลบ</button></div></td>
      </tr>`).join('')}</tbody></table></div>`;
  };

  function openForm(room) {
    const r = room || { room_name: '', room_code: '', location: '', capacity: '', equipment: [], status: 'Available', description: '' };
    openModal({
      title: room ? 'แก้ไขข้อมูลห้อง' : 'เพิ่มห้องปฏิบัติการ',
      size: 'lg',
      html: `<form id="roomForm" novalidate><div class="form-grid">
        <div class="field" data-f="room_name"><label for="room_name">ชื่อห้อง <span class="req">*</span></label><input id="room_name" type="text" value="${esc(r.room_name)}" /><small class="field-error"></small></div>
        <div class="field" data-f="room_code"><label for="room_code">รหัสห้อง <span class="req">*</span></label><input id="room_code" type="text" value="${esc(r.room_code)}" placeholder="เช่น CE-LAB-03" /><small class="field-error"></small></div>
        <div class="field" data-f="location"><label for="location">สถานที่ <span class="req">*</span></label><input id="location" type="text" value="${esc(r.location)}" placeholder="อาคาร / ชั้น / ห้อง" /><small class="field-error"></small></div>
        <div class="field" data-f="capacity"><label for="capacity">ความจุ (คน) <span class="req">*</span></label><input id="capacity" type="number" min="1" value="${esc(r.capacity)}" /><small class="field-error"></small></div>
        <div class="field" data-f="status"><label for="status">สถานะห้อง</label><select id="status">${Object.entries(ROOM_STATUS_LABEL).map(([k, v]) => `<option value="${k}" ${r.status === k ? 'selected' : ''}>${v}</option>`).join('')}</select><small class="field-error"></small></div>
        <div class="field" data-f="equipment"><label for="equipment">อุปกรณ์ (คั่นด้วยเครื่องหมายจุลภาค)</label><input id="equipment" type="text" value="${esc(r.equipment.join(', '))}" placeholder="Computer, Projector" /><small class="field-error"></small></div>
        <div class="field full" data-f="description"><label for="description">รายละเอียดเพิ่มเติม</label><textarea id="description">${esc(r.description)}</textarea></div>
      </div>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>ยกเลิก</button><button type="submit" class="btn btn-primary">บันทึก</button></div></form>`,
      onMount: (body, close) => {
        const form = body.querySelector('#roomForm');
        form.addEventListener('submit', async (e) => {
          e.preventDefault();
          form.querySelectorAll('.field').forEach((f) => { f.classList.remove('has-error'); const x = f.querySelector('.field-error'); if (x) x.textContent = ''; });
          const data = Object.fromEntries(FIELDS.map((k) => [k, form.querySelector('#' + k).value]));
          const res = room ? await roomService.update(room.id, data) : await roomService.create(data);
          if (!res.ok) {
            Object.entries(res.errors).forEach(([k, msg]) => {
              const f = form.querySelector(`[data-f="${k}"]`);
              if (f) { f.classList.add('has-error'); f.querySelector('.field-error').textContent = msg; }
            });
            return;
          }
          toast(room ? 'บันทึกการแก้ไขแล้ว' : 'เพิ่มห้องเรียบร้อย', 'success');
          close();
          draw();
        });
      },
    });
  }

  app.querySelector('#addRoom').onclick = () => openForm(null);
  app.querySelector('#tableBox').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const room = await roomService.get(btn.closest('[data-id]').dataset.id);
    if (btn.dataset.act === 'edit') return openForm(room);
    const ok = await confirmDialog({ title: 'ลบห้องปฏิบัติการ', message: `ต้องการลบ "${room.room_name}" ใช่หรือไม่?`, confirmText: 'ลบห้อง', danger: true });
    if (!ok) return;
    const res = await roomService.remove(room.id);
    toast(res.ok ? 'ลบห้องแล้ว' : res.error, res.ok ? 'success' : 'error');
    draw();
  });

  draw();
}
