import { roomService } from '../services/roomService.js';
import { bookingService } from '../services/bookingService.js';
import { esc } from '../utils/dom.js';
import { roomBadge, emptyState, typeLabel } from '../utils/format.js';
import { toDateStr, addDays, formatDate, formatWeekday } from '../utils/time.js';

export async function roomDetailPage({ app, params }) {
  const room = await roomService.get(params.id);
  if (!room) {
    app.innerHTML = emptyState('🫥', 'ไม่พบห้องที่ต้องการ', '<a class="btn btn-primary btn-sm" href="#/rooms">กลับไปรายการห้อง</a>');
    return;
  }

  const today = toDateStr();
  const until = addDays(today, 7);
  const searchResults = await bookingService.search({ room_id: room.id, status: 'Approved' });
  const upcoming = searchResults
    .filter((b) => b.booking_date >= today && b.booking_date <= until)
    .sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time));

  const canBook = room.status === 'Available';
  app.innerHTML = `
    <div class="breadcrumb"><a href="#/rooms">ห้องปฏิบัติการ</a> / ${esc(room.room_name)}</div>
    <div class="detail-hero">
      <div class="row row-between" style="align-items:flex-start">
        <div>
          <span class="room-code">${esc(room.room_code)}</span>
          <h2 style="margin-top:.3rem">${esc(room.room_name)}</h2>
          <p class="muted" style="margin:0">📍 ${esc(room.location)}</p>
        </div>
        <div>${roomBadge(room.status)}</div>
      </div>
      <div class="row" style="margin-top:1.4rem">
        <a class="btn btn-primary btn-lg ${canBook ? '' : 'is-disabled'}" href="#/book?room=${esc(room.id)}">จองห้องนี้</a>
        <a class="btn btn-ghost btn-lg" href="#/schedule?room=${esc(room.id)}">ดูตารางห้องนี้</a>
      </div>
      ${canBook ? '' : '<div class="alert alert-warn" style="margin-top:1rem">ห้องนี้ไม่เปิดให้จองในขณะนี้ (ปิดปรับปรุงหรือปิดให้บริการ)</div>'}
    </div>

    <div class="grid grid-2" style="margin-top:1.4rem">
      <section class="card">
        <h3>ข้อมูลห้อง</h3>
        <dl class="kv">
          <dt>ความจุ</dt><dd>${room.capacity} คน</dd>
          <dt>สถานที่</dt><dd>${esc(room.location)}</dd>
          <dt>อุปกรณ์</dt><dd><div class="chips">${room.equipment.map((e) => `<span class="chip">${esc(e)}</span>`).join('') || '-'}</div></dd>
          <dt>รายละเอียด</dt><dd>${esc(room.description) || '-'}</dd>
        </dl>
      </section>
      <section class="card">
        <h3>การจองที่อนุมัติแล้ว (7 วันข้างหน้า)</h3>
        ${
          upcoming.length
            ? `<ul class="mini-list">${upcoming
                .map(
                  (b) => `<li><div><b>${esc(formatWeekday(b.booking_date))} ${esc(formatDate(b.booking_date))}</b>
                    <span class="sub muted small" style="display:block">${esc(b.purpose)} · ${esc(typeLabel(b.requester_type))}</span></div>
                    <span class="chip">${b.start_time}–${b.end_time}</span></li>`
                )
                .join('')}</ul>`
            : emptyState('🟢', 'ว่างตลอด 7 วันข้างหน้า', 'ยังไม่มีการจองที่อนุมัติแล้ว')
        }
      </section>
    </div>`;
}
