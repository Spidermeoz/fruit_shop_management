// src/config/di/container.ts
import ProductModel from "../../infrastructure/db/sequelize/models/ProductModel";
import { SequelizeProductRepository } from "../../infrastructure/repositories/SequelizeProductRepository";

// Roles
import RoleModel from "../../infrastructure/db/sequelize/models/RoleModel";
import { SequelizeRoleRepository } from "../../infrastructure/repositories/SequelizeRoleRepository";

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

import { ListRoles } from "../../application/roles/usecases/ListRoles";
import { GetRoleDetail } from "../../application/roles/usecases/GetRoleDetail";
import { CreateRole } from "../../application/roles/usecases/CreateRole";
import { UpdateRole } from "../../application/roles/usecases/UpdateRole";
import { SoftDeleteRole } from "../../application/roles/usecases/SoftDeleteRole";
import { GetRolePermissions } from "../../application/roles/usecases/GetRolePermissions";
import { UpdateRolePermissions } from "../../application/roles/usecases/UpdateRolePermissions";

import { makeProductCategoriesController } from "../../interfaces/http/express/controllers/ProductCategoriesController";
import type { ProductCategoriesController } from "../../interfaces/http/express/controllers/ProductCategoriesController";

import { makeRolesController } from "../../interfaces/http/express/controllers/RolesController";
import type { RolesController } from "../../interfaces/http/express/controllers/RolesController";

import { ListRolesForPermissions } from "../../application/roles/usecases/ListRolesForPermissions";
import { UpdateRolePermissions as BulkUpdateRolePermissions } from "../../application/roles/usecases/UpdateRolePermissions";

ProductModel.belongsTo(ProductCategoryModel, {
  as: "category",
  foreignKey: "product_category_id",
});
ProductCategoryModel.hasMany(ProductModel, {
  as: "products",
  foreignKey: "product_category_id",
});
// ===== Models & Repos =====
const models = { Product: ProductModel, ProductCategory: ProductCategoryModel };
const productRepo = new SequelizeProductRepository(models);

// ===== Category Models & Repo =====
const categoryModels = { ProductCategory: ProductCategoryModel };
const categoryRepo = new SequelizeProductCategoryRepository(categoryModels);

const roleModels = { Role: RoleModel };
const roleRepo = new SequelizeRoleRepository(roleModels);

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
    list: new ListRoles(roleRepo),
    detail: new GetRoleDetail(roleRepo),
    create: new CreateRole(roleRepo),
    update: new UpdateRole(roleRepo),
    softDelete: new SoftDeleteRole(roleRepo),
    getPermissions: new GetRolePermissions(roleRepo),
    updatePermissions: new UpdateRolePermissions(roleRepo),
    listForPermissions: new ListRolesForPermissions(roleRepo),
    bulkUpdatePermissions: new BulkUpdateRolePermissions(roleRepo),
  },
};

// ===== Controllers (khai báo cả products và upload) =====
type Controllers = {
  products: ProductsController;
  upload: UploadController;
  categories: ProductCategoriesController;
  roles: RolesController;
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
};
