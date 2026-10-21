import { bookingService } from '../services/bookingService.js';
import { roomService } from '../services/roomService.js';
import { esc } from '../utils/dom.js';
import { bookingBadge, timeRange, emptyState } from '../utils/format.js';
import { formatDate, toDateStr } from '../utils/time.js';
import { STATUS_ORDER, BOOKING_STATUS_LABEL } from '../domain/constants.js';

let charts = [];
const COLORS = { Pending: '#f7b733', Approved: '#34d399', Rejected: '#fb6a85', Cancelled: '#9aa4bd' };

export async function dashboardPage({ app }) {
  charts.forEach((c) => c.destroy());
  charts = [];

  const bookings = await bookingService.list();
  const stats = await bookingService.stats();
  const rooms = await roomService.list();
  const today = toDateStr();

  const perRoom = rooms.map((r) => ({ room: r, count: bookings.filter((b) => b.room_id === r.id && b.status !== 'Cancelled').length }));
  const maxRoom = Math.max(1, ...perRoom.map((p) => p.count));
  const pending = bookings.filter((b) => b.status === 'Pending').sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time)).slice(0, 5);
  const upcoming = bookings.filter((b) => b.status === 'Approved' && b.booking_date >= today).sort((a, b) => (a.booking_date + a.start_time).localeCompare(b.booking_date + b.start_time)).slice(0, 5);
  const roomCode = (id) => rooms.find(r => r.id === id)?.room_code || '—';

  app.innerHTML = `
    <div class="page-head"><div><h2>Dashboard</h2><p>สรุปภาพรวมการจองห้องปฏิบัติการ</p></div>
      <a class="btn btn-primary" href="#/admin/bookings">จัดการคำขอจอง</a></div>

    <div class="stat-grid">
      <a class="card stat" href="#/admin/bookings"><div class="num">${stats.total}</div><div class="label">การจองทั้งหมด</div></a>
      ${STATUS_ORDER.map((s) => `<a class="card stat s-${s.toLowerCase()}" href="#/admin/bookings?status=${s}"><div class="num">${stats[s]}</div><div class="label">${BOOKING_STATUS_LABEL[s]}</div></a>`).join('')}
    </div>

    <div class="grid grid-2">
      <section class="card"><h3>สัดส่วนตามสถานะ</h3>
        ${stats.total ? '<div class="chart-box"><canvas id="statusChart" aria-label="กราฟสัดส่วนการจองตามสถานะ" role="img"></canvas></div>' : emptyState('📊', 'ยังไม่มีข้อมูล')}</section>
      <section class="card"><h3>การจองแยกตามห้อง <span class="muted small">(ไม่รวมที่ยกเลิก)</span></h3>
        <div style="margin-top:1rem">${perRoom.map((p) => `<div class="bar-row"><span title="${esc(p.room.room_name)}">${esc(p.room.room_code)}</span>
          <div class="bar-track"><div class="bar-fill" style="width:0" data-w="${(p.count / maxRoom) * 100}"></div></div><b>${p.count}</b></div>`).join('') || emptyState('🏫', 'ยังไม่มีห้อง')}</div>
      </section>
      <section class="card"><div class="row row-between"><h3>รออนุมัติ</h3><a class="small link-btn" href="#/admin/bookings?status=Pending">ดูทั้งหมด →</a></div>
        ${pending.length ? `<ul class="mini-list">${pending.map((b) => `<li><div><b>${esc(b.requester_name)}</b><span class="muted small" style="display:block">${esc(roomCode(b.room_id))} · ${esc(formatDate(b.booking_date))} · ${esc(timeRange(b))}</span></div>${bookingBadge('Pending')}</li>`).join('')}</ul>` : emptyState('🎉', 'ไม่มีคำขอที่รออนุมัติ')}</section>
      <section class="card"><div class="row row-between"><h3>การจองที่กำลังจะถึง</h3><a class="small link-btn" href="#/schedule">ตารางการจอง →</a></div>
        ${upcoming.length ? `<ul class="mini-list">${upcoming.map((b) => `<li><div><b>${esc(roomCode(b.room_id))}</b><span class="muted small" style="display:block">${esc(formatDate(b.booking_date))} · ${esc(timeRange(b))} · ${esc(b.requester_name)}</span></div>${bookingBadge('Approved')}</li>`).join('')}</ul>` : emptyState('🗓️', 'ยังไม่มีการจองที่กำลังจะถึง')}</section>
    </div>`;

  requestAnimationFrame(() => app.querySelectorAll('.bar-fill').forEach((el) => (el.style.width = el.dataset.w + '%')));

  const canvas = app.querySelector('#statusChart');
  if (canvas && window.Chart) {
    charts.push(new window.Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: STATUS_ORDER.map((s) => BOOKING_STATUS_LABEL[s]),
        datasets: [{ data: STATUS_ORDER.map((s) => stats[s]), backgroundColor: STATUS_ORDER.map((s) => COLORS[s]), borderColor: '#0c1124', borderWidth: 3, hoverOffset: 8 }],
      },
      options: {
        maintainAspectRatio: false, cutout: '64%',
        plugins: { legend: { position: 'bottom', labels: { color: '#cfd6f2', font: { family: 'Prompt' }, padding: 16, usePointStyle: true } } },
      },
    }));
  } else if (canvas) {
    canvas.parentElement.innerHTML = STATUS_ORDER.map((s) => `<div class="bar-row"><span>${BOOKING_STATUS_LABEL[s]}</span><div class="bar-track"><div class="bar-fill" style="width:${stats.total ? (stats[s] / stats.total) * 100 : 0}%"></div></div><b>${stats[s]}</b></div>`).join('');
  }
}
