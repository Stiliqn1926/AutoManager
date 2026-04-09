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
  const [timerKey, setTimerKey] = useState(0);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (codeExpired) {
      toast.error('ÐšÐ¾Ð´ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚ÐµÐºÑŠÐ». ÐœÐ¾Ð»Ñ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÑ‚Ðµ Ð½Ð¾Ð² ÐºÐ¾Ð´.');
      return;
    }


    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    const codeError = validateRequired(code, 'ÐšÐ¾Ð´ÑŠÑ‚');
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
      toast.success('ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ðµ ÑÐ¼ÐµÐ½ÐµÐ½Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾!');
      navigate(roleParam ? `/login?role=${encodeURIComponent(roleParam)}` : '/login');
    } catch {
      toast.error('ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð¸Ð»Ð¸ Ð¸Ð·Ñ‚ÐµÐºÑŠÐ» ÐºÐ¾Ð´');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsResending(true);
    
    try {
      await api.post('/auth/resend-reset-code', { email });
      toast.success('ÐÐ¾Ð² ÐºÐ¾Ð´ Ðµ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÐ½ Ð½Ð° Ð¸Ð¼ÐµÐ¹Ð»Ð° Ð²Ð¸!');
      setCodeExpired(false);
      setTimerKey((prev) => prev + 1); // Reset timer
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ð¿Ñ€Ð°Ñ‰Ð°Ð½Ðµ Ð½Ð° ÐºÐ¾Ð´');
    } finally {
      setIsResending(false);
    }
  };

  const handleExpire = () => {
    setCodeExpired(true);
    toast.error('ÐšÐ¾Ð´ÑŠÑ‚ Ð¸Ð·Ñ‚ÐµÑ‡Ðµ! ÐœÐ¾Ð»Ñ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÑ‚Ðµ Ð½Ð¾Ð² ÐºÐ¾Ð´.');
  };

  return (
    <div className="min-h-screen bg-mainBg flex">
      
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">ÐÐ¾Ð²Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°</h2>
        <p className="text-xl text-gray-300 leading-relaxed mb-4">
          Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ 6-Ñ†Ð¸Ñ„Ñ€ÐµÐ½Ð¸Ñ ÐºÐ¾Ð´, ÐºÐ¾Ð¹Ñ‚Ð¾ Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ñ…Ñ‚Ðµ Ð½Ð° Ð¸Ð¼ÐµÐ¹Ð», Ð¸ Ð¸Ð·Ð±ÐµÑ€ÐµÑ‚Ðµ Ð½Ð¾Ð²Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°.
        </p>
        <p className="text-gray-300">ÐšÐ¾Ð´ÑŠÑ‚ Ðµ Ð²Ð°Ð»Ð¸Ð´ÐµÐ½ Ð·Ð° 15 Ð¼Ð¸Ð½ÑƒÑ‚Ð¸.</p>
      </div>

      
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              Ð¡Ð¼ÑÐ½Ð° Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°
            </h2>
            <p className="text-textSecondary">
              Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ ÐºÐ¾Ð´Ð° Ð¸ Ð½Ð¾Ð²Ð°Ñ‚Ð° ÑÐ¸ Ð¿Ð°Ñ€Ð¾Ð»Ð°
            </p>
          </div>

          {/* Countdown Timer */}
          {!codeExpired && (
            <div className="mb-6 p-4 bg-mainBg rounded-lg border border-borderSubtle">
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
                ÐšÐ¾Ð´ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚ÐµÐºÑŠÐ»!
              </p>
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
              label="6-Ñ†Ð¸Ñ„Ñ€ÐµÐ½ ÐºÐ¾Ð´"
              type="text"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              disabled={codeExpired}
            />

            <PasswordInput
              label="ÐÐ¾Ð²Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              showStrength={true}
              required
              disabled={codeExpired}
            />

            <PasswordInput
              label="ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð´Ð¸ Ð¿Ð°Ñ€Ð¾Ð»Ð°"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={codeExpired}
            />

            <Button type="submit" fullWidth isLoading={isLoading} disabled={codeExpired}>
              Ð¡Ð¼ÐµÐ½Ð¸ Ð¿Ð°Ñ€Ð¾Ð»Ð°Ñ‚Ð°
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
                ÐÐµ ÑÑ‚Ðµ Ð¿Ð¾Ð»ÑƒÑ‡Ð¸Ð»Ð¸ ÐºÐ¾Ð´? Ð˜Ð·Ð¿Ñ€Ð°Ñ‚ÐµÑ‚Ðµ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            <a
              href={roleParam ? `/login?role=${encodeURIComponent(roleParam)}` : '/login'}
              className="text-sm text-primary-600 hover:underline"
            >
              ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð²Ñ…Ð¾Ð´
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;


