import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Phone, Mail, Calendar, Package } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { getMechanicClients } from '../../services/mechanicService';
import type { MechanicClient } from '../../types/mechanic';
import toast from 'react-hot-toast';

const MechanicClients = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<MechanicClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const fetchClients = useCallback(async (page: number, searchTerm: string) => {
    setIsLoading(true);
    try {
      const data = await getMechanicClients({
        page,
        limit: 20,
        search: searchTerm || undefined,
        activeOnly,
      });
      setClients(data.clients);
      setPagination({
        currentPage: data.pagination.currentPage,
        totalPages: data.pagination.totalPages,
        totalItems: data.pagination.totalItems,
      });
    } catch  {
      toast.error('Грешка при зареждане на клиенти');
    } finally {
      setIsLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => {
    fetchClients(pagination.currentPage, searchQuery);
  }, [fetchClients, pagination.currentPage, searchQuery, activeOnly]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchQuery(search);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Няма';
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
            Общо: <span className="font-semibold text-textPrimary">{pagination.totalItems}</span> клиента
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card p-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Търси по име или телефон..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-borderSubtle rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
            </form>

            {/* Filter: Active Only */}
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeOnly}
                  onChange={(e) => {
                    setActiveOnly(e.target.checked);
                    setPagination((prev) => ({ ...prev, currentPage: 1 }));
                  }}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-textSecondary">Само с активни поръчки</span>
              </label>

              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
              >
                Търси
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-borderSubtle shadow-card">
          {clients.length === 0 ? (
            <div className="text-center py-12 text-textSecondary">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Няма намерени клиенти</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-borderSubtle">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Клиент
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Контакт
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Автомобили
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Активни поръчки
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Последна поръчка
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-textSecondary uppercase tracking-wider">
                      Действие
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderSubtle">
                  {clients.map((client) => (
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
                          {client._count.vehicles}
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

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-borderSubtle">
              <div className="text-sm text-textSecondary">
                Страница {pagination.currentPage} от {pagination.totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                  disabled={pagination.currentPage === 1}
                  className="px-4 py-2 text-sm border border-borderSubtle rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Предишна
                </button>
                <button
                  onClick={() => setPagination((prev) => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                  disabled={pagination.currentPage === pagination.totalPages}
                  className="px-4 py-2 text-sm border border-borderSubtle rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Следваща
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default MechanicClients;