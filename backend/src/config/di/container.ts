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
import BranchModel from "../../infrastructure/db/sequelize/models/BranchModel"; // Added Branch
import UserBranchModel from "../../infrastructure/db/sequelize/models/UserBranchModel"; // Added UserBranch
import OriginModel from "../../infrastructure/db/sequelize/models/OriginModel";
import ProductTagModel from "../../infrastructure/db/sequelize/models/ProductTagModel";
import ProductTagMapModel from "../../infrastructure/db/sequelize/models/ProductTagMapModel";
import InventoryStockModel from "../../infrastructure/db/sequelize/models/InventoryStockModel";
import InventoryTransactionModel from "../../infrastructure/db/sequelize/models/InventoryTransactionModel";
import ProductTagGroupModel from "../../infrastructure/db/sequelize/models/ProductTagGroupModel";
import ShippingZoneModel from "../../infrastructure/db/sequelize/models/ShippingZoneModel";
import BranchServiceAreaModel from "../../infrastructure/db/sequelize/models/BranchServiceAreaModel";
import DeliveryTimeSlotModel from "../../infrastructure/db/sequelize/models/DeliveryTimeSlotModel";
import BranchDeliveryTimeSlotModel from "../../infrastructure/db/sequelize/models/BranchDeliveryTimeSlotModel";
import BranchDeliverySlotCapacityModel from "../../infrastructure/db/sequelize/models/BranchDeliverySlotCapacityModel";

// ===== Repositories =====
import { SequelizeCartRepository } from "../../infrastructure/repositories/SequelizeCartRepository";
import { SequelizeOrderRepository } from "../../infrastructure/repositories/SequelizeOrderRepository";
import { SequelizeProductCategoryRepository } from "../../infrastructure/repositories/SequelizeProductCategoryRepository";
import { SequelizeProductRepository } from "../../infrastructure/repositories/SequelizeProductRepository";
import { SequelizeReviewRepository } from "../../infrastructure/repositories/SequelizeReviewRepository";
import { SequelizeRoleRepository } from "../../infrastructure/repositories/SequelizeRoleRepository";
import { SequelizeSettingGeneralRepository } from "../../infrastructure/repositories/SequelizeSettingGeneralRepository";
import { SequelizeUserRepository } from "../../infrastructure/repositories/SequelizeUserRepository";
import { SequelizeBranchRepository } from "../../infrastructure/repositories/SequelizeBranchRepository"; // Added Branch Repo
import { SequelizeOriginRepository } from "../../infrastructure/repositories/SequelizeOriginRepository";
import { SequelizeProductTagRepository } from "../../infrastructure/repositories/SequelizeProductTagRepository";
import { SequelizeInventoryRepository } from "../../infrastructure/repositories/SequelizeInventoryRepository";
import { SequelizeProductTagGroupRepository } from "../../infrastructure/repositories/SequelizeProductTagGroupRepository";
import { SequelizeShippingZoneRepository } from "../../infrastructure/repositories/SequelizeShippingZoneRepository";
import { SequelizeDeliveryTimeSlotRepository } from "../../infrastructure/repositories/SequelizeDeliveryTimeSlotRepository";
import { SequelizeBranchServiceAreaRepository } from "../../infrastructure/repositories/SequelizeBranchServiceAreaRepository";
import { SequelizeBranchDeliveryTimeSlotRepository } from "../../infrastructure/repositories/SequelizeBranchDeliveryTimeSlotRepository";
import { SequelizeBranchDeliverySlotCapacityRepository } from "../../infrastructure/repositories/SequelizeBranchDeliverySlotCapacityRepository";

import sequelize from "../../infrastructure/db/sequelize";

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
import { GetCheckoutQuote } from "../../application/orders/client/GetCheckoutQuote";
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

// ===== Branch usecases =====
import { CreateBranch } from "../../application/branches/usecases/CreateBranch";
import { ListBranches } from "../../application/branches/usecases/ListBranches";
import { GetBranchDetail } from "../../application/branches/usecases/GetBranchDetail";
import { EditBranch } from "../../application/branches/usecases/EditBranch";
import { ChangeBranchStatus } from "../../application/branches/usecases/ChangeBranchStatus";
import { SoftDeleteBranch } from "../../application/branches/usecases/SoftDeleteBranch";

