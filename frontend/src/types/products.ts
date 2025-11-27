export interface Product {
  discount_percentage: any;
  updated_at: string | number | Date;
  id: number;
  title: string;
  stock: number;
  effective_price?: number;
  price: number;
  status: string;
  featured: boolean;
  category?: {
    title: string;
  };
  discountPercentage: number;
  updatedAt: string;
}

export interface ProductSummary {
  total: number;
  outOfStock: number;
  lowStock: number;
  totalInventoryValue: number;
}
