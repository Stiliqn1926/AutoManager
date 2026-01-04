import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
}

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  licensePlate: string;
}

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface OrderFormData {
  clientId: string;
  vehicleId: string;
  workerId: string;
  clientDescription: string;
  startDate: string;
  endDate: string;
}

const OrderCreate = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<OrderFormData>({
    clientId: '',
    vehicleId: '',
    workerId: '',
    clientDescription: '',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, workersRes] = await Promise.all([
          api.get('/clients'),
          api.get('/workers'),
        ]);
        setClients(clientsRes.data.clients || []);
        setWorkers(workersRes.data.workers || []);
      } catch {
        toast.error('Грешка при зареждане на данни');
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      if (!formData.clientId) {
        setVehicles([]);
        return;
      }

      try {
        const response = await api.get(`/vehicles?clientId=${formData.clientId}`);
        setVehicles(response.data.vehicles || []);
      } catch {
        toast.error('Грешка при зареждане на автомобили');
      }
    };

    fetchVehicles();
  }, [formData.clientId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        clientId: formData.clientId,
        vehicleId: formData.vehicleId,
        description: formData.clientDescription,
        ...(formData.workerId && { workerId: formData.workerId }),
        ...(formData.startDate && { startDate: formData.startDate }),
        ...(formData.endDate && { endDate: formData.endDate }),
      };

      const response = await api.post('/orders', payload);
      toast.success('Поръчката е създадена');
      navigate(`/admin/orders/${response.data.order.id}`);
    } catch {
      toast.error('Грешка при създаване на поръчка');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Назад към списъка с поръчки"
            title="Назад"
            onClick={() => navigate('/admin/orders')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-textPrimary">Нова поръчка</h1>
            <p className="text-textSecondary mt-1">
              Създаване на нова сервизна поръчка
            </p>
          </div>
        </div>

        {/* FORM */}
        <div className="bg-cardBg rounded-2xl shadow-card p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* CLIENT */}
            <div>
              <label
                htmlFor="clientId"
                className="block text-sm font-medium text-textPrimary mb-2"
              >
                Клиент *
              </label>
              <select
                id="clientId"
                aria-label="Избор на клиент"
                value={formData.clientId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({
                    ...formData,
                    clientId: e.target.value,
                    vehicleId: '',
                  })
                }
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="">Избери клиент</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* VEHICLE */}
            <div>
              <label
                htmlFor="vehicleId"
                className="block text-sm font-medium text-textPrimary mb-2"
              >
                Автомобил *
              </label>
              <select
                id="vehicleId"
                aria-label="Избор на автомобил"
                value={formData.vehicleId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, vehicleId: e.target.value })
                }
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
                disabled={!formData.clientId}
              >
                <option value="">Избери автомобил</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.brand} {vehicle.model} ({vehicle.licensePlate})
                  </option>
                ))}
              </select>
            </div>

            {/* WORKER */}
            <div>
              <label
                htmlFor="workerId"
                className="block text-sm font-medium text-textPrimary mb-2"
              >
                Механик
              </label>
              <select
                id="workerId"
                aria-label="Назначаване на механик"
                value={formData.workerId}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, workerId: e.target.value })
                }
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">Не е назначен</option>
                {workers.map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.firstName} {worker.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-2">
                Описание от клиента *
              </label>
              <textarea
                aria-label="Описание на проблема от клиента"
                value={formData.clientDescription}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setFormData({ ...formData, clientDescription: e.target.value })
                }
                className="w-full px-4 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                rows={4}
                placeholder="Какво съобщава клиентът..."
                required
              />
            </div>

            {/* DATES */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Начална дата"
                type="date"
                value={formData.startDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
              />
              <Input
                label="Очаквана дата"
                type="date"
                value={formData.endDate}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
              />
            </div>

            {/* ACTIONS */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                title="Отказ"
                onClick={() => navigate('/admin/orders')}
              >
                Отказ
              </Button>
              <Button type="submit" isLoading={isSaving} title="Създай поръчка">
                Създай поръчка
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default OrderCreate;
