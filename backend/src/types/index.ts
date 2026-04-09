
export enum UserRole {
  ADMIN = 'ADMIN',
  MECHANIC = 'MECHANIC',
  CLIENT = 'CLIENT'
}


export enum OrderStatus {
  WAITING = 'WAITING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  COMPLETED = 'COMPLETED'
}


export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}


export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}


export enum OrderItemType {
  PART = 'PART',
  LABOR = 'LABOR',
  CONSUMABLE = 'CONSUMABLE'
}

