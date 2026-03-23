import type {
  OriginListFilter,
  OriginRepository,
} from "../../../domain/products/OriginRepository";
import { toDTO } from "../dto";

export class ListOrigins {
  constructor(private repo: OriginRepository) {}

  async execute(filter: OriginListFilter) {
    const { rows, count } = await this.repo.list({
      page: filter.page ?? 1,
      limit: filter.limit ?? 20,
      q: filter.q,
      status: filter.status ?? "all",
      sortBy: filter.sortBy ?? "name",
      order: filter.order ?? "ASC",
    });

    return { rows: rows.map(toDTO), count };
  }
}
