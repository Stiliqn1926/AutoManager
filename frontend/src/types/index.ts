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
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;  // С rememberMe
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Login response от backend
export interface LoginResponse {
  message: string;
  token: string;
  user: User;
}

// Register response от backend
export interface RegisterResponse {
  message: string;
  token: string;
  user: User;
}

// Validation error от backend
export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  message: string;
  errors?: ValidationError[];
}