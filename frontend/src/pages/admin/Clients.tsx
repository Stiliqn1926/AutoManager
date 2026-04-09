import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Search, UserX, UserCheck, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { POLLING_INTERVALS } from '../../config/polling';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  address: string | null;
  isActive: boolean;
  createdAt: string;
  user?: {
    email: string;
  } | null;
  _count?: {
    vehicles: number;
    orders: number;
  };
  isPending?: boolean;
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
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  const navigate = useNavigate();

  const fetchClients = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    const requestSeq = requestSeqRef.current + 1;
    requestSeqRef.current = requestSeq;

    activeRequestRef.current?.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;

    if (!silent) {
      setIsLoading(true);
    }

    try {

      const [response, pendingResponse] = await Promise.all([
        api.get('/clients', {
          signal: controller.signal,
          params: {
            page: pagination.currentPage,
            limit: 20,
          },
        }),
        api.get('/pending-requests', { signal: controller.signal }),
      ]);

      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      const activeClients = (response.data.clients || []).map((c: Client) => ({
        ...c,
        isPending: false,
      }));

      const pendingRequests: PendingClientRequest[] = Array.isArray(
        pendingResponse.data?.clientRequests
      )
        ? pendingResponse.data.clientRequests
        : [];


      const pendingClients: Client[] = pendingRequests.map((req) => ({
        id: req.id,
        firstName: req.firstName || req.email.split('@')[0],
        lastName: req.lastName || '',
        phone: req.phone || '',
        email: req.email,
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

      const pendingEmails = new Set(
        pendingClients
          .map((client: Client) => (client.user?.email || client.email || '').toLowerCase())
          .filter(Boolean)
      );
      const filteredActiveClients = activeClients.filter((client: Client) => {
        const email = (client.user?.email || client.email || '').toLowerCase();
        return !pendingEmails.has(email);
      });

      setClients([...pendingClients, ...filteredActiveClients]);
      setPagination({
        currentPage: response.data.pagination?.currentPage || 1,
        totalPages: Math.max(response.data.pagination?.totalPages || 1, 1),
        totalItems: (response.data.pagination?.totalItems || 0) + pendingClients.length,
      });
    } catch (error: unknown) {
      if (
        axios.isCancel(error) ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        return;
      }

      if (!silent) {
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¸');
      }
    } finally {
      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      if (!silent) {
        setIsLoading(false);
      }

      if (activeRequestRef.current === controller) {
        activeRequestRef.current = null;
      }
    }
  }, [pagination.currentPage]);

  useEffect(() => {
    void fetchClients();

    const refreshSilently = () => {
      if (document.visibilityState === 'visible') {
        void fetchClients({ silent: true });
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchClients({ silent: true });
      }
    }, POLLING_INTERVALS.lists);

    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', refreshSilently);

    return () => {
      activeRequestRef.current?.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', refreshSilently);
    };
  }, [fetchClients]);

  const handleDeactivate = async (id: string, name: string, isActive: boolean) => {
    const action = isActive ? 'Ð´ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ñ‚Ðµ' : 'Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ñ‚Ðµ';
    if (!window.confirm(`Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° ${action} ${name}?`)) return;

    try {
      await api.patch(`/clients/${id}/toggle-active`);
      toast.success(`ÐšÐ»Ð¸ÐµÐ½Ñ‚ÑŠÑ‚ Ðµ ${isActive ? 'Ð´ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½' : 'Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½'}`);
      void fetchClients({ silent: true });
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ñ€Ð¾Ð¼ÑÐ½Ð° Ð½Ð° ÑÑ‚Ð°Ñ‚ÑƒÑ');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ ${name}? Ð¢Ð¾Ð²Ð° Ð´ÐµÐ¹ÑÑ‚Ð²Ð¸Ðµ Ðµ Ð½ÐµÐ¾Ð±Ñ€Ð°Ñ‚Ð¸Ð¼Ð¾.`)) return;

    try {
      await api.delete(`/clients/${id}`);
      toast.success('ÐšÐ»Ð¸ÐµÐ½Ñ‚ÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾');
      void fetchClients({ silent: true });
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ Ð½Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚');
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


  const normalizePhone = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    if (digits.startsWith('359')) {
      return '0' + digits.slice(3);
    }
    return digits;
  };

  const filteredClients = (() => {
    const searchLower = searchTerm.toLowerCase().trim();
    const searchNormalized = normalizePhone(searchTerm);
    const tokens = searchLower.split(/\s+/).filter(Boolean);

    const filtered = clients.filter((client) => {
      if (tokens.length === 0 && searchNormalized.length === 0) {
        return (
          filterStatus === 'all' ||
          (filterStatus === 'pending' && client.isPending) ||
          (filterStatus === 'active' && client.isActive && !client.isPending) ||
          (filterStatus === 'inactive' && !client.isActive && !client.isPending)
        );
      }


      const fields = [
        client.firstName,
        client.lastName,
        client.user?.email || client.email || '',
      ].map((value) => value.toLowerCase());
      const matchesNameEmail = tokens.length === 0
        ? false
        : tokens.every((token) => fields.some((field) => field.startsWith(token)));


      const clientPhoneNormalized = normalizePhone(client.phone || '');
      const matchesPhone = searchNormalized.length > 0 && clientPhoneNormalized.startsWith(searchNormalized);

      const matchesSearch = matchesNameEmail || matchesPhone;

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
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">ÐšÐ»Ð¸ÐµÐ½Ñ‚Ð¸</h1>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                aria-label="Ð¢ÑŠÑ€ÑÐµÐ½Ðµ Ð½Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¸"
                placeholder="Ð¢ÑŠÑ€ÑÐ¸ Ð¿Ð¾ Ð¸Ð¼Ðµ, Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½ Ð¸Ð»Ð¸ Ð¸Ð¼ÐµÐ¹Ð»"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <select
              aria-label="Ð¤Ð¸Ð»Ñ‚ÑŠÑ€ Ð¿Ð¾ ÑÑ‚Ð°Ñ‚ÑƒÑ Ð½Ð° ÐºÐ»Ð¸ÐµÐ½Ñ‚"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'all' | 'active' | 'inactive' | 'pending')
              }
              className="w-full sm:w-auto px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Ð’ÑÐ¸Ñ‡ÐºÐ¸ ÑÑ‚Ð°Ñ‚ÑƒÑÐ¸</option>
              <option value="active">ÐÐºÑ‚Ð¸Ð²Ð½Ð¸</option>
              <option value="inactive">ÐÐµÐ°ÐºÑ‚Ð¸Ð²Ð½Ð¸</option>
              <option value="pending">Ð§Ð°ÐºÐ° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-borderSubtle">
                  {[
                    { key: 'name', label: 'Ð˜Ð¼Ðµ' },
                    { key: 'email', label: 'Email' },
                    { key: 'phone', label: 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½', className: 'hidden md:table-cell' },
                    { key: 'vehicles', label: 'ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸', className: 'hidden md:table-cell' },
                    { key: 'orders', label: 'ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ¸', className: 'hidden md:table-cell' },
                    { key: 'createdAt', label: 'Ð ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ', className: 'hidden lg:table-cell' },
                    { key: 'status', label: 'Ð¡Ñ‚Ð°Ñ‚ÑƒÑ' },
                  ].map(({ key, label, className }) => (
                    <th
                      key={key}
                      onClick={() => handleSort(key as SortField)}
                      className={`text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold cursor-pointer hover:bg-mainBg ${className || ''}`}
                    >
                      <div className="flex items-center gap-2">
                        {label}
                        <SortIcon field={key as SortField} />
                      </div>
                    </th>
                  ))}
                  <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold">
                    Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-textSecondary">
                      ÐÑÐ¼Ð° Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð¸ ÐºÐ»Ð¸ÐµÐ½Ñ‚Ð¸
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => {
                    const isClickable = !client.isPending;

                    return (
                    <tr
                      key={client.id}
                      className={`border-b ${isClickable ? 'hover:bg-mainBg cursor-pointer' : 'opacity-75'}`}
                      onClick={isClickable ? () => navigate(`/admin/clients/${client.id}`) : undefined}
                    >
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium">
                        {client.firstName} {client.lastName}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{client.user?.email || client.email || '-'}</td>
                      <td className="hidden md:table-cell px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{client.phone}</td>
                      <td className="hidden md:table-cell px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{client._count?.vehicles || 0}</td>
                      <td className="hidden md:table-cell px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{client._count?.orders || 0}</td>
                      <td className="hidden lg:table-cell px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{new Date(client.createdAt).toLocaleDateString('bg-BG')}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            client.isPending
                              ? 'bg-yellow-100 text-yellow-800'
                              : client.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {client.isPending ? 'Ð§Ð°ÐºÐ° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ' : client.isActive ? 'ÐÐºÑ‚Ð¸Ð²ÐµÐ½' : 'ÐÐµÐ°ÐºÑ‚Ð¸Ð²ÐµÐ½'}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-right text-sm sm:text-base">
                        <div
                          className="flex justify-end gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {client.isPending ? (

                            <span className="text-xs text-textSecondary italic">
                              ÐžÐ´Ð¾Ð±Ñ€ÐµÑ‚Ðµ Ð² ÐÐ°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                aria-label={
                                  client.isActive
                                    ? 'Ð”ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹ ÐºÐ»Ð¸ÐµÐ½Ñ‚'
                                    : 'ÐÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹ ÐºÐ»Ð¸ÐµÐ½Ñ‚'
                                }
                                title={client.isActive ? 'Ð”ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹' : 'ÐÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹'}
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
                                  aria-label="Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ ÐºÐ»Ð¸ÐµÐ½Ñ‚"
                                  title="Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹"
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

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-2 sm:px-0 pt-4 border-t border-borderSubtle mt-4">
              <div className="text-sm text-textSecondary">
                Ð¡Ñ‚Ñ€Ð°Ð½Ð¸Ñ†Ð° {pagination.currentPage} Ð¾Ñ‚ {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))
                  }
                  disabled={pagination.currentPage === 1}
                  className="px-3 py-2 text-sm border border-borderSubtle rounded-lg hover:bg-mainBg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ÐŸÑ€ÐµÐ´Ð¸ÑˆÐ½Ð°
                </button>
                <button
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))
                  }
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-3 py-2 text-sm border border-borderSubtle rounded-lg hover:bg-mainBg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Ð¡Ð»ÐµÐ´Ð²Ð°Ñ‰Ð°
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Clients;



