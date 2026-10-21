// ค่าคงที่ของโดเมน: สถานะการจอง สถานะห้อง และประเภทผู้จอง

export const BOOKING_STATUS = Object.freeze({
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
});

export const BOOKING_STATUS_LABEL = Object.freeze({
  Pending: 'รออนุมัติ',
  Approved: 'อนุมัติแล้ว',
  Rejected: 'ไม่อนุมัติ',
  Cancelled: 'ยกเลิก',
});

export const ROOM_STATUS_LABEL = Object.freeze({
  Available: 'พร้อมใช้งาน',
  Maintenance: 'ปิดปรับปรุง',
  Closed: 'ปิดให้บริการ',
});

export const REQUESTER_TYPES = Object.freeze({
  Student: 'นักศึกษา',
  Teacher: 'อาจารย์',
  Staff: 'เจ้าหน้าที่',
});

export const STATUS_ORDER = ['Pending', 'Approved', 'Rejected', 'Cancelled'];
