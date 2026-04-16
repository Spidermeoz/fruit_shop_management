# Hệ thống Quản lý Cửa hàng Trái cây (Fruit Shop Management)

Dự án này là một hệ thống quản lý bán hàng hoàn chỉnh dành cho một cửa hàng trái cây, bao gồm cả trang web cho khách hàng (client) và trang quản trị (admin dashboard) cho nhân viên.

## Tính năng chính

### Dành cho Khách hàng

- **Duyệt sản phẩm:** Xem danh sách sản phẩm theo danh mục, tìm kiếm và lọc.
- **Giỏ hàng:** Thêm, xóa, cập nhật số lượng sản phẩm trong giỏ hàng.
- **Thanh toán:** Quy trình thanh toán an toàn và tiện lợi.
- **Quản lý tài khoản:** Đăng ký, đăng nhập, xem lịch sử đơn hàng và cập nhật thông tin cá nhân.
- **Đánh giá sản phẩm:** Để lại nhận xét và xếp hạng cho các sản phẩm đã mua.

### Dành cho Quản trị viên (Admin)

- **Bảng điều khiển (Dashboard):** Giao diện tổng quan với các số liệu thống kê quan trọng (doanh thu, đơn hàng mới, khách hàng mới).
- **Quản lý Sản phẩm:** Thêm, sửa, xóa sản phẩm và các thuộc tính liên quan.
- **Quản lý Danh mục:** Tổ chức sản phẩm theo các danh mục phân cấp.
- **Quản lý Đơn hàng:** Xem, cập nhật trạng thái và xử lý đơn hàng của khách.
- **Quản lý Người dùng:** Quản lý tài khoản khách hàng và phân quyền cho nhân viên.
- **Quản lý Vai trò & Phân quyền:** Tạo và gán vai trò (ví dụ: Admin, Staff) với các quyền hạn truy cập khác nhau.
- **Cài đặt chung:** Tùy chỉnh các thông tin cơ bản của website.

## Kiến trúc & Cây công nghệ

Dự án được xây dựng theo kiến trúc Monorepo, tách biệt rõ ràng giữa Backend và Frontend.

### Backend

Backend được phát triển bằng **Node.js** và **TypeScript**, tuân thủ theo nguyên tắc **Clean Architecture** và các mẫu thiết kế của **Domain-Driven Design (DDD)**.

- **Framework:** Express.js
- **Ngôn ngữ:** TypeScript
- **ORM:** Sequelize (Hỗ trợ PostgreSQL, MySQL, MariaDB, SQLite, MSSQL)
- **Xác thực:** JWT (JSON Web Tokens)
- **Lưu trữ file:** Cloudinary (dễ dàng thay thế)
- **Kiến trúc:**
  - `src/domain`: Chứa các business logic cốt lõi, entities và repositories interfaces.
  - `src/application`: Chứa các use cases (kịch bản sử dụng) để điều phối domain logic.
  - `src/infrastructure`: Chứa các cài đặt cụ thể cho services bên ngoài (database, payment gateways, email services...).
  - `src/interfaces`: Chứa các lớp giao tiếp với bên ngoài (REST API controllers).

### Frontend

Frontend là một ứng dụng **Single Page Application (SPA)** được xây dựng bằng **React**.

- **Framework/Library:** React.js
- **Ngôn ngữ:** TypeScript
- **Build tool:** Vite
- **Styling:** Tailwind CSS
- **Quản lý state:** React Context API
- **Routing:** React Router DOM
- **Kiến trúc:**
  - `src/pages`: Chứa các trang chính của ứng dụng (e.g., Home, Product, Cart).
  - `src/components`: Chứa các UI components có thể tái sử dụng.
  - `src/services`: Chứa logic gọi API đến backend.
  - `src/context`: Quản lý state toàn cục (e.g., AuthContext, CartContext).
  - `src/hooks`: Chứa các custom hooks.

## Cài đặt và Chạy dự án

### Yêu cầu

