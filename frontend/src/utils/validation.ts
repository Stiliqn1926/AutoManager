// ============================================
// EMAIL VALIDATION
// ============================================
export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') return 'Ð˜Ð¼ÐµÐ¹Ð»ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ';
  return null;
};

// ============================================
// PASSWORD VALIDATION
// ============================================
export const validatePassword = (password: string): string | null => {
  if (!password || password.trim() === '') return 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°';
  if (password.length < 8) return 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°';


  if (!/[A-Z]/.test(password)) {
    return 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÑŠÐ´ÑŠÑ€Ð¶Ð° Ð¿Ð¾Ð½Ðµ ÐµÐ´Ð½Ð° Ð³Ð»Ð°Ð²Ð½Ð° Ð±ÑƒÐºÐ²Ð°';
  }


  if (!/[a-z]/.test(password)) {
    return 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÑŠÐ´ÑŠÑ€Ð¶Ð° Ð¿Ð¾Ð½Ðµ ÐµÐ´Ð½Ð° Ð¼Ð°Ð»ÐºÐ° Ð±ÑƒÐºÐ²Ð°';
  }


  if (!/\d/.test(password)) {
    return 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÑŠÐ´ÑŠÑ€Ð¶Ð° Ð¿Ð¾Ð½Ðµ ÐµÐ´Ð½Ð° Ñ†Ð¸Ñ„Ñ€Ð°';
  }


  if (!/[@$!%*?&#]/.test(password)) {
    return 'ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÑŠÐ´ÑŠÑ€Ð¶Ð° Ð¿Ð¾Ð½Ðµ ÐµÐ´Ð¸Ð½ ÑÐ¿ÐµÑ†Ð¸Ð°Ð»ÐµÐ½ ÑÐ¸Ð¼Ð²Ð¾Ð» (@$!%*?&#)';
  }

  return null;
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): string | null => {
  if (password !== confirmPassword) return 'ÐŸÐ°Ñ€Ð¾Ð»Ð¸Ñ‚Ðµ Ð½Ðµ ÑÑŠÐ²Ð¿Ð°Ð´Ð°Ñ‚';
  return null;
};

// ============================================
// PASSWORD STRENGTH CALCULATION
// ============================================
export const calculatePasswordStrength = (
  password: string
): {
  score: number;
  label: string;
  color: string;
} => {
  if (!password) {
    return { score: 0, label: 'ÐœÐ½Ð¾Ð³Ð¾ ÑÐ»Ð°Ð±Ð°', color: 'bg-gray-300' };
  }

  let score = 0;


  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;


  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&#]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Ð¡Ð»Ð°Ð±Ð°', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Ð¡Ñ€ÐµÐ´Ð½Ð°', color: 'bg-yellow-500' };
  if (score <= 6) return { score, label: 'Ð”Ð¾Ð±Ñ€Ð°', color: 'bg-green-500' };
  return { score, label: 'ÐžÑ‚Ð»Ð¸Ñ‡Ð½Ð°', color: 'bg-green-600' };
};

// ============================================
// PHONE VALIDATION
// ============================================
export const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === '') return 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½';
  
  // Remove spaces and dashes
  const cleanedPhone = phone.replace(/[\s-]/g, '');
  
  // Accept both formats: 0888123456 or +359888123456
  const phoneRegex = /^(\+359|0)[0-9]{9}$/;
  
  if (!phoneRegex.test(cleanedPhone)) {
    return 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð²ÑŠÐ² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚ 0888123456 Ð¸Ð»Ð¸ +359888123456';
  }
  
  return null;
};

// ============================================
// NAME VALIDATION
// ============================================
export const validateName = (
  name: string,
  fieldName: string = 'ÐŸÐ¾Ð»ÐµÑ‚Ð¾'
): string | null => {
  if (!name || name.trim() === '') return `${fieldName} Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾`;
  if (name.length < 2) return `${fieldName} Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 2 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°`;
  if (name.length > 50) return `${fieldName} Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 50 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°`;
  return null;
};

