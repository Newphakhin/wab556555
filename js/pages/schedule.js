import { roomService } from '../services/roomService.js';
import { bookingService } from '../services/bookingService.js';
import { esc } from '../utils/dom.js';
import { toMin, fromMin, toDateStr, addDays, startOfWeek, formatDate, formatDateLong, formatWeekday } from '../utils/time.js';
import { BOOKING_STATUS_LABEL, STATUS_ORDER } from '../domain/constants.js';
import { showBookingDetail } from '../components/bookingDetail.js';

const HOUR_H = 56;

/** จัดวางบล็อกที่เวลาทับกัน (เช่น Pending หลายรายการ) ให้แสดงคู่กันเป็น lane */
function layoutLanes(items) {
  items.sort((a, b) => toMin(a.start_time) - toMin(b.start_time) || toMin(a.end_time) - toMin(b.end_time));
  let cluster = [], clusterEnd = -1, laneEnds = [];
  const out = items.map((b) => ({ b, lane: 0, lanes: 1 }));
  const flush = () => { cluster.forEach((c) => (c.lanes = laneEnds.length)); cluster = []; laneEnds = []; clusterEnd = -1; };
  for (const it of out) {
    const s = toMin(it.b.start_time), e = toMin(it.b.end_time);
    if (cluster.length && s >= clusterEnd) flush();
    let lane = laneEnds.findIndex((le) => le <= s);
    if (lane === -1) { lane = laneEnds.length; laneEnds.push(e); } else laneEnds[lane] = e;
    it.lane = lane; cluster.push(it); clusterEnd = Math.max(clusterEnd, e);
  }
  flush();
  return out;
}

