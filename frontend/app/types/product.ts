export interface Product {
  _id?: string;
  name: string;
  expiryDate: string;
  category?: string;
  imageUrl?: string;
  quantity?: number;
  unit?: string;
  createdAt?: string;
}
