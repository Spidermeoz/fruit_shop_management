import type { OrderProps, OrderItemProps, OrderAddressProps } from "./types";

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
}
