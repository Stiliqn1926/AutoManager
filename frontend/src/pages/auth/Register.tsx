import { useState } from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
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
  validateCompanyName,
  validateAddress,
  validatePhone,
  validateBulstat,
  validateVatNumber,
  validateCheckbox,
} from '../../utils/validation';

const Register = () => {
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const [companyData, setCompanyData] = useState({
    companyName: '',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    bulstat: '',
    vatNumber: '',
    description: '',
  });

  const [adminData, setAdminData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleStep1Next = (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    const companyNameError = validateCompanyName(companyData.companyName);
    if (companyNameError) newErrors.companyName = companyNameError;

    const addressError = validateAddress(companyData.companyAddress);
    if (addressError) newErrors.companyAddress = addressError;

    const phoneError = validatePhone(companyData.companyPhone);
    if (phoneError) newErrors.companyPhone = phoneError;

    const emailError = validateEmail(companyData.companyEmail);
    if (emailError) newErrors.companyEmail = emailError;

    const bulstatError = validateBulstat(companyData.bulstat);
    if (bulstatError) newErrors.bulstat = bulstatError;

    const vatError = validateVatNumber(companyData.vatNumber);
    if (vatError) newErrors.vatNumber = vatError;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Моля поправете грешките във формата');
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    const emailError = validateEmail(adminData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(adminData.password);
    if (passwordError) newErrors.password = passwordError;

    const passwordMatchError = validatePasswordMatch(
      adminData.password,
      adminData.confirmPassword
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
      const payload = {
        email: adminData.email,
        password: adminData.password,
        companyName: companyData.companyName,
        companyAddress: companyData.companyAddress,
        companyPhone: companyData.companyPhone,
        companyEmail: companyData.companyEmail,
        ...(companyData.bulstat && { bulstat: companyData.bulstat }),
        ...(companyData.vatNumber && { vatNumber: companyData.vatNumber }),
        ...(companyData.description && { description: companyData.description }),
      };

      const response = await api.post('/auth/register-admin', payload);
      // 🆕 Backend връща accessToken вместо token
      const { accessToken, user, serviceCompany } = response.data;

      // Set token and user directly without calling login again
      localStorage.setItem('token', accessToken);
      localStorage.setItem('user', JSON.stringify(user));

      // Reload to update auth context
      toast.success(
        `Сервизът е създаден! Уникален код: ${serviceCompany.uniqueCode}`
      );

      window.location.href = '/admin/dashboard';
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
        <h2 className="text-3xl font-semibold mb-4">
          Регистрация на Автосервиз
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed mb-6">
          {step === 1
            ? 'Въведете данните на вашия автосервиз.'
            : 'Създайте администраторски акаунт.'}
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-textPrimary mb-2">
              {step === 1
                ? 'Данни на Автосервиз'
                : 'Администраторски Акаунт'}
            </h2>
            <p className="text-textSecondary">
              {step === 1 ? 'Стъпка 1 от 2' : 'Стъпка 2 от 2'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <Input
                label="Име на фирмата *"
                value={companyData.companyName}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCompanyData({
                    ...companyData,
                    companyName: e.target.value,
                  })
                }
                error={errors.companyName}
              />

              <Input
                label="Адрес *"
                value={companyData.companyAddress}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCompanyData({
                    ...companyData,
                    companyAddress: e.target.value,
                  })
                }
                error={errors.companyAddress}
              />

              <Input
                label="Телефон *"
                value={companyData.companyPhone}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCompanyData({
                    ...companyData,
                    companyPhone: e.target.value,
                  })
                }
                error={errors.companyPhone}
              />

              <Input
                label="Имейл на фирмата *"
                type="email"
                value={companyData.companyEmail}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCompanyData({
                    ...companyData,
                    companyEmail: e.target.value,
                  })
                }
                error={errors.companyEmail}
              />

              <Input
                label="Булстат"
                value={companyData.bulstat}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCompanyData({
                    ...companyData,
                    bulstat: e.target.value,
                  })
                }
                error={errors.bulstat}
              />

              <Input
                label="ДДС номер"
                value={companyData.vatNumber}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCompanyData({
                    ...companyData,
                    vatNumber: e.target.value,
                  })
                }
                error={errors.vatNumber}
              />

              <Button type="submit" fullWidth>
                Напред
              </Button>

              <div className="mt-6 text-center">
                <a
                  href="/login?role=admin"
                  className="text-sm text-textMuted hover:text-textSecondary hover:underline transition-colors"
                >
                  ← Назад към вход
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <Input
                label="Имейл *"
                type="email"
                value={adminData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setAdminData({ ...adminData, email: e.target.value })
                }
                error={errors.email}
              />

              <PasswordInput
                label="Парола *"
                placeholder="••••••••"
                value={adminData.password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setAdminData({ ...adminData, password: e.target.value })
                }
                error={errors.password}
                showStrength
                required
              />

              <PasswordInput
                label="Потвърди парола *"
                placeholder="••••••••"
                value={adminData.confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setAdminData({
                    ...adminData,
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
                      href="/terms"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-700 hover:underline transition-colors"
                    >
                      общите условия
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

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-textMuted hover:text-textSecondary hover:underline transition-colors"
                >
                  ← Назад
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
