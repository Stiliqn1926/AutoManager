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
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleDelete = async (id: string, licensePlate: string) => {
    if (!window.confirm(`Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ ${licensePlate}?`)) return;

    try {
      await api.delete(`/vehicles/${id}`);
      toast.success('ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      fetchVehicles();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || 'Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ';
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

  // Keep the derived list immutable before render to avoid accidental mutations.
  const filteredVehicles = (() => {
    const filtered = vehicles.filter((vehicle) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const tokens = searchLower.split(/\s+/).filter(Boolean);
      if (tokens.length === 0) return true;
      const fields = [
        vehicle.licensePlate,
        vehicle.brand,
        vehicle.model,
        vehicle.client.firstName,
        vehicle.client.lastName,
      ].map((value) => value.toLowerCase());
      return tokens.every((token) => fields.some((field) => field.startsWith(token)));
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
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸</h1>
          <Button onClick={() => navigate('/admin/vehicles/create')} className="w-full sm:w-auto lg:ml-auto">
            <Plus className="w-4 h-4" />
            Ð”Ð¾Ð±Ð°Ð²Ð¸ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»
          </Button>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                aria-label="Ð¢ÑŠÑ€ÑÐµÐ½Ðµ Ð½Ð° Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸"
                placeholder="Ð¢ÑŠÑ€ÑÐ¸ Ð¿Ð¾ Ñ€ÐµÐ³. Ð½Ð¾Ð¼ÐµÑ€, Ð¼Ð°Ñ€ÐºÐ° Ð¸Ð»Ð¸ ÐºÐ»Ð¸ÐµÐ½Ñ‚"
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
                    ['licensePlate', 'Ð ÐµÐ³. Ð½Ð¾Ð¼ÐµÑ€'],
                    ['brand', 'ÐœÐ°Ñ€ÐºÐ° / ÐœÐ¾Ð´ÐµÐ»'],
                    ['client', 'ÐšÐ»Ð¸ÐµÐ½Ñ‚'],
                    ['orders', 'ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ¸'],
                    ['updatedAt', 'ÐŸÐ¾ÑÐ»ÐµÐ´Ð½Ð¾ Ð¾Ð±ÑÐ»ÑƒÐ¶Ð²Ð°Ð½Ðµ'],
                  ].map(([key, label]) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as SortField)}
                      className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold cursor-pointer hover:bg-mainBg"
                    >
                      <div className="flex items-center gap-2">
                        {label}
                        <SortIcon field={key as SortField} />
                      </div>
                    </th>
                  ))}
                  <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold">Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ</th>
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-textSecondary">
                      ÐÑÐ¼Ð° Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð¸ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      onClick={() => navigate(`/admin/vehicles/${vehicle.id}`)}
                      className="border-b hover:bg-mainBg cursor-pointer"
                    >
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium">{vehicle.licensePlate}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{vehicle.brand} {vehicle.model}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">
                        {vehicle.client.firstName} {vehicle.client.lastName}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{vehicle._count?.orders || 0}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">
                        {new Date(vehicle.updatedAt).toLocaleDateString('bg-BG')}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-sm sm:text-base">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            aria-label="Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»"
                            title="Ð ÐµÐ´Ð°ÐºÑ‚Ð¸Ñ€Ð°Ð¹"
                            onClick={() => navigate(`/admin/vehicles/${vehicle.id}/edit`)}
                            className="p-2 rounded-lg hover:bg-gray-100"
                          >
                            <Edit className="w-4 h-4 text-primary" />
                          </button>
                          {(vehicle._count?.orders === 0) && (
                            <button
                              type="button"
                              aria-label="Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»"
                              title="Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹"
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



