import { generateToken, verifyToken } from '../../utils/generateToken';

describe('generateToken/verifyToken - valid payload', () => {
  it('generates and verifies token payload correctly', () => {
    const original = process.env.JWT_SECRET;
    process.env.JWT_SECRET = 'unit-test-secret';

    const payload = {
      userId: 'u1',
      email: 'user@test.com',
      role: 'ADMIN',
      tokenVersion: 3,
    };

    const token = generateToken(payload, '15m');
    const decoded = verifyToken(token);

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.email).toBe(payload.email);
    expect(decoded.role).toBe(payload.role);
    expect(decoded.tokenVersion).toBe(payload.tokenVersion);
    expect(decoded.exp).toBeDefined();
    expect(decoded.iat).toBeDefined();

    if (original !== undefined) {
      process.env.JWT_SECRET = original;
    } else {
      delete process.env.JWT_SECRET;
    }
  });
});
