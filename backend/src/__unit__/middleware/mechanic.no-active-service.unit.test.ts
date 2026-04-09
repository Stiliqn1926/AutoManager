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

describe('requireActiveService - no active service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 403 for mechanic without selected service', async () => {
    const req: any = {
      user: {
        userId: 'u1',
        email: 'm@test.com',
        role: 'MECHANIC',
      },
    };
    const res = makeRes();
    const next = jest.fn();

    mockWorkerFindUnique.mockResolvedValue({
      id: 'worker-1',
      serviceCompanyId: null,
    });

    await requireActiveService(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No active service company selected',
      code: 'NO_ACTIVE_SERVICE',
    });
    expect(mockMembershipFindFirst).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
});


