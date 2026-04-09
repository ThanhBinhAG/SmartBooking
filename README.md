# 📱 Smart Booking 3D - Hệ Thống Đặt Phòng Họp Thông Minh

Một ứng dụng web hiện đại cho phép đặt phòng họp không gian làm việc một cách dễ dàng. Hệ thống có khả năng xem trực quan không gian 3D, quản lý đặt chỗ, xử lý thanh toán và tuân thủ các quy định pháp lý Việt Nam.

## 🎯 Tính Năng Chính

### 👥 Người Dùng (Customer)
- ✅ Đăng ký/Đăng nhập với xác thực JWT
- ✅ Duyệt danh sách phòng họp
- ✅ Xem chi tiết phòng với mô hình 3D
- ✅ Đặt phòng/không gian làm việc
- ✅ Xem lịch sử đặt chỗ
- ✅ Tạo mã QR cho phần xác nhận
- ✅ Quản lý tài khoản cá nhân

### 👨‍💼 Quản Trị Viên (Admin)
- ✅ Quản lý danh sách phòng/thiết bị
- ✅ Thêm/sửa/xóa phòng
- ✅ Tải lên hình ảnh phòng
- ✅ Xem tất cả đặt chỗ
- ✅ Quản lý người dùng
- ✅ Ghi chú hành chính
- ✅ Thống kê sử dụng

### 🔐 Bảo Mật
- ✅ Mã hóa mật khẩu (bcryptjs)
- ✅ Token JWT cho phiên đang hoạt động
- ✅ CORS bảo mật
- ✅ Helmet cho các header bảo mật HTTP
- ✅ Validation dữ liệu đầu vào (Joi)
- ✅ Tuân thủ Nghị định 13/2023 về bảo vệ dữ liệu cá nhân

## 📋 Yêu Cầu Hệ Thống

- **Docker & Docker Compose**: v20.10+
- **Node.js**: v18.0+ (cho phát triển cục bộ)
- **PostgreSQL**: v16+ (chạy trong container)
- **Trình duyệt hiện đại**: Chrome, Firefox, Safari, Edge

## 🚀 Cài Đặt & Chạy

### 1️⃣ Cách Nhanh (Dùng Docker Compose)

```bash
# Clone repository
git clone <repository-url>
cd smart-booking-3d

# Tạo file .env (copy từ backend/.env.example)
cp backend/.env.example backend/.env

# Chạy ứng dụng
npm start

# Dừng ứng dụng
npm stop

# Restart ứng dụng
npm restart

# Xem logs
npm logs
```

**Ứng dụng sẽ chạy tại:**
- 🌐 Frontend: http://localhost
- 📡 Backend API: http://localhost:3000
- 🗄️ PostgreSQL: localhost:5432

### 2️⃣ Chạy Cục Bộ (Phát Triển)

#### Backend
```bash
cd backend

# Cài đặt dependencies
npm install

# Tạo file .env
cp .env.example .env

# Chạy migration database
npm run migrate  # (nếu có script)

# Chạy server
npm start       # Production
npm run dev     # Development với nodemon
```

#### Frontend
```bash
# Mở frontend/index.html trong trình duyệt
# Hoặc dùng live server extension trong VSCode
```

## 📁 Cấu Trúc Dự Án

