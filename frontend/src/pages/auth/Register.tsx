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
  validateCompanyName,
  validateAddress,
  validatePhone,
  validateBulstat,
  validateVatNumber,
  validateCheckbox,
} from '../../utils/validation';

const STORAGE_KEY_COMPANY = 'registerCompanyData';
const STORAGE_KEY_ADMIN = 'registerAdminData';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<number>(() => {
    const saved = localStorage.getItem('registerStep');
    return saved ? parseInt(saved) : 1;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [companyData, setCompanyData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_COMPANY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          companyName: '',
          companyAddress: '',
          companyPhone: '',
          companyEmail: '',
          bulstat: '',
          vatNumber: '',
          description: '',
        };
      }
    }
    return {
      companyName: '',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      bulstat: '',
      vatNumber: '',
      description: '',
    };
  });

  const [adminData, setAdminData] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_ADMIN);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {
          email: '',
          password: '',
          confirmPassword: '',
        };
      }
    }
    return {
      email: '',
      password: '',
      confirmPassword: '',
    };
  });

  const [agreedToTerms, setAgreedToTerms] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COMPANY, JSON.stringify(companyData));
  }, [companyData]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ADMIN, JSON.stringify(adminData));
  }, [adminData]);

  useEffect(() => {
    localStorage.setItem('registerStep', step.toString());
  }, [step]);

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
      toast.error('ÐœÐ¾Ð»Ñ Ð¿Ð¾Ð¿Ñ€Ð°Ð²ÐµÑ‚Ðµ Ð³Ñ€ÐµÑˆÐºÐ¸Ñ‚Ðµ Ð²ÑŠÐ² Ñ„Ð¾Ñ€Ð¼Ð°Ñ‚Ð°');
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
      const { serviceCompany } = response.data;

      // Clear registration data
      localStorage.removeItem(STORAGE_KEY_COMPANY);
      localStorage.removeItem(STORAGE_KEY_ADMIN);
      localStorage.removeItem('registerStep');

      toast.success(
        `Сервизът е създаден успешно! Код на сервиза: ${serviceCompany.uniqueCode}. Потвърдете имейла си.`
      );

      navigate(`/verify-email?email=${encodeURIComponent(adminData.email)}&role=admin`);
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
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
          Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ Ð½Ð° ÐÐ²Ñ‚Ð¾ÑÐµÑ€Ð²Ð¸Ð·
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed mb-6">
          {step === 1
            ? 'Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ Ð´Ð°Ð½Ð½Ð¸Ñ‚Ðµ Ð½Ð° Ð²Ð°ÑˆÐ¸Ñ Ð°Ð²Ñ‚Ð¾ÑÐµÑ€Ð²Ð¸Ð·.'
            : 'Ð¡ÑŠÐ·Ð´Ð°Ð¹Ñ‚Ðµ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€ÑÐºÐ¸ Ð°ÐºÐ°ÑƒÐ½Ñ‚.'}
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex justify-center overflow-y-auto py-6 px-4 sm:py-8 sm:px-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8 my-auto">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              {step === 1
                ? 'Ð”Ð°Ð½Ð½Ð¸ Ð½Ð° ÐÐ²Ñ‚Ð¾ÑÐµÑ€Ð²Ð¸Ð·'
                : 'ÐÐ´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€ÑÐºÐ¸ ÐÐºÐ°ÑƒÐ½Ñ‚'}
            </h2>
            <p className="text-textSecondary">
              {step === 1 ? 'Ð¡Ñ‚ÑŠÐ¿ÐºÐ° 1 Ð¾Ñ‚ 2' : 'Ð¡Ñ‚ÑŠÐ¿ÐºÐ° 2 Ð¾Ñ‚ 2'}
            </p>
          </div>

          {step === 1 ? (
            <form onSubmit={handleStep1Next} className="space-y-4">
              <Input
                label="Ð˜Ð¼Ðµ Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° *"
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
                label="ÐÐ´Ñ€ÐµÑ *"
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
                label="Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ *"
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
                label="Ð˜Ð¼ÐµÐ¹Ð» Ð½Ð° Ñ„Ð¸Ñ€Ð¼Ð°Ñ‚Ð° *"
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
                label="Ð‘ÑƒÐ»ÑÑ‚Ð°Ñ‚"
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
                label="Ð”Ð”Ð¡ Ð½Ð¾Ð¼ÐµÑ€"
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
                ÐÐ°Ð¿Ñ€ÐµÐ´
              </Button>

              <div className="mt-6 text-center">
                <a
                  href="/login?role=admin"
                  className="text-sm text-textMuted hover:text-textSecondary hover:underline transition-colors"
                >
                  â† ÐÐ°Ð·Ð°Ð´ ÐºÑŠÐ¼ Ð²Ñ…Ð¾Ð´
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleStep2Submit} className="space-y-4">
              <Input
                label="Ð˜Ð¼ÐµÐ¹Ð» *"
                type="email"
                value={adminData.email}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setAdminData({ ...adminData, email: e.target.value })
                }
                error={errors.email}
              />

              <PasswordInput
                label="ÐŸÐ°Ñ€Ð¾Ð»Ð° *"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                value={adminData.password}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setAdminData({ ...adminData, password: e.target.value })
                }
                error={errors.password}
                showStrength
                required
              />

              <PasswordInput
                label="ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð´Ð¸ Ð¿Ð°Ñ€Ð¾Ð»Ð° *"
                placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
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
                    Ð¡ÑŠÐ³Ð»Ð°ÑÑÐ²Ð°Ð¼ ÑÐµ Ñ{' '}
                    <a
                      href="/terms?returnTo=/register"
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

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-sm text-textMuted hover:text-textSecondary hover:underline transition-colors"
                >
                  â† ÐÐ°Ð·Ð°Ð´
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





