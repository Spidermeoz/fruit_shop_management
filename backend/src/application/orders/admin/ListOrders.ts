export class ListOrders {
  constructor(private orderRepo: any) {}

  async execute(filter: any, actor?: any) {
    const allowedBranchIds = Array.isArray(actor?.branchIds)
      ? actor.branchIds
          .map(Number)
          .filter((x: number) => Number.isFinite(x) && x > 0)
      : [];

    const branchId =
      filter?.branchId !== undefined && filter?.branchId !== null
        ? Number(filter.branchId)
        : undefined;

    if (
      branchId &&
      allowedBranchIds.length > 0 &&
      !allowedBranchIds.includes(branchId)
    ) {
      throw new Error("Bạn không có quyền xem đơn hàng của chi nhánh này");
    }

    return this.orderRepo.list({
      ...filter,
      branchId,
      allowedBranchIds: allowedBranchIds.length ? allowedBranchIds : undefined,
      fulfillmentType: filter?.fulfillmentType,
    });
  }
}