```
smart-booking-3d/
├── 📄 docker-compose.yml      # Cấu hình Docker Compose
├── 📄 nginx.conf              # Cấu hình Nginx reverse proxy
├── 📄 package.json            # Dependencies chính
│
├── 📁 backend/               # Backend Node.js/Express
│   ├── 📄 server.js          # Entry point
│   ├── 📄 Dockerfile         # Docker config
│   ├── 📄 package.json       # Dependencies backend
│   ├── 📄 .env.example       # Mẫu biến môi trường
│   │
│   ├── 📁 config/            # Cấu hình ứng dụng
│   │   ├── app.js            # Cấu hình Express
│   │   └── database.js       # Cấu hình PostgreSQL
│   │
│   ├── 📁 src/
│   │   ├── 📁 controllers/   # Xử lý logic API
│   │   │   ├── authController.js
│   │   │   ├── bookingController.js
│   │   │   ├── roomController.js
│   │   │   ├── equipmentController.js
│   │   │   └── ...
│   │   │
│   │   ├── 📁 routes/        # Định nghĩa endpoint API
│   │   │   ├── auth.js
│   │   │   ├── bookings.js
│   │   │   ├── rooms.js
│   │   │   └── ...
│   │   │
│   │   ├── 📁 models/        # Mô hình database
│   │   │   ├── userModel.js
│   │   │   ├── roomModel.js
│   │   │   ├── bookingModel.js
│   │   │   └── equipmentModel.js
│   │   │
│   │   ├── 📁 middlewares/   # Middleware Express
│   │   │   ├── authMiddleware.js      # Xác thực JWT
│   │   │   ├── uploadMiddleware.js    # Xử lý upload ảnh
│   │   │   └── validationMiddleware.js
│   │   │
│   │   ├── 📁 services/      # Logic kinh doanh
│   │   │   ├── paymentService.js  # Xử lý thanh toán
│   │   │   ├── notificationService.js
│   │   │   └── qrService.js       # Tạo mã QR
│   │   │
│   │   ├── 📁 utils/         # Hàm tiện ích
│   │   │   └── db.js         # Kết nối database
│   │   │
│   │   └── 📁 uploads/       # Thư mục upload hình ảnh
│   │
│   └── 📁 node_modules/      # Dependencies (git ignored)
│
├── 📁 frontend/              # Frontend HTML/CSS/JS
│   ├── 📄 index.html         # Trang chủ
│   ├── 📄 booking.html       # Trang đặt phòng
│   ├── 📄 dashboard.html     # Dashboard người dùng
│   ├── 📄 admin.html         # Trang quản trị
│   ├── 📄 room-detail.html   # Chi tiết phòng
│   │
│   ├── 📁 css/               # Stylesheet
│   │   ├── style.css         # CSS chính
│   │   ├── admin.css         # CSS admin
│   │   └── animations.css    # CSS animations
│   │
│   ├── 📁 js/                # JavaScript
│   │   ├── api.js            # Gọi API backend
│   │   ├── auth.js           # Xác thực
│   │   ├── main.js           # Logic chính
│   │   ├── booking.js        # Logic đặt chỗ
│   │   ├── admin.js          # Logic admin
│   │   ├── room3d.js         # Xem 3D phòng
│   │   └── effects.js        # Hiệu ứng
│   │
│   ├── 📁 assets/            # Tài nguyên
│   │   └── 📁 3d-models/     # Mô hình 3D
│   │
│   └── 📁 pages/             # Các trang khác
│
├── 📁 database/              # Script database
│   └── 📁 migrations/        # SQL migrations
│       ├── 001_create_extensions.sql
│       ├── 002_create_tables.sql
│       ├── 003_seed_data.sql
│       ├── 004_room_images.sql
│       └── 005_add_admin_note_and_fix_rooms.sql
│
├── 📄 .gitignore             # Ignore file
└── 📄 .env                   # Biến môi trường (git ignored)
```

## 🔌 API Endpoints

### Xác Thực (Auth)
```
POST   /api/auth/register      - Đăng ký người dùng mới
POST   /api/auth/login         - Đăng nhập
POST   /api/auth/logout        - Đăng xuất
GET    /api/auth/user          - Lấy thông tin người dùng
```

### Phòng (Rooms)
```
GET    /api/rooms              - Danh sách phòng
GET    /api/rooms/:id          - Chi tiết phòng
POST   /api/rooms              - Tạo phòng (Admin)
PUT    /api/rooms/:id          - Cập nhật phòng (Admin)
DELETE /api/rooms/:id          - Xóa phòng (Admin)
```

### Đặt Chỗ (Bookings)
```
POST   /api/bookings           - Tạo đặt chỗ
GET    /api/bookings           - Danh sách đặt chỗ của người dùng
GET    /api/bookings/:id       - Chi tiết đặt chỗ
PUT    /api/bookings/:id       - Cập nhật đặt chỗ
DELETE /api/bookings/:id       - Hủy đặt chỗ
```

### Thiết Bị (Equipment)
```
GET    /api/equipment          - Danh sách thiết bị
POST   /api/equipment          - Tạo thiết bị (Admin)
PUT    /api/equipment/:id      - Cập nhật thiết bị (Admin)
DELETE /api/equipment/:id      - Xóa thiết bị (Admin)
```

