import { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Code,
  Plus,
  Check,
  Clock,
  LogOut,
  ArrowRightLeft,
  AlertCircle,
} from 'lucide-react';
import axios from 'axios';
import MainLayout from '../../components/layout/MainLayout';
import { useActiveService } from '../../hooks/useActiveService';
import {
  getMechanicServiceCompanies,
  getActiveServiceCompany,
  requestServiceCompany,
  switchServiceCompany,
  cancelPendingRequest,
  leaveServiceCompany,
} from '../../services/mechanicService';
import type {
  MechanicServiceCompany,
  ActiveServiceCompanyResponse,
} from '../../types/mechanic';
import toast from 'react-hot-toast';

const ServiceSettings = () => {
  const { checkActiveService } = useActiveService();
  const [activeService, setActiveService] = useState<ActiveServiceCompanyResponse['serviceCompany'] | null>(null);
  const [serviceCompanies, setServiceCompanies] = useState<MechanicServiceCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const companiesData = await getMechanicServiceCompanies();
      setServiceCompanies(companiesData.serviceCompanies);


      try {
        const activeData = await getActiveServiceCompany();
        setActiveService(activeData.serviceCompany);
      } catch (error: unknown) {
        const err = error as { response?: { data?: { code?: string } } };
        if (err.response?.data?.code === 'NO_ACTIVE_SERVICE' || err.response?.data?.code === 'NO_ACTIVE_MEMBERSHIP') {
          setActiveService(null);
        } else {
          throw error;
        }
      }
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð¸');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRequestService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uniqueCode.trim()) {
      toast.error('ÐœÐ¾Ð»Ñ, Ð²ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ ÐºÐ¾Ð´ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestServiceCompany(uniqueCode);
      toast.success('Ð—Ð°ÑÐ²ÐºÐ°Ñ‚Ð° Ðµ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÐ½Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      setUniqueCode('');
      setShowAddForm(false);
      await fetchData();
      await checkActiveService();
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ð¿Ñ€Ð°Ñ‰Ð°Ð½Ðµ Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ°'
        : 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ð¿Ñ€Ð°Ñ‰Ð°Ð½Ðµ Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ°';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchService = async (serviceCompanyId: string) => {
    try {
      await switchServiceCompany(serviceCompanyId);
      toast.success('ÐÐºÑ‚Ð¸Ð²Ð½Ð¸ÑÑ‚ ÑÐµÑ€Ð²Ð¸Ð· Ðµ ÑÐ¼ÐµÐ½ÐµÐ½ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      await fetchData();
      await checkActiveService();
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÑÐ¼ÑÐ½Ð° Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·');
    }
  };

  const handleCancelRequest = async (membershipId: string) => {
    if (!confirm('Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¾Ñ‚ÐºÐ°Ð¶ÐµÑ‚Ðµ Ñ‚Ð°Ð·Ð¸ Ð·Ð°ÑÐ²ÐºÐ°?')) {
      return;
    }

    try {
      await cancelPendingRequest(membershipId);
      toast.success('Ð—Ð°ÑÐ²ÐºÐ°Ñ‚Ð° Ðµ Ð¾Ñ‚ÐºÐ°Ð·Ð°Ð½Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      await fetchData();
      await checkActiveService();
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ñ‚ÐºÐ°Ð· Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ°'
        : 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ñ‚ÐºÐ°Ð· Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ°';
      toast.error(message);
    }
  };

  const handleLeaveService = async (membershipId: string) => {
    if (!confirm('Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð½Ð°Ð¿ÑƒÑÐ½ÐµÑ‚Ðµ Ñ‚Ð¾Ð·Ð¸ ÑÐµÑ€Ð²Ð¸Ð·?')) {
      return;
    }

    try {
      await leaveServiceCompany(membershipId);
      toast.success('ÐÐ°Ð¿ÑƒÑÐ½Ð°Ñ…Ñ‚Ðµ ÑÐµÑ€Ð²Ð¸Ð·Ð° ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      await fetchData();
      await checkActiveService();
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð½Ð°Ð¿ÑƒÑÐºÐ°Ð½Ðµ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·'
        : 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð½Ð°Ð¿ÑƒÑÐºÐ°Ð½Ðµ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·';
      toast.error(message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <Check className="w-4 h-4" />
            ÐÐºÑ‚Ð¸Ð²ÐµÐ½
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            <Clock className="w-4 h-4" />
            Ð§Ð°ÐºÐ° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-mainBg text-textPrimary">
            ÐÐµÐ°ÐºÑ‚Ð¸Ð²ÐµÐ½
          </span>
        );
      default:
        return null;
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

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Ð¡ÐµÑ€Ð²Ð¸Ð·</h1>
          <p className="text-textSecondary mt-1">
            Ð£Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ðµ Ð½Ð° Ð¿Ñ€Ð¸Ð½Ð°Ð´Ð»ÐµÐ¶Ð½Ð¾ÑÑ‚Ñ‚Ð° ÐºÑŠÐ¼ ÑÐµÑ€Ð²Ð¸Ð·Ð¸
          </p>
        </div>

        {activeService && (
          <div className="rounded-2xl shadow-card p-4 sm:p-6 text-white bg-gradient-to-r from-primary to-primary-700 dark:bg-cardBg dark:text-textPrimary dark:border dark:border-borderSubtle">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-6 h-6 text-white/90 dark:text-textPrimary" />
              <h2 className="text-xl sm:text-2xl font-bold">ÐÐºÑ‚Ð¸Ð²ÐµÐ½ ÑÐµÑ€Ð²Ð¸Ð·</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 mt-1 text-white/80 dark:text-textMuted" />
                <div>
                  <div className="text-sm text-white/80 dark:text-textSecondary">Ð˜Ð¼Ðµ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð°</div>
                  <div className="text-lg font-semibold">{activeService.name}</div>
                </div>
              </div>

              {activeService.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 text-white/80 dark:text-textMuted" />
                  <div>
                    <div className="text-sm text-white/80 dark:text-textSecondary">ÐÐ´Ñ€ÐµÑ</div>
                    <div className="text-lg font-semibold">{activeService.address}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-1 text-white/80 dark:text-textMuted" />
                <div>
                  <div className="text-sm text-white/80 dark:text-textSecondary">Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½</div>
                  <a
                    href={`tel:${activeService.phone}`}
                    className="text-base sm:text-lg font-semibold hover:underline"
                  >
                    {activeService.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 mt-1 text-white/80 dark:text-textMuted" />
                <div>
                  <div className="text-sm text-white/80 dark:text-textSecondary">Ð˜Ð¼ÐµÐ¹Ð»</div>
                  <a
                    href={`mailto:${activeService.email}`}
                    className="text-base sm:text-lg font-semibold hover:underline"
                  >
                    {activeService.email}
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex sm:justify-end">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Ð”Ð¾Ð±Ð°Ð²Ð¸ Ð½Ð¾Ð² ÑÐµÑ€Ð²Ð¸Ð·
          </button>
        </div>

        {showAddForm && (
          <div className="bg-cardBg rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
                Ð—Ð°ÑÐ²ÐºÐ° Ð·Ð° Ð½Ð¾Ð² ÑÐµÑ€Ð²Ð¸Ð·
              </h2>
            </div>

            <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-300 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ ÑƒÐ½Ð¸ÐºÐ°Ð»Ð½Ð¸Ñ ÐºÐ¾Ð´ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð°, Ð¿Ñ€ÐµÐ´Ð¾ÑÑ‚Ð°Ð²ÐµÐ½ Ð¾Ñ‚ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€Ð°.
                  Ð¡Ð»ÐµÐ´ Ð¸Ð·Ð¿Ñ€Ð°Ñ‰Ð°Ð½Ðµ Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ°Ñ‚Ð°, Ñ‚Ñ Ñ‰Ðµ Ð±ÑŠÐ´Ðµ Ñ€Ð°Ð·Ð³Ð»ÐµÐ´Ð°Ð½Ð° Ð¾Ñ‚ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€Ð°.
                </div>
              </div>
            </div>

            <form onSubmit={handleRequestService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Ð£Ð½Ð¸ÐºÐ°Ð»ÐµÐ½ ÐºÐ¾Ð´ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð· *
                </label>
                <input
                  type="text"
                  value={uniqueCode}
                  onChange={(e) => setUniqueCode(e.target.value)}
                  placeholder="ÐÐ°Ð¿Ñ€. ABC-12345"
                  className="w-full px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                >
                  {isSubmitting ? 'Ð˜Ð·Ð¿Ñ€Ð°Ñ‰Ð° ÑÐµ...' : 'Ð˜Ð·Ð¿Ñ€Ð°Ñ‚Ð¸ Ð·Ð°ÑÐ²ÐºÐ°'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setUniqueCode('');
                  }}
                  className="px-6 py-2 bg-mainBg text-textPrimary rounded-lg hover:bg-cardBg w-full sm:w-auto"
                >
                  ÐžÑ‚ÐºÐ°Ð·
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-cardBg rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
              ÐœÐ¾Ð¸Ñ‚Ðµ ÑÐµÑ€Ð²Ð¸Ð·Ð¸ ({serviceCompanies.length})
            </h2>
          </div>

          {serviceCompanies.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Ð’ÑÐµ Ð¾Ñ‰Ðµ Ð½Ðµ ÑÑ‚Ðµ Ñ‡Ð»ÐµÐ½ Ð½Ð° Ð½Ð¸Ñ‚Ð¾ ÐµÐ´Ð¸Ð½ ÑÐµÑ€Ð²Ð¸Ð·</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {serviceCompanies.map((membership) => {

                const isActiveService = membership.status === 'ACTIVE' &&
                  activeService &&
                  membership.serviceCompany.id === activeService.id;

                return (
                <div
                  key={membership.id}
                  className={`border rounded-lg p-3 sm:p-4 ${
                    isActiveService
                      ? 'border-primary bg-primary-50 dark:bg-primary/10'
                      : 'border-borderSubtle'
                  }`}
                >
                  <div className="flex flex-col sm:items-start gap-2 mb-3">
                    <div className="flex items-center justify-between gap-2 w-full">
                      <h3 className="font-semibold text-textPrimary text-base sm:text-lg">
                        {membership.serviceCompany.name}
                      </h3>
                      {getStatusBadge(membership.status)}
                    </div>
                    <p className="text-sm text-textSecondary">
                      {membership.serviceCompany.address}
                    </p>
                  </div>

                  <div className="space-y-2 text-sm text-textSecondary mb-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      {membership.serviceCompany.phone}
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {membership.serviceCompany.email}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      ÐŸÑ€Ð¸ÑÑŠÐµÐ´Ð¸Ð½ÐµÐ½: {formatDate(membership.joinedAt)}
                    </div>
                  </div>

                  {membership.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelRequest(membership.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/40 rounded-lg hover:bg-red-200"
                      >
                        <LogOut className="w-4 h-4" />
                        ÐžÑ‚ÐºÐ°Ð¶Ð¸ Ð·Ð°ÑÐ²ÐºÐ°Ñ‚Ð°
                      </button>
                    </div>
                  )}

                  {membership.status === 'ACTIVE' && (
                    <div className="flex gap-2">
                      {membership.serviceCompany.id !== activeService?.id && (
                        <button
                          onClick={() => handleSwitchService(membership.serviceCompany.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary-700"
                        >
                          <ArrowRightLeft className="w-4 h-4" />
                          ÐÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹
                        </button>
                      )}
                      <button
                        onClick={() => handleLeaveService(membership.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/40 rounded-lg hover:bg-red-200"
                      >
                        <LogOut className="w-4 h-4" />
                        ÐÐ°Ð¿ÑƒÑÐ½Ð¸
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default ServiceSettings;

