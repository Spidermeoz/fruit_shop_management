// src/config/di/container.ts

// ===== Sequelize models =====
import CartItemModel from "../../infrastructure/db/sequelize/models/CartItemModel";
import CartModel from "../../infrastructure/db/sequelize/models/CartModel";
import DeliveryStatusHistoryModel from "../../infrastructure/db/sequelize/models/DeliveryStatusHistoryModel";
import OrderAddressModel from "../../infrastructure/db/sequelize/models/OrderAddressModel";
import OrderItemModel from "../../infrastructure/db/sequelize/models/OrderItemModel";
import OrderModel from "../../infrastructure/db/sequelize/models/OrderModel";
import PaymentModel from "../../infrastructure/db/sequelize/models/PaymentModel";
import ProductCategoryModel from "../../infrastructure/db/sequelize/models/ProductCategoryModel";
import ProductModel from "../../infrastructure/db/sequelize/models/ProductModel";
import ProductOptionModel from "../../infrastructure/db/sequelize/models/ProductOptionModel";
import ProductOptionValueModel from "../../infrastructure/db/sequelize/models/ProductOptionValueModel";
import ProductReviewModel from "../../infrastructure/db/sequelize/models/ProductReviewModel";
import ProductVariantModel from "../../infrastructure/db/sequelize/models/ProductVariantModel";
import ProductVariantValueModel from "../../infrastructure/db/sequelize/models/ProductVariantValueModel";
import RoleModel from "../../infrastructure/db/sequelize/models/RoleModel";
import SettingGeneralModel from "../../infrastructure/db/sequelize/models/SettingGeneralModel";
import UserModel from "../../infrastructure/db/sequelize/models/UserModel";
import OriginModel from "../../infrastructure/db/sequelize/models/OriginModel";
import ProductTagModel from "../../infrastructure/db/sequelize/models/ProductTagModel";
import ProductTagMapModel from "../../infrastructure/db/sequelize/models/ProductTagMapModel";
import InventoryStockModel from "../../infrastructure/db/sequelize/models/InventoryStockModel";
import InventoryTransactionModel from "../../infrastructure/db/sequelize/models/InventoryTransactionModel";

// ===== Repositories =====
import { SequelizeCartRepository } from "../../infrastructure/repositories/SequelizeCartRepository";
import { SequelizeOrderRepository } from "../../infrastructure/repositories/SequelizeOrderRepository";
import { SequelizeProductCategoryRepository } from "../../infrastructure/repositories/SequelizeProductCategoryRepository";
import { SequelizeProductRepository } from "../../infrastructure/repositories/SequelizeProductRepository";
import { SequelizeReviewRepository } from "../../infrastructure/repositories/SequelizeReviewRepository";
import { SequelizeRoleRepository } from "../../infrastructure/repositories/SequelizeRoleRepository";
import { SequelizeSettingGeneralRepository } from "../../infrastructure/repositories/SequelizeSettingGeneralRepository";
import { SequelizeUserRepository } from "../../infrastructure/repositories/SequelizeUserRepository";
import { SequelizeOriginRepository } from "../../infrastructure/repositories/SequelizeOriginRepository";
import { SequelizeProductTagRepository } from "../../infrastructure/repositories/SequelizeProductTagRepository";
import { SequelizeInventoryRepository } from "../../infrastructure/repositories/SequelizeInventoryRepository";

// ===== Storage =====
import { CloudinaryStorage } from "../../infrastructure/storage/CloudinaryStorage";

// ===== Auth services =====
import { BcryptPasswordService } from "../../infrastructure/auth/BcryptPasswordService";
import { CryptoRefreshTokenService } from "../../infrastructure/auth/CryptoRefreshTokenService";
import { JwtTokenService } from "../../infrastructure/auth/JwtTokenService";

// ===== Product usecases =====
import { BulkEditProducts } from "../../application/products/usecases/BulkEditProducts";
import { BulkReorderProducts } from "../../application/products/usecases/BulkReorderProducts";
import { ChangeProductStatus } from "../../application/products/usecases/ChangeProductStatus";
import { CreateProduct } from "../../application/products/usecases/CreateProduct";
import { EditProduct } from "../../application/products/usecases/EditProduct";
import { GetProductDetail } from "../../application/products/usecases/GetProductDetail";
import { ListProducts } from "../../application/products/usecases/ListProducts";
import { SoftDeleteProduct } from "../../application/products/usecases/SoftDeleteProduct";
import { GetProductDetailBySlug } from "../../application/products/usecases/GetProductDetailBySlug";

