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

      // Опитай да вземеш активния сервиз (може да няма)
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
      toast.error('Грешка при зареждане на сервизи');
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
      toast.error('Моля, въведете код на сервиз');
      return;
    }

    setIsSubmitting(true);
    try {
      await requestServiceCompany(uniqueCode);
      toast.success('Заявката е изпратена успешно');
      setUniqueCode('');
      setShowAddForm(false);
      await fetchData();
      await checkActiveService();
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Грешка при изпращане на заявка'
        : 'Грешка при изпращане на заявка';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSwitchService = async (serviceCompanyId: string) => {
    try {
      await switchServiceCompany(serviceCompanyId);
      toast.success('Активният сервиз е сменен успешно');
      await fetchData();
      await checkActiveService();
    } catch {
      toast.error('Грешка при смяна на сервиз');
    }
  };

  const handleCancelRequest = async (membershipId: string) => {
    if (!confirm('Сигурни ли сте, че искате да откажете тази заявка?')) {
      return;
    }

    try {
      await cancelPendingRequest(membershipId);
      toast.success('Заявката е отказана успешно');
      await fetchData();
      await checkActiveService();
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Грешка при отказ на заявка'
        : 'Грешка при отказ на заявка';
      toast.error(message);
    }
  };

  const handleLeaveService = async (membershipId: string) => {
    if (!confirm('Сигурни ли сте, че искате да напуснете този сервиз?')) {
      return;
    }

    try {
      await leaveServiceCompany(membershipId);
      toast.success('Напуснахте сервиза успешно');
      await fetchData();
      await checkActiveService();
    } catch (error: unknown) {
      const message = axios.isAxiosError<{ message?: string }>(error)
        ? error.response?.data?.message ?? 'Грешка при напускане на сервиз'
        : 'Грешка при напускане на сервиз';
      toast.error(message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <Check className="w-4 h-4" />
            Активен
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
            <Clock className="w-4 h-4" />
            Чака одобрение
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-mainBg text-textPrimary">
            Неактивен
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
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Сервиз</h1>
          <p className="text-textSecondary mt-1">
            Управление на принадлежността към сервизи
          </p>
        </div>

        {activeService && (
          <div className="rounded-2xl shadow-card p-4 sm:p-6 text-white bg-gradient-to-r from-primary to-primary-700 dark:bg-cardBg dark:text-textPrimary dark:border dark:border-borderSubtle">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-6 h-6 text-white/90 dark:text-textPrimary" />
              <h2 className="text-xl sm:text-2xl font-bold">Активен сервиз</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 mt-1 text-white/80 dark:text-textMuted" />
                <div>
                  <div className="text-sm text-white/80 dark:text-textSecondary">Име на сервиза</div>
                  <div className="text-lg font-semibold">{activeService.name}</div>
                </div>
              </div>

              {activeService.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 mt-1 text-white/80 dark:text-textMuted" />
                  <div>
                    <div className="text-sm text-white/80 dark:text-textSecondary">Адрес</div>
                    <div className="text-lg font-semibold">{activeService.address}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 mt-1 text-white/80 dark:text-textMuted" />
                <div>
                  <div className="text-sm text-white/80 dark:text-textSecondary">Телефон</div>
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
                  <div className="text-sm text-white/80 dark:text-textSecondary">Имейл</div>
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
            Добави нов сервиз
          </button>
        </div>

        {showAddForm && (
          <div className="bg-cardBg rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <Code className="w-5 h-5 text-primary" />
              <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
                Заявка за нов сервиз
              </h2>
            </div>

            <div className="bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-300 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  Въведете уникалния код на сервиза, предоставен от администратора.
                  След изпращане на заявката, тя ще бъде разгледана от администратора.
                </div>
              </div>
            </div>

            <form onSubmit={handleRequestService} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-textSecondary mb-2">
                  Уникален код на сервиз *
                </label>
                <input
                  type="text"
                  value={uniqueCode}
                  onChange={(e) => setUniqueCode(e.target.value)}
                  placeholder="Напр. ABC-12345"
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
                  {isSubmitting ? 'Изпраща се...' : 'Изпрати заявка'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setUniqueCode('');
                  }}
                  className="px-6 py-2 bg-mainBg text-textPrimary rounded-lg hover:bg-cardBg w-full sm:w-auto"
                >
                  Отказ
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="bg-cardBg rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">
              Моите сервизи ({serviceCompanies.length})
            </h2>
          </div>

          {serviceCompanies.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <Building2 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Все още не сте член на нито един сервиз</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {serviceCompanies.map((membership) => {
                // Активен сервиз е този който е ACTIVE status И съвпада с activeService?.id
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
                      Присъединен: {formatDate(membership.joinedAt)}
                    </div>
                  </div>

                  {membership.status === 'PENDING' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelRequest(membership.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/40 rounded-lg hover:bg-red-200"
                      >
                        <LogOut className="w-4 h-4" />
                        Откажи заявката
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
                          Активирай
                        </button>
                      )}
                      <button
                        onClick={() => handleLeaveService(membership.id)}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200 dark:hover:bg-red-900/40 rounded-lg hover:bg-red-200"
                      >
                        <LogOut className="w-4 h-4" />
                        Напусни
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