- Node.js (phiên bản 18.x trở lên)
- npm hoặc yarn
- Một hệ quản trị CSDL SQL (ví dụ: PostgreSQL)
- Tài khoản Cloudinary (cho việc upload ảnh)

### 1. Cài đặt Backend

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt các dependencies
npm install

# 3. Tạo file .env và cấu hình
# Copy nội dung từ file .env.example (nếu có) hoặc sử dụng mẫu dưới đây
cp .env.example .env
```

**Mẫu file `backend/.env` (Liên hệ: `0967004916` để yêu cầu file cấu hình chi tiết):**

```env
# Server
PORT=8000

# Database (Ví dụ cho PostgreSQL)
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=fruit_shop_db

# JWT
JWT_SECRET="your_super_secret_key"
JWT_EXPIRES_IN="1d"
REFRESH_TOKEN_SECRET="another_super_secret_key"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

```bash
# 4. Chạy database migrations (nếu có)
npm run db:migrate

# 5. Khởi động server backend
npm run dev
```

Server backend sẽ chạy tại `http://localhost:8000`.

### 2. Cài đặt Frontend

```bash
# 1. Mở một terminal mới, di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt các dependencies
npm install

# 3. Tạo file .env.local và cấu hình
# Copy nội dung từ file .env.example (nếu có) hoặc sử dụng mẫu dưới đây
cp .env.example .env.local
```

**Mẫu file `frontend/.env.local`:**

```env
# URL của backend API
VITE_API_BASE_URL=http://localhost:8000/api
```

```bash
# 4. Khởi động server frontend
npm run dev
```

Trang web sẽ được mở tại `http://localhost:5173` (hoặc một port khác do Vite chỉ định).

## Các Scripts hữu ích

### Backend

- `npm run dev`: Chạy server ở chế độ development (với hot-reload).
- `npm run build`: Build code TypeScript sang JavaScript.
- `npm start`: Chạy server ở chế độ production (sau khi build).
- `npm run lint`: Kiểm tra lỗi code với ESLint.

### Frontend

- `npm run dev`: Chạy server development.
- `npm run build`: Build ứng dụng cho production.
- `npm run preview`: Xem bản build production tại local.
- `npm run lint`: Kiểm tra lỗi code với ESLint.

## Đóng góp

Mọi sự đóng góp đều được chào đón! Vui lòng tạo Pull Request để đóng góp vào dự án.

## Giấy phép

Dự án này được cấp phép theo [MIT License](./LICENSE).

## Cấu trúc thư mục

