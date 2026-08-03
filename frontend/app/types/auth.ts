export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  phone?: string;
  countryCode?: string;
  notificationPreferences?: {
    email: boolean;
    whatsapp: boolean;
  };
}

export interface LoginForm {
  email: string;
  password: string;
}

export interface NotificationPreferences {
  email: boolean;
  whatsapp: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  phone?: string;
  countryCode?: string;
  notificationPreferences?: NotificationPreferences;
  productCount?: number;
  createdAt?: string;
}
