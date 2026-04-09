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
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð´Ð°Ð½Ð½Ð¸');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await api.put('/service-company', formData);
      toast.success('Ð”Ð°Ð½Ð½Ð¸Ñ‚Ðµ ÑÐ° Ð·Ð°Ð¿Ð°Ð·ÐµÐ½Ð¸');
      setIsEditModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Settings update error:', error);
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ð¿Ð°Ð·Ð²Ð°Ð½Ðµ');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCode = async () => {
    if (!company) return;

    try {
      await navigator.clipboard.writeText(company.uniqueCode);
      setIsCopied(true);
      toast.success('ÐšÐ¾Ð´ÑŠÑ‚ Ðµ ÐºÐ¾Ð¿Ð¸Ñ€Ð°Ð½');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ ÐºÐ¾Ð¿Ð¸Ñ€Ð°Ð½Ðµ');
    }
  };

  const handleApprove = async (requestId: string) => {
    try {
      await api.patch(`/pending-requests/${requestId}/approve`);
      toast.success('Ð—Ð°ÑÐ²ÐºÐ°Ñ‚Ð° Ðµ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð°');
      fetchData();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ');
    }
  };

  const handleReject = async (requestId: string) => {
    if (!confirm('Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¾Ñ‚Ñ…Ð²ÑŠÑ€Ð»Ð¸Ñ‚Ðµ Ñ‚Ð°Ð·Ð¸ Ð·Ð°ÑÐ²ÐºÐ°?')) return;

    try {
      await api.patch(`/pending-requests/${requestId}/reject`, {
        rejectionReason: null
      });
      toast.success('Ð—Ð°ÑÐ²ÐºÐ°Ñ‚Ð° Ðµ Ð¾Ñ‚Ñ…Ð²ÑŠÑ€Ð»ÐµÐ½Ð°');
      fetchData();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ñ‚Ñ…Ð²ÑŠÑ€Ð»ÑÐ½Ðµ');
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
          <p className="text-textSecondary">Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ñ„Ð¸Ñ€Ð¼ÐµÐ½Ð¸ Ð´Ð°Ð½Ð½Ð¸</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">ÐÐ°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸</h1>
          <p className="text-textSecondary mt-1">Ð£Ð¿Ñ€Ð°Ð²Ð»ÐµÐ½Ð¸Ðµ Ð½Ð° Ñ„Ð¸Ñ€Ð¼ÐµÐ½Ð¸ Ð´Ð°Ð½Ð½Ð¸ Ð¸ Ð·Ð°ÑÐ²ÐºÐ¸</p>
        </div>

        
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-textPrimary">Ð¤Ð¸Ñ€Ð¼ÐµÐ½Ð¸ Ð´Ð°Ð½Ð½Ð¸</h2>
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="text-sm text-primary hover:text-primary-700 flex items-center gap-1 w-fit sm:ml-auto"
              aria-label="Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹"
              title="Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <p className="text-sm text-textSecondary mb-1">Ð˜Ð¼Ðµ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð°</p>
              <p className="text-base font-medium text-textPrimary">{company.name}</p>
            </div>

            <div>
              <p className="text-sm text-textSecondary mb-1">Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½</p>
              <p className="text-base font-medium text-textPrimary">{company.phone}</p>
            </div>

            <div>
              <p className="text-sm text-textSecondary mb-1">Email</p>
              <p className="text-base font-medium text-textPrimary">{company.email}</p>
            </div>

            <div>
              <p className="text-sm text-textSecondary mb-1">ÐÐ´Ñ€ÐµÑ</p>
              <p className="text-base font-medium text-textPrimary">{company.address}</p>
            </div>

            {company.bulstat && (
              <div>
                <p className="text-sm text-textSecondary mb-1">Ð‘ÑƒÐ»ÑÑ‚Ð°Ñ‚</p>
                <p className="text-base font-medium text-textPrimary">{company.bulstat}</p>
              </div>
            )}

            {company.vatNumber && (
              <div>
                <p className="text-sm text-textSecondary mb-1">Ð”Ð”Ð¡ Ð½Ð¾Ð¼ÐµÑ€</p>
                <p className="text-base font-medium text-textPrimary">{company.vatNumber}</p>
              </div>
            )}
          </div>
        </div>

        
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-4">Ð£Ð½Ð¸ÐºÐ°Ð»ÐµÐ½ ÐºÐ¾Ð´ Ð·Ð° Ð¼ÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸</h2>
          <p className="text-textSecondary mb-4">
            Ð¢Ð¾Ð·Ð¸ ÐºÐ¾Ð´ ÑÐµ Ð¸Ð·Ð¿Ð¾Ð»Ð·Ð²Ð° Ð¾Ñ‚ Ð¼ÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸Ñ‚Ðµ Ð¿Ñ€Ð¸ Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ Ð² ÑÐ¸ÑÑ‚ÐµÐ¼Ð°Ñ‚Ð°.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex-1 bg-gray-100 rounded-lg p-3 sm:p-4 font-mono text-lg sm:text-2xl font-bold text-primary tracking-wider">
              {company.uniqueCode}
            </div>
            <Button onClick={handleCopyCode} variant="secondary" className="w-full sm:w-auto">
              {isCopied ? (
                <>
                  <Check className="w-4 h-4" />
                  ÐšÐ¾Ð¿Ð¸Ñ€Ð°Ð½Ð¾
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  ÐšÐ¾Ð¿Ð¸Ñ€Ð°Ð¹
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Pending Mechanic Requests */}
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-6">
            Ð§Ð°ÐºÐ°Ñ‰Ð¸ Ð·Ð°ÑÐ²ÐºÐ¸ Ð·Ð° Ð¼ÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸
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
                        Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ: {request.specialization}
                      </p>
                    )}
                    <p className="text-xs text-textSecondary mt-2">
                      Ð”Ð°Ñ‚Ð° Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ°: {new Date(request.createdAt).toLocaleDateString('bg-BG')}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => handleApprove(request.id)} className="w-full sm:w-auto">
                      ÐžÐ´Ð¾Ð±Ñ€Ð¸
                    </Button>
                    <Button variant="secondary" onClick={() => handleReject(request.id)} className="w-full sm:w-auto">
                      ÐžÑ‚Ñ…Ð²ÑŠÑ€Ð»Ð¸
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-textSecondary py-6 sm:py-8">
              ÐÑÐ¼Ð° Ñ‡Ð°ÐºÐ°Ñ‰Ð¸ Ð·Ð°ÑÐ²ÐºÐ¸ Ð·Ð° Ð¼ÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸
            </p>
          )}
        </div>

        {/* Pending Client Requests */}
        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-textPrimary mb-6">
            Ð§Ð°ÐºÐ°Ñ‰Ð¸ Ð·Ð°ÑÐ²ÐºÐ¸ Ð·Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¸
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
                      Ð”Ð°Ñ‚Ð° Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ°: {new Date(request.createdAt).toLocaleDateString('bg-BG')}
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button onClick={() => handleApprove(request.id)} className="w-full sm:w-auto">
                      ÐžÐ´Ð¾Ð±Ñ€Ð¸
                    </Button>
                    <Button variant="secondary" onClick={() => handleReject(request.id)} className="w-full sm:w-auto">
                      ÐžÑ‚Ñ…Ð²ÑŠÑ€Ð»Ð¸
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-textSecondary py-6 sm:py-8">
              ÐÑÐ¼Ð° Ñ‡Ð°ÐºÐ°Ñ‰Ð¸ Ð·Ð°ÑÐ²ÐºÐ¸ Ð·Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¸
            </p>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-cardBg rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-cardBg border-b border-borderSubtle p-6 flex flex-col sm:flex-row sm:items-center gap-3">
              <h2 className="text-xl font-bold text-textPrimary">Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ñ„Ð¸Ñ€Ð¼ÐµÐ½Ð¸ Ð´Ð°Ð½Ð½Ð¸</h2>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-2 hover:bg-mainBg rounded-lg transition-colors"
                aria-label="Ð—Ð°Ñ‚Ð²Ð¾Ñ€Ð¸"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Ð˜Ð¼Ðµ Ð½Ð° ÑÐµÑ€Ð²Ð¸Ð·Ð° *"
                    value={formData.name}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½ *"
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
                    label="ÐÐ´Ñ€ÐµÑ *"
                    value={formData.address}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    required
                  />

                  <Input
                    label="Ð‘ÑƒÐ»ÑÑ‚Ð°Ñ‚"
                    value={formData.bulstat}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, bulstat: e.target.value })
                    }
                  />

                  <Input
                    label="Ð”Ð”Ð¡ Ð½Ð¾Ð¼ÐµÑ€"
                    value={formData.vatNumber}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      setFormData({ ...formData, vatNumber: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)} className="w-full sm:w-auto">
                  ÐžÑ‚ÐºÐ°Ð·
                </Button>
                <Button type="submit" isLoading={isSaving} className="w-full sm:w-auto">
                  Ð—Ð°Ð¿Ð°Ð·Ð¸ Ð¿Ñ€Ð¾Ð¼ÐµÐ½Ð¸
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



