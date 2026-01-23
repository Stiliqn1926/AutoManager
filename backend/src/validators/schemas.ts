import Joi from 'joi';

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Невалиден имейл адрес',
    'any.required': 'Имейлът е задължителен',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .required()
    .messages({
      'string.min': 'Паролата трябва да е поне 8 символа',
      'string.pattern.base':
        'Паролата трябва да съдържа поне една главна буква, една малка буква, една цифра и един специален символ (@$!%*?&#)',
      'any.required': 'Паролата е задължителна',
    }),
  role: Joi.string().valid('ADMIN', 'CLIENT').required().messages({
    'any.only': 'Ролята трябва да е ADMIN или CLIENT',
    'any.required': 'Ролята е задължителна',
  }),
});

export const registerClientSchema = Joi.object({
  firstName: Joi.string().required().messages({
    'any.required': 'Името е задължително',
    'string.empty': 'Името е задължително',
  }),
  lastName: Joi.string().required().messages({
    'any.required': 'Фамилията е задължителна',
    'string.empty': 'Фамилията е задължителна',
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\s()-]+$/)
    .required()
    .messages({
      'any.required': 'Телефонният номер е задължителен',
      'string.empty': 'Телефонният номер е задължителен',
      'string.pattern.base': 'Невалиден телефонен номер',
    }),
  email: Joi.string().email().required().messages({
    'string.email': 'Невалиден имейл адрес',
    'any.required': 'Имейлът е задължителен',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .required()
    .messages({
      'string.min': 'Паролата трябва да е поне 8 символа',
      'string.pattern.base':
        'Паролата трябва да съдържа поне една главна буква, една малка буква, една цифра и един специален символ (@$!%*?&#)',
      'any.required': 'Паролата е задължителна',
    }),
  role: Joi.string().valid('CLIENT').default('CLIENT').optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Невалиден имейл адрес',
    'any.required': 'Имейлът е задължителен',
  }),
  password: Joi.string().required().messages({
    'any.required': 'Паролата е задължителна',
  }),
  role: Joi.string().valid('ADMIN', 'MECHANIC', 'CLIENT').optional(),
  rememberMe: Joi.boolean().optional(),
});

// ============================================
// REGISTER MECHANIC
// ============================================

export const registerMechanicSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .required()
    .messages({
      'string.min': 'Паролата трябва да е поне 8 символа',
      'string.pattern.base':
        'Паролата трябва да съдържа поне една главна буква, една малка буква, една цифра и един специален символ (@$!%*?&#)',
      'any.required': 'Паролата е задължителна',
    }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Името трябва да е поне 2 символа',
    'string.max': 'Името не може да е повече от 50 символа',
    'any.required': 'Името е задължително',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Фамилията трябва да е поне 2 символа',
    'string.max': 'Фамилията не може да е повече от 50 символа',
    'any.required': 'Фамилията е задължителна',
  }),
  phone: Joi.string()
    .pattern(/^(\+359|0)[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Телефонът трябва да е във формат 0888123456 или +359888123456',
      'any.required': 'Телефонът е задължителен',
    }),
  specialization: Joi.string().max(200).optional(),
  skills: Joi.string().max(500).optional(),
  uniqueCode: Joi.string().required().messages({
    'any.required': 'Уникалният код е задължителен',
  }),
});

// ============================================
// SERVICE COMPANY SCHEMAS
// ============================================

export const createServiceCompanySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Името на фирмата трябва да е поне 3 символа',
    'any.required': 'Името на фирмата е задължително',
  }),
  address: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Адресът трябва да е поне 5 символа',
    'any.required': 'Адресът е задължителен',
  }),
  phone: Joi.string()
    .pattern(/^(\+359|0)[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Телефонът трябва да е във формат 0888123456 или +359888123456',
      'any.required': 'Телефонът е задължителен',
    }),
  email: Joi.string().email().required().messages({
    'string.email': 'Невалиден имейл адрес',
    'any.required': 'Имейлът е задължителен',
  }),
  bulstat: Joi.string().pattern(/^[0-9]{9,13}$/).optional().messages({
    'string.pattern.base': 'Булстат трябва да е между 9 и 13 цифри',
  }),
  vatNumber: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
});

// ============================================
// CLIENT SCHEMAS
// ============================================

export const createClientSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Името трябва да е поне 2 символа',
    'any.required': 'Името е задължително',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Фамилията трябва да е поне 2 символа',
    'any.required': 'Фамилията е задължителна',
  }),
  phone: Joi.string()
    .pattern(/^(\+359|0)[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Телефонът трябва да е във формат 0888123456 или +359888123456',
      'any.required': 'Телефонът е задължителен',
    }),
  email: Joi.string().email().optional().allow(''),
  address: Joi.string().max(200).optional().allow(''),
});

