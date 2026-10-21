import { esc, openModal } from '../utils/dom.js';
import { bookingBadge, typeLabel, formatDateTime } from '../utils/format.js';
import { formatDateLong } from '../utils/time.js';
import { roomService } from '../services/roomService.js';

export async function showBookingDetail(b) {
  const room = await roomService.get(b.room_id);
  openModal({
    title: 'รายละเอียดการจอง',
    size: 'md',
    html: `
      <dl class="detail-list">
        <dt>สถานะ</dt><dd>${bookingBadge(b.status)}</dd>
        <dt>ห้อง</dt><dd>${room ? `${esc(room.room_name)} <span class="muted">(${esc(room.room_code)})</span>` : '<span class="muted">ห้องถูกลบแล้ว</span>'}</dd>
        <dt>วันที่</dt><dd>${esc(formatDateLong(b.booking_date))}</dd>
        <dt>เวลา</dt><dd>${esc(b.start_time)}–${esc(b.end_time)} น.</dd>
        <dt>ผู้จอง</dt><dd>${esc(b.requester_name)} <span class="muted">(${esc(typeLabel(b.requester_type))})</span></dd>
        <dt>อีเมล</dt><dd>${esc(b.requester_email)}</dd>
        <dt>จำนวนผู้ใช้</dt><dd>${b.number_of_users} คน</dd>
        <dt>วัตถุประสงค์</dt><dd>${esc(b.purpose)}</dd>
        ${b.admin_comment ? `<dt>ความเห็นผู้ดูแล</dt><dd>${esc(b.admin_comment)}</dd>` : ''}
        <dt>ส่งคำขอเมื่อ</dt><dd>${esc(formatDateTime(b.created_at))}</dd>
        <dt>แก้ไขล่าสุด</dt><dd>${esc(formatDateTime(b.updated_at))}</dd>
      </dl>
      <div class="modal-actions"><button type="button" class="btn btn-ghost" data-close>ปิด</button></div>`,
  });
}
