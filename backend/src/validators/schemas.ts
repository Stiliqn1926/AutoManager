import Joi from 'joi';

// ============================================
// AUTH SCHEMAS
// ============================================

export const registerSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ',
    'any.required': 'Ð˜Ð¼ÐµÐ¹Ð»ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .required()
    .messages({
      'string.min': 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
      'string.pattern.base':
        'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÑŠÐ´ÑŠÑ€Ð¶Ð° Ð¿Ð¾Ð½Ðµ ÐµÐ´Ð½Ð° Ð³Ð»Ð°Ð²Ð½Ð° Ð±ÑƒÐºÐ²Ð°, ÐµÐ´Ð½Ð° Ð¼Ð°Ð»ÐºÐ° Ð±ÑƒÐºÐ²Ð°, ÐµÐ´Ð½Ð° Ñ†Ð¸Ñ„Ñ€Ð° Ð¸ ÐµÐ´Ð¸Ð½ ÑÐ¿ÐµÑ†Ð¸Ð°Ð»ÐµÐ½ ÑÐ¸Ð¼Ð²Ð¾Ð» (@$!%*?&#)',
      'any.required': 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
    }),
  role: Joi.string().valid('ADMIN', 'CLIENT').required().messages({
    'any.only': 'Ð Ð¾Ð»ÑÑ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ ADMIN Ð¸Ð»Ð¸ CLIENT',
    'any.required': 'Ð Ð¾Ð»ÑÑ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
  }),
});

export const registerClientSchema = Joi.object({
  firstName: Joi.string().required().messages({
    'any.required': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾',
    'string.empty': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾',
  }),
  lastName: Joi.string().required().messages({
    'any.required': 'Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
    'string.empty': 'Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
  }),
  phone: Joi.string()
    .pattern(/^[0-9+\s()-]+$/)
    .required()
    .messages({
      'any.required': 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½Ð½Ð¸ÑÑ‚ Ð½Ð¾Ð¼ÐµÑ€ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
      'string.empty': 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½Ð½Ð¸ÑÑ‚ Ð½Ð¾Ð¼ÐµÑ€ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
      'string.pattern.base': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½ÐµÐ½ Ð½Ð¾Ð¼ÐµÑ€',
    }),
  email: Joi.string().email().required().messages({
    'string.email': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ',
    'any.required': 'Ð˜Ð¼ÐµÐ¹Ð»ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .required()
    .messages({
      'string.min': 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
      'string.pattern.base':
        'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÑŠÐ´ÑŠÑ€Ð¶Ð° Ð¿Ð¾Ð½Ðµ ÐµÐ´Ð½Ð° Ð³Ð»Ð°Ð²Ð½Ð° Ð±ÑƒÐºÐ²Ð°, ÐµÐ´Ð½Ð° Ð¼Ð°Ð»ÐºÐ° Ð±ÑƒÐºÐ²Ð°, ÐµÐ´Ð½Ð° Ñ†Ð¸Ñ„Ñ€Ð° Ð¸ ÐµÐ´Ð¸Ð½ ÑÐ¿ÐµÑ†Ð¸Ð°Ð»ÐµÐ½ ÑÐ¸Ð¼Ð²Ð¾Ð» (@$!%*?&#)',
      'any.required': 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
    }),
  uniqueCode: Joi.string().required().messages({
    'any.required': 'ÐšÐ¾Ð´ÑŠÑ‚ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
    'string.empty': 'ÐšÐ¾Ð´ÑŠÑ‚ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  role: Joi.string().valid('CLIENT').default('CLIENT').optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ',
    'any.required': 'Ð˜Ð¼ÐµÐ¹Ð»ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  password: Joi.string().required().messages({
    'any.required': 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
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
      'string.min': 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
      'string.pattern.base':
        'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÑŠÐ´ÑŠÑ€Ð¶Ð° Ð¿Ð¾Ð½Ðµ ÐµÐ´Ð½Ð° Ð³Ð»Ð°Ð²Ð½Ð° Ð±ÑƒÐºÐ²Ð°, ÐµÐ´Ð½Ð° Ð¼Ð°Ð»ÐºÐ° Ð±ÑƒÐºÐ²Ð°, ÐµÐ´Ð½Ð° Ñ†Ð¸Ñ„Ñ€Ð° Ð¸ ÐµÐ´Ð¸Ð½ ÑÐ¿ÐµÑ†Ð¸Ð°Ð»ÐµÐ½ ÑÐ¸Ð¼Ð²Ð¾Ð» (@$!%*?&#)',
      'any.required': 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
    }),
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 2 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'string.max': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 50 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 2 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'string.max': 'Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 50 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
  }),
  phone: Joi.string()
    .pattern(/^(\+359|0)[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð²ÑŠÐ² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ 0888123456 Ð¸Ð»Ð¸ +359888123456',
      'any.required': 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
    }),
  specialization: Joi.string().max(200).optional(),
  skills: Joi.string().max(500).optional(),
  uniqueCode: Joi.string().required().messages({
    'any.required': 'Ð£Ð½Ð¸ÐºÐ°Ð»Ð½Ð¸ÑÑ‚ ÐºÐ¾Ð´ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
});

// ============================================
// SERVICE COMPANY SCHEMAS
// ============================================

export const createServiceCompanySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 3 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾',
  }),
  address: Joi.string().min(5).max(200).required().messages({
    'string.min': 'ÐÐ´Ñ€ÐµÑÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 5 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'ÐÐ´Ñ€ÐµÑÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  phone: Joi.string()
    .pattern(/^(\+359|0)[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð²ÑŠÐ² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ 0888123456 Ð¸Ð»Ð¸ +359888123456',
      'any.required': 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
    }),
  email: Joi.string().email().required().messages({
    'string.email': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ',
    'any.required': 'Ð˜Ð¼ÐµÐ¹Ð»ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  bulstat: Joi.string().pattern(/^[0-9]{9,13}$/).optional().messages({
    'string.pattern.base': 'Ð‘ÑƒÐ»ÑÑ‚Ð°Ñ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¼ÐµÐ¶Ð´Ñƒ 9 Ð¸ 13 Ñ†Ð¸Ñ„Ñ€Ð¸',
  }),
  vatNumber: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
});

