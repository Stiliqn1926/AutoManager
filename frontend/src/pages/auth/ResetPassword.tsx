import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { CountdownTimer } from '../../components/common/CountdownTimer';
import toast from 'react-hot-toast';
import { resetPassword } from '../../services/authService';
import { validateEmail, validatePassword, validatePasswordMatch, validateRequired } from '../../utils/validation';
import api from '../../services/api';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const email = searchParams.get('email') || '';
  const rawRole = searchParams.get('role');
  const roleParam =
    rawRole === 'admin' || rawRole === 'mechanic' || rawRole === 'client'
      ? rawRole
      : null;
  
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [codeExpired, setCodeExpired] = useState(false);
  const [timerKey, setTimerKey] = useState(0); // За reset на timer
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (codeExpired) {
      toast.error('Кодът е изтекъл. Моля изпратете нов код.');
      return;
    }

    // Валидации
    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const codeError = validateRequired(code, 'Кодът');
    if (codeError) newErrors.code = codeError;

    const passwordError = validatePassword(newPassword);
    if (passwordError) newErrors.newPassword = passwordError;

    const passwordMatchError = validatePasswordMatch(newPassword, confirmPassword);
    if (passwordMatchError) newErrors.confirmPassword = passwordMatchError;

    if (Object.keys(newErrors).length > 0) {
      const firstError = Object.values(newErrors)[0];
      toast.error(firstError);
      return;
    }

    setIsLoading(true);
    
    try {
      await resetPassword(email, code, newPassword);
      toast.success('Паролата е сменена успешно!');
      navigate(roleParam ? `/login?role=${encodeURIComponent(roleParam)}` : '/login');
    } catch {
      toast.error('Невалиден или изтекъл код');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    
    try {
      await api.post('/auth/resend-reset-code', { email });
      toast.success('Нов код е изпратен на имейла ви!');
      setCodeExpired(false);
      setTimerKey((prev) => prev + 1); // Reset timer
    } catch {
      toast.error('Грешка при изпращане на код');
    } finally {
      setIsResending(false);
    }
  };

  const handleExpire = () => {
    setCodeExpired(true);
    toast.error('Кодът изтече! Моля изпратете нов код.');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 flex">
      {/* Лява страна - Информация */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary-600 text-white p-6 sm:p-8 sm:p-12 flex-col justify-center">
        <h1 className="text-5xl font-bold mb-6">🚗 AutoManager</h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Нова парола</h2>
        <p className="text-xl text-orange-100 leading-relaxed mb-4">
          Въведете 6-цифрения код който получихте на имейл и изберете нова парола.
        </p>
        <p className="text-orange-100">
          Кодът е валиден за 15 минути.
        </p>
      </div>

      {/* Дясна страна - Форма */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
              Смяна на парола
            </h2>
            <p className="text-gray-600">
              Въведете кода и новата си парола
            </p>
          </div>

          {/* Countdown Timer */}
          {!codeExpired && (
            <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
              <CountdownTimer 
                key={timerKey}
                initialSeconds={15 * 60} 
                onExpire={handleExpire} 
              />
            </div>
          )}

          {/* Expired Message */}
          {codeExpired && (
            <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
              <p className="text-sm text-red-600 text-center mb-3">
                ⏰ Кодът е изтекъл!
              </p>
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
              label="6-цифрен код"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              disabled={codeExpired}
            />

            <PasswordInput
              label="Нова парола"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showStrength={true}
              required
              disabled={codeExpired}
            />

            <PasswordInput
              label="Потвърди парола"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={codeExpired}
            />

            <Button type="submit" fullWidth isLoading={isLoading} disabled={codeExpired}>
              Смени паролата
            </Button>
          </form>

          {/* Resend Code Link (when not expired) */}
          {!codeExpired && (
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isResending}
                className="text-sm text-primary-600 hover:underline disabled:opacity-50"
              >
                Не сте получили код? Изпратете отново
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href={roleParam ? `/login?role=${encodeURIComponent(roleParam)}` : '/login'}
              className="text-sm text-primary-600 hover:underline"
            >
              Назад към вход
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;

