import { User } from "./auth";

export interface AdminStats {
  users: number;
  products: number;
  expired: number;
  notifications: number;
  notificationsWeek: number;
  unread: number;
  failedDeliveries: number;
  recentUsers: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
  }>;
  recentProducts: Array<{
    _id: string;
    name: string;
    expiryDate: string;
    user: { name: string; email: string };
  }>;
}

export interface AdminUser extends User {
  phone?: string;
  countryCode?: string;
  productCount: number;
}

export interface AdminProduct {
  _id: string;
  name: string;
  expiryDate: string;
  category?: string;
  isExpired: boolean;
  user: { name: string; email: string };
}

export interface AdminNotification {
  _id: string;
  message: string;
  type: string;
  channel: string;
  deliveryStatus: string;
  isRead: boolean;
  createdAt: string;
  user: { name: string; email: string };
  product?: { name: string; expiryDate: string };
}
