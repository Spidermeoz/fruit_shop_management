import { Op, Transaction, fn, col } from "sequelize";
import type {
  CreateInventoryTransactionInput,
  InventoryRepository,
  InventoryStock,
  InventoryStockListItem,
  InventoryTransactionType,
} from "../../domain/inventory/InventoryRepository";

type InventoryModels = {
  InventoryStock: any;
  InventoryTransaction: any;
  ProductVariant: any;
  Product?: any;
  Branch?: any;
};

const toStock = (row: any): InventoryStock => {
  const quantity = Number(row.quantity ?? 0);
  const reservedQuantity = Number(row.reserved_quantity ?? 0);

  return {
    id: Number(row.id),
    branchId: Number(row.branch_id),
    productVariantId: Number(row.product_variant_id),
    quantity,
    reservedQuantity,
    availableQuantity: Math.max(0, quantity - reservedQuantity),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

export class SequelizeInventoryRepository implements InventoryRepository {
  constructor(private models: InventoryModels) {}

  async findStock(
    branchId: number,
    productVariantId: number,
    transaction?: Transaction,
  ): Promise<InventoryStock | null> {
    const row = await this.models.InventoryStock.findOne({
      where: {
        branch_id: branchId,
        product_variant_id: productVariantId,
      },
      transaction,
    });

    return row ? toStock(row) : null;
  }

  async ensureStock(
    branchId: number,
    productVariantId: number,
    fallbackQuantity = 0,
    transaction?: Transaction,
  ): Promise<InventoryStock> {
    const safeFallback = Math.max(0, Number(fallbackQuantity || 0));

    const variant = await this.models.ProductVariant.findByPk(
      productVariantId,
      {
        transaction,
      },
    );

    if (!variant) {
      throw new Error("Product variant not found");
    }

    let row = await this.models.InventoryStock.findOne({
      where: {
        branch_id: branchId,
        product_variant_id: productVariantId,
      },
      transaction,
    });

    if (!row) {
      row = await this.models.InventoryStock.create(
        {
          branch_id: branchId,
          product_variant_id: productVariantId,
          quantity: safeFallback,
          reserved_quantity: 0,
        },
        { transaction },
      );

      await this.createTransaction(
        {
          branchId,
          productVariantId,
          transactionType: "initial",
          quantityDelta: safeFallback,
          quantityBefore: 0,
          quantityAfter: safeFallback,
          referenceType: "inventory_seed",
          referenceId: productVariantId,
          note: "Initial stock row created",
          createdById: null,
        },
        transaction,
      );
    }

    return toStock(row);
  }

  async getAvailableStock(
    branchId: number,
    productVariantId: number,
    fallbackQuantity = 0,
    transaction?: Transaction,
  ): Promise<number> {
    const stock = await this.ensureStock(
      branchId,
      productVariantId,
      fallbackQuantity,
      transaction,
    );

    return Math.max(0, Number(stock.quantity) - Number(stock.reservedQuantity));
  }

  async setStock(
    branchId: number,
    productVariantId: number,
    quantity: number,
    meta?: {
      transaction?: Transaction;
      transactionType?: InventoryTransactionType;
      referenceType?: string | null;
      referenceId?: number | null;
      note?: string | null;
      createdById?: number | null;
    },
  ): Promise<InventoryStock> {
    const transaction = meta?.transaction;
    const safeQuantity = Math.max(0, Number(quantity || 0));

    const current = await this.ensureStock(
      branchId,
      productVariantId,
      0,
      transaction,
    );

    await this.models.InventoryStock.update(
      { quantity: safeQuantity },
      {
        where: {
          branch_id: branchId,
          product_variant_id: productVariantId,
        },
        transaction,
      },
    );

    await this.createTransaction(
      {
        branchId,
        productVariantId,
        transactionType: meta?.transactionType ?? "manual_update",
        quantityDelta: safeQuantity - current.quantity,
        quantityBefore: current.quantity,
        quantityAfter: safeQuantity,
        referenceType: meta?.referenceType ?? null,
        referenceId: meta?.referenceId ?? null,
        note: meta?.note ?? null,
        createdById: meta?.createdById ?? null,
      },
      transaction,
    );

    return {
      ...current,
      quantity: safeQuantity,
      availableQuantity: Math.max(
        0,
        safeQuantity - Number(current.reservedQuantity ?? 0),
      ),
    };
  }

  async increaseStock(
    branchId: number,
    productVariantId: number,
    quantity: number,
    meta?: {
      transaction?: Transaction;
      transactionType?: InventoryTransactionType;
      referenceType?: string | null;
      referenceId?: number | null;
      note?: string | null;
      createdById?: number | null;
    },
  ): Promise<InventoryStock> {
    const transaction = meta?.transaction;
    const delta = Math.max(0, Number(quantity || 0));

    const current = await this.ensureStock(
      branchId,
      productVariantId,
      0,
      transaction,
    );

    const nextQuantity = current.quantity + delta;

    await this.models.InventoryStock.update(
      { quantity: nextQuantity },
      {
        where: {
          branch_id: branchId,
          product_variant_id: productVariantId,
        },
        transaction,
      },
    );

    await this.createTransaction(
      {
        branchId,
        productVariantId,
        transactionType: meta?.transactionType ?? "adjustment",
        quantityDelta: delta,
        quantityBefore: current.quantity,
        quantityAfter: nextQuantity,
        referenceType: meta?.referenceType ?? null,
        referenceId: meta?.referenceId ?? null,
        note: meta?.note ?? null,
        createdById: meta?.createdById ?? null,
      },
      transaction,
    );

    return {
      ...current,
      quantity: nextQuantity,
      availableQuantity: Math.max(
        0,
        nextQuantity - Number(current.reservedQuantity ?? 0),
      ),
    };
  }

  async decreaseStock(
    branchId: number,
    productVariantId: number,
    quantity: number,
    meta?: {
      transaction?: Transaction;
      transactionType?: InventoryTransactionType;
      referenceType?: string | null;
      referenceId?: number | null;
      note?: string | null;
      createdById?: number | null;
    },
  ): Promise<InventoryStock> {
    const transaction = meta?.transaction;
    const delta = Math.max(0, Number(quantity || 0));

    const current = await this.ensureStock(
      branchId,
      productVariantId,
      0,
      transaction,
    );

    const availableQuantity = Math.max(
      0,
      Number(current.quantity ?? 0) - Number(current.reservedQuantity ?? 0),
    );

    if (availableQuantity < delta) {
      throw new Error("Insufficient available inventory stock");
    }

    const nextQuantity = current.quantity - delta;

    await this.models.InventoryStock.update(
      { quantity: nextQuantity },
      {
        where: {
          branch_id: branchId,
          product_variant_id: productVariantId,
        },
        transaction,
      },
    );

    await this.createTransaction(
      {
        branchId,
        productVariantId,
        transactionType: meta?.transactionType ?? "adjustment",
        quantityDelta: -delta,
        quantityBefore: current.quantity,
        quantityAfter: nextQuantity,
        referenceType: meta?.referenceType ?? null,
        referenceId: meta?.referenceId ?? null,
        note: meta?.note ?? null,
        createdById: meta?.createdById ?? null,
      },
      transaction,
    );

    return {
      ...current,
      quantity: nextQuantity,
      availableQuantity: Math.max(
        0,
        nextQuantity - Number(current.reservedQuantity ?? 0),
      ),
    };
  }

  async listStocksByBranch(input: {
    branchId?: number | null;
    q?: string;
    status?: string | null;
  }): Promise<InventoryStockListItem[]> {
    const Product = this.models.Product;
    const ProductVariant = this.models.ProductVariant;
    const Branch = this.models.Branch;
    const InventoryStock = this.models.InventoryStock;

    if (!Product || !ProductVariant || !Branch || !InventoryStock) {
      throw new Error("Inventory repository is missing required models");
    }

    const whereStock: any = {};
    if (input.branchId && Number(input.branchId) > 0) {
      whereStock.branch_id = Number(input.branchId);
    }

    const whereProduct: any = { deleted: 0 };
    if (input.status && input.status !== "all") {
      whereProduct.status = input.status;
    }

    const q = String(input.q ?? "").trim();
    if (q) {
      whereProduct[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { slug: { [Op.like]: `%${q}%` } },
      ];
    }

    const rows = await InventoryStock.findAll({
      where: whereStock,
      attributes: [
        "id",
        "branch_id",
        "product_variant_id",
        "quantity",
        "reserved_quantity",
        "created_at",
        "updated_at",
      ],
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
          required: true,
        },
        {
          model: ProductVariant,
          as: "productVariant",
          attributes: [
            "id",
            "product_id",
            "sku",
            "title",
            "price",
            "status",
            "stock",
          ],
          required: true,
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "title", "thumbnail", "status", "deleted"],
              required: true,
              where: whereProduct,
            },
          ],
        },
      ],
      order: [
        [{ model: Branch, as: "branch" }, "name", "ASC"],
        [
          { model: ProductVariant, as: "productVariant" },
          { model: Product, as: "product" },
          "title",
          "ASC",
        ],
        [{ model: ProductVariant, as: "productVariant" }, "title", "ASC"],
      ],
    });

    return rows.map((row: any) => {
      const plain =
        typeof row.get === "function" ? row.get({ plain: true }) : row;
      const product = plain.productVariant?.product;
      const variant = plain.productVariant;
      const branch = plain.branch;

      const quantity = Number(plain.quantity ?? 0);
      const reservedQuantity = Number(plain.reserved_quantity ?? 0);

      return {
        branchId: Number(branch.id),
        branchName: String(branch.name ?? ""),
        branchCode: branch.code ?? null,

        productId: Number(product.id),
        productTitle: String(product.title ?? ""),
        productThumbnail: product.thumbnail ?? null,
        productStatus: product.status ?? null,

        variantId: Number(variant.id),
        variantSku: variant.sku ?? null,
        variantTitle: variant.title ?? null,
        variantPrice: Number(variant.price ?? 0),
        variantStatus: variant.status ?? null,

        quantity,
        reservedQuantity,
        availableQuantity: Math.max(0, quantity - reservedQuantity),

        createdAt: plain.created_at,
        updatedAt: plain.updated_at,
      };
    });
  }

  async createTransaction(
    input: CreateInventoryTransactionInput,
    transaction?: Transaction,
  ): Promise<void> {
    await this.models.InventoryTransaction.create(
      {
        branch_id: input.branchId,
        product_variant_id: input.productVariantId,
        transaction_type: input.transactionType,
        quantity_delta: input.quantityDelta,
        quantity_before: input.quantityBefore,
        quantity_after: input.quantityAfter,
        reference_type: input.referenceType ?? null,
        reference_id: input.referenceId ?? null,
        note: input.note ?? null,
        created_by_id: input.createdById ?? null,
      },
      { transaction },
    );
  }

  async listTransactions(input: {
    branchId?: number | null;
    q?: string;
    transactionType?: string | null;
    dateFrom?: string | null;
    dateTo?: string | null;
  }) {
    const InventoryTransaction = this.models.InventoryTransaction;
    const ProductVariant = this.models.ProductVariant;
    const Product = this.models.Product;
    const Branch = this.models.Branch;

    if (!InventoryTransaction || !ProductVariant || !Product || !Branch) {
      throw new Error("Inventory repository is missing required models");
    }

    const where: any = {};

    if (input.branchId && Number(input.branchId) > 0) {
      where.branch_id = Number(input.branchId);
    }

    if (
      input.transactionType &&
      input.transactionType !== "all" &&
      String(input.transactionType).trim() !== ""
    ) {
      where.transaction_type = String(input.transactionType).trim();
    }

    if (input.dateFrom || input.dateTo) {
      where.created_at = {};
      if (input.dateFrom) {
        where.created_at[Op.gte] = new Date(`${input.dateFrom}T00:00:00.000Z`);
      }
      if (input.dateTo) {
        where.created_at[Op.lte] = new Date(`${input.dateTo}T23:59:59.999Z`);
      }
    }

    const q = String(input.q ?? "").trim();

    const productWhere: any = { deleted: 0 };
    if (q) {
      productWhere[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { slug: { [Op.like]: `%${q}%` } },
      ];
    }

    const variantWhere: any = {};
    if (q) {
      variantWhere[Op.or] = [
        { title: { [Op.like]: `%${q}%` } },
        { sku: { [Op.like]: `%${q}%` } },
      ];
    }

    const rows = await InventoryTransaction.findAll({
      where,
      attributes: [
        "id",
        "branch_id",
        "product_variant_id",
        "transaction_type",
        "quantity_delta",
        "quantity_before",
        "quantity_after",
        "reference_type",
        "reference_id",
        "note",
        "created_by_id",
        "created_at",
      ],
      include: [
        {
          model: Branch,
          as: "branch",
          attributes: ["id", "name", "code"],
          required: true,
        },
        {
          model: ProductVariant,
          as: "productVariant",
          attributes: ["id", "product_id", "sku", "title"],
          required: true,
          where: Object.keys(variantWhere).length ? variantWhere : undefined,
          include: [
            {
              model: Product,
              as: "product",
              attributes: ["id", "title", "thumbnail", "deleted"],
              required: true,
              where: productWhere,
            },
          ],
        },
        {
          association: "createdBy",
          attributes: ["id", "full_name"],
          required: false,
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return rows.map((row: any) => {
      const plain =
        typeof row.get === "function" ? row.get({ plain: true }) : row;

      const branch = plain.branch;
      const variant = plain.productVariant;
      const product = plain.productVariant?.product;
      const createdBy = plain.createdBy;

      return {
        id: Number(plain.id),
        createdAt: plain.created_at,

        branchId: Number(branch.id),
        branchName: String(branch.name ?? ""),
        branchCode: branch.code ?? null,

        productId: Number(product.id),
        productTitle: String(product.title ?? ""),
        productThumbnail: product.thumbnail ?? null,

        variantId: Number(variant.id),
        variantTitle: variant.title ?? null,
        variantSku: variant.sku ?? null,

        transactionType: plain.transaction_type,
        quantityDelta: Number(plain.quantity_delta ?? 0),
        quantityBefore: Number(plain.quantity_before ?? 0),
        quantityAfter: Number(plain.quantity_after ?? 0),

        referenceType: plain.reference_type ?? null,
        referenceId:
          plain.reference_id !== undefined && plain.reference_id !== null
            ? Number(plain.reference_id)
            : null,
        note: plain.note ?? null,

        createdById:
          plain.created_by_id !== undefined && plain.created_by_id !== null
            ? Number(plain.created_by_id)
            : null,
        createdByName: createdBy?.full_name ?? null,
      };
    });
  }

  async getAvailabilityByVariantIds(
    variantIds: number[],
    branchId?: number | null,
  ): Promise<
    Array<{
      productVariantId: number;
      totalQuantity: number;
      totalReservedQuantity: number;
      availableQuantity: number;
    }>
  > {
    const InventoryStock = this.models.InventoryStock;
    if (!InventoryStock || !Array.isArray(variantIds) || !variantIds.length) {
      return [];
    }

    const where: any = {
      product_variant_id: { [Op.in]: variantIds.map(Number) },
    };

    if (branchId && Number(branchId) > 0) {
      where.branch_id = Number(branchId);
    }

    const rows = await InventoryStock.findAll({
      where,
      attributes: [
        "product_variant_id",
        [fn("SUM", col("quantity")), "total_quantity"],
        [fn("SUM", col("reserved_quantity")), "total_reserved_quantity"],
      ],
      group: ["product_variant_id"],
      raw: true,
    });

    return rows.map((row: any) => {
      const totalQuantity = Number(row.total_quantity ?? 0);
      const totalReservedQuantity = Number(row.total_reserved_quantity ?? 0);
      return {
        productVariantId: Number(row.product_variant_id),
        totalQuantity,
        totalReservedQuantity,
        availableQuantity: Math.max(0, totalQuantity - totalReservedQuantity),
      };
    });
  }

}
