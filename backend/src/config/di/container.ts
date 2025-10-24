// src/config/di/container.ts
import ProductModel from "../../infrastructure/db/sequelize/models/ProductModel";
import { SequelizeProductRepository } from "../../infrastructure/repositories/SequelizeProductRepository";

import { ListProducts } from "../../application/products/usecases/ListProducts";
import { GetProductDetail } from "../../application/products/usecases/GetProductDetail";
import { CreateProduct } from "../../application/products/usecases/CreateProduct";
import { EditProduct } from "../../application/products/usecases/EditProduct";
import { ChangeProductStatus } from "../../application/products/usecases/ChangeProductStatus";
import { SoftDeleteProduct } from "../../application/products/usecases/SoftDeleteProduct";
import { BulkEditProducts } from "../../application/products/usecases/BulkEditProducts";
import { BulkReorderProducts } from "../../application/products/usecases/BulkReorderProducts";

import { makeProductsController } from "../../interfaces/http/express/controllers/ProductsController";

// Gom models vào object để repo dễ inject (mở rộng sau nếu có ProductCategory)
const models = { Product: ProductModel };

const productRepo = new SequelizeProductRepository(models);

export const usecases = {
  products: {
    list: new ListProducts(productRepo),
    detail: new GetProductDetail(productRepo),
    create: new CreateProduct(productRepo),
    edit: new EditProduct(productRepo),
    changeStatus: new ChangeProductStatus(productRepo),
    softDelete: new SoftDeleteProduct(productRepo),
    bulkEdit: new BulkEditProducts(productRepo),
    reorder: new BulkReorderProducts(productRepo)
  },
};

export const controllers = {
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
};
