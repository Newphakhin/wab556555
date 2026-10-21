# Simple Booking System for Lab Room

ระบบจองห้องปฏิบัติการ สาขาวิชาวิศวกรรมคอมพิวเตอร์ มหาวิทยาลัยกาฬสินธุ์  
พัฒนาตาม SRS (MVP ระยะเวลา 2 สัปดาห์) ด้วย **HTML5 + CSS3 + JavaScript (ES Modules)** จัดเก็บข้อมูลหลักใน **IndexedDB** (`LabBookingDB`) และ Session ใน **LocalStorage** ไม่ต้องติดตั้งแพ็กเกจหรือใช้ขั้นตอน build

- **ผู้จัดทำ:** นาย ภคิน ภารสมบูรณ์
- **อาจารย์ประจำวิชา / ที่ปรึกษา:** อาจารย์ วรพจน์ สมมูล
- **GitHub Repository:** [https://github.com/Newphakhin/esfsdfsdf](https://github.com/Newphakhin/esfsdfsdf)
- **Demo URL:** _(ใส่ URL หลัง deploy บน Vercel / Netlify / GitHub Pages)_

## ฟีเจอร์ (ครบตาม MVP และ Acceptance Criteria)

| FR | ฟีเจอร์ | หน้า / ไฟล์ |
|---|---|---|
| FR-01/02 | รายการห้อง + รายละเอียดห้อง | `#/rooms`, `#/rooms/:id` |
| FR-03–05 | Admin เพิ่ม/แก้ไข/ลบห้อง | `#/admin/rooms` |
| FR-06/08 | ส่งคำขอจอง สถานะเริ่มต้น `Pending` | `#/book` |
| FR-07 | ตรวจเวลาทับซ้อน (เฉพาะรายการ `Approved`) | `js/domain/rules.js` |
| FR-09 | การจองของฉัน + ยกเลิก (ก่อนถึงเวลา) | `#/my` |
| FR-10–13 | Admin ดูทั้งหมด / อนุมัติ / ปฏิเสธ (ต้องมีเหตุผล) / ยกเลิก | `#/admin/bookings` |
| FR-14 | ตารางการจองรายวัน/รายสัปดาห์ | `#/schedule` |
| FR-15 | ค้นหาและกรองตามห้อง วันที่ ผู้จอง สถานะ | `#/admin/bookings` |
| FR-16 | Dashboard สรุปตามสถานะ (Chart.js) | `#/admin/dashboard` |
| FR-17 | Responsive (มือถือ/แท็บเล็ต/เดสก์ท็อป) | `css/style.css` |
| NFR-05 | ระบบเข้าสู่ระบบสำหรับผู้ดูแลระบบ (Admin Login) | `#/login` (รหัสผ่าน: `admin123`) |

**บทบาทผู้ใช้:**
- **User View:** เข้าใช้งานได้ทันที สามารถดูห้อง ส่งคำขอจอง ดูตารางการจอง และจัดการการจองของตนเองตามอีเมล
- **Admin View:** เข้าสู่ระบบผ่านหน้า `#/login` (รหัสผ่านเริ่มต้น `admin123`) เพื่อเข้าถึง Dashboard, จัดการคำขอจอง และจัดการข้อมูลห้องปฏิบัติการ (หากไม่ได้ Login ระบบจะ Redirect ไปหน้า `#/login` อัตโนมัติตาม NFR-05)

## วิธีติดตั้งและใช้งาน

ไม่ต้องติดตั้งแพ็กเกจ เพียงเปิดผ่าน web server แบบ static (ต้องใช้ server เพราะใช้ ES Modules — เปิดไฟล์ด้วย `file://` ตรง ๆ ไม่ได้):

```bash
# เลือกอย่างใดอย่างหนึ่ง
python -m http.server 5173        # แล้วเปิด http://localhost:5173
npx serve .                       # หรือ npm start
```

ปุ่ม **"รีเซ็ตข้อมูลตัวอย่าง"** ที่ footer จะล้างข้อมูลและกลับไปใช้ข้อมูลตัวอย่าง

### ทดสอบ

```bash
node tests/overlap.test.js    # logic ตรวจเวลาทับซ้อน + validation (29 เทสต์)
node tests/service.test.js    # service layer ด้วย IndexedDB จำลอง (19 เทสต์)
```

### Deploy (Netlify / Vercel / GitHub Pages)

เป็นเว็บ static ล้วน: push ขึ้น GitHub (`https://github.com/Newphakhin/esfsdfsdf.git`) แล้วเชื่อมกับ Netlify, Vercel หรือ GitHub Pages  
ไม่ต้องตั้ง build command ใช้ Publish directory = `.` (root ของโปรเจกต์)

## โครงสร้างโปรเจกต์

```
index.html                  # โครงหน้าเว็บหลัก (SPA Shell)
css/style.css               # Design system + responsive layout
js/
  app.js                    # bootstrap, เมนูตามบทบาท, route guard (adminOnly)
  router.js                 # hash router (#/path/:param?query)
  db.js                     # IndexedDB wrapper (stores: rooms, bookings)
  session.js                # LocalStorage session (Admin token + User profile)
  seed.js                   # ข้อมูลตัวอย่าง: ห้อง 5 ห้อง + การจอง 16 รายการ
  domain/
    constants.js            # สถานะการจอง / สถานะห้อง / ประเภทผู้จอง
    rules.js                # ⭐ isOverlap, findConflicts, validateBooking, canUserCancel
  services/
    roomService.js          # CRUD ห้องปฏิบัติการ (async)
    bookingService.js       # create / approve / reject / cancel / search / stats (async)
  components/               # roomCard, bookingDetail (modal)
  pages/                    # home, roomList, roomDetail, bookingForm, myBookings,
                            # schedule, login, adminBookings, adminRooms, dashboard
  utils/                    # time, format, dom
tests/                      # unit tests (overlap.test.js, service.test.js)
```

แยกชั้นชัดเจน: **pages (UI) → services (ข้อมูล) → domain/rules (กฎธุรกิจ แบบ pure function)**  
ทำให้ทดสอบ logic ได้โดยไม่ต้องใช้เบราว์เซอร์ และสลับแหล่งข้อมูลได้โดยแก้เฉพาะ `services/` หรือ `db.js`

## Logic การตรวจเวลาทับซ้อน (หัวใจของระบบ)

ห้องเดียวกัน + วันเดียวกัน จะทับซ้อนเมื่อ

```js
new_start < existing_end  &&  new_end > existing_start
```

| รายการเดิม | รายการใหม่ | ผล |
|---|---|---|
| 09:00–11:00 | 10:00–12:00 | ซ้ำซ้อน |
| 09:00–11:00 | 08:00–09:30 | ซ้ำซ้อน |
| 09:00–11:00 | 11:00–12:00 | ไม่ซ้ำซ้อน (ต่อกันพอดี) |
| 13:00–15:00 | 09:00–12:00 | ไม่ซ้ำซ้อน |

หลักการสำคัญ:
- แปลงเวลาเป็น **นาที** ก่อนเทียบ (ไม่เทียบเป็นสตริง) — `toMin("09:30") = 570`
- เทียบเฉพาะรายการสถานะ **Approved** ตาม SRS ข้อ 13 จึงจองซ้อนกับ Pending ได้
- ตอน **อนุมัติ** ระบบตรวจซ้ำอีกครั้ง (`excludeId` = ตัวเอง) เพราะอาจมีรายการอื่นถูกอนุมัติไปก่อน ทำให้ไม่มี Approved ซ้อนกันเด็ดขาด
- ฟอร์มจองแจ้งเตือนทับซ้อนแบบ real-time ก่อนกดส่ง และ Admin เห็นเตือนที่รายการ Pending ที่ชนกัน (ปุ่มอนุมัติถูกปิด)

## กฎการจอง

- ต้องเลือกห้อง วันที่ เวลาเริ่ม/สิ้นสุด; เวลาเริ่ม < เวลาสิ้นสุด
- จองห้องสถานะ Maintenance / Closed ไม่ได้
- จองย้อนหลังไม่ได้ และจำนวนผู้ใช้ต้องไม่เกินความจุห้อง
- คำขอใหม่เป็น `Pending` → Admin `Approved` / `Rejected` (ต้องระบุเหตุผล) / `Cancelled`
- User ยกเลิกได้เฉพาะรายการของตนเอง (ตามอีเมล) และต้องยังไม่ถึงเวลาเริ่ม
- ลบห้องไม่ได้หากยังมีการจอง Pending/Approved ตั้งแต่วันนี้เป็นต้นไป

## ข้อมูลตัวอย่าง

- ห้องปฏิบัติการ 5 ห้อง: CE-LAB-01, CE-LAB-02, NET-LAB, IOT-LAB, PROJECT-ROOM
- การจอง 16 รายการ ครบทุกสถานะ (วันที่คำนวณจากวันที่เปิดใช้ครั้งแรก) มีกรณี Pending ที่เวลาซ้อนกันเองเพื่อสาธิตการอนุมัติ
- ผู้ใช้เริ่มต้นเป็น `somchai@ksu.ac.th` (เปลี่ยนได้ที่หน้า "การจองของฉัน")

## การใช้ AI Tools ในการพัฒนา

> _(แก้ไขส่วนนี้ให้ตรงกับการใช้งานจริงก่อนส่ง และอธิบายโค้ดหลักได้ด้วยตนเอง โดยเฉพาะ `js/domain/rules.js`)_

- **Antigravity (AI coding assistant):** วางแผนจาก SRS, ออกแบบโครงสร้างโปรเจกต์และ data model, เขียน component/service, เขียน logic ตรวจเวลาทับซ้อนและ validation, สร้างข้อมูลตัวอย่าง, เขียน unit test, ทดสอบ flow ด้วย DOM จำลอง, ปรับ UI ให้ responsive และเขียน README นี้
- **สิ่งที่ผู้พัฒนาต้องตรวจสอบเอง:** logic `isOverlap` / `findConflicts`, flow การอนุมัติ, และการ deploy

## ฟีเจอร์เสริมที่ยังไม่ได้ทำ

Login จริง, Calendar แบบลากวาง, แจ้งเตือนอีเมล, QR Code, Export CSV/PDF, วันหยุด, แนบไฟล์, Dark mode สลับได้ (ธีมปัจจุบันเป็นโทนมืด) — เพิ่มได้ภายหลังโดยไม่กระทบโครงสร้างเดิม
