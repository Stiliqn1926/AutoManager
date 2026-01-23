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

const Login = () => {
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role') || 'service';
  const expectedRole = roleParam === 'admin'
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

    // При login само проверяваме дали паролата не е празна
    if (!password || password.trim() === '') {
      newErrors.password = 'Паролата е задължителна';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Моля поправете грешките във формата');
      return;
    }

    if (!expectedRole) {
      toast.error('\u041c\u043e\u043b\u044f, \u0438\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u0440\u043e\u043b\u044f \u0437\u0430 \u0432\u0445\u043e\u0434.');
      return;
    }

    setIsLoading(true);

    try {
      await login(email, password, expectedRole, rememberMe);
      toast.success('Успешен вход!');
      navigate('/');
    } catch (error) {
      const err = error as { response?: { status?: number; data?: ErrorResponse } };
      const errorData = err.response?.data;

      if (err.response?.status === 401) {
        toast.error('Грешен имейл или парола');
        return;
      }

      if (errorData?.errors) {
        const validationErrors: Record<string, string> = {};
        errorData.errors.forEach((e: ValidationError) => {
          validationErrors[e.field] = e.message;
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

  const getRoleContent = () => {
    switch (roleParam) {
      case 'admin':
        return {
          title: 'Вход за Администратор',
          description: 'Управлявайте вашия автосервиз с пълен контрол - работници, клиенти, финанси и настройки.',
          registerText: 'Нямате сервиз?',
          registerLink: '/register',
          registerLabel: 'Регистрирайте фирма',
        };
      case 'mechanic':
        return {
          title: 'Вход за Механик',
          description: 'Създавайте и редактирайте поръчки, преглеждайте клиенти и следете вашия работен график.',
          registerText: 'Нов механик?',
          registerLink: '/register-mechanic',
          registerLabel: 'Регистрация с код',
        };
      case 'client':
        return {
          title: 'Вход за Клиент',
          description: 'Проследявайте ремонтите на вашите автомобили, разглеждайте история и фактури.',
          registerText: 'Нов клиент?',
          registerLink: '/register-client',
          registerLabel: 'Регистрация',
        };
      default:
        return {
          title: 'Вход в системата',
          description: 'Управление на автосервизи - професионално и лесно.',
          registerText: 'Нямате акаунт?',
          registerLink: '/register',
          registerLabel: 'Регистрация',
        };
    }
  };

  const content = getRoleContent();

  return (
    <div className="h-screen bg-mainBg flex overflow-hidden">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-3xl font-semibold mb-4">{content.title}</h2>
        <p className="text-xl text-gray-300 leading-relaxed">{content.description}</p>
      </div>

      <div className="w-full lg:w-1/2 flex justify-center overflow-y-auto py-8 px-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-8 my-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-textPrimary mb-2">Вход</h2>
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
            <a href="/forgot-password" className="text-sm text-primary hover:text-primary-700 hover:underline block transition-colors">
              Забравена парола?
            </a>
            <div className="text-sm text-textSecondary">
              {content.registerText}{' '}
              <a href={content.registerLink} className="text-primary hover:text-primary-700 hover:underline transition-colors">
                {content.registerLabel}
              </a>
            </div>
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