import prisma from '../../config/database';
import * as generateTokenUtils from '../../utils/generateToken';
import * as tokenUtils from '../../utils/tokenUtils';
import { authenticate } from '../../middleware/auth.middleware';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate - inactive user', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 401 when user is inactive', async () => {
    const req: any = { headers: { authorization: 'Bearer valid-token' }, cookies: {} };
    const res = makeRes();
    const next = jest.fn();

    jest.spyOn(generateTokenUtils, 'verifyToken').mockReturnValue({
      userId: 'user-1',
      email: 'user@test.com',
      role: 'ADMIN',
      tokenVersion: 1,
    });
    jest.spyOn(tokenUtils, 'isTokenBlacklisted').mockResolvedValue(false);
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-1',
      isActive: false,
      tokenVersion: 1,
    } as any);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid or expired token' });
    expect(next).not.toHaveBeenCalled();
  });
});
