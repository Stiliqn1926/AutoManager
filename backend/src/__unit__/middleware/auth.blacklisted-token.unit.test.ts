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

describe('authenticate - blacklisted token', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 401 when token is blacklisted', async () => {
    const req: any = { headers: { authorization: 'Bearer blacklisted-token' }, cookies: {} };
    const res = makeRes();
    const next = jest.fn();

    jest.spyOn(generateTokenUtils, 'verifyToken').mockReturnValue({
      userId: 'user-1',
      email: 'user@test.com',
      role: 'ADMIN',
      tokenVersion: 1,
    });
    jest.spyOn(tokenUtils, 'isTokenBlacklisted').mockResolvedValue(true);
    const findUniqueSpy = jest
      .spyOn(prisma.user, 'findUnique')
      .mockResolvedValue(null as any);

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Token has been revoked. Please login again.',
    });
    expect(findUniqueSpy).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});
