// สถานะ session แบบจำลอง: บทบาท (User/Admin) และโปรไฟล์ผู้จองปัจจุบัน

const PREFIX = 'labbook.';

function get(key, fallback = null) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function set(key, value) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value));
}

export const isAdmin = () => get('adminToken') === 'true';
export const loginAdmin = () => set('adminToken', 'true');
export const logoutAdmin = () => localStorage.removeItem(PREFIX + 'adminToken');

export const getRole = () => isAdmin() ? 'admin' : 'user';

export const getProfile = () => get('profile', { name: '', email: '', type: 'Student' });
export const setProfile = (p) => set('profile', p);
