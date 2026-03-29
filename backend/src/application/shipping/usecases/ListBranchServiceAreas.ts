import type { BranchServiceAreaRepository } from "../../../domain/shipping/BranchServiceAreaRepository";
import type { ListBranchServiceAreasFilter } from "../../../domain/shipping/branchServiceArea.types";

export class ListBranchServiceAreas {
  constructor(
    private readonly branchServiceAreaRepo: BranchServiceAreaRepository,
  ) {}

  async execute(filter: ListBranchServiceAreasFilter = {}) {
    const safeLimit = Math.min(Math.max(Number(filter.limit ?? 10), 1), 100);
    const safeOffset = Math.max(Number(filter.offset ?? 0), 0);

    const result = await this.branchServiceAreaRepo.list({
      ...filter,
      limit: safeLimit,
      offset: safeOffset,
    });

    return {
      rows: result.rows.map((x) => x.props),
      count: result.count,
      limit: safeLimit,
      offset: safeOffset,
    };
  }
}