```
├── 📁 backend
│   ├── 📁 src
│   │   ├── 📁 application
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
│   │   │   ├── 📁 dashboard
│   │   │   │   └── 📁 usecases
│   │   │   │       └── 📄 GetAdminDashboard.ts
│   │   │   ├── 📁 inventory
│   │   │   │   └── 📁 usecases
│   │   │   │       ├── 📄 ListInventoryStocks.ts
│   │   │   │       ├── 📄 ListInventoryTransactions.ts
│   │   │   │       ├── 📄 SetInventoryStock.ts
│   │   │   │       └── 📄 TransferInventoryStock.ts
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
│   │   │   │   │   ├── 📄 ChangeProductTagStatus.ts
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
│   │   │   ├── 📁 dashboard
│   │   │   │   ├── 📄 DashboardRepository.ts
│   │   │   │   └── 📄 types.ts
│   │   │   ├── 📁 inventory
│   │   │   │   └── 📄 InventoryRepository.ts
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
│   │   │   ├── 📁 auth
│   │   │   │   ├── 📄 BcryptPasswordService.ts
│   │   │   │   ├── 📄 CryptoRefreshTokenService.ts
│   │   │   │   └── 📄 JwtTokenService.ts
│   │   │   ├── 📁 db
│   │   │   │   └── 📁 sequelize
│   │   │   │       ├── 📁 models
│   │   │   │       │   ├── 📄 BranchDeliverySlotCapacityModel.ts
│   │   │   │       │   ├── 📄 BranchDeliveryTimeSlotModel.ts
│   │   │   │       │   ├── 📄 BranchModel.ts
│   │   │   │       │   ├── 📄 BranchServiceAreaModel.ts
│   │   │   │       │   ├── 📄 CartItemModel.ts
│   │   │   │       │   ├── 📄 CartModel.ts
│   │   │   │       │   ├── 📄 DeliveryStatusHistoryModel.ts
│   │   │   │       │   ├── 📄 DeliveryTimeSlotModel.ts
│   │   │   │       │   ├── 📄 ForgotPasswordModel.ts
│   │   │   │       │   ├── 📄 InventoryStockModel.ts
│   │   │   │       │   ├── 📄 InventoryTransactionModel.ts
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
│   │   │   │       │   ├── 📄 ProductModel.ts
│   │   │   │       │   ├── 📄 ProductOptionModel.ts
│   │   │   │       │   ├── 📄 ProductOptionValueModel.ts
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
│   │   │   │   ├── 📄 SequelizeBranchDeliverySlotCapacityRepository.ts
│   │   │   │   ├── 📄 SequelizeBranchDeliveryTimeSlotRepository.ts
│   │   │   │   ├── 📄 SequelizeBranchRepository.ts
│   │   │   │   ├── 📄 SequelizeBranchServiceAreaRepository.ts
│   │   │   │   ├── 📄 SequelizeCartRepository.ts
│   │   │   │   ├── 📄 SequelizeDashboardRepository.ts
│   │   │   │   ├── 📄 SequelizeDeliveryTimeSlotRepository.ts
│   │   │   │   ├── 📄 SequelizeInventoryRepository.ts
│   │   │   │   ├── 📄 SequelizeOrderRepository.ts
│   │   │   │   ├── 📄 SequelizeOriginRepository.ts
│   │   │   │   ├── 📄 SequelizePostCategoryRepository.ts
│   │   │   │   ├── 📄 SequelizePostRepository.ts
│   │   │   │   ├── 📄 SequelizePostTagRepository.ts
│   │   │   │   ├── 📄 SequelizeProductCategoryRepository.ts
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
│   │   │           │   ├── 📄 AuthController.ts
│   │   │           │   ├── 📄 BranchDeliverySlotCapacitiesController.ts
│   │   │           │   ├── 📄 BranchDeliveryTimeSlotsController.ts
│   │   │           │   ├── 📄 BranchServiceAreasController.ts
│   │   │           │   ├── 📄 BranchesController.ts
│   │   │           │   ├── 📄 DashboardController.ts
│   │   │           │   ├── 📄 DeliveryTimeSlotsController.ts
│   │   │           │   ├── 📄 InventoryController.ts
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
│   │   │               ├── 📄 auth.routes.ts
│   │   │               ├── 📄 branchDeliverySlotCapacities.routes.ts
│   │   │               ├── 📄 branchDeliveryTimeSlots.routes.ts
│   │   │               ├── 📄 branchServiceAreas.routes.ts
│   │   │               ├── 📄 branches.routes.ts
│   │   │               ├── 📄 dashboard.routes.ts
│   │   │               ├── 📄 deliveryTimeSlots.routes.ts
│   │   │               ├── 📄 inventory.routes.ts
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
│   │   │   │   └── 📁 layouts
│   │   │   │       ├── 📄 Card.tsx
│   │   │   │       ├── 📄 DashboardHeader.tsx
│   │   │   │       ├── 📄 RecentTransactions.tsx
│   │   │   │       └── 📄 Sidebar.tsx
│   │   │   └── 📁 client
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
│   │   │   ├── 📄 ThemeContext.tsx
│   │   │   └── 📄 ToastContext.tsx
│   │   ├── 📁 hooks
│   │   │   └── 📄 useTheme.ts
│   │   ├── 📁 pages
│   │   │   ├── 📁 admin
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
│   │   │   │   ├── 📄 dashboardApi.ts
│   │   │   │   ├── 📄 ordersClient.ts
│   │   │   │   └── 📄 postsClient.ts
│   │   │   └── 📄 http.ts
│   │   ├── 📁 types
│   │   │   ├── 📄 inventory.ts
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