// ===== Category usecases =====
import { BulkEditCategories } from "../../application/categories/usecases/BulkEditCategories";
import { ChangeCategoryStatus } from "../../application/categories/usecases/ChangeCategoryStatus";
import { CreateCategory } from "../../application/categories/usecases/CreateCategory";
import { EditCategory } from "../../application/categories/usecases/EditCategory";
import { GetCategoryDetail } from "../../application/categories/usecases/GetCategoryDetail";
import { ListCategories } from "../../application/categories/usecases/ListCategories";
import { ReorderCategoryPositions } from "../../application/categories/usecases/ReorderCategoryPositions";
import { SoftDeleteCategory } from "../../application/categories/usecases/SoftDeleteCategory";

// ===== Cart usecases =====
import { AddToCart } from "../../application/carts/usecases/AddToCart";
import { ListCartItems } from "../../application/carts/usecases/ListCartItems";
import { RemoveFromCart } from "../../application/carts/usecases/RemoveFromCart";
import { UpdateCartItem } from "../../application/carts/usecases/UpdateCartItem";
import { RemoveAllFromCart } from "../../application/carts";

// ===== Order usecases =====
import { AddDeliveryHistory } from "../../application/orders/admin/AddDeliveryHistory";
import { AddPayment } from "../../application/orders/admin/AddPayment";
import { GetOrderDetailAdmin } from "../../application/orders/admin/GetOrderDetailAdmin";
import { ListOrders } from "../../application/orders/admin/ListOrders";
import { UpdateOrderStatus } from "../../application/orders/admin/UpdateOrderStatus";
import { CancelMyOrder } from "../../application/orders/client/CancelMyOrder";
import { CreateOrderFromCart } from "../../application/orders/client/CreateOrderFromCart";
import { GetMyOrderDetail } from "../../application/orders/client/GetMyOrderDetail";
import { GetMyOrders } from "../../application/orders/client/GetMyOrders";
import { ListMyOrderAddresses } from "../../application/orders/client/ListMyOrderAddresses";

// ===== Review usecases =====
import { CheckReviewed } from "../../application/reviews/usecases/CheckReviewed";
import { CreateReview } from "../../application/reviews/usecases/CreateReview";
import { GetPendingReviewSummary } from "../../application/reviews/usecases/GetPendingReviewSummary";
import { ListMyReviews } from "../../application/reviews/usecases/ListMyReviews";
import { ListReviewsByProduct } from "../../application/reviews/usecases/ListReviewsByProduct";
import { ReplyReview } from "../../application/reviews/usecases/ReplyReview";

// ===== Setting usecases =====
import { GetGeneralSettings } from "../../application/settings/usecases/GetGeneralSettings";
import { UpdateGeneralSettings } from "../../application/settings/usecases/UpdateGeneralSettings";

// ===== Upload usecases =====
import { UploadImage } from "../../application/uploads/usecases/UploadImage";

// ===== Role usecases =====
import { CreateRole } from "../../application/roles/usecases/CreateRole";
import { GetRoleDetail } from "../../application/roles/usecases/GetRoleDetail";
import { GetRolePermissions } from "../../application/roles/usecases/GetRolePermissions";
import { ListRoles } from "../../application/roles/usecases/ListRoles";
import { ListRolesForPermissions } from "../../application/roles/usecases/ListRolesForPermissions";
import { SoftDeleteRole } from "../../application/roles/usecases/SoftDeleteRole";
import { UpdateRole } from "../../application/roles/usecases/UpdateRole";
import { UpdateRolePermissions } from "../../application/roles/usecases/UpdateRolePermissions";
import { UpdateRolePermissions as BulkUpdateRolePermissions } from "../../application/roles/usecases/UpdateRolePermissions";

