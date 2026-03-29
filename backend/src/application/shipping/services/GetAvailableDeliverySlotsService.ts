import type { DeliveryTimeSlotRepository } from "../../../domain/shipping/DeliveryTimeSlotRepository";

type Input = {
  branchId: number;
  deliveryDate: string;
};

type OutputItem = {
  id: number;
  code: string;
  label: string;
  startTime: string;
  endTime: string;
  cutoffMinutes: number;
  isAvailable: boolean;
  remainingCapacity: number | null;
  reason?: string | null;
};

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

const normalizeDateOnly = (value?: string | null): string => {
  const v = String(value ?? "").trim();
  if (!DATE_ONLY_RE.test(v)) {
    throw new Error("Ngày giao hàng không hợp lệ");
  }
  return v;
};

const startOfToday = (): Date => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
};

const parseTimeToParts = (timeValue?: string | null) => {
  const raw = String(timeValue ?? "00:00:00").trim();
  const [hh, mm, ss] = raw.split(":").map((x) => Number(x || 0));

  return {
    hour: Number.isFinite(hh) ? hh : 0,
    minute: Number.isFinite(mm) ? mm : 0,
    second: Number.isFinite(ss) ? ss : 0,
  };
};

const buildDateTime = (dateOnly: string, timeValue?: string | null): Date => {
  const [year, month, day] = dateOnly.split("-").map(Number);
  const { hour, minute, second } = parseTimeToParts(timeValue);

  return new Date(year, month - 1, day, hour, minute, second, 0);
};

export class GetAvailableDeliverySlotsService {
  constructor(
    private readonly deliveryTimeSlotRepo: DeliveryTimeSlotRepository,
  ) {}

  async execute(input: Input): Promise<OutputItem[]> {
    const branchId = Number(input.branchId);
    const deliveryDate = normalizeDateOnly(input.deliveryDate);

    if (!Number.isFinite(branchId) || branchId <= 0) {
      throw new Error("Chi nhánh không hợp lệ");
    }

    const today = startOfToday();
    const targetDate = new Date(`${deliveryDate}T00:00:00`);

    if (Number.isNaN(targetDate.getTime())) {
      throw new Error("Ngày giao hàng không hợp lệ");
    }

    if (targetDate < today) {
      throw new Error("Không thể chọn ngày giao hàng trong quá khứ");
    }

    const isToday = targetDate.getTime() === today.getTime();
    const now = new Date();

    const slots = await this.deliveryTimeSlotRepo.listActiveByBranch(branchId);

    const results: OutputItem[] = [];

    for (const item of slots) {
      const slot = item.slot;
      const capacity = await this.deliveryTimeSlotRepo.findCapacity(
        branchId,
        deliveryDate,
        slot.id,
      );

      const baseMax =
        capacity?.maxOrders ??
        item.branchSlot?.maxOrdersOverride ??
        slot.maxOrders ??
        null;

      const reserved = Number(capacity?.reservedOrders ?? 0);

      const effectiveMax =
        baseMax !== null &&
        baseMax !== undefined &&
        Number.isFinite(Number(baseMax))
          ? Number(baseMax)
          : null;

      let isAvailable = true;
      let remainingCapacity: number | null = null;
      let reason: string | null = null;

      if (effectiveMax !== null) {
        remainingCapacity = Math.max(0, effectiveMax - reserved);
        if (remainingCapacity <= 0) {
          isAvailable = false;
          reason = "Khung giờ đã đầy";
        }
      }

      if (isAvailable && isToday) {
        const slotStart = buildDateTime(deliveryDate, slot.startTime);
        const cutoffMinutes = Number(slot.cutoffMinutes ?? 0);

        const cutoffTime = new Date(
          slotStart.getTime() - cutoffMinutes * 60 * 1000,
        );

        if (now >= slotStart) {
          isAvailable = false;
          reason = "Khung giờ đã bắt đầu hoặc đã qua";
        } else if (cutoffMinutes > 0 && now > cutoffTime) {
          isAvailable = false;
          reason = "Đã quá thời gian chốt cho khung giờ này";
        }
      }

      results.push({
        id: slot.id,
        code: slot.code,
        label: slot.label,
        startTime: slot.startTime,
        endTime: slot.endTime,
        cutoffMinutes: Number(slot.cutoffMinutes ?? 0),
        isAvailable,
        remainingCapacity,
        reason,
      });
    }

    return results.sort((a, b) => {
      const aStart = a.startTime || "";
      const bStart = b.startTime || "";
      if (aStart < bStart) return -1;
      if (aStart > bStart) return 1;
      return a.id - b.id;
    });
  }
}
