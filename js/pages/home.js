import { roomService } from '../services/roomService.js';
import { bookingService } from '../services/bookingService.js';
import { roomCard } from '../components/roomCard.js';
import { toDateStr } from '../utils/time.js';

export async function homePage({ app }) {
  const rooms = await roomService.list();
  const stats = await bookingService.stats();
  const bookings = await bookingService.list();
  const today = toDateStr();
  const todayCount = bookings.filter((b) => b.booking_date === today && b.status === 'Approved').length;
  const available = rooms.filter((r) => r.status === 'Available').length;

  app.innerHTML = `
    <section class="hero">
      <span class="eyebrow">✨ สาขาวิชาวิศวกรรมคอมพิวเตอร์ · มหาวิทยาลัยกาฬสินธุ์</span>
      <h1>จองห้องปฏิบัติการ<br /><span class="grad-text">ง่าย เร็ว ไม่ซ้ำซ้อน</span></h1>
      <p class="lead">ตรวจห้องว่าง ส่งคำขอจอง และติดตามสถานะได้ในที่เดียว ระบบตรวจเวลาทับซ้อนให้อัตโนมัติ ผู้ดูแลอนุมัติได้ทันที</p>
      <div class="row">
        <a class="btn btn-primary btn-lg" href="#/rooms">เลือกห้องที่ต้องการจอง →</a>
        <a class="btn btn-ghost btn-lg" href="#/schedule">ดูตารางการจอง</a>
      </div>
    </section>

    <section class="stat-grid" aria-label="สรุปภาพรวม">
      <div class="card stat"><div class="num">${available}<span class="muted" style="font-size:1rem">/${rooms.length}</span></div><div class="label">ห้องที่พร้อมใช้งาน</div></div>
      <div class="card stat s-approved"><div class="num">${todayCount}</div><div class="label">การจองที่อนุมัติแล้ววันนี้</div></div>
      <div class="card stat s-pending"><div class="num">${stats.Pending}</div><div class="label">คำขอรออนุมัติ</div></div>
      <div class="card stat"><div class="num">${stats.total}</div><div class="label">การจองทั้งหมดในระบบ</div></div>
    </section>

    <h2 class="section-title">ห้องปฏิบัติการแนะนำ</h2>
    <div class="grid grid-cards">${rooms.slice(0, 3).map(roomCard).join('')}</div>
    <div class="center" style="margin-top:1.4rem"><a class="btn btn-ghost" href="#/rooms">ดูห้องทั้งหมด (${rooms.length})</a></div>

    <h2 class="section-title">ขั้นตอนการจอง</h2>
    <div class="grid grid-3">
      <div class="card"><div class="step-num">1</div><h3>เลือกห้อง</h3><p class="muted small" style="margin:0">ดูรายละเอียด ความจุ และอุปกรณ์ของห้องปฏิบัติการที่ต้องการ</p></div>
      <div class="card"><div class="step-num">2</div><h3>ส่งคำขอจอง</h3><p class="muted small" style="margin:0">ระบุวัน เวลา วัตถุประสงค์ และจำนวนผู้ใช้ ระบบตรวจเวลาทับซ้อนทันที</p></div>
      <div class="card"><div class="step-num">3</div><h3>รอการอนุมัติ</h3><p class="muted small" style="margin:0">ติดตามสถานะที่หน้า "การจองของฉัน" ผู้ดูแลจะอนุมัติหรือปฏิเสธพร้อมเหตุผล</p></div>
    </div>`;
}