// ===== User usecases =====
import { BulkEditUsers } from "../../application/users/usecases/BulkEditUsers";
import { CreateUser } from "../../application/users/usecases/CreateUser";
import { EditUser } from "../../application/users/usecases/EditUser";
import { GetUserDetail } from "../../application/users/usecases/GetUserDetail";
import { ListUsers } from "../../application/users/usecases/ListUsers";
import { SoftDeleteUser } from "../../application/users/usecases/SoftDeleteUser";
import { UpdateUserStatus } from "../../application/users/usecases/UpdateUserStatus";

// ===== Auth usecases =====
import { ChangePassword } from "../../application/auth/usecases/ChangePassword";
import { GetMe } from "../../application/auth/usecases/GetMe";
import { Login } from "../../application/auth/usecases/Login";
import { Logout } from "../../application/auth/usecases/Logout";
import { RefreshToken } from "../../application/auth/usecases/RefreshToken";
import { RegisterClient } from "../../application/auth/usecases/RegisterClient";
import { RequestPasswordReset } from "../../application/auth/usecases/RequestPasswordReset";
import { ResetPassword } from "../../application/auth/usecases/ResetPassword";
import { UpdateMyProfile } from "../../application/auth/usecases/UpdateMyProfile";
import { VerifyResetOtp } from "../../application/auth/usecases/VerifyResetOtp";

// ===== Origins usecases =====
import { ChangeOriginStatus } from "../../application/origins/usecases/ChangeOriginStatus";
import { CreateOrigin } from "../../application/origins/usecases/CreateOrigin";
import { EditOrigin } from "../../application/origins/usecases/EditOrigin";
import { GetOriginDetail } from "../../application/origins/usecases/GetOriginDetail";
import { ListOrigins } from "../../application/origins/usecases/ListOrigins";
import { SoftDeleteOrigin } from "../../application/origins/usecases/SoftDeleteOrigin";
import { BulkDeleteOrigins } from "../../application/origins/usecases/BulkDeleteOrigins";

// ===== Product tags usecases =====
import { ChangeProductTagStatus } from "../../application/product-tags/usecases/ChangeProductTagStatus";
import { CreateProductTag } from "../../application/product-tags/usecases/CreateProductTag";
import { EditProductTag } from "../../application/product-tags/usecases/EditProductTag";
import { GetProductTagDetail } from "../../application/product-tags/usecases/GetProductTagDetail";
import { ListProductTags } from "../../application/product-tags/usecases/ListProductTags";
import { DeleteProductTag } from "../../application/product-tags/usecases/DeleteProductTag";
import { BulkDeleteProductTags } from "../../application/product-tags/usecases/BulkDeleteProductTags";

// ===== Controllers =====
import { makeClientAuthController } from "../../interfaces/http/express/controllers/client/ClientAuthController";
import { makeClientCartController } from "../../interfaces/http/express/controllers/client/ClientCartController";
import type { ClientCartController } from "../../interfaces/http/express/controllers/client/ClientCartController";
import { makeClientCategoriesController } from "../../interfaces/http/express/controllers/client/ClientCategoriesController";
import { ClientForgotPasswordController } from "../../interfaces/http/express/controllers/client/ClientForgotPasswordController";
import { makeClientOrdersController } from "../../interfaces/http/express/controllers/client/ClientOrdersController";
import { makeClientProductsController } from "../../interfaces/http/express/controllers/client/ClientProductsController";
import type { ClientProductsController } from "../../interfaces/http/express/controllers/client/ClientProductsController";
import { ClientResetPasswordController } from "../../interfaces/http/express/controllers/client/ClientResetPasswordController";
import { makeClientReviewsController } from "../../interfaces/http/express/controllers/client/ClientReviewsController";
import { ClientVerifyOtpController } from "../../interfaces/http/express/controllers/client/ClientVerifyOtpController";

