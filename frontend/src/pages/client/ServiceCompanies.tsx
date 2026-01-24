import { useState, useEffect, useCallback } from 'react';
import { useServiceCompany } from '../../hooks/useServiceCompany';
import { Building2, Plus, LogOut, CheckCircle, Clock, XCircle } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';

const getErrorMessage = (error: unknown, fallbackMessage: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    if (data && typeof data === 'object' && 'message' in data) {
      const message = (data as { message?: unknown }).message;
      if (typeof message === 'string') {
        return message;
      }
    }
  }

  return fallbackMessage;
};

interface ServiceCompanyWithStatus {
  clientId: string;
  serviceCompany: {
    id: string;
    name: string;
    address: string | null;
    phone: string;
    email: string;
    uniqueCode: string;
  };
  status?: 'ACTIVE' | 'PENDING';
  joinedAt?: string;
}

interface PendingServiceCompanyRequest {
  id: string;
  createdAt: string;
  serviceCompany: ServiceCompanyWithStatus['serviceCompany'];
}

const ServiceCompanies = () => {
  const {
    serviceCompanies,
    selectedServiceCompany,
    setSelectedServiceCompany,
    refreshServiceCompanies,
    isLoading,
  } = useServiceCompany();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [uniqueCode, setUniqueCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [allCompanies, setAllCompanies] = useState<ServiceCompanyWithStatus[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);

  const fetchAllCompanies = useCallback(async () => {
    setIsLoadingCompanies(true);
    try {
      // Вземи ACTIVE компаниите
      const activeCompanies = serviceCompanies.map(sc => ({
        ...sc,
        status: 'ACTIVE' as const,
      }));

      // Вземи PENDING заявките
      const pendingResponse = await api.get('/client/service-companies/pending');
      const pendingRequests: PendingServiceCompanyRequest[] = Array.isArray(
        pendingResponse.data?.pendingRequests
      )
        ? pendingResponse.data.pendingRequests
        : [];

      // Преобразувай pending requests в същия формат
      const pendingCompanies: ServiceCompanyWithStatus[] = pendingRequests.map((req) => ({
        clientId: req.id, // Използваме request ID като временен clientId
        serviceCompany: req.serviceCompany,
        status: 'PENDING' as const,
        joinedAt: req.createdAt,
      }));

      // Комбинирай и сортирай (ACTIVE първо, после PENDING)
      const allCompanies = [...activeCompanies, ...pendingCompanies].sort((a, b) => {
        if (a.status === 'ACTIVE' && b.status === 'PENDING') return -1;
        if (a.status === 'PENDING' && b.status === 'ACTIVE') return 1;
        return 0;
      });

      setAllCompanies(allCompanies);
    } catch (error) {
      console.error('Error fetching all companies:', error);
      // Fallback на serviceCompanies от context
      setAllCompanies(serviceCompanies.map(sc => ({ ...sc, status: 'ACTIVE' as const })));
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [serviceCompanies]);

  // Зареди всички компании (ACTIVE + PENDING) само когато serviceCompanies се изменят
  useEffect(() => {
    fetchAllCompanies();
  }, [fetchAllCompanies]);

  // Премахнато автоматичното отваряне на модала - има бутон "Добави сервиз"

  const handleAddServiceCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uniqueCode.trim()) {
      toast.error('Моля въведете уникален код');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/client/service-companies/add', {
        uniqueCode: uniqueCode.toUpperCase(),
      });

      // Проверка за PENDING статус
      if (response.data.status === 'PENDING') {
        toast.success('Заявката е изпратена! Очаква одобрение от администратора.');
      } else {
        toast.success('Успешно се добавихте към сервиз!');
      }

      setUniqueCode('');
      setIsModalOpen(false);
      await refreshServiceCompanies();
      await fetchAllCompanies();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Грешка при добавяне';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPendingRequest = async (requestId: string, serviceName: string) => {
    if (
      !window.confirm(
        `Сигурни ли сте, че искате да откажете заявката към "${serviceName}"?`
      )
    ) {
      return;
    }

    try {
      // Изтриваме pending request директно
      await api.delete(`/client/service-companies/pending/${requestId}`);
      toast.success('Заявката е отказана');
      await refreshServiceCompanies();
      await fetchAllCompanies();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Грешка при отказ на заявка');
      toast.error(message);
    }
  };

  const handleLeaveServiceCompany = async (clientId: string, serviceName: string) => {
    if (
      !window.confirm(
        `Сигурни ли сте, че искате да напуснете "${serviceName}"?\n\nЩе загубите достъп до всички данни в този сервиз.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/client/service-companies/${clientId}/leave`);
      toast.success('Успешно напуснахте сервиза');
      await refreshServiceCompanies();
      await fetchAllCompanies();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Грешка при напускане');
      toast.error(message);
    }
  };

  const handleSelectServiceCompany = (companyId: string) => {
    setSelectedServiceCompany(companyId);
    toast.success('Сервизът е избран');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: 'ACTIVE' | 'PENDING') => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <CheckCircle className="w-4 h-4" />
            Активен
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-4 h-4" />
            Чака одобрение
          </span>
        );
      default:
        return null;
    }
  };

  if (isLoading || isLoadingCompanies) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-textPrimary">Моите сервизи</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Добави сервиз
          </button>
        </div>

        {allCompanies.length === 0 ? (
          <div className="bg-cardBg rounded-2xl shadow-card p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-textPrimary mb-2">
              Няма добавени сервизи
            </h2>
            <p className="text-textSecondary mb-6">
              За да започнете, добавете първия си сервиз с уникален код
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Добави първи сервиз
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {allCompanies.map((company) => {
              const isSelected = selectedServiceCompany?.id === company.serviceCompany.id;
              const isActive = company.status === 'ACTIVE';
              const isPending = company.status === 'PENDING';

              return (
                <div
                  key={company.clientId}
                  className={`bg-cardBg rounded-2xl shadow-card p-6 relative transition-all ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  } ${isPending ? 'opacity-75' : ''}`}
                >
                  {/* Status Badge */}
                  <div className="absolute top-4 right-4">
                    {getStatusBadge(company.status || 'ACTIVE')}
                  </div>

                  {/* Икона */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg ${isPending ? 'bg-yellow-100' : 'bg-primary/10'}`}>
                      <Building2 className={`w-6 h-6 ${isPending ? 'text-yellow-600' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-textPrimary">
                        {company.serviceCompany.name}
                      </h3>
                      {isSelected && isActive && (
                        <span className="text-xs text-primary font-medium">Активен</span>
                      )}
                    </div>
                  </div>

                  {/* Детайли */}
                  <div className="space-y-2 mb-6">
                    <div className="flex items-start gap-2 text-sm text-textSecondary">
                      <span className="font-medium min-w-[70px]">Адрес:</span>
                      <span>{company.serviceCompany.address || 'Няма данни'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-textSecondary">
                      <span className="font-medium min-w-[70px]">Телефон:</span>
                      <span>{company.serviceCompany.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-textSecondary">
                      <span className="font-medium min-w-[70px]">Email:</span>
                      <span>{company.serviceCompany.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-textSecondary">
                      <span className="font-medium min-w-[70px]">Код:</span>
                      <span className="font-mono font-semibold text-primary">
                        {company.serviceCompany.uniqueCode}
                      </span>
                    </div>
                    {company.joinedAt && (
                      <div className="flex items-center gap-2 text-sm text-textSecondary">
                        <span className="font-medium min-w-[70px]">{isPending ? 'Заявено на:' : 'Присъединен:'}</span>
                        <span>{formatDate(company.joinedAt)}</span>
                      </div>
                    )}
                  </div>

                  {/* Действия */}
                  {isPending ? (
                    <div className="flex">
                      <button
                        onClick={() => handleCancelPendingRequest(company.clientId, company.serviceCompany.name)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-error text-error rounded-lg hover:bg-error/10 transition-colors text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        Откажи заявката
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 items-center gap-2">
                      <div />
                      <div className="flex justify-center">
                        {isActive && !isSelected && (
                          <button
                            onClick={() => handleSelectServiceCompany(company.serviceCompany.id)}
                            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                          >
                            Избери
                          </button>
                        )}
                      </div>
                      <div className="flex justify-end">
                        {isActive && (
                          <button
                            onClick={() => handleLeaveServiceCompany(company.clientId, company.serviceCompany.name)}
                            className="flex items-center gap-2 px-4 py-2 border border-error text-error rounded-lg hover:bg-error/10 transition-colors text-sm font-medium"
                            title="Напусни сервиз"
                          >
                            <LogOut className="w-4 h-4" />
                            {isSelected ? 'Напусни' : ''}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Modal за добавяне на сервиз */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-textPrimary mb-4">
                Добави сервиз
              </h2>
              <p className="text-textSecondary mb-6">
                Въведете уникалния код на сервиза, към който искате да се добавите
              </p>

              <form onSubmit={handleAddServiceCompany}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Уникален код
                  </label>
                  <input
                    type="text"
                    value={uniqueCode}
                    onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                    placeholder="напр. NK8UR4MM"
                    maxLength={8}
                    className="w-full px-4 py-3 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-lg uppercase"
                    autoFocus
                  />
                  <p className="text-xs text-textMuted mt-2">
                    Кодът се състои от 8 символа (букви и цифри)
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setUniqueCode('');
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 border border-borderSubtle text-textSecondary rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Отказ
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !uniqueCode.trim()}
                    className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Добавяне...' : 'Добави'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ServiceCompanies;
