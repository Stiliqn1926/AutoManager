"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItemType = exports.TransactionType = exports.RequestStatus = exports.OrderStatus = exports.UserRole = void 0;
// Роли на потребителите
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MECHANIC"] = "MECHANIC";
    UserRole["CLIENT"] = "CLIENT";
})(UserRole || (exports.UserRole = UserRole = {}));
// Статуси на поръчките
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["WAITING"] = "WAITING";
    OrderStatus["IN_PROGRESS"] = "IN_PROGRESS";
    OrderStatus["READY"] = "READY";
    OrderStatus["COMPLETED"] = "COMPLETED"; // Завършена
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
// Статуси на заявки
var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["APPROVED"] = "APPROVED";
    RequestStatus["REJECTED"] = "REJECTED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));
// Типове транзакции
var TransactionType;
(function (TransactionType) {
    TransactionType["INCOME"] = "INCOME";
    TransactionType["EXPENSE"] = "EXPENSE"; // Разход
})(TransactionType || (exports.TransactionType = TransactionType = {}));
// Типове елементи в поръчка
var OrderItemType;
(function (OrderItemType) {
    OrderItemType["PART"] = "PART";
    OrderItemType["LABOR"] = "LABOR";
    OrderItemType["CONSUMABLE"] = "CONSUMABLE"; // Консуматив
})(OrderItemType || (exports.OrderItemType = OrderItemType = {}));
