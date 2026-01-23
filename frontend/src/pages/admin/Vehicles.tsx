import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Edit, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  licensePlate: string;
  vin: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
  };
  _count?: {
    orders: number;
  };
  updatedAt: string;
}

type SortField =
  | 'licensePlate'
  | 'brand'
  | 'client'
  | 'orders'
  | 'updatedAt';

type SortOrder = 'asc' | 'desc';

const Vehicles = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('licensePlate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const navigate = useNavigate();

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      setVehicles(response.data.vehicles || []);
    } catch {
      toast.error('Грешка при зареждане на автомобили');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id: string, licensePlate: string) => {
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете ${licensePlate}?`)) return;

    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('Автомобилът е изтрит успешно');
      fetchVehicles();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Грешка при изтриване';
      toast.error(errorMessage);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  /* ✅ const вместо let */
  const filteredVehicles = (() => {
    const filtered = vehicles.filter((vehicle) => {
      const matchesSearch = `${vehicle.licensePlate} ${vehicle.brand} ${vehicle.model} ${vehicle.client.firstName} ${vehicle.client.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      return matchesSearch;
    });

    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'licensePlate':
          aValue = a.licensePlate;
          bValue = b.licensePlate;
          break;
        case 'brand':
          aValue = `${a.brand} ${a.model}`;
          bValue = `${b.brand} ${b.model}`;
          break;
        case 'client':
          aValue = `${a.client.firstName} ${a.client.lastName}`;
          bValue = `${b.client.firstName} ${b.client.lastName}`;
          break;
        case 'orders':
          aValue = a._count?.orders || 0;
          bValue = b._count?.orders || 0;
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt).getTime();
          bValue = new Date(b.updatedAt).getTime();
          break;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  })();

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc'
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-textPrimary">Автомобили</h1>
          <Button onClick={() => navigate('/admin/vehicles/create')}>
            <Plus className="w-4 h-4" />
            Добави автомобил
          </Button>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                aria-label="Търсене на автомобили"
                placeholder="Търси по рег. номер, марка или клиент"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-borderSubtle">
                  {[
                    ['licensePlate', 'Рег. номер'],
                    ['brand', 'Марка / Модел'],
                    ['client', 'Клиент'],
                    ['orders', 'Поръчки'],
                    ['updatedAt', 'Последно обслужване'],
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as SortField)}
                      className="text-left py-3 px-4 text-sm font-semibold cursor-pointer hover:bg-mainBg"
                    >
                      <div className="flex items-center gap-2">
                        {label}
                        <SortIcon field={key as SortField} />
                      </div>
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 text-sm font-semibold">Действия</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-textSecondary">
                      Няма намерени автомобили
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      onClick={() => navigate(`/admin/vehicles/${vehicle.id}`)}
                      className="border-b hover:bg-mainBg cursor-pointer"
                    >
                      <td className="px-4 py-4 font-medium">{vehicle.licensePlate}</td>
                      <td className="px-4 py-4">{vehicle.brand} {vehicle.model}</td>
                      <td className="px-4 py-4">
                        {vehicle.client.firstName} {vehicle.client.lastName}
                      </td>
                      <td className="px-4 py-4">{vehicle._count?.orders || 0}</td>
                      <td className="px-4 py-4">
                        {new Date(vehicle.updatedAt).toLocaleDateString('bg-BG')}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label="Редактирай автомобил"
                            title="Редактирай"
                            onClick={() => navigate(`/admin/vehicles/${vehicle.id}/edit`)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                          {(vehicle._count?.orders === 0) && (
                            <button
                              type="button"
                              aria-label="Изтрий автомобил"
                              title="Изтрий"
                              onClick={() => handleDelete(vehicle.id, vehicle.licensePlate)}
                              className="p-2 rounded-lg hover:bg-gray-100"
                            >
                              <Trash2 className="w-4 h-4 text-error" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Vehicles;

