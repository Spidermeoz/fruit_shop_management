import type {
  ProductTagGroupListFilter,
  ProductTagGroupRepository,
} from "../../../domain/products/ProductTagGroupRepository";
import { toDTO } from "../dto";

export class ListProductTagGroups {
  constructor(private repo: ProductTagGroupRepository) {}

  async execute(filter: ProductTagGroupListFilter) {
    const { rows, count } = await this.repo.list({
      page: filter.page ?? 1,
      limit: filter.limit ?? 50,
      q: filter.q,
      sortBy: filter.sortBy ?? "name",
      order: filter.order ?? "ASC",
      includeTags: filter.includeTags ?? true,
    });

    return {
      rows: rows.map(toDTO),
      count,
    };
  }
}
