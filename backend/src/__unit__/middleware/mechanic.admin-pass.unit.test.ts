const mockWorkerFindUnique = jest.fn();
const mockMembershipFindFirst = jest.fn();

jest.mock('../../config/database', () => ({
  __esModule: true,
  default: {
    worker: {
      findUnique: (...args: unknown[]) => mockWorkerFindUnique(...args),
    },
    mechanicServiceCompany: {
      findFirst: (...args: unknown[]) => mockMembershipFindFirst(...args),
    },
  },
}));

import { requireActiveService } from '../../middleware/mechanicServiceCheck.middleware';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('requireActiveService - admin bypass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls next immediately for ADMIN user', async () => {
    const req: any = {
      user: {
        userId: 'admin-1',
        email: 'admin@test.com',
        role: 'ADMIN',
      },
    };
    const res = makeRes();
    const next = jest.fn();

    await requireActiveService(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(mockWorkerFindUnique).not.toHaveBeenCalled();
    expect(mockMembershipFindFirst).not.toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});


