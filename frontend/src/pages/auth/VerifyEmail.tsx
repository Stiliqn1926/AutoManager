import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { createAdminRegistrationCheckoutSession } from '../../services/billingService';
import { validateEmail, validateRequired } from '../../utils/validation';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const initialEmail = searchParams.get('email') || '';
  const rawRole = searchParams.get('role');
  const roleParam =
    rawRole === 'admin' || rawRole === 'mechanic' || rawRole === 'client'
      ? rawRole
      : null;

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);
  const [timerKey, setTimerKey] = useState(0);

  const navigate = useNavigate();

  const getLoginPath = () => {
    if (roleParam) return `/login?role=${encodeURIComponent(roleParam)}`;
    return '/login';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (codeExpired) {
      toast.error('Кодът е изтекъл. Изпратете нов код.');
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    const codeError = validateRequired(code, 'Кодът');
    if (codeError) {
      toast.error(codeError);
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-email-code', { email, code });
      toast.success('Имейлът е потвърден успешно!');

      if (roleParam === 'admin') {
        const checkoutData = await createAdminRegistrationCheckoutSession(email);
        toast.success('Пренасочваме ви към плащане...');
        window.location.href = checkoutData.checkoutUrl;
        return;
      }

      if (roleParam === 'mechanic') {
        toast.success(
          'Потвърждението е успешно. Изчакайте одобрение от администратор.'
        );
      }

      if (roleParam === 'client') {
        toast.success(
          'Потвърждението е успешно. Изчакайте одобрение от сервиза.'
        );
      }

      navigate(getLoginPath());
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Невалиден или изтекъл код');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    setIsResending(true);
    try {
      await api.post('/auth/resend-email-verification-code', { email });
      toast.success('Нов код е изпратен на имейла.');
      setCodeExpired(false);
      setTimerKey((prev) => prev + 1);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Грешка при изпращане на нов код');
    } finally {
      setIsResending(false);
    }
  };

  const handleExpire = () => {
    setCodeExpired(true);
    toast.error('Кодът изтече. Изпратете нов код.');
  };

  return (
    <div className="min-h-screen bg-mainBg flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
          Потвърждение на имейл
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed mb-4">
          Въведете 6-цифрения код, който изпратихме на имейла ви.
        </p>
        <p className="text-gray-300">Кодът е валиден за 10 минути.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              Потвърди имейл
            </h2>
            <p className="text-textSecondary">Въведете имейла и кода от писмото</p>
          </div>

          {!codeExpired && (
            <div className="mb-6 p-4 bg-mainBg rounded-lg border border-borderSubtle">
              <CountdownTimer key={timerKey} initialSeconds={10 * 60} onExpire={handleExpire} />
            </div>
          )}

          {codeExpired && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 text-center mb-3">Кодът е изтекъл.</p>
              <Button
                onClick={handleResendCode}
                isLoading={isResending}
                fullWidth
                variant="outline"
              >
                Изпрати нов код
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Имейл"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
            />

            <Input
              label="6-цифрен код"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              disabled={codeExpired}
            />

            <Button type="submit" fullWidth isLoading={isLoading} disabled={codeExpired}>
              Потвърди имейл
            </Button>
          </form>

          {!codeExpired && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-sm text-primary hover:text-primary-700 hover:underline transition-colors disabled:opacity-50"
              >
                Не сте получили код? Изпратете отново
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href={getLoginPath()}
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

export default VerifyEmail;

