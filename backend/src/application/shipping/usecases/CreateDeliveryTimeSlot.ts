import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

type CreateDeliveryTimeSlotInput = {
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes?: number;
  maxOrders?: number | null;
  sortOrder?: number;
  status?: string;
};

function normalizeTime(value: string): string {
  return String(value ?? "").trim();
}

function timeToMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(value);
  if (!match) return Number.NaN;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
}

export class CreateDeliveryTimeSlot {
  constructor(
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(input: CreateDeliveryTimeSlotInput) {
    const code = String(input.code ?? "").trim();
    const label = String(input.label ?? "").trim();
    const startTime = normalizeTime(input.startTime);
    const endTime = normalizeTime(input.endTime);
    const cutoffMinutes = Number(input.cutoffMinutes ?? 0);
    const sortOrder = Number(input.sortOrder ?? 0);
    const status = String(input.status ?? "active").trim() || "active";

    let maxOrders: number | null = null;
    if (input.maxOrders !== undefined && input.maxOrders !== null) {
      maxOrders = Number(input.maxOrders);
    }

    if (!code) {
      throw new Error("Mã khung giờ giao hàng là bắt buộc.");
    }

    if (!label) {
      throw new Error("Tên khung giờ giao hàng là bắt buộc.");
    }

    if (!startTime) {
      throw new Error("Giờ bắt đầu là bắt buộc.");
    }

    if (!endTime) {
      throw new Error("Giờ kết thúc là bắt buộc.");
    }

    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);

    if (!Number.isFinite(startMinutes)) {
      throw new Error("Giờ bắt đầu không hợp lệ.");
    }

    if (!Number.isFinite(endMinutes)) {
      throw new Error("Giờ kết thúc không hợp lệ.");
    }

    if (startMinutes >= endMinutes) {
      throw new Error("Giờ bắt đầu phải nhỏ hơn giờ kết thúc.");
    }

    if (!Number.isInteger(cutoffMinutes) || cutoffMinutes < 0) {
      throw new Error("Cutoff minutes không hợp lệ.");
    }

    if (!Number.isInteger(sortOrder)) {
      throw new Error("Sort order không hợp lệ.");
    }

    if (maxOrders !== null && (!Number.isInteger(maxOrders) || maxOrders < 0)) {
      throw new Error("Số đơn tối đa không hợp lệ.");
    }

    const existing = await this.deliveryTimeSlotRepo.findByCode(code);
    if (existing) {
      throw new Error("Mã khung giờ giao hàng đã tồn tại.");
    }

    const deletedCandidate =
      await this.deliveryTimeSlotRepo.findDeletedByCode(code);

    if (deletedCandidate) {
      return this.deliveryTimeSlotRepo.revive(deletedCandidate.id, {
        code,
        label,
        startTime,
        endTime,
        cutoffMinutes,
        maxOrders,
        sortOrder,
        status,
      });
    }

    return this.deliveryTimeSlotRepo.create({
      code,
      label,
      startTime,
      endTime,
      cutoffMinutes,
      maxOrders,
      sortOrder,
      status,
    });
  }
}
