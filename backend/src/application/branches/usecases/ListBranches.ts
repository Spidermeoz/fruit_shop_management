import type { BranchRepository } from "../../../domain/branches/BranchRepository";
import type { ListBranchesFilter } from "../../../domain/branches/types";

export class ListBranches {
  constructor(private readonly branchRepo: BranchRepository) {}

  async execute(filter: ListBranchesFilter = {}) {
    const safeLimit = Math.min(Math.max(Number(filter.limit ?? 10), 1), 100);
    const safeOffset = Math.max(Number(filter.offset ?? 0), 0);

    const result = await this.branchRepo.list({
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
