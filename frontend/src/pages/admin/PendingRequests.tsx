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
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð·Ð°ÑÐ²ÐºÐ¸');
      console.error('Error fetching pending requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (id: string, type: 'MECHANIC' | 'CLIENT') => {
  try {
    await api.patch(`/pending-requests/${id}/approve`);
    toast.success(`${type === 'MECHANIC' ? 'ÐœÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚' : 'ÐšÐ»Ð¸ÐµÐ½Ñ‚ÑŠÑ‚'} Ðµ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾`);
    await fetchPendingRequests();
    

    if (type === 'CLIENT') {
      window.dispatchEvent(new Event('clients-updated'));
    }
  } catch (error) {
    toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ð´Ð¾Ð±Ñ€ÑÐ²Ð°Ð½Ðµ');
    console.error('Error approving request:', error);
  }
};

  const handleReject = async (id: string, type: 'MECHANIC' | 'CLIENT') => {
    const reason = window.prompt('ÐŸÑ€Ð¸Ñ‡Ð¸Ð½Ð° Ð·Ð° Ð¾Ñ‚Ñ…Ð²ÑŠÑ€Ð»ÑÐ½Ðµ (Ð¾Ð¿Ñ†Ð¸Ð¾Ð½Ð°Ð»Ð½Ð¾):');
    if (reason === null) return; // Cancelled

    try {
      await api.patch(`/pending-requests/${id}/reject`, { rejectionReason: reason });
      toast.success(`${type === 'MECHANIC' ? 'ÐœÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚' : 'ÐšÐ»Ð¸ÐµÐ½Ñ‚ÑŠÑ‚'} Ðµ Ð¾Ñ‚Ñ…Ð²ÑŠÑ€Ð»ÐµÐ½`);
      await fetchPendingRequests();
    } catch (error) {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¾Ñ‚Ñ…Ð²ÑŠÑ€Ð»ÑÐ½Ðµ');
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
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Ð—Ð°ÑÐ²ÐºÐ¸ Ð·Ð° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ</h1>
          <p className="text-textSecondary mt-1">
            ÐŸÑ€ÐµÐ³Ð»ÐµÐ´ Ð¸ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ Ð½Ð° Ñ‡Ð°ÐºÐ°Ñ‰Ð¸ Ð·Ð°ÑÐ²ÐºÐ¸ Ð·Ð° Ð¼ÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸ Ð¸ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¸
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
                <div className="text-sm text-textSecondary">ÐœÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸ Ð² Ð¸Ð·Ñ‡Ð°ÐºÐ²Ð°Ð½Ðµ</div>
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
                <div className="text-sm text-textSecondary">ÐšÐ»Ð¸ÐµÐ½Ñ‚Ð¸ Ð² Ð¸Ð·Ñ‡Ð°ÐºÐ²Ð°Ð½Ðµ</div>
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
              ÐœÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸ ({mechanicRequests.length})
            </button>
            <button
              onClick={() => setSelectedTab('CLIENT')}
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors border-b-2 ${
                selectedTab === 'CLIENT'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-textSecondary hover:text-textPrimary'
              }`}
            >
              ÐšÐ»Ð¸ÐµÐ½Ñ‚Ð¸ ({clientRequests.length})
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          {currentRequests.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>ÐÑÐ¼Ð° Ñ‡Ð°ÐºÐ°Ñ‰Ð¸ Ð·Ð°ÑÐ²ÐºÐ¸ Ð·Ð° {selectedTab === 'MECHANIC' ? 'Ð¼ÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸' : 'ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¸'}</p>
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
                          Ð§Ð°ÐºÐ° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ
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
                            <span>Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ: {request.specialization}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-textSecondary">
                          <Calendar className="w-4 h-4" />
                          <span>Ð—Ð°ÑÐ²ÐµÐ½Ð¾ Ð½Ð°: {formatDate(request.createdAt)}</span>
                        </div>
                      </div>

                      {request.skills && (
                        <div className="mt-2 sm:mt-3 text-sm text-textSecondary">
                          <span className="font-medium">Ð£Ð¼ÐµÐ½Ð¸Ñ:</span> {request.skills}
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
                      ÐžÐ´Ð¾Ð±Ñ€Ð¸
                    </button>
                    <button
                      onClick={() => handleReject(request.id, request.requestType)}
                      className="flex items-center gap-2 px-4 py-2 border border-error text-error rounded-lg hover:bg-error/10 transition-colors text-sm font-medium w-full sm:w-auto"
                    >
                      <UserX className="w-4 h-4" />
                      ÐžÑ‚Ñ…Ð²ÑŠÑ€Ð»Ð¸
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