// ============================================
// CLIENT SCHEMAS
// ============================================

export const createClientSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 2 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 2 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
  }),
  phone: Joi.string()
    .pattern(/^(\+359|0)[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð²ÑŠÐ² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ 0888123456 Ð¸Ð»Ð¸ +359888123456',
      'any.required': 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
    }),
  email: Joi.string().email().optional().allow(''),
  address: Joi.string().max(200).optional().allow(''),
});

export const addServiceCompanyToClientSchema = Joi.object({
  uniqueCode: Joi.string().required().messages({
    'any.required': 'ÐšÐ¾Ð´ÑŠÑ‚ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  phone: Joi.string()
    .min(10)
    .required()
    .messages({
      'string.min': 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½Ð½Ð¸ÑÑ‚ Ð½Ð¾Ð¼ÐµÑ€ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 10 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
      'any.required': 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½Ð½Ð¸ÑÑ‚ Ð½Ð¾Ð¼ÐµÑ€ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
    }),
  firstName: Joi.string().min(2).max(50).optional().allow('').messages({
    'string.min': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 2 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
  }),
  lastName: Joi.string().min(2).max(50).optional().allow('').messages({
    'string.min': 'Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 2 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
  }),
});

// ============================================
// VEHICLE SCHEMAS
// ============================================

export const createVehicleSchema = Joi.object({
  clientId: Joi.string().uuid().required(),
  brand: Joi.string().min(2).max(50).required().messages({
    'any.required': 'ÐœÐ°Ñ€ÐºÐ°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
  }),
  model: Joi.string().min(1).max(50).required(),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .required()
    .messages({
      'number.min': 'Ð“Ð¾Ð´Ð¸Ð½Ð°Ñ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ñ€ÐµÐ´Ð¸ 1900',
      'number.max': 'Ð“Ð¾Ð´Ð¸Ð½Ð°Ñ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð² Ð±ÑŠÐ´ÐµÑ‰ÐµÑ‚Ð¾',
    }),
  licensePlate: Joi.string().min(5).max(15).required().messages({
    'any.required': 'Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ð¾Ð½Ð½Ð¸ÑÑ‚ Ð½Ð¾Ð¼ÐµÑ€ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  vin: Joi.string().length(17).optional().messages({
    'string.length': 'VIN Ð½Ð¾Ð¼ÐµÑ€ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ñ‚Ð¾Ñ‡Ð½Ð¾ 17 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
  }),
  color: Joi.string().max(30).optional(),
  mileage: Joi.number().integer().min(0).max(999999).optional().messages({
    'number.min': 'ÐšÐ¸Ð»Ð¾Ð¼ÐµÑ‚Ñ€Ð°Ð¶ÑŠÑ‚ Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¾Ñ‚Ñ€Ð¸Ñ†Ð°Ñ‚ÐµÐ»ÐµÐ½',
  }),
  fuelType: Joi.string()
    .valid('Ð‘ÐµÐ½Ð·Ð¸Ð½', 'Ð”Ð¸Ð·ÐµÐ»', 'Ð“Ð°Ð·', 'Ð¥Ð¸Ð±Ñ€Ð¸Ð´', 'Ð•Ð»ÐµÐºÑ‚Ñ€Ð¾')
    .optional(),
  engineSize: Joi.string().max(20).optional(),
});

export const updateVehicleSchema = Joi.object({
  brand: Joi.string().min(2).max(50).required().messages({
    'any.required': 'ÐœÐ°Ñ€ÐºÐ°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
  }),
  model: Joi.string().min(1).max(50).required(),
  year: Joi.number()
    .integer()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional()
    .messages({
      'number.min': 'Ð“Ð¾Ð´Ð¸Ð½Ð°Ñ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ñ€ÐµÐ´Ð¸ 1900',
      'number.max': 'Ð“Ð¾Ð´Ð¸Ð½Ð°Ñ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð² Ð±ÑŠÐ´ÐµÑ‰ÐµÑ‚Ð¾',
    }),
  licensePlate: Joi.string().min(5).max(15).required().messages({
    'any.required': 'Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ð¾Ð½Ð½Ð¸ÑÑ‚ Ð½Ð¾Ð¼ÐµÑ€ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  vin: Joi.string().length(17).optional().allow('').messages({
    'string.length': 'VIN Ð½Ð¾Ð¼ÐµÑ€ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ñ‚Ð¾Ñ‡Ð½Ð¾ 17 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
  }),
  color: Joi.string().max(30).optional().allow(''),
  mileage: Joi.number().integer().min(0).max(999999).optional().messages({
    'number.min': 'ÐšÐ¸Ð»Ð¾Ð¼ÐµÑ‚Ñ€Ð°Ð¶ÑŠÑ‚ Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¾Ñ‚Ñ€Ð¸Ñ†Ð°Ñ‚ÐµÐ»ÐµÐ½',
  }),
  fuelType: Joi.string()
    .valid('Ð‘ÐµÐ½Ð·Ð¸Ð½', 'Ð”Ð¸Ð·ÐµÐ»', 'Ð“Ð°Ð·', 'Ð¥Ð¸Ð±Ñ€Ð¸Ð´', 'Ð•Ð»ÐµÐºÑ‚Ñ€Ð¾')
    .optional(),
  engineSize: Joi.string().max(20).optional().allow(''),
});

// ============================================
// REGISTER ADMIN WITH COMPANY
// ============================================

export const registerAdminWithCompanySchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ',
    'any.required': 'Ð˜Ð¼ÐµÐ¹Ð»ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/)
    .required()
    .messages({
      'string.min': 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
      'string.pattern.base':
        'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÑŠÐ´ÑŠÑ€Ð¶Ð° Ð¿Ð¾Ð½Ðµ ÐµÐ´Ð½Ð° Ð³Ð»Ð°Ð²Ð½Ð° Ð±ÑƒÐºÐ²Ð°, ÐµÐ´Ð½Ð° Ð¼Ð°Ð»ÐºÐ° Ð±ÑƒÐºÐ²Ð°, ÐµÐ´Ð½Ð° Ñ†Ð¸Ñ„Ñ€Ð° Ð¸ ÐµÐ´Ð¸Ð½ ÑÐ¿ÐµÑ†Ð¸Ð°Ð»ÐµÐ½ ÑÐ¸Ð¼Ð²Ð¾Ð» (@$!%*?&#)',
      'any.required': 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
    }),
  companyName: Joi.string().min(3).max(100).required().messages({
    'string.min': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 3 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'Ð˜Ð¼ÐµÑ‚Ð¾ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾',
  }),
  companyAddress: Joi.string().min(5).max(200).required().messages({
    'string.min': 'ÐÐ´Ñ€ÐµÑÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 5 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'ÐÐ´Ñ€ÐµÑÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  companyPhone: Joi.string()
    .pattern(/^(\+359|0)[0-9]{9}$/)
    .required()
    .messages({
      'string.pattern.base':
        'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð²ÑŠÐ² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ 0888123456 Ð¸Ð»Ð¸ +359888123456',
      'any.required': 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
    }),
  companyEmail: Joi.string().email().required().messages({
    'string.email': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð°',
    'any.required': 'Ð˜Ð¼ÐµÐ¹Ð»ÑŠÑ‚ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  bulstat: Joi.string().pattern(/^[0-9]{9,13}$/).optional().messages({
    'string.pattern.base': 'Ð‘ÑƒÐ»ÑÑ‚Ð°Ñ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¼ÐµÐ¶Ð´Ñƒ 9 Ð¸ 13 Ñ†Ð¸Ñ„Ñ€Ð¸',
  }),
  vatNumber: Joi.string().optional(),
  description: Joi.string().max(500).optional(),
});

export const adminRegistrationCheckoutSessionSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ',
    'any.required': 'Ð˜Ð¼ÐµÐ¹Ð»ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
});

