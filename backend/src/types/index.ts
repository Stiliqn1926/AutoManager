// Роли на потребителите
export enum UserRole {
  ADMIN = 'ADMIN',
  MECHANIC = 'MECHANIC',
  CLIENT = 'CLIENT'
}

// Статуси на поръчките
export enum OrderStatus {
  WAITING = 'WAITING',        // Изчакване
  IN_PROGRESS = 'IN_PROGRESS', // В процес
  READY = 'READY',            // Готова за плащане
  COMPLETED = 'COMPLETED'      // Завършена
}

// Статуси на заявки
export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

// Типове транзакции
export enum TransactionType {
  INCOME = 'INCOME',    // Приход
  EXPENSE = 'EXPENSE'   // Разход
}

// Типове елементи в поръчка
export enum OrderItemType {
  PART = 'PART',           // Част
  LABOR = 'LABOR',         // Труд
  CONSUMABLE = 'CONSUMABLE' // Консуматив
}