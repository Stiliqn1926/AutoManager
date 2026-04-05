import Joi from 'joi';
import { validate } from '../../middleware/validation.middleware';

const makeRes = () => {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('validate - strip unknown fields', () => {
  it('removes unknown fields and calls next on valid body', () => {
    const schema = Joi.object({
      name: Joi.string().required(),
    });

    const req: any = {
      body: {
        name: 'Ivan',
        extraField: 'remove-me',
      },
    };
    const res = makeRes();
    const next = jest.fn();
    const middleware = validate(schema);

    middleware(req, res, next);

    expect(req.body).toEqual({ name: 'Ivan' });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

