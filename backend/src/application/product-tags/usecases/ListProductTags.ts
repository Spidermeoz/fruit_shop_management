import type {
  ProductTagListFilter,
  ProductTagRepository,
} from "../../../domain/products/ProductTagRepository";
import { toDTO } from "../dto";

export class ListProductTags {
  constructor(private repo: ProductTagRepository) {}

  async execute(filter: ProductTagListFilter) {
    const { rows, count } = await this.repo.list({
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
      q: filter.q,
      productTagGroupId: filter.productTagGroupId ?? "all",
      sortBy: filter.sortBy ?? "name",
      order: filter.order ?? "ASC",
    });

    return {
      rows: rows.map(toDTO),
      count,
    };
  }
}
