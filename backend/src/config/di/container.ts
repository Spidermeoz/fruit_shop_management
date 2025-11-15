// src/config/di/container.ts
import ProductModel from "../../infrastructure/db/sequelize/models/ProductModel";
import { SequelizeProductRepository } from "../../infrastructure/repositories/SequelizeProductRepository";

// Roles
import RoleModel from "../../infrastructure/db/sequelize/models/RoleModel";
import { SequelizeRoleRepository } from "../../infrastructure/repositories/SequelizeRoleRepository";

// Users
import UserModel from "../../infrastructure/db/sequelize/models/UserModel";
import { SequelizeUserRepository } from "../../infrastructure/repositories/SequelizeUserRepository";

// Products usecases
import { ListProducts } from "../../application/products/usecases/ListProducts";
import { GetProductDetail } from "../../application/products/usecases/GetProductDetail";
import { CreateProduct } from "../../application/products/usecases/CreateProduct";
import { EditProduct } from "../../application/products/usecases/EditProduct";
import { ChangeProductStatus } from "../../application/products/usecases/ChangeProductStatus";
import { SoftDeleteProduct } from "../../application/products/usecases/SoftDeleteProduct";
import { BulkEditProducts } from "../../application/products/usecases/BulkEditProducts";
import { BulkReorderProducts } from "../../application/products/usecases/BulkReorderProducts";

// Controllers
import { makeProductsController } from "../../interfaces/http/express/controllers/ProductsController";
import type { ProductsController } from "../../interfaces/http/express/controllers/ProductsController";

// Upload DI
import { CloudinaryStorage } from "../../infrastructure/storage/CloudinaryStorage";
import { UploadImage } from "../../application/uploads/usecases/UploadImage";
import { makeUploadController } from "../../interfaces/http/express/controllers/UploadController";
import type { UploadController } from "../../interfaces/http/express/controllers/UploadController";

// ===== Auth services =====
import { JwtTokenService } from "../../infrastructure/auth/JwtTokenService";
import { CryptoRefreshTokenService } from "../../infrastructure/auth/CryptoRefreshTokenService";
import { BcryptPasswordService } from "../../infrastructure/auth/BcryptPasswordService";

// ===== Category imports =====
import ProductCategoryModel from "../../infrastructure/db/sequelize/models/ProductCategoryModel";
import { SequelizeProductCategoryRepository } from "../../infrastructure/repositories/SequelizeProductCategoryRepository";

import { ListCategories } from "../../application/categories/usecases/ListCategories";
import { GetCategoryDetail } from "../../application/categories/usecases/GetCategoryDetail";
import { CreateCategory } from "../../application/categories/usecases/CreateCategory";
import { EditCategory } from "../../application/categories/usecases/EditCategory";
import { ChangeCategoryStatus } from "../../application/categories/usecases/ChangeCategoryStatus";
import { SoftDeleteCategory } from "../../application/categories/usecases/SoftDeleteCategory";
import { BulkEditCategories } from "../../application/categories/usecases/BulkEditCategories";
import { ReorderCategoryPositions } from "../../application/categories/usecases/ReorderCategoryPositions";

// ===== Roles usecases =====
import { ListRoles } from "../../application/roles/usecases/ListRoles";
import { GetRoleDetail } from "../../application/roles/usecases/GetRoleDetail";
import { CreateRole } from "../../application/roles/usecases/CreateRole";
import { UpdateRole } from "../../application/roles/usecases/UpdateRole";
import { SoftDeleteRole } from "../../application/roles/usecases/SoftDeleteRole";
import { GetRolePermissions } from "../../application/roles/usecases/GetRolePermissions";
import { UpdateRolePermissions } from "../../application/roles/usecases/UpdateRolePermissions";
import { ListRolesForPermissions } from "../../application/roles/usecases/ListRolesForPermissions";
import { UpdateRolePermissions as BulkUpdateRolePermissions } from "../../application/roles/usecases/UpdateRolePermissions";

import { makeProductCategoriesController } from "../../interfaces/http/express/controllers/ProductCategoriesController";
import type { ProductCategoriesController } from "../../interfaces/http/express/controllers/ProductCategoriesController";

import { makeRolesController } from "../../interfaces/http/express/controllers/RolesController";
import type { RolesController } from "../../interfaces/http/express/controllers/RolesController";