export const addServiceCompanyToClientSchema = Joi.object({
  uniqueCode: Joi.string().required().messages({
    'any.required': 'Кодът на сервиза е задължителен',
  }),
  phone: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.min': 'Телефонният номер трябва да е поне 10 символа',
      'any.required': 'Телефонният номер е задължителен',
    }),
  firstName: Joi.string().min(2).max(50).optional().allow('').messages({
    'string.min': 'Името трябва да е поне 2 символа',
  }),
  lastName: Joi.string().min(2).max(50).optional().allow('').messages({
    'string.min': 'Фамилията трябва да е поне 2 символа',
  }),
});

// ============================================
// VEHICLE SCHEMAS
// ============================================

export const createVehicleSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  brand: Joi.string().min(2).max(50).required().messages({
    'any.required': 'Марката е задължителна',
  }),
  model: Joi.string().min(1).max(50).required(),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .required()
    .messages({
      'number.min': 'Годината не може да е преди 1900',
      'number.max': 'Годината не може да е в бъдещето',
    }),
  licensePlate: Joi.string().min(5).max(15).required().messages({
    'any.required': 'Регистрационният номер е задължителен',
  }),
  vin: Joi.string().length(17).optional().messages({
    'string.length': 'VIN номерът трябва да е точно 17 символа',
  }),
  color: Joi.string().max(30).optional(),
  mileage: Joi.number().integer().min(0).max(999999).optional().messages({
    'number.min': 'Километражът не може да е отрицателен',
  }),
  fuelType: Joi.string()
    .valid('Бензин', 'Дизел', 'Газ', 'Хибрид', 'Електро')
    .optional(),
  engineSize: Joi.string().max(20).optional(),
});

export const updateVehicleSchema = Joi.object({
  brand: Joi.string().min(2).max(50).required().messages({
    'any.required': 'Марката е задължителна',
  }),
  model: Joi.string().min(1).max(50).required(),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional()
    .messages({
      'number.min': 'Годината не може да е преди 1900',
      'number.max': 'Годината не може да е в бъдещето',
    }),
  licensePlate: Joi.string().min(5).max(15).required().messages({
    'any.required': 'Регистрационният номер е задължителен',
  }),
  vin: Joi.string().length(17).optional().allow('').messages({
    'string.length': 'VIN номерът трябва да е точно 17 символа',
  }),
  color: Joi.string().max(30).optional().allow(''),
  mileage: Joi.number().integer().min(0).max(999999).optional().messages({
    'number.min': 'Километражът не може да е отрицателен',
  }),
  status: Joi.string().valid('ACTIVE', 'IN_SERVICE', 'ARCHIVED').optional(),
  fuelType: Joi.string()
    .valid('Бензин', 'Дизел', 'Газ', 'Хибрид', 'Електро')
    .optional(),
  engineSize: Joi.string().max(20).optional().allow(''),
});

// ============================================
// REGISTER ADMIN WITH COMPANY
// ============================================

export const registerAdminWithCompanySchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Невалиден имейл адрес',
    'any.required': 'Имейлът е задължителен',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .required()
    .messages({
      'string.min': 'Паролата трябва да е поне 8 символа',
      'string.pattern.base':
        'Паролата трябва да съдържа поне една главна буква, една малка буква, една цифра и един специален символ (@$!%*?&#)',
      'any.required': 'Паролата е задължителна',
    }),
  companyName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Името на фирмата трябва да е поне 3 символа',
    'any.required': 'Името на фирмата е задължително',
  }),
  companyAddress: Joi.string().min(5).max(200).required().messages({
    'string.min': 'Адресът трябва да е поне 5 символа',
    'any.required': 'Адресът е задължителен',
  }),
  companyPhone: Joi.string()
    .pattern(/^(\+359|0)[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Телефонът трябва да е във формат 0888123456 или +359888123456',
      'any.required': 'Телефонът е задължителен',
    }),
  companyEmail: Joi.string().email().required().messages({
    'string.email': 'Невалиден имейл адрес на фирмата',
    'any.required': 'Имейлът на фирмата е задължителен',
  }),
  bulstat: Joi.string().pattern(/^[0-9]{9,13}$/).optional().messages({
    'string.pattern.base': 'Булстат трябва да е между 9 и 13 цифри',
  }),
  vatNumber: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
});

// ============================================
// ORDER SCHEMAS
// ============================================

export const createOrderSchema = Joi.object({
  vehicleId: Joi.string().uuid().required(),
  clientId: Joi.string().uuid().required(),
  description: Joi.string().min(10).max(1000).required().messages({
    'string.min': 'Описанието трябва да е поне 10 символа',
    'any.required': 'Описанието е задължително',
  }),
  workerId: Joi.string().uuid().optional(),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('WAITING', 'IN_PROGRESS', 'READY', 'COMPLETED').required().messages({
    'any.only': 'Невалиден статус',
    'any.required': 'Статусът е задължителен',
  }),
});

