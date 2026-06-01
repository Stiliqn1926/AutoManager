import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, XCircle } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  membershipStatus?: 'ACTIVE' | 'PENDING' | 'INACTIVE';
}

interface AppointmentRequest {
  id: string;
  requestedStart: string;
  requestedEnd: string;
  message: string | null;
  status: 'PENDING';
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
    user: {
      email: string;
    } | null;
  };
  preferredWorker: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
}

interface DecisionData {
  date: string;
  startTime: string;
  endTime: string;
  workerId: string;
  adminComment: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string') {
      return message;
    }
  }
  return fallback;
};

const toDateInputValue = (value: string): string =>
  new Date(value).toISOString().slice(0, 10);

const toTimeInputValue = (value: string): string =>
  new Date(value).toTimeString().slice(0, 5);

const AppointmentRequests = () => {
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [decisionData, setDecisionData] = useState<Record<string, DecisionData>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const activeWorkers = useMemo(
    () =>
      workers.filter(
        (worker) =>
          worker.isActive &&
          (worker.membershipStatus ? worker.membershipStatus === 'ACTIVE' : true)
      ),
    [workers]
  );

  const initializeDecisionData = useCallback((items: AppointmentRequest[]) => {
    const initial: Record<string, DecisionData> = {};
    items.forEach((request) => {
      initial[request.id] = {
        date: toDateInputValue(request.requestedStart),
        startTime: toTimeInputValue(request.requestedStart),
        endTime: toTimeInputValue(request.requestedEnd),
        workerId: request.preferredWorker?.id || '',
        adminComment: '',
      };
    });
    setDecisionData(initial);
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [requestsResponse, workersResponse] = await Promise.all([
        api.get('/appointment-requests/pending'),
        api.get('/workers'),
      ]);

      const requestItems: AppointmentRequest[] = requestsResponse.data.requests || [];
      setRequests(requestItems);
      initializeDecisionData(requestItems);
      setWorkers(workersResponse.data.workers || []);
    } catch {
      toast.error('Грешка при зареждане на заявки за час');
    } finally {
      setIsLoading(false);
    }
  }, [initializeDecisionData]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const updateDecision = (requestId: string, patch: Partial<DecisionData>) => {
    setDecisionData((previous) => ({
      ...previous,
      [requestId]: {
        ...previous[requestId],
        ...patch,
      },
    }));
  };

  const handleApprove = async (request: AppointmentRequest) => {
    const values = decisionData[request.id];
    if (!values) {
      toast.error('Липсват данни за одобрение');
      return;
    }

    if (!values.date || !values.startTime || !values.endTime) {
      toast.error('Попълни дата, начален и краен час');
      return;
    }

    const start = new Date(`${values.date}T${values.startTime}`);
    const end = new Date(`${values.date}T${values.endTime}`);

    if (end <= start) {
      toast.error('Крайният час трябва да е след началния');
      return;
    }

    setProcessingId(request.id);
    try {
      await api.patch(`/appointment-requests/${request.id}/approve`, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        workerId: values.workerId || undefined,
        adminComment: values.adminComment.trim() || undefined,
      });
      toast.success('Заявката е одобрена');
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Грешка при одобряване на заявката'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: AppointmentRequest) => {
    const comment = decisionData[request.id]?.adminComment || '';

    setProcessingId(request.id);
    try {
      await api.patch(`/appointment-requests/${request.id}/reject`, {
        adminComment: comment.trim() || undefined,
      });
      toast.success('Заявката е отхвърлена');
      await fetchData();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Грешка при отхвърляне на заявката'));
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
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
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Заявки за час</h1>
        </div>

        {requests.length === 0 ? (
          <div className="bg-cardBg rounded-2xl shadow-card p-10 text-center text-textSecondary">
            <Clock className="w-12 h-12 mx-auto mb-3 opacity-60" />
            Няма чакащи заявки за час.
          </div>
        ) : (
          <div className="space-y-4">
            {requests.map((request) => {
              const values = decisionData[request.id];
              return (
                <div key={request.id} className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-textPrimary">
                          {request.client.firstName} {request.client.lastName}
                        </h2>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                          <Clock className="w-3 h-3" />
                          Чака одобрение
                        </span>
                      </div>

                      <div className="text-sm text-textSecondary space-y-1">
                        <div>Имейл: {request.client.email || request.client.user?.email || '-'}</div>
                        <div>Телефон: {request.client.phone || '-'}</div>
                        <div>
                          Заявен интервал:{' '}
                          {new Date(request.requestedStart).toLocaleString('bg-BG')} -{' '}
                          {new Date(request.requestedEnd).toLocaleString('bg-BG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                        {request.preferredWorker && (
                          <div>
                            Предпочитан механик: {request.preferredWorker.firstName}{' '}
                            {request.preferredWorker.lastName}
                          </div>
                        )}
                        {request.message && (
                          <div className="whitespace-pre-line">Описание: {request.message}</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {values && (
                    <div className="space-y-3 mb-4">
                      <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-textPrimary mb-1">
                            Дата
                          </label>
                          <input
                            type="date"
                            value={values.date}
                            onChange={(event) =>
                              updateDecision(request.id, { date: event.target.value })
                            }
                            className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-textPrimary mb-1">
                            Начало
                          </label>
                          <input
                            type="time"
                            value={values.startTime}
                            onChange={(event) =>
                              updateDecision(request.id, { startTime: event.target.value })
                            }
                            className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-textPrimary mb-1">
                            Краен час на поръчката *
                          </label>
                          <input
                            type="time"
                            value={values.endTime}
                            onChange={(event) =>
                              updateDecision(request.id, { endTime: event.target.value })
                            }
                            className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-textPrimary mb-1">
                            Механик
                          </label>
                          <select
                            value={values.workerId}
                            onChange={(event) =>
                              updateDecision(request.id, { workerId: event.target.value })
                            }
                            className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value="">Без механик</option>
                            {activeWorkers.map((worker) => (
                              <option key={worker.id} value={worker.id}>
                                {worker.firstName} {worker.lastName}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-textPrimary mb-1">
                          Съобщение до клиента (допълнителна информация)
                        </label>
                        <textarea
                          value={values.adminComment}
                          onChange={(event) =>
                            updateDecision(request.id, { adminComment: event.target.value })
                          }
                          placeholder="Опционално"
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => handleApprove(request)}
                      disabled={processingId === request.id}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {processingId === request.id ? 'Обработка...' : 'Одобри'}
                    </button>
                    <button
                      onClick={() => handleReject(request)}
                      disabled={processingId === request.id}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Отхвърли
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default AppointmentRequests;
