import type {
  InventoryRepository,
  InventoryStockListItem,
} from "../../../domain/inventory/InventoryRepository";

type Input = {
  branchId?: number | null;
  q?: string;
  status?: string | null;
};

export class ListInventoryStocks {
  constructor(private inventoryRepo: InventoryRepository) {}

  async execute(input: Input): Promise<InventoryStockListItem[]> {
    return this.inventoryRepo.listStocksByBranch({
      branchId:
        input.branchId !== undefined && input.branchId !== null
          ? Number(input.branchId)
          : null,
      q: String(input.q ?? "").trim(),
      status: input.status ?? "all",
    });
  }
}
