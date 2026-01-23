import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserX, UserCheck, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string; // 🆕 За pending клиенти (когато user е null)
  address: string | null;
  isActive: boolean;
  createdAt: string;
  user?: {
    email: string;
  } | null; // 🆕 Може да е null за pending клиенти
  _count?: {
    vehicles: number;
    orders: number;
  };
  isPending?: boolean; // 🆕 За pending клиенти от PendingRequest
}

interface PendingClientRequest {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email: string;
  createdAt: string;
}

type SortField =
  | 'name'
  | 'email'
  | 'phone'
  | 'vehicles'
  | 'orders'
  | 'createdAt'
  | 'status';

type SortOrder = 'asc' | 'desc';

const Clients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive' | 'pending'>('all');

  const navigate = useNavigate();

  const fetchClients = async () => {
    try {
      // Зареди активни и неактивни клиенти
      const response = await api.get('/clients');
      const activeClients = (response.data.clients || []).map((c: Client) => ({
        ...c,
        isPending: false,
      }));

      // Зареди pending заявки
      const pendingResponse = await api.get('/pending-requests');
      const pendingRequests: PendingClientRequest[] = Array.isArray(
        pendingResponse.data?.clientRequests
      )
        ? pendingResponse.data.clientRequests
        : [];

      // Преобразувай pending requests в Client формат
      const pendingClients: Client[] = pendingRequests.map((req) => ({
        id: req.id,
        firstName: req.firstName || req.email.split('@')[0],
        lastName: req.lastName || '',
        phone: req.phone || '',
        email: req.email, // 🆕 Добавено за fallback
        address: null,
        isActive: false,
        createdAt: req.createdAt,
        user: {
          email: req.email,
        },
        _count: {
          vehicles: 0,
          orders: 0,
        },
        isPending: true,
      }));

      // Комбинирай и постави pending отгоре
      setClients([...pendingClients, ...activeClients]);
    } catch {
      toast.error('Грешка при зареждане на клиенти');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleDeactivate = async (id: string, name: string, isActive: boolean) => {
    const action = isActive ? 'деактивирате' : 'активирате';
    if (!window.confirm(`Сигурни ли сте, че искате да ${action} ${name}?`)) return;

    try {
      await api.patch(`/clients/${id}/toggle-active`);
      toast.success(`Клиентът е ${isActive ? 'деактивиран' : 'активиран'}`);
      fetchClients();
    } catch {
      toast.error('Грешка при промяна на статус');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете ${name}? Това действие е необратимо.`)) return;

    try {
      await api.delete(`/clients/${id}`);
      toast.success('Клиентът е изтрит успешно');
      fetchClients();
    } catch {
      toast.error('Грешка при изтриване на клиент');
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

  const filteredClients = (() => {
    const filtered = clients.filter((client) => {
      const matchesSearch = `${client.firstName} ${client.lastName} ${client.phone} ${client.user?.email || ''}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'pending' && client.isPending) ||
        (filterStatus === 'active' && client.isActive && !client.isPending) ||
        (filterStatus === 'inactive' && !client.isActive && !client.isPending);

      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: string | number | boolean = '';
      let bValue: string | number | boolean = '';

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
          break;
        case 'email':
          aValue = a.user?.email || '';
          bValue = b.user?.email || '';
          break;
        case 'phone':
          aValue = a.phone;
          bValue = b.phone;
          break;
        case 'vehicles':
          aValue = a._count?.vehicles || 0;
          bValue = b._count?.vehicles || 0;
          break;
        case 'orders':
          aValue = a._count?.orders || 0;
          bValue = b._count?.orders || 0;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'status':
          aValue = a.isActive;
          bValue = b.isActive;
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

      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortOrder === 'asc'
          ? Number(bValue) - Number(aValue)
          : Number(aValue) - Number(bValue);
      }

      return 0;
    });

    return filtered;
  })();

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

  return (
    <MainLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-textPrimary">Клиенти</h1>

        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                aria-label="Търсене на клиенти"
                placeholder="Търси по име, телефон или имейл"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              aria-label="Филтър по статус на клиент"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'all' | 'active' | 'inactive' | 'pending')
              }
              className="px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Всички статуси</option>
              <option value="active">Активни</option>
              <option value="inactive">Неактивни</option>
              <option value="pending">Чака одобрение</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-borderSubtle">
                  {[
                    { key: 'name', label: 'Име' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Телефон' },
                    { key: 'vehicles', label: 'Автомобили' },
                    { key: 'orders', label: 'Поръчки' },
                    { key: 'createdAt', label: 'Регистрация' },
                    { key: 'status', label: 'Статус' },
                  ].map(({ key, label }) => (
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
                  <th className="text-right py-3 px-4 text-sm font-semibold">
                    Действия
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-textSecondary">
                      Няма намерени клиенти
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const isClickable = !client.isPending; // Кликаем само ако НЕ е pending

                    return (
                    <tr
                      key={client.id}
                      className={`border-b ${isClickable ? 'hover:bg-mainBg cursor-pointer' : 'opacity-75'}`}
                      onClick={isClickable ? () => navigate(`/admin/clients/${client.id}`) : undefined}
                    >
                      <td className="px-4 py-4 font-medium">
                        {client.firstName} {client.lastName}
                      </td>
                      <td className="px-4 py-4">{client.user?.email || client.email || '-'}</td>
                      <td className="px-4 py-4">{client.phone}</td>
                      <td className="px-4 py-4">{client._count?.vehicles || 0}</td>
                      <td className="px-4 py-4">{client._count?.orders || 0}</td>
                      <td className="px-4 py-4">
                        {new Date(client.createdAt).toLocaleDateString('bg-BG')}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.isPending
                              ? 'bg-yellow-100 text-yellow-800'
                              : client.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {client.isPending ? 'Чака одобрение' : client.isActive ? 'Активен' : 'Неактивен'}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.isPending ? (
                            // Pending клиенти - без бутони (одобрението е в Settings)
                            <span className="text-xs text-textSecondary italic">
                              Одобрете в Settings
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                aria-label={
                                  client.isActive
                                    ? 'Деактивирай клиент'
                                    : 'Активирай клиент'
                                }
                                title={client.isActive ? 'Деактивирай' : 'Активирай'}
                                onClick={() =>
                                  handleDeactivate(
                                    client.id,
                                    `${client.firstName} ${client.lastName}`,
                                    client.isActive
                                  )
                                }
                                className="p-2 rounded-lg hover:bg-gray-100"
                              >
                                {client.isActive ? (
                                  <UserX className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-green-600" />
                                )}
                              </button>
                              {(client._count?.vehicles === 0 && client._count?.orders === 0) && (
                                <button
                                  type="button"
                                  aria-label="Изтрий клиент"
                                  title="Изтрий"
                                  onClick={() =>
                                    handleDelete(
                                      client.id,
                                      `${client.firstName} ${client.lastName}`
                                    )
                                  }
                                  className="p-2 rounded-lg hover:bg-gray-100"
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Clients;
