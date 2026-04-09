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
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð¿Ñ€Ð¾Ñ„Ð¸Ð»');
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
      toast.success('Ð”Ð°Ð½Ð½Ð¸Ñ‚Ðµ ÑÐ° Ð°ÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ð¸ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      setIsEditingInfo(false);
      fetchProfile();
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð°ÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð´Ð°Ð½Ð½Ð¸Ñ‚Ðµ');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('ÐŸÐ°Ñ€Ð¾Ð»Ð¸Ñ‚Ðµ Ð½Ðµ ÑÑŠÐ²Ð¿Ð°Ð´Ð°Ñ‚');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ñ‚Ñ€ÑÐ±Ð²Ð° Ð´Ð° Ðµ Ð¿Ð¾Ð½Ðµ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°');
      return;
    }

    setIsChangingPassword(true);

    try {
      await api.put('/client/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('ÐŸÐ°Ñ€Ð¾Ð»Ð°Ñ‚Ð° Ðµ ÑÐ¼ÐµÐ½ÐµÐ½Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordModal(false);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÑÐ¼ÑÐ½Ð° Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°');
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
          <p className="text-textSecondary">ÐŸÑ€Ð¾Ñ„Ð¸Ð»ÑŠÑ‚ Ð½Ðµ Ðµ Ð½Ð°Ð¼ÐµÑ€ÐµÐ½</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">ÐŸÑ€Ð¾Ñ„Ð¸Ð»</h1>
          <p className="text-textSecondary mt-1">Ð›Ð¸Ñ‡Ð½Ð° Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ Ð¸ Ð½Ð°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸</p>
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-textPrimary">
                ÐžÑÐ½Ð¾Ð²Ð½Ð° Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ
              </h2>
            </div>
            {!isEditingInfo && (
              <button
                type="button"
                onClick={() => setIsEditingInfo(true)}
                className="text-sm text-primary hover:text-primary-700 flex items-center gap-1 self-start sm:self-auto"
                aria-label="Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹"
                title="Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹"
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
                    Ð˜Ð¼Ðµ
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ð˜Ð¼Ðµ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Ð¤Ð°Ð¼Ð¸Ð»Ð¸Ñ
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ð¤Ð°Ð¼Ð¸Ð»Ð¸Ñ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    ÐÐ´Ñ€ÐµÑ
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full px-4 py-2 bg-white border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="ÐÐ´Ñ€ÐµÑ"
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
                  Ð—Ð°Ð¿Ð°Ð·Ð¸
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
                  ÐžÑ‚ÐºÐ°Ð·
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <User className="w-4 h-4" />
                  <span>Ð˜Ð¼Ðµ Ð¸ Ñ„Ð°Ð¼Ð¸Ð»Ð¸Ñ</span>
                </div>
                <p className="text-base font-semibold text-textPrimary">
                  {profile.firstName} {profile.lastName}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Mail className="w-4 h-4" />
                  <span>Ð˜Ð¼ÐµÐ¹Ð»</span>
                </div>
                <p className="text-base text-textPrimary">{profile.email}</p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Phone className="w-4 h-4" />
                  <span>Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½</span>
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
                    <span>ÐÐ´Ñ€ÐµÑ</span>
                  </div>
                  <p className="text-base text-textPrimary">{profile.address}</p>
                </div>
              )}
            </div>
          )}
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¾ÑÑ‚</h2>
            </div>
          </div>

          <p className="text-textSecondary mb-4">
            Ð¡Ð¼ÐµÐ½ÐµÑ‚Ðµ Ð¿Ð°Ñ€Ð¾Ð»Ð°Ñ‚Ð° ÑÐ¸, Ð·Ð° Ð´Ð° Ð¾ÑÐ¸Ð³ÑƒÑ€Ð¸Ñ‚Ðµ ÑÐ¸Ð³ÑƒÑ€Ð½Ð¾ÑÑ‚Ñ‚Ð° Ð½Ð° Ð°ÐºÐ°ÑƒÐ½Ñ‚Ð°.
          </p>

          <button
            type="button"
            onClick={() => setShowPasswordModal(true)}
            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 flex items-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Ð¡Ð¼ÑÐ½Ð° Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°
          </button>
        </div>

        
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-4">
            Ð˜Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ Ð·Ð° Ð°ÐºÐ°ÑƒÐ½Ñ‚Ð°
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm text-textSecondary">Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ</p>
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
              Ð¡Ð¼ÑÐ½Ð° Ð½Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°
            </h2>

            <form onSubmit={handleChangePassword}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-textPrimary mb-1">
                    Ð¢ÐµÐºÑƒÑ‰Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°
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
                    ÐÐ¾Ð²Ð° Ð¿Ð°Ñ€Ð¾Ð»Ð°
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
                  <p className="text-xs text-textMuted mt-1">ÐœÐ¸Ð½Ð¸Ð¼ÑƒÐ¼ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð°</p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-textPrimary mb-1">
                    ÐŸÐ¾Ñ‚Ð²ÑŠÑ€Ð´Ð¸ Ð¿Ð°Ñ€Ð¾Ð»Ð°
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
                  {isChangingPassword ? 'Ð¡Ð¼ÑÐ½Ð°...' : 'Ð¡Ð¼ÐµÐ½Ð¸ Ð¿Ð°Ñ€Ð¾Ð»Ð°'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="w-full sm:w-auto flex-1 px-4 py-2 bg-gray-200 text-textPrimary rounded-lg hover:bg-gray-300"
                >
                  ÐžÑ‚ÐºÐ°Ð·
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

