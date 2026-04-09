import { generateToken } from '../../utils/generateToken';

describe('generateToken - missing JWT_SECRET', () => {
  it('throws error when JWT_SECRET is not defined', () => {
    const original = process.env.JWT_SECRET;
    delete process.env.JWT_SECRET;

    expect(() =>
      generateToken({
        userId: 'u1',
        email: 'user@test.com',
        role: 'ADMIN',
      })
    ).toThrow('JWT_SECRET is not defined');

    if (original !== undefined) {
      process.env.JWT_SECRET = original;
    } else {
      delete process.env.JWT_SECRET;
    }
  });
});


