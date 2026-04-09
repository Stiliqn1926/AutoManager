import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Car, User, Phone, Calendar, ClipboardList, ChevronUp, ChevronDown } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { getMechanicVehicles } from '../../services/mechanicService';
import type { MechanicVehicle } from '../../types/mechanic';
import toast from 'react-hot-toast';

type SortField = 'vehicle' | 'licensePlate' | 'client' | 'status' | 'lastOrder';
type SortOrder = 'asc' | 'desc';

const MechanicVehicles = () => {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<MechanicVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('vehicle');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const fetchVehicles = async () => {
    setIsLoading(true);
    try {

      const data = await getMechanicVehicles({
        page: 1,
        limit: 1000,
      });
      setVehicles(data.vehicles);
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };


  const normalizePhone = (phone: string): string => {

    const digits = phone.replace(/\D/g, '');

    if (digits.startsWith('359')) {
      return '0' + digits.slice(3);
    }
    return digits;
  };


  const filteredVehicles = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    const searchNormalized = normalizePhone(searchTerm);
    const tokens = searchLower.split(/\s+/).filter(Boolean);

    const filtered = vehicles.filter((vehicle) => {

      const fields = [
        vehicle.licensePlate,
        vehicle.brand,
        vehicle.model,
        vehicle.client?.firstName || '',
        vehicle.client?.lastName || '',
      ].map((value) => value.toLowerCase());

      const matchesText = tokens.length === 0
        ? true
        : tokens.every((token) => fields.some((field) => field.startsWith(token)));


      const clientPhoneNormalized = normalizePhone(vehicle.client?.phone || '');
      const matchesPhone = searchNormalized.length > 0 && clientPhoneNormalized.startsWith(searchNormalized);

      const matchesSearch = matchesText || matchesPhone;


      const matchesActive = !activeOnly || vehicle.hasActiveOrder;

      return matchesSearch && matchesActive;
    });


    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'vehicle':
          aValue = `${a.model} ${a.brand}`.toLowerCase();
          bValue = `${b.model} ${b.brand}`.toLowerCase();
          break;
        case 'licensePlate':
          aValue = a.licensePlate.toLowerCase();
          bValue = b.licensePlate.toLowerCase();
          break;
        case 'client':
          aValue = `${a.client?.firstName || ''} ${a.client?.lastName || ''}`.toLowerCase();
          bValue = `${b.client?.firstName || ''} ${b.client?.lastName || ''}`.toLowerCase();
          break;
        case 'status':
          aValue = a.hasActiveOrder ? 1 : 0;
          bValue = b.hasActiveOrder ? 1 : 0;
          break;
        case 'lastOrder':
          aValue = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
          bValue = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
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
  }, [vehicles, searchTerm, activeOnly, sortField, sortOrder]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'ÐÑÐ¼Ð°';
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

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
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸</h1>
            <p className="text-textSecondary mt-1">ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸ Ñ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸ Ð¿Ñ€Ð¸ Ñ‚ÐµÐ±</p>
          </div>
          <div className="text-sm text-textSecondary sm:ml-auto sm:text-right">
            ÐŸÐ¾ÐºÐ°Ð·Ð°Ð½Ð¸: <span className="font-semibold text-textPrimary">{filteredVehicles.length}</span> Ð¾Ñ‚ {vehicles.length} Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð°
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-4 sm:p-6">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-none md:max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary w-5 h-5" />
              <input
                type="text"
                placeholder="Ð¢ÑŠÑ€ÑÐ¸ Ð¿Ð¾ Ñ€ÐµÐ³. Ð½Ð¾Ð¼ÐµÑ€, Ð¼Ð°Ñ€ÐºÐ°, Ð¼Ð¾Ð´ÐµÐ» Ð¸Ð»Ð¸ ÐºÐ»Ð¸ÐµÐ½Ñ‚..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Filter: Active Only */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-textSecondary">Ð¡Ð°Ð¼Ð¾ Ñ Ð°ÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸</span>
              </label>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          {filteredVehicles.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <Car className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>ÐÑÐ¼Ð° Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð¸ Ð°Ð²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-borderSubtle">
                  <tr>
                    <th
                      onClick={() => handleSort('vehicle')}
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»
                        <SortIcon field="vehicle" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('licensePlate')}
                      className="px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Ð ÐµÐ³. Ð½Ð¾Ð¼ÐµÑ€
                        <SortIcon field="licensePlate" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('client')}
                      className="hidden md:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        ÐšÐ»Ð¸ÐµÐ½Ñ‚
                        <SortIcon field="client" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('status')}
                      className="px-3 sm:px-6 py-2 sm:py-3 text-center text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Ð¡Ñ‚Ð°Ñ‚ÑƒÑ
                        <SortIcon field="status" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('lastOrder')}
                      className="hidden lg:table-cell px-3 sm:px-6 py-2 sm:py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        ÐŸÐ¾ÑÐ»ÐµÐ´Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°
                        <SortIcon field="lastOrder" />
                      </div>
                    </th>
                    <th className="px-3 sm:px-6 py-2 sm:py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {filteredVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/mechanic/vehicles/${vehicle.id}`)}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Car className="w-4 h-4 text-textSecondary" />
                          <div>
                            <div className="text-sm font-medium text-textPrimary">
                              {vehicle.brand} {vehicle.model}
                            </div>
                            {vehicle.year && (
                              <div className="text-xs text-textSecondary">{vehicle.year}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-textPrimary">{vehicle.licensePlate}</div>
                      </td>
                      <td className="hidden md:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-textSecondary" />
                          <div>
                            <div className="text-sm text-textPrimary">
                              {vehicle.client?.firstName} {vehicle.client?.lastName}
                            </div>
                            {vehicle.client?.phone && (
                              <div className="text-xs text-textSecondary flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {vehicle.client.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-center">
                        {vehicle.hasActiveOrder ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
                            <ClipboardList className="w-3 h-3" />
                            ÐÐºÑ‚Ð¸Ð²Ð½Ð° Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ°
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            ÐÑÐ¼Ð° Ð°ÐºÑ‚Ð¸Ð²Ð½Ð°
                          </span>
                        )}
                      </td>
                      <td className="hidden lg:table-cell px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-textSecondary">
                          <Calendar className="w-3 h-3" />
                          {formatDate(vehicle.lastOrderDate)}
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/mechanic/vehicles/${vehicle.id}`);
                          }}
                          className="text-primary hover:text-primary-700 text-sm font-medium"
                        >
                          Ð”ÐµÑ‚Ð°Ð¹Ð»Ð¸
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MechanicVehicles;

