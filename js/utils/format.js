// ตัวช่วยจัดรูปแบบการแสดงผล
import { BOOKING_STATUS_LABEL, ROOM_STATUS_LABEL, REQUESTER_TYPES } from '../domain/constants.js';
import { formatDate, parseDate } from './time.js';

export const bookingBadge = (s) =>
  `<span class="badge badge-${String(s).toLowerCase()}">${BOOKING_STATUS_LABEL[s] || s}</span>`;

export const roomBadge = (s) =>
  `<span class="badge badge-room-${String(s).toLowerCase()}">${ROOM_STATUS_LABEL[s] || s}</span>`;

export const typeLabel = (t) => REQUESTER_TYPES[t] || t;
export const timeRange = (b) => `${b.start_time}–${b.end_time} น.`;

export function dateTile(dateStr) {
  const d = parseDate(dateStr);
  return `<div class="date-tile"><b>${d.getDate()}</b><span>${formatDate(dateStr, { month: 'short' })}</span></div>`;
}

export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const emptyState = (emoji, title, text = '') =>
  `<div class="empty"><span class="emoji">${emoji}</span><h3>${title}</h3><p>${text}</p></div>`;
