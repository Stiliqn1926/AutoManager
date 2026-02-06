import { useState, useEffect, useCallback } from 'react';
import { User, Mail, Phone, MapPin, Lock, Save, Edit2, X } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ProfileData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string | null;
  createdAt: string;
}

const Profile = () => {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await api.get('/client/profile');
      setProfile(response.data.profile);
      setFirstName(response.data.profile.firstName);
      setLastName(response.data.profile.lastName);
      setPhone(response.data.profile.phone);
      setAddress(response.data.profile.address || '');
    } catch {
      toast.error('Грешка при зареждане на профил');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSaveInfo = async () => {
    try {
      await api.put('/client/profile', { firstName, lastName, phone, address });
      toast.success('Данните са актуализирани успешно');
      setIsEditingInfo(false);
      fetchProfile();
    } catch {
      toast.error('Грешка при актуализиране на данните');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Паролите не съвпадат');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Паролата трябва да е поне 8 символа');
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.put('/client/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Паролата е сменена успешно');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Грешка при смяна на парола');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!profile) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary">Профилът не е намерен</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Профил</h1>
          <p className="text-textSecondary mt-1">Лична информация и настройки</p>
        </div>

        {/* Основна информация */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-textPrimary">
                Основна информация
              </h2>
            </div>
            {!isEditingInfo && (
              <button
                type="button"
                onClick={() => setIsEditingInfo(true)}
                className="text-sm text-primary hover:text-primary-700 flex items-center gap-1"
                aria-label="Редактирай"
                title="Редактирай"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {isEditingInfo ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Име
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Име"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Фамилия"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Телефон
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Телефон"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Адрес
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Адрес"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSaveInfo}
                  className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Запази
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingInfo(false);
                    if (profile) {
                      setFirstName(profile.firstName);
                      setLastName(profile.lastName);
                      setPhone(profile.phone);
                      setAddress(profile.address || '');
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-gray-200 text-textPrimary rounded-lg hover:bg-gray-300 flex items-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Отказ
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <User className="w-4 h-4" />
                  <span>Име и фамилия</span>
                </div>
                <p className="text-base font-semibold text-textPrimary">
                  {profile.firstName} {profile.lastName}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Mail className="w-4 h-4" />
                  <span>Имейл</span>
                </div>
                <p className="text-base text-textPrimary">{profile.email}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Phone className="w-4 h-4" />
                  <span>Телефон</span>
                </div>
                <a
                  href={`tel:${profile.phone}`}
                  className="text-base font-medium text-primary hover:underline"
                >
                  {profile.phone}
                </a>
              </div>

              {profile.address && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                    <MapPin className="w-4 h-4" />
                    <span>Адрес</span>
                  </div>
                  <p className="text-base text-textPrimary">{profile.address}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Смяна на парола */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Сигурност</h2>
            </div>
          </div>

          <p className="text-textSecondary mb-4">
            Сменете паролата си, за да осигурите сигурността на акаунта.
          </p>

          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Смяна на парола
          </button>
        </div>

        {/* Статистика */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-4">
            Информация за акаунта
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-textSecondary">Регистрация</p>
              <p className="font-medium text-textPrimary">
                {formatDate(profile.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-card p-4 sm:p-6 max-w-md w-full">
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              Смяна на парола
            </h2>

            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-textPrimary mb-1">
                    Текуща парола
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, currentPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-textPrimary mb-1">
                    Нова парола
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, newPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                    minLength={8}
                  />
                  <p className="text-xs text-textMuted mt-1">Минимум 8 символа</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-textPrimary mb-1">
                    Потвърди парола
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) =>
                      setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="w-full sm:w-auto flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {isChangingPassword ? 'Смяна...' : 'Смени парола'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="w-full sm:w-auto flex-1 px-4 py-2 bg-gray-200 text-textPrimary rounded-lg hover:bg-gray-300"
                >
                  Отказ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Profile;
