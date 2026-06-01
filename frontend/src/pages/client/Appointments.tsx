import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Calendar, Clock, MessageSquare, XCircle, CheckCircle2 } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useServiceCompany } from '../../hooks/useServiceCompany';
import NoServiceScreen from './NoServiceScreen';
import api from '../../services/api';
import toast from 'react-hot-toast';

type AppointmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

interface AppointmentRequest {
  id: string;
  requestedStart: string;
  requestedEnd: string;
  message: string | null;
  status: AppointmentStatus;
  adminComment: string | null;
  createdAt: string;
  serviceCompany: {
    id: string;
    name: string;
  };
  preferredWorker: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  approvedSchedule: {
    id: string;
    date: string;
    startTime: string;
    endTime: string;
    status: string;
    worker: {
      firstName: string;
      lastName: string;
    } | null;
  } | null;
}

const Appointments = () => {
  const { selectedServiceCompany, serviceCompanies } = useServiceCompany();
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [message, setMessage] = useState('');

  const fetchRequests = useCallback(async () => {
    if (!selectedServiceCompany) {
      setRequests([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/appointment-requests/my', {
        params: { serviceCompanyId: selectedServiceCompany.id },
      });
      setRequests(response.data.appointmentRequests || []);
    } catch {
      toast.error('Грешка при зареждане на заявките');
    } finally {
      setIsLoading(false);
    }
  }, [selectedServiceCompany]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedServiceCompany) {
      toast.error('Избери сервиз');
      return;
    }

    if (!date || !startTime || !endTime) {
      toast.error('Попълни дата и час');
      return;
    }

    const start = new Date(`${date}T${startTime}`);
    const end = new Date(`${date}T${endTime}`);

    if (end <= start) {
      toast.error('Крайният час трябва да е след началния');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/appointment-requests', {
        serviceCompanyId: selectedServiceCompany.id,
        requestedStart: start.toISOString(),
        requestedEnd: end.toISOString(),
        message: message.trim() || undefined,
      });

      toast.success('Заявката е изпратена и чака одобрение');
      setDate('');
      setStartTime('');
      setEndTime('');
      setMessage('');
      await fetchRequests();
    } catch {
      toast.error('Грешка при изпращане на заявка');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (requestId: string) => {
    if (!window.confirm('Сигурен ли си, че искаш да отмениш заявката?')) {
      return;
    }

    try {
      await api.delete(`/appointment-requests/${requestId}/cancel`);
      toast.success('Заявката е отменена');
      await fetchRequests();
    } catch {
      toast.error('Грешка при отмяна');
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3" />
            Чака одобрение
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircle2 className="w-3 h-3" />
            Одобрена
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" />
            Отхвърлена
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
            <XCircle className="w-3 h-3" />
            Отменена
          </span>
        );
      default:
        return null;
    }
  };

  if (!selectedServiceCompany && serviceCompanies.length === 0) {
    return <NoServiceScreen />;
  }

  if (!selectedServiceCompany) {
    return (
      <MainLayout>
        <div className="bg-cardBg rounded-2xl shadow-card p-8 text-center">
          <Calendar className="w-12 h-12 text-textSecondary mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">Няма избран сервиз</h2>
          <p className="text-textSecondary">
            Избери сервиз от менюто горе, за да създадеш заявка за час.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Запази час</h1>
          <p className="text-textSecondary mt-1">
            Изпрати заявка към {selectedServiceCompany.name}. След това ще виждаш статус:
            „чака одобрение“, „одобрена“ или „отхвърлена“.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Дата *</label>
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Начало *</label>
              <input
                type="time"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
                className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">Край *</label>
              <input
                type="time"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
                className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Описание на проблема
            </label>
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Напр. шум от предницата, смяна на накладки..."
              className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Изпращане...' : 'Изпрати заявка'}
            </button>
          </div>
        </form>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-textPrimary mb-4">Моите заявки</h2>

          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-10 text-textSecondary">
              Нямаш изпратени заявки за избрания сервиз.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.id} className="border border-borderSubtle rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        {getStatusBadge(request.status)}
                        <span className="text-xs text-textMuted">
                          Създадена: {new Date(request.createdAt).toLocaleString('bg-BG')}
                        </span>
                      </div>
                      <div className="text-sm text-textPrimary">
                        <span className="font-medium">Желан час:</span>{' '}
                        {new Date(request.requestedStart).toLocaleString('bg-BG')} -{' '}
                        {new Date(request.requestedEnd).toLocaleString('bg-BG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      {request.message && (
                        <div className="flex items-start gap-2 text-sm text-textSecondary">
                          <MessageSquare className="w-4 h-4 mt-0.5" />
                          <span>{request.message}</span>
                        </div>
                      )}
                      {request.adminComment && (
                        <div className="text-sm text-textSecondary">
                          <span className="font-medium">Коментар от сервиза:</span>{' '}
                          {request.adminComment}
                        </div>
                      )}
                      {request.approvedSchedule && (
                        <div className="text-sm text-green-700 bg-green-50 rounded-lg p-2">
                          Одобрен и записан в график за{' '}
                          {new Date(request.approvedSchedule.startTime).toLocaleString('bg-BG')}
                          {request.approvedSchedule.worker
                            ? ` (механик: ${request.approvedSchedule.worker.firstName} ${request.approvedSchedule.worker.lastName})`
                            : ''}
                        </div>
                      )}
                    </div>

                    {request.status === 'PENDING' && (
                      <button
                        onClick={() => handleCancel(request.id)}
                        className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 text-sm"
                      >
                        Отмени
                      </button>
                    )}
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

export default Appointments;
