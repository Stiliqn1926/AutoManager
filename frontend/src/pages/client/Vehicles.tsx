import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronUp, ChevronDown, Car } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { useServiceCompany } from '../../hooks/useServiceCompany';

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  licensePlate: string;
  vin: string | null;
  updatedAt: string;
  _count?: {
    orders: number;
  };
}

type SortField = 'licensePlate' | 'brand' | 'orders' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

const Vehicles = () => {
  const navigate = useNavigate();
  const { selectedServiceCompany } = useServiceCompany();

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('licensePlate');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const fetchVehicles = async () => {
    if (!selectedServiceCompany) {
      setVehicles([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await api.get('/client/vehicles', {
        params: { serviceCompanyId: selectedServiceCompany.id },
      });

      setVehicles(response.data.vehicles || []);
    } catch (error) {
      toast.error('Грешка при зареждане на автомобили');
    
      console.error('Client vehicles error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceCompany?.id]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      return;
    }
    setSortField(field);
    setSortOrder('asc');
  };

  const filteredVehicles = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    const tokens = searchLower.split(/\s+/).filter(Boolean);
    const filtered = vehicles.filter((v) => {
      if (tokens.length === 0) return true;
      const fields = [
        v.licensePlate,
        v.brand,
        v.model,
        v.vin ?? '',
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
  }, [vehicles, searchTerm, sortField, sortOrder]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
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

  if (!selectedServiceCompany) {
    return (
      <MainLayout>
        <div className="bg-cardBg rounded-2xl shadow-card p-12 text-center">
          <Car className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-textPrimary mb-2">
            Няма избран сервиз
          </h2>
          <p className="text-textSecondary">
            Избери сервиз от „Моите сервизи“, за да видиш автомобилите си.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Моите автомобили</h1>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                aria-label="Търсене на автомобили"
                placeholder="Търси по рег. номер, марка, модел или VIN"
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
                    ['orders', 'Поръчки'],
                    ['updatedAt', 'Последна промяна'],
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
                </tr>
              </thead>

              <tbody>
                {filteredVehicles.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-textSecondary">
                      Няма намерени автомобили
                    </td>
                  </tr>
                ) : (
                  filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      onClick={() => navigate(`/client/vehicles/${vehicle.id}`)}
                      className="border-b hover:bg-mainBg cursor-pointer"
                    >
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium">{vehicle.licensePlate}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">
                        {vehicle.brand} {vehicle.model}
                        {vehicle.year ? (
                          <span className="text-sm text-textMuted"> ({vehicle.year})</span>
                        ) : null}
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{vehicle._count?.orders || 0}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">
                        {new Date(vehicle.updatedAt).toLocaleDateString('bg-BG')}
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



