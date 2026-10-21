import { roomService } from '../services/roomService.js';
import { roomCard } from '../components/roomCard.js';
import { emptyState } from '../utils/format.js';

export async function roomListPage({ app }) {
  const rooms = await roomService.list();
  app.innerHTML = `
    <div class="page-head">
      <div><h2>ห้องปฏิบัติการ</h2><p>เลือกห้องที่ต้องการแล้วส่งคำขอจองได้ทันที</p></div>
    </div>
    <div class="toolbar">
      <div class="field grow"><label for="roomSearch">ค้นหาห้อง</label><input id="roomSearch" type="search" placeholder="ชื่อห้อง รหัสห้อง หรืออุปกรณ์..." /></div>
      <div class="field"><label for="roomStatusFilter">สถานะ</label>
        <select id="roomStatusFilter"><option value="">ทั้งหมด</option><option value="Available">พร้อมใช้งาน</option><option value="Maintenance">ปิดปรับปรุง</option><option value="Closed">ปิดให้บริการ</option></select></div>
    </div>
    <div id="roomGrid" class="grid grid-cards"></div>`;

  const grid = app.querySelector('#roomGrid');
  const draw = () => {
    const q = app.querySelector('#roomSearch').value.trim().toLowerCase();
    const st = app.querySelector('#roomStatusFilter').value;
    const list = rooms.filter(
      (r) =>
        (!st || r.status === st) &&
        (!q || `${r.room_name} ${r.room_code} ${r.location} ${r.equipment.join(' ')}`.toLowerCase().includes(q))
    );
    grid.innerHTML = list.length
      ? list.map(roomCard).join('')
      : `<div style="grid-column:1/-1">${emptyState('🔍', 'ไม่พบห้องที่ตรงกับเงื่อนไข', 'ลองเปลี่ยนคำค้นหาหรือตัวกรอง')}</div>`;
  };
  app.querySelector('#roomSearch').addEventListener('input', draw);
  app.querySelector('#roomStatusFilter').addEventListener('change', draw);
  draw();
}
