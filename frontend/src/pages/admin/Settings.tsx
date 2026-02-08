import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Copy, Check, Edit2, X } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface ServiceCompany {
  id: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  bulstat: string | null;
  vatNumber: string | null;
  uniqueCode: string;
}

interface PendingRequest {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string; 
  requestType: string;
  status: string;
  createdAt: string;
}

const Settings = () => {
  const [company, setCompany] = useState<ServiceCompany | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [clientRequests, setClientRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    bulstat: '',
    vatNumber: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [companyRes, requestsRes] = await Promise.all([
        api.get('/service-company'),
        api.get('/pending-requests'),
      ]);

      const companyData = companyRes.data.serviceCompany;
      setCompany(companyData);
      setFormData({
        name: companyData.name,
        address: companyData.address,
        phone: companyData.phone,
        email: companyData.email,
        bulstat: companyData.bulstat || '',
        vatNumber: companyData.vatNumber || '',
      });

      setPendingRequests(requestsRes.data.mechanicRequests || []);  
      setClientRequests(requestsRes.data.clientRequests || []);     
    } catch (error) {
      console.error('Settings fetch error:', error);
      toast.error('Грешка при зареждане на данни');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put('/service-company', formData);
      toast.success('Данните са запазени');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error('Грешка при запазване');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCode = async () => {
    if (!company) return;

    try {
      await navigator.clipboard.writeText(company.uniqueCode);
      setIsCopied(true);
      toast.success('Кодът е копиран');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Грешка при копиране');
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await api.patch(`/pending-requests/${requestId}/approve`);
      toast.success('Заявката е одобрена');
      fetchData();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Грешка при одобрение');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Сигурни ли сте, че искате да отхвърлите тази заявка?')) return;

    try {
      await api.patch(`/pending-requests/${requestId}/reject`, {
        rejectionReason: null
      });
      toast.success('Заявката е отхвърлена');
      fetchData();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Грешка при отхвърляне');
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!company) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-textSecondary">Грешка при зареждане на фирмени данни</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Настройки</h1>
          <p className="text-textSecondary mt-1">Управление на фирмени данни и заявки</p>
        </div>

        {/* Фирмени данни */}
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Фирмени данни</h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-sm text-primary hover:text-primary-700 flex items-center gap-1 w-fit sm:ml-auto"
              aria-label="Редактирай"
              title="Редактирай"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-sm text-textSecondary mb-1">Име на сервиза</p>
              <p className="text-base font-medium text-textPrimary">{company.name}</p>
            </div>

            <div>
              <p className="text-sm text-textSecondary mb-1">Телефон</p>
              <p className="text-base font-medium text-textPrimary">{company.phone}</p>
            </div>

            <div>
              <p className="text-sm text-textSecondary mb-1">Email</p>
              <p className="text-base font-medium text-textPrimary">{company.email}</p>
            </div>

            <div>
              <p className="text-sm text-textSecondary mb-1">Адрес</p>
              <p className="text-base font-medium text-textPrimary">{company.address}</p>
            </div>

            {company.bulstat && (
              <div>
                <p className="text-sm text-textSecondary mb-1">Булстат</p>
                <p className="text-base font-medium text-textPrimary">{company.bulstat}</p>
              </div>
            )}

            {company.vatNumber && (
              <div>
                <p className="text-sm text-textSecondary mb-1">ДДС номер</p>
                <p className="text-base font-medium text-textPrimary">{company.vatNumber}</p>
              </div>
            )}
          </div>
        </div>

        {/* Уникален код */}
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-4">Уникален код за механици</h2>
          <p className="text-textSecondary mb-4">
            Този код се използва от механиците при регистрация в системата.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-lg p-3 sm:p-4 font-mono text-lg sm:text-2xl font-bold text-primary tracking-wider">
              {company.uniqueCode}
            </div>
            <Button onClick={handleCopyCode} variant="secondary" className="w-full sm:w-auto">
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  Копирано
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Копирай
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Pending Mechanic Requests */}
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-6">
            Чакащи заявки за механици
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-primary text-white text-sm rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </h2>

          {pendingRequests.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto pr-1">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-borderSubtle rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-textPrimary">
                      {request.firstName} {request.lastName}
                    </h3>
                    <p className="text-sm text-textSecondary">{request.email}</p>
                    <p className="text-sm text-textSecondary">{request.phone}</p>
                    {request.specialization && (
                      <p className="text-sm text-textSecondary mt-1">
                        Специализация: {request.specialization}
                      </p>
                    )}
                    <p className="text-xs text-textSecondary mt-2">
                      Дата на заявка: {new Date(request.createdAt).toLocaleDateString('bg-BG')}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => handleApprove(request.id)} className="w-full sm:w-auto">
                      Одобри
                    </Button>
                    <Button variant="secondary" onClick={() => handleReject(request.id)} className="w-full sm:w-auto">
                      Отхвърли
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-textSecondary py-6 sm:py-8">
              Няма чакащи заявки за механици
            </p>
          )}
        </div>

        {/* Pending Client Requests */}
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-6">
            Чакащи заявки за клиенти
            {clientRequests.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-500 text-white text-sm rounded-full">
                {clientRequests.length}
              </span>
            )}
          </h2>

          {clientRequests.length > 0 ? (
            <div className="space-y-3 sm:space-y-4 max-h-96 overflow-y-auto pr-1">
              {clientRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-borderSubtle rounded-lg p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-textPrimary">
                      {request.firstName} {request.lastName}
                    </h3>
                    <p className="text-sm text-textSecondary">{request.email}</p>
                    <p className="text-sm text-textSecondary">{request.phone}</p>
                    <p className="text-xs text-textSecondary mt-2">
                      Дата на заявка: {new Date(request.createdAt).toLocaleDateString('bg-BG')}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => handleApprove(request.id)} className="w-full sm:w-auto">
                      Одобри
                    </Button>
                    <Button variant="secondary" onClick={() => handleReject(request.id)} className="w-full sm:w-auto">
                      Отхвърли
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-textSecondary py-6 sm:py-8">
              Няма чакащи заявки за клиенти
            </p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-cardBg border-b border-borderSubtle p-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-xl font-bold text-textPrimary">Редактиране на фирмени данни</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-mainBg rounded-lg transition-colors"
                aria-label="Затвори"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Име на сервиза *"
                    value={formData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Телефон *"
                    value={formData.phone}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Email *"
                    type="email"
                    value={formData.email}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Адрес *"
                    value={formData.address}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Булстат"
                    value={formData.bulstat}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, bulstat: e.target.value })
                    }
                  />

                  <Input
                    label="ДДС номер"
                    value={formData.vatNumber}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, vatNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto">
                  Отказ
                </Button>
                <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
                  Запази промени
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};

export default Settings;


