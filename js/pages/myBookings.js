import { bookingService } from '../services/bookingService.js';
import { roomService } from '../services/roomService.js';
import { getProfile, setProfile } from '../session.js';
import { esc, toast, confirmDialog } from '../utils/dom.js';
import { bookingBadge, dateTile, timeRange, emptyState } from '../utils/format.js';
import { canUserCancel } from '../domain/rules.js';
import { STATUS_ORDER, BOOKING_STATUS_LABEL, REQUESTER_TYPES } from '../domain/constants.js';
import { showBookingDetail } from '../components/bookingDetail.js';

export async function myBookingsPage({ app }) {
  let profile = getProfile();
  let tab = '';
  
  const rooms = await roomService.list();
  const getRoom = (id) => rooms.find(r => r.id === id);

  app.innerHTML = `
    <div class="page-head"><div><h2>การจองของฉัน</h2><p>ติดตามสถานะคำขอจองและยกเลิกรายการที่ยังไม่ถึงเวลาใช้งาน</p></div>
      <a class="btn btn-primary" href="#/rooms">+ จองห้องใหม่</a></div>

    <section class="card" style="margin-bottom:1.4rem">
      <h3>ผู้ใช้งานปัจจุบัน</h3>
      <p class="muted small">ระบบแสดงรายการจองตามอีเมลนี้ (จำลองการ Login) — ลองเปลี่ยนอีเมลเพื่อดูรายการของผู้อื่นได้</p>
      <div class="toolbar" style="margin:0">
        <div class="field"><label for="pf_name">ชื่อ</label><input id="pf_name" type="text" /></div>
        <div class="field grow"><label for="pf_email">อีเมล</label><input id="pf_email" type="email" /></div>
        <div class="field"><label for="pf_type">ประเภท</label><select id="pf_type">${Object.entries(REQUESTER_TYPES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('')}</select></div>
        <button class="btn btn-ghost" id="pf_save" type="button" style="margin-bottom:1px">บันทึก</button>
      </div>
    </section>

    <div class="tabs" id="tabs"></div>
    <div id="list" class="stack"></div>`;

  const $n = app.querySelector('#pf_name'), $e = app.querySelector('#pf_email'), $t = app.querySelector('#pf_type');
  const fill = () => { $n.value = profile.name; $e.value = profile.email; $t.value = profile.type; };
  fill();

  const draw = async () => {
    const mine = profile.email ? await bookingService.search({ email: profile.email }) : [];
    const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, mine.filter((b) => b.status === s).length]));
    app.querySelector('#tabs').innerHTML =
      `<button class="tab ${tab === '' ? 'on' : ''}" data-tab="">ทั้งหมด<span class="count">${mine.length}</span></button>` +
      STATUS_ORDER.map((s) => `<button class="tab ${tab === s ? 'on' : ''}" data-tab="${s}">${BOOKING_STATUS_LABEL[s]}<span class="count">${counts[s]}</span></button>`).join('');

    const shown = mine
      .filter((b) => !tab || b.status === tab)
      .sort((a, b) => (b.booking_date + b.start_time).localeCompare(a.booking_date + a.start_time));

    const list = app.querySelector('#list');
    if (!profile.email) { list.innerHTML = emptyState('👤', 'ยังไม่ได้ระบุอีเมล', 'กรอกอีเมลด้านบนเพื่อดูรายการจองของคุณ'); return; }
    if (!shown.length) { list.innerHTML = `<div class="card">${emptyState('📭', 'ยังไม่มีรายการจอง', 'เริ่มจองห้องปฏิบัติการได้เลย')}</div>`; return; }

    list.innerHTML = shown.map((b) => {
      const room = getRoom(b.room_id);
      const cancellable = canUserCancel(b);
      return `<article class="card booking-card" data-id="${esc(b.id)}">
        ${dateTile(b.booking_date)}
        <div>
          <div class="row" style="gap:.6rem"><h3 style="margin:0">${esc(room ? room.room_name : 'ห้องที่ถูกลบ')}</h3>${bookingBadge(b.status)}</div>
          <div class="muted small">🕒 ${esc(timeRange(b))} · 👥 ${b.number_of_users} คน</div>
          <div class="small" style="margin-top:.2rem">${esc(b.purpose)}</div>
          ${b.admin_comment ? `<span class="note">💬 ผู้ดูแล: ${esc(b.admin_comment)}</span>` : ''}
        </div>
        <div class="actions">
          <button class="btn btn-ghost btn-sm" data-act="detail">รายละเอียด</button>
          ${cancellable ? '<button class="btn btn-warn btn-sm" data-act="cancel">ยกเลิกการจอง</button>' : ''}
        </div>
      </article>`;
    }).join('');
  };

  app.querySelector('#tabs').addEventListener('click', (e) => {
    const t = e.target.closest('[data-tab]');
    if (t) { tab = t.dataset.tab; draw(); }
  });

  app.querySelector('#pf_save').addEventListener('click', () => {
    const email = $e.value.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('รูปแบบอีเมลไม่ถูกต้อง', 'error'); return; }
    profile = { name: $n.value.trim(), email, type: $t.value };
    setProfile(profile);
    toast('บันทึกข้อมูลผู้ใช้แล้ว', 'success');
    draw();
  });

  app.querySelector('#list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-act]');
    if (!btn) return;
    const id = btn.closest('[data-id]').dataset.id;
    if (btn.dataset.act === 'detail') {
        const b = await bookingService.get(id);
        return showBookingDetail(b);
    }
    if (btn.dataset.act === 'cancel') {
      const ok = await confirmDialog({ title: 'ยกเลิกการจอง', message: 'ต้องการยกเลิกคำขอจองนี้ใช่หรือไม่? การยกเลิกไม่สามารถย้อนกลับได้', confirmText: 'ยกเลิกการจอง', danger: true });
      if (!ok) return;
      const res = await bookingService.cancel(id, { by: 'user', email: profile.email });
      toast(res.ok ? 'ยกเลิกการจองแล้ว' : res.error, res.ok ? 'success' : 'error');
      draw();
    }
  });

  draw();
}
