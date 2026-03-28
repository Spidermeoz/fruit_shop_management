import type {
  InventoryRepository,
  InventoryTransactionListItem,
} from "../../../domain/inventory/InventoryRepository";

type Input = {
  branchId?: number | null;
  q?: string;
  transactionType?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
};

export class ListInventoryTransactions {
  constructor(private inventoryRepo: InventoryRepository) {}

  async execute(input: Input): Promise<InventoryTransactionListItem[]> {
    return this.inventoryRepo.listTransactions({
      branchId:
        input.branchId !== undefined && input.branchId !== null
          ? Number(input.branchId)
          : null,
      q: String(input.q ?? "").trim(),
      transactionType: input.transactionType ?? "all",
      dateFrom: input.dateFrom ?? null,
      dateTo: input.dateTo ?? null,
    });
  }
}
