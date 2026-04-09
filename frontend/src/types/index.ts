
export const UserRole = {
  ADMIN: 'ADMIN',
  MECHANIC: 'MECHANIC',
  CLIENT: 'CLIENT'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];


export const OrderStatus = {
  WAITING: 'WAITING',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  COMPLETED: 'COMPLETED'
} as const;

export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];


export const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED'
} as const;

export type RequestStatus = typeof RequestStatus[keyof typeof RequestStatus];


export interface User {
  id: string;
  email: string;
  role: UserRole;
  serviceCompanyId?: string;
}



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



export interface LoginResponse {
  message: string;
  user: User;
}



export interface RegisterResponse {
  message: string;
  user: User;
}


export interface ValidationError {
  field: string;
  message: string;
}

export interface ErrorResponse {
  message: string;
  code?: string;
  errors?: ValidationError[];
}

