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

interface VehicleFormData {
  clientId: string;
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  vin: string;
  color: string;
  mileage: string;
}

const VehicleCreate = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<Client[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<VehicleFormData>({
    clientId: '',
    brand: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    color: '',
    mileage: '',
  });

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/clients');
        setClients(response.data.clients || []);
      } catch {
        toast.error('Грешка при зареждане на клиенти');
      }
    };

    fetchClients();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        clientId: formData.clientId,
        brand: formData.brand,
        model: formData.model,
        licensePlate: formData.licensePlate,
        ...(formData.year && { year: Number(formData.year) }),
        ...(formData.vin && { vin: formData.vin }),
        ...(formData.color && { color: formData.color }),
        ...(formData.mileage && { mileage: Number(formData.mileage) }),
      };

      await api.post('/vehicles', payload);
      toast.success('Автомобилът е добавен');
      navigate('/admin/vehicles');
    } catch {
      toast.error('Грешка при добавяне на автомобил');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/admin/vehicles')}
            aria-label="Назад към списъка с автомобили"
            title="Назад"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-textPrimary">
              Добави автомобил
            </h1>
            <p className="text-textSecondary mt-1">
              Въведете информацията за новия автомобил
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-cardBg rounded-2xl shadow-card p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client select */}
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
                  setFormData({ ...formData, clientId: e.target.value })
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

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Марка *"
                value={formData.brand}
                onChange={(e) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                required
              />
              <Input
                label="Модел *"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                required
              />
            </div>

            <Input
              label="Регистрационен номер *"
              value={formData.licensePlate}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  licensePlate: e.target.value.toUpperCase(),
                })
              }
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Година"
                type="number"
                value={formData.year}
                onChange={(e) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                min="1900"
                max={new Date().getFullYear() + 1}
              />
              <Input
                label="Пробег (км)"
                type="number"
                value={formData.mileage}
                onChange={(e) =>
                  setFormData({ ...formData, mileage: e.target.value })
                }
                min="0"
              />
            </div>

            <Input
              label="VIN номер"
              value={formData.vin}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  vin: e.target.value.toUpperCase(),
                })
              }
              maxLength={17}
            />

            <Input
              label="Цвят"
              value={formData.color}
              onChange={(e) =>
                setFormData({ ...formData, color: e.target.value })
              }
            />

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate('/admin/vehicles')}
              >
                Отказ
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Добави
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default VehicleCreate;