// ===== Inventory usecases =====
import { SetInventoryStock } from "../../application/inventory/usecases/SetInventoryStock";
import { ListInventoryStocks } from "../../application/inventory/usecases/ListInventoryStocks";
import { TransferInventoryStock } from "../../application/inventory/usecases/TransferInventoryStock";
import { ListInventoryTransactions } from "../../application/inventory/usecases/ListInventoryTransactions";

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

// ===== Product tag groups usecases =====
import { ListProductTagGroups } from "../../application/product-tag-groups/usecases/ListProductTagGroups";
import { CreateProductTagGroup } from "../../application/product-tag-groups/usecases/CreateProductTagGroup";
import { EditProductTagGroup } from "../../application/product-tag-groups/usecases/EditProductTagGroup";
import { DeleteProductTagGroup } from "../../application/product-tag-groups/usecases/DeleteProductTagGroup";

// ===== Shipping services =====
import { ResolveShippingZoneService } from "../../application/shipping/services/ResolveShippingZoneService";
import { GetAvailableDeliverySlotsService } from "../../application/shipping/services/GetAvailableDeliverySlotsService";
import { CalculateShippingQuoteService } from "../../application/shipping/services/CalculateShippingQuoteService";

// ===== Shipping zone usecases =====
import { ListShippingZones } from "../../application/shipping/usecases/ListShippingZones";
import { GetShippingZoneDetail } from "../../application/shipping/usecases/GetShippingZoneDetail";
import { CreateShippingZone } from "../../application/shipping/usecases/CreateShippingZone";
import { EditShippingZone } from "../../application/shipping/usecases/EditShippingZone";
import { ChangeShippingZoneStatus } from "../../application/shipping/usecases/ChangeShippingZoneStatus";
import { SoftDeleteShippingZone } from "../../application/shipping/usecases/SoftDeleteShippingZone";

// ===== Branch service area usecases =====
import { ListBranchServiceAreas } from "../../application/shipping/usecases/ListBranchServiceAreas";
import { GetBranchServiceAreaDetail } from "../../application/shipping/usecases/GetBranchServiceAreaDetail";
import { CreateBranchServiceArea } from "../../application/shipping/usecases/CreateBranchServiceArea";
import { EditBranchServiceArea } from "../../application/shipping/usecases/EditBranchServiceArea";
import { ChangeBranchServiceAreaStatus } from "../../application/shipping/usecases/ChangeBranchServiceAreaStatus";
import { SoftDeleteBranchServiceArea } from "../../application/shipping/usecases/SoftDeleteBranchServiceArea";

// ===== Delivery time slot usecases =====
import { ListDeliveryTimeSlots } from "../../application/shipping/usecases/ListDeliveryTimeSlots";
import { GetDeliveryTimeSlotDetail } from "../../application/shipping/usecases/GetDeliveryTimeSlotDetail";
import { CreateDeliveryTimeSlot } from "../../application/shipping/usecases/CreateDeliveryTimeSlot";
import { EditDeliveryTimeSlot } from "../../application/shipping/usecases/EditDeliveryTimeSlot";
import { ChangeDeliveryTimeSlotStatus } from "../../application/shipping/usecases/ChangeDeliveryTimeSlotStatus";
import { SoftDeleteDeliveryTimeSlot } from "../../application/shipping/usecases/SoftDeleteDeliveryTimeSlot";

// ===== Branch delivery time slot usecases =====
import { ListBranchDeliveryTimeSlots } from "../../application/shipping/usecases/ListBranchDeliveryTimeSlots";
import { GetBranchDeliveryTimeSlotDetail } from "../../application/shipping/usecases/GetBranchDeliveryTimeSlotDetail";
import { CreateBranchDeliveryTimeSlot } from "../../application/shipping/usecases/CreateBranchDeliveryTimeSlot";
import { EditBranchDeliveryTimeSlot } from "../../application/shipping/usecases/EditBranchDeliveryTimeSlot";
import { ChangeBranchDeliveryTimeSlotStatus } from "../../application/shipping/usecases/ChangeBranchDeliveryTimeSlotStatus";
import { SoftDeleteBranchDeliveryTimeSlot } from "../../application/shipping/usecases/SoftDeleteBranchDeliveryTimeSlot";