// ============================================
// ORDER ITEM SCHEMAS
// ============================================

export const createOrderItemSchema = Joi.object({
  type: Joi.string().valid('PART', 'LABOR', 'CONSUMABLE').required().messages({
    'any.only': 'Типът трябва да е PART, LABOR или CONSUMABLE',
  }),
  name: Joi.string().min(3).max(100).required(),
  quantity: Joi.number().integer().min(1).max(999).required().messages({
    'number.min': 'Количеството трябва да е поне 1',
  }),
  unitPrice: Joi.number().min(0).max(999999).required().messages({
    'number.min': 'Цената не може да е отрицателна',
  }),
  description: Joi.string().max(500).optional(),
});

// ============================================
// INVOICE SCHEMAS
// ============================================

export const createInvoiceSchema = Joi.object({
  tax: Joi.number().min(0).optional(),
  notes: Joi.string().max(500).optional(),
});

// ============================================
// SCHEDULE SCHEMAS
// ============================================

export const createScheduleSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional().allow('', null),
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),
  startTime: Joi.date().iso().required().messages({
    'date.format': 'Невалиден формат на начален час',
  }),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required().messages({
    'date.greater': 'Крайният час трябва да е след началния',
  }),
  workerId: Joi.string().uuid().optional().allow('', null),
  orderId: Joi.string().uuid().optional().allow('', null),
  status: Joi.string()
    .valid('SCHEDULED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED', 'DELAYED')
    .optional(),
  priority: Joi.string()
    .valid('LOW', 'NORMAL', 'HIGH', 'URGENT')
    .optional(),
  estimatedDuration: Joi.number().integer().min(1).optional().allow(null),
  notes: Joi.string().max(1000).optional().allow('', null),
});

// ================================
// UPDATE SCHEDULE SCHEMA  ✅ НОВО
// ================================

export const updateScheduleSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional().allow('', null),

  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).optional(),

  startTime: Joi.date().iso().optional(),
  endTime: Joi.date().iso().optional(),

  workerId: Joi.string().uuid().optional().allow('', null),
  orderId: Joi.string().uuid().optional().allow('', null),

  status: Joi.string()
    .valid('SCHEDULED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELLED', 'DELAYED')
    .optional(),

  priority: Joi.string()
    .valid('LOW', 'NORMAL', 'HIGH', 'URGENT')
    .optional(),

  estimatedDuration: Joi.number().integer().min(1).optional().allow(null, ''),

  notes: Joi.string().max(1000).optional().allow('', null),
}).min(1);


// ============================================
// FINANCE SCHEMAS
// ============================================

export const createFinanceSchema = Joi.object({
  type: Joi.string().valid('INCOME', 'EXPENSE').required().messages({
    'any.only': 'Типът трябва да е INCOME или EXPENSE',
    'any.required': 'Типът е задължителен',
  }),
  category: Joi.string()
    .valid('PARTS', 'LABOR', 'CONSUMABLES', 'RENT', 'UTILITIES', 'SALARIES', 'TAXES', 'INSURANCE', 'MARKETING', 'MAINTENANCE', 'SUPPLIES', 'OTHER')
    .required()
    .messages({
      'any.only': 'Категорията трябва да е PARTS, LABOR, CONSUMABLES, RENT, UTILITIES, SALARIES, TAXES, INSURANCE, MARKETING, MAINTENANCE, SUPPLIES или OTHER',
      'any.required': 'Категорията е задължителна',
    }),
  amount: Joi.number().min(0.01).max(999999.99).required().messages({
    'number.min': 'Сумата трябва да е поне 0.01 €.',
    'number.max': 'Сумата не може да е повече от 999999.99 €.',
    'any.required': 'Сумата е задължителна',
  }),
  description: Joi.string().min(5).max(500).required().messages({
    'string.min': 'Описанието трябва да е поне 5 символа',
    'string.max': 'Описанието не може да е повече от 500 символа',
    'any.required': 'Описанието е задължително',
  }),
  date: Joi.date().iso().optional().messages({
    'date.format': 'Невалиден формат на дата (използвай ISO: 2024-12-29)',
  }),
  notes: Joi.string().max(1000).optional(),
});

export const getFinanceFiltersSchema = Joi.object({
  type: Joi.string().valid('INCOME', 'EXPENSE').optional(),
  category: Joi.string()
    .valid('PARTS', 'LABOR', 'CONSUMABLES', 'RENT', 'UTILITIES', 'SALARIES', 'TAXES', 'INSURANCE', 'MARKETING', 'MAINTENANCE', 'SUPPLIES', 'OTHER')
    .optional(),
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'Невалиден формат на началната дата',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.min': 'Крайната дата трябва да е след началната',
  }),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
});
