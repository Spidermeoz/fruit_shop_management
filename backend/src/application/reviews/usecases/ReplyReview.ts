import type { ReviewRepository } from "../../../domain/reviews/ReviewRepository";

export class ReplyReview {
  constructor(private repo: ReviewRepository) {}

  async execute(adminId: number, input: {
    parentId: number;
    content: string;
  }) {
    // Có thể kiểm tra role admin tại middleware trước usecase
    
    return await this.repo.reply({
      parentId: input.parentId,
      userId: adminId,
      content: input.content,
    });
  }
}
