import { esc } from '../utils/dom.js';
import { roomBadge } from '../utils/format.js';

export function roomCard(r) {
  const canBook = r.status === 'Available';
  return `
  <article class="card room-card hoverable">
    <div class="room-card-top"><span class="room-code">${esc(r.room_code)}</span>${roomBadge(r.status)}</div>
    <h3>${esc(r.room_name)}</h3>
    <p class="muted small" style="margin:0">📍 ${esc(r.location)}</p>
    <p class="small" style="margin:0">👥 รองรับสูงสุด <b>${r.capacity}</b> คน</p>
    <div class="chips">${r.equipment.map((e) => `<span class="chip">${esc(e)}</span>`).join('')}</div>
    <div class="card-actions">
      <a class="btn btn-ghost btn-sm" href="#/rooms/${esc(r.id)}">รายละเอียด</a>
      <a class="btn btn-primary btn-sm ${canBook ? '' : 'is-disabled'}" href="#/book?room=${esc(r.id)}" ${canBook ? '' : 'aria-disabled="true" tabindex="-1"'}>จองห้อง</a>
    </div>
  </article>`;
}