import {
  AdminReviewsController,
  makeAdminReviewsController,
} from "../../interfaces/http/express/controllers/AdminReviewsController";
import { makeAuthController } from "../../interfaces/http/express/controllers/AuthController";
import type { AuthController } from "../../interfaces/http/express/controllers/AuthController";
import {
  makeOrdersController,
  OrdersController,
} from "../../interfaces/http/express/controllers/OrdersController";
import { makeProductCategoriesController } from "../../interfaces/http/express/controllers/ProductCategoriesController";
import type { ProductCategoriesController } from "../../interfaces/http/express/controllers/ProductCategoriesController";
import { makeProductsController } from "../../interfaces/http/express/controllers/ProductsController";
import type { ProductsController } from "../../interfaces/http/express/controllers/ProductsController";
import { makeRolesController } from "../../interfaces/http/express/controllers/RolesController";
import type { RolesController } from "../../interfaces/http/express/controllers/RolesController";
import {
  makeSettingsGeneralController,
  SettingsGeneralController,
} from "../../interfaces/http/express/controllers/SettingsGeneralController";
import { makeUploadController } from "../../interfaces/http/express/controllers/UploadController";
import type { UploadController } from "../../interfaces/http/express/controllers/UploadController";
import { makeUsersController } from "../../interfaces/http/express/controllers/UsersController";
import type { UsersController } from "../../interfaces/http/express/controllers/UsersController";
import { makeOriginsController } from "../../interfaces/http/express/controllers/OriginsController";
import type { OriginsController } from "../../interfaces/http/express/controllers/OriginsController";
import { makeProductTagsController } from "../../interfaces/http/express/controllers/ProductTagsController";
import type { ProductTagsController } from "../../interfaces/http/express/controllers/ProductTagsController";

// ===== Export Auth services (cho main.ts / middlewares) =====
export const authServices = {
  token: new JwtTokenService(),
  refresh: new CryptoRefreshTokenService(),
  password: new BcryptPasswordService(),
} as const;

// ===== Associations =====

// Product -> Category
ProductModel.belongsTo(ProductCategoryModel, {
  as: "category",
  foreignKey: "product_category_id",
});
ProductCategoryModel.hasMany(ProductModel, {
  as: "products",
  foreignKey: "product_category_id",
});

// Product -> Origin
ProductModel.belongsTo(OriginModel, {
  as: "origin",
  foreignKey: "origin_id",
});
OriginModel.hasMany(ProductModel, {
  as: "products",
  foreignKey: "origin_id",
});

// Product <-> Product tags
ProductModel.belongsToMany(ProductTagModel, {
  through: ProductTagMapModel,
  as: "tags",
  foreignKey: "product_id",
  otherKey: "product_tag_id",
});
ProductTagModel.belongsToMany(ProductModel, {
  through: ProductTagMapModel,
  as: "products",
  foreignKey: "product_tag_id",
  otherKey: "product_id",
});

// User -> Role
UserModel.belongsTo(RoleModel, {
  as: "role",
  foreignKey: "role_id",
});
RoleModel.hasMany(UserModel, {
  as: "users",
  foreignKey: "role_id",
});

// User -> Cart
CartModel.belongsTo(UserModel, {
  as: "user",
  foreignKey: "user_id",
});
UserModel.hasOne(CartModel, {
  as: "cart",
  foreignKey: "user_id",
});

// Cart -> Cart items
CartModel.hasMany(CartItemModel, {
  as: "items",
  foreignKey: "cart_id",
});
CartItemModel.belongsTo(CartModel, {
  as: "cart",
  foreignKey: "cart_id",
});

// Cart item -> Product / Variant
CartItemModel.belongsTo(ProductModel, {
  as: "product",
  foreignKey: "product_id",
});
CartItemModel.belongsTo(ProductVariantModel, {
  as: "variant",
  foreignKey: "product_variant_id",
});

// Product -> Variants
ProductModel.hasMany(ProductVariantModel, {
  as: "variants",
  foreignKey: "product_id",
});
ProductVariantModel.belongsTo(ProductModel, {
  as: "product",
  foreignKey: "product_id",
});

// Product -> Options
ProductModel.hasMany(ProductOptionModel, {
  as: "options",
  foreignKey: "product_id",
});
ProductOptionModel.belongsTo(ProductModel, {
  as: "product",
  foreignKey: "product_id",
});

// Option -> Option values
ProductOptionModel.hasMany(ProductOptionValueModel, {
  as: "values",
  foreignKey: "product_option_id",
});
ProductOptionValueModel.belongsTo(ProductOptionModel, {
  as: "option",
  foreignKey: "product_option_id",
});

