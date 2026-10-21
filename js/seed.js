// ข้อมูลตัวอย่าง: ห้องปฏิบัติการ 5 ห้อง และรายการจอง 16 รายการ (วันที่อิงจากวันที่เปิดใช้ครั้งแรก)
import { db } from './db.js';
import { setProfile, getRole } from './session.js';
import { addDays, toDateStr } from './utils/time.js';

const iso = (offsetDays, base = toDateStr()) => `${addDays(base, offsetDays)}`;
const ts = (offsetDays, hh = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hh, 0, 0, 0);
  return d.toISOString();
};

export function buildSeedRooms() {
  const created = new Date().toISOString();
  return [
    {
      id: 'room-ce1', room_code: 'CE-LAB-01', room_name: 'Computer Engineering Lab 1',
      location: 'อาคารวิศวกรรมศาสตร์ ชั้น 2 ห้อง 201', capacity: 30,
      equipment: ['Computer', 'Projector', 'Internet'],
      description: 'ห้องปฏิบัติการคอมพิวเตอร์ขนาดใหญ่ สำหรับการเรียนการสอนเขียนโปรแกรมและวิชาปฏิบัติการ',
      status: 'Available', created_at: created,
    },
    {
      id: 'room-ce2', room_code: 'CE-LAB-02', room_name: 'Computer Engineering Lab 2',
      location: 'อาคารวิศวกรรมศาสตร์ ชั้น 2 ห้อง 202', capacity: 25,
      equipment: ['Computer', 'Smart TV', 'Internet'],
      description: 'ห้องปฏิบัติการคอมพิวเตอร์ขนาดกลาง เหมาะกับการอบรมกลุ่มย่อยและกิจกรรมเวิร์กช็อป',
      status: 'Available', created_at: created,
    },
    {
      id: 'room-net', room_code: 'NET-LAB', room_name: 'Network Laboratory',
      location: 'อาคารวิศวกรรมศาสตร์ ชั้น 3 ห้อง 305', capacity: 20,
      equipment: ['Router', 'Switch', 'Network Cable', 'Rack'],
      description: 'ห้องปฏิบัติการเครือข่าย สำหรับฝึกตั้งค่าอุปกรณ์เครือข่ายและทดลองโครงสร้างพื้นฐานระบบ',
      status: 'Available', created_at: created,
    },
    {
      id: 'room-iot', room_code: 'IOT-LAB', room_name: 'IoT and Embedded Systems Lab',
      location: 'อาคารวิศวกรรมศาสตร์ ชั้น 3 ห้อง 306', capacity: 20,
      equipment: ['Arduino', 'ESP32', 'Sensor Kit', 'Oscilloscope'],
      description: 'ห้องปฏิบัติการระบบสมองกลฝังตัวและ IoT พร้อมชุดเซนเซอร์และเครื่องมือวัดสัญญาณ',
      status: 'Available', created_at: created,
    },
    {
      id: 'room-proj', room_code: 'PROJECT-ROOM', room_name: 'Student Project Room',
      location: 'อาคารวิศวกรรมศาสตร์ ชั้น 1 ห้อง 105', capacity: 10,
      equipment: ['Whiteboard', 'Meeting Table', 'Power Outlet'],
      description: 'ห้องทำงานกลุ่มสำหรับโปรเจกต์นักศึกษา ประชุมทีม และติวหนังสือ',
      status: 'Available', created_at: created,
    },
  ];
}

