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

const RegisterClient = () => {
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
          password: '',
          confirmPassword: '',
        };
      }
    }
    return {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
    };
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
      newErrors.firstName = 'Ð˜Ð¼ÐµÑ‚Ð¾ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð¾';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Ð¤Ð°Ð¼Ð¸Ð»Ð¸ÑÑ‚Ð° Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»Ð½Ð°';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½Ð½Ð¸ÑÑ‚ Ð½Ð¾Ð¼ÐµÑ€ Ðµ Ð·Ð°Ð´ÑŠÐ»Ð¶Ð¸Ñ‚ÐµÐ»ÐµÐ½';
    } else if (!/^[0-9+\s()-]+$/.test(formData.phone)) {
      newErrors.phone = 'ÐÐµÐ²Ð°Ð»Ð¸Ð´ÐµÐ½ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½ÐµÐ½ Ð½Ð¾Ð¼ÐµÑ€';
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
      'Ð¢Ñ€ÑÐ±Ð²Ð° Ð´Ð° ÑÐµ ÑÑŠÐ³Ð»Ð°ÑÐ¸Ñ‚Ðµ Ñ Ð¾Ð±Ñ‰Ð¸Ñ‚Ðµ ÑƒÑÐ»Ð¾Ð²Ð¸Ñ'
    );
    if (checkboxError) {
      toast.error(checkboxError);
      return;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('ÐœÐ¾Ð»Ñ Ð¿Ð¾Ð¿Ñ€Ð°Ð²ÐµÑ‚Ðµ Ð³Ñ€ÐµÑˆÐºÐ¸Ñ‚Ðµ Ð²ÑŠÐ² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ð°');
      return;
    }

    setIsLoading(true);

    try {
      // Step 1: Register the user (CLIENT role) with firstName, lastName, phone
      await api.post('/auth/register-client', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        role: 'CLIENT',
      });

      localStorage.removeItem(STORAGE_KEY);
      toast.success('Регистрацията е успешна! Потвърдете имейла си.');
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
        toast.error('ÐœÐ¾Ð»Ñ Ð¿Ð¾Ð¿Ñ€Ð°Ð²ÐµÑ‚Ðµ Ð³Ñ€ÐµÑˆÐºÐ¸Ñ‚Ðµ');
      } else {
        toast.error(errorData?.message || 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ');
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
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ Ð·Ð° ÐšÐ»Ð¸ÐµÐ½Ñ‚</h2>
        <p className="text-xl text-gray-300 leading-relaxed mb-6">
          Ð¡ÑŠÐ·Ð´Ð°Ð¹Ñ‚Ðµ Ð°ÐºÐ°ÑƒÐ½Ñ‚, Ð·Ð° Ð´Ð° Ð¿Ñ€Ð¾ÑÐ»ÐµÐ´ÑÐ²Ð°Ñ‚Ðµ Ñ€ÐµÐ¼Ð¾Ð½Ñ‚Ð¸Ñ‚Ðµ Ð½Ð° Ð²Ð°ÑˆÐ¸Ñ‚Ðµ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸,
          Ð¸ÑÑ‚Ð¾Ñ€Ð¸ÑÑ‚Ð° Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸Ñ‚Ðµ Ð¸ Ñ„Ð°ÐºÑ‚ÑƒÑ€Ð¸Ñ‚Ðµ.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex justify-center overflow-y-auto py-6 px-4 sm:py-8 sm:px-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8 my-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              Ð¡ÑŠÐ·Ð´Ð°Ð¹Ñ‚Ðµ Ð°ÐºÐ°ÑƒÐ½Ñ‚
            </h2>
            <p className="text-textSecondary">Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ Ð·Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Ð˜Ð¼Ðµ *"
              type="text"
              value={formData.firstName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              error={errors.firstName}
            />

            <Input
              label="Ð¤Ð°Ð¼Ð¸Ð»Ð¸Ñ *"
              type="text"
              value={formData.lastName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              error={errors.lastName}
            />

            <Input
              label="Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ÐµÐ½ Ð½Ð¾Ð¼ÐµÑ€ *"
              type="tel"
              value={formData.phone}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              error={errors.phone}
              placeholder="+359 88 123 4567"
            />

            <Input
              label="Ð˜Ð¼ÐµÐ¹Ð» *"
              type="email"
              value={formData.email}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, email: e.target.value })
              }
              error={errors.email}
            />

            <PasswordInput
              label="ÐŸÐ°Ñ€Ð¾Ð»Ð° *"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
              value={formData.password}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, password: e.target.value })
              }
              error={errors.password}
              showStrength
              required
            />

            <PasswordInput
              label="ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð´Ð¸ Ð¿Ð°Ñ€Ð¾Ð»Ð° *"
              placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                  Ð¡ÑŠÐ³Ð»Ð°ÑÑÐ²Ð°Ð¼ ÑÐµ Ñ{' '}
                  <a
                    href="/terms?returnTo=/register-client"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary-700 hover:underline transition-colors"
                  >
                    Ð¾Ð±Ñ‰Ð¸Ñ‚Ðµ ÑƒÑÐ»Ð¾Ð²Ð¸Ñ Ð¸ Ð¿Ð¾Ð²ÐµÑ€Ð¸Ñ‚ÐµÐ»Ð½Ð¾ÑÑ‚
                  </a>
                </span>
              }
              checked={agreedToTerms}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setAgreedToTerms(e.target.checked)
              }
            />

            <Button type="submit" fullWidth isLoading={isLoading}>
              Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <a
              href="/login?role=client"
              className="text-sm text-primary hover:text-primary-700 hover:underline block transition-colors"
            >
              Ð’ÐµÑ‡Ðµ Ð¸Ð¼Ð°Ñ‚Ðµ Ð°ÐºÐ°ÑƒÐ½Ñ‚? Ð’Ñ…Ð¾Ð´
            </a>
            <a
              href="/"
              className="text-sm text-textMuted hover:text-textSecondary hover:underline block transition-colors"
            >
              â† ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð½Ð°Ñ‡Ð°Ð»Ð¾
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterClient;


