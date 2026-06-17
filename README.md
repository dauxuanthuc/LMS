# Dự án LMS (Learning Management System)

Hệ thống học trực tuyến và thi trắc nghiệm được phát triển bằng React (Vite + TS + Tailwind CSS) và Node.js Express với Prisma ORM & PostgreSQL.

---

## Cấu Trúc Thư Mục

- `/backend`: API Server (Node.js, Express, TypeScript, Prisma ORM, Multer cho upload PDF).
- `/frontend`: Client Single Page App (React, TypeScript, Vite, Tailwind CSS, custom Canvas PDF Viewer).

---

## Hướng Dẫn Cài Đặt & Chạy Dự Án

### Bước 1: Cấu hình Cơ sở dữ liệu (Database)

1. Mở file [backend/.env](file:///c:/Users/Admin/Documents/GitHub/LMS/backend/.env)
2. Thay thế giá trị của `DATABASE_URL` bằng chuỗi kết nối PostgreSQL của bạn (ví dụ: lấy từ Supabase):
   ```env
   DATABASE_URL="postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres?schema=public"
   ```

### Bước 2: Chạy Migration và Seed Dữ liệu mẫu

Mở terminal tại thư mục `/backend` và chạy các lệnh sau:

1. **Khởi tạo cơ sở dữ liệu và đồng bộ schema**:
   ```bash
   npx prisma migrate dev --name init
   ```
2. **Khởi tạo dữ liệu mẫu (Tài khoản Admin, Student, Khóa học và Đề thi mẫu)**:
   ```bash
   npm run prisma:seed
   ```

*Sau khi chạy seed, hệ thống sẽ có sẵn các tài khoản sau:*
- **Admin**:
  - Email: `admin@lms.com`
  - Mật khẩu: `AdminPassword123`
- **Học viên (Student)**:
  - Email: `student@lms.com`
  - Mật khẩu: `StudentPassword123`

---

### Bước 3: Chạy Dự án dưới môi trường Phát triển (Development)

Bạn cần khởi động đồng thời cả Backend và Frontend:

#### Khởi chạy Backend:
Mở một terminal mới tại thư mục `/backend` và chạy:
```bash
npm run dev
```
*Backend sẽ chạy tại cổng `http://localhost:5000`*

#### Khởi chạy Frontend:
Mở một terminal khác tại thư mục `/frontend` và chạy:
```bash
npm run dev
```
*Frontend sẽ chạy tại cổng `http://localhost:3000`*

---

## Các Chức Năng Chính Đã Hoàn Thành

1. **Đăng nhập phân quyền**: Đăng nhập nhanh bằng tài khoản demo trực quan cho Admin và Học viên.
2. **Quản lý học viên (Admin)**: Thêm mới, chỉnh sửa thông tin học viên, xóa học viên và **Khóa/Mở khóa tài khoản** học viên. Học viên bị khóa sẽ lập tức bị đá phiên đăng nhập và không thể đăng nhập lại.
3. **Quản lý khóa học (Admin)**: CRUD khóa học trực tiếp từ trang Dashboard.
4. **Quản lý tài liệu (Admin)**: Tải lên tài liệu PDF với dung lượng hỗ trợ lên tới **100MB**.
5. **Xem tài liệu PDF online (Học viên)**: Trình xem tài liệu trực tuyến tùy biến, hỗ trợ chuyển trang, phóng to/thu nhỏ, **Tìm kiếm nội dung text trên các trang** và chặn tải xuống thông qua kết xuất Canvas kèm tắt menu chuột phải.
6. **Tạo đề thi (Admin)**: Công cụ tạo đề thi trực quan, hỗ trợ thiết lập thời gian thi, số điểm cho từng câu và hỗ trợ 3 loại câu hỏi:
   - Trắc nghiệm lựa chọn đáp án đúng
   - Đúng / Sai
   - Điền từ vào chỗ trống
7. **Làm bài kiểm tra (Học viên)**: Giao diện thi chuyên nghiệp với đồng hồ đếm ngược, bảng tiến trình câu hỏi đã trả lời và **Tự động nộp bài khi hết giờ**.
8. **Chấm điểm tự động & Xem kết quả**: Chấm điểm tự động và quy đổi về thang điểm 10. Học viên và Admin có thể xem lại bảng chi tiết từng câu đúng/sai kèm đáp án chuẩn.
9. **Thống kê kết quả**: Bảng điểm tổng hợp của toàn hệ thống dành cho Admin và lịch sử học tập cá nhân dành cho Học viên.
