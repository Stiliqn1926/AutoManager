import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Calendar, CheckCircle2, Clock, Car, XCircle } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { useServiceCompany } from '../../hooks/useServiceCompany';
import NoServiceScreen from './NoServiceScreen';
import api from '../../services/api';
import toast from 'react-hot-toast';

type AppointmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
type VehicleMode = 'EXISTING' | 'NEW';

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

interface ClientVehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  licensePlate: string;
}

const Appointments = () => {
  const { selectedServiceCompany, serviceCompanies } = useServiceCompany();
  const [requests, setRequests] = useState<AppointmentRequest[]>([]);
  const [vehicles, setVehicles] = useState<ClientVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [problemDescription, setProblemDescription] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [vehicleMode, setVehicleMode] = useState<VehicleMode>('EXISTING');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [newVehicleBrand, setNewVehicleBrand] = useState('');
  const [newVehicleModel, setNewVehicleModel] = useState('');
  const [newVehicleYear, setNewVehicleYear] = useState('');

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

  const fetchVehicles = useCallback(async () => {
    if (!selectedServiceCompany) {
      setVehicles([]);
      return;
    }

    setIsLoadingVehicles(true);
    try {
      const response = await api.get('/client/vehicles', {
        params: { serviceCompanyId: selectedServiceCompany.id },
      });
      const loadedVehicles: ClientVehicle[] = response.data.vehicles || [];
      setVehicles(loadedVehicles);

      if (loadedVehicles.length === 0) {
        setVehicleMode('NEW');
        setSelectedVehicleId('');
      } else {
        setSelectedVehicleId((current) => current || loadedVehicles[0]!.id);
      }
    } catch {
      toast.error('Грешка при зареждане на автомобилите');
      setVehicles([]);
      setVehicleMode('NEW');
      setSelectedVehicleId('');
    } finally {
      setIsLoadingVehicles(false);
    }
  }, [selectedServiceCompany]);

  useEffect(() => {
    void fetchRequests();
    void fetchVehicles();
  }, [fetchRequests, fetchVehicles]);

  const buildVehicleSummary = (): string | null => {
    if (vehicleMode === 'EXISTING') {
      if (!selectedVehicleId) {
        toast.error('Избери регистриран автомобил');
        return null;
      }

      const selectedVehicle = vehicles.find((vehicle) => vehicle.id === selectedVehicleId);
      if (!selectedVehicle) {
        toast.error('Избраният автомобил не е намерен');
        return null;
      }

      const yearPart = selectedVehicle.year ? `, ${selectedVehicle.year}` : '';
      return `Автомобил: ${selectedVehicle.brand} ${selectedVehicle.model}${yearPart} (${selectedVehicle.licensePlate})`;
    }

    const brand = newVehicleBrand.trim();
    const model = newVehicleModel.trim();
    const yearNumber = Number(newVehicleYear);

    if (!brand || !model || !newVehicleYear) {
      toast.error('Попълни марка, модел и година за нов автомобил');
      return null;
    }

    if (!Number.isInteger(yearNumber) || yearNumber < 1900 || yearNumber > new Date().getFullYear() + 1) {
      toast.error('Невалидна година за нов автомобил');
      return null;
    }

    return `Нов автомобил: ${brand} ${model}, ${yearNumber}`;
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedServiceCompany) {
      toast.error('Избери сервиз');
      return;
    }

    if (!date || !startTime) {
      toast.error('Попълни дата и начален час');
      return;
    }

    const start = new Date(`${date}T${startTime}`);
    if (isNaN(start.getTime())) {
      toast.error('Невалиден формат за дата и час');
      return;
    }

    const vehicleSummary = buildVehicleSummary();
    if (!vehicleSummary) {
      return;
    }

    const messageParts: string[] = [vehicleSummary];
    if (problemDescription.trim()) {
      messageParts.push(`Описание на проблема: ${problemDescription.trim()}`);
    }
    if (additionalInfo.trim()) {
      messageParts.push(`Допълнителна информация: ${additionalInfo.trim()}`);
    }

    setIsSubmitting(true);
    try {
      await api.post('/appointment-requests', {
        serviceCompanyId: selectedServiceCompany.id,
        requestedStart: start.toISOString(),
        message: messageParts.join('\n'),
      });

      toast.success('Заявката е изпратена и чака одобрение');
      setDate('');
      setStartTime('');
      setProblemDescription('');
      setAdditionalInfo('');
      setVehicleMode(vehicles.length > 0 ? 'EXISTING' : 'NEW');
      if (vehicles.length > 0) {
        setSelectedVehicleId(vehicles[0]!.id);
      } else {
        setSelectedVehicleId('');
      }
      setNewVehicleBrand('');
      setNewVehicleModel('');
      setNewVehicleYear('');
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
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 space-y-4"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          <div className="border border-borderSubtle rounded-lg p-4">
            <label className="block text-sm font-medium text-textPrimary mb-3">Автомобил *</label>
            <div className="flex flex-col sm:flex-row gap-4 mb-3">
              <label className="inline-flex items-center gap-2 text-sm text-textPrimary">
                <input
                  type="radio"
                  name="vehicleMode"
                  value="EXISTING"
                  checked={vehicleMode === 'EXISTING'}
                  onChange={() => setVehicleMode('EXISTING')}
                  disabled={vehicles.length === 0}
                />
                Регистриран автомобил
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-textPrimary">
                <input
                  type="radio"
                  name="vehicleMode"
                  value="NEW"
                  checked={vehicleMode === 'NEW'}
                  onChange={() => setVehicleMode('NEW')}
                />
                Нов автомобил
              </label>
            </div>

            {vehicleMode === 'EXISTING' ? (
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-2">
                  Избери автомобил
                </label>
                <select
                  value={selectedVehicleId}
                  onChange={(event) => setSelectedVehicleId(event.target.value)}
                  disabled={isLoadingVehicles || vehicles.length === 0}
                  className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                >
                  {vehicles.length === 0 ? (
                    <option value="">Нямаш регистрирани автомобили</option>
                  ) : (
                    vehicles.map((vehicle) => (
                      <option key={vehicle.id} value={vehicle.id}>
                        {vehicle.brand} {vehicle.model}
                        {vehicle.year ? `, ${vehicle.year}` : ''} ({vehicle.licensePlate})
                      </option>
                    ))
                  )}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Марка *</label>
                  <input
                    type="text"
                    value={newVehicleBrand}
                    onChange={(event) => setNewVehicleBrand(event.target.value)}
                    className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Напр. BMW"
                    required={vehicleMode === 'NEW'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Модел *</label>
                  <input
                    type="text"
                    value={newVehicleModel}
                    onChange={(event) => setNewVehicleModel(event.target.value)}
                    className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Напр. 320d"
                    required={vehicleMode === 'NEW'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-textPrimary mb-2">Година *</label>
                  <input
                    type="number"
                    min={1900}
                    max={new Date().getFullYear() + 1}
                    value={newVehicleYear}
                    onChange={(event) => setNewVehicleYear(event.target.value)}
                    className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Напр. 2018"
                    required={vehicleMode === 'NEW'}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Описание на проблема
            </label>
            <textarea
              value={problemDescription}
              onChange={(event) => setProblemDescription(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Напр. шум от предницата, смяна на накладки..."
              className="w-full px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-textPrimary mb-2">
              Допълнителна информация
            </label>
            <textarea
              value={additionalInfo}
              onChange={(event) => setAdditionalInfo(event.target.value)}
              rows={3}
              maxLength={1000}
              placeholder="Напр. желая автомобилът да е готов в същия ден..."
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
                        {new Date(request.requestedStart).toLocaleString('bg-BG')}
                      </div>
                      <div className="text-sm text-textSecondary flex items-start gap-2">
                        <Car className="w-4 h-4 mt-0.5" />
                        <span className="whitespace-pre-line">{request.message || '-'}</span>
                      </div>
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
