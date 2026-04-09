jest.mock('../../utils/generateToken', () => ({
  verifyToken: jest.fn(),
}));

jest.mock('../../utils/tokenUtils', () => ({
  isTokenBlacklisted: jest.fn(),
}));

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

import prisma from '../../config/database';
import { verifyToken } from '../../utils/generateToken';
import { isTokenBlacklisted } from '../../utils/tokenUtils';
import { authenticate } from '../../middleware/auth.middleware';

const mockVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockIsTokenBlacklisted = isTokenBlacklisted as jest.MockedFunction<typeof isTokenBlacklisted>;
const mockFindUnique = (prisma as any).user.findUnique as jest.Mock;

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authenticate - missing token', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when token is missing', async () => {
    const req: any = { headers: {}, cookies: {} };
    const res = makeRes();
    const next = jest.fn();

    await authenticate(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'No token provided' });
    expect(next).not.toHaveBeenCalled();
  });
});