// ============================================
// COMPANY NAME VALIDATION
// ============================================
export const validateCompanyName = (name: string): string | null => {
  if (!name || name.trim() === '') return 'Ð˜Ð¼ÐµÑ‚Ð¾ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾';
  if (name.length < 3) return 'Ð˜Ð¼ÐµÑ‚Ð¾ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 3 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°';
  if (name.length > 100)
    return 'Ð˜Ð¼ÐµÑ‚Ð¾ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 100 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°';
  return null;
};

// ============================================
// ADDRESS VALIDATION
// ============================================
export const validateAddress = (address: string): string | null => {
  if (!address || address.trim() === '') return 'ÐÐ´Ñ€ÐµÑÑŠÑ‚ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½';
  if (address.length < 5) return 'ÐÐ´Ñ€ÐµÑÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 5 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°';
  if (address.length > 200)
    return 'ÐÐ´Ñ€ÐµÑÑŠÑ‚ Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 200 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°';
  return null;
};

// ============================================
// BULSTAT VALIDATION
// ============================================
export const validateBulstat = (bulstat: string): string | null => {
  if (!bulstat || bulstat.trim() === '') return null;

  const bulstatRegex = /^[0-9]{9,13}$/;
  if (!bulstatRegex.test(bulstat)) {
    return 'Ð‘ÑƒÐ»ÑÑ‚Ð°Ñ‚ÑŠÑ‚ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¼ÐµÐ¶Ð´Ñƒ 9 Ð¸ 13 Ñ†Ð¸Ñ„Ñ€Ð¸';
  }

  return null;
};

// ============================================
// UNIQUE CODE VALIDATION
// ============================================
export const validateUniqueCode = (code: string): string | null => {
  if (!code || code.trim() === '') return 'Ð£Ð½Ð¸ÐºÐ°Ð»Ð½Ð¸ÑÑ‚ ÐºÐ¾Ð´ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½';
  if (code.length < 3) return 'Ð£Ð½Ð¸ÐºÐ°Ð»Ð½Ð¸ÑÑ‚ ÐºÐ¾Ð´ Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 3 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°';
  return null;
};

// ============================================
// SPECIALIZATION VALIDATION (OPTIONAL)
// ============================================
export const validateSpecialization = (
  specialization: string
): string | null => {
  if (!specialization || specialization.trim() === '') return null;
  if (specialization.length > 200)
    return 'Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸ÑÑ‚Ð° Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 200 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°';
  return null;
};

// ============================================
// SKILLS VALIDATION (OPTIONAL)
// ============================================
export const validateSkills = (skills: string): string | null => {
  if (!skills || skills.trim() === '') return null;
  if (skills.length > 500)
    return 'Ð£Ð¼ÐµÐ½Ð¸ÑÑ‚Ð° Ð½Ðµ Ð¼Ð¾Ð³Ð°Ñ‚ Ð´Ð° ÑÐ° Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 500 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°';
  return null;
};

// ============================================
// DESCRIPTION VALIDATION (OPTIONAL)
// ============================================
export const validateDescription = (
  description: string
): string | null => {
  if (!description || description.trim() === '') return null;
  if (description.length > 500)
    return 'ÐžÐ¿Ð¸ÑÐ°Ð½Ð¸ÐµÑ‚Ð¾ Ð½Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ðµ Ð¿Ð¾Ð²ÐµÑ‡Ðµ Ð¾Ñ‚ 500 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°';
  return null;
};

// ============================================
// VAT NUMBER VALIDATION (OPTIONAL)
// ============================================
export const validateVatNumber = (vatNumber: string): string | null => {
  if (!vatNumber || vatNumber.trim() === '') return null;
  return null;
};

// ============================================
// REQUIRED FIELD VALIDATION
// ============================================
export const validateRequired = (
  value: string,
  fieldName: string = 'ÐŸÐ¾Ð»ÐµÑ‚Ð¾'
): string | null => {
  if (!value || value.trim() === '') return `${fieldName} Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾`;
  return null;
};

// ============================================
// CHECKBOX VALIDATION
// ============================================
export const validateCheckbox = (
  isChecked: boolean,
  message: string = 'Ð¢Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÐµ ÑÑŠÐ³Ð»Ð°ÑÐ¸Ñ‚Ðµ'
): string | null => {
  if (!isChecked) return message;
  return null;
};

