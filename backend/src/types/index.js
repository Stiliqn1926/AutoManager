"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderItemType = exports.TransactionType = exports.RequestStatus = exports.OrderStatus = exports.UserRole = void 0;

var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["MECHANIC"] = "MECHANIC";
    UserRole["CLIENT"] = "CLIENT";
})(UserRole || (exports.UserRole = UserRole = {}));

var OrderStatus;
(function (OrderStatus) {
    OrderStatus["WAITING"] = "WAITING";
    OrderStatus["IN_PROGRESS"] = "IN_PROGRESS";
    OrderStatus["READY"] = "READY";
    OrderStatus["COMPLETED"] = "COMPLETED";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));

var RequestStatus;
(function (RequestStatus) {
    RequestStatus["PENDING"] = "PENDING";
    RequestStatus["APPROVED"] = "APPROVED";
    RequestStatus["REJECTED"] = "REJECTED";
})(RequestStatus || (exports.RequestStatus = RequestStatus = {}));

var TransactionType;
(function (TransactionType) {
    TransactionType["INCOME"] = "INCOME";
    TransactionType["EXPENSE"] = "EXPENSE";
})(TransactionType || (exports.TransactionType = TransactionType = {}));

var OrderItemType;
(function (OrderItemType) {
    OrderItemType["PART"] = "PART";
    OrderItemType["LABOR"] = "LABOR";
    OrderItemType["CONSUMABLE"] = "CONSUMABLE";
})(OrderItemType || (exports.OrderItemType = OrderItemType = {}));