// ===== Branch delivery slot capacity usecases =====
import { ListBranchDeliverySlotCapacities } from "../../application/shipping/usecases/ListBranchDeliverySlotCapacities";
import { GetBranchDeliverySlotCapacityDetail } from "../../application/shipping/usecases/GetBranchDeliverySlotCapacityDetail";
import { CreateBranchDeliverySlotCapacity } from "../../application/shipping/usecases/CreateBranchDeliverySlotCapacity";
import { EditBranchDeliverySlotCapacity } from "../../application/shipping/usecases/EditBranchDeliverySlotCapacity";
import { ChangeBranchDeliverySlotCapacityStatus } from "../../application/shipping/usecases/ChangeBranchDeliverySlotCapacityStatus";
import { SoftDeleteBranchDeliverySlotCapacity } from "../../application/shipping/usecases/SoftDeleteBranchDeliverySlotCapacity";

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
import { makeProductTagGroupsController } from "../../interfaces/http/express/controllers/ProductTagGroupsController";
import type { ProductTagGroupsController } from "../../interfaces/http/express/controllers/ProductTagGroupsController";
import { makeBranchesController } from "../../interfaces/http/express/controllers/BranchesController";
import type { BranchesController } from "../../interfaces/http/express/controllers/BranchesController";
import { makeInventoryController } from "../../interfaces/http/express/controllers/InventoryController";
import type { InventoryController } from "../../interfaces/http/express/controllers/InventoryController";
import { makeShippingZonesController } from "../../interfaces/http/express/controllers/ShippingZonesController";
import type { ShippingZonesController } from "../../interfaces/http/express/controllers/ShippingZonesController";
import { makeBranchServiceAreasController } from "../../interfaces/http/express/controllers/BranchServiceAreasController";
import type { BranchServiceAreasController } from "../../interfaces/http/express/controllers/BranchServiceAreasController";
import { makeDeliveryTimeSlotsController } from "../../interfaces/http/express/controllers/DeliveryTimeSlotsController";
import type { DeliveryTimeSlotsController } from "../../interfaces/http/express/controllers/DeliveryTimeSlotsController";
import { makeBranchDeliveryTimeSlotsController } from "../../interfaces/http/express/controllers/BranchDeliveryTimeSlotsController";
import type { BranchDeliveryTimeSlotsController } from "../../interfaces/http/express/controllers/BranchDeliveryTimeSlotsController";
import { makeBranchDeliverySlotCapacitiesController } from "../../interfaces/http/express/controllers/BranchDeliverySlotCapacitiesController";
import type { BranchDeliverySlotCapacitiesController } from "../../interfaces/http/express/controllers/BranchDeliverySlotCapacitiesController";

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

