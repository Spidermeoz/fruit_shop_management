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
    return await this.models.ProductReview.create({
      parent_id: input.parentId,
      user_id: input.userId,
      content: input.content,
      status: "approved",
    });
  }

  async listByProduct(productId: number) {
    return await this.models.ProductReview.findAll({
      where: { product_id: productId, parent_id: null }, // chỉ lấy review gốc
      include: [
        {
          model: this.models.User,
          as: "user",
          attributes: ["id", "full_name", "avatar"],
        },
        {
          model: this.models.ProductReview,
          as: "replies",
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
        ["created_at", "DESC"],
        [
          { model: this.models.ProductReview, as: "replies" },
          "created_at",
          "ASC",
        ],
      ],
    });
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