// Variant -> Variant values
ProductVariantModel.hasMany(ProductVariantValueModel, {
  as: "variantValues",
  foreignKey: "product_variant_id",
});
ProductVariantValueModel.belongsTo(ProductVariantModel, {
  as: "variant",
  foreignKey: "product_variant_id",
});

// Option value -> Variant values
ProductOptionValueModel.hasMany(ProductVariantValueModel, {
  as: "variantLinks",
  foreignKey: "product_option_value_id",
});
ProductVariantValueModel.belongsTo(ProductOptionValueModel, {
  as: "optionValue",
  foreignKey: "product_option_value_id",
});

// Order -> User
OrderModel.belongsTo(UserModel, {
  as: "user",
  foreignKey: "user_id",
});
UserModel.hasMany(OrderModel, {
  as: "orders",
  foreignKey: "user_id",
});

// Order -> Items
OrderModel.hasMany(OrderItemModel, {
  as: "items",
  foreignKey: "order_id",
});
OrderItemModel.belongsTo(OrderModel, {
  as: "order",
  foreignKey: "order_id",
});

// Order item -> Product / Variant
OrderItemModel.belongsTo(ProductModel, {
  as: "product",
  foreignKey: "product_id",
});
OrderItemModel.belongsTo(ProductVariantModel, {
  as: "variant",
  foreignKey: "product_variant_id",
});

// Inventory -> Variant
InventoryStockModel.belongsTo(ProductVariantModel, {
  as: "variant",
  foreignKey: "product_variant_id",
});
ProductVariantModel.hasOne(InventoryStockModel, {
  as: "inventoryStock",
  foreignKey: "product_variant_id",
});

InventoryTransactionModel.belongsTo(ProductVariantModel, {
  as: "variant",
  foreignKey: "product_variant_id",
});
ProductVariantModel.hasMany(InventoryTransactionModel, {
  as: "inventoryTransactions",
  foreignKey: "product_variant_id",
});

// Order -> Address
OrderModel.hasOne(OrderAddressModel, {
  as: "address",
  foreignKey: "order_id",
});
OrderAddressModel.belongsTo(OrderModel, {
  as: "order",
  foreignKey: "order_id",
});

// Order -> Payments
OrderModel.hasMany(PaymentModel, {
  as: "payments",
  foreignKey: "order_id",
});
PaymentModel.belongsTo(OrderModel, {
  as: "order",
  foreignKey: "order_id",
});

// Order -> Delivery history
OrderModel.hasMany(DeliveryStatusHistoryModel, {
  as: "deliveryHistory",
  foreignKey: "order_id",
});
DeliveryStatusHistoryModel.belongsTo(OrderModel, {
  as: "order",
  foreignKey: "order_id",
});

// Reviews
ProductReviewModel.belongsTo(ProductModel, {
  as: "product",
  foreignKey: "product_id",
});
ProductReviewModel.belongsTo(ProductVariantModel, {
  as: "variant",
  foreignKey: "product_variant_id",
});
ProductReviewModel.belongsTo(UserModel, {
  as: "user",
  foreignKey: "user_id",
});
ProductReviewModel.belongsTo(OrderModel, {
  as: "order",
  foreignKey: "order_id",
});
ProductReviewModel.belongsTo(ProductReviewModel, {
  as: "parent",
  foreignKey: "parent_id",
});
ProductReviewModel.hasMany(ProductReviewModel, {
  as: "replies",
  foreignKey: "parent_id",
});

// ===== Models & Repos =====
const productModels = {
  Product: ProductModel,
  ProductVariant: ProductVariantModel,
  ProductOption: ProductOptionModel,
  ProductOptionValue: ProductOptionValueModel,
  ProductVariantValue: ProductVariantValueModel,
  ProductCategory: ProductCategoryModel,
  Origin: OriginModel,
  ProductTag: ProductTagModel,
  ProductTagMap: ProductTagMapModel,
};
const productRepo = new SequelizeProductRepository(productModels);

const inventoryModels = {
  InventoryStock: InventoryStockModel,
  InventoryTransaction: InventoryTransactionModel,
  ProductVariant: ProductVariantModel,
  Product: ProductModel,
};
const inventoryRepo = new SequelizeInventoryRepository(inventoryModels);