// ===== Users usecases =====
import { ListUsers } from "../../application/users/usecases/ListUsers";
import { GetUserDetail } from "../../application/users/usecases/GetUserDetail";
import { CreateUser } from "../../application/users/usecases/CreateUser";
import { EditUser } from "../../application/users/usecases/EditUser";
import { UpdateUserStatus } from "../../application/users/usecases/UpdateUserStatus";
import { SoftDeleteUser } from "../../application/users/usecases/SoftDeleteUser";
import { BulkEditUsers } from "../../application/users/usecases/BulkEditUsers";

// ===== Auth usecases =====
import { Login } from "../../application/auth/usecases/Login";
import { Logout } from "../../application/auth/usecases/Logout";
import { RefreshToken } from "../../application/auth/usecases/RefreshToken";
import { GetMe } from "../../application/auth/usecases/GetMe";

import { makeUsersController } from "../../interfaces/http/express/controllers/UsersController";
import type { UsersController } from "../../interfaces/http/express/controllers/UsersController";

import { makeAuthController } from "../../interfaces/http/express/controllers/AuthController";
import type { AuthController } from "../../interfaces/http/express/controllers/AuthController";

import { makeClientProductsController } from "../../interfaces/http/express/controllers/client/ClientProductsController";
import type { ClientProductsController } from "../../interfaces/http/express/controllers/client/ClientProductsController";

import { makeClientCategoriesController } from "../../interfaces/http/express/controllers/client/ClientCategoriesController";
// import type { ClientCategoriesController } from "../../interfaces/http/express/controllers/client/ClientCategoriesController";

import { RegisterClient } from "../../application/auth/usecases/RegisterClient";
import { makeClientAuthController } from "../../interfaces/http/express/controllers/client/ClientAuthController";
// import clientAuthRoutes from "../../interfaces/http/express/routes/client/clientAuth.routes";



// ===== Export Auth services (cho main.ts / middlewares) =====
export const authServices = {
  token: new JwtTokenService(),
  refresh: new CryptoRefreshTokenService(),
  password: new BcryptPasswordService(),
} as const;

// ===== Associations =====
ProductModel.belongsTo(ProductCategoryModel, {
  as: "category",
  foreignKey: "product_category_id",
});
ProductCategoryModel.hasMany(ProductModel, {
  as: "products",
  foreignKey: "product_category_id",
});

UserModel.belongsTo(RoleModel, { as: "role", foreignKey: "role_id" });
RoleModel.hasMany(UserModel, { as: "users", foreignKey: "role_id" });

// ===== Models & Repos =====
const productModels = {
  Product: ProductModel,
  ProductCategory: ProductCategoryModel,
};
const productRepo = new SequelizeProductRepository(productModels);

// Category
const categoryModels = { ProductCategory: ProductCategoryModel };
const categoryRepo = new SequelizeProductCategoryRepository(categoryModels);

// Roles (export để dùng ở main.ts/middlewares)
const roleModels = { Role: RoleModel };
export const rolesRepo = new SequelizeRoleRepository(roleModels);

// Users (export để dùng ở main.ts/middlewares)
const userModels = { User: UserModel, Role: RoleModel };
export const userRepo = new SequelizeUserRepository(userModels);

// ===== Usecases =====
export const usecases = {
  products: {
    list: new ListProducts(productRepo),
    detail: new GetProductDetail(productRepo),
    create: new CreateProduct(productRepo),
    edit: new EditProduct(productRepo),
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
      authServices.password
    ),
    logout: new Logout(userRepo),
    refresh: new RefreshToken(
      userRepo,
      authServices.token,
      authServices.refresh
    ),
    me: new GetMe(userRepo, rolesRepo),
  },
  // tham chiếu lại services đã export ở trên (tránh tạo instance mới)
  authServices,
};

// ===== Controllers =====
type Controllers = {
  products: ProductsController;
  upload: UploadController;
  categories: ProductCategoriesController;
  roles: RolesController;
  users: UsersController;
  auth: AuthController; 
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
};

export const clientControllers = {
  products: makeClientProductsController({
    list: usecases.products.list,
    detail: usecases.products.detail,
  }),
  categories: makeClientCategoriesController({
    list: usecases.categories.list, // ✅ reuse usecase ListCategories
  }),
  auth: makeClientAuthController({
    register: new RegisterClient(userRepo, authServices.password, authServices.token, authServices.refresh),
    login: usecases.auth.login,
    logout: usecases.auth.logout,
    me: usecases.auth.me,
    refresh: usecases.auth.refresh,
  }),
} as const;

