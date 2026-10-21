import { bookingService } from '../services/bookingService.js';
import { roomService } from '../services/roomService.js';
import { esc, toast, confirmDialog, promptDialog } from '../utils/dom.js';
import { bookingBadge, timeRange, typeLabel, emptyState } from '../utils/format.js';
import { formatDate } from '../utils/time.js';
import { STATUS_ORDER, BOOKING_STATUS_LABEL } from '../domain/constants.js';
import { showBookingDetail } from '../components/bookingDetail.js';

export async function adminBookingsPage({ app, query }) {
  const rooms = await roomService.list();
  const f = { q: '', room_id: '', date: '', status: STATUS_ORDER.includes(query.status) ? query.status : '' };

  app.innerHTML = `
    <div class="page-head"><div><h2>จัดการคำขอจอง</h2><p>ตรวจสอบ อนุมัติ ปฏิเสธ หรือยกเลิกคำขอจองทั้งหมดในระบบ</p></div></div>
    <div class="tabs" id="tabs"></div>
    <div class="toolbar">
      <div class="field grow"><label for="fq">ค้นหา</label><input id="fq" type="search" placeholder="ชื่อผู้จอง อีเมล หรือวัตถุประสงค์..." /></div>
      <div class="field"><label for="froom">ห้อง</label><select id="froom"><option value="">ทุกห้อง</option>${rooms.map((r) => `<option value="${esc(r.id)}">${esc(r.room_code)}</option>`).join('')}</select></div>
      <div class="field"><label for="fdate">วันที่</label><input id="fdate" type="date" /></div>
      <button class="btn btn-ghost" id="fclear" type="button" style="margin-bottom:1px">ล้างตัวกรอง</button>
    </div>
    <div id="tableBox"></div>`;

  const roomName = (id) => rooms.find((r) => r.id === id)?.room_code || '—';

  const draw = async () => {
    const all = await bookingService.search({ q: f.q, room_id: f.room_id, date: f.date });
    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, all.filter((b) => b.status === s).length]));
    app.querySelector('#tabs').innerHTML =
      `<button class="tab ${f.status === '' ? 'on' : ''}" data-tab="">ทั้งหมด<span class="count">${all.length}</span></button>` +
      STATUS_ORDER.map((s) => `<button class="tab ${f.status === s ? 'on' : ''}" data-tab="${s}">${BOOKING_STATUS_LABEL[s]}<span class="count">${counts[s]}</span></button>`).join('');

    const rank = { Pending: 0, Approved: 1, Rejected: 2, Cancelled: 3 };
    const list = all
      .filter((b) => !f.status || b.status === f.status)
      .sort((a, b) => rank[a.status] - rank[b.status] || (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time));

    const box = app.querySelector('#tableBox');
    if (!list.length) { box.innerHTML = `<div class="card">${emptyState('🗂️', 'ไม่พบรายการจอง', 'ลองเปลี่ยนตัวกรองหรือคำค้นหา')}</div>`; return; }

    // Prepare conflict checks manually to avoid Promise.all in map for simpler template
    // conflicts only apply to Pending
    const pAll = await bookingService.list();
    const findConf = (b) => pAll.filter((o) => o.id !== b.id && o.room_id === b.room_id && o.booking_date === b.booking_date && o.status === 'Approved' && o.start_time < b.end_time && o.end_time > b.start_time);

    box.innerHTML = `<div class="table-wrap"><table class="responsive">
      <thead><tr><th>ผู้จอง</th><th>ห้อง</th><th>วัน-เวลา</th><th>วัตถุประสงค์</th><th>สถานะ</th><th>การทำงาน</th></tr></thead>
      <tbody>${list.map((b) => {
        const conflicts = b.status === 'Pending' ? findConf(b) : [];
        return `<tr data-id="${esc(b.id)}">
          <td data-label="ผู้จอง"><div><b>${esc(b.requester_name)}</b><span class="sub">${esc(b.requester_email)} · ${esc(typeLabel(b.requester_type))}</span></div></td>
          <td data-label="ห้อง">${esc(roomName(b.room_id))}</td>
          <td data-label="วัน-เวลา"><div>${esc(formatDate(b.booking_date))}<span class="sub">${esc(timeRange(b))}</span></div></td>
          <td data-label="วัตถุประสงค์"><div>${esc(b.purpose)}<span class="sub">👥 ${b.number_of_users} คน</span></div></td>
          <td data-label="สถานะ"><div>${bookingBadge(b.status)}
            ${b.admin_comment ? `<span class="note">💬 ${esc(b.admin_comment)}</span>` : ''}
            ${conflicts.length ? `<span class="note" style="color:var(--rejected)">⚠️ ทับซ้อนกับรายการที่อนุมัติแล้ว (${esc(conflicts[0].start_time)}–${esc(conflicts[0].end_time)})</span>` : ''}</div></td>
          <td class="actions-cell"><div class="actions">
            ${b.status === 'Pending' ? `<button class="btn btn-success btn-sm" data-act="approve" ${conflicts.length ? 'disabled title="ทับซ้อนกับรายการที่อนุมัติแล้ว"' : ''}>อนุมัติ</button>
              <button class="btn btn-danger btn-sm" data-act="reject">ปฏิเสธ</button>` : ''}
            ${b.status === 'Pending' || b.status === 'Approved' ? '<button class="btn btn-warn btn-sm" data-act="cancel">ยกเลิก</button>' : ''}
            <button class="btn btn-ghost btn-sm" data-act="detail">รายละเอียด</button>
          </div></td></tr>`;
      }).join('')}</tbody></table></div>`;
  };

  const $ = (s) => app.querySelector(s);
  $('#fq').value = f.q;
  $('#fq').addEventListener('input', (e) => { f.q = e.target.value; draw(); });
  $('#froom').addEventListener('change', (e) => { f.room_id = e.target.value; draw(); });
  $('#fdate').addEventListener('change', (e) => { f.date = e.target.value; draw(); });
  $('#fclear').addEventListener('click', () => {
    Object.assign(f, { q: '', room_id: '', date: '', status: '' });
    $('#fq').value = ''; $('#froom').value = ''; $('#fdate').value = '';
    draw();
  });
  $('#tabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { f.status = t.dataset.tab; draw(); }
  });

  $('#tableBox').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.closest('[data-id]').dataset.id;
    const b = await bookingService.get(id);
    const report = (res, okMsg) => { toast(res.ok ? okMsg : res.error, res.ok ? 'success' : 'error'); draw(); };

    switch (btn.dataset.act) {
      case 'detail': return showBookingDetail(b);
      case 'approve': {
        const ok = await confirmDialog({ title: 'อนุมัติคำขอจอง', message: `อนุมัติการจองของ ${b.requester_name} (${b.start_time}–${b.end_time}) ใช่หรือไม่?`, confirmText: 'อนุมัติ' });
        if (ok) report(await bookingService.approve(id), 'อนุมัติคำขอจองแล้ว');
        return;
      }
      case 'reject': {
        const reason = await promptDialog({ title: 'ปฏิเสธคำขอจอง', label: 'เหตุผลที่ไม่อนุมัติ', placeholder: 'เช่น ห้องถูกสำรองสำหรับกิจกรรมอื่น', required: true, confirmText: 'ปฏิเสธคำขอ', danger: true });
        if (reason) report(await bookingService.reject(id, reason), 'ปฏิเสธคำขอจองแล้ว');
        return;
      }
      case 'cancel': {
        const comment = await promptDialog({ title: 'ยกเลิกรายการจอง', label: 'เหตุผลการยกเลิก (ไม่บังคับ)', placeholder: 'ระบุเหตุผล...', confirmText: 'ยกเลิกรายการ', danger: true });
        if (comment !== null) report(await bookingService.cancel(id, { by: 'admin', comment }), 'ยกเลิกรายการจองแล้ว');
      }
    }
  });

  draw();
}
