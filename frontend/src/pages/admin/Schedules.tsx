import { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Plus, Search, ChevronUp, ChevronDown } from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import { Button } from '../../components/common/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
}

interface Order {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
}

interface Schedule {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  priority: string;
  worker: Worker | null;
  order: Order | null;
  isCompleted: boolean;
}

type SortField = 'date' | 'startTime' | 'priority' | 'status';
type SortOrder = 'asc' | 'desc';

const Schedules = () => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchedules();
  }, []);

  const fetchSchedules = async () => {
    try {
      const response = await api.get('/schedules');
      setSchedules(response.data.schedules || []);
    } catch {
      toast.error('Грешка при зареждане на график');
    } finally {
      setIsLoading(false);
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

  const getStatusBadge = (status: string) => {
    const styles = {
      SCHEDULED: 'bg-blue-100 text-blue-800',
      IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
      READY: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
      CANCELLED: 'bg-red-100 text-red-800',
      DELAYED: 'bg-orange-100 text-orange-800',
    };
    const labels = {
      SCHEDULED: 'Планирана',
      IN_PROGRESS: 'В процес',
      READY: 'Готова за плащане',
      COMPLETED: 'Платена',
      CANCELLED: 'Отменена',
      DELAYED: 'Забавена',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const filteredAndSorted = schedules
    .filter((schedule) => {
      const searchLower = searchTerm.toLowerCase().trim();
      const tokens = searchLower.split(/\s+/).filter(Boolean);
      const matchesSearch = tokens.length === 0
        ? true
        : tokens.every((token) =>
          [
            schedule.title,
            schedule.worker?.firstName || '',
            schedule.worker?.lastName || '',
          ].some((value) => value.toLowerCase().startsWith(token))
        );
      const matchesStatus = !statusFilter || schedule.status === statusFilter;
      const matchesPriority = !priorityFilter || schedule.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    })
    .sort((a, b) => {
      let aValue: string | number = '';
      let bValue: string | number = '';

      if (sortField === 'date') {
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
      } else if (sortField === 'startTime') {
        aValue = new Date(a.startTime).getTime();
        bValue = new Date(b.startTime).getTime();
      } else if (sortField === 'priority') {
        const priorityOrder = { URGENT: 4, HIGH: 3, NORMAL: 2, LOW: 1 };
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder];
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder];
      } else if (sortField === 'status') {
        aValue = a.status;
        bValue = b.status;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    );
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">График</h1>
            <p className="text-textSecondary mt-1">Управление на графика и задачите</p>
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full lg:ml-auto lg:w-auto">
            <Button onClick={() => navigate('/admin/schedules/daily')} className="w-full sm:w-auto">
              <Calendar className="w-4 h-4" />
              Дневен изглед
            </Button>
            <Button onClick={() => navigate('/admin/schedules/weekly')} className="w-full sm:w-auto">
              <Calendar className="w-4 h-4" />
              Седмичен изглед
            </Button>
            <Button onClick={() => navigate('/admin/schedules/monthly')} className="w-full sm:w-auto">
              <Calendar className="w-4 h-4" />
              Месечен изглед
            </Button>
            <Button onClick={() => navigate('/admin/schedules/create')} className="w-full sm:w-auto">
              <Plus className="w-4 h-4" />
              Добави задача
            </Button>
          </div>
        </div>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-6">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textSecondary w-5 h-5" />
                <input
                  type="text"
                  placeholder="Търси по заглавие или механик..."
                  value={searchTerm}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  aria-label="Търсене"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Филтър по статус"
            >
              <option value="">Всички статуси</option>
              <option value="SCHEDULED">Планирана</option>
              <option value="IN_PROGRESS">В процес</option>
              <option value="READY">Готова за плащане</option>
              <option value="COMPLETED">Платена</option>
              <option value="CANCELLED">Отменена</option>
              <option value="DELAYED">Забавена</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setPriorityFilter(e.target.value)}
              className="w-full sm:w-auto px-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              aria-label="Филтър по приоритет"
            >
              <option value="">Всички приоритети</option>
              <option value="LOW">Нисък</option>
              <option value="NORMAL">Нормален</option>
              <option value="HIGH">Висок</option>
              <option value="URGENT">Спешен</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-borderSubtle">
                  <th className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary">Заглавие</th>
                  <th
                    className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary cursor-pointer hover:text-primary"
                    onClick={() => handleSort('date')}
                  >
                    Дата <SortIcon field="date" />
                  </th>
                  <th
                    className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary cursor-pointer hover:text-primary"
                    onClick={() => handleSort('startTime')}
                  >
                    Час <SortIcon field="startTime" />
                  </th>
                  <th className="text-left hidden md:table-cell py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary">Механик</th>
                  <th className="text-left hidden lg:table-cell py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary">Поръчка</th>
                  <th
                    className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary cursor-pointer hover:text-primary"
                    onClick={() => handleSort('priority')}
                  >
                    Приоритет <SortIcon field="priority" />
                  </th>
                  <th
                    className="text-left py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold text-textPrimary cursor-pointer hover:text-primary"
                    onClick={() => handleSort('status')}
                  >
                    Статус <SortIcon field="status" />
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSorted.length > 0 ? (
                  filteredAndSorted.map((schedule) => (
                    <tr
                      key={schedule.id}
                      onClick={() => navigate(`/admin/schedules/${schedule.id}`)}
                      className="border-b border-borderSubtle hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base text-textPrimary font-medium">{schedule.title}</td>
                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">
                        {new Date(schedule.date).toLocaleDateString('bg-BG')}
                      </td>
                      <td className="py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">
                        {new Date(schedule.startTime).toLocaleTimeString('bg-BG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                        {' - '}
                        {new Date(schedule.endTime).toLocaleTimeString('bg-BG', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="hidden md:table-cell py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">
                        {schedule.worker
                          ? `${schedule.worker.firstName} ${schedule.worker.lastName}`
                          : '-'}
                      </td>
                      <td className="hidden lg:table-cell py-3 px-3 sm:px-4 text-sm sm:text-base text-textSecondary">
                        {schedule.order ? schedule.order.displayOrderNumber || schedule.order.orderNumber : '-'}
                      </td>
                      <td className="py-3 px-3 sm:px-4">{getStatusBadge(schedule.status)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-textSecondary">
                      Няма намерени задачи
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Schedules;



