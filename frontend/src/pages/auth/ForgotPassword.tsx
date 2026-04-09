import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import toast from 'react-hot-toast';
import { forgotPassword } from '../../services/authService';
import { validateEmail } from '../../utils/validation';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const rawRole = searchParams.get('role');
  const roleParam =
    rawRole === 'admin' || rawRole === 'mechanic' || rawRole === 'client'
      ? rawRole
      : null;
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    setIsLoading(true);

    try {
      await forgotPassword(email);
      toast.success('ÐšÐ¾Ð´ÑŠÑ‚ Ð·Ð° Ð²ÑŠÐ·ÑÑ‚Ð°Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ðµ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÐ½ Ð½Ð° Ð¸Ð¼ÐµÐ¹Ð»Ð° Ð²Ð¸!');
      const roleQuery = roleParam ? `&role=${encodeURIComponent(roleParam)}` : '';
      navigate(`/reset-password?email=${encodeURIComponent(email)}${roleQuery}`);
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ð¿Ñ€Ð°Ñ‰Ð°Ð½Ðµ Ð½Ð° ÐºÐ¾Ð´');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mainBg flex">
      
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Ð—Ð°Ð±Ñ€Ð°Ð²ÐµÐ½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°?</h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          ÐÑÐ¼Ð° Ð¿Ñ€Ð¾Ð±Ð»ÐµÐ¼! Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ Ð²Ð°ÑˆÐ¸Ñ Ð¸Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ Ð¸ Ñ‰Ðµ Ð²Ð¸ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚Ð¸Ð¼ ÐºÐ¾Ð´ Ð·Ð° Ð²ÑŠÐ·ÑÑ‚Ð°Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°Ñ‚Ð°.
        </p>
      </div>

      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              Ð’ÑŠÐ·ÑÑ‚Ð°Ð½Ð¾Ð²ÑÐ²Ð°Ð½Ðµ Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°
            </h2>
            <p className="text-textSecondary">
              Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ Ð¸Ð¼ÐµÐ¹Ð»Ð° ÑÐ¸ Ð·Ð° Ð´Ð° Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ñ‚Ðµ ÐºÐ¾Ð´
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Ð˜Ð¼ÐµÐ¹Ð» Ð°Ð´Ñ€ÐµÑ"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button type="submit" fullWidth isLoading={isLoading}>
              Ð˜Ð·Ð¿Ñ€Ð°Ñ‚Ð¸ ÐºÐ¾Ð´
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href={roleParam ? `/login?role=${encodeURIComponent(roleParam)}` : '/login'}
              className="text-sm text-primary hover:text-primary-700 hover:underline transition-colors"
            >
              ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð²Ñ…Ð¾Ð´
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;