// User <-> UserBranch <-> Branch
UserModel.hasMany(UserBranchModel, {
  as: "userBranches",
  foreignKey: "user_id",
});
UserBranchModel.belongsTo(UserModel, {
  as: "user",
  foreignKey: "user_id",
});
BranchModel.hasMany(UserBranchModel, {
  as: "userBranches",
  foreignKey: "branch_id",
});
UserBranchModel.belongsTo(BranchModel, {
  as: "branch",
  foreignKey: "branch_id",
});
UserModel.belongsToMany(BranchModel, {
  through: UserBranchModel,
  as: "branches",
  foreignKey: "user_id",
  otherKey: "branch_id",
});
BranchModel.belongsToMany(UserModel, {
  through: UserBranchModel,
  as: "users",
  foreignKey: "branch_id",
  otherKey: "user_id",
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

// Order -> Branch
OrderModel.belongsTo(BranchModel, {
  as: "branch",
  foreignKey: "branch_id",
});
BranchModel.hasMany(OrderModel, {
  as: "orders",
  foreignKey: "branch_id",
});

// Shipping zone -> Branch service areas
ShippingZoneModel.hasMany(BranchServiceAreaModel, {
  as: "branchServiceAreas",
  foreignKey: "shipping_zone_id",
});
BranchServiceAreaModel.belongsTo(ShippingZoneModel, {
  as: "shippingZone",
  foreignKey: "shipping_zone_id",
});

// Branch -> Branch service areas
BranchModel.hasMany(BranchServiceAreaModel, {
  as: "serviceAreas",
  foreignKey: "branch_id",
});
BranchServiceAreaModel.belongsTo(BranchModel, {
  as: "branch",
  foreignKey: "branch_id",
});

// Delivery time slot -> Branch delivery time slots
DeliveryTimeSlotModel.hasMany(BranchDeliveryTimeSlotModel, {
  as: "branchSlots",
  foreignKey: "delivery_time_slot_id",
});
BranchDeliveryTimeSlotModel.belongsTo(DeliveryTimeSlotModel, {
  as: "deliveryTimeSlot",
  foreignKey: "delivery_time_slot_id",
});

// Branch -> Branch delivery time slots
BranchModel.hasMany(BranchDeliveryTimeSlotModel, {
  as: "deliveryTimeSlots",
  foreignKey: "branch_id",
});
BranchDeliveryTimeSlotModel.belongsTo(BranchModel, {
  as: "branch",
  foreignKey: "branch_id",
});

// Delivery time slot -> Branch delivery slot capacities
DeliveryTimeSlotModel.hasMany(BranchDeliverySlotCapacityModel, {
  as: "slotCapacities",
  foreignKey: "delivery_time_slot_id",
});
BranchDeliverySlotCapacityModel.belongsTo(DeliveryTimeSlotModel, {
  as: "deliveryTimeSlot",
  foreignKey: "delivery_time_slot_id",
});

// Branch -> Branch delivery slot capacities
BranchModel.hasMany(BranchDeliverySlotCapacityModel, {
  as: "deliverySlotCapacities",
  foreignKey: "branch_id",
});
BranchDeliverySlotCapacityModel.belongsTo(BranchModel, {
  as: "branch",
  foreignKey: "branch_id",
});

// Order -> Delivery time slot
OrderModel.belongsTo(DeliveryTimeSlotModel, {
  as: "deliveryTimeSlot",
  foreignKey: "delivery_time_slot_id",
});
DeliveryTimeSlotModel.hasMany(OrderModel, {
  as: "orders",
  foreignKey: "delivery_time_slot_id",
});

// Order -> Shipping zone
OrderModel.belongsTo(ShippingZoneModel, {
  as: "shippingZone",
  foreignKey: "shipping_zone_id",
});
ShippingZoneModel.hasMany(OrderModel, {
  as: "orders",
  foreignKey: "shipping_zone_id",
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

// Inventory -> Variant (Branch-aware: hasMany thay vì hasOne)
InventoryStockModel.belongsTo(ProductVariantModel, {
  as: "productVariant",
  foreignKey: "product_variant_id",
});
ProductVariantModel.hasMany(InventoryStockModel, {
  as: "inventoryStocks",
  foreignKey: "product_variant_id",
});

InventoryTransactionModel.belongsTo(ProductVariantModel, {
  as: "productVariant",
  foreignKey: "product_variant_id",
});
ProductVariantModel.hasMany(InventoryTransactionModel, {
  as: "inventoryTransactions",
  foreignKey: "product_variant_id",
});

// Branch -> InventoryStock
InventoryStockModel.belongsTo(BranchModel, {
  as: "branch",
  foreignKey: "branch_id",
});
BranchModel.hasMany(InventoryStockModel, {
  as: "inventoryStocks",
  foreignKey: "branch_id",
});

// Branch -> InventoryTransaction
InventoryTransactionModel.belongsTo(BranchModel, {
  as: "branch",
  foreignKey: "branch_id",
});
BranchModel.hasMany(InventoryTransactionModel, {
  as: "inventoryTransactions",
  foreignKey: "branch_id",
});

// User -> InventoryTransaction (Người tạo transaction)
InventoryTransactionModel.belongsTo(UserModel, {
  as: "createdBy",
  foreignKey: "created_by_id",
});
UserModel.hasMany(InventoryTransactionModel, {
  as: "createdInventoryTransactions",
  foreignKey: "created_by_id",
});

ProductTagGroupModel.hasMany(ProductTagModel, {
  foreignKey: "product_tag_group_id",
  as: "tags",
});

ProductTagModel.belongsTo(ProductTagGroupModel, {
  foreignKey: "product_tag_group_id",
  as: "group",
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
  ProductTagGroup: ProductTagGroupModel,
  ProductTagMap: ProductTagMapModel,
  InventoryStock: InventoryStockModel,
};
const productRepo = new SequelizeProductRepository(productModels);

const inventoryModels = {
  InventoryStock: InventoryStockModel,
  InventoryTransaction: InventoryTransactionModel,
  ProductVariant: ProductVariantModel,
  Product: ProductModel,
  Branch: BranchModel, // Added Branch
};
const inventoryRepo = new SequelizeInventoryRepository(inventoryModels);

// Category
const categoryModels = {
  ProductCategory: ProductCategoryModel,
};
const categoryRepo = new SequelizeProductCategoryRepository(categoryModels);

// Branch
const branchModels = {
  Branch: BranchModel,
};
const branchRepo = new SequelizeBranchRepository(branchModels);

// Roles (export để dùng ở main.ts/middlewares)
const roleModels = {
  Role: RoleModel,
};
export const rolesRepo = new SequelizeRoleRepository(roleModels);

// Users (export để dùng ở main.ts/middlewares)
const userModels = {
  User: UserModel,
  Role: RoleModel,
  UserBranch: UserBranchModel, // Added UserBranch
  Branch: BranchModel, // Added Branch
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

const shippingZoneModels = {
  ShippingZone: ShippingZoneModel,
  BranchServiceArea: BranchServiceAreaModel,
};
const shippingZoneRepo = new SequelizeShippingZoneRepository(
  shippingZoneModels,
);

const branchServiceAreaModels = {
  BranchServiceArea: BranchServiceAreaModel,
  Branch: BranchModel,
  ShippingZone: ShippingZoneModel,
};
const branchServiceAreaRepo = new SequelizeBranchServiceAreaRepository(
  branchServiceAreaModels,
);

const deliveryTimeSlotModels = {
  DeliveryTimeSlot: DeliveryTimeSlotModel,
  BranchDeliveryTimeSlot: BranchDeliveryTimeSlotModel,
  BranchDeliverySlotCapacity: BranchDeliverySlotCapacityModel,
};
const deliveryTimeSlotRepo = new SequelizeDeliveryTimeSlotRepository(
  deliveryTimeSlotModels,
);

const branchDeliveryTimeSlotModels = {
  BranchDeliveryTimeSlot: BranchDeliveryTimeSlotModel,
  Branch: BranchModel,
  DeliveryTimeSlot: DeliveryTimeSlotModel,
};

const branchDeliveryTimeSlotRepo =
  new SequelizeBranchDeliveryTimeSlotRepository(branchDeliveryTimeSlotModels);

const branchDeliverySlotCapacityModels = {
  BranchDeliverySlotCapacity: BranchDeliverySlotCapacityModel,
  Branch: BranchModel,
  DeliveryTimeSlot: DeliveryTimeSlotModel,
};

const branchDeliverySlotCapacityRepo =
  new SequelizeBranchDeliverySlotCapacityRepository(
    branchDeliverySlotCapacityModels,
  );

const resolveShippingZoneService = new ResolveShippingZoneService(
  shippingZoneRepo,
);

const getAvailableDeliverySlotsService = new GetAvailableDeliverySlotsService(
  deliveryTimeSlotRepo,
);

const calculateShippingQuoteService = new CalculateShippingQuoteService(
  cartRepo,
  branchRepo,
  shippingZoneRepo,
  resolveShippingZoneService,
  getAvailableDeliverySlotsService,
);

// Orders
const orderModels = {
  Order: OrderModel,
  OrderItem: OrderItemModel,
  OrderAddress: OrderAddressModel,
  Payment: PaymentModel,
  DeliveryStatusHistory: DeliveryStatusHistoryModel,
  Product: ProductModel,
  ProductVariant: ProductVariantModel,
  Branch: BranchModel,
  DeliveryTimeSlot: DeliveryTimeSlotModel,
  ShippingZone: ShippingZoneModel,
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

const productTagGroupRepo = new SequelizeProductTagGroupRepository(
  ProductTagGroupModel,
  ProductTagModel,
);

// ===== Usecases =====
export const usecases = {
  products: {
    list: new ListProducts(productRepo),
    detail: new GetProductDetail(productRepo, inventoryRepo),
    detailBySlug: new GetProductDetailBySlug(productRepo, inventoryRepo),
    create: new CreateProduct(
      productRepo,
      inventoryRepo,
      productTagRepo,
      branchRepo,
    ),
    edit: new EditProduct(
      productRepo,
      productTagRepo,
      inventoryRepo,
      branchRepo,
    ),
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

  branches: {
    list: new ListBranches(branchRepo),
    detail: new GetBranchDetail(branchRepo),
    create: new CreateBranch(branchRepo),
    edit: new EditBranch(branchRepo),
    changeStatus: new ChangeBranchStatus(branchRepo),
    softDelete: new SoftDeleteBranch(branchRepo),
  },

  shippingZones: {
    list: new ListShippingZones(shippingZoneRepo),
    detail: new GetShippingZoneDetail(shippingZoneRepo),
    create: new CreateShippingZone(shippingZoneRepo),
    edit: new EditShippingZone(shippingZoneRepo),
    changeStatus: new ChangeShippingZoneStatus(shippingZoneRepo),
    softDelete: new SoftDeleteShippingZone(shippingZoneRepo),
  },

  branchServiceAreas: {
    list: new ListBranchServiceAreas(branchServiceAreaRepo),
    detail: new GetBranchServiceAreaDetail(branchServiceAreaRepo),
    create: new CreateBranchServiceArea(
      branchServiceAreaRepo,
      branchRepo,
      shippingZoneRepo,
    ),
    edit: new EditBranchServiceArea(
      branchServiceAreaRepo,
      branchRepo,
      shippingZoneRepo,
    ),
    changeStatus: new ChangeBranchServiceAreaStatus(branchServiceAreaRepo),
    softDelete: new SoftDeleteBranchServiceArea(branchServiceAreaRepo),
  },

  deliveryTimeSlots: {
    list: new ListDeliveryTimeSlots(deliveryTimeSlotRepo),
    detail: new GetDeliveryTimeSlotDetail(deliveryTimeSlotRepo),
    create: new CreateDeliveryTimeSlot(deliveryTimeSlotRepo),
    edit: new EditDeliveryTimeSlot(deliveryTimeSlotRepo),
    changeStatus: new ChangeDeliveryTimeSlotStatus(deliveryTimeSlotRepo),
    softDelete: new SoftDeleteDeliveryTimeSlot(deliveryTimeSlotRepo),
  },

  branchDeliveryTimeSlots: {
    list: new ListBranchDeliveryTimeSlots(branchDeliveryTimeSlotRepo),
    detail: new GetBranchDeliveryTimeSlotDetail(branchDeliveryTimeSlotRepo),
    create: new CreateBranchDeliveryTimeSlot(
      branchDeliveryTimeSlotRepo,
      branchRepo,
      deliveryTimeSlotRepo,
    ),
    edit: new EditBranchDeliveryTimeSlot(
      branchDeliveryTimeSlotRepo,
      branchRepo,
      deliveryTimeSlotRepo,
    ),
    changeStatus: new ChangeBranchDeliveryTimeSlotStatus(
      branchDeliveryTimeSlotRepo,
    ),
    softDelete: new SoftDeleteBranchDeliveryTimeSlot(
      branchDeliveryTimeSlotRepo,
    ),
  },

  branchDeliverySlotCapacities: {
    list: new ListBranchDeliverySlotCapacities(branchDeliverySlotCapacityRepo),
    detail: new GetBranchDeliverySlotCapacityDetail(
      branchDeliverySlotCapacityRepo,
    ),
    create: new CreateBranchDeliverySlotCapacity(
      branchDeliverySlotCapacityRepo,
    ),
    edit: new EditBranchDeliverySlotCapacity(branchDeliverySlotCapacityRepo),
    changeStatus: new ChangeBranchDeliverySlotCapacityStatus(
      branchDeliverySlotCapacityRepo,
    ),
    softDelete: new SoftDeleteBranchDeliverySlotCapacity(
      branchDeliverySlotCapacityRepo,
    ),
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
    quoteCheckout: new GetCheckoutQuote(calculateShippingQuoteService),
    createFromCart: new CreateOrderFromCart(
      orderRepo,
      cartRepo,
      productRepo,
      inventoryRepo,
      calculateShippingQuoteService,
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
    listBranches: new ListBranches(branchRepo),
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

  productTagGroups: {
    list: new ListProductTagGroups(productTagGroupRepo),
    create: new CreateProductTagGroup(productTagGroupRepo),
    edit: new EditProductTagGroup(productTagGroupRepo),
    deleteGroup: new DeleteProductTagGroup(productTagGroupRepo),
  },

  inventory: {
    list: new ListInventoryStocks(inventoryRepo),
    setStock: new SetInventoryStock(inventoryRepo, productRepo),
    transfer: new TransferInventoryStock(inventoryRepo, productRepo, sequelize),
    listTransactions: new ListInventoryTransactions(inventoryRepo),
  },
};

// ===== Controllers =====
type Controllers = {
  products: ProductsController;
  upload: UploadController;
  categories: ProductCategoriesController;
  roles: RolesController;
  users: UsersController;
  branches: BranchesController;
  shippingZones: ShippingZonesController;
  branchServiceAreas: BranchServiceAreasController;
  deliveryTimeSlots: DeliveryTimeSlotsController;
  branchDeliveryTimeSlots: BranchDeliveryTimeSlotsController;
  branchDeliverySlotCapacities: BranchDeliverySlotCapacitiesController;
  auth: AuthController;
  orders: OrdersController;
  reviews: AdminReviewsController;
  settings: SettingsGeneralController;
  origins: OriginsController;
  productTags: ProductTagsController;
  productTagGroups: ProductTagGroupsController;
  inventory: InventoryController;
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

  branches: makeBranchesController({
    list: usecases.branches.list,
    detail: usecases.branches.detail,
    create: usecases.branches.create,
    edit: usecases.branches.edit,
    changeStatus: usecases.branches.changeStatus,
    softDelete: usecases.branches.softDelete,
  }),

  shippingZones: makeShippingZonesController({
    list: usecases.shippingZones.list,
    detail: usecases.shippingZones.detail,
    create: usecases.shippingZones.create,
    edit: usecases.shippingZones.edit,
    changeStatus: usecases.shippingZones.changeStatus,
    softDelete: usecases.shippingZones.softDelete,
  }),

  branchServiceAreas: makeBranchServiceAreasController({
    list: usecases.branchServiceAreas.list,
    detail: usecases.branchServiceAreas.detail,
    create: usecases.branchServiceAreas.create,
    edit: usecases.branchServiceAreas.edit,
    changeStatus: usecases.branchServiceAreas.changeStatus,
    softDelete: usecases.branchServiceAreas.softDelete,
  }),

  deliveryTimeSlots: makeDeliveryTimeSlotsController({
    list: usecases.deliveryTimeSlots.list,
    detail: usecases.deliveryTimeSlots.detail,
    create: usecases.deliveryTimeSlots.create,
    edit: usecases.deliveryTimeSlots.edit,
    changeStatus: usecases.deliveryTimeSlots.changeStatus,
    softDelete: usecases.deliveryTimeSlots.softDelete,
  }),

  branchDeliveryTimeSlots: makeBranchDeliveryTimeSlotsController({
    list: usecases.branchDeliveryTimeSlots.list,
    detail: usecases.branchDeliveryTimeSlots.detail,
    create: usecases.branchDeliveryTimeSlots.create,
    edit: usecases.branchDeliveryTimeSlots.edit,
    changeStatus: usecases.branchDeliveryTimeSlots.changeStatus,
    softDelete: usecases.branchDeliveryTimeSlots.softDelete,
  }),

  branchDeliverySlotCapacities: makeBranchDeliverySlotCapacitiesController({
    list: usecases.branchDeliverySlotCapacities.list,
    detail: usecases.branchDeliverySlotCapacities.detail,
    create: usecases.branchDeliverySlotCapacities.create,
    edit: usecases.branchDeliverySlotCapacities.edit,
    changeStatus: usecases.branchDeliverySlotCapacities.changeStatus,
    softDelete: usecases.branchDeliverySlotCapacities.softDelete,
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

  productTagGroups: makeProductTagGroupsController({
    list: usecases.productTagGroups.list,
    create: usecases.productTagGroups.create,
    edit: usecases.productTagGroups.edit,
    deleteGroup: usecases.productTagGroups.deleteGroup,
  }),

  inventory: makeInventoryController({
    list: usecases.inventory.list,
    setStock: usecases.inventory.setStock,
    transfer: usecases.inventory.transfer,
    listTransactions: usecases.inventory.listTransactions,
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
    quoteCheckout: usecases.orders.quoteCheckout,
    createFromCart: usecases.orders.createFromCart,
    myOrders: usecases.orders.myOrders,
    myOrderDetail: usecases.orders.myOrderDetail,
    cancelMyOrder: usecases.orders.cancelMyOrder,
    listMyOrderAddresses: usecases.orders.listMyOrderAddresses,
    listBranches: usecases.orders.listBranches,
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
