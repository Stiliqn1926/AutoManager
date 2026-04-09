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
      toast.error('ÐšÐ¾Ð´ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚ÐµÐºÑŠÐ». Ð˜Ð·Ð¿Ñ€Ð°Ñ‚ÐµÑ‚Ðµ Ð½Ð¾Ð² ÐºÐ¾Ð´.');
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      toast.error(emailError);
      return;
    }

    const codeError = validateRequired(code, 'ÐšÐ¾Ð´ÑŠÑ‚');
    if (codeError) {
      toast.error(codeError);
      return;
    }

    setIsLoading(true);
    try {
      await api.post('/auth/verify-email-code', { email, code });
      toast.success('Ð˜Ð¼ÐµÐ¹Ð»ÑŠÑ‚ Ðµ Ð¿Ð¾Ñ‚Ð²ÑŠÑ€Ð´ÐµÐ½ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾!');

      if (roleParam === 'admin') {
        const checkoutData = await createAdminRegistrationCheckoutSession(email);
        toast.success('ÐŸÑ€ÐµÐ½Ð°ÑÐ¾Ñ‡Ð²Ð°Ð¼Ðµ Ð²Ð¸ ÐºÑŠÐ¼ Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ...');
        window.location.href = checkoutData.checkoutUrl;
        return;
      }

      if (roleParam === 'mechanic') {
        toast.success(
          'ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð¶Ð´ÐµÐ½Ð¸ÐµÑ‚Ð¾ Ðµ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾. Ð˜Ð·Ñ‡Ð°ÐºÐ°Ð¹Ñ‚Ðµ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ Ð¾Ñ‚ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€.'
        );
      }

      if (roleParam === 'client') {
        toast.success(
          'ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð¶Ð´ÐµÐ½Ð¸ÐµÑ‚Ð¾ Ðµ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾. Ð˜Ð·Ñ‡Ð°ÐºÐ°Ð¹Ñ‚Ðµ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ Ð¾Ñ‚ ÑÐµÑ€Ð²Ð¸Ð·Ð°.'
        );
      }

      navigate(getLoginPath());
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð»Ð¸ Ð¸Ð·Ñ‚ÐµÐºÑŠÐ» ÐºÐ¾Ð´');
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
      toast.success('ÐÐ¾Ð² ÐºÐ¾Ð´ Ðµ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÐ½ Ð½Ð° Ð¸Ð¼ÐµÐ¹Ð»Ð°.');
      setCodeExpired(false);
      setTimerKey((prev) => prev + 1);
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ð¿Ñ€Ð°Ñ‰Ð°Ð½Ðµ Ð½Ð° Ð½Ð¾Ð² ÐºÐ¾Ð´');
    } finally {
      setIsResending(false);
    }
  };

  const handleExpire = () => {
    setCodeExpired(true);
    toast.error('ÐšÐ¾Ð´ÑŠÑ‚ Ð¸Ð·Ñ‚ÐµÑ‡Ðµ. Ð˜Ð·Ð¿Ñ€Ð°Ñ‚ÐµÑ‚Ðµ Ð½Ð¾Ð² ÐºÐ¾Ð´.');
  };

  return (
    <div className="min-h-screen bg-mainBg flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
          ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð¶Ð´ÐµÐ½Ð¸Ðµ Ð½Ð° Ð¸Ð¼ÐµÐ¹Ð»
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed mb-4">
          Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ 6-Ñ†Ð¸Ñ„Ñ€ÐµÐ½Ð¸Ñ ÐºÐ¾Ð´, ÐºÐ¾Ð¹Ñ‚Ð¾ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚Ð¸Ñ…Ð¼Ðµ Ð½Ð° Ð¸Ð¼ÐµÐ¹Ð»Ð° Ð²Ð¸.
        </p>
        <p className="text-gray-300">ÐšÐ¾Ð´ÑŠÑ‚ Ðµ Ð²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð·Ð° 10 Ð¼Ð¸Ð½ÑƒÑ‚Ð¸.</p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð´Ð¸ Ð¸Ð¼ÐµÐ¹Ð»
            </h2>
            <p className="text-textSecondary">Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ Ð¸Ð¼ÐµÐ¹Ð»Ð° Ð¸ ÐºÐ¾Ð´Ð° Ð¾Ñ‚ Ð¿Ð¸ÑÐ¼Ð¾Ñ‚Ð¾</p>
          </div>

          {!codeExpired && (
            <div className="mb-6 p-4 bg-mainBg rounded-lg border border-borderSubtle">
              <CountdownTimer key={timerKey} initialSeconds={10 * 60} onExpire={handleExpire} />
            </div>
          )}

          {codeExpired && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 text-center mb-3">ÐšÐ¾Ð´ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚ÐµÐºÑŠÐ».</p>
              <Button
                onClick={handleResendCode}
                isLoading={isResending}
                fullWidth
                variant="outline"
              >
                Ð˜Ð·Ð¿Ñ€Ð°Ñ‚Ð¸ Ð½Ð¾Ð² ÐºÐ¾Ð´
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Ð˜Ð¼ÐµÐ¹Ð»"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@mail.com"
            />

            <Input
              label="6-Ñ†Ð¸Ñ„Ñ€ÐµÐ½ ÐºÐ¾Ð´"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              disabled={codeExpired}
            />

            <Button type="submit" fullWidth isLoading={isLoading} disabled={codeExpired}>
              ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð´Ð¸ Ð¸Ð¼ÐµÐ¹Ð»
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
                ÐÐµ ÑÑ‚Ðµ Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ð»Ð¸ ÐºÐ¾Ð´? Ð˜Ð·Ð¿Ñ€Ð°Ñ‚ÐµÑ‚Ðµ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href={getLoginPath()}
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

export default VerifyEmail;