export function buildSeedBookings() {
  const people = {
    somchai: ['สมชาย ใจดี', 'somchai@ksu.ac.th', 'Student'],
    suda: ['อ.สุดา รักเรียน', 'suda.r@ksu.ac.th', 'Teacher'],
    anan: ['อนันต์ มั่นคง', 'anan@ksu.ac.th', 'Student'],
    malee: ['มาลี สดใส', 'malee@ksu.ac.th', 'Student'],
    wichai: ['อ.วิชัย เก่งกล้า', 'wichai.k@ksu.ac.th', 'Teacher'],
    pim: ['พิมพ์ใจ ศรีสุข', 'pim@ksu.ac.th', 'Staff'],
  };

  const rows = [
    ['bk-01', 'room-ce1', 0, '09:00', '11:00', 'suda', 28, 'สอนปฏิบัติการวิชาโครงสร้างข้อมูล', 'Approved', ''],
    ['bk-02', 'room-ce1', 0, '13:00', '15:00', 'somchai', 20, 'ติวสอบกลางภาควิชา Programming', 'Pending', ''],
    ['bk-03', 'room-ce1', 0, '13:30', '14:30', 'anan', 6, 'ซ้อมนำเสนอโปรเจกต์', 'Pending', ''],
    ['bk-04', 'room-ce1', 1, '10:00', '12:00', 'wichai', 30, 'สอบปฏิบัติวิชาฐานข้อมูล', 'Approved', ''],
    ['bk-05', 'room-ce1', 3, '08:30', '10:30', 'malee', 15, 'อบรมการใช้ Git และ GitHub', 'Pending', ''],
    ['bk-06', 'room-ce1', 4, '13:00', '16:00', 'suda', 25, 'สอนชดเชยวิชาอัลกอริทึม', 'Approved', ''],
    ['bk-07', 'room-ce2', 0, '10:00', '12:00', 'pim', 20, 'อบรมการใช้งานระบบสารสนเทศสำหรับเจ้าหน้าที่', 'Approved', ''],
    ['bk-08', 'room-ce2', 1, '13:00', '16:00', 'somchai', 18, 'เวิร์กช็อป Web Development', 'Pending', ''],
    ['bk-09', 'room-ce2', -1, '13:00', '15:00', 'anan', 12, 'ทำงานกลุ่มวิชา Software Engineering', 'Rejected', 'ห้องถูกสำรองไว้สำหรับกิจกรรมของคณะ'],
    ['bk-10', 'room-net', 1, '09:00', '12:00', 'wichai', 20, 'Workshop Cisco Packet Tracer', 'Approved', ''],
    ['bk-11', 'room-net', 2, '13:00', '15:30', 'malee', 10, 'ฝึกตั้งค่า VLAN สำหรับสอบ CCNA', 'Rejected', 'อุปกรณ์ Router อยู่ระหว่างตรวจสอบ กรุณาเลือกวันอื่น'],
    ['bk-12', 'room-net', -2, '09:00', '11:00', 'suda', 18, 'สอนปฏิบัติวิชาเครือข่ายคอมพิวเตอร์', 'Approved', ''],
    ['bk-13', 'room-iot', 2, '09:00', '12:00', 'wichai', 20, 'ปฏิบัติการ ESP32 กับ MQTT', 'Approved', ''],
    ['bk-14', 'room-iot', 3, '14:00', '16:00', 'somchai', 5, 'ทดสอบเซนเซอร์โปรเจกต์ Smart Farm', 'Pending', ''],
    ['bk-15', 'room-proj', 0, '14:00', '16:00', 'anan', 8, 'ประชุมทีมโปรเจกต์จบ', 'Approved', ''],
    ['bk-16', 'room-proj', 1, '09:00', '10:30', 'malee', 6, 'ติวหนังสือกลุ่ม', 'Cancelled', 'ผู้จองยกเลิกเอง'],
  ];

  return rows.map(([id, room, off, start, end, who, users, purpose, status, comment]) => ({
    id,
    room_id: room,
    requester_name: people[who][0],
    requester_email: people[who][1],
    requester_type: people[who][2],
    booking_date: iso(off),
    start_time: start,
    end_time: end,
    purpose,
    number_of_users: users,
    status,
    admin_comment: comment,
    created_at: ts(Math.min(off, 0) - 1, 9),
    updated_at: ts(Math.min(off, 0) - 1, 9),
  }));
}

export async function seedAll() {
  const rooms = buildSeedRooms();
  for (const r of rooms) await db.put('rooms', r);

  const bookings = buildSeedBookings();
  for (const b of bookings) await db.put('bookings', b);

  setProfile({ name: 'สมชาย ใจดี', email: 'somchai@ksu.ac.th', type: 'Student' });
  localStorage.setItem('labbook.seeded', 'true');
}

/** เติมข้อมูลตัวอย่างเมื่อเปิดใช้งานครั้งแรก */
export async function ensureSeed() {
  if (!localStorage.getItem('labbook.seeded')) {
    await seedAll();
  }
}

/** ล้างข้อมูลทั้งหมดแล้วกลับไปใช้ข้อมูลตัวอย่าง */
export async function resetSeed() {
  localStorage.removeItem('labbook.seeded');
  
  const bookings = await db.getAll('bookings');
  for (const b of bookings) await db.delete('bookings', b.id);
  const rooms = await db.getAll('rooms');
  for (const r of rooms) await db.delete('rooms', r.id);

  await seedAll();
}
