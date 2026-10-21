import { loginAdmin } from '../session.js';
import { esc, toast } from '../utils/dom.js';
import { navigate } from '../router.js';

export function loginPage({ app }) {
  app.innerHTML = `
    <div class="card" style="max-width:400px;margin:4rem auto;padding:2.5rem">
      <div style="text-align:center;margin-bottom:2rem">
        <div style="font-size:3rem;margin-bottom:1rem">🔒</div>
        <h2 style="margin:0">ผู้ดูแลระบบ</h2>
        <p class="muted small">ลงชื่อเข้าใช้เพื่อจัดการห้องและอนุมัติการจอง</p>
      </div>
      <form id="loginForm" novalidate>
        <div class="field">
          <label for="adminPass">รหัสผ่าน</label>
          <input id="adminPass" type="password" placeholder="ใส่รหัสผ่าน (admin123)" autofocus required />
          <small class="field-error"></small>
        </div>
        <button class="btn btn-primary" type="submit" style="width:100%;margin-top:1rem">เข้าสู่ระบบ</button>
      </form>
    </div>
  `;

  const form = app.querySelector('#loginForm');
  const pass = app.querySelector('#adminPass');
  const err = app.querySelector('.field-error');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    err.textContent = '';
    
    // Hardcoded password for MVP
    if (pass.value === 'admin123') {
      loginAdmin();
      toast('เข้าสู่ระบบสำเร็จ', 'success');
      navigate('#/admin/dashboard');
    } else {
      pass.closest('.field').classList.add('has-error');
      err.textContent = 'รหัสผ่านไม่ถูกต้อง';
    }
  });
}
