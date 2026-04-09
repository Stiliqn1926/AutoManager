import { useState, useEffect } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { PasswordInput } from '../../components/common/PasswordInput';
import { Checkbox } from '../../components/common/Checkbox';
import toast from 'react-hot-toast';
import api from '../../services/api';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateCheckbox,
} from '../../utils/validation';

const STORAGE_KEY = 'registerClientFormData';
const DEFAULT_FORM_DATA = {
  firstName: '',
  lastName: '',
  phone: '',
  uniqueCode: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const RegisterClient = () => {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return {
          ...DEFAULT_FORM_DATA,
          ...JSON.parse(saved),
        };
      } catch {
        return DEFAULT_FORM_DATA;
      }
    }
    return DEFAULT_FORM_DATA;
  });

  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
  }, [formData]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Името е задължително';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Фамилията е задължителна';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Телефонният номер е задължителен';
    } else if (!/^[0-9+\s()-]+$/.test(formData.phone)) {
      newErrors.phone = 'Невалиден телефонен номер';
    }

    if (!formData.uniqueCode.trim()) {
      newErrors.uniqueCode = 'Кодът на сервиза е задължителен';
    }

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const passwordMatchError = validatePasswordMatch(
      formData.password,
      formData.confirmPassword
    );
    if (passwordMatchError) newErrors.confirmPassword = passwordMatchError;

    const checkboxError = validateCheckbox(
      agreedToTerms,
      'Трябва да се съгласите с общите условия'
    );
    if (checkboxError) {
      toast.error(checkboxError);
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Моля поправете грешките във формата');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Register the user (CLIENT role) with firstName, lastName, phone
      await api.post('/auth/register-client', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        uniqueCode: formData.uniqueCode,
        email: formData.email,
        password: formData.password,
        role: 'CLIENT',
      });

      localStorage.removeItem(STORAGE_KEY);
      toast.success(
        'Регистрацията е успешна! Потвърдете имейла си, след което изчакайте одобрение от сервиза.'
      );
      navigate(`/verify-email?email=${encodeURIComponent(formData.email)}&role=client`);
    } catch (error) {
      const err = error as {
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ field: string; message: string }>;
          };
        };
      };

      const errorData = err.response?.data;

      if (errorData?.errors) {
        const validationErrors: Record<string, string> = {};
        errorData.errors.forEach((e) => {
          validationErrors[e.field] = e.message;
        });
        setErrors(validationErrors);
        toast.error('Моля поправете грешките');
      } else {
        toast.error(errorData?.message || 'Грешка при регистрация');
      }
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
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Регистрация за клиент</h2>
        <p className="text-xl text-gray-300 leading-relaxed mb-6">
          Създайте акаунт, за да проследявате ремонтите на вашите автомобили, историята на
          поръчките и фактурите.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex justify-center overflow-y-auto py-6 px-4 sm:py-8 sm:px-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8 my-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              Създайте акаунт
            </h2>
            <p className="text-textSecondary">Регистрация за клиент</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Име *"
              type="text"
              value={formData.firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              error={errors.firstName}
            />

            <Input
              label="Фамилия *"
              type="text"
              value={formData.lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              error={errors.lastName}
            />

            <Input
              label="Телефонен номер *"
              type="tel"
              value={formData.phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              error={errors.phone}
              placeholder="+359 88 123 4567"
            />

            <Input
              label="Код на сервиза *"
              type="text"
              value={formData.uniqueCode}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  uniqueCode: e.target.value.toUpperCase(),
                })
              }
              error={errors.uniqueCode}
              placeholder="Напр. AM1234"
            />

            <Input
              label="Имейл *"
              type="email"
              value={formData.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
            />

            <PasswordInput
              label="Парола *"
              placeholder="********"
              value={formData.password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={errors.password}
              showStrength
              required
            />

            <PasswordInput
              label="Потвърди парола *"
              placeholder="********"
              value={formData.confirmPassword}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              error={errors.confirmPassword}
              required
            />

            <Checkbox
              label={
                <span className="text-sm text-textSecondary">
                  Съгласявам се с{' '}
                  <a
                    href="/terms?returnTo=/register-client"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-700 hover:underline transition-colors"
                  >
                    общите условия и поверителност
                  </a>
                </span>
              }
              checked={agreedToTerms}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAgreedToTerms(e.target.checked)
              }
            />

            <Button type="submit" fullWidth isLoading={isLoading}>
              Регистрация
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a
              href="/login?role=client"
              className="text-sm text-primary hover:text-primary-700 hover:underline block transition-colors"
            >
              Вече имате акаунт? Вход
            </a>
            <a
              href="/"
              className="text-sm text-textMuted hover:text-textSecondary hover:underline block transition-colors"
            >
              Назад към началото
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterClient;


