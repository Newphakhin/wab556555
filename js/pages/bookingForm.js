import { roomService } from '../services/roomService.js';
import { bookingService } from '../services/bookingService.js';
import { getProfile, setProfile } from '../session.js';
import { esc, toast } from '../utils/dom.js';
import { REQUESTER_TYPES, ROOM_STATUS_LABEL } from '../domain/constants.js';
import { toDateStr, toMin } from '../utils/time.js';
import { navigate } from '../router.js';

const FIELDS = ['room_id', 'requester_name', 'requester_email', 'requester_type', 'booking_date', 'start_time', 'end_time', 'number_of_users', 'purpose'];

export async function bookingFormPage({ app, query }) {
  const rooms = await roomService.list();
  const profile = getProfile();
  const preselected = rooms.find((r) => r.id === query.room && r.status === 'Available')?.id
    || rooms.find((r) => r.status === 'Available')?.id || '';

  app.innerHTML = `
    <div class="breadcrumb"><a href="#/rooms">ห้องปฏิบัติการ</a> / แบบฟอร์มจองห้อง</div>
    <div class="page-head"><div><h2>ส่งคำขอจองห้อง</h2><p>กรอกข้อมูลให้ครบถ้วน คำขอจะอยู่ในสถานะ "รออนุมัติ" จนกว่าผู้ดูแลจะพิจารณา</p></div></div>
    <div class="grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);align-items:start" id="formLayout">
      <form class="card" id="bookingForm" novalidate>
        <div class="form-grid">
          <div class="field full" data-f="room_id"><label for="room_id">ห้องปฏิบัติการ <span class="req">*</span></label>
            <select id="room_id" name="room_id">
              <option value="">— เลือกห้อง —</option>
              ${rooms.map((r) => `<option value="${esc(r.id)}" ${r.id === preselected ? 'selected' : ''} ${r.status !== 'Available' ? 'disabled' : ''}>${esc(r.room_name)} (${esc(r.room_code)})${r.status !== 'Available' ? ' — ' + ROOM_STATUS_LABEL[r.status] : ''}</option>`).join('')}
            </select><small class="field-hint" id="roomHint"></small><small class="field-error"></small></div>

          <div class="field" data-f="requester_name"><label for="requester_name">ชื่อผู้จอง <span class="req">*</span></label>
            <input id="requester_name" name="requester_name" type="text" value="${esc(profile.name)}" placeholder="เช่น สมชาย ใจดี" autocomplete="name" /><small class="field-error"></small></div>
          <div class="field" data-f="requester_email"><label for="requester_email">อีเมล <span class="req">*</span></label>
            <input id="requester_email" name="requester_email" type="email" value="${esc(profile.email)}" placeholder="name@ksu.ac.th" autocomplete="email" /><small class="field-error"></small></div>
          <div class="field full" data-f="requester_type"><label for="requester_type">ประเภทผู้จอง <span class="req">*</span></label>
            <select id="requester_type" name="requester_type">${Object.entries(REQUESTER_TYPES).map(([k, v]) => `<option value="${k}" ${profile.type === k ? 'selected' : ''}>${v}</option>`).join('')}</select><small class="field-error"></small></div>

          <div class="field" data-f="booking_date"><label for="booking_date">วันที่จอง <span class="req">*</span></label>
            <input id="booking_date" name="booking_date" type="date" min="${toDateStr()}" value="${esc(query.date || toDateStr())}" /><small class="field-error"></small></div>
          <div class="field" data-f="number_of_users"><label for="number_of_users">จำนวนผู้ใช้งาน <span class="req">*</span></label>
            <input id="number_of_users" name="number_of_users" type="number" min="1" step="1" placeholder="เช่น 20" /><small class="field-error"></small></div>
          <div class="field" data-f="start_time"><label for="start_time">เวลาเริ่มต้น <span class="req">*</span></label>
            <input id="start_time" name="start_time" type="time" step="900" /><small class="field-error"></small></div>
          <div class="field" data-f="end_time"><label for="end_time">เวลาสิ้นสุด <span class="req">*</span></label>
            <input id="end_time" name="end_time" type="time" step="900" /><small class="field-error"></small></div>

          <div class="field full" data-f="purpose"><label for="purpose">วัตถุประสงค์การใช้งาน <span class="req">*</span></label>
            <textarea id="purpose" name="purpose" placeholder="เช่น สอนปฏิบัติการวิชาเครือข่ายคอมพิวเตอร์"></textarea><small class="field-error"></small></div>
        </div>
        <div id="liveHint" style="margin-top:1.1rem"></div>
        <div class="row" style="margin-top:1.4rem;justify-content:flex-end">
          <a class="btn btn-ghost" href="#/rooms">ยกเลิก</a>
          <button class="btn btn-primary" type="submit" id="submitBtn">ส่งคำขอจอง</button>
        </div>
      </form>

      <aside class="card stack" id="roomPanel" aria-live="polite"></aside>
    </div>`;

  if (window.innerWidth < 860) app.querySelector('#formLayout').style.gridTemplateColumns = '1fr';

  const form = app.querySelector('#bookingForm');
  const val = (id) => form.elements[id].value;
  const collect = () => Object.fromEntries(FIELDS.map((f) => [f, val(f)]));

  const clearErrors = () => {
    form.querySelectorAll('.field').forEach((f) => {
      f.classList.remove('has-error');
      const e = f.querySelector('.field-error');
      if (e) e.textContent = '';
    });
  };
  const showErrors = (errors) => {
    Object.entries(errors).forEach(([k, msg]) => {
      const f = form.querySelector(`[data-f="${k}"]`);
      if (f) { f.classList.add('has-error'); f.querySelector('.field-error').textContent = msg; }
    });
    const first = form.querySelector('.has-error input, .has-error select, .has-error textarea');
    if (first) first.focus();
  };

  /** แสดงข้อมูลห้องด้านข้าง + ตรวจเวลาทับซ้อนแบบ real-time */
  const refresh = async () => {
    const roomId = val('room_id');
    if (!roomId) {
        const hint = app.querySelector('#roomHint');
        const panel = app.querySelector('#roomPanel');
        hint.textContent = '';
        panel.innerHTML = '<p class="muted center" style="margin:0">เลือกห้องเพื่อดูรายละเอียด</p>';
        app.querySelector('#liveHint').innerHTML = '';
        return;
    }

    const room = await roomService.get(roomId);
    const panel = app.querySelector('#roomPanel');
    const hint = app.querySelector('#roomHint');
    if (room) {
      form.elements.number_of_users.max = room.capacity;
      hint.textContent = `ความจุสูงสุด ${room.capacity} คน`;
      panel.innerHTML = `<h3>${esc(room.room_name)}</h3><p class="muted small" style="margin:0">📍 ${esc(room.location)}</p>
        <div class="chips">${room.equipment.map((e) => `<span class="chip">${esc(e)}</span>`).join('')}</div>
        <p class="small muted" style="margin:0">${esc(room.description)}</p>
        <h4 style="margin-top:.4rem">ช่วงที่ถูกจองแล้ว (อนุมัติแล้ว) ในวันที่เลือก</h4><div id="dayBookings"></div>`;
    }

    const live = app.querySelector('#liveHint');
    const date = val('booking_date');
    if (room && date) {
      const dayRaw = await bookingService.search({ room_id: room.id, date, status: 'Approved' });
      const day = dayRaw.sort((a, b) => toMin(a.start_time) - toMin(b.start_time));
      const box = app.querySelector('#dayBookings');
      if (box) box.innerHTML = day.length
        ? `<ul class="mini-list">${day.map((b) => `<li><span class="chip">${b.start_time}–${b.end_time}</span><span class="muted small">${esc(b.purpose)}</span></li>`).join('')}</ul>`
        : '<p class="small" style="color:var(--approved);margin:0">🟢 ว่างทั้งวัน</p>';

      const s = val('start_time'), e = val('end_time');
      if (s && e && toMin(s) < toMin(e)) {
        const conflicts = await bookingService.conflicts({ room_id: room.id, booking_date: date, start_time: s, end_time: e });
        live.innerHTML = conflicts.length
          ? `<div class="alert alert-warn">⚠️ <span>ช่วงเวลานี้ทับซ้อนกับรายการที่อนุมัติแล้ว (${conflicts.map((c) => `${c.start_time}–${c.end_time}`).join(', ')}) กรุณาเลือกเวลาอื่น</span></div>`
          : '<div class="alert alert-ok">✅ ช่วงเวลานี้ว่าง สามารถส่งคำขอจองได้</div>';
        return;
      }
    }
    live.innerHTML = '';
  };

  form.addEventListener('input', refresh);
  form.addEventListener('change', refresh);
  refresh(); // initial load is now async but doesn't block submit setup

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    clearErrors();
    const data = collect();
    const res = await bookingService.create(data);
    if (!res.ok) {
      showErrors(res.errors);
      toast('กรุณาตรวจสอบข้อมูลในแบบฟอร์ม', 'error');
      return;
    }
    setProfile({ name: data.requester_name.trim(), email: data.requester_email.trim(), type: data.requester_type });
    toast('ส่งคำขอจองเรียบร้อย — สถานะ: รออนุมัติ', 'success');
    navigate('#/my');
  });
}
