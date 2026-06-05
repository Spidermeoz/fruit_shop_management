# Hệ thống Quản lý Cửa hàng Trái cây (Fruit Shop Management)

> **Tài liệu Hướng dẫn Sử dụng** — Phiên bản 1.0 | Cập nhật: 06/2026

Dự án này là một hệ thống quản lý bán hàng hoàn chỉnh dành cho một cửa hàng trái cây, bao gồm cả trang web cho khách hàng (client) và trang quản trị (admin dashboard) cho nhân viên.

---

## 📋 Mục lục

- [Kiến trúc & Cây công nghệ](#kiến-trúc--cây-công-nghệ)
- [🚀 Phần I: Hướng dẫn Cài đặt & Triển khai](#-phần-i-hướng-dẫn-cài-đặt--triển-khai)
- [👤 Phần II: Hướng dẫn Sử dụng cho Khách hàng](#-phần-ii-hướng-dẫn-sử-dụng-dành-cho-khách-hàng)
  - [Module K1 — Tài khoản & Xác thực](#module-k1--tài-khoản--xác-thực)
  - [Module K2 — Duyệt Sản phẩm & Danh mục](#module-k2--duyệt-sản-phẩm--danh-mục)
  - [Module K3 — Giỏ hàng](#module-k3--giỏ-hàng)
  - [Module K4 — Thanh toán & Đặt hàng](#module-k4--thanh-toán--đặt-hàng)
  - [Module K5 — Quản lý Đơn hàng của Khách](#module-k5--quản-lý-đơn-hàng-của-khách)
  - [Module K6 — Đánh giá Sản phẩm](#module-k6--đánh-giá-sản-phẩm)
- [🛠️ Phần III: Hướng dẫn Sử dụng cho Quản trị viên](#️-phần-iii-hướng-dẫn-sử-dụng-dành-cho-quản-trị-viên)
  - [Module A0 — Dashboard & Đăng nhập Admin](#module-a0--đăng-nhập-admin--bảng-điều-khiển)
  - [Nhóm 1: Quản lý Sản phẩm](#nhóm-1-quản-lý-sản-phẩm-catalog-management)
  - [Nhóm 2: Bán hàng & Đơn hàng](#nhóm-2-bán-hàng--đơn-hàng)
  - [Nhóm 3: Quản lý Kho & Chi nhánh](#-nhóm-3-quản-lý-kho--chi-nhánh)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)

---

## Kiến trúc & Cây công nghệ

Dự án được xây dựng theo kiến trúc **Monorepo**, tách biệt rõ ràng giữa Backend và Frontend.

### Backend

Backend được phát triển bằng **Node.js** và **TypeScript**, tuân thủ theo nguyên tắc **Clean Architecture** và các mẫu thiết kế của **Domain-Driven Design (DDD)**.

| Thành phần | Công nghệ |
|---|---|
| **Framework** | Express.js |
| **Ngôn ngữ** | TypeScript |
| **ORM** | Sequelize (PostgreSQL / MySQL / MariaDB) |
| **Xác thực** | JWT (JSON Web Tokens) |
| **Lưu trữ file** | Cloudinary |
| **AI / Chat** | Google Gemini API |

- `src/domain`: Business logic cốt lõi, entities và repository interfaces.
- `src/application`: Use cases điều phối domain logic.
- `src/infrastructure`: Triển khai cụ thể cho database, email, AI, storage.
- `src/interfaces`: REST API controllers và routes.

### Frontend

Frontend là **Single Page Application (SPA)** xây dựng bằng **React**.

| Thành phần | Công nghệ |
|---|---|
| **Framework** | React.js |
| **Ngôn ngữ** | TypeScript |
| **Build tool** | Vite |
| **Styling** | Tailwind CSS |
| **State** | React Context API |
| **Routing** | React Router DOM |

---

# 🚀 Phần I: Hướng dẫn Cài đặt & Triển khai

### Yêu cầu hệ thống

| Phần mềm | Phiên bản tối thiểu | Ghi chú |
|---|---|---|
| **Node.js** | 18.x trở lên | Khuyến nghị 20.x LTS |
| **npm** | 9.x trở lên | Đi kèm với Node.js |
| **PostgreSQL** | 14.x trở lên | Hoặc MySQL / MariaDB |
| **Cloudinary** | Tài khoản miễn phí | Lưu trữ ảnh sản phẩm |
| **Google Gemini API** | API Key hợp lệ | Dùng cho tính năng Chat AI |

> 📞 Liên hệ `0967004916` để nhận file cấu hình `.env` đầy đủ.

---

### 1. Cài đặt Backend

#### Bước 1 — Di chuyển vào thư mục backend và cài đặt dependencies

```bash
cd backend
npm install
```

#### Bước 2 — Tạo và cấu hình file môi trường

Tạo file `backend/.env` với nội dung sau (thay thế các giá trị tương ứng):

```env
# ==========================================
# CẤU HÌNH MÁY CHỦ
# ==========================================
PORT=8000
NODE_ENV=development

# ==========================================
# CƠ SỞ DỮ LIỆU (Ví dụ cho PostgreSQL)
# ==========================================
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=fruit_shop_db

# ==========================================
# XÁC THỰC JWT
# ==========================================
JWT_SECRET="your_super_secret_key_at_least_32_chars"
JWT_EXPIRES_IN="1d"
REFRESH_TOKEN_SECRET="another_super_secret_key_at_least_32_chars"
REFRESH_TOKEN_EXPIRES_IN="7d"

# ==========================================
# LƯU TRỮ ẢNH - CLOUDINARY
# ==========================================
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"

# ==========================================
# TRÍ TUỆ NHÂN TẠO - GOOGLE GEMINI (Chat AI)
# ==========================================
GEMINI_API_KEY="your_gemini_api_key"

# ==========================================
# EMAIL (Dùng cho quên mật khẩu / OTP)
# ==========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

#### Bước 3 — Khởi tạo cơ sở dữ liệu

```bash
# Tạo các bảng trong database
npm run db:migrate

# (Tuỳ chọn) Nạp dữ liệu mẫu
npm run db:seed
```

#### Bước 4 — Khởi động Backend Server

```bash
# Development (hot-reload)
npm run dev

# Production
npm run build
npm start
```

✅ **Backend server chạy tại:** `http://localhost:8000`

---

### 2. Cài đặt Frontend

#### Bước 1 — Di chuyển vào thư mục frontend và cài đặt dependencies

```bash
cd frontend
npm install
```

#### Bước 2 — Tạo file môi trường

Tạo file `frontend/.env.local`:

```env
# URL của backend API
VITE_API_BASE_URL=http://localhost:8000/api
```

> ⚡ **Khi deploy production:** Thay `http://localhost:8000/api` bằng URL thực của backend server.

#### Bước 3 — Khởi động Frontend

```bash
# Development
npm run dev

# Production build
npm run build
npm run preview
```

✅ **Frontend website chạy tại:** `http://localhost:5173`

---

### 3. Bảng Scripts hữu ích

#### Backend (`/backend`)

| Script | Mô tả |
|---|---|
| `npm run dev` | Chạy server development (hot-reload) |
| `npm run build` | Build TypeScript → JavaScript |
| `npm start` | Chạy server production (sau khi build) |
| `npm run lint` | Kiểm tra lỗi code với ESLint |
| `npm run db:migrate` | Chạy database migrations |

#### Frontend (`/frontend`)

| Script | Mô tả |
|---|---|
| `npm run dev` | Chạy development server |
| `npm run build` | Build ứng dụng cho production |
| `npm run preview` | Xem trước bản build production |
| `npm run lint` | Kiểm tra lỗi code với ESLint |

---

# 👤 Phần II: Hướng dẫn Sử dụng dành cho Khách hàng

> **Đường dẫn truy cập:** `http://localhost:5173` (hoặc domain website của cửa hàng)

---

## Module K1 — Tài khoản & Xác thực

### K1.1 Đăng ký tài khoản

1. Truy cập website và nhấn nút **"Đăng ký"** ở góc trên bên phải màn hình.
2. Điền đầy đủ thông tin:
   - **Họ và tên** (bắt buộc)
   - **Email** (bắt buộc — dùng để đăng nhập và nhận thông báo)
   - **Số điện thoại** (bắt buộc — dùng khi giao hàng)
   - **Mật khẩu** (tối thiểu 8 ký tự, gồm chữ hoa, chữ thường và số)
   - **Xác nhận mật khẩu**
3. Nhấn **"Tạo tài khoản"**.
4. ✅ Tài khoản tạo thành công, hệ thống tự động đăng nhập và về trang chủ.

> 📌 Mỗi địa chỉ email chỉ được đăng ký **một tài khoản duy nhất**.

### K1.2 Đăng nhập

1. Nhấn **"Đăng nhập"** ở góc trên phải.
2. Nhập **Email** và **Mật khẩu**.
3. Nhấn **"Đăng nhập"**.
4. ✅ Phiên đăng nhập được lưu trong **1 ngày** — đóng/mở lại trình duyệt vẫn còn đăng nhập.

### K1.3 Quên mật khẩu & Đặt lại mật khẩu

1. Tại trang Đăng nhập → nhấn **"Quên mật khẩu?"**.
2. Nhập **Email** đã đăng ký → nhấn **"Gửi OTP"**.
3. Kiểm tra hộp thư email, lấy **mã OTP 6 chữ số** (hiệu lực 10 phút).
4. Nhập mã OTP → nhấn **"Xác nhận"**.
5. Nhập **Mật khẩu mới** và **Xác nhận mật khẩu mới**.
6. Nhấn **"Đặt lại mật khẩu"**.
7. ✅ Đăng nhập với mật khẩu mới.

> 📧 Không nhận được email? Kiểm tra thư mục **Spam/Junk**.

### K1.4 Cập nhật hồ sơ cá nhân

1. Nhấn **tên/avatar** ở góc trên phải → **"Hồ sơ cá nhân"**.
2. Chỉnh sửa: Họ tên, Số điện thoại, Địa chỉ mặc định.
3. Nhấn **"Lưu thay đổi"**.

### K1.5 Đổi mật khẩu

1. **Hồ sơ cá nhân** → **"Đổi mật khẩu"**.
2. Nhập **Mật khẩu hiện tại** → **Mật khẩu mới** → **Xác nhận**.
3. Nhấn **"Cập nhật mật khẩu"**.

### K1.6 Đăng xuất

1. Nhấn **tên/avatar** → **"Đăng xuất"**.
2. ✅ Phiên bị xóa, chuyển về trang chủ.

---

## Module K2 — Duyệt Sản phẩm & Danh mục

### K2.1 Trang chủ

Trang chủ hiển thị:
- **Banner khuyến mãi** nổi bật theo mùa.
- **Danh mục nổi bật**: Trái cây trong nước, Nhập khẩu, Hữu cơ...
- **Sản phẩm bán chạy** và **Sản phẩm mới nhất**.
- **Bài viết blog** về dinh dưỡng và sức khỏe.

### K2.2 Duyệt theo Danh mục

1. Nhấn **tên danh mục** trên thanh điều hướng.
2. Trang danh mục hiển thị toàn bộ sản phẩm thuộc danh mục đó.
3. **Lọc sản phẩm** theo:
   - Khoảng giá (thanh trượt).
   - Nguồn gốc (trong nước / nhập khẩu).
   - Thẻ phân loại (hữu cơ, tươi ngon, đang mùa...).
4. **Sắp xếp** theo: Giá tăng dần / Giảm dần / Mới nhất / Bán chạy nhất.

### K2.3 Tìm kiếm sản phẩm

1. Nhấn biểu tượng **🔍** trên thanh điều hướng.
2. Gõ tên sản phẩm (VD: "xoài cát Hòa Lộc", "táo Fuji", "bưởi da xanh").
3. Nhấn **Enter** hoặc nút **"Tìm kiếm"**.

### K2.4 Xem chi tiết sản phẩm

Nhấn vào tên hoặc ảnh sản phẩm. Trang chi tiết hiển thị:

| Thông tin | Nội dung |
|---|---|
| **Ảnh sản phẩm** | Nhiều góc độ, ảnh phóng to |
| **Giá bán / Giá gốc** | Tự động hiển thị % giảm nếu có |
| **Nguồn gốc** | VD: Tiền Giang, Đà Lạt, Hàn Quốc |
| **Mô tả chi tiết** | Đặc điểm, mùa vụ, bảo quản, dinh dưỡng |
| **Biến thể** | Chọn khối lượng (500g / 1kg / 2kg) hoặc loại |
| **Đánh giá** | Số sao trung bình và nhận xét từ người mua |
| **Sản phẩm liên quan** | Gợi ý thêm ở cuối trang |

---

## Module K3 — Giỏ hàng

### K3.1 Thêm vào Giỏ hàng

**Từ danh sách sản phẩm:** Nhấn nút **"Thêm vào giỏ"** 🛒 trên thẻ sản phẩm.

**Từ trang chi tiết:**
1. Chọn **biến thể** (nếu có).
2. Nhập **số lượng**.
3. Nhấn **"Thêm vào giỏ hàng"**.

> 🔒 Cần **đăng nhập** trước khi thêm vào giỏ hàng.

### K3.2 Quản lý Giỏ hàng

1. Nhấn biểu tượng **🛒** trên header.
2. Trang giỏ hàng hiển thị: ảnh, tên, biến thể, đơn giá, số lượng, tổng tiền.
3. **Cập nhật số lượng:** Nhấn **+** / **−** hoặc nhập trực tiếp → **"Cập nhật"**.
4. **Xóa một sản phẩm:** Nhấn **🗑️** bên phải.
5. **Xóa tất cả:** Nhấn **"Xóa tất cả"** ở đầu trang.

---

## Module K4 — Thanh toán & Đặt hàng

### K4.1 Quy trình đặt hàng

Từ trang Giỏ hàng → nhấn **"Tiến hành thanh toán"**. Thực hiện theo 5 bước:

| Bước | Nội dung |
|---|---|
| **1. Thông tin giao hàng** | Chọn địa chỉ đã lưu hoặc nhập địa chỉ mới (họ tên, số ĐT, địa chỉ chi tiết) |
| **2. Chọn thời gian giao** | Chọn ngày và khung giờ giao hàng còn trống của chi nhánh gần nhất |
| **3. Mã khuyến mãi** | Nhập mã voucher → **"Áp dụng"** để tự động tính giảm giá |
| **4. Xem tóm tắt** | Kiểm tra lại sản phẩm, địa chỉ, phí ship, mã giảm và tổng thanh toán |
| **5. Đặt hàng** | Nhấn **"Đặt hàng ngay"** → nhận email xác nhận |

### K4.2 Phí vận chuyển

Phí tự động tính dựa trên: khu vực giao hàng, trọng lượng đơn và khuyến mãi miễn ship hiện có. Xem chi tiết ở Bước 4 trước khi xác nhận.

---

## Module K5 — Quản lý Đơn hàng của Khách

### K5.1 Xem lịch sử đơn hàng

**Tên/Avatar** → **"Đơn hàng của tôi"**. Danh sách từ mới đến cũ với: Mã đơn, Ngày đặt, Tổng giá trị, Trạng thái.

### Bảng trạng thái đơn hàng

| Trạng thái | Mô tả |
|---|---|
| 🟡 **Chờ xác nhận** | Vừa đặt, đang chờ admin xác nhận |
| 🔵 **Đã xác nhận** | Admin xác nhận, đang chuẩn bị hàng |
| 🟠 **Đang giao** | Shipper đang trên đường đến bạn |
| 🟢 **Đã giao** | Nhận hàng thành công |
| 🔴 **Đã hủy** | Đơn hàng đã bị hủy |

### K5.2 Xem chi tiết đơn hàng

Nhấn vào **mã đơn hàng** để xem: sản phẩm, địa chỉ giao, thời gian giao, timeline trạng thái và thông tin thanh toán.

### K5.3 Hủy đơn hàng

> ⚠️ Chỉ hủy được khi đơn đang ở trạng thái **"Chờ xác nhận"** hoặc **"Đã xác nhận"**.

1. Vào **Chi tiết đơn hàng** → nhấn **"Hủy đơn hàng"**.
2. Xác nhận → **"Xác nhận hủy"**.

---

## Module K6 — Đánh giá Sản phẩm

### K6.1 Viết đánh giá

> ⚠️ Chỉ đánh giá được sản phẩm đã **mua và nhận hàng thành công**.

1. **"Đơn hàng của tôi"** → Tìm đơn đã giao → **"Đánh giá sản phẩm"**.
2. Chọn **số sao** (1–5 ⭐).
3. Viết **nhận xét** (chất lượng, độ tươi ngon, đóng gói, giao hàng...).
4. Nhấn **"Gửi đánh giá"**.
5. ✅ Đánh giá hiển thị công khai trên trang sản phẩm.

### K6.2 Xem đánh giá của tôi

**Tên/Avatar** → **"Đánh giá của tôi"**.

---

# 🛠️ Phần III: Hướng dẫn Sử dụng dành cho Quản trị viên

> **Đường dẫn Admin:** `http://localhost:5173/admin`
>
> ⚠️ Mọi chức năng quản trị yêu cầu tài khoản có quyền hạn tương ứng. Liên hệ **Super Admin** để được cấp tài khoản.

---

## Module A0 — Đăng nhập Admin & Bảng điều khiển

### A0.1 Đăng nhập vào trang Quản trị

1. Truy cập `http://localhost:5173/admin/login`.
2. Nhập **Email** và **Mật khẩu** tài khoản admin.
3. Nhấn **"Đăng nhập"**.
4. ✅ Hệ thống xác thực quyền và chuyển đến **Dashboard**.

> 🔒 Phiên admin tách biệt hoàn toàn với phiên khách hàng.

### A0.2 Bảng điều khiển (Dashboard)

| Khu vực | Nội dung |
|---|---|
| **KPI tổng quan** | Tổng đơn hàng hôm nay, Doanh thu tháng, Khách hàng mới, Đánh giá chờ phản hồi |
| **Biểu đồ trạng thái đơn hàng** | Tỷ lệ đơn theo trạng thái dạng biểu đồ tròn |
| **Hiệu suất chi nhánh** | Bảng so sánh doanh thu và số đơn giữa các chi nhánh |
| **Cảnh báo hệ thống** | Hàng sắp hết kho, đơn chờ xử lý lâu... |
| **Quick Links** | Truy cập nhanh: Tạo sản phẩm, Đơn hàng mới, Quản lý kho... |

---

## Nhóm 1: Quản lý Sản phẩm (Catalog Management)

---

### Module A1 — Quản lý Sản phẩm (Products)

> **Quyền yêu cầu:** `products:read`, `products:create`, `products:update`, `products:delete`

### A1.1 Xem danh sách Sản phẩm

Sidebar → **"Sản phẩm"**. Bảng hiển thị: Ảnh, Tên, Danh mục, Giá, Tồn kho, Trạng thái, Thao tác.

**Tìm kiếm:** Nhập tên sản phẩm. **Lọc:** Theo Danh mục / Trạng thái / Nguồn gốc.

### A1.2 Tạo Sản phẩm mới

Nhấn **"+ Thêm sản phẩm"** → Điền form theo các tab:

**Tab Thông tin cơ bản:**

| Trường | Bắt buộc | Mô tả |
|---|---|---|
| Tên sản phẩm | ✅ | VD: "Xoài cát Hòa Lộc loại 1" |
| Slug | — | Tự động tạo từ tên, có thể chỉnh sửa |
| Mô tả ngắn | — | Hiển thị trên thẻ trong danh sách |
| Mô tả chi tiết | — | Dùng Rich Text Editor (in đậm, danh sách, ảnh nhúng...) |
| Danh mục | ✅ | Chọn từ danh sách đã tạo |
| Nguồn gốc | — | Chọn từ danh sách Origins |
| Thẻ sản phẩm | — | Gán nhãn phân loại |

**Tab Giá & Kho:**

| Trường | Mô tả |
|---|---|
| Giá bán | Đơn vị VNĐ (bắt buộc) |
| Giá gốc | Nếu nhập, hệ thống hiển thị badge "Giảm X%" |
| Đơn vị | kg, hộp, túi, quả... VD: "1 kg" |

**Tab Biến thể (Variants):**

Dùng khi sản phẩm có nhiều phiên bản (VD: 500g, 1kg, 2kg):
1. Nhấn **"Thêm biến thể"**.
2. Đặt tên (VD: "Khối lượng").
3. Thêm giá trị (VD: "500g", "1kg", "2kg") kèm giá và tồn kho riêng.

**Tab Hình ảnh:**
- Nhấn **"Upload ảnh"** → Cloudinary lưu trữ tự động.
- Chọn **ảnh đại diện** (thumbnail) hiển thị trên thẻ sản phẩm.
- Upload thêm ảnh phụ cho nhiều góc độ.

**Tab Thông tin Sức khỏe (Health Facts & Cautions):**

| Loại | Ví dụ |
|---|---|
| **Health Facts** (tích cực) | "Giàu vitamin C", "Chứa chất xơ cao" |
| **Health Cautions** (lưu ý) | "Người tiểu đường nên dùng lượng vừa phải" |

> 💡 Chat AI sử dụng dữ liệu này để tư vấn khách hàng chính xác hơn.

Nhấn **"Lưu sản phẩm"** → Sản phẩm tạo với trạng thái **Draft**. Cần kích hoạt trước khi hiển thị.

### A1.3 Chỉnh sửa Sản phẩm

Nhấn **✏️** bên cạnh sản phẩm → Thay đổi thông tin → **"Lưu thay đổi"**.

### A1.4 Đổi trạng thái Sản phẩm

| Trạng thái | Hiển thị website |
|---|---|
| **Draft** (Bản nháp) | ❌ Không |
| **Active** (Đang bán) | ✅ Có |
| **Inactive** (Tạm ngừng) | ❌ Không |

- **Nhanh:** Nhấn **badge trạng thái** → chọn trạng thái mới.
- **Hàng loạt:** Tích chọn nhiều → **"Đổi trạng thái"** → chọn mới.

### A1.5 Sắp xếp thứ tự Sản phẩm

Nhấn **"Sắp xếp"** → Kéo thả hàng → **"Lưu thứ tự"**.

> 💡 Đặt sản phẩm bán chạy hoặc đang khuyến mãi lên đầu để tăng doanh số.

### A1.6 Xóa Sản phẩm (Soft Delete)

Nhấn **🗑️** → Xác nhận. Sản phẩm bị ẩn nhưng dữ liệu lịch sử được giữ lại.

---

### Module A2 — Quản lý Danh mục Sản phẩm (Categories)

> **Quyền yêu cầu:** `categories:read`, `categories:create`, `categories:update`, `categories:delete`

### A2.1 Xem cấu trúc Danh mục

Sidebar → **"Danh mục sản phẩm"**. Danh mục hiển thị dạng **cây phân cấp**:

```
🍎 Trái cây trong nước
  ├── Trái cây miền Nam
  ├── Trái cây miền Trung
  └── Trái cây Tây Nguyên
🌍 Trái cây nhập khẩu
  ├── Nhập từ Mỹ
  ├── Nhập từ Hàn Quốc
  └── Nhập từ Úc
```

### A2.2 Tạo Danh mục mới

Nhấn **"+ Thêm danh mục"** → Điền:

| Trường | Mô tả |
|---|---|
| Tên danh mục | Bắt buộc. VD: "Trái cây hữu cơ" |
| Danh mục cha | Để trống = danh mục gốc; chọn cha = danh mục con |
| Slug | Tự động tạo |
| Mô tả | Mô tả ngắn về danh mục |
| Ảnh đại diện | Upload thumbnail |
| Thứ tự hiển thị | Số nhỏ hơn hiển thị trước |

Nhấn **"Tạo danh mục"**.

### A2.3 Chỉnh sửa, Xóa, Đổi trạng thái

- **Chỉnh sửa:** ✏️ → Thay đổi → **"Lưu"**.
- **Xóa:** 🗑️ → Xác nhận. *(Không xóa được danh mục còn chứa sản phẩm)*.
- **Đổi trạng thái:** Active / Inactive.

### A2.4 Sắp xếp vị trí Danh mục

Nhấn **"Sắp xếp vị trí"** → Kéo thả → **"Lưu thứ tự"**.

### A2.5 Chỉnh sửa hàng loạt (Bulk Edit)

Tích chọn nhiều danh mục → **"Chỉnh sửa hàng loạt"** → Đổi trạng thái hàng loạt.

---

### Module A3 — Quản lý Nguồn gốc Xuất xứ (Origins)

> **Quyền yêu cầu:** `origins:read`, `origins:create`, `origins:update`, `origins:delete`

Quản lý thông tin nơi sản xuất / xuất xứ của trái cây (VD: Tiền Giang, Đà Lạt, Hàn Quốc, Mỹ...). Thông tin này hiển thị trên trang sản phẩm và được Chat AI sử dụng để tư vấn chính xác.

### A3.1 Thêm Nguồn gốc mới

Sidebar → **"Nguồn gốc"** → **"+ Thêm nguồn gốc"**:

| Trường | Ví dụ |
|---|---|
| Tên nguồn gốc | "Tiền Giang", "Hàn Quốc", "Mỹ" |
| Mô tả | Thông tin thêm về vùng/quốc gia |
| Quốc gia/Vùng | Trong nước / Nhập khẩu |

Nhấn **"Lưu"**.

### A3.2 Chỉnh sửa, Xóa, Đổi trạng thái

Thao tác tương tự Module A2. **Xóa hàng loạt:** Tích chọn nhiều → **"Xóa đã chọn"**.

---

### Module A4 — Quản lý Thẻ Sản phẩm (Product Tags & Tag Groups)

> **Quyền yêu cầu:** `product-tags:read`, `product-tags:create`, `product-tags:update`, `product-tags:delete`

**Khái niệm:**
- **Tag Group (Nhóm thẻ):** Nhóm chứa các thẻ cùng loại. VD: Nhóm "Đặc điểm" → Thẻ: "Hữu cơ", "Tươi ngon".
- **Product Tag (Thẻ sản phẩm):** Nhãn gán cho sản phẩm để phân loại và lọc.

### A4.1 Quản lý Nhóm thẻ (Tag Groups)

Sidebar → **"Nhóm thẻ sản phẩm"** → **"+ Thêm nhóm"** → Nhập tên → **"Lưu"**.

> ⚠️ Không thể xóa nhóm thẻ khi còn chứa thẻ.

### A4.2 Quản lý Thẻ sản phẩm (Product Tags)

Sidebar → **"Thẻ sản phẩm"** → **"+ Thêm thẻ"**:

| Trường | Ví dụ |
|---|---|
| Tên thẻ | "Hữu cơ", "Đang mùa rộ", "Nhập khẩu cao cấp" |
| Nhóm thẻ | Chọn nhóm tương ứng đã tạo |

**Xóa hàng loạt:** Tích chọn nhiều → **"Xóa đã chọn"**.

> 🔗 Sau khi tạo thẻ, vào form **Tạo/Sửa Sản phẩm** (Module A1) để gán thẻ vào sản phẩm.

---

## Nhóm 2: Bán hàng & Đơn hàng

---

### Module A5 — Quản lý Đơn hàng (Orders — Admin)

> **Quyền yêu cầu:** `orders:read`, `orders:update`

### A5.1 Xem danh sách Đơn hàng

Sidebar → **"Đơn hàng"**. Bảng gồm: Mã đơn, Khách hàng, Ngày đặt, Tổng tiền, Trạng thái, Chi nhánh.

**Lọc:**
- Theo **trạng thái** đơn hàng.
- Theo **ngày đặt** (từ ngày - đến ngày).
- Theo **chi nhánh**.

### A5.2 Order Workspace — Trang xử lý chi tiết đơn hàng

Nhấn vào **mã đơn hàng**. Trang này tập trung đầy đủ thông tin:

| Khu vực | Nội dung |
|---|---|
| Thông tin khách hàng | Tên, SĐT, địa chỉ giao hàng |
| Danh sách sản phẩm | Tên, biến thể, số lượng, đơn giá, thành tiền |
| Timeline trạng thái | Lịch sử thay đổi trạng thái đơn hàng |
| Lịch sử giao hàng | Các mốc vận chuyển |
| Thông tin thanh toán | Phương thức, số tiền, thời gian |

### A5.3 Cập nhật Trạng thái Đơn hàng

Luồng trạng thái chuẩn:
```
Chờ xác nhận → Đã xác nhận → Đang giao → Đã giao
                                         ↓ (khi cần)
                                       Đã hủy
```

1. Trong Order Workspace → khu vực **"Cập nhật trạng thái"**.
2. Chọn trạng thái mới từ dropdown.
3. Thêm **ghi chú** (tùy chọn).
4. Nhấn **"Cập nhật"**.
5. ✅ Hệ thống tự động gửi **thông báo** đến khách hàng.

### A5.4 Thêm Lịch sử Giao hàng (Delivery History)

Ghi lại các mốc trong quá trình vận chuyển:

1. Order Workspace → phần **"Lịch sử giao hàng"** → **"Thêm mốc"**.
2. Điền **nội dung** (VD: "Hàng rời kho chi nhánh Q1", "Shipper đang trên đường giao") và **thời gian**.
3. Nhấn **"Lưu"**.

### A5.5 Ghi nhận Thanh toán (Add Payment)

Khi khách đã thanh toán và cần xác nhận trong hệ thống:

1. Order Workspace → phần **"Thanh toán"** → **"Thêm thanh toán"**.
2. Điền: **Số tiền**, **Phương thức** (Tiền mặt / Chuyển khoản / Ví điện tử), **Ghi chú**.
3. Nhấn **"Xác nhận"**.

---

### Module A6 — Cấu hình Vận chuyển (Shipping)

> **Quyền yêu cầu:** `shipping:read`, `shipping:create`, `shipping:update`, `shipping:delete`

Module này thiết lập toàn bộ **logic vận chuyển**: khu vực giao, khung giờ và công suất từng chi nhánh.

#### Sơ đồ quan hệ

```
Shipping Zone (Khu vực giao hàng)
    └── Phí ship, điều kiện áp dụng

Delivery Time Slot (Khung giờ toàn cầu)
    └── VD: 08:00-10:00 | 10:00-12:00 | 14:00-16:00

Branch (Chi nhánh)
    ├── Service Area → liên kết với Shipping Zone
    ├── Branch Time Slot → lấy từ slot toàn cầu, bật/tắt riêng
    └── Slot Capacity → giới hạn số đơn/slot/ngày
```

### A6.1 Quản lý Khu vực Giao hàng (Shipping Zones)

Sidebar → **"Khu vực giao hàng"** → **"+ Thêm khu vực"**:

| Trường | Ví dụ |
|---|---|
| Tên khu vực | "Nội thành TP.HCM", "Ngoại thành", "Tỉnh lân cận" |
| Phí vận chuyển cơ bản | 20.000 VNĐ |
| Phí theo km | 2.000 VNĐ/km |
| Đơn hàng tối thiểu | 100.000 VNĐ |
| Mức miễn phí ship | Đơn từ 500.000 VNĐ |
| Độ ưu tiên | Số cao hơn = ưu tiên cao hơn khi trùng nhiều zone |

**Thao tác hàng loạt:** Đổi trạng thái, Cập nhật độ ưu tiên, Xóa nhiều zone cùng lúc.

### A6.2 Quản lý Khung giờ Giao hàng toàn cầu (Delivery Time Slots)

Sidebar → **"Khung giờ giao hàng"** → **"+ Thêm khung giờ"**:

| Trường | Ví dụ |
|---|---|
| Tên | "Buổi sáng sớm" |
| Giờ bắt đầu | 08:00 |
| Giờ kết thúc | 10:00 |
| Áp dụng cho các ngày | Thứ 2–Thứ 7 (tích chọn) |

Các chi nhánh sẽ **lấy slot này** và bật/tắt theo nhu cầu riêng tại Module A7.

---

## 🏪 Nhóm 3: Quản lý Kho & Chi nhánh

---

### Module A7 — Quản lý Chi nhánh (Branches)

> **Quyền yêu cầu:** `branches:read`, `branches:create`, `branches:update`, `branches:delete`

### A7.1 Xem danh sách Chi nhánh

Sidebar → **"Chi nhánh"**. Hiển thị: Tên, Địa chỉ, Trạng thái, Số nhân viên.

### A7.2 Tạo Chi nhánh mới

Nhấn **"+ Thêm chi nhánh"** → Điền:

| Trường | Ví dụ |
|---|---|
| Tên chi nhánh | "Chi nhánh Quận 1", "Chi nhánh Bình Thạnh" |
| Địa chỉ | Số nhà, đường, phường, quận, tỉnh/TP |
| Số điện thoại | Số liên hệ của chi nhánh |
| Email liên hệ | Email chi nhánh |
| Giờ mở cửa | 07:00 – 21:00 |
| Mô tả | Thông tin thêm |

Nhấn **"Tạo chi nhánh"** → Chi nhánh tạo với trạng thái **Active**.

### A7.3 Chỉnh sửa thông tin Chi nhánh

✏️ bên cạnh chi nhánh → Cập nhật → **"Lưu thay đổi"**.

### A7.4 Đổi trạng thái Chi nhánh

| Trạng thái | Ý nghĩa |
|---|---|
| **Active** | Đang hoạt động, nhận đơn hàng mới |
| **Inactive** | Tạm ngừng, không nhận đơn mới (đơn đang xử lý không bị ảnh hưởng) |

Nhấn vào **badge trạng thái** để chuyển đổi.

### A7.5 Xóa Chi nhánh (Soft Delete)

🗑️ → Xác nhận. Dữ liệu lịch sử được giữ lại.

### A7.6 Thiết lập Vận chuyển cho từng Chi nhánh

Sau khi tạo chi nhánh, cần cấu hình 3 thành phần vận chuyển sau:

#### A7.6.1 Khu vực Phục vụ của Chi nhánh (Branch Service Areas)

**Mục đích:** Xác định chi nhánh giao đến những vùng nào (liên kết với Shipping Zones ở Module A6.1).

1. **Chi tiết Chi nhánh** → Tab **"Khu vực phục vụ"** → **"+ Thêm khu vực phục vụ"**.
2. Chọn **Shipping Zone** phù hợp và đặt trạng thái.
3. Nhấn **"Lưu"**.

**Sao chép từ chi nhánh khác:** Nhấn **"Sao chép từ chi nhánh"** → Chọn chi nhánh nguồn → Áp dụng ngay. *(Tiết kiệm thời gian khi chi nhánh mới có phạm vi tương tự).*

#### A7.6.2 Khung giờ Giao hàng của Chi nhánh (Branch Delivery Time Slots)

**Mục đích:** Kích hoạt các slot giờ mà chi nhánh sẽ nhận đơn.

1. **Chi tiết Chi nhánh** → Tab **"Khung giờ giao hàng"**.
2. Danh sách tất cả **Delivery Time Slots** toàn cục hiển thị.
3. **Toggle bật/tắt** từng slot:
   - Chi nhánh lớn (7h–22h): Bật tất cả slots.
   - Chi nhánh nhỏ (chỉ giao buổi sáng): Chỉ bật slots 8h–12h.
4. **Thêm slot riêng:** **"+ Thêm"** → Tạo slot không có trong hệ thống toàn cục.
5. **Sao chép từ chi nhánh khác:** Nhấn **"Sao chép từ chi nhánh"** → Copy toàn bộ cấu hình.

#### A7.6.3 Công suất phục vụ theo Khung giờ (Branch Delivery Slot Capacities)

**Mục đích:** Giới hạn số đơn tối đa mỗi slot/ngày, tránh quá tải nhân sự và phương tiện giao hàng.

1. **Chi tiết Chi nhánh** → Tab **"Công suất giao hàng"** (Capacity Planner).
2. Giao diện hiển thị dạng **lịch theo ngày & khung giờ**.
3. **Thiết lập từng ô:** Chọn slot + ngày → Nhập **số đơn tối đa** (VD: 20 đơn) → **"Lưu"**.
4. **Tạo hàng loạt từ mặc định:** Nhấn **"Tạo từ mặc định"** → Hệ thống tự tạo capacity cho tất cả slots trong tuần.
5. **Sao chép từ ngày khác:** Nhấn **"Sao chép từ ngày"** → Chọn ngày nguồn → Nhân bản sang ngày đích.

> **Ví dụ thực tế:** Chi nhánh có 2 xe, mỗi xe 15 đơn/slot → capacity = 30. Khi đủ 30 đơn, hệ thống **tự động ẩn** slot đó khi khách chọn giờ giao.

#### Checklist thiết lập vận chuyển

**Chi tiết Chi nhánh** → **"Checklist thiết lập"**: Xem tiến độ cấu hình, các bước ✅ đã xong và ⚠️ còn thiếu.

---

### Module A8 — Quản lý Tồn kho (Inventory)

> **Quyền yêu cầu:** `inventory:read`, `inventory:update`

**Khái niệm:**
- **Inventory Stock:** Số lượng sản phẩm/biến thể hiện có tại mỗi chi nhánh.
- **Inventory Transaction:** Bản ghi mỗi lần tồn kho thay đổi (nhập, xuất, chuyển kho, điều chỉnh).

### A8.1 Xem Tồn kho hiện tại

Sidebar → **"Tồn kho"** → Tab **"Tồn kho hiện tại"**.

| Cột | Mô tả |
|---|---|
| Sản phẩm / Biến thể | Tên và phiên bản (VD: Xoài 1kg) |
| Chi nhánh | Nơi lưu trữ |
| Số lượng tồn | Số hiện có |
| Cảnh báo | 🔴 Khi tồn dưới ngưỡng cảnh báo |

**Lọc:** Theo chi nhánh / sản phẩm / chỉ hiện hàng sắp hết.

### A8.2 Cập nhật Tồn kho thủ công (Set Inventory Stock)

Dùng sau kiểm kê thực tế, nhập hàng mới, hàng hỏng...

1. Sidebar → **"Tồn kho"** → Nhấn **"Cập nhật tồn kho"** hoặc ✏️ bên cạnh sản phẩm.
2. Điền:
   - **Sản phẩm / Biến thể**: Chọn mặt hàng.
   - **Chi nhánh**: Áp dụng cho chi nhánh nào.
   - **Số lượng mới**: Số thực tế sau kiểm kê.
   - **Lý do**: VD: "Nhập hàng từ vườn Tiền Giang", "Hàng hỏng sau kiểm kê".
3. Nhấn **"Cập nhật"**.
4. ✅ Hệ thống tự tạo **Inventory Transaction** để ghi lại thay đổi.

> 🔒 Mọi thay đổi đều có phiếu giao dịch. Không có thao tác nào làm mất dữ liệu.

### A8.3 Chuyển kho giữa Chi nhánh (Transfer Inventory Stock)

Dùng khi chi nhánh A thừa hàng, chi nhánh B thiếu.

1. Sidebar → **"Tồn kho"** → Tab **"Chuyển kho"** → **"+ Tạo phiếu chuyển kho"**.
2. Điền:

| Trường | Mô tả |
|---|---|
| Sản phẩm / Biến thể | Mặt hàng cần chuyển |
| Chi nhánh nguồn | Nơi xuất hàng |
| Chi nhánh đích | Nơi nhận hàng |
| Số lượng | Số cần chuyển (≤ tồn kho tại nguồn) |
| Ghi chú | Lý do chuyển kho |

3. Nhấn **"Xác nhận chuyển kho"**.
4. ✅ Hệ thống tự động:
   - **Giảm tồn kho** của chi nhánh nguồn.
   - **Tăng tồn kho** của chi nhánh đích.
   - Tạo **2 phiếu giao dịch** (1 xuất + 1 nhập) để truy vết.

### A8.4 Xem Lịch sử Giao dịch Kho (Inventory Transactions)

Sidebar → **"Tồn kho"** → Tab **"Lịch sử giao dịch"**.

| Thông tin | Mô tả |
|---|---|
| Thời gian | Khi nào giao dịch xảy ra |
| Loại | Nhập / Xuất / Chuyển kho / Bán hàng / Điều chỉnh |
| Sản phẩm | Mặt hàng liên quan |
| Chi nhánh | Nơi thực hiện |
| Số lượng | +/- bao nhiêu |
| Người thực hiện | Tài khoản admin nào thực hiện |
| Ghi chú | Lý do ghi lại |

**Lọc:** Theo loại giao dịch / chi nhánh / khoảng thời gian / sản phẩm.

**Dùng để:**
- Phát hiện sai lệch giữa tồn kho lý thuyết và thực tế.
- Truy vết nguyên nhân thiếu hụt hàng hóa.
- Theo dõi nhịp tiêu thụ của từng mặt hàng tại từng chi nhánh.

---

## 🤝 Nhóm 4: Tương tác & Chăm sóc Khách hàng

---

### Module A9 — Trợ lý Chat AI (Chat)

> **Quyền yêu cầu:** Không yêu cầu quyền admin đặc biệt — hoạt động tự động cho khách hàng trên website.

#### Cách hoạt động của hệ thống Chat AI

Hệ thống sử dụng **Google Gemini API** làm nền tảng AI, kết hợp với dữ liệu sản phẩm thực tế (tên, nguồn gốc, Health Facts, Health Cautions) để tư vấn mua hàng thông minh. Quy trình xử lý một tin nhắn gồm các bước:

```
1. Khách nhập tin nhắn
2. NormalizeChatInput  → Chuẩn hóa nội dung (xử lý viết tắt, typo)
3. ExtractChatIntent   → Phân tích ý định (hỏi sức khỏe? tìm sản phẩm? hỏi giá?)
4. RankRecommendedProducts → Xếp hạng sản phẩm phù hợp từ database
5. GenerateChatAnswer  → Sinh câu trả lời tự nhiên bằng tiếng Việt
6. ChatSafetyPolicy   → Kiểm tra nội dung an toàn trước khi gửi
```

#### A9.1 Cách Khách hàng sử dụng Chat AI

> *(Hướng dẫn này dành cho khách hàng xem trên website)*

1. Nhấn biểu tượng **💬 Chat** (nổi ở góc phải màn hình).
2. Cửa sổ chat mở ra, nhấn **"Bắt đầu trò chuyện"**.
3. Gõ câu hỏi tự nhiên bằng tiếng Việt. Ví dụ:
   - *"Tôi bị tiểu đường, nên ăn loại trái cây nào?"*
   - *"Có xoài cát Hòa Lộc không, giá bao nhiêu?"*
   - *"Trái cây nào giàu vitamin C nhất?"*
   - *"Tôi muốn mua quà tặng trái cây cho người lớn tuổi"*
4. AI trả lời kèm **gợi ý sản phẩm phù hợp** (thẻ sản phẩm có ảnh và giá).
5. Nhấn **"Thêm vào giỏ"** ngay từ thẻ gợi ý để mua luôn.
6. Dùng **Quick Actions** (phím tắt gợi ý) để hỏi nhanh các chủ đề phổ biến.

**Tính năng đặc biệt:**
- 💬 **Typing Indicator**: Hiển thị "đang nhập..." khi AI đang xử lý.
- 🏥 **Tư vấn dinh dưỡng**: Dựa trên dữ liệu Health Facts/Cautions đã nhập ở Module A1.
- 📦 **Gợi ý có ảnh**: Thẻ sản phẩm gợi ý hiện đầy đủ ảnh, tên, giá và nút mua.
- 💾 **Lưu lịch sử**: Mỗi phiên chat được lưu lại (Chat Session), khách hàng có thể xem lại.

#### A9.2 Admin theo dõi Chat (dành cho Quản trị viên)

Hiện tại hệ thống lưu toàn bộ log chat trong database (`ChatSessionModel`, `ChatMessageModel`, `ProductRecommendationLogModel`). Admin có thể truy vấn để phân tích:
- Các câu hỏi phổ biến nhất của khách hàng.
- Sản phẩm được AI gợi ý nhiều nhất.
- Tỷ lệ chuyển đổi từ gợi ý AI sang đơn hàng thực tế.

---

### Module A10 — Quản lý Khuyến mãi (Promotions)

> **Quyền yêu cầu:** `promotions:read`, `promotions:create`, `promotions:update`, `promotions:delete`

#### A10.1 Xem danh sách Khuyến mãi

Sidebar → **"Khuyến mãi"**. Bảng hiển thị: Tên khuyến mãi, Mã code, Loại giảm, Giá trị, Ngày bắt đầu/kết thúc, Trạng thái.

#### A10.2 Tạo Khuyến mãi mới

Nhấn **"+ Thêm khuyến mãi"** → Điền form theo các tab:

**Tab Thông tin cơ bản:**

| Trường | Mô tả |
|---|---|
| Tên khuyến mãi | VD: "Khuyến mãi Tết 2026", "Freeship cuối tuần" |
| Mô tả | Nội dung hiển thị cho khách hàng |
| Loại giảm giá | **Phần trăm** (VD: giảm 15%) hoặc **Số tiền cố định** (VD: giảm 30.000đ) |
| Giá trị giảm | Nhập số tương ứng (15 hoặc 30000) |
| Giảm tối đa | *(Chỉ với loại %)* Số tiền giảm tối đa, VD: 50.000đ |
| Đơn hàng tối thiểu | Giá trị đơn hàng tối thiểu để áp dụng mã |
| Ngày bắt đầu | Thời điểm khuyến mãi có hiệu lực |
| Ngày kết thúc | Thời điểm khuyến mãi hết hạn |
| Giới hạn lượt dùng | Tổng số lần mã có thể được dùng (để trống = không giới hạn) |
| Giới hạn mỗi user | Số lần một khách hàng được dùng mã này |

**Tab Mã khuyến mãi (Coupon Codes):**

Một Promotion có thể có nhiều mã code:
1. Nhấn **"+ Thêm mã"**.
2. Nhập **mã code** (VD: "TET2026", "FREESHIP50") — chữ in hoa, không dấu.
3. Nhấn **"Lưu"**.

> 💡 **Mẹo:** Tạo nhiều code cho một chương trình để phân phối qua các kênh khác nhau (email marketing, mạng xã hội, đại lý...).

**Tab Phạm vi áp dụng:**

Giới hạn khuyến mãi chỉ áp dụng cho một tập con cụ thể:

| Phạm vi | Mô tả |
|---|---|
| **Sản phẩm cụ thể** | Chọn từng sản phẩm được giảm giá |
| **Danh mục** | Toàn bộ sản phẩm trong một danh mục |
| **Nguồn gốc** | VD: giảm toàn bộ hàng nhập khẩu |
| **Biến thể** | Chỉ áp dụng cho loại cụ thể (VD: gói 1kg) |
| **Chi nhánh** | Khuyến mãi chỉ có tại một số chi nhánh |

> ⚠️ Để trống toàn bộ phạm vi = áp dụng cho tất cả sản phẩm.

Nhấn **"Tạo khuyến mãi"**.

#### A10.3 Đổi trạng thái Khuyến mãi

| Trạng thái | Ý nghĩa |
|---|---|
| **Active** | Đang hoạt động, khách có thể nhập mã |
| **Inactive** | Tạm ngừng, mã không còn hiệu lực |
| **Expired** | Tự động khi qua ngày kết thúc |

#### A10.4 Xem Lịch sử sử dụng (Promotion Usages)

1. Trong danh sách, nhấn **"Xem lượt dùng"** bên cạnh khuyến mãi.
2. Bảng hiển thị: Khách hàng đã dùng, Thời gian, Đơn hàng liên quan, Số tiền được giảm.
3. **Dùng để** phát hiện mã code bị lạm dụng hoặc đánh giá hiệu quả chiến dịch.

#### A10.5 Xác nhận mã khuyến mãi (Validate Promotion Code)

API backend tự động xác thực mã khi khách nhập. Hệ thống kiểm tra:
- ✅ Mã có tồn tại và đang **Active** không?
- ✅ Ngày hiện tại có trong thời hạn không?
- ✅ Đơn hàng có đủ giá trị tối thiểu không?
- ✅ Khách hàng này đã dùng quá số lần quy định chưa?
- ✅ Sản phẩm trong giỏ có thuộc phạm vi áp dụng không?

---

### Module A11 — Quản lý Đánh giá Sản phẩm (Reviews — Admin)

> **Quyền yêu cầu:** `reviews:read`, `reviews:reply`

#### A11.1 Xem Đánh giá đang chờ phản hồi

Sidebar → **"Đánh giá"**. Hệ thống ưu tiên hiển thị các đánh giá:
- ⭐ Đánh giá 1-2 sao (cần xử lý ngay).
- 💬 Đánh giá chưa có phản hồi từ cửa hàng.

Bảng hiển thị: Khách hàng, Sản phẩm, Số sao, Nội dung đánh giá, Ngày đánh giá, Trạng thái phản hồi.

#### A11.2 Phản hồi (Reply) Đánh giá

1. Nhấn **"Phản hồi"** bên cạnh đánh giá.
2. Nhập nội dung phản hồi (cảm ơn, giải thích, xin lỗi khi cần thiết).
3. Nhấn **"Gửi phản hồi"**.
4. ✅ Phản hồi hiển thị công khai dưới đánh giá của khách hàng.

> 💡 **Mẹo quản lý đánh giá:**
> - Phản hồi đánh giá **1-2 sao** trong vòng 24 giờ để thể hiện sự quan tâm.
> - Cảm ơn đánh giá **5 sao** để tạo thiện cảm và khuyến khích khách quay lại.
> - Không xóa đánh giá tiêu cực — hãy phản hồi chuyên nghiệp.

#### A11.3 Xem Tóm tắt Đánh giá chờ (Pending Review Summary)

Dashboard → Widget **"Đánh giá"** hoặc Sidebar → **"Đánh giá"**: Xem nhanh số lượng đánh giá chưa xử lý theo từng mức sao.

---

### Module A12 — Quản lý Thông báo (Notifications)

> **Quyền yêu cầu:** Nhận thông báo theo phân quyền vai trò

#### A12.1 Xem thông báo (Admin)

1. Nhấn **biểu tượng 🔔** trên header Admin Dashboard.
2. **Dropdown thông báo** hiển thị các thông báo gần nhất kèm dấu chấm đỏ (chưa đọc).
3. Nhấn từng thông báo để xem chi tiết và chuyển đến trang liên quan.

#### A12.2 Trang Thông báo đầy đủ

Sidebar → **"Thông báo"**: Xem toàn bộ lịch sử thông báo.

**Hành động:**
- **Đánh dấu đã đọc:** Nhấn vào thông báo.
- **Đánh dấu tất cả đã đọc:** Nhấn **"Đánh dấu tất cả đã đọc"**.
- **Xem số chưa đọc:** Badge đỏ trên icon 🔔 cập nhật tự động.

#### A12.3 Các loại thông báo hệ thống tự tạo

| Sự kiện kích hoạt | Nội dung thông báo |
|---|---|
| Đơn hàng mới | "Có đơn hàng #DH-XXXX mới cần xử lý" |
| Cập nhật trạng thái đơn | "Đơn #DH-XXXX chuyển sang trạng thái [mới]" |
| Tồn kho thấp | "Sản phẩm [Tên] tại [Chi nhánh] sắp hết hàng (còn X)" |
| Đánh giá mới | "Khách hàng [Tên] vừa đánh giá [Sản phẩm]: X sao" |

---

## 📝 Nhóm 5: Quản lý Nội dung Blog (CMS)

---

### Module A13 — Quản lý Bài viết (Posts)

> **Quyền yêu cầu:** `posts:read`, `posts:create`, `posts:update`, `posts:delete`

#### A13.1 Xem danh sách Bài viết

Sidebar → **"Bài viết"** → **"Tất cả bài viết"**. Bảng hiển thị: Tiêu đề, Danh mục, Thẻ, Lượt xem, Ngày đăng, Trạng thái.

#### A13.2 Tạo Bài viết mới

Nhấn **"+ Viết bài mới"**:

**Tab Nội dung:**

| Trường | Mô tả |
|---|---|
| Tiêu đề bài viết | Bắt buộc. VD: "10 loại trái cây tốt cho người huyết áp cao" |
| Slug (URL) | Tự động tạo từ tiêu đề, có thể chỉnh sửa để SEO tốt hơn |
| Tóm tắt (Excerpt) | 1–2 câu mô tả ngắn, hiển thị trên trang danh sách bài viết |
| Nội dung | Soạn thảo bằng **Rich Text Editor** (hỗ trợ: tiêu đề H2/H3, in đậm, danh sách, bảng, ảnh nhúng, liên kết) |
| Ảnh đại diện | Upload ảnh thumbnail cho bài viết |
| Danh mục bài viết | Chọn một hoặc nhiều danh mục blog |
| Thẻ bài viết (Tags) | Gán nhãn từ khóa để lọc và SEO |

**Tab Sản phẩm liên quan (Related Products):**

Gắn kết sản phẩm thực tế vào bài viết để tăng chuyển đổi:
1. Nhấn **"+ Thêm sản phẩm liên quan"**.
2. Tìm kiếm và chọn sản phẩm.
3. Sản phẩm sẽ hiển thị dưới dạng thẻ mua hàng ngay cuối bài viết.

> 💡 **Ví dụ:** Bài viết "Xoài tốt cho sức khỏe thế nào?" → Gắn sản phẩm "Xoài cát Hòa Lộc 1kg" → Tăng doanh số tự nhiên.

**Tab SEO (Meta):**

| Trường | Mô tả |
|---|---|
| Meta Title | Tiêu đề hiển thị trên tab trình duyệt và kết quả Google |
| Meta Description | Mô tả ngắn hiển thị dưới tiêu đề trên kết quả tìm kiếm |

Nhấn **"Lưu bài viết"** → Bài viết tạo với trạng thái **Draft**.

#### A13.3 Đổi trạng thái Bài viết

| Trạng thái | Mô tả |
|---|---|
| **Draft** (Bản nháp) | Chưa công bố, chỉ admin thấy |
| **Published** (Đã đăng) | Hiển thị công khai trên website |
| **Inactive** (Tạm ẩn) | Ẩn tạm thời mà không xóa |

#### A13.4 Sắp xếp thứ tự Bài viết

Nhấn **"Sắp xếp"** → Kéo thả → **"Lưu thứ tự"**. Thứ tự này ảnh hưởng đến bài viết "nổi bật" ở trang chủ.

#### A13.5 Chỉnh sửa hàng loạt (Bulk Edit)

Tích chọn nhiều bài viết → **"Chỉnh sửa hàng loạt"** → Đổi trạng thái đồng loạt.

#### A13.6 Xóa Bài viết (Soft Delete)

🗑️ → Xác nhận. Bài viết bị ẩn, không xóa vĩnh viễn.

---

### Module A14 — Quản lý Danh mục Bài viết (Post Categories)

> **Quyền yêu cầu:** `post-categories:read`, `post-categories:create`, `post-categories:update`, `post-categories:delete`

Tổ chức bài viết blog theo chủ đề (tương tự Module A2 nhưng dành cho Blog).

#### A14.1 Cấu trúc Danh mục Blog (ví dụ)

```
📚 Dinh dưỡng & Sức khỏe
  ├── Tiểu đường & Trái cây
  ├── Giảm cân
  └── Trẻ em & Dinh dưỡng
🌱 Trái cây theo mùa
🍽️ Công thức & Chế biến
🛒 Mẹo mua sắm thông minh
```

#### A14.2 Tạo Danh mục Bài viết

Sidebar → **"Danh mục Blog"** → **"+ Thêm danh mục"**:

| Trường | Mô tả |
|---|---|
| Tên danh mục | Bắt buộc. VD: "Dinh dưỡng & Sức khỏe" |
| Danh mục cha | Cấu trúc phân cấp (để trống = danh mục gốc) |
| Mô tả | Mô tả về chủ đề của danh mục này |
| Ảnh đại diện | Thumbnail danh mục |
| Thứ tự | Số nhỏ hơn hiển thị trước |

Nhấn **"Tạo danh mục"**.

#### A14.3 Kiểm tra trước khi xóa (Can Delete Check)

Hệ thống kiểm tra tự động: nếu danh mục còn bài viết, **không cho phép xóa**. Cần chuyển bài viết sang danh mục khác trước.

#### A14.4 Sắp xếp, Đổi trạng thái, Bulk Edit

Thao tác tương tự Module A2 (Danh mục Sản phẩm).

---

### Module A15 — Quản lý Thẻ Bài viết (Post Tags)

> **Quyền yêu cầu:** `post-tags:read`, `post-tags:create`, `post-tags:update`, `post-tags:delete`

Thẻ bài viết giúp khách hàng tìm kiếm bài viết theo chủ đề chéo (không phụ thuộc danh mục).

#### A15.1 Tạo Thẻ bài viết

Sidebar → **"Thẻ Blog"** → **"+ Thêm thẻ"**:

| Trường | Ví dụ |
|---|---|
| Tên thẻ | "vitamin C", "giảm cân", "trái cây nhiệt đới", "mùa hè" |
| Mô tả | Mô tả ngắn về chủ đề thẻ này |

Nhấn **"Lưu"**.

#### A15.2 Xem thống kê sử dụng (Tag Usage)

Nhấn **"Xem lượt dùng"** bên cạnh thẻ → Số bài viết đang gắn thẻ này. Dùng để xác định thẻ nào phổ biến hoặc thẻ nào chưa được dùng (có thể xóa).

#### A15.3 Kiểm tra trước khi xóa (Can Delete Check)

Tương tự Post Categories, hệ thống chặn xóa thẻ nếu còn bài viết đang dùng.

#### A15.4 Chỉnh sửa hàng loạt (Bulk Edit)

Tích chọn nhiều thẻ → **"Chỉnh sửa hàng loạt"** → Đổi trạng thái đồng loạt.

---

## ⚙️ Nhóm 6: Quản trị Hệ thống & Phân quyền

---

### Module A16 — Quản lý Người dùng (Users)

> **Quyền yêu cầu:** `users:read`, `users:create`, `users:update`, `users:delete`

#### A16.1 Xem danh sách Người dùng

Sidebar → **"Người dùng"**. Bảng hiển thị: Avatar, Họ tên, Email, Số ĐT, Vai trò, Trạng thái, Ngày tạo.

**Tìm kiếm:** Theo tên / email / số điện thoại.  
**Lọc:** Theo Vai trò / Trạng thái (Active / Inactive / Banned).

#### A16.2 Tạo Tài khoản Nhân viên/Admin

> *(Dành để tạo tài khoản Admin hoặc Staff — không dùng cho khách hàng. Khách tự đăng ký qua website)*

1. Nhấn **"+ Thêm người dùng"**.
2. Điền:

| Trường | Mô tả |
|---|---|
| Họ và tên | Bắt buộc |
| Email | Bắt buộc, dùng để đăng nhập |
| Số điện thoại | Tùy chọn |
| Mật khẩu tạm thời | Admin đặt mật khẩu ban đầu, nhân viên đổi sau lần đăng nhập đầu tiên |
| Vai trò | Chọn từ danh sách Roles đã tạo (Module A17) |
| Chi nhánh phụ trách | Gán nhân viên vào chi nhánh cụ thể |

3. Nhấn **"Tạo tài khoản"**.
4. Cung cấp Email + Mật khẩu tạm thời cho nhân viên.

#### A16.3 Chỉnh sửa thông tin Người dùng

1. Nhấn **✏️** bên cạnh người dùng cần sửa.
2. Cập nhật: Họ tên, Số điện thoại, Vai trò, Chi nhánh.
3. Nhấn **"Lưu thay đổi"**.

> ⚠️ Không thể sửa **Email** của tài khoản (email là định danh duy nhất).

#### A16.4 Đổi trạng thái Người dùng (Update User Status)

| Trạng thái | Ý nghĩa |
|---|---|
| **Active** | Đang hoạt động, có thể đăng nhập |
| **Inactive** | Tạm vô hiệu hóa (nhân viên nghỉ việc, khóa tạm thời) |
| **Banned** | Cấm vĩnh viễn (dùng khi phát hiện gian lận) |

Nhấn vào **badge trạng thái** hoặc dùng **Bulk Edit** để đổi hàng loạt.

#### A16.5 Xóa Người dùng (Soft Delete)

🗑️ → Xác nhận. Tài khoản bị ẩn nhưng lịch sử đơn hàng và log được giữ nguyên.

---

### Module A17 — Quản lý Vai trò & Phân quyền (Roles & Permissions)

> **Quyền yêu cầu:** Chỉ **Super Admin** mới có toàn quyền quản lý Roles & Permissions.

Đây là module quan trọng nhất về bảo mật. Hệ thống sử dụng mô hình **RBAC (Role-Based Access Control)**: mỗi người dùng có một vai trò, mỗi vai trò có một bộ quyền riêng.

#### A17.1 Xem danh sách Vai trò (Roles)

Sidebar → **"Vai trò"**. Danh sách hiển thị các vai trò đang có trong hệ thống.

**Ví dụ cấu trúc vai trò điển hình:**

| Vai trò | Mô tả |
|---|---|
| **Super Admin** | Toàn quyền, không giới hạn |
| **Admin** | Quản lý toàn bộ nhưng không cấp quyền cho Super Admin |
| **Branch Manager** | Quản lý đơn hàng, kho, nhân viên của chi nhánh mình |
| **Staff** | Xử lý đơn hàng, cập nhật trạng thái |
| **Content Editor** | Viết và quản lý bài viết blog |

#### A17.2 Tạo Vai trò mới

1. Sidebar → **"Vai trò"** → **"+ Thêm vai trò"**.
2. Điền:
   - **Tên vai trò** (VD: "Nhân viên kho")
   - **Mô tả** (VD: "Quản lý tồn kho và chuyển hàng")
3. Nhấn **"Tạo vai trò"**.
4. ✅ Vai trò tạo xong nhưng **chưa có quyền gì** — cần cấu hình quyền ở bước tiếp theo.

#### A17.3 Cấu hình Quyền cho Vai trò (Role Permissions)

1. Sidebar → **"Phân quyền"** (hoặc vào chi tiết Vai trò → Tab **"Quyền hạn"**).
2. Giao diện hiển thị **bảng ma trận quyền** với:
   - Hàng: Từng nhóm quyền (products, orders, users, inventory, shipping...)
   - Cột: Từng hành động (read, create, update, delete)
3. **Tích chọn** các ô quyền phù hợp cho vai trò đang cấu hình.
4. Nhấn **"Lưu phân quyền"**.

**Bảng quyền tham khảo:**

| Module | Read | Create | Update | Delete |
|---|---|---|---|---|
| products | ✅ | ✅ | ✅ | ✅ |
| categories | ✅ | ✅ | ✅ | ✅ |
| orders | ✅ | — | ✅ | — |
| inventory | ✅ | — | ✅ | — |
| users | ✅ | — | — | — |
| roles | — | — | — | — |
| audit-logs | ✅ | — | — | — |
| posts | ✅ | ✅ | ✅ | ✅ |
| promotions | ✅ | ✅ | ✅ | — |
| shipping | ✅ | ✅ | ✅ | ✅ |

> ⚠️ **Nguyên tắc Least Privilege:** Chỉ cấp **đúng những quyền cần thiết** cho từng vai trò. Không cấp thừa để giảm rủi ro bảo mật.

#### A17.4 Xóa Vai trò (Soft Delete)

> ⚠️ Không thể xóa vai trò nếu còn **người dùng đang được gán vai trò đó**. Cần chuyển người dùng sang vai trò khác trước.

---

### Module A18 — Cài đặt chung (General Settings)

> **Quyền yêu cầu:** Chỉ **Super Admin** mới có quyền thay đổi cài đặt chung.

#### A18.1 Truy cập Cài đặt chung

Sidebar → **"Cài đặt"** → **"Cài đặt chung"**.

#### A18.2 Các thông tin cần cấu hình

| Nhóm | Trường | Ví dụ |
|---|---|---|
| **Thông tin cửa hàng** | Tên cửa hàng | "Trái Cây Sạch Việt" |
| | Slogan | "Tươi ngon từ vườn đến tay bạn" |
| | Logo | Upload file ảnh PNG/SVG |
| | Favicon | Upload file .ico hoặc .png nhỏ |
| **Thông tin liên hệ** | Địa chỉ trụ sở | Địa chỉ văn phòng chính |
| | Hotline | 1800-XXXX |
| | Email hỗ trợ | support@fruitshop.vn |
| **Mạng xã hội** | Facebook URL | Link fanpage |
| | Zalo | Số Zalo hoặc link |
| | Instagram | Link tài khoản |
| **Chính sách** | Chính sách đổi trả | Nội dung text/HTML |
| | Điều khoản sử dụng | Nội dung text/HTML |
| | Chính sách bảo mật | Nội dung text/HTML |
| **Thông báo Email** | Email người nhận đơn | admin@fruitshop.vn |
| | Nội dung email xác nhận đơn | Có thể tùy chỉnh |

Nhấn **"Lưu cài đặt"** sau khi thay đổi.

> 💡 Các thông tin này hiển thị trên **Footer website**, trang **Liên hệ**, và trong **email tự động gửi cho khách hàng**.

---

### Module A19 — Nhật ký Hoạt động (Audit Logs)

> **Quyền yêu cầu:** `audit-logs:read` — Chỉ Super Admin hoặc vai trò được chỉ định đặc biệt.

Audit Log là **hộp đen của hệ thống** — ghi lại mọi hành động quan trọng của admin/nhân viên với đầy đủ bối cảnh để phục vụ kiểm toán và điều tra sự cố.

#### A19.1 Xem Nhật ký hoạt động

Sidebar → **"Nhật ký hoạt động"**. Bảng hiển thị từ mới nhất đến cũ nhất:

| Cột | Mô tả |
|---|---|
| **Thời gian** | Ngày giờ chính xác (múi giờ Asia/Ho_Chi_Minh) |
| **Người thực hiện** | Tài khoản admin/nhân viên |
| **Hành động** | VD: `product.create`, `order.update_status`, `user.delete` |
| **Đối tượng** | Tên/ID của bản ghi bị tác động |
| **Chi tiết** | Giá trị trước và sau khi thay đổi (dạng JSON) |
| **IP Address** | Địa chỉ IP của thiết bị thực hiện |

#### A19.2 Lọc Nhật ký

| Bộ lọc | Tùy chọn |
|---|---|
| **Người thực hiện** | Chọn tài khoản cụ thể |
| **Loại hành động** | Tạo / Cập nhật / Xóa / Đăng nhập |
| **Module** | products, orders, users, inventory, roles... |
| **Khoảng thời gian** | Từ ngày - Đến ngày |

#### A19.3 Các tình huống cần kiểm tra Audit Log

| Tình huống | Cách tra cứu |
|---|---|
| 🔍 Ai đã xóa sản phẩm X? | Lọc `action = product.delete` + tên sản phẩm |
| 🔍 Ai đã thay đổi giá sản phẩm? | Lọc `action = product.update` + xem cột "Chi tiết" |
| 🔍 Đơn hàng Y bị thay đổi trạng thái khi nào? | Lọc `action = order.update_status` + mã đơn |
| 🔍 Nhân viên Z đã làm gì hôm qua? | Lọc theo `Người thực hiện = Z` + khoảng ngày |
| 🔍 Có ai đăng nhập bất thường không? | Lọc `action = auth.login` + IP address lạ |

> 🔒 **Audit Log là readonly** — không ai có thể xóa hoặc chỉnh sửa nhật ký. Đây là đảm bảo toàn vẹn dữ liệu.

---

## ❓ Phần IV: FAQ & Xử lý Sự cố Thường gặp

---

### Dành cho Khách hàng

**Q: Tôi đặt hàng xong nhưng không nhận được email xác nhận?**
> A: Kiểm tra thư mục **Spam/Junk** trong hộp thư. Nếu không có, vào **"Đơn hàng của tôi"** để xác nhận đơn đã được tạo. Liên hệ Hotline nếu cần hỗ trợ.

**Q: Tôi muốn đổi địa chỉ giao hàng sau khi đặt rồi?**
> A: Khi đơn còn ở **"Chờ xác nhận"**, hãy hủy đơn và đặt lại với địa chỉ mới. Nếu đơn đã được xác nhận, gọi ngay **Hotline** để admin hỗ trợ thay đổi.

**Q: Mã khuyến mãi không áp dụng được?**
> A: Kiểm tra các điều kiện: đơn hàng có đủ giá trị tối thiểu không? Mã còn hạn sử dụng không? Sản phẩm trong giỏ có thuộc phạm vi áp dụng không? Mã đã được dùng chưa?

**Q: Chat AI không phản hồi hoặc phản hồi chậm?**
> A: Đây có thể là tình trạng tải cao. Chờ vài giây và thử lại. Nếu vẫn không được, làm mới trang và bắt đầu cuộc trò chuyện mới.

**Q: Tôi muốn hủy đánh giá đã gửi?**
> A: Hiện tại hệ thống chưa hỗ trợ tự xóa đánh giá. Liên hệ admin qua email/hotline để được hỗ trợ.

---

### Dành cho Quản trị viên

**Q: Nhân viên mới không đăng nhập được vào trang Admin?**
> A: Kiểm tra: (1) Tài khoản có trạng thái **Active** chưa? (2) Email/mật khẩu có đúng không? (3) Vai trò đã được gán chưa? (4) Có dùng đường dẫn `/admin/login` không (không phải trang login của khách hàng)?

**Q: Sản phẩm đã bật Active nhưng vẫn không hiển thị trên website?**
> A: Kiểm tra: (1) **Danh mục** của sản phẩm có đang **Active** không? (2) **Tồn kho** có > 0 không (nếu cấu hình ẩn hàng hết)? (3) Thử xóa cache trình duyệt.

**Q: Khách hàng phản ánh không chọn được khung giờ giao hàng?**
> A: Kiểm tra theo thứ tự: (1) Chi nhánh gần địa chỉ khách có **Active** không? (2) **Shipping Zone** của khu vực đó có Active không? (3) **Branch Service Area** đã được thiết lập chưa? (4) **Delivery Slot Capacity** của ngày đó còn chỗ không (chưa đầy)?

**Q: Đơn hàng phân về chi nhánh sai?**
> A: Hệ thống chọn chi nhánh dựa trên **Shipping Zone** + **Branch Service Area**. Kiểm tra lại cấu hình khu vực phục vụ của các chi nhánh, đặc biệt **Độ ưu tiên** (Priority) khi nhiều chi nhánh cùng phục vụ một zone.

**Q: Làm sao biết ai đã vô tình xóa sản phẩm?**
> A: Vào **Module A19 — Audit Logs** → Lọc `action = product.delete` → Xem cột **Người thực hiện** và **Thời gian**.

**Q: Tôi muốn thêm quyền mới cho một nhân viên mà không muốn thay đổi role của những người khác?**
> A: Tạo **Role mới** (Module A17) với bộ quyền tùy chỉnh, sau đó gán Role đó riêng cho nhân viên đó. Không chỉnh sửa Role đang dùng chung vì sẽ ảnh hưởng đến tất cả người trong cùng Role.

---

## 📞 Liên hệ & Hỗ trợ

| Kênh | Thông tin |
|---|---|
| 📱 **Hotline kỹ thuật** | `0967 004 916` |
| 📧 **Email hỗ trợ** | Liên hệ qua hotline để nhận email |
| 💬 **Zalo** | Zalo theo số hotline trên |
| ⏰ **Giờ hỗ trợ** | Thứ 2 – Thứ 6: 08:00 – 17:30 |

> 🔧 Để nhận file cấu hình `.env` đầy đủ (bao gồm API keys và cấu hình database mẫu), vui lòng liên hệ trực tiếp qua hotline hoặc email.

---

## Đóng góp

Mọi sự đóng góp đều được chào đón! Vui lòng tạo Pull Request để đóng góp vào dự án.

## Giấy phép

Dự án này được cấp phép theo [MIT License](./LICENSE).

## Cấu trúc thư mục

```
├── 📁 backend
│   ├── 📁 src
│   │   ├── 📁 application
│   │   │   ├── 📁 audit-logs
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 CreateAuditLog.ts
│   │   │   │       └── 📄 ListAuditLogs.ts
│   │   │   ├── 📁 auth
│   │   │   │   ├── 📁 mappers
│   │   │   │   │   └── 📄 toAuthUserView.ts
│   │   │   │   ├── 📁 services
│   │   │   │   │   ├── 📄 PasswordService.ts
│   │   │   │   │   ├── 📄 RefreshTokenService.ts
│   │   │   │   │   └── 📄 TokenService.ts
│   │   │   │   ├── 📁 usecases
│   │   │   │   │   ├── 📄 ChangePassword.ts
│   │   │   │   │   ├── 📄 GetMe.ts
│   │   │   │   │   ├── 📄 Login.ts
│   │   │   │   │   ├── 📄 Logout.ts
│   │   │   │   │   ├── 📄 RefreshToken.ts
│   │   │   │   │   ├── 📄 RegisterClient.ts
│   │   │   │   │   ├── 📄 RequestPasswordReset.ts
│   │   │   │   │   ├── 📄 ResetPassword.ts
│   │   │   │   │   ├── 📄 UpdateMyProfile.ts
│   │   │   │   │   └── 📄 VerifyResetOtp.ts
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 branches
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 ChangeBranchStatus.ts
│   │   │   │       ├── 📄 CreateBranch.ts
│   │   │   │       ├── 📄 EditBranch.ts
│   │   │   │       ├── 📄 GetBranchDetail.ts
│   │   │   │       ├── 📄 ListBranches.ts
│   │   │   │       └── 📄 SoftDeleteBranch.ts
│   │   │   ├── 📁 carts
│   │   │   │   ├── 📁 usecases
│   │   │   │   │   ├── 📄 AddToCart.ts
│   │   │   │   │   ├── 📄 ListCartItems.ts
│   │   │   │   │   ├── 📄 RemoveAllFromCart.ts
│   │   │   │   │   ├── 📄 RemoveFromCart.ts
│   │   │   │   │   ├── 📄 UpdateCartItem.ts
│   │   │   │   │   └── 📄 index.ts
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 categories
│   │   │   │   ├── 📁 usecases
│   │   │   │   │   ├── 📄 BulkEditCategories.ts
│   │   │   │   │   ├── 📄 ChangeCategoryStatus.ts
│   │   │   │   │   ├── 📄 CreateCategory.ts
│   │   │   │   │   ├── 📄 EditCategory.ts
│   │   │   │   │   ├── 📄 GetCategoryDetail.ts
│   │   │   │   │   ├── 📄 ListCategories.ts
│   │   │   │   │   ├── 📄 ReorderCategoryPositions.ts
│   │   │   │   │   └── 📄 SoftDeleteCategory.ts
│   │   │   │   └── 📄 dto.ts
│   │   │   ├── 📁 chat
│   │   │   │   ├── 📁 services
│   │   │   │   │   ├── 📄 ChatModelService.ts
│   │   │   │   │   ├── 📄 ChatSafetyPolicyService.ts
│   │   │   │   │   ├── 📄 ExtractChatIntentService.ts
│   │   │   │   │   ├── 📄 GenerateChatAnswerService.ts
│   │   │   │   │   ├── 📄 NormalizeChatInputService.ts
│   │   │   │   │   └── 📄 RankRecommendedProductsService.ts
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 CreateChatSession.ts
│   │   │   │       ├── 📄 GetChatSessionDetail.ts
│   │   │   │       ├── 📄 ListChatMessages.ts
│   │   │   │       ├── 📄 RecommendProductsForChat.ts
│   │   │   │       └── 📄 SendChatMessage.ts
│   │   │   ├── 📁 dashboard
│   │   │   │   └── 📁 usecases
│   │   │   │       └── 📄 GetAdminDashboard.ts
│   │   │   ├── 📁 inventory
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 ListInventoryStocks.ts
│   │   │   │       ├── 📄 ListInventoryTransactions.ts
│   │   │   │       ├── 📄 SetInventoryStock.ts
│   │   │   │       └── 📄 TransferInventoryStock.ts
│   │   │   ├── 📁 notifications
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 CreateNotification.ts
│   │   │   │       ├── 📄 GetUnreadNotificationCount.ts
│   │   │   │       ├── 📄 ListMyNotifications.ts
│   │   │   │       ├── 📄 MarkAllNotificationsRead.ts
│   │   │   │       └── 📄 MarkNotificationRead.ts
│   │   │   ├── 📁 orders
│   │   │   │   ├── 📁 admin
│   │   │   │   │   ├── 📄 AddDeliveryHistory.ts
│   │   │   │   │   ├── 📄 AddPayment.ts
│   │   │   │   │   ├── 📄 GetOrderDetailAdmin.ts
│   │   │   │   │   ├── 📄 ListOrders.ts
│   │   │   │   │   └── 📄 UpdateOrderStatus.ts
│   │   │   │   └── 📁 client
│   │   │   │       ├── 📄 CancelMyOrder.ts
│   │   │   │       ├── 📄 CreateOrderFromCart.ts
│   │   │   │       ├── 📄 GetCheckoutQuote.ts
│   │   │   │       ├── 📄 GetMyOrderDetail.ts
│   │   │   │       ├── 📄 GetMyOrders.ts
│   │   │   │       └── 📄 ListMyOrderAddresses.ts
│   │   │   ├── 📁 origins
│   │   │   │   ├── 📁 usecases
│   │   │   │   │   ├── 📄 BulkDeleteOrigins.ts
│   │   │   │   │   ├── 📄 ChangeOriginStatus.ts
│   │   │   │   │   ├── 📄 CreateOrigin.ts
│   │   │   │   │   ├── 📄 EditOrigin.ts
│   │   │   │   │   ├── 📄 GetOriginDetail.ts
│   │   │   │   │   ├── 📄 ListOrigins.ts
│   │   │   │   │   └── 📄 SoftDeleteOrigin.ts
│   │   │   │   └── 📄 dto.ts
│   │   │   ├── 📁 post-categories
│   │   │   │   ├── 📁 services
│   │   │   │   │   └── 📄 PostCategoryTreeGuard.ts
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 BulkEditPostCategories.ts
│   │   │   │       ├── 📄 CanDeletePostCategory.ts
│   │   │   │       ├── 📄 ChangePostCategoryStatus.ts
│   │   │   │       ├── 📄 CreatePostCategory.ts
│   │   │   │       ├── 📄 EditPostCategory.ts
│   │   │   │       ├── 📄 GetPostCategoryDetail.ts
│   │   │   │       ├── 📄 GetPostCategorySummary.ts
│   │   │   │       ├── 📄 ListPostCategories.ts
│   │   │   │       ├── 📄 ReorderPostCategoryPositions.ts
│   │   │   │       └── 📄 SoftDeletePostCategory.ts
│   │   │   ├── 📁 post-tags
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 BulkEditPostTags.ts
│   │   │   │       ├── 📄 CanDeletePostTag.ts
│   │   │   │       ├── 📄 ChangePostTagStatus.ts
│   │   │   │       ├── 📄 CreatePostTag.ts
│   │   │   │       ├── 📄 EditPostTag.ts
│   │   │   │       ├── 📄 GetPostTagDetail.ts
│   │   │   │       ├── 📄 GetPostTagSummary.ts
│   │   │   │       ├── 📄 GetPostTagUsage.ts
│   │   │   │       ├── 📄 ListPostTags.ts
│   │   │   │       └── 📄 SoftDeletePostTag.ts
│   │   │   ├── 📁 posts
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 BulkEditPosts.ts
│   │   │   │       ├── 📄 ChangePostStatus.ts
│   │   │   │       ├── 📄 CreatePost.ts
│   │   │   │       ├── 📄 EditPost.ts
│   │   │   │       ├── 📄 GetPostDetail.ts
│   │   │   │       ├── 📄 GetPostDetailBySlug.ts
│   │   │   │       ├── 📄 GetPostSummary.ts
│   │   │   │       ├── 📄 IncreasePostViewCount.ts
│   │   │   │       ├── 📄 ListClientPostCategories.ts
│   │   │   │       ├── 📄 ListClientPostTags.ts
│   │   │   │       ├── 📄 ListPosts.ts
│   │   │   │       ├── 📄 ReorderPostPositions.ts
│   │   │   │       └── 📄 SoftDeletePost.ts
│   │   │   ├── 📁 product-tag-groups
│   │   │   │   ├── 📁 usecases
│   │   │   │   │   ├── 📄 CreateProductTagGroup.ts
│   │   │   │   │   ├── 📄 DeleteProductTagGroup.ts
│   │   │   │   │   ├── 📄 EditProductTagGroup.ts
│   │   │   │   │   ├── 📄 GetProductTagGroupDetail.ts
│   │   │   │   │   └── 📄 ListProductTagGroups.ts
│   │   │   │   └── 📄 dto.ts
│   │   │   ├── 📁 product-tags
│   │   │   │   ├── 📁 usecases
│   │   │   │   │   ├── 📄 BulkDeleteProductTags.ts
│   │   │   │   │   ├── 📄 CreateProductTag.ts
│   │   │   │   │   ├── 📄 DeleteProductTag.ts
│   │   │   │   │   ├── 📄 EditProductTag.ts
│   │   │   │   │   ├── 📄 GetProductTagDetail.ts
│   │   │   │   │   └── 📄 ListProductTags.ts
│   │   │   │   └── 📄 dto.ts
│   │   │   ├── 📁 products
│   │   │   │   ├── 📁 usecases
│   │   │   │   │   ├── 📄 BulkEditProducts.ts
│   │   │   │   │   ├── 📄 BulkReorderProducts.ts
│   │   │   │   │   ├── 📄 ChangeProductStatus.ts
│   │   │   │   │   ├── 📄 CreateProduct.ts
│   │   │   │   │   ├── 📄 EditProduct.ts
│   │   │   │   │   ├── 📄 GetProductDetail.ts
│   │   │   │   │   ├── 📄 GetProductDetailBySlug.ts
│   │   │   │   │   ├── 📄 ListProducts.ts
│   │   │   │   │   └── 📄 SoftDeleteProduct.ts
│   │   │   │   └── 📄 dto.ts
│   │   │   ├── 📁 promotions
│   │   │   │   ├── 📁 services
│   │   │   │   │   ├── 📄 EvaluatePromotionService.ts
│   │   │   │   │   └── 📄 ValidatePromotionCodeService.ts
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 ChangePromotionStatus.ts
│   │   │   │       ├── 📄 CreatePromotion.ts
│   │   │   │       ├── 📄 EditPromotion.ts
│   │   │   │       ├── 📄 GetPromotionDetail.ts
│   │   │   │       ├── 📄 ListPromotionUsages.ts
│   │   │   │       ├── 📄 ListPromotions.ts
│   │   │   │       ├── 📄 SoftDeletePromotion.ts
│   │   │   │       └── 📄 ValidatePromotionCode.ts
│   │   │   ├── 📁 reviews
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 CheckReviewed.ts
│   │   │   │       ├── 📄 CreateReview.ts
│   │   │   │       ├── 📄 GetPendingReviewSummary.ts
│   │   │   │       ├── 📄 ListMyReviews.ts
│   │   │   │       ├── 📄 ListReviewsByProduct.ts
│   │   │   │       └── 📄 ReplyReview.ts
│   │   │   ├── 📁 roles
│   │   │   │   ├── 📁 usecases
│   │   │   │   │   ├── 📄 CreateRole.ts
│   │   │   │   │   ├── 📄 EditRole.ts
│   │   │   │   │   ├── 📄 GetRoleDetail.ts
│   │   │   │   │   ├── 📄 GetRolePermissions.ts
│   │   │   │   │   ├── 📄 ListAssignableRoles.ts
│   │   │   │   │   ├── 📄 ListRoles.ts
│   │   │   │   │   ├── 📄 ListRolesForPermissions.ts
│   │   │   │   │   ├── 📄 SoftDeleteRole.ts
│   │   │   │   │   ├── 📄 UpdateRole.ts
│   │   │   │   │   └── 📄 UpdateRolePermissions.ts
│   │   │   │   ├── 📄 dto.ts
│   │   │   │   └── 📄 index.ts
│   │   │   ├── 📁 settings
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 GetGeneralSettings.ts
│   │   │   │       └── 📄 UpdateGeneralSettings.ts
│   │   │   ├── 📁 shipping
│   │   │   │   ├── 📁 services
│   │   │   │   │   ├── 📄 CalculateShippingQuoteService.ts
│   │   │   │   │   ├── 📄 GetAvailableDeliverySlotsService.ts
│   │   │   │   │   └── 📄 ResolveShippingZoneService.ts
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 BulkChangeBranchDeliverySlotCapacityStatus.ts
│   │   │   │       ├── 📄 BulkChangeBranchDeliveryTimeSlotStatus.ts
│   │   │   │       ├── 📄 BulkChangeBranchServiceAreaStatus.ts
│   │   │   │       ├── 📄 BulkChangeShippingZoneStatus.ts
│   │   │   │       ├── 📄 BulkDeleteShippingZones.ts
│   │   │   │       ├── 📄 BulkUpdateShippingZonePriority.ts
│   │   │   │       ├── 📄 BulkUpsertBranchDeliverySlotCapacities.ts
│   │   │   │       ├── 📄 BulkUpsertBranchDeliveryTimeSlots.ts
│   │   │   │       ├── 📄 BulkUpsertBranchServiceAreas.ts
│   │   │   │       ├── 📄 ChangeBranchDeliverySlotCapacityStatus.ts
│   │   │   │       ├── 📄 ChangeBranchDeliveryTimeSlotStatus.ts
│   │   │   │       ├── 📄 ChangeBranchServiceAreaStatus.ts
│   │   │   │       ├── 📄 ChangeDeliveryTimeSlotStatus.ts
│   │   │   │       ├── 📄 ChangeShippingZoneStatus.ts
│   │   │   │       ├── 📄 CopyBranchDeliverySlotCapacitiesFromDate.ts
│   │   │   │       ├── 📄 CopyBranchDeliveryTimeSlotsFromBranch.ts
│   │   │   │       ├── 📄 CopyBranchServiceAreasFromBranch.ts
│   │   │   │       ├── 📄 CreateBranchDeliverySlotCapacity.ts
│   │   │   │       ├── 📄 CreateBranchDeliveryTimeSlot.ts
│   │   │   │       ├── 📄 CreateBranchServiceArea.ts
│   │   │   │       ├── 📄 CreateDeliveryTimeSlot.ts
│   │   │   │       ├── 📄 CreateShippingZone.ts
│   │   │   │       ├── 📄 EditBranchDeliverySlotCapacity.ts
│   │   │   │       ├── 📄 EditBranchDeliveryTimeSlot.ts
│   │   │   │       ├── 📄 EditBranchServiceArea.ts
│   │   │   │       ├── 📄 EditDeliveryTimeSlot.ts
│   │   │   │       ├── 📄 EditShippingZone.ts
│   │   │   │       ├── 📄 GenerateBranchDeliverySlotCapacitiesFromDefaults.ts
│   │   │   │       ├── 📄 GetBranchCapacityPlanner.ts
│   │   │   │       ├── 📄 GetBranchDeliverySlotCapacityDetail.ts
│   │   │   │       ├── 📄 GetBranchDeliveryTimeSlotDetail.ts
│   │   │   │       ├── 📄 GetBranchServiceAreaDetail.ts
│   │   │   │       ├── 📄 GetBranchShippingSetupChecklist.ts
│   │   │   │       ├── 📄 GetDeliveryTimeSlotDetail.ts
│   │   │   │       ├── 📄 GetShippingZoneDetail.ts
│   │   │   │       ├── 📄 ListBranchDeliverySlotCapacities.ts
│   │   │   │       ├── 📄 ListBranchDeliveryTimeSlots.ts
│   │   │   │       ├── 📄 ListBranchServiceAreas.ts
│   │   │   │       ├── 📄 ListDeliveryTimeSlots.ts
│   │   │   │       ├── 📄 ListShippingZones.ts
│   │   │   │       ├── 📄 SoftDeleteBranchDeliverySlotCapacity.ts
│   │   │   │       ├── 📄 SoftDeleteBranchDeliveryTimeSlot.ts
│   │   │   │       ├── 📄 SoftDeleteBranchServiceArea.ts
│   │   │   │       ├── 📄 SoftDeleteDeliveryTimeSlot.ts
│   │   │   │       └── 📄 SoftDeleteShippingZone.ts
│   │   │   ├── 📁 uploads
│   │   │   │   └── 📁 usecases
│   │   │   │       └── 📄 UploadImage.ts
│   │   │   └── 📁 users
│   │   │       ├── 📁 usecases
│   │   │       │   ├── 📄 BulkEditUsers.ts
│   │   │       │   ├── 📄 CreateUser.ts
│   │   │       │   ├── 📄 EditUser.ts
│   │   │       │   ├── 📄 GetUserDetail.ts
│   │   │       │   ├── 📄 ListUsers.ts
│   │   │       │   ├── 📄 SoftDeleteUser.ts
│   │   │       │   └── 📄 UpdateUserStatus.ts
│   │   │       ├── 📄 dto.ts
│   │   │       └── 📄 index.ts
│   │   ├── 📁 config
│   │   │   └── 📁 di
│   │   │       └── 📄 container.ts
│   │   ├── 📁 domain
│   │   │   ├── 📁 audit-logs
│   │   │   │   ├── 📄 AuditLogRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 auth
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 branches
│   │   │   │   ├── 📄 Branch.ts
│   │   │   │   ├── 📄 BranchRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 carts
│   │   │   │   ├── 📄 CartRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 categories
│   │   │   │   ├── 📄 ProductCategory.ts
│   │   │   │   ├── 📄 ProductCategoryRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 chat
│   │   │   │   ├── 📄 ChatMessageRepository.ts
│   │   │   │   ├── 📄 ChatSessionRepository.ts
│   │   │   │   ├── 📄 NutritionReferenceSourceRepository.ts
│   │   │   │   ├── 📄 ProductHealthCautionRepository.ts
│   │   │   │   ├── 📄 ProductHealthFactRepository.ts
│   │   │   │   ├── 📄 ProductRecommendationLogRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 dashboard
│   │   │   │   ├── 📄 DashboardRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 inventory
│   │   │   │   └── 📄 InventoryRepository.ts
│   │   │   ├── 📁 notifications
│   │   │   │   ├── 📄 NotificationRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 orders
│   │   │   │   ├── 📄 Order.ts
│   │   │   │   ├── 📄 OrderRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 post-categories
│   │   │   │   ├── 📄 PostCategory.ts
│   │   │   │   ├── 📄 PostCategoryRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 post-tags
│   │   │   │   ├── 📄 PostTag.ts
│   │   │   │   ├── 📄 PostTagRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 posts
│   │   │   │   ├── 📄 Post.ts
│   │   │   │   ├── 📄 PostRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 products
│   │   │   │   ├── 📄 OriginRepository.ts
│   │   │   │   ├── 📄 ProductRepository.ts
│   │   │   │   ├── 📄 ProductTagGroupRepository.ts
│   │   │   │   ├── 📄 ProductTagRepository.ts
│   │   │   │   ├── 📄 Products.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 promotions
│   │   │   │   ├── 📄 Promotion.ts
│   │   │   │   ├── 📄 PromotionRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 reviews
│   │   │   │   └── 📄 ReviewRepository.ts
│   │   │   ├── 📁 roles
│   │   │   │   ├── 📄 Role.ts
│   │   │   │   ├── 📄 RoleRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 settings
│   │   │   │   ├── 📄 SettingGeneral.ts
│   │   │   │   └── 📄 SettingGeneralRepository.ts
│   │   │   ├── 📁 shipping
│   │   │   │   ├── 📄 BranchDeliverySlotCapacityRepository.ts
│   │   │   │   ├── 📄 BranchDeliveryTimeSlotRepository.ts
│   │   │   │   ├── 📄 BranchServiceArea.ts
│   │   │   │   ├── 📄 BranchServiceAreaRepository.ts
│   │   │   │   ├── 📄 DeliveryTimeSlotRepository.ts
│   │   │   │   ├── 📄 ShippingZoneRepository.ts
│   │   │   │   └── 📄 branchServiceArea.types.ts
│   │   │   ├── 📁 storage
│   │   │   │   └── 📄 FileStorage.ts
│   │   │   └── 📁 users
│   │   │       ├── 📄 User.ts
│   │   │       ├── 📄 UserRepository.ts
│   │   │       └── 📄 types.ts
│   │   ├── 📁 infrastructure
│   │   │   ├── 📁 ai
│   │   │   │   └── 📄 GeminiChatModelService.ts
│   │   │   ├── 📁 auth
│   │   │   │   ├── 📄 BcryptPasswordService.ts
│   │   │   │   ├── 📄 CryptoRefreshTokenService.ts
│   │   │   │   └── 📄 JwtTokenService.ts
│   │   │   ├── 📁 db
│   │   │   │   └── 📁 sequelize
│   │   │   │       ├── 📁 models
│   │   │   │       │   ├── 📄 AuditLogModel.ts
│   │   │   │       │   ├── 📄 BranchDeliverySlotCapacityModel.ts
│   │   │   │       │   ├── 📄 BranchDeliveryTimeSlotModel.ts
│   │   │   │       │   ├── 📄 BranchModel.ts
│   │   │   │       │   ├── 📄 BranchServiceAreaModel.ts
│   │   │   │       │   ├── 📄 CartItemModel.ts
│   │   │   │       │   ├── 📄 CartModel.ts
│   │   │   │       │   ├── 📄 ChatMessageModel.ts
│   │   │   │       │   ├── 📄 ChatSessionModel.ts
│   │   │   │       │   ├── 📄 DeliveryStatusHistoryModel.ts
│   │   │   │       │   ├── 📄 DeliveryTimeSlotModel.ts
│   │   │   │       │   ├── 📄 ForgotPasswordModel.ts
│   │   │   │       │   ├── 📄 InventoryStockModel.ts
│   │   │   │       │   ├── 📄 InventoryTransactionModel.ts
│   │   │   │       │   ├── 📄 NotificationModel.ts
│   │   │   │       │   ├── 📄 NotificationRecipientModel.ts
│   │   │   │       │   ├── 📄 NutritionReferenceSourceModel.ts
│   │   │   │       │   ├── 📄 OrderAddressModel.ts
│   │   │   │       │   ├── 📄 OrderItemModel.ts
│   │   │   │       │   ├── 📄 OrderModel.ts
│   │   │   │       │   ├── 📄 OriginModel.ts
│   │   │   │       │   ├── 📄 PaymentModel.ts
│   │   │   │       │   ├── 📄 PostCategoryModel.ts
│   │   │   │       │   ├── 📄 PostModel.ts
│   │   │   │       │   ├── 📄 PostRelatedProductModel.ts
│   │   │   │       │   ├── 📄 PostTagMapModel.ts
│   │   │   │       │   ├── 📄 PostTagModel.ts
│   │   │   │       │   ├── 📄 ProductCategoryModel.ts
│   │   │   │       │   ├── 📄 ProductHealthCautionModel.ts
│   │   │   │       │   ├── 📄 ProductHealthFactModel.ts
│   │   │   │       │   ├── 📄 ProductModel.ts
│   │   │   │       │   ├── 📄 ProductOptionModel.ts
│   │   │   │       │   ├── 📄 ProductOptionValueModel.ts
│   │   │   │       │   ├── 📄 ProductRecommendationLogModel.ts
│   │   │   │       │   ├── 📄 ProductReviewModel.ts
│   │   │   │       │   ├── 📄 ProductTagGroupModel.ts
│   │   │   │       │   ├── 📄 ProductTagMapModel.ts
│   │   │   │       │   ├── 📄 ProductTagModel.ts
│   │   │   │       │   ├── 📄 ProductVariantModel.ts
│   │   │   │       │   ├── 📄 ProductVariantValueModel.ts
│   │   │   │       │   ├── 📄 PromotionBranchModel.ts
│   │   │   │       │   ├── 📄 PromotionCategoryModel.ts
│   │   │   │       │   ├── 📄 PromotionCodeModel.ts
│   │   │   │       │   ├── 📄 PromotionModel.ts
│   │   │   │       │   ├── 📄 PromotionOriginModel.ts
│   │   │   │       │   ├── 📄 PromotionProductModel.ts
│   │   │   │       │   ├── 📄 PromotionUsageModel.ts
│   │   │   │       │   ├── 📄 PromotionVariantModel.ts
│   │   │   │       │   ├── 📄 RoleModel.ts
│   │   │   │       │   ├── 📄 SettingGeneralModel.ts
│   │   │   │       │   ├── 📄 ShippingZoneModel.ts
│   │   │   │       │   ├── 📄 UserBranchModel.ts
│   │   │   │       │   └── 📄 UserModel.ts
│   │   │   │       └── 📄 index.ts
│   │   │   ├── 📁 email
│   │   │   │   └── 📄 EmailService.ts
│   │   │   ├── 📁 repositories
│   │   │   │   ├── 📄 SequelizeAuditLogRepository.ts
│   │   │   │   ├── 📄 SequelizeBranchDeliverySlotCapacityRepository.ts
│   │   │   │   ├── 📄 SequelizeBranchDeliveryTimeSlotRepository.ts
│   │   │   │   ├── 📄 SequelizeBranchRepository.ts
│   │   │   │   ├── 📄 SequelizeBranchServiceAreaRepository.ts
│   │   │   │   ├── 📄 SequelizeCartRepository.ts
│   │   │   │   ├── 📄 SequelizeChatMessageRepository.ts
│   │   │   │   ├── 📄 SequelizeChatSessionRepository.ts
│   │   │   │   ├── 📄 SequelizeDashboardRepository.ts
│   │   │   │   ├── 📄 SequelizeDeliveryTimeSlotRepository.ts
│   │   │   │   ├── 📄 SequelizeInventoryRepository.ts
│   │   │   │   ├── 📄 SequelizeNotificationRepository.ts
│   │   │   │   ├── 📄 SequelizeNutritionReferenceSourceRepository.ts
│   │   │   │   ├── 📄 SequelizeOrderRepository.ts
│   │   │   │   ├── 📄 SequelizeOriginRepository.ts
│   │   │   │   ├── 📄 SequelizePostCategoryRepository.ts
│   │   │   │   ├── 📄 SequelizePostRepository.ts
│   │   │   │   ├── 📄 SequelizePostTagRepository.ts
│   │   │   │   ├── 📄 SequelizeProductCategoryRepository.ts
│   │   │   │   ├── 📄 SequelizeProductHealthCautionRepository.ts
│   │   │   │   ├── 📄 SequelizeProductHealthFactRepository.ts
│   │   │   │   ├── 📄 SequelizeProductRecommendationLogRepository.ts
│   │   │   │   ├── 📄 SequelizeProductRepository.ts
│   │   │   │   ├── 📄 SequelizeProductTagGroupRepository.ts
│   │   │   │   ├── 📄 SequelizeProductTagRepository.ts
│   │   │   │   ├── 📄 SequelizePromotionRepository.ts
│   │   │   │   ├── 📄 SequelizeReviewRepository.ts
│   │   │   │   ├── 📄 SequelizeRoleRepository.ts
│   │   │   │   ├── 📄 SequelizeSettingGeneralRepository.ts
│   │   │   │   ├── 📄 SequelizeShippingZoneRepository.ts
│   │   │   │   └── 📄 SequelizeUserRepository.ts
│   │   │   └── 📁 storage
│   │   │       ├── 📄 CloudinaryStorage.ts
│   │   │       └── 📄 cloudinaryClient.ts
│   │   ├── 📁 interfaces
│   │   │   └── 📁 http
│   │   │       └── 📁 express
│   │   │           ├── 📁 controllers
│   │   │           │   ├── 📁 client
│   │   │           │   │   ├── 📄 ClientAuthController.ts
│   │   │           │   │   ├── 📄 ClientCartController.ts
│   │   │           │   │   ├── 📄 ClientCategoriesController.ts
│   │   │           │   │   ├── 📄 ClientChatController.ts
│   │   │           │   │   ├── 📄 ClientForgotPasswordController.ts
│   │   │           │   │   ├── 📄 ClientOrdersController.ts
│   │   │           │   │   ├── 📄 ClientPostCategoriesController.ts
│   │   │           │   │   ├── 📄 ClientPostTagsController.ts
│   │   │           │   │   ├── 📄 ClientPostsController.ts
│   │   │           │   │   ├── 📄 ClientProductsController.ts
│   │   │           │   │   ├── 📄 ClientResetPasswordController.ts
│   │   │           │   │   ├── 📄 ClientReviewsController.ts
│   │   │           │   │   └── 📄 ClientVerifyOtpController.ts
│   │   │           │   ├── 📄 AdminReviewsController.ts
│   │   │           │   ├── 📄 AuditLogsController.ts
│   │   │           │   ├── 📄 AuthController.ts
│   │   │           │   ├── 📄 BranchDeliverySlotCapacitiesController.ts
│   │   │           │   ├── 📄 BranchDeliveryTimeSlotsController.ts
│   │   │           │   ├── 📄 BranchServiceAreasController.ts
│   │   │           │   ├── 📄 BranchesController.ts
│   │   │           │   ├── 📄 DashboardController.ts
│   │   │           │   ├── 📄 DeliveryTimeSlotsController.ts
│   │   │           │   ├── 📄 InventoryController.ts
│   │   │           │   ├── 📄 NotificationsController.ts
│   │   │           │   ├── 📄 OrdersController.ts
│   │   │           │   ├── 📄 OriginsController.ts
│   │   │           │   ├── 📄 PostCategoriesController.ts
│   │   │           │   ├── 📄 PostTagsController.ts
│   │   │           │   ├── 📄 PostsController.ts
│   │   │           │   ├── 📄 ProductCategoriesController.ts
│   │   │           │   ├── 📄 ProductTagGroupsController.ts
│   │   │           │   ├── 📄 ProductTagsController.ts
│   │   │           │   ├── 📄 ProductsController.ts
│   │   │           │   ├── 📄 PromotionsController.ts
│   │   │           │   ├── 📄 RolesController.ts
│   │   │           │   ├── 📄 SettingsGeneralController.ts
│   │   │           │   ├── 📄 ShippingZonesController.ts
│   │   │           │   ├── 📄 UploadController.ts
│   │   │           │   └── 📄 UsersController.ts
│   │   │           ├── 📁 middlewares
│   │   │           │   ├── 📄 auth.ts
│   │   │           │   ├── 📄 multer.ts
│   │   │           │   └── 📄 permissions.ts
│   │   │           └── 📁 routes
│   │   │               ├── 📁 client
│   │   │               │   ├── 📄 clientAuth.routes.ts
│   │   │               │   ├── 📄 clientCart.routes.ts
│   │   │               │   ├── 📄 clientCategories.routes.ts
│   │   │               │   ├── 📄 clientChat.routes.ts
│   │   │               │   ├── 📄 clientForgotPassword.routes.ts
│   │   │               │   ├── 📄 clientOrders.routes.ts
│   │   │               │   ├── 📄 clientPostCategories.routes.ts
│   │   │               │   ├── 📄 clientPostTags.routes.ts
│   │   │               │   ├── 📄 clientPosts.routes.ts
│   │   │               │   ├── 📄 clientProducts.routes.ts
│   │   │               │   ├── 📄 clientReviews.routes.ts
│   │   │               │   ├── 📄 clientSettings.routes.ts
│   │   │               │   └── 📄 clientUpload.routes.ts
│   │   │               ├── 📄 adminReviews.routes.ts
│   │   │               ├── 📄 adminSettings.routes.ts
│   │   │               ├── 📄 auditLogs.routes.ts
│   │   │               ├── 📄 auth.routes.ts
│   │   │               ├── 📄 branchDeliverySlotCapacities.routes.ts
│   │   │               ├── 📄 branchDeliveryTimeSlots.routes.ts
│   │   │               ├── 📄 branchServiceAreas.routes.ts
│   │   │               ├── 📄 branches.routes.ts
│   │   │               ├── 📄 dashboard.routes.ts
│   │   │               ├── 📄 deliveryTimeSlots.routes.ts
│   │   │               ├── 📄 inventory.routes.ts
│   │   │               ├── 📄 notifications.routes.ts
│   │   │               ├── 📄 orders.routes.ts
│   │   │               ├── 📄 origins.routes.ts
│   │   │               ├── 📄 postCategories.routes.ts
│   │   │               ├── 📄 postTags.routes.ts
│   │   │               ├── 📄 posts.routes.ts
│   │   │               ├── 📄 productCategories.routes.ts
│   │   │               ├── 📄 productTagGroups.routes.ts
│   │   │               ├── 📄 productTags.routes.ts
│   │   │               ├── 📄 products.routes.ts
│   │   │               ├── 📄 promotions.routes.ts
│   │   │               ├── 📄 roles.routes.ts
│   │   │               ├── 📄 shippingZones.routes.ts
│   │   │               ├── 📄 upload.routes.ts
│   │   │               └── 📄 users.routes.ts
│   │   ├── 📁 types
│   │   │   └── 📄 express.d.ts
│   │   └── 📄 main.ts
│   ├── ⚙️ .gitignore
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   └── ⚙️ tsconfig.json
├── 📁 frontend
│   ├── 📁 public
│   │   └── 🖼️ vite.svg
│   ├── 📁 src
│   │   ├── 📁 assets
│   │   │   └── 📁 banner
│   │   │       ├── 🖼️ e3cb575153b7b13d25e55c7bc4652d40.jpg
│   │   │       └── 🖼️ ff5da3ca53789e33510f3c7bf32894a2.jpg
│   │   ├── 📁 auth
│   │   │   ├── 📄 Can.tsx
│   │   │   └── 📄 RequireAuth.tsx
│   │   ├── 📁 components
│   │   │   ├── 📁 admin
│   │   │   │   ├── 📁 common
│   │   │   │   │   ├── 📄 Pagination.tsx
│   │   │   │   │   └── 📄 RichTextEditor.tsx
│   │   │   │   ├── 📁 dashboard
│   │   │   │   │   ├── 📁 hooks
│   │   │   │   │   │   ├── 📄 useDashboardData.ts
│   │   │   │   │   │   └── 📄 useDashboardVisibility.ts
│   │   │   │   │   ├── 📁 sections
│   │   │   │   │   │   ├── 📄 BranchAdminDashboardSection.tsx
│   │   │   │   │   │   ├── 📄 DashboardAlertsSection.tsx
│   │   │   │   │   │   ├── 📄 DashboardHeroSection.tsx
│   │   │   │   │   │   ├── 📄 DashboardQuickLinksSection.tsx
│   │   │   │   │   │   ├── 📄 FunctionalDashboardSection.tsx
│   │   │   │   │   │   └── 📄 SuperAdminDashboardSection.tsx
│   │   │   │   │   ├── 📁 shared
│   │   │   │   │   │   ├── 📄 DashboardBadge.tsx
│   │   │   │   │   │   ├── 📄 DashboardEmptyState.tsx
│   │   │   │   │   │   ├── 📄 DashboardHealthPill.tsx
│   │   │   │   │   │   ├── 📄 DashboardNumber.tsx
│   │   │   │   │   │   ├── 📄 DashboardScopeHeader.tsx
│   │   │   │   │   │   └── 📄 DashboardSkeleton.tsx
│   │   │   │   │   ├── 📁 types
│   │   │   │   │   │   └── 📄 dashboard.ts
│   │   │   │   │   ├── 📁 utils
│   │   │   │   │   │   ├── 📄 dashboardFormatters.ts
│   │   │   │   │   │   ├── 📄 dashboardGuards.ts
│   │   │   │   │   │   └── 📄 dashboardMappers.ts
│   │   │   │   │   └── 📁 widgets
│   │   │   │   │       ├── 📄 BranchPerformanceTable.tsx
│   │   │   │   │       ├── 📄 DashboardAlertList.tsx
│   │   │   │   │       ├── 📄 DashboardFilterBar.tsx
│   │   │   │   │       ├── 📄 DashboardKpiCard.tsx
│   │   │   │   │       ├── 📄 DashboardKpiGrid.tsx
│   │   │   │   │       ├── 📄 DashboardQuickLinksGrid.tsx
│   │   │   │   │       ├── 📄 DashboardSectionCard.tsx
│   │   │   │   │       ├── 📄 InventoryHealthCard.tsx
│   │   │   │   │       ├── 📄 MetricBarListCard.tsx
│   │   │   │   │       ├── 📄 MetricDonutCard.tsx
│   │   │   │   │       ├── 📄 MiniStatList.tsx
│   │   │   │   │       ├── 📄 PromotionsHealthCard.tsx
│   │   │   │   │       ├── 📄 ReviewsHealthCard.tsx
│   │   │   │   │       ├── 📄 ShippingHealthCard.tsx
│   │   │   │   │       ├── 📄 StatusDistributionCard.tsx
│   │   │   │   │       ├── 📄 UsersHealthCard.tsx
│   │   │   │   │       └── 📄 WorkQueueCard.tsx
│   │   │   │   ├── 📁 layouts
│   │   │   │   │   ├── 📄 Card.tsx
│   │   │   │   │   ├── 📄 DashboardHeader.tsx
│   │   │   │   │   ├── 📄 RecentTransactions.tsx
│   │   │   │   │   └── 📄 Sidebar.tsx
│   │   │   │   └── 📁 notifications
│   │   │   │       ├── 📄 NotificationDropdown.tsx
│   │   │   │       ├── 📄 NotificationItem.tsx
│   │   │   │       └── 📄 NotificationList.tsx
│   │   │   └── 📁 client
│   │   │       ├── 📁 chat
│   │   │       │   ├── 📄 ChatLauncher.tsx
│   │   │       │   ├── 📄 ChatMessageBubble.tsx
│   │   │       │   ├── 📄 ChatQuickActions.tsx
│   │   │       │   ├── 📄 ChatRecommendationCard.tsx
│   │   │       │   ├── 📄 ChatRecommendationList.tsx
│   │   │       │   ├── 📄 ChatTypingIndicator.tsx
│   │   │       │   └── 📄 ChatWidget.tsx
│   │   │       ├── 📁 layouts
│   │   │       │   ├── 📄 Footer.tsx
│   │   │       │   ├── 📄 Header.tsx
│   │   │       │   └── 📄 Layout.tsx
│   │   │       └── 📁 product
│   │   │           └── 📄 ProductList.tsx
│   │   ├── 📁 context
│   │   │   ├── 📄 AdminToastContext.tsx
│   │   │   ├── 📄 AuthContext.tsx
│   │   │   ├── 📄 AuthContextAdmin.tsx
│   │   │   ├── 📄 CartContext.tsx
│   │   │   ├── 📄 ChatbotContext.tsx
│   │   │   ├── 📄 ThemeContext.tsx
│   │   │   └── 📄 ToastContext.tsx
│   │   ├── 📁 hooks
│   │   │   ├── 📄 useChatbot.ts
│   │   │   ├── 📄 useNotifications.ts
│   │   │   └── 📄 useTheme.ts
│   │   ├── 📁 pages
│   │   │   ├── 📁 admin
│   │   │   │   ├── 📁 audit-logs
│   │   │   │   │   └── 📄 AuditLogsPage.tsx
│   │   │   │   ├── 📁 auth
│   │   │   │   │   └── 📄 LoginPageAdmin.tsx
│   │   │   │   ├── 📁 branches
│   │   │   │   │   ├── 📄 BranchCreatePage.tsx
│   │   │   │   │   ├── 📄 BranchEditPage.tsx
│   │   │   │   │   └── 📄 BranchesPage.tsx
│   │   │   │   ├── 📁 categories
│   │   │   │   │   ├── 📄 ProductCategoryCreateModal.tsx
│   │   │   │   │   ├── 📄 ProductCategoryEditModal.tsx
│   │   │   │   │   └── 📄 ProductCategoryPage.tsx
│   │   │   │   ├── 📁 content
│   │   │   │   │   ├── 📄 PostCategoriesPage.tsx
│   │   │   │   │   ├── 📄 PostCategoryCreateModal.tsx
│   │   │   │   │   ├── 📄 PostCategoryEditModal.tsx
│   │   │   │   │   ├── 📄 PostCreatePage.tsx
│   │   │   │   │   ├── 📄 PostEditPage.tsx
│   │   │   │   │   ├── 📄 PostTagFormModal.tsx
│   │   │   │   │   ├── 📄 PostTagsPage.tsx
│   │   │   │   │   └── 📄 PostsPage.tsx
│   │   │   │   ├── 📁 dashboard
│   │   │   │   │   └── 📄 DashboardPage.tsx
│   │   │   │   ├── 📁 inventory
│   │   │   │   │   ├── 📄 InventoryPage.tsx
│   │   │   │   │   └── 📄 InventoryTransactionHistoryPage.tsx
│   │   │   │   ├── 📁 notifications
│   │   │   │   │   └── 📄 NotificationsPage.tsx
│   │   │   │   ├── 📁 orders
│   │   │   │   │   ├── 📄 OrderWorkspacePage.tsx
│   │   │   │   │   └── 📄 OrdersPage.tsx
│   │   │   │   ├── 📁 origins
│   │   │   │   │   └── 📄 ProductOriginPage.tsx
│   │   │   │   ├── 📁 products
│   │   │   │   │   ├── 📄 ProductCreatePage.tsx
│   │   │   │   │   ├── 📄 ProductEditPage.tsx
│   │   │   │   │   └── 📄 ProductsPage.tsx
│   │   │   │   ├── 📁 promotions
│   │   │   │   │   ├── 📄 PromotionCreatePage.tsx
│   │   │   │   │   ├── 📄 PromotionEditPage.tsx
│   │   │   │   │   └── 📄 PromotionsPage.tsx
│   │   │   │   ├── 📁 roles
│   │   │   │   │   ├── 📄 PermissionsPage.tsx
│   │   │   │   │   ├── 📄 RoleCreatePage.tsx
│   │   │   │   │   ├── 📄 RoleEditPage.tsx
│   │   │   │   │   └── 📄 RolesPage.tsx
│   │   │   │   ├── 📁 settings
│   │   │   │   │   └── 📄 SettingsGeneralPage.tsx
│   │   │   │   ├── 📁 shipping
│   │   │   │   │   ├── 📄 BranchDeliverySlotCapacitiesPage.tsx
│   │   │   │   │   ├── 📄 BranchDeliverySlotCapacityCreatePage.tsx
│   │   │   │   │   ├── 📄 BranchDeliverySlotCapacityEditPage.tsx
│   │   │   │   │   ├── 📄 BranchDeliveryTimeSlotCreatePage.tsx
│   │   │   │   │   ├── 📄 BranchDeliveryTimeSlotEditPage.tsx
│   │   │   │   │   ├── 📄 BranchDeliveryTimeSlotsPage.tsx
│   │   │   │   │   ├── 📄 BranchServiceAreaCreatePage.tsx
│   │   │   │   │   ├── 📄 BranchServiceAreaEditPage.tsx
│   │   │   │   │   ├── 📄 BranchServiceAreasPage.tsx
│   │   │   │   │   ├── 📄 DeliveryTimeSlotCreatePage.tsx
│   │   │   │   │   ├── 📄 DeliveryTimeSlotEditPage.tsx
│   │   │   │   │   ├── 📄 DeliveryTimeSlotsPage.tsx
│   │   │   │   │   ├── 📄 ShippingOverviewPage.tsx
│   │   │   │   │   ├── 📄 ShippingZoneCreatePage.tsx
│   │   │   │   │   ├── 📄 ShippingZoneEditPage.tsx
│   │   │   │   │   └── 📄 ShippingZonesPage.tsx
│   │   │   │   ├── 📁 tags
│   │   │   │   │   └── 📄 ProductTagPage.tsx
│   │   │   │   └── 📁 users
│   │   │   │       ├── 📁 shared
│   │   │   │       │   ├── 📄 UserAvatarField.tsx
│   │   │   │       │   ├── 📄 UserBranchAssignment.tsx
│   │   │   │       │   ├── 📄 UserStatusField.tsx
│   │   │   │       │   ├── 📄 userApi.ts
│   │   │   │       │   └── 📄 userMappers.ts
│   │   │   │       ├── 📄 UserCreatePage.tsx
│   │   │   │       ├── 📄 UserEditPage.tsx
│   │   │   │       ├── 📄 UsersHubPage.tsx
│   │   │   │       └── 📄 UsersPage.tsx
│   │   │   └── 📁 client
│   │   │       ├── 📁 Auth
│   │   │       │   ├── 📄 ForgotPasswordPage.tsx
│   │   │       │   ├── 📄 LoginPage.tsx
│   │   │       │   └── 📄 RegisterPage.tsx
│   │   │       ├── 📁 Cart
│   │   │       │   └── 📄 CartPage.tsx
│   │   │       ├── 📁 Checkout
│   │   │       │   └── 📄 CheckoutPage.tsx
│   │   │       ├── 📁 Home
│   │   │       │   ├── 📄 HomePage.tsx
│   │   │       │   └── 📄 content.ts
│   │   │       ├── 📁 Order
│   │   │       │   ├── 📄 OrderDetailPage.tsx
│   │   │       │   └── 📄 OrderHistoryPage.tsx
│   │   │       ├── 📁 Other
│   │   │       │   ├── 📄 AboutPage.tsx
│   │   │       │   ├── 📄 ContactPage.tsx
│   │   │       │   ├── 📄 FAQPage.tsx
│   │   │       │   ├── 📄 PrivacyPolicyPage.tsx
│   │   │       │   ├── 📄 ReturnPolicyPage.tsx
│   │   │       │   ├── 📄 ShippingPolicyPage.tsx
│   │   │       │   └── 📄 TermsOfUsePage.tsx
│   │   │       ├── 📁 Post
│   │   │       │   ├── 📄 PostDetailPage.tsx
│   │   │       │   └── 📄 PostsPage.tsx
│   │   │       ├── 📁 Product
│   │   │       │   ├── 📄 ProductDetailPage.tsx
│   │   │       │   └── 📄 Products.tsx
│   │   │       └── 📁 Profile
│   │   │           └── 📄 ProfilePage.tsx
│   │   ├── 📁 services
│   │   │   ├── 📁 api
│   │   │   │   ├── 📄 auditLogsApi.ts
│   │   │   │   ├── 📄 chatClient.ts
│   │   │   │   ├── 📄 dashboardApi.ts
│   │   │   │   ├── 📄 notificationsApi.ts
│   │   │   │   ├── 📄 ordersClient.ts
│   │   │   │   └── 📄 postsClient.ts
│   │   │   └── 📄 http.ts
│   │   ├── 📁 types
│   │   │   ├── 📄 auditLogs.ts
│   │   │   ├── 📄 chat.ts
│   │   │   ├── 📄 inventory.ts
│   │   │   ├── 📄 notifications.ts
│   │   │   ├── 📄 orders.ts
│   │   │   ├── 📄 posts.ts
│   │   │   └── 📄 products.ts
│   │   ├── 📁 utils
│   │   │   ├── 📄 categoryTree.tsx
│   │   │   ├── 📄 categoryTreeForClient.ts
│   │   │   ├── 📄 mapOrder.ts
│   │   │   ├── 📄 mapProduct.ts
│   │   │   ├── 📄 orderSummary.ts
│   │   │   ├── 📄 productSummary.ts
│   │   │   └── 📄 uploadImagesInContent.tsx
│   │   ├── 🎨 App.css
│   │   ├── 📄 App.tsx
│   │   ├── 🎨 index.css
│   │   └── 📄 main.tsx
│   ├── ⚙️ .gitignore
│   ├── 📝 README.md
│   ├── 📄 eslint.config.js
│   ├── 🌐 index.html
│   ├── ⚙️ package-lock.json
│   ├── ⚙️ package.json
│   ├── 📄 postcss.config.js
│   ├── 📄 tailwind.config.js
│   ├── ⚙️ tsconfig.app.json
│   ├── ⚙️ tsconfig.json
│   ├── ⚙️ tsconfig.node.json
│   ├── ⚙️ vercel.json
│   └── 📄 vite.config.ts
├── ⚙️ .gitignore
└── 📝 README.md
```

---
