// ============================================
// EMAIL VALIDATION
// ============================================
export const validateEmail = (email: string): string | null => {
  if (!email || email.trim() === '') return 'Имейлът е задължителен';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return 'Невалиден имейл адрес';
  return null;
};

// ============================================
// PASSWORD VALIDATION
// ============================================
export const validatePassword = (password: string): string | null => {
  if (!password || password.trim() === '') return 'Паролата е задължителна';
  if (password.length < 8) return 'Паролата трябва да е поне 8 символа';


  if (!/[A-Z]/.test(password)) {
    return 'Паролата трябва да съдържа поне една главна буква';
  }


  if (!/[a-z]/.test(password)) {
    return 'Паролата трябва да съдържа поне една малка буква';
  }


  if (!/\d/.test(password)) {
    return 'Паролата трябва да съдържа поне една цифра';
  }


  if (!/[@$!%*?&#]/.test(password)) {
    return 'Паролата трябва да съдържа поне един специален символ (@$!%*?&#)';
  }

  return null;
};

export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): string | null => {
  if (password !== confirmPassword) return 'Паролите не съвпадат';
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
    return { score: 0, label: 'Много слаба', color: 'bg-gray-300' };
  }

  let score = 0;


  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;


  if (/[a-z]/.test(password)) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[@$!%*?&#]/.test(password)) score += 1;

  if (score <= 2) return { score, label: 'Слаба', color: 'bg-red-500' };
  if (score <= 4) return { score, label: 'Средна', color: 'bg-yellow-500' };
  if (score <= 6) return { score, label: 'Добра', color: 'bg-green-500' };
  return { score, label: 'Отлична', color: 'bg-green-600' };
};

// ============================================
// PHONE VALIDATION
// ============================================
export const validatePhone = (phone: string): string | null => {
  if (!phone || phone.trim() === '') return 'Телефонът е задължителен';
  
  // Remove spaces and dashes
  const cleanedPhone = phone.replace(/[\s-]/g, '');
  
  // Accept both formats: 0888123456 or +359888123456
  const phoneRegex = /^(\+359|0)[0-9]{9}$/;
  
  if (!phoneRegex.test(cleanedPhone)) {
    return 'Телефонът трябва да е във формат 0888123456 или +359888123456';
  }
  
  return null;
};

// ============================================
// NAME VALIDATION
// ============================================
export const validateName = (
  name: string,
  fieldName: string = 'Полето'
): string | null => {
  if (!name || name.trim() === '') return `${fieldName} е задължително`;
  if (name.length < 2) return `${fieldName} трябва да е поне 2 символа`;
  if (name.length > 50) return `${fieldName} не може да е повече от 50 символа`;
  return null;
};

// ============================================
// COMPANY NAME VALIDATION
// ============================================
export const validateCompanyName = (name: string): string | null => {
  if (!name || name.trim() === '') return 'Името на фирмата е задължително';
  if (name.length < 3) return 'Името на фирмата трябва да е поне 3 символа';
  if (name.length > 100)
    return 'Името на фирмата не може да е повече от 100 символа';
  return null;
};

// ============================================
// ADDRESS VALIDATION
// ============================================
export const validateAddress = (address: string): string | null => {
  if (!address || address.trim() === '') return 'Адресът е задължителен';
  if (address.length < 5) return 'Адресът трябва да е поне 5 символа';
  if (address.length > 200)
    return 'Адресът не може да е повече от 200 символа';
  return null;
};

// ============================================
// BULSTAT VALIDATION
// ============================================
export const validateBulstat = (bulstat: string): string | null => {
  if (!bulstat || bulstat.trim() === '') return null;

  const bulstatRegex = /^[0-9]{9,13}$/;
  if (!bulstatRegex.test(bulstat)) {
    return 'Булстатът трябва да е между 9 и 13 цифри';
  }

  return null;
};

// ============================================
// UNIQUE CODE VALIDATION
// ============================================
export const validateUniqueCode = (code: string): string | null => {
  if (!code || code.trim() === '') return 'Уникалният код е задължителен';
  if (code.length < 3) return 'Уникалният код трябва да е поне 3 символа';
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
    return 'Специализацията не може да е повече от 200 символа';
  return null;
};

// ============================================
// SKILLS VALIDATION (OPTIONAL)
// ============================================
export const validateSkills = (skills: string): string | null => {
  if (!skills || skills.trim() === '') return null;
  if (skills.length > 500)
    return 'Уменията не могат да са повече от 500 символа';
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
    return 'Описанието не може да е повече от 500 символа';
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
  fieldName: string = 'Полето'
): string | null => {
  if (!value || value.trim() === '') return `${fieldName} е задължително`;
  return null;
};

// ============================================
// CHECKBOX VALIDATION
// ============================================
export const validateCheckbox = (
  isChecked: boolean,
  message: string = 'Трябва да се съгласите'
): string | null => {
  if (!isChecked) return message;
  return null;
};

