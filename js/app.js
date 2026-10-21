// จุดเริ่มต้นของแอป: router, เมนูตามบทบาท, ระบบ Authentication
import { ensureSeed, resetSeed } from './seed.js';
import { route, resolveRoute, navigate } from './router.js';
import { getRole, isAdmin, logoutAdmin } from './session.js';
import { toast, confirmDialog, esc } from './utils/dom.js';
import { emptyState } from './utils/format.js';

import { homePage } from './pages/home.js';
import { roomListPage } from './pages/roomList.js';
import { roomDetailPage } from './pages/roomDetail.js';
import { bookingFormPage } from './pages/bookingForm.js';
import { myBookingsPage } from './pages/myBookings.js';
import { schedulePage } from './pages/schedule.js';
import { adminBookingsPage } from './pages/adminBookings.js';
import { adminRoomsPage } from './pages/adminRooms.js';
import { dashboardPage } from './pages/dashboard.js';
import { loginPage } from './pages/login.js';

const NAV = {
  user: [['#/', 'หน้าแรก'], ['#/rooms', 'ห้องปฏิบัติการ'], ['#/schedule', 'ตารางการจอง'], ['#/my', 'การจองของฉัน']],
  admin: [['#/', 'หน้าแรก'], ['#/rooms', 'ห้อง'], ['#/schedule', 'ตารางการจอง'], ['#/admin/dashboard', 'Dashboard', true], ['#/admin/bookings', 'จัดการการจอง', true], ['#/admin/rooms', 'จัดการห้อง', true]],
};

/** หน้า Admin: ถ้าไม่ได้ Login ให้ Redirect ไปหน้า Login (NFR-05) */
const adminOnly = (handler) => (ctx) => {
  if (isAdmin()) return handler(ctx);
  navigate('#/login');
};

route('/', homePage);
route('/rooms', roomListPage);
route('/rooms/:id', roomDetailPage);
route('/book', bookingFormPage);
route('/my', myBookingsPage);
route('/schedule', schedulePage);
route('/login', loginPage);
route('/admin/dashboard', adminOnly(dashboardPage));
route('/admin/bookings', adminOnly(adminBookingsPage));
route('/admin/rooms', adminOnly(adminRoomsPage));

const app = document.getElementById('app');
const nav = document.getElementById('mainNav');
const menuBtn = document.getElementById('menuBtn');
const authMenu = document.getElementById('authMenu');

function renderChrome(path) {
  const role = getRole();
  nav.innerHTML = NAV[role]
    .map(([href, label, adminLink]) => {
      const p = href.slice(1);
      const active = p === '/' ? path === '/' : path === p || path.startsWith(p + '/');
      return `<a href="${href}" class="${active ? 'active' : ''} ${adminLink ? 'admin-link' : ''}" ${active ? 'aria-current="page"' : ''}>${esc(label)}</a>`;
    })
    .join('');
    
  if (role === 'admin') {
    authMenu.innerHTML = `<button type="button" id="logoutBtn" style="color:var(--rejected)">ออกจากระบบ (Admin)</button>`;
  } else {
    authMenu.innerHTML = `<button type="button" id="loginBtn">เข้าสู่ระบบ (Admin)</button>`;
  }
}

async function render() {
  await ensureSeed();

  const r = resolveRoute();
  renderChrome(r.path);
  nav.classList.remove('open');
  menuBtn.setAttribute('aria-expanded', 'false');

  app.classList.remove('page-enter');
  void app.offsetWidth; // restart animation
  app.classList.add('page-enter');

  if (!r.handler) {
    app.innerHTML = `<div class="card" style="max-width:520px;margin:3rem auto">${emptyState('🧭', 'ไม่พบหน้าที่ต้องการ', '<a class="btn btn-primary btn-sm" href="#/">กลับหน้าแรก</a>')}</div>`;
  } else {
    // Show simple loader before resolving
    app.innerHTML = '<div class="center" style="padding:4rem;"><div class="spinner" style="border: 4px solid var(--border); border-top-color: var(--primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto;"></div><style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style></div>';
    await r.handler({ app, params: r.params, query: r.query });
  }
  document.title = `${document.querySelector('h2, h1')?.textContent?.trim() || 'Lab Room Booking'} | ระบบจองห้องปฏิบัติการ`;
  window.scrollTo({ top: 0 });
}

authMenu.addEventListener('click', (e) => {
  if (e.target.id === 'loginBtn') {
    navigate('#/login');
  } else if (e.target.id === 'logoutBtn') {
    logoutAdmin();
    toast('ออกจากระบบแล้ว', 'success');
    const { path } = resolveRoute();
    if (path.startsWith('/admin')) navigate('#/');
    else render();
  }
});

menuBtn.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuBtn.setAttribute('aria-expanded', String(open));
});

document.getElementById('resetData').addEventListener('click', async () => {
  const ok = await confirmDialog({ title: 'รีเซ็ตข้อมูล', message: 'ข้อมูลห้องและการจองทั้งหมดจะถูกแทนที่ด้วยข้อมูลตัวอย่าง ต้องการดำเนินการต่อหรือไม่?', confirmText: 'รีเซ็ต', danger: true });
  if (!ok) return;
  
  app.innerHTML = '<div class="center" style="padding:4rem;">กำลังรีเซ็ตข้อมูล...</div>';
  await resetSeed();
  await render();
  toast('รีเซ็ตเป็นข้อมูลตัวอย่างแล้ว', 'success');
});

window.addEventListener('hashchange', render);
// Start the app
render();