### Quản Trị (Admin)
```
GET    /api/admin/stats        - Thống kê
PUT    /api/admin/note/:id     - Thêm ghi chú
GET    /api/admin/users        - Danh sách người dùng
```

## ⚙️ Biến Môi Trường (.env)

```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=smart_booking
DB_USER=booking_user
DB_PASSWORD=booking_pass_2024

# Ứng dụng
NODE_ENV=development
PORT=3000

# Frontend
FRONTEND_URL=*

# JWT (nếu có)
JWT_SECRET=your_secret_key_here

# File upload
MAX_FILE_SIZE=5242880  # 5MB
```

## 🔑 Tài Khoản Mặc Định

Sau khi chạy migration, hệ thống sẽ tạo sẵn các tài khoản mẫu:

| Email | Mật khẩu | Vai trò | Mô tả |
|-------|----------|---------|-------|
| `admin@smartbooking.vn` | `admin123` | Admin | Tài khoản quản trị viên |
| `staff@smartbooking.vn` | `admin123` | Staff | Tài khoản nhân viên |
| `customer@smartbooking.vn` | `admin123` | Customer | Tài khoản khách hàng |

**⚠️ Lưu ý:** Trong môi trường production, hãy thay đổi mật khẩu mặc định và xóa các tài khoản không cần thiết.

## 🔑 Loại Người Dùng (Roles)

| Role | Quyền | Chức Năng |
|------|-------|----------|
| **customer** | Người dùng thường | Đặt phòng, xem đặt chỗ |
| **admin** | Quản trị toàn bộ | Quản lý mọi thứ |
| **staff** | Nhân viên | Hỗ trợ người dùng |

## 🗄️ Bảng Database

- **users**: Thông tin người dùng
- **rooms**: Danh sách phòng họp
- **equipment**: Danh sách thiết bị
- **bookings**: Các đặt chỗ/đơn đặt
- **booking_equipment**: Mối quan hệ đặt chỗ ↔ thiết bị

## 📦 Dependencies Chính

### Backend
- **Express.js**: Web framework
- **PostgreSQL (pg)**: Database
- **JWT (jsonwebtoken)**: Xác thực token
- **bcryptjs**: Mã hóa mật khẩu
- **Multer**: Xử lý upload file
- **Sharp**: Xử lý ảnh
- **QRCode**: Tạo mã QR
- **Joi**: Validation dữ liệu
- **Helmet**: Bảo mật header HTTP
- **CORS**: Xử lý cross-origin requests

## 🛠️ Lệnh Npm

```bash
# Chạy ứng dụng với Docker
npm start          # Khởi động toàn bộ
npm stop           # Dừng ứng dụng
npm restart        # Restart
npm logs           # Xem logs
npm build          # Build lại image

# Backend (nếu chạy cục bộ)
npm run dev        # Chạy với nodemon
npm test           # Chạy test
```

## 🐛 Troubleshooting

### Lỗi kết nối database
```bash
# Kiểm tra kết nối PostgreSQL
docker logs booking_postgres

# Restart database container
docker-compose restart postgres
```

### Lỗi port đã sử dụng
```bash
# Kiểm tra port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Hoặc thay đổi PORT trong .env
PORT=3001
```

### Lỗi upload ảnh
- Kiểm tra thư mục `backend/uploads/` tồn tại
- Kiểm tra quyền ghi (write permission)
- Kiểm tra dung lượng file ≤ 5MB

## 📚 Tài Liệu Thêm

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Docker Documentation](https://docs.docker.com/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc7519)

## 👨‍💻 Đóng Góp

Mọi đóng góp đều được chào đón! Vui lòng:
1. Fork repository
2. Tạo branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit thay đổi (`git commit -m 'Add some AmazingFeature'`)
4. Push lên branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

Dự án này được cấp phép dưới giấy phép MIT.

## 📧 Liên Hệ

Nếu có câu hỏi hoặc đề xuất, vui lòng liên hệ:
- Email: tn813615@gmail.com
- Issue Tracker: [GitHub Issues](https://github.com/ThanhBinhAG/SmartBooking/issues)

---

**Được phát triển với ❤️ tại Việt Nam**
