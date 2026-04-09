import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Checkbox } from '../../components/common/Checkbox';
import toast from 'react-hot-toast';
import type { ErrorResponse, ValidationError } from '../../types';
import { validateEmail } from '../../utils/validation';
import { createCheckoutSession } from '../../services/billingService';

type RoleContent = {
  title: string;
  description: string;
};

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'service';
  const nextAction = searchParams.get('next');
  const forgotRole =
    roleParam === 'admin' || roleParam === 'mechanic' || roleParam === 'client'
      ? roleParam
      : null;
  const expectedRole =
    roleParam === 'admin'
      ? 'ADMIN'
      : roleParam === 'mechanic'
        ? 'MECHANIC'
        : roleParam === 'client'
          ? 'CLIENT'
          : null;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(email);
    if (emailError) newErrors.email = emailError;

    if (!password || password.trim() === '') {
      newErrors.password = 'Паролата е задължителна';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Моля поправете грешките във формата');
      return;
    }

    if (!expectedRole) {
      toast.error('Моля, изберете роля за вход.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password, expectedRole, rememberMe);

      if (expectedRole === 'ADMIN' && nextAction === 'checkout') {
        const checkoutData = await createCheckoutSession();
        window.location.href = checkoutData.checkoutUrl;
        return;
      }

      toast.success('Успешен вход!');
      navigate('/');
    } catch (error) {
      const err = error as { response?: { status?: number; data?: ErrorResponse } };
      const errorData = err.response?.data;

      if (
        expectedRole === 'ADMIN' &&
        nextAction === 'checkout' &&
        err.response?.status &&
        err.response.status !== 401
      ) {
        toast.error(errorData?.message || 'Неуспешно стартиране на плащането');
        navigate('/billing/cancel');
        return;
      }

      if (err.response?.status === 401) {
        toast.error('Грешен имейл или парола');
        return;
      }

      if (err.response?.status === 403 && errorData?.code === 'EMAIL_NOT_VERIFIED') {
        const roleQuery = forgotRole ? `&role=${encodeURIComponent(forgotRole)}` : '';
        toast.error('Имейлът не е потвърден. Въведете кода за потвърждение.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}${roleQuery}`);
        return;
      }

      if (err.response?.status === 403 && errorData?.code === 'ACCOUNT_PENDING_APPROVAL') {
        const details = errorData as ErrorResponse & { serviceCompanyName?: string | null };
        const params = new URLSearchParams();

        if (forgotRole) params.set('role', forgotRole);
        params.set('email', email);
        if (details.message) params.set('message', details.message);
        if (details.serviceCompanyName) {
          params.set('serviceCompanyName', details.serviceCompanyName);
        }

        navigate(`/pending-approval?${params.toString()}`);
        return;
      }

      if (err.response?.status === 403 && errorData?.code === 'NO_ACTIVE_MEMBERSHIP') {
        toast.error(
          errorData.message ||
            'Профилът ви няма активно одобрение от сервиз. Свържете се с администратор.'
        );
        return;
      }

      if (errorData?.errors) {
        const validationErrors: Record<string, string> = {};
        errorData.errors.forEach((validationError: ValidationError) => {
          validationErrors[validationError.field] = validationError.message;
        });
        setErrors(validationErrors);
        toast.error('Моля поправете грешките');
      } else {
        toast.error(errorData?.message || 'Грешка при вход');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleContent = (): RoleContent => {
    switch (roleParam) {
      case 'admin':
        return {
          title: 'Вход за Администратор',
          description:
            'Управлявайте вашия автосервиз с пълен контрол - работници, клиенти, финанси и настройки.',
        };
      case 'mechanic':
        return {
          title: 'Вход за Механик',
          description:
            'Създавайте и редактирайте поръчки, преглеждайте клиенти и следете вашия работен график.',
        };
      case 'client':
        return {
          title: 'Вход за Клиент',
          description:
            'Проследявайте ремонтите на вашите автомобили, разглеждайте история и фактури.',
        };
      default:
        return {
          title: 'Вход в системата',
          description: 'Управление на автосервизи - професионално и лесно.',
        };
    }
  };

  const content = getRoleContent();

  return (
    <div className="min-h-screen bg-mainBg flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">{content.title}</h2>
        <p className="text-xl text-gray-300 leading-relaxed">{content.description}</p>
      </div>

      <div className="w-full lg:w-1/2 flex justify-center overflow-y-auto py-6 px-4 sm:py-8 sm:px-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8 my-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">Вход</h2>
            <p className="text-textSecondary">Въведете вашите данни</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Имейл"
              type="email"
              placeholder="example@mail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
            />

            <PasswordInput
              label="Парола"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              required
            />

            <Checkbox
              label="Запомни ме за 30 дни"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />

            <Button type="submit" fullWidth isLoading={isLoading}>
              Вход
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a
              href={forgotRole ? `/forgot-password?role=${encodeURIComponent(forgotRole)}` : '/forgot-password'}
              className="text-sm text-primary hover:text-primary-700 hover:underline block transition-colors"
            >
              Забравена парола?
            </a>
            <div className="pt-4">
              <a href="/" className="text-sm text-textMuted hover:text-textSecondary hover:underline transition-colors">
                ← Назад към начало
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