// Category
const categoryModels = {
  ProductCategory: ProductCategoryModel,
};
const categoryRepo = new SequelizeProductCategoryRepository(categoryModels);

// Roles (export để dùng ở main.ts/middlewares)
const roleModels = {
  Role: RoleModel,
};
export const rolesRepo = new SequelizeRoleRepository(roleModels);

// Users (export để dùng ở main.ts/middlewares)
const userModels = {
  User: UserModel,
  Role: RoleModel,
};
export const userRepo = new SequelizeUserRepository(userModels);

// Cart
const cartModels = {
  Cart: CartModel,
  CartItem: CartItemModel,
  Product: ProductModel,
  ProductVariant: ProductVariantModel,
  InventoryStock: InventoryStockModel,
  ProductVariantValue: ProductVariantValueModel,
  ProductOptionValue: ProductOptionValueModel,
  ProductOption: ProductOptionModel,
};
const cartRepo = new SequelizeCartRepository(cartModels);

// Orders
const orderModels = {
  Order: OrderModel,
  OrderItem: OrderItemModel,
  OrderAddress: OrderAddressModel,
  Payment: PaymentModel,
  DeliveryStatusHistory: DeliveryStatusHistoryModel,
  Product: ProductModel,
  ProductVariant: ProductVariantModel,
};
const orderRepo = new SequelizeOrderRepository(orderModels);

// Reviews
const reviewModels = {
  ProductReview: ProductReviewModel,
  Product: ProductModel,
  ProductVariant: ProductVariantModel,
  Order: OrderModel,
  User: UserModel,
  OrderItem: OrderItemModel,
};
const reviewRepo = new SequelizeReviewRepository(reviewModels);

// Settings
const settingModels = {
  SettingGeneral: SettingGeneralModel,
};
const settingsRepo = new SequelizeSettingGeneralRepository(settingModels);
const originRepo = new SequelizeOriginRepository(OriginModel);
const productTagRepo = new SequelizeProductTagRepository(ProductTagModel);

