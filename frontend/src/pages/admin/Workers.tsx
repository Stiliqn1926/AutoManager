import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Edit,
  Trash2,
  ChevronUp,
  ChevronDown,
  Info,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string | null;
  skills: string | null; // ✅ ДОБАВЕНО
  isActive: boolean;
  user: {
    email: string;
  };
}

type SortField = 'name' | 'phone' | 'email' | 'specialization' | 'status';
type SortOrder = 'asc' | 'desc';

const Workers = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [filterStatus, setFilterStatus] =
    useState<'all' | 'active' | 'inactive'>('all');

  const navigate = useNavigate();

  const fetchWorkers = async () => {
    try {
      const response = await api.get('/workers');
      setWorkers(response.data.workers || []);
    } catch {
      toast.error('Грешка при зареждане на работници');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Сигурни ли сте, че искате да изтриете ${name}?`)) return;

    try {
      await api.delete(`/workers/${id}`);
      toast.success('Работникът е изтрит');
      fetchWorkers();
    } catch {
      toast.error('Грешка при изтриване');
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

  const filteredWorkers = (() => {
    const filtered = workers.filter((worker) => {
      const matchesSearch = `${worker.firstName} ${worker.lastName} ${worker.phone}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

      const matchesSpecialization =
        !filterSpecialization ||
        (worker.specialization &&
          worker.specialization
            .toLowerCase()
            .includes(filterSpecialization.toLowerCase()));

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && worker.isActive) ||
        (filterStatus === 'inactive' && !worker.isActive);

      return matchesSearch && matchesSpecialization && matchesStatus;
    });

    filtered.sort((a, b) => {
      let aValue: string | boolean = '';
      let bValue: string | boolean = '';

      switch (sortField) {
        case 'name':
          aValue = `${a.firstName} ${a.lastName}`;
          bValue = `${b.firstName} ${b.lastName}`;
          break;
        case 'phone':
          aValue = a.phone;
          bValue = b.phone;
          break;
        case 'email':
          aValue = a.user.email;
          bValue = b.user.email;
          break;
        case 'specialization':
          aValue = a.specialization || '';
          bValue = b.specialization || '';
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
        <h1 className="text-3xl font-bold text-textPrimary">Работници</h1>

        <div className="bg-cardBg rounded-2xl shadow-card p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                placeholder="Търси по име или телефон"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <input
              type="text"
              placeholder="Специализация"
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <select
              aria-label="Филтрирај по статус"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'all' | 'active' | 'inactive')
              }
              className="px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Всички статуси</option>
              <option value="active">Активни</option>
              <option value="inactive">Неактивни</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-borderSubtle">
                  {[
                    { key: 'name', label: 'Име' },
                    { key: 'phone', label: 'Телефон' },
                    { key: 'email', label: 'Email' },
                    { key: 'specialization', label: 'Специализация' },
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
                {filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    className="border-b hover:bg-mainBg cursor-pointer"
                    onClick={() => navigate(`/admin/workers/${worker.id}`)}
                  >
                    <td className="px-4 py-4 font-medium">
                      {worker.firstName} {worker.lastName}
                    </td>
                    <td className="px-4 py-4">{worker.phone}</td>
                    <td className="px-4 py-4">{worker.user.email}</td>

                    {/* ✅ Специализация + skills tooltip */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span>{worker.specialization || '-'}</span>
                        {worker.skills && (
                          <span
                            title={worker.skills}
                            className="text-textMuted"
                          >
                            <Info className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          worker.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {worker.isActive ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>

                    <td
                      className="px-4 py-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          aria-label="Редактирај работник"
                          onClick={() =>
                            navigate(`/admin/workers/${worker.id}/edit`)
                          }
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Edit className="w-4 h-4 text-primary" />
                        </button>

                        <button
                          type="button"
                          aria-label="Избриши работник"
                          onClick={() =>
                            handleDelete(
                              worker.id,
                              `${worker.firstName} ${worker.lastName}`
                            )
                          }
                          className="p-2 rounded-lg hover:bg-gray-100"
                        >
                          <Trash2 className="w-4 h-4 text-error" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Workers;
