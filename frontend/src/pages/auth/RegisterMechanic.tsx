import { useState } from 'react';
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
  validateName,
  validatePhone,
  validateUniqueCode,
  validateSpecialization,
  validateSkills,
  validateCheckbox,
} from '../../utils/validation';

const RegisterMechanic = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    specialization: '',
    skills: '',
    uniqueCode: '',
  });

  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};

    const firstNameError = validateName(formData.firstName, 'Името');
    if (firstNameError) newErrors.firstName = firstNameError;

    const lastNameError = validateName(formData.lastName, 'Фамилията');
    if (lastNameError) newErrors.lastName = lastNameError;

    const phoneError = validatePhone(formData.phone);
    if (phoneError) newErrors.phone = phoneError;

    const emailError = validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const passwordMatchError = validatePasswordMatch(
      formData.password,
      formData.confirmPassword
    );
    if (passwordMatchError) newErrors.confirmPassword = passwordMatchError;

    const specializationError = validateSpecialization(formData.specialization);
    if (specializationError) newErrors.specialization = specializationError;

    const skillsError = validateSkills(formData.skills);
    if (skillsError) newErrors.skills = skillsError;

    const uniqueCodeError = validateUniqueCode(formData.uniqueCode);
    if (uniqueCodeError) newErrors.uniqueCode = uniqueCodeError;

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
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        uniqueCode: formData.uniqueCode,
        ...(formData.specialization && {
          specialization: formData.specialization,
        }),
        ...(formData.skills && { skills: formData.skills }),
      };

      await api.post('/auth/register-mechanic', payload);

      setIsSuccess(true);
      toast.success(
        'Заявката е изпратена! Чакайте одобрение от администратор.'
      );
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

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-mainBg flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-8 text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-3xl font-bold text-textPrimary mb-4">
            Заявката е изпратена!
          </h2>
          <p className="text-textSecondary mb-6">
            Вашата регистрация като механик очаква одобрение от администратора на
            автосервиза.
          </p>
          <p className="text-sm text-textMuted mb-8">
            Ще получите имейл когато акаунтът ви бъде одобрен.
          </p>
          <Button
            onClick={() => navigate('/login?role=mechanic')}
            fullWidth
          >
            Назад към вход
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mainBg flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-3xl font-semibold mb-4">
          Регистрация за Механик
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed mb-6">
          Въведете вашите данни и уникалния код на автосервиза, в който искате да
          работите.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-textPrimary mb-2">
              Регистрация
            </h2>
            <p className="text-textSecondary">Попълнете вашите данни</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Име *"
              value={formData.firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              error={errors.firstName}
            />

            <Input
              label="Фамилия *"
              value={formData.lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              error={errors.lastName}
            />

            <Input
              label="Телефон *"
              value={formData.phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              error={errors.phone}
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
              placeholder="••••••••"
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
              placeholder="••••••••"
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

            <Input
              label="Специализация"
              value={formData.specialization}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  specialization: e.target.value,
                })
              }
              error={errors.specialization}
            />

            <Input
              label="Умения"
              value={formData.skills}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, skills: e.target.value })
              }
              error={errors.skills}
            />

            <Input
              label="Уникален код на сервиза *"
              value={formData.uniqueCode}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({
                  ...formData,
                  uniqueCode: e.target.value.toUpperCase(),
                })
              }
              error={errors.uniqueCode}
            />

            <Checkbox
              label={
                <span className="text-sm text-textSecondary">
                  Съгласявам се с{' '}
                  <a
                    href="/terms"
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
              Изпрати заявка
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a
              href="/login?role=mechanic"
              className="text-sm text-primary hover:text-primary-700 hover:underline block transition-colors"
            >
              Вече имате акаунт? Вход
            </a>
            <a
              href="/"
              className="text-sm text-textMuted hover:text-textSecondary hover:underline block transition-colors"
            >
              ← Назад към начало
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterMechanic;
