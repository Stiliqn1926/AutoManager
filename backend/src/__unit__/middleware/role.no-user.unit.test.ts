import { authorize } from '../../middleware/role.middleware';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authorize - no user', () => {
  it('returns 401 when req.user is missing', () => {
    const req: any = {};
    const res = makeRes();
    const next = jest.fn();
    const middleware = authorize('ADMIN');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    expect(next).not.toHaveBeenCalled();
  });
});

