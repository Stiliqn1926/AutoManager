import { authorize } from '../../middleware/role.middleware';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('authorize - forbidden role', () => {
  it('returns 403 when user role is not allowed', () => {
    const req: any = { user: { userId: 'u1', email: 'x@test.com', role: 'CLIENT' } };
    const res = makeRes();
    const next = jest.fn();
    const middleware = authorize('ADMIN');

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Forbidden: Insufficient permissions',
    });
    expect(next).not.toHaveBeenCalled();
  });
});


