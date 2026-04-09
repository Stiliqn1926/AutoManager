import { useState, useEffect, useCallback } from 'react';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Calendar,
  CheckCircle,
  ClipboardList,
  TrendingUp,
  Edit2,
  Save,
  X,
  Activity,
  CalendarDays,
  Clock,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import {
  getMechanicProfile,
  updateMechanicProfile,
  getMechanicStatistics,
} from '../../services/mechanicService';
import type { MechanicProfile, MechanicStatistics } from '../../types/mechanic';
import toast from 'react-hot-toast';

const Profile = () => {
  const [profile, setProfile] = useState<MechanicProfile | null>(null);
  const [statistics, setStatistics] = useState<MechanicStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingSkills, setIsEditingSkills] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [skills, setSkills] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialization, setSpecialization] = useState('');

  const fetchProfile = useCallback(async () => {
    try {
      const data = await getMechanicProfile();
      setProfile(data.worker);
      setSkills(data.worker.skills || '');
      setFirstName(data.worker.firstName);
      setLastName(data.worker.lastName);
      setPhone(data.worker.phone);
      setSpecialization(data.worker.specialization || '');
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð¿Ñ€Ð¾Ñ„Ð¸Ð»');
    }
  }, []);

  const fetchStatistics = useCallback(async () => {
    try {
      const data = await getMechanicStatistics();
      setStatistics(data.statistics);
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ°');
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchProfile(), fetchStatistics()]);
      setIsLoading(false);
    };
    loadData();
  }, [fetchProfile, fetchStatistics]);

  const handleSaveSkills = async () => {
    try {
      await updateMechanicProfile({ skills });
      toast.success('Ð£Ð¼ÐµÐ½Ð¸ÑÑ‚Ð° ÑÐ° Ð°ÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ð¸ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      setIsEditingSkills(false);
      fetchProfile();
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð°ÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° ÑƒÐ¼ÐµÐ½Ð¸Ñ');
    }
  };

  const handleSaveInfo = async () => {
    try {
      await updateMechanicProfile({ firstName, lastName, phone, specialization });
      toast.success('Ð”Ð°Ð½Ð½Ð¸Ñ‚Ðµ ÑÐ° Ð°ÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ð¸ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      setIsEditingInfo(false);
      fetchProfile();
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð°ÐºÑ‚ÑƒÐ°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð´Ð°Ð½Ð½Ð¸Ñ‚Ðµ');
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
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!profile || !statistics) {
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
          <p className="text-textSecondary mt-1">Ð›Ð¸Ñ‡Ð½Ð° Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ Ð¸ ÑÑ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ°</p>
        </div>

        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
                ÐžÑÐ½Ð¾Ð²Ð½Ð° Ð¸Ð½Ñ„Ð¾Ñ€Ð¼Ð°Ñ†Ð¸Ñ
              </h2>
            </div>
            {!isEditingInfo && (
              <button
                onClick={() => setIsEditingInfo(true)}
                className="text-sm text-primary hover:text-primary-700 flex items-center gap-1 w-fit sm:ml-auto"
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
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
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
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-textSecondary mb-2">
                    Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ
                  </label>
                  <input
                    type="text"
                    value={specialization}
                    onChange={(e) => setSpecialization(e.target.value)}
                    className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={handleSaveInfo}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 w-full sm:w-auto"
                >
                  <Save className="w-4 h-4" />
                  Ð—Ð°Ð¿Ð°Ð·Ð¸
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingInfo(false);
                    setFirstName(profile.firstName);
                    setLastName(profile.lastName);
                    setPhone(profile.phone);
                    setSpecialization(profile.specialization || '');
                  }}
                  className="px-4 py-2 bg-gray-200 text-textPrimary rounded-lg hover:bg-gray-300 flex items-center gap-2 w-full sm:w-auto"
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
                <p className="text-base text-textPrimary">
                  {profile.user.email}
                </p>
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

              {profile.specialization && (
                <div>
                  <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                    <Briefcase className="w-4 h-4" />
                    <span>Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ</span>
                  </div>
                  <p className="text-base text-textPrimary">
                    {profile.specialization}
                  </p>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <Calendar className="w-4 h-4" />
                  <span>Ð”Ð°Ñ‚Ð° Ð½Ð° Ð½Ð°Ð·Ð½Ð°Ñ‡Ð°Ð²Ð°Ð½Ðµ</span>
                </div>
                <p className="text-base text-textPrimary">
                  {formatDate(profile.createdAt)}
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 text-sm text-textSecondary mb-1">
                  <CheckCircle className="w-4 h-4" />
                  <span>Ð¡Ñ‚Ð°Ñ‚ÑƒÑ</span>
                </div>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    profile.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {profile.isActive ? 'ÐÐºÑ‚Ð¸Ð²ÐµÐ½' : 'ÐÐµÐ°ÐºÑ‚Ð¸Ð²ÐµÐ½'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
                ÐŸÑ€Ð¾Ñ„ÐµÑÐ¸Ð¾Ð½Ð°Ð»Ð½Ð¸ Ð´Ð°Ð½Ð½Ð¸
              </h2>
            </div>
            {!isEditingSkills && (
              <button
                onClick={() => setIsEditingSkills(true)}
                className="text-sm text-primary hover:text-primary-700 flex items-center gap-1 w-fit sm:ml-auto"
                aria-label="Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹"
                title="Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-textSecondary mb-2">
              Ð£Ð¼ÐµÐ½Ð¸Ñ
            </label>

            {isEditingSkills ? (
              <div className="space-y-2">
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={5}
                  className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="ÐÐ°Ð¿Ñ€. Ð”Ð¸Ð°Ð³Ð½Ð¾ÑÑ‚Ð¸ÐºÐ° Ð½Ð° Ð´Ð²Ð¸Ð³Ð°Ñ‚ÐµÐ»Ð¸, ÑÐ¼ÑÐ½Ð° Ð½Ð° Ð¼Ð°ÑÐ»Ð¾, Ñ€ÐµÐ¼Ð¾Ð½Ñ‚ Ð½Ð° ÑÐ¿Ð¸Ñ€Ð°Ñ‡ÐºÐ¸..."
                />
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleSaveSkills}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 flex items-center gap-2 w-full sm:w-auto"
                  >
                    <Save className="w-4 h-4" />
                    Ð—Ð°Ð¿Ð°Ð·Ð¸
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingSkills(false);
                      setSkills(profile.skills || '');
                    }}
                    className="px-4 py-2 bg-gray-200 text-textPrimary rounded-lg hover:bg-gray-300 flex items-center gap-2 w-full sm:w-auto"
                  >
                    <X className="w-4 h-4" />
                    ÐžÑ‚ÐºÐ°Ð·
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-base text-textPrimary bg-gray-50 p-3 sm:p-4 rounded-lg whitespace-pre-wrap">
                {profile.skills || 'ÐÑÐ¼Ð° Ð´Ð¾Ð±Ð°Ð²ÐµÐ½Ð¸ ÑƒÐ¼ÐµÐ½Ð¸Ñ'}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
                Ð¡Ñ‚Ð°Ñ‚Ð¸ÑÑ‚Ð¸ÐºÐ°
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-borderSubtle rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 text-textSecondary">
                      <ClipboardList className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-textSecondary">
                      ÐžÐ±Ñ‰Ð¾ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-textPrimary">
                    {statistics.totalOrders}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-borderSubtle rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 text-textSecondary">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-textSecondary">
                      Ð—Ð°Ð²ÑŠÑ€ÑˆÐµÐ½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-textPrimary">
                    {statistics.completedOrders}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-borderSubtle rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 text-textSecondary">
                      <Activity className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-textSecondary">
                      ÐÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-textPrimary">
                    {statistics.activeOrders}
                  </span>
                </div>
              </div>

              {statistics.lastCompletedOrder && (
                <div className="pt-3 border-t border-borderSubtle">
                  <div className="text-sm text-textSecondary mb-1">
                    ÐŸÐ¾ÑÐ»ÐµÐ´Ð½Ð° Ð·Ð°Ð²ÑŠÑ€ÑˆÐµÐ½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°
                  </div>
                  <div className="text-base font-semibold text-textPrimary">
                    {statistics.lastCompletedOrder.displayOrderNumber || statistics.lastCompletedOrder.orderNumber}
                  </div>
                  <div className="text-xs text-textSecondary">
                    {formatDate(
                      statistics.lastCompletedOrder.completedDate
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
                Ð Ð°Ð±Ð¾Ñ‚Ð½Ð¾ Ð½Ð°Ñ‚Ð¾Ð²Ð°Ñ€Ð²Ð°Ð½Ðµ
              </h2>
            </div>

            <div className="space-y-4">
              <div className="bg-white border border-borderSubtle rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 text-textSecondary">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-textSecondary">
                      ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ¸ Ð´Ð½ÐµÑ
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-textPrimary">
                    {statistics.ordersToday}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-borderSubtle rounded-lg p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 text-textSecondary">
                      <CalendarDays className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-textSecondary">
                      ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ¸ Ñ‚Ð°Ð·Ð¸ ÑÐµÐ´Ð¼Ð¸Ñ†Ð°
                    </span>
                  </div>
                  <span className="text-xl sm:text-2xl font-bold text-textPrimary">
                    {statistics.ordersThisWeek}
                  </span>
                </div>
              </div>

              <div className="bg-white border border-borderSubtle rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gray-100 text-textSecondary">
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-sm text-textSecondary">
                      ÐŸÑ€ÐµÐ´ÑÑ‚Ð¾ÑÑ‰Ð¸ Ð·Ð°Ð´Ð°Ñ‡Ð¸
                    </span>
                  </div>
                  <span className="text-2xl font-bold text-textPrimary">
                    {statistics.upcomingTasks}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;