// ===== Usecases =====
export const usecases = {
  products: {
    list: new ListProducts(productRepo),
    detail: new GetProductDetail(productRepo, inventoryRepo),
    detailBySlug: new GetProductDetailBySlug(productRepo, inventoryRepo),
    create: new CreateProduct(productRepo, inventoryRepo),
    edit: new EditProduct(productRepo, inventoryRepo),
    changeStatus: new ChangeProductStatus(productRepo),
    softDelete: new SoftDeleteProduct(productRepo),
    bulkEdit: new BulkEditProducts(productRepo),
    reorder: new BulkReorderProducts(productRepo),
  },

  upload: {
    upload: new UploadImage(new CloudinaryStorage()),
  },

  categories: {
    list: new ListCategories(categoryRepo),
    detail: new GetCategoryDetail(categoryRepo),
    create: new CreateCategory(categoryRepo),
    edit: new EditCategory(categoryRepo),
    changeStatus: new ChangeCategoryStatus(categoryRepo),
    softDelete: new SoftDeleteCategory(categoryRepo),
    bulkEdit: new BulkEditCategories(categoryRepo),
    reorder: new ReorderCategoryPositions(categoryRepo),
  },

  roles: {
    list: new ListRoles(rolesRepo),
    detail: new GetRoleDetail(rolesRepo),
    create: new CreateRole(rolesRepo),
    update: new UpdateRole(rolesRepo),
    softDelete: new SoftDeleteRole(rolesRepo),
    getPermissions: new GetRolePermissions(rolesRepo),
    updatePermissions: new UpdateRolePermissions(rolesRepo),
    listForPermissions: new ListRolesForPermissions(rolesRepo),
    bulkUpdatePermissions: new BulkUpdateRolePermissions(rolesRepo),
  },

  users: {
    list: new ListUsers(userRepo),
    detail: new GetUserDetail(userRepo),
    create: new CreateUser(userRepo),
    edit: new EditUser(userRepo),
    updateStatus: new UpdateUserStatus(userRepo),
    softDelete: new SoftDeleteUser(userRepo),
    bulkEdit: new BulkEditUsers(userRepo),
  },

  auth: {
    login: new Login(
      userRepo,
      rolesRepo,
      authServices.token,
      authServices.refresh,
      authServices.password,
    ),
    logout: new Logout(userRepo),
    refresh: new RefreshToken(
      userRepo,
      authServices.token,
      authServices.refresh,
    ),
    me: new GetMe(userRepo, rolesRepo),
    requestPasswordReset: new RequestPasswordReset(),
    verifyResetOtp: new VerifyResetOtp(),
    resetPassword: new ResetPassword(authServices.password),
    changePassword: new ChangePassword(userRepo, authServices.password),
    updateMyProfile: new UpdateMyProfile(userRepo),
  },

  authServices,

  carts: {
    addToCart: new AddToCart(cartRepo, productRepo, inventoryRepo),
    listItems: new ListCartItems(cartRepo),
    updateItem: new UpdateCartItem(cartRepo, productRepo, inventoryRepo),
    removeItem: new RemoveFromCart(cartRepo),
    removeAllItems: new RemoveAllFromCart(cartRepo),
  },

  orders: {
    createFromCart: new CreateOrderFromCart(
      orderRepo,
      cartRepo,
      productRepo,
      inventoryRepo,
    ),
    myOrders: new GetMyOrders(orderRepo),
    myOrderDetail: new GetMyOrderDetail(orderRepo),
    cancelMyOrder: new CancelMyOrder(orderRepo, inventoryRepo),

    list: new ListOrders(orderRepo),
    detail: new GetOrderDetailAdmin(orderRepo),
    updateStatus: new UpdateOrderStatus(orderRepo, inventoryRepo),
    addDeliveryStatus: new AddDeliveryHistory(orderRepo),
    addPayment: new AddPayment(orderRepo),
    listMyOrderAddresses: new ListMyOrderAddresses(orderRepo),
  },

  reviews: {
    create: new CreateReview(reviewRepo),
    reply: new ReplyReview(reviewRepo),
    listByProduct: new ListReviewsByProduct(reviewRepo),
    listMine: new ListMyReviews(reviewRepo),
    checkReviewed: new CheckReviewed(reviewRepo),
    getPendingReviewSummary: new GetPendingReviewSummary(reviewRepo),
  },

  settings: {
    get: new GetGeneralSettings(settingsRepo),
    update: new UpdateGeneralSettings(settingsRepo),
  },

  origins: {
    list: new ListOrigins(originRepo),
    detail: new GetOriginDetail(originRepo),
    create: new CreateOrigin(originRepo),
    edit: new EditOrigin(originRepo),
    changeStatus: new ChangeOriginStatus(originRepo),
    softDelete: new SoftDeleteOrigin(originRepo),
    bulkDelete: new BulkDeleteOrigins(originRepo),
  },

  productTags: {
    list: new ListProductTags(productTagRepo),
    detail: new GetProductTagDetail(productTagRepo),
    create: new CreateProductTag(productTagRepo),
    edit: new EditProductTag(productTagRepo),
    deleteTag: new DeleteProductTag(productTagRepo),
    bulkDelete: new BulkDeleteProductTags(productTagRepo),
  },
};

// ===== Controllers =====
type Controllers = {
  products: ProductsController;
  upload: UploadController;
  categories: ProductCategoriesController;
  roles: RolesController;
  users: UsersController;
  auth: AuthController;
  orders: OrdersController;
  reviews: AdminReviewsController;
  settings: SettingsGeneralController;
  origins: OriginsController;
  productTags: ProductTagsController;
};

