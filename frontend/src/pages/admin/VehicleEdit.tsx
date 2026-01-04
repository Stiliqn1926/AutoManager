import { useState, useEffect, type ChangeEvent, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface VehicleFormData {
  brand: string;
  model: string;
  year: string;
  licensePlate: string;
  vin: string;
  color: string;
  mileage: string;
  status: string;
}

const VehicleEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<VehicleFormData>({
    brand: '',
    model: '',
    year: '',
    licensePlate: '',
    vin: '',
    color: '',
    mileage: '',
    status: 'ACTIVE',
  });

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const response = await api.get(`/vehicles/${id}`);
        const vehicle = response.data.vehicle;

        setFormData({
          brand: vehicle.brand,
          model: vehicle.model,
          year: vehicle.year?.toString() || '',
          licensePlate: vehicle.licensePlate,
          vin: vehicle.vin || '',
          color: vehicle.color || '',
          mileage: vehicle.mileage?.toString() || '',
          status: vehicle.status,
        });
      } catch {
        toast.error('Грешка при зареждане на автомобил');
        navigate('/admin/vehicles');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehicle();
  }, [id, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const payload = {
        brand: formData.brand,
        model: formData.model,
        licensePlate: formData.licensePlate,
        status: formData.status,
        ...(formData.year && { year: parseInt(formData.year) }),
        ...(formData.vin && { vin: formData.vin }),
        ...(formData.color && { color: formData.color }),
        ...(formData.mileage && { mileage: parseInt(formData.mileage) }),
      };

      await api.put(`/vehicles/${id}`, payload);
      toast.success('Автомобилът е обновен');
      navigate(`/admin/vehicles/${id}`);
    } catch {
      toast.error('Грешка при обновяване');
    } finally {
      setIsSaving(false);
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Назад към детайли за автомобила"
            title="Назад"
            onClick={() => navigate(`/admin/vehicles/${id}`)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-textSecondary" />
          </button>

          <div>
            <h1 className="text-3xl font-bold text-textPrimary">
              Редактиране на автомобил
            </h1>
            <p className="text-textSecondary mt-1">
              Обновете информацията
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-cardBg rounded-2xl shadow-card p-6 max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Марка *"
                value={formData.brand}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, brand: e.target.value })
                }
                required
              />
              <Input
                label="Модел *"
                value={formData.model}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                required
              />
            </div>

            <Input
              label="Регистрационен номер *"
              value={formData.licensePlate}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, year: e.target.value })
                }
                min="1900"
                max={new Date().getFullYear() + 1}
              />
              <Input
                label="Пробег (км)"
                type="number"
                value={formData.mileage}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setFormData({ ...formData, mileage: e.target.value })
                }
                min="0"
              />
            </div>

            <Input
              label="VIN номер"
              value={formData.vin}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
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
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setFormData({ ...formData, color: e.target.value })
              }
            />

            {/* Status */}
            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-textPrimary mb-2"
              >
                Статус *
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                  setFormData({ ...formData, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="ACTIVE">Активен</option>
                <option value="IN_SERVICE">В сервиз</option>
                <option value="ARCHIVED">Архивиран</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => navigate(`/admin/vehicles/${id}`)}
              >
                Отказ
              </Button>
              <Button type="submit" isLoading={isSaving}>
                Запази
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default VehicleEdit;
