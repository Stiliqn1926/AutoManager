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
  status?: 'ACTIVE' | 'PENDING' | 'LEFT';
  joinedAt?: string;
  leftAt?: string | null;
  requestId?: string;
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
      const pendingResponse = await api.get('/client/service-companies/pending');
      const pendingRequests: PendingServiceCompanyRequest[] = Array.isArray(
        pendingResponse.data?.pendingRequests
      )
        ? pendingResponse.data.pendingRequests
        : [];
      const pendingByServiceId = new Map(
        pendingRequests.map((req) => [req.serviceCompany.id, req])
      );


      const activeCompanies = serviceCompanies.map((sc) => {
        const pending = pendingByServiceId.get(sc.serviceCompany.id);
        if (pending) {
          return {
            ...sc,
            status: 'PENDING' as const,
            joinedAt: pending.createdAt,
            leftAt: sc.leftAt ?? null,
            requestId: pending.id,
          };
        }
        return {
          ...sc,
          status: sc.status ?? ('ACTIVE' as const),
          joinedAt: sc.joinedAt,
          leftAt: sc.leftAt ?? null,
        };
      });

      const activeServiceIds = new Set(
        activeCompanies.map((company) => company.serviceCompany.id)
      );


      const pendingCompanies: ServiceCompanyWithStatus[] = pendingRequests
        .filter((req) => !activeServiceIds.has(req.serviceCompany.id))
        .map((req) => ({
          clientId: req.id,
          serviceCompany: req.serviceCompany,
          status: 'PENDING' as const,
          joinedAt: req.createdAt,
          requestId: req.id,
        }));


      const statusOrder = { ACTIVE: 0, PENDING: 1, LEFT: 2 } as const;
      const allCompanies = [...activeCompanies, ...pendingCompanies].sort((a, b) => {
        const aOrder = statusOrder[a.status || 'ACTIVE'] ?? 0;
        const bOrder = statusOrder[b.status || 'ACTIVE'] ?? 0;
        return aOrder - bOrder;
      });

      setAllCompanies(allCompanies);
    } catch (error) {
      console.error('Error fetching all companies:', error);

      setAllCompanies(
        serviceCompanies.map((sc) => ({
          ...sc,
          status: sc.status ?? ('ACTIVE' as const),
          joinedAt: sc.joinedAt,
          leftAt: sc.leftAt ?? null,
        }))
      );
    } finally {
      setIsLoadingCompanies(false);
    }
  }, [serviceCompanies]);


  useEffect(() => {
    fetchAllCompanies();
  }, [fetchAllCompanies]);



  const handleAddServiceCompany = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uniqueCode.trim()) {
      toast.error('ÐœÐ¾Ð»Ñ Ð²ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ ÑƒÐ½Ð¸ÐºÐ°Ð»ÐµÐ½ ÐºÐ¾Ð´');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await api.post('/client/service-companies/add', {
        uniqueCode: uniqueCode.toUpperCase(),
      });


      if (response.data.status === 'PENDING') {
        toast.success('Ð—Ð°ÑÐ²ÐºÐ°Ñ‚Ð° Ðµ Ð¸Ð·Ð¿Ñ€Ð°Ñ‚ÐµÐ½Ð°! ÐžÑ‡Ð°ÐºÐ²Ð° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ Ð¾Ñ‚ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€Ð°.');
      } else {
        toast.success('Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ ÑÐµ Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ…Ñ‚Ðµ ÐºÑŠÐ¼ ÑÐµÑ€Ð²Ð¸Ð·!');
      }

      setUniqueCode('');
      setIsModalOpen(false);
      await refreshServiceCompanies();
      await fetchAllCompanies();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð´Ð¾Ð±Ð°Ð²ÑÐ½Ðµ';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPendingRequest = async (requestId: string, serviceName: string) => {
    if (
      !window.confirm(
        `Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¾Ñ‚ÐºÐ°Ð¶ÐµÑ‚Ðµ Ð·Ð°ÑÐ²ÐºÐ°Ñ‚Ð° ÐºÑŠÐ¼ "${serviceName}"?`
      )
    ) {
      return;
    }

    try {

      await api.delete(`/client/service-companies/pending/${requestId}`);
      toast.success('Ð—Ð°ÑÐ²ÐºÐ°Ñ‚Ð° Ðµ Ð¾Ñ‚ÐºÐ°Ð·Ð°Ð½Ð°');
      await refreshServiceCompanies();
      await fetchAllCompanies();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ñ‚ÐºÐ°Ð· Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ°');
      toast.error(message);
    }
  };

  const handleLeaveServiceCompany = async (clientId: string, serviceName: string) => {
    if (
      !window.confirm(
        `Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð½Ð°Ð¿ÑƒÑÐ½ÐµÑ‚Ðµ "${serviceName}"?\n\nÐ©Ðµ Ð·Ð°Ð³ÑƒÐ±Ð¸Ñ‚Ðµ Ð´Ð¾ÑÑ‚ÑŠÐ¿ Ð´Ð¾ Ð²ÑÐ¸Ñ‡ÐºÐ¸ Ð´Ð°Ð½Ð½Ð¸ Ð² Ñ‚Ð¾Ð·Ð¸ ÑÐµÑ€Ð²Ð¸Ð·.`
      )
    ) {
      return;
    }

    try {
      await api.delete(`/client/service-companies/${clientId}/leave`);
      toast.success('Ð£ÑÐ¿ÐµÑˆÐ½Ð¾ Ð½Ð°Ð¿ÑƒÑÐ½Ð°Ñ…Ñ‚Ðµ ÑÐµÑ€Ð²Ð¸Ð·Ð°');
      await refreshServiceCompanies();
      await fetchAllCompanies();
    } catch (error: unknown) {
      const message = getErrorMessage(error, 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð½Ð°Ð¿ÑƒÑÐºÐ°Ð½Ðµ');
      toast.error(message);
    }
  };

  const handleSelectServiceCompany = (companyId: string) => {
    setSelectedServiceCompany(companyId);
    toast.success('Ð¡ÐµÑ€Ð²Ð¸Ð·ÑŠÑ‚ Ðµ Ð¸Ð·Ð±Ñ€Ð°Ð½');
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: 'ACTIVE' | 'PENDING' | 'LEFT') => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200">
            <CheckCircle className="w-4 h-4" />
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
      case 'LEFT':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
            <LogOut className="w-4 h-4" />
            ÐÐ°Ð¿ÑƒÑÐ½Ð°Ñ‚
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">ÐœÐ¾Ð¸Ñ‚Ðµ ÑÐµÑ€Ð²Ð¸Ð·Ð¸</h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto sm:ml-auto flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Ð”Ð¾Ð±Ð°Ð²Ð¸ ÑÐµÑ€Ð²Ð¸Ð·
          </button>
        </div>

        {allCompanies.length === 0 ? (
          <div className="bg-cardBg rounded-2xl shadow-card p-6 sm:p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-textSecondary mb-4" />
            <h2 className="text-xl font-semibold text-textPrimary mb-2">
              ÐÑÐ¼Ð° Ð´Ð¾Ð±Ð°Ð²ÐµÐ½Ð¸ ÑÐµÑ€Ð²Ð¸Ð·Ð¸
            </h2>
            <p className="text-textSecondary mb-6">
              Ð—Ð° Ð´Ð° Ð·Ð°Ð¿Ð¾Ñ‡Ð½ÐµÑ‚Ðµ, Ð´Ð¾Ð±Ð°Ð²ÐµÑ‚Ðµ Ð¿ÑŠÑ€Ð²Ð¸Ñ ÑÐ¸ ÑÐµÑ€Ð²Ð¸Ð· Ñ ÑƒÐ½Ð¸ÐºÐ°Ð»ÐµÐ½ ÐºÐ¾Ð´
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Ð”Ð¾Ð±Ð°Ð²Ð¸ Ð¿ÑŠÑ€Ð²Ð¸ ÑÐµÑ€Ð²Ð¸Ð·
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {allCompanies.map((company) => {
              const isSelected = selectedServiceCompany?.id === company.serviceCompany.id;
              const isActive = company.status === 'ACTIVE';
              const isPending = company.status === 'PENDING';

              return (
                <div
                  key={company.clientId}
                  className={`bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 relative transition-all ${
                    isSelected ? 'ring-2 ring-primary' : ''
                  } ${isPending ? 'opacity-75' : ''}`}
                >
                  {/* Status Badge */}
                  <div className="sm:absolute sm:top-4 sm:right-4 mb-2 sm:mb-0">
                    {getStatusBadge(company.status || 'ACTIVE')}
                  </div>

                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-3 rounded-lg ${isPending ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-primary/10'}`}>
                      <Building2 className={`w-6 h-6 ${isPending ? 'text-yellow-600 dark:text-yellow-200' : 'text-primary'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-textPrimary">
                        {company.serviceCompany.name}
                      </h3>
                      {isSelected && isActive && (
                        <span className="text-xs text-primary font-medium">ÐÐºÑ‚Ð¸Ð²ÐµÐ½</span>
                      )}
                    </div>
                  </div>

                  
                  <div className="space-y-2 mb-4 sm:mb-6">
                    <div className="flex items-start gap-2 text-sm text-textSecondary">
                      <span className="font-medium min-w-[70px]">ÐÐ´Ñ€ÐµÑ:</span>
                      <span>{company.serviceCompany.address || 'ÐÑÐ¼Ð° Ð´Ð°Ð½Ð½Ð¸'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-textSecondary">
                      <span className="font-medium min-w-[70px]">Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½:</span>
                      <span>{company.serviceCompany.phone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-textSecondary">
                      <span className="font-medium min-w-[70px]">Email:</span>
                      <span>{company.serviceCompany.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-textSecondary">
                      <span className="font-medium min-w-[70px]">ÐšÐ¾Ð´:</span>
                      <span className="font-mono font-semibold text-primary">
                        {company.serviceCompany.uniqueCode}
                      </span>
                    </div>
                    {company.joinedAt && (
                      <div className="flex items-center gap-2 text-sm text-textSecondary">
                        <span className="font-medium min-w-[70px]">{isPending ? 'Ð—Ð°ÑÐ²ÐµÐ½Ð¾ Ð½Ð°:' : 'ÐŸÑ€Ð¸ÑÑŠÐµÐ´Ð¸Ð½ÐµÐ½:'}</span>
                        <span>{formatDate(company.joinedAt)}</span>
                      </div>
                    )}
                  </div>

                  
                  {isPending ? (
                    <div className="flex">
                      <button
                        onClick={() =>
                          handleCancelPendingRequest(
                            company.requestId || company.clientId,
                            company.serviceCompany.name
                          )
                        }
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-error text-error rounded-lg hover:bg-error/10 transition-colors text-sm font-medium"
                      >
                        <XCircle className="w-4 h-4" />
                        ÐžÑ‚ÐºÐ°Ð¶Ð¸ Ð·Ð°ÑÐ²ÐºÐ°Ñ‚Ð°
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-3 items-center gap-2">
                      <div />
                      <div className="flex justify-center">
                        {isActive && !isSelected && (
                          <button
                            onClick={() => handleSelectServiceCompany(company.serviceCompany.id)}
                            className="w-full sm:w-auto px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
                          >
                            Ð˜Ð·Ð±ÐµÑ€Ð¸
                          </button>
                        )}
                      </div>
                      <div className="flex justify-start sm:justify-end">
                        {isActive && (
                          <button
                            onClick={() => handleLeaveServiceCompany(company.clientId, company.serviceCompany.name)}
                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-error text-error rounded-lg hover:bg-error/10 transition-colors text-sm font-medium"
                            title="ÐÐ°Ð¿ÑƒÑÐ½Ð¸ ÑÐµÑ€Ð²Ð¸Ð·"
                          >
                            <LogOut className="w-4 h-4" />
                            {isSelected ? 'ÐÐ°Ð¿ÑƒÑÐ½Ð¸' : ''}
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

        
        {isModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-cardBg rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-textPrimary mb-4">
                Ð”Ð¾Ð±Ð°Ð²Ð¸ ÑÐµÑ€Ð²Ð¸Ð·
              </h2>
              <p className="text-textSecondary mb-6">
                Ð’ÑŠÐ²ÐµÐ´ÐµÑ‚Ðµ ÑƒÐ½Ð¸ÐºÐ°Ð»Ð½Ð¸Ñ ÐºÐ¾Ð´ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð°, ÐºÑŠÐ¼ ÐºÐ¾Ð¹Ñ‚Ð¾ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° ÑÐµ Ð´Ð¾Ð±Ð°Ð²Ð¸Ñ‚Ðµ
              </p>

              <form onSubmit={handleAddServiceCompany}>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-textPrimary mb-2">
                    Ð£Ð½Ð¸ÐºÐ°Ð»ÐµÐ½ ÐºÐ¾Ð´
                  </label>
                  <input
                    type="text"
                    value={uniqueCode}
                    onChange={(e) => setUniqueCode(e.target.value.toUpperCase())}
                    placeholder="Ð½Ð°Ð¿Ñ€. NK8UR4MM"
                    maxLength={8}
                    className="w-full px-4 py-3 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary font-mono text-base sm:text-lg uppercase"
                    autoFocus
                  />
                  <p className="text-xs text-textMuted mt-2">
                    ÐšÐ¾Ð´ÑŠÑ‚ ÑÐµ ÑÑŠÑÑ‚Ð¾Ð¸ Ð¾Ñ‚ 8 ÑÐ¸Ð¼Ð²Ð¾Ð»Ð° (Ð±ÑƒÐºÐ²Ð¸ Ð¸ Ñ†Ð¸Ñ„Ñ€Ð¸)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setUniqueCode('');
                    }}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-3 border border-borderSubtle text-textSecondary rounded-lg hover:bg-mainBg transition-colors disabled:opacity-50"
                  >
                    ÐžÑ‚ÐºÐ°Ð·
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !uniqueCode.trim()}
                    className="flex-1 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Ð”Ð¾Ð±Ð°Ð²ÑÐ½Ðµ...' : 'Ð”Ð¾Ð±Ð°Ð²Ð¸'}
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



