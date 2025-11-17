// src/domain/orders/Order.ts
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

  // ⭐ Thêm các getter quan trọng
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
}
