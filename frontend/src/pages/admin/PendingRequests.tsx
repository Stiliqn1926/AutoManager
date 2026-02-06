import { useState, useEffect } from 'react';
import { UserCheck, UserX, Users, Clock, Phone, Mail, User, Calendar } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface PendingRequest {
  id: string;
  requestType: 'MECHANIC' | 'CLIENT';
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization?: string | null;
  skills?: string | null;
  status: 'PENDING';
  createdAt: string;
}

const PendingRequests = () => {
  const [mechanicRequests, setMechanicRequests] = useState<PendingRequest[]>([]);
  const [clientRequests, setClientRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'MECHANIC' | 'CLIENT'>('MECHANIC');

  useEffect(() => {
    fetchPendingRequests();
  }, []);

  const fetchPendingRequests = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/pending-requests');
      setMechanicRequests(response.data.mechanicRequests || []);
      setClientRequests(response.data.clientRequests || []);
    } catch (error) {
      toast.error('Грешка при зареждане на заявки');
      console.error('Error fetching pending requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, type: 'MECHANIC' | 'CLIENT') => {
  try {
    await api.post(`/pending-requests/${id}/approve`);
    toast.success(`${type === 'MECHANIC' ? 'Механикът' : 'Клиентът'} е одобрен успешно`);
    await fetchPendingRequests();
    
    // ✅ Emit event за да се обнови списъка с клиенти (ако е отворен)
    if (type === 'CLIENT') {
      window.dispatchEvent(new Event('clients-updated'));
    }
  } catch (error) {
    toast.error('Грешка при одобряване');
    console.error('Error approving request:', error);
  }
};

  const handleReject = async (id: string, type: 'MECHANIC' | 'CLIENT') => {
    const reason = window.prompt('Причина за отхвърляне (опционално):');
    if (reason === null) return; // Cancelled

    try {
      await api.post(`/pending-requests/${id}/reject`, { rejectionReason: reason });
      toast.success(`${type === 'MECHANIC' ? 'Механикът' : 'Клиентът'} е отхвърлен`);
      await fetchPendingRequests();
    } catch (error) {
      toast.error('Грешка при отхвърляне');
      console.error('Error rejecting request:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const currentRequests = selectedTab === 'MECHANIC' ? mechanicRequests : clientRequests;

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
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Заявки за одобрение</h1>
          <p className="text-textSecondary mt-1">
            Преглед и одобрение на чакащи заявки за механици и клиенти
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-textPrimary">{mechanicRequests.length}</div>
                <div className="text-sm text-textSecondary">Механици в изчакване</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <User className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-textPrimary">{clientRequests.length}</div>
                <div className="text-sm text-textSecondary">Клиенти в изчакване</div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-borderSubtle">
          <div className="flex flex-wrap sm:flex-nowrap gap-2 sm:gap-4">
            <button
              onClick={() => setSelectedTab('MECHANIC')}
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors border-b-2 ${
                selectedTab === 'MECHANIC'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-textSecondary hover:text-textPrimary'
              }`}
            >
              Механици ({mechanicRequests.length})
            </button>
            <button
              onClick={() => setSelectedTab('CLIENT')}
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors border-b-2 ${
                selectedTab === 'CLIENT'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-textSecondary hover:text-textPrimary'
              }`}
            >
              Клиенти ({clientRequests.length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          {currentRequests.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма чакащи заявки за {selectedTab === 'MECHANIC' ? 'механици' : 'клиенти'}</p>
            </div>
          ) : (
            <div className="divide-y divide-borderSubtle max-h-[70vh] overflow-y-auto">
              {currentRequests.map((request) => (
                <div key={request.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-textPrimary">
                          {request.firstName} {request.lastName}
                        </h3>
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3" />
                          Чака одобрение
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-sm">
                        <div className="flex items-center gap-2 text-textSecondary">
                          <Mail className="w-4 h-4" />
                          <span>{request.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-textSecondary">
                          <Phone className="w-4 h-4" />
                          <span>{request.phone}</span>
                        </div>
                        {request.specialization && (
                          <div className="flex items-center gap-2 text-textSecondary">
                            <User className="w-4 h-4" />
                            <span>Специализация: {request.specialization}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-textSecondary">
                          <Calendar className="w-4 h-4" />
                          <span>Заявено на: {formatDate(request.createdAt)}</span>
                        </div>
                      </div>

                      {request.skills && (
                        <div className="mt-2 sm:mt-3 text-sm text-textSecondary">
                          <span className="font-medium">Умения:</span> {request.skills}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleApprove(request.id, request.requestType)}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium w-full sm:w-auto"
                    >
                      <UserCheck className="w-4 h-4" />
                      Одобри
                    </button>
                    <button
                      onClick={() => handleReject(request.id, request.requestType)}
                      className="flex items-center gap-2 px-4 py-2 border border-error text-error rounded-lg hover:bg-error/10 transition-colors text-sm font-medium w-full sm:w-auto"
                    >
                      <UserX className="w-4 h-4" />
                      Отхвърли
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default PendingRequests;

