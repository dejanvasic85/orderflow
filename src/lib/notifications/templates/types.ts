export type OrderEmailItem = {
  productName: string;
  boxes: number;
  extraUnits: number;
};

export type OrderEmailInput = {
  orderRef: string;
  accountName: string;
  placedByName: string;
  deliveryAddress: string | null;
  items: OrderEmailItem[];
  orderUrl: string;
};
