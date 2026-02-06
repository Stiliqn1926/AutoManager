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
      toast.success('Кодът за възстановяване е изпратен на имейла ви!');
      const roleQuery = roleParam ? `&role=${encodeURIComponent(roleParam)}` : '';
      navigate(`/reset-password?email=${encodeURIComponent(email)}${roleQuery}`);
    } catch {
      toast.error('Грешка при изпращане на код');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mainBg flex">
      {/* Лява страна - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Забравена парола?</h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          Няма проблем! Въведете вашия имейл адрес и ще ви изпратим код за възстановяване на паролата.
        </p>
      </div>

      {/* Дясна страна - Форма */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              Възстановяване на парола
            </h2>
            <p className="text-textSecondary">
              Въведете имейла си за да получите код
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Имейл адрес"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <Button type="submit" fullWidth isLoading={isLoading}>
              Изпрати код
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href={roleParam ? `/login?role=${encodeURIComponent(roleParam)}` : '/login'}
              className="text-sm text-primary hover:text-primary-700 hover:underline transition-colors"
            >
              Назад към вход
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;