// ============================================
// ORDER SCHEMAS
// ============================================

export const createOrderSchema = Joi.object({
  vehicleId: Joi.string().uuid().required(),
  clientId: Joi.string().uuid().required(),
  description: Joi.string().min(10).max(1000).required().messages({
    'string.min': 'ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 10 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸ÐµÑ‚Ð¾ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾',
  }),
  workerId: Joi.string().uuid().optional(),
  startDate: Joi.date().iso().optional().allow('', null),
  endDate: Joi.date().iso().optional().allow('', null),
});

export const updateOrderStatusSchema = Joi.object({
  status: Joi.string().valid('WAITING', 'IN_PROGRESS', 'READY', 'COMPLETED').required().messages({
    'any.only': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ ÑÑ‚Ð°Ñ‚ÑƒÑ',
    'any.required': 'Ð¡Ñ‚Ð°Ñ‚ÑƒÑÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
});

// ============================================
// ORDER ITEM SCHEMAS
// ============================================

export const createOrderItemSchema = Joi.object({
  type: Joi.string().valid('PART', 'LABOR', 'CONSUMABLE').required().messages({
    'any.only': 'Ð¢Ð¸Ð¿ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ PART, LABOR Ð¸Ð»Ð¸ CONSUMABLE',
  }),
  name: Joi.string().min(3).max(100).required(),
  quantity: Joi.number().integer().min(1).max(999).required().messages({
    'number.min': 'ÐšÐ¾Ð»Ð¸Ñ‡ÐµÑÑ‚Ð²Ð¾Ñ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 1',
  }),
  unitPrice: Joi.number().min(0).max(999999).required().messages({
    'number.min': 'Ð¦ÐµÐ½Ð°Ñ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¾Ñ‚Ñ€Ð¸Ñ†Ð°Ñ‚ÐµÐ»Ð½Ð°',
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
    'date.format': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ Ð½Ð° Ð½Ð°Ñ‡Ð°Ð»ÐµÐ½ Ñ‡Ð°Ñ',
  }),
  endTime: Joi.date().iso().greater(Joi.ref('startTime')).required().messages({
    'date.greater': 'ÐšÑ€Ð°Ð¹Ð½Ð¸ÑÑ‚ Ñ‡Ð°Ñ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ ÑÐ»ÐµÐ´ Ð½Ð°Ñ‡Ð°Ð»Ð½Ð¸Ñ',
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
    'any.only': 'Ð¢Ð¸Ð¿ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ INCOME Ð¸Ð»Ð¸ EXPENSE',
    'any.required': 'Ð¢Ð¸Ð¿ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½',
  }),
  category: Joi.string()
    .valid('PARTS', 'LABOR', 'CONSUMABLES', 'RENT', 'UTILITIES', 'SALARIES', 'TAXES', 'INSURANCE', 'MARKETING', 'MAINTENANCE', 'SUPPLIES', 'OTHER')
    .required()
    .messages({
      'any.only': 'ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑÑ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ PARTS, LABOR, CONSUMABLES, RENT, UTILITIES, SALARIES, TAXES, INSURANCE, MARKETING, MAINTENANCE, SUPPLIES Ð¸Ð»Ð¸ OTHER',
      'any.required': 'ÐšÐ°Ñ‚ÐµÐ³Ð¾Ñ€Ð¸ÑÑ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
    }),
  amount: Joi.number().min(0.01).max(999999.99).required().messages({
    'number.min': 'Ð¡ÑƒÐ¼Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 0.01 â‚¬.',
    'number.max': 'Ð¡ÑƒÐ¼Ð°Ñ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 999999.99 â‚¬.',
    'any.required': 'Ð¡ÑƒÐ¼Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°',
  }),
  description: Joi.string().min(5).max(500).required().messages({
    'string.min': 'ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸ÐµÑ‚Ð¾ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 5 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'string.max': 'ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸ÐµÑ‚Ð¾ Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 500 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°',
    'any.required': 'ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸ÐµÑ‚Ð¾ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾',
  }),
  date: Joi.date().iso().optional().messages({
    'date.format': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ Ð½Ð° Ð´Ð°Ñ‚Ð° (Ð¸Ð·Ð¿Ð¾Ð»Ð·Ð²Ð°Ð¹ ISO: 2024-12-29)',
  }),
  notes: Joi.string().max(1000).optional(),
});

export const getFinanceFiltersSchema = Joi.object({
  type: Joi.string().valid('INCOME', 'EXPENSE').optional(),
  category: Joi.string()
    .valid('PARTS', 'LABOR', 'CONSUMABLES', 'RENT', 'UTILITIES', 'SALARIES', 'TAXES', 'INSURANCE', 'MARKETING', 'MAINTENANCE', 'SUPPLIES', 'OTHER')
    .optional(),
  startDate: Joi.date().iso().optional().messages({
    'date.format': 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ Ð½Ð° Ð½Ð°Ñ‡Ð°Ð»Ð½Ð°Ñ‚Ð° Ð´Ð°Ñ‚Ð°',
  }),
  endDate: Joi.date().iso().min(Joi.ref('startDate')).optional().messages({
    'date.min': 'ÐšÑ€Ð°Ð¹Ð½Ð°Ñ‚Ð° Ð´Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ ÑÐ»ÐµÐ´ Ð½Ð°Ñ‡Ð°Ð»Ð½Ð°Ñ‚Ð°',
  }),
  page: Joi.number().integer().min(1).optional().default(1),
  limit: Joi.number().integer().min(1).max(100).optional().default(20),
});

