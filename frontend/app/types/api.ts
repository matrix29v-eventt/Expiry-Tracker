export interface ApiResponse<T = unknown> {
  success?: boolean;
  message: string;
  data?: T;
  needsVerification?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pages: number;
}
