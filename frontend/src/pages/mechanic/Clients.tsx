import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Phone, Mail, Calendar, Package, ChevronUp, ChevronDown } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { getMechanicClients } from '../../services/mechanicService';
import type { MechanicClient } from '../../types/mechanic';
import toast from 'react-hot-toast';

type SortField = 'name' | 'phone' | 'vehicles' | 'activeOrders' | 'lastOrder';
type SortOrder = 'asc' | 'desc';

const MechanicClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<MechanicClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      // Зареждаме всички клиенти без pagination (лимит 1000)
      const data = await getMechanicClients({
        page: 1,
        limit: 1000,
      });
      setClients(data.clients);
    } catch {
      toast.error('Грешка при зареждане на клиенти');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Нормализира телефонен номер за търсене (+359 → 0)
  const normalizePhone = (phone: string): string => {
    // Премахни всички символи освен цифри
    const digits = phone.replace(/\D/g, '');
    // Ако започва с 359, замени с 0
    if (digits.startsWith('359')) {
      return '0' + digits.slice(3);
    }
    return digits;
  };

  // Филтрация и сортиране на клиенти (клиентски)
  const filteredClients = useMemo(() => {
    const searchLower = searchTerm.toLowerCase().trim();
    const searchNormalized = normalizePhone(searchTerm);
    const tokens = searchLower.split(/\s+/).filter(Boolean);

    const filtered = clients.filter((client) => {
      const hasSearch = tokens.length > 0 || searchNormalized.length > 0;

      // Търсене по име или имейл
      const fields = [
        client.firstName,
        client.lastName,
        client.email || '',
        client.user?.email || '',
      ].map((value) => value.toLowerCase());
      const matchesNameEmail = tokens.length === 0
        ? false
        : tokens.every((token) => fields.some((field) => field.startsWith(token)));

      // Търсене по телефон (нормализирано)
      const clientPhoneNormalized = normalizePhone(client.phone || '');
      const matchesPhone = searchNormalized.length > 0 && clientPhoneNormalized.startsWith(searchNormalized);

      const matchesSearch = !hasSearch || matchesNameEmail || matchesPhone;

      // Филтър за активни поръчки
      const matchesActive = !activeOnly || client.activeOrdersCount > 0;

      return matchesSearch && matchesActive;
    });

    // Сортиране
    filtered.sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`.toLowerCase();
          bValue = `${b.firstName} ${b.lastName}`.toLowerCase();
          break;
        case 'phone':
          aValue = a.phone || '';
          bValue = b.phone || '';
          break;
        case 'vehicles':
          aValue = a._count?.vehicles || 0;
          bValue = b._count?.vehicles || 0;
          break;
        case 'activeOrders':
          aValue = a.activeOrdersCount || 0;
          bValue = b.activeOrdersCount || 0;
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
  }, [clients, searchTerm, activeOnly, sortField, sortOrder]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Няма';
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-textPrimary">Клиенти</h1>
            <p className="text-textSecondary mt-1">Клиенти с поръчки при теб</p>
          </div>
          <div className="text-sm text-textSecondary">
            Показани: <span className="font-semibold text-textPrimary">{filteredClients.length}</span> от {clients.length} клиента
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary w-5 h-5" />
              <input
                type="text"
                placeholder="Търси по име, телефон или имейл..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>

            {/* Filter: Active Only */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => setActiveOnly(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-textSecondary">Само с активни поръчки</span>
              </label>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          {filteredClients.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма намерени клиенти</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-borderSubtle">
                  <tr>
                    <th
                      onClick={() => handleSort('name')}
                      className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Клиент
                        <SortIcon field="name" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('phone')}
                      className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Контакт
                        <SortIcon field="phone" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('vehicles')}
                      className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Автомобили
                        <SortIcon field="vehicles" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('activeOrders')}
                      className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center justify-center gap-2">
                        Активни поръчки
                        <SortIcon field="activeOrders" />
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('lastOrder')}
                      className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        Последна поръчка
                        <SortIcon field="lastOrder" />
                      </div>
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => navigate(`/mechanic/clients/${client.id}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-textSecondary" />
                          <div className="text-sm font-medium text-textPrimary">
                            {client.firstName} {client.lastName}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {client.phone && (
                            <div className="flex items-center gap-1 text-xs text-textSecondary">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                          )}
                          {(client.email || client.user?.email) && (
                            <div className="flex items-center gap-1 text-xs text-textSecondary">
                              <Mail className="w-3 h-3" />
                              {client.email || client.user?.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium">
                          <Package className="w-3 h-3" />
                          {client._count?.vehicles || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            client.activeOrdersCount > 0
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {client.activeOrdersCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-xs text-textSecondary">
                          <Calendar className="w-3 h-3" />
                          {formatDate(client.lastOrderDate)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/mechanic/clients/${client.id}`);
                          }}
                          className="text-primary hover:text-primary-700 text-sm font-medium"
                        >
                          Детайли
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

export default MechanicClients;
