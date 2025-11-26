import { fn, col, literal } from "sequelize";

export class SequelizeReviewRepository {
  constructor(private models: any) {}

  async userCanReview(userId: number, productId: number, orderId: number) {
    const order = await this.models.Order.findOne({
      where: { id: orderId, user_id: userId, status: "completed" },
    });

    if (!order) return false;

    const item = await this.models.OrderItem.findOne({
      where: { order_id: orderId, product_id: productId },
    });

    return !!item;
  }

  async create(input: any) {
    return await this.models.ProductReview.create({
      product_id: input.productId,
      order_id: input.orderId,
      user_id: input.userId,
      rating: input.rating,
      content: input.content,
      status: "approved",
    });
  }

  async reply(input: any) {
    const parentReview = await this.models.ProductReview.findByPk(
      input.parentId
    );

    if (!parentReview) {
      throw new Error("Review not found");
    }

    return await this.models.ProductReview.create({
      parent_id: input.parentId,
      user_id: input.userId,
      content: input.content,
      status: "approved",
      product_id: parentReview.product_id,
      order_id: parentReview.order_id,
    });
  }

  async listByProduct(productId: number) {
    const rows = await this.models.ProductReview.findAll({
      where: { product_id: productId },
      include: [
        {
          model: this.models.User,
          as: "user",
          attributes: ["id", "full_name", "avatar"],
        },
        {
          model: this.models.ProductReview,
          as: "replies",
          required: false,
          include: [
            {
              model: this.models.User,
              as: "user",
              attributes: ["id", "full_name", "avatar"],
            },
          ],
        },
      ],
      order: [
        ["id", "DESC"], // Cha mới nhất trước
        [{ model: this.models.ProductReview, as: "replies" }, "id", "ASC"],
      ],
    });

    // Lọc chỉ review cha
    return rows.filter((r: { parent_id: null; }) => r.parent_id === null);
  }

  async listByUser(userId: number) {
    return await this.models.ProductReview.findAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
    });
  }

  async hasReviewed(userId: number, orderId: number, productId: number) {
    const r = await this.models.ProductReview.findOne({
      where: { user_id: userId, order_id: orderId, product_id: productId },
    });
    return !!r;
  }

  async countPendingReviewsByProduct() {
    const ProductReview = this.models.ProductReview;

    return await ProductReview.findAll({
      attributes: [
        "product_id",

        // ⭐ Đếm review gốc theo alias đúng
        [fn("COUNT", col("ProductReviewModel.id")), "pending_count"],
      ],

      where: {
        parent_id: null,
        status: "approved",
      },

      include: [
        {
          model: ProductReview,
          as: "replies",
          required: false,
          attributes: [],
        },
      ],

      group: ["product_id"],

      // ⭐ alias replies là "replies"
      having: literal("COUNT(replies.id) = 0"),
    });
  }
}