export async function schedulePage({ app, query }) {
  const rooms = await roomService.list();
  const getRoom = (id) => rooms.find((r) => r.id === id);

  const state = {
    view: query.view === 'week' ? 'week' : 'day',
    date: /^\d{4}-\d{2}-\d{2}$/.test(query.date || '') ? query.date : toDateStr(),
    room: rooms.some((r) => r.id === query.room) ? query.room : '',
    status: STATUS_ORDER.includes(query.status) ? query.status : query.status === 'all' ? '' : 'Approved',
  };

  app.innerHTML = `
    <div class="page-head"><div><h2>ตารางการจอง</h2><p id="rangeLabel"></p></div>
      <a class="btn btn-primary" href="#/book">+ จองห้อง</a></div>
    <div class="toolbar">
      <div class="field" style="flex:none;min-width:0"><label>มุมมอง</label>
        <div class="tabs" style="margin:0"><button class="tab" data-view="day">รายวัน</button><button class="tab" data-view="week">รายสัปดาห์</button></div></div>
      <div class="field" style="flex:none;min-width:0"><label>วันที่</label>
        <div class="row" style="gap:.4rem;flex-wrap:nowrap"><button class="icon-btn" id="prev" type="button" aria-label="ก่อนหน้า">‹</button>
          <input id="dateInput" type="date" style="min-width:150px" /><button class="icon-btn" id="next" type="button" aria-label="ถัดไป">›</button>
          <button class="btn btn-ghost btn-sm" id="todayBtn" type="button">วันนี้</button></div></div>
      <div class="field"><label for="roomFilter">ห้อง</label><select id="roomFilter"><option value="">ทุกห้อง</option>${rooms.map((r) => `<option value="${esc(r.id)}">${esc(r.room_code)} — ${esc(r.room_name)}</option>`).join('')}</select></div>
      <div class="field"><label for="statusFilter">สถานะ</label><select id="statusFilter"><option value="">ทุกสถานะ</option>${STATUS_ORDER.map((s) => `<option value="${s}">${BOOKING_STATUS_LABEL[s]}</option>`).join('')}</select></div>
    </div>
    <div class="legend" style="margin-bottom:.9rem">
      <span><i style="background:hsla(152,68%,38%,.55);border-color:var(--approved)"></i>อนุมัติแล้ว</span>
      <span><i style="background:hsla(40,90%,45%,.45);border-color:var(--pending);border-style:dashed"></i>รออนุมัติ</span>
      <span><i style="background:hsla(350,70%,45%,.4);border-color:var(--rejected)"></i>ไม่อนุมัติ</span>
      <span><i style="background:hsla(220,10%,40%,.4);border-color:var(--cancelled)"></i>ยกเลิก</span>
    </div>
    <div class="sched" id="sched"></div>`;

  const $ = (s) => app.querySelector(s);

  const draw = async () => {
    $('#dateInput').value = state.date;
    $('#roomFilter').value = state.room;
    $('#statusFilter').value = state.status;
    app.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === state.view));

    const today = toDateStr();
    let columns;
    if (state.view === 'day') {
      const list = state.room ? rooms.filter((r) => r.id === state.room) : rooms;
      columns = list.map((r) => ({ title: r.room_code, sub: r.room_name, today: false, match: (b) => b.room_id === r.id && b.booking_date === state.date }));
      $('#rangeLabel').textContent = formatDateLong(state.date);
    } else {
      const mon = startOfWeek(state.date);
      columns = Array.from({ length: 7 }, (_, i) => {
        const d = addDays(mon, i);
        return { title: formatWeekday(d), sub: formatDate(d, { day: 'numeric', month: 'short' }), today: d === today, match: (b) => b.booking_date === d && (!state.room || b.room_id === state.room) };
      });
      $('#rangeLabel').textContent = `สัปดาห์ ${formatDate(mon)} – ${formatDate(addDays(mon, 6))}`;
    }

    const all = await bookingService.search({ status: state.status });
    const colData = columns.map((c) => all.filter(c.match));
    const flat = colData.flat();
    const startHour = Math.min(7, ...flat.map((b) => Math.floor(toMin(b.start_time) / 60)));
    const endHour = Math.max(20, ...flat.map((b) => Math.ceil(toMin(b.end_time) / 60)));
    const hours = endHour - startHour;
    const minW = state.view === 'day' ? 170 : 130;

    const times = Array.from({ length: hours }, (_, i) => `<div class="sched-time">${fromMin((startHour + i) * 60)}</div>`).join('');
    const heads = columns.map((c) => `<div class="sched-head ${c.today ? 'today' : ''}">${esc(c.title)}<small>${esc(c.sub)}</small></div>`).join('');
    const cols = colData.map((items, i) => {
      const blocks = layoutLanes(items).map(({ b, lane, lanes }) => {
        const top = ((toMin(b.start_time) - startHour * 60) / 60) * HOUR_H;
        const height = Math.max(((toMin(b.end_time) - toMin(b.start_time)) / 60) * HOUR_H - 2, 22);
        const room = getRoom(b.room_id);
        const w = 100 / lanes;
        return `<button type="button" class="sched-block sb-${b.status.toLowerCase()}" data-id="${esc(b.id)}"
          style="top:${top}px;height:${height}px;left:calc(${lane * w}% + 2px);width:calc(${w}% - 4px)"
          title="${esc(b.start_time)}–${esc(b.end_time)} ${esc(b.purpose)}">
          <b>${esc(b.start_time)}–${esc(b.end_time)}</b>
          <span>${state.view === 'week' && room ? esc(room.room_code) + ' · ' : ''}${esc(b.requester_name)}</span>
          <span>${esc(b.purpose)}</span></button>`;
      }).join('');
      return `<div class="sched-col ${columns[i].today ? 'today' : ''}">${blocks}</div>`;
    }).join('');

    $('#sched').innerHTML = `<div class="sched-grid" style="--hour-h:${HOUR_H}px;grid-template-columns:62px repeat(${columns.length},minmax(${minW}px,1fr));min-width:${62 + columns.length * minW}px">
      <div class="sched-corner"></div>${heads}
      <div class="sched-times">${times}</div>${cols}</div>`;

    if (!flat.length) {
      $('#sched').insertAdjacentHTML('beforeend', '<p class="muted center" style="padding:1rem;margin:0">ไม่มีรายการจองตามเงื่อนไขที่เลือกในช่วงนี้</p>');
    }
  };

  const step = (dir) => { state.date = addDays(state.date, dir * (state.view === 'week' ? 7 : 1)); draw(); };
  $('#prev').onclick = () => step(-1);
  $('#next').onclick = () => step(1);
  $('#todayBtn').onclick = () => { state.date = toDateStr(); draw(); };
  $('#dateInput').onchange = (e) => { if (e.target.value) { state.date = e.target.value; draw(); } };
  $('#roomFilter').onchange = (e) => { state.room = e.target.value; draw(); };
  $('#statusFilter').onchange = (e) => { state.status = e.target.value; draw(); };
  app.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => { state.view = b.dataset.view; draw(); }));
  $('#sched').addEventListener('click', async (e) => {
    const blk = e.target.closest('.sched-block');
    if (blk) {
      const b = await bookingService.get(blk.dataset.id);
      showBookingDetail(b);
    }
  });

  draw();
}
