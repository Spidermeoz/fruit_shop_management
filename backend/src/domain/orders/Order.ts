import type { OrderProps } from "./types";

export class Order {
  props: OrderProps;

  private constructor(props: OrderProps) {
    this.props = props;
  }

  static create(props: OrderProps) {
    return new Order(props);
  }

  get id() {
    return this.props.id!;
  }

  get userId() {
    return this.props.userId;
  }

  get status() {
    return this.props.status;
  }

  get items() {
    return this.props.items;
  }

  get paymentStatus() {
    return this.props.paymentStatus;
  }

  get finalPrice() {
    return this.props.finalPrice;
  }

  get address() {
    return this.props.address;
  }

  get branchId() {
    return this.props.branchId;
  }

  get fulfillmentType() {
    return this.props.fulfillmentType;
  }

  get deliveryType() {
    return this.props.deliveryType ?? "standard";
  }

  get deliveryDate() {
    return this.props.deliveryDate ?? null;
  }

  get deliveryTimeSlotId() {
    return this.props.deliveryTimeSlotId ?? null;
  }

  get deliveryTimeSlotLabel() {
    return this.props.deliveryTimeSlotLabel ?? null;
  }

  get shippingZoneId() {
    return this.props.shippingZoneId ?? null;
  }

  get shippingZoneCode() {
    return this.props.shippingZoneCode ?? null;
  }

  get shippingZoneName() {
    return this.props.shippingZoneName ?? null;
  }

  get deliveryNote() {
    return this.props.deliveryNote ?? null;
  }

  get branch() {
    return this.props.branch ?? null;
  }
}
