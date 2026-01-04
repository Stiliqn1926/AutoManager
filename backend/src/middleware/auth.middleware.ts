import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/generateToken';
// Импортираме функцията за проверка на blacklist
import { isTokenBlacklisted } from '../utils/tokenUtils';

interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
    serviceCompanyId?: string;
  };
}

/**
 * AUTHENTICATION MIDDLEWARE С BLACKLIST ПРОВЕРКА
 *
 * Това е middleware което се изпълнява ПРЕДИ всяка protected route.
 * Проверява дали user-ът е authenticated и дали токенът му е валиден.
 *
 * ПРЕДИ (без blacklist):
 * 1. Извличаме token от Authorization header
 * 2. Decode-ваме и verify-ваме JWT токена
 * 3. Ако е валиден - пускаме заявката
 * 4. ПРОБЛЕМ: При logout токенът все още работи до края на expiration!
 *
 * СЕГА (с blacklist):
 * 1. Извличаме token от Authorization header
 * 2. Decode-ваме и verify-ваме JWT токена (проверка на signature и expiration)
 * 3. 🆕 ПРОВЕРЯВАМЕ ДАЛИ ТОКЕНЪТ Е В BLACKLIST
 * 4. Ако е blacklisted - отхвърляме заявката
 * 5. Ако е валиден и НЕ Е blacklisted - пускаме заявката
 *
 * КАК РАБОТИ BLACKLIST ПРОВЕРКАТА:
 * - При logout добавяме токена в blacklisted_tokens таблица
 * - Тук проверяваме дали токенът съществува в тази таблица
 * - Използваме DB index за бързина (check-ва се при ВСЯКА заявка!)
 * - След като токенът изтече естествено, cleanup job го изтрива от blacklist
 *
 * PERFORMANCE:
 * - Blacklist проверката е БЪРЗА защото:
 *   1. Имаме index на token колоната
 *   2. Токените са кратки (15 min expiration)
 *   3. Cleanup job изтрива старите редовно
 * - Типично blacklist таблицата съдържа малко записи
 */
export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Извличаме токена от Authorization header
    // Format: "Bearer <token>"
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    // 2. Verify-ваме JWT токена
    // Това проверява:
    // - Валидна ли е signature-ата (не е манипулиран)
    // - Не е ли изтекъл (exp claim)
    // - Използва ли правилния algorithm (HS256)
    const decoded = verifyToken(token);

    // 3. 🆕 ПРОВЕРЯВАМЕ BLACKLIST
    // Това е критичната част! Ако токенът е blacklisted,
    // той НЕ ТРЯБВА да работи дори ако е технически валиден JWT
    const blacklisted = await isTokenBlacklisted(token);

    if (blacklisted) {
      // Токенът е в blacklist - вероятно user е logout-нал
      // или паролата е била сменена
      res.status(401).json({
        message: 'Token has been revoked. Please login again.',
      });
      return;
    }

    // 4. Всичко е OK - прикачаме user данните към request
    // Следващите middleware-и и route handlers ще имат достъп до req.user
    req.user = decoded;

    // 5. Пускаме заявката напред
    next();
  } catch (error) {
    // JWT verification failed (невалиден token, изтекъл, etc.)
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};