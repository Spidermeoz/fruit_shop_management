// src/config/di/container.ts
import ProductModel from "../../infrastructure/db/sequelize/models/ProductModel";
import { SequelizeProductRepository } from "../../infrastructure/repositories/SequelizeProductRepository";

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

// ===== Models & Repos =====
const models = { Product: ProductModel };
const productRepo = new SequelizeProductRepository(models);

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
};

// ===== Controllers (khai báo cả products và upload) =====
type Controllers = {
  products: ProductsController;
  upload: UploadController;
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
};
