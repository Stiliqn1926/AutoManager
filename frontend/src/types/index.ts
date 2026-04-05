// Роли на потребителите
export const UserRole = {
  ADMIN: 'ADMIN',
  MECHANIC: 'MECHANIC',
  CLIENT: 'CLIENT'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Статуси на поръчките
export const OrderStatus = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  COMPLETED: 'COMPLETED'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

// Статуси на заявки
export const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];

// User interface (съвпада с backend response)
export interface User {
  id: string;
  email: string;
  role: UserRole;
  serviceCompanyId?: string; // За ADMIN и MECHANIC
}

/// Auth context - ЕДИН ЕДИНСТВЕН!
// 🆕 Махнато token - сега токените са в httpOnly cookies
export interface AuthContextType {
  user: User | null;
  login: (
    email: string,
    password: string,
    role: UserRole,
    rememberMe?: boolean
  ) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Login response от backend
// 🆕 Махнато token - сега токените са в httpOnly cookies
export interface LoginResponse {
  message: string;
  user: User;
}

// Register response от backend
// 🆕 Махнато token - сега токените са в httpOnly cookies
export interface RegisterResponse {
  message: string;
  user: User;
}

// Validation error от backend
export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  errors?: ValidationError[];
}
