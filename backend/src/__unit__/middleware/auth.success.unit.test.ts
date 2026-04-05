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

describe('authenticate - success', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sets req.user and calls next for valid token', async () => {
    const req: any = { headers: { authorization: 'Bearer valid-token' }, cookies: {} };
    const res = makeRes();
    const next = jest.fn();

    const decoded = {
      userId: 'user-1',
      email: 'user@test.com',
      role: 'ADMIN',
      tokenVersion: 2,
    };

    jest.spyOn(generateTokenUtils, 'verifyToken').mockReturnValue(decoded);
    jest.spyOn(tokenUtils, 'isTokenBlacklisted').mockResolvedValue(false);
    jest.spyOn(prisma.user, 'findUnique').mockResolvedValue({
      id: 'user-1',
      isActive: true,
      tokenVersion: 2,
    } as any);

    await authenticate(req, res, next);

    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});