export const controllers: Controllers = {
  products: makeProductsController({
    list: usecases.products.list,
    detail: usecases.products.detail,
    create: usecases.products.create,
    edit: usecases.products.edit,
    changeStatus: usecases.products.changeStatus,
    softDelete: usecases.products.softDelete,
    bulkEdit: usecases.products.bulkEdit,
    reorder: usecases.products.reorder,
  }),

  upload: makeUploadController({
    upload: usecases.upload.upload,
  }),

  categories: makeProductCategoriesController({
    list: usecases.categories.list,
    detail: usecases.categories.detail,
    create: usecases.categories.create,
    edit: usecases.categories.edit,
    changeStatus: usecases.categories.changeStatus,
    softDelete: usecases.categories.softDelete,
    bulkEdit: usecases.categories.bulkEdit,
    reorder: usecases.categories.reorder,
  }),

  roles: makeRolesController({
    list: usecases.roles.list,
    detail: usecases.roles.detail,
    create: usecases.roles.create,
    update: usecases.roles.update,
    softDelete: usecases.roles.softDelete,
    getPermissions: usecases.roles.getPermissions,
    updatePermissions: usecases.roles.updatePermissions,
    listForPermissions: usecases.roles.listForPermissions,
    bulkUpdatePermissions: usecases.roles.bulkUpdatePermissions,
  }),

  users: makeUsersController({
    list: usecases.users.list,
    detail: usecases.users.detail,
    create: usecases.users.create,
    edit: usecases.users.edit,
    updateStatus: usecases.users.updateStatus,
    softDelete: usecases.users.softDelete,
    bulkEdit: usecases.users.bulkEdit,
  }),

  auth: makeAuthController({
    login: usecases.auth.login,
    logout: usecases.auth.logout,
    refresh: usecases.auth.refresh,
    me: usecases.auth.me,
  }),

  orders: makeOrdersController({
    list: usecases.orders.list,
    detail: usecases.orders.detail,
    updateStatus: usecases.orders.updateStatus,
    addDeliveryStatus: usecases.orders.addDeliveryStatus,
    addPayment: usecases.orders.addPayment,
  }),

  reviews: makeAdminReviewsController({
    replyReview: usecases.reviews.reply,
    listByProduct: usecases.reviews.listByProduct,
    getPendingReviewSummary: usecases.reviews.getPendingReviewSummary,
  }),

  settings: makeSettingsGeneralController({
    get: usecases.settings.get,
    update: usecases.settings.update,
    upload: usecases.upload.upload,
  }),

  origins: makeOriginsController(usecases.origins),

  productTags: makeProductTagsController({
    list: usecases.productTags.list,
    detail: usecases.productTags.detail,
    create: usecases.productTags.create,
    edit: usecases.productTags.edit,
    deleteTag: usecases.productTags.deleteTag,
    bulkDelete: usecases.productTags.bulkDelete,
  }),
};

export const clientControllers = {
  products: makeClientProductsController({
    list: usecases.products.list,
    detail: usecases.products.detail,
    detailBySlug: usecases.products.detailBySlug,
  }),

  categories: makeClientCategoriesController({
    list: usecases.categories.list,
  }),

  auth: makeClientAuthController({
    register: new RegisterClient(
      userRepo,
      authServices.password,
      authServices.token,
      authServices.refresh,
    ),
    login: usecases.auth.login,
    logout: usecases.auth.logout,
    me: usecases.auth.me,
    refresh: usecases.auth.refresh,
    changePassword: usecases.auth.changePassword,
    updateMyProfile: usecases.auth.updateMyProfile,
  }),

  forgotPassword: new ClientForgotPasswordController({
    requestPasswordReset: usecases.auth.requestPasswordReset,
  }),

  verifyOtp: new ClientVerifyOtpController({
    verifyOtp: usecases.auth.verifyResetOtp,
  }),

  resetPassword: new ClientResetPasswordController({
    resetPassword: usecases.auth.resetPassword,
  }),

  cart: makeClientCartController({
    addToCart: usecases.carts.addToCart,
    listItems: usecases.carts.listItems,
    updateItem: usecases.carts.updateItem,
    removeItem: usecases.carts.removeItem,
    removeAllItems: usecases.carts.removeAllItems,
  }),

  orders: makeClientOrdersController({
    createFromCart: usecases.orders.createFromCart,
    myOrders: usecases.orders.myOrders,
    myOrderDetail: usecases.orders.myOrderDetail,
    cancelMyOrder: usecases.orders.cancelMyOrder,
    listMyOrderAddresses: usecases.orders.listMyOrderAddresses,
  }),

  reviews: makeClientReviewsController({
    createReview: usecases.reviews.create,
    listByProduct: usecases.reviews.listByProduct,
    listMyReviews: usecases.reviews.listMine,
    checkReviewed: usecases.reviews.checkReviewed,
  }),

  clientSettings: makeSettingsGeneralController({
    get: usecases.settings.get,
    update: usecases.settings.update,
    upload: usecases.upload.upload,
  }),
} as const;
