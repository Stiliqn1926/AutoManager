import Joi from 'joi';
import { validate } from '../../middleware/validation.middleware';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validate - invalid body', () => {
  it('returns 400 with error details when body is invalid', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    const req: any = { body: {} };
    const res = makeRes();
    const next = jest.fn();
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Validation failed',
        errors: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
        ]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });
});


