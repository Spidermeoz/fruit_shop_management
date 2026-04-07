import type { PostCategoryRepository } from "../../../domain/post-categories/PostCategoryRepository";

export class PostCategoryTreeGuard {
  constructor(private repo: PostCategoryRepository) {}

  async ensureParentExists(parentId: number | null) {
    if (parentId === null) return;

    const normalizedParentId = Number(parentId);

    if (!Number.isInteger(normalizedParentId) || normalizedParentId <= 0) {
      throw new Error("Parent category is invalid");
    }

    const parent = await this.repo.findById(normalizedParentId);
    if (!parent) {
      throw new Error("Parent post category not found");
    }
  }

  async ensureNoCycle(currentId: number, nextParentId: number | null) {
    if (nextParentId === null) return;

    const normalizedCurrentId = Number(currentId);
    const normalizedParentId = Number(nextParentId);

    if (normalizedCurrentId === normalizedParentId) {
      throw new Error("A category cannot be its own parent");
    }

    let cursor: number | null = normalizedParentId;
    const visited = new Set<number>();

    while (cursor !== null) {
      if (visited.has(cursor)) {
        throw new Error("Invalid category hierarchy");
      }
      visited.add(cursor);

      if (cursor === normalizedCurrentId) {
        throw new Error("A category cannot be moved inside its own descendant");
      }

      const node = await this.repo.findById(cursor);
      if (!node) {
        throw new Error("Parent post category not found");
      }

      cursor = node.props.parentId ?? null;
    }
  }

  async ensureValidParentAssignment(
    currentId: number,
    nextParentId: number | null,
  ) {
    await this.ensureParentExists(nextParentId);
    await this.ensureNoCycle(currentId, nextParentId);
  }
}
