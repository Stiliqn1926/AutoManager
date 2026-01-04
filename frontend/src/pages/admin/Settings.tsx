import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { Copy, Check, Edit, X } from 'lucide-react';
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
  status: string;
  createdAt: string;
}

const Settings = () => {
  const [company, setCompany] = useState<ServiceCompany | null>(null);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
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

      setPendingRequests(requestsRes.data.requests || []);
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
      await api.patch(`/pending-requests/${requestId}/reject`);
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
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-textPrimary">Настройки</h1>
          <p className="text-textSecondary mt-1">Управление на фирмени данни и заявки</p>
        </div>

        {/* Фирмени данни */}
        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-textPrimary">Фирмени данни</h2>
            <Button onClick={() => setIsEditModalOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Редактирай
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          <h2 className="text-xl font-semibold text-textPrimary mb-4">Уникален код за механици</h2>
          <p className="text-textSecondary mb-4">
            Този код се използва от механиците при регистрация в системата.
          </p>

          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-lg p-4 font-mono text-2xl font-bold text-primary tracking-wider">
              {company.uniqueCode}
            </div>
            <Button onClick={handleCopyCode} variant="secondary">
              {isCopied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Копирано
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Копирай
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Pending Requests */}
        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          <h2 className="text-xl font-semibold text-textPrimary mb-6">
            Чакащи заявки за механици
            {pendingRequests.length > 0 && (
              <span className="ml-2 px-2 py-1 bg-primary text-white text-sm rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </h2>

          {pendingRequests.length > 0 ? (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  className="border border-borderSubtle rounded-lg p-4 flex items-center justify-between"
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

                  <div className="flex gap-2">
                    <Button onClick={() => handleApprove(request.id)}>Одобри</Button>
                    <Button variant="secondary" onClick={() => handleReject(request.id)}>
                      Отхвърли
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-textSecondary py-8">
              Няма чакащи заявки за механици
            </p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-borderSubtle p-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-textPrimary">Редактиране на фирмени данни</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Затвори"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                  Отказ
                </Button>
                <Button type="submit" isLoading={isSaving}>
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