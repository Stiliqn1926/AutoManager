import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronUp,
  ChevronDown,
  Info,
  UserCheck,
  UserX,
  Trash2,
} from 'lucide-react';
import MainLayout from '../../components/layout/MainLayout';
import ReassignWorkerModal from '../../components/admin/ReassignWorkerModal';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { POLLING_INTERVALS } from '../../config/polling';

interface Worker {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string | null;
  skills: string | null;
  isActive: boolean;
  user: {
    email: string;
  };

  membershipStatus: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  isCurrentlyActive: boolean;
  leftAt: string | null;
  joinedAt: string;
}

interface ActiveTasksData {
  hasActiveTasks: boolean;
  activeOrdersCount: number;
  activeSchedulesCount: number;
  activeOrders: Array<{
    id: string;
    orderNumber: string;
    status: string;
    description: string | null;
  }>;
  activeSchedules: Array<{
    id: string;
    startTime: string;
    endTime: string;
    description: string | null;
  }>;
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
    useState<'all' | 'active' | 'inactive' | 'pending' | 'left'>('all');
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);
  const [workerToDelete, setWorkerToDelete] = useState<{
    id: string;
    name: string;
    tasksData: ActiveTasksData;
  } | null>(null);

  const navigate = useNavigate();

  const fetchWorkers = useCallback(async (options?: { silent?: boolean }) => {
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
      const response = await api.get('/workers', {
        signal: controller.signal,
        params: {
          page: pagination.currentPage,
          limit: 20,
        },
      });

      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      setWorkers(response.data.workers || []);
      setPagination({
        currentPage: response.data.pagination?.currentPage || 1,
        totalPages: response.data.pagination?.totalPages || 1,
        totalItems: response.data.pagination?.totalItems || 0,
      });
    } catch (error: unknown) {
      if (
        axios.isCancel(error) ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        return;
      }

      if (!silent) {
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð·Ð°Ñ€ÐµÐ¶Ð´Ð°Ð½Ðµ Ð½Ð° Ð¼ÐµÑ…Ð°Ð½Ð¸Ñ†Ð¸');
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
    void fetchWorkers();

    const refreshSilently = () => {
      if (document.visibilityState === 'visible') {
        void fetchWorkers({ silent: true });
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchWorkers({ silent: true });
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
  }, [fetchWorkers]);


  const handleToggleActive = async (id: string, name: string, isActive: boolean) => {
    const action = isActive ? 'Ð´ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ñ‚Ðµ' : 'Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ñ‚Ðµ';
    if (!window.confirm(`Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° ${action} ${name}?`)) return;

    try {
      await api.put(`/workers/${id}/toggle-active`);
      toast.success(`Ð Ð°Ð±Ð¾Ñ‚Ð½Ð¸ÐºÑŠÑ‚ Ðµ ${isActive ? 'Ð´ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½' : 'Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½'}`);
      void fetchWorkers({ silent: true });
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¿Ñ€Ð¾Ð¼ÑÐ½Ð° Ð½Ð° ÑÑ‚Ð°Ñ‚ÑƒÑ');
    }
  };


  const handleDeleteFromService = async (id: string, name: string) => {
    if (!window.confirm(`Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ ${name} Ð¾Ñ‚ ÑÐ¿Ð¸ÑÑŠÐºÐ°?\n\nÐœÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚ Ñ‰Ðµ Ð±ÑŠÐ´Ðµ Ð¿Ñ€ÐµÐ¼Ð°Ñ…Ð½Ð°Ñ‚ Ð¾Ñ‚ ÑÐ¿Ð¸ÑÑŠÐºÐ° Ñ Ñ€Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ñ†Ð¸, Ð½Ð¾ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»ÑŠÑ‚ Ð¼Ñƒ Ñ‰Ðµ Ð¾ÑÑ‚Ð°Ð½Ðµ Ð² ÑÐ¸ÑÑ‚ÐµÐ¼Ð°Ñ‚Ð°.`)) return;

    try {
      await api.delete(`/workers/${id}`);
      toast.success('Ð Ð°Ð±Ð¾Ñ‚Ð½Ð¸ÐºÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚ Ð¾Ñ‚ ÑÐ¿Ð¸ÑÑŠÐºÐ°');
      void fetchWorkers({ silent: true });
    } catch (error) {
      const apiData = (error as { response?: { data?: ActiveTasksData } }).response?.data;

      if (apiData?.hasActiveTasks) {

        setWorkerToDelete({
          id,
          name,
          tasksData: apiData,
        });
        setShowReassignModal(true);
      } else {
        toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ');
      }
    }
  };


  const handlePermanentDelete = async (id: string, name: string) => {
    if (!window.confirm(`Ð¡Ð¸Ð³ÑƒÑ€Ð½Ð¸ Ð»Ð¸ ÑÑ‚Ðµ, Ñ‡Ðµ Ð¸ÑÐºÐ°Ñ‚Ðµ Ð´Ð° Ð¸Ð·Ñ‚Ñ€Ð¸ÐµÑ‚Ðµ ÐÐÐŸÐªÐ›ÐÐž ${name} Ð¾Ñ‚ Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ð°Ñ‚Ð°?\n\nÐœÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚ Ñ‰Ðµ Ð±ÑŠÐ´Ðµ Ð¿Ñ€ÐµÐ¼Ð°Ñ…Ð½Ð°Ñ‚ Ð½Ð°Ð¿ÑŠÐ»Ð½Ð¾ Ð¾Ñ‚ ÑÐ¿Ð¸ÑÑŠÐºÐ° Ð¸ Ð½ÑÐ¼Ð° Ð´Ð° ÑÐµ Ð¿Ð¾ÐºÐ°Ð·Ð²Ð° Ð´Ð¾Ñ€Ð¸ ÐºÐ°Ñ‚Ð¾ "ÐÐ°Ð¿ÑƒÑÐ½Ð°Ð»".`)) return;

    try {
      await api.delete(`/workers/${id}/permanent`);
      toast.success('ÐœÐµÑ…Ð°Ð½Ð¸ÐºÑŠÑ‚ Ðµ Ð¸Ð·Ñ‚Ñ€Ð¸Ñ‚ Ð½Ð°Ð¿ÑŠÐ»Ð½Ð¾ Ð¾Ñ‚ Ñ‚Ð°Ð±Ð»Ð¸Ñ†Ð°Ñ‚Ð°');
      void fetchWorkers({ silent: true });
    } catch {
      toast.error('Ð“Ñ€ÐµÑˆÐºÐ° Ð¿Ñ€Ð¸ Ð¸Ð·Ñ‚Ñ€Ð¸Ð²Ð°Ð½Ðµ');
    }
  };

  const handleReassignSuccess = () => {
    setShowReassignModal(false);
    setWorkerToDelete(null);
    void fetchWorkers({ silent: true });
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
      const searchLower = searchTerm.toLowerCase().trim();
      const tokens = searchLower.split(/\s+/).filter(Boolean);
      const matchesSearch = tokens.length === 0
        ? true
        : tokens.every((token) =>
          [
            worker.firstName,
            worker.lastName,
            worker.phone,
          ].some((value) => value.toLowerCase().startsWith(token))
        );

      const matchesSpecialization =
        !filterSpecialization ||
        (worker.specialization &&
          worker.specialization
            .toLowerCase()
            .startsWith(filterSpecialization.toLowerCase()));

      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'active' && worker.membershipStatus === 'ACTIVE' && worker.isActive) ||
        (filterStatus === 'inactive' && worker.membershipStatus === 'ACTIVE' && !worker.isActive) ||
        (filterStatus === 'pending' && worker.membershipStatus === 'PENDING') ||
        (filterStatus === 'left' && worker.membershipStatus === 'INACTIVE' && worker.leftAt);

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
      <div className="space-y-4 sm:space-y-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-textPrimary">Ð Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ñ†Ð¸</h1>

        <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 mb-6">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textMuted" />
              <input
                type="text"
                placeholder="Ð¢ÑŠÑ€ÑÐ¸ Ð¿Ð¾ Ð¸Ð¼Ðµ Ð¸Ð»Ð¸ Ñ‚ÐµÐ»ÐµÑ„Ð¾Ð½"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <input
              type="text"
              placeholder="Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ"
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            />

            <select
              aria-label="Ð¤Ð¸Ð»Ñ‚Ñ€Ð¸Ñ€Ð°Ñ˜ Ð¿Ð¾ ÑÑ‚Ð°Ñ‚ÑƒÑ"
              value={filterStatus}
              onChange={(e) =>
                setFilterStatus(e.target.value as 'all' | 'active' | 'inactive' | 'pending' | 'left')
              }
              className="w-full sm:w-auto px-3 py-2 text-sm border border-borderSubtle rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Ð’ÑÐ¸Ñ‡ÐºÐ¸ ÑÑ‚Ð°Ñ‚ÑƒÑÐ¸</option>
              <option value="active">ÐÐºÑ‚Ð¸Ð²Ð½Ð¸</option>
              <option value="inactive">ÐÐµÐ°ÐºÑ‚Ð¸Ð²Ð½Ð¸</option>
              <option value="pending">Ð˜Ð·Ñ‡Ð°ÐºÐ²Ð°Ñ‰Ð¸ Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ</option>
              <option value="left">ÐÐ°Ð¿ÑƒÑÐ½Ð°Ð»Ð¸</option>
            </select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-borderSubtle">
                  {[
                    { key: 'name', label: 'Ð˜Ð¼Ðµ' },
                    { key: 'phone', label: 'Ð¢ÐµÐ»ÐµÑ„Ð¾Ð½' },
                    { key: 'email', label: 'Email' },
                    { key: 'specialization', label: 'Ð¡Ð¿ÐµÑ†Ð¸Ð°Ð»Ð¸Ð·Ð°Ñ†Ð¸Ñ' },
                    { key: 'status', label: 'Ð¡Ñ‚Ð°Ñ‚ÑƒÑ' },
                  ].map(({ key, label }) => (
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
                  <th className="text-right py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold">
                    Ð”ÐµÐ¹ÑÑ‚Ð²Ð¸Ñ
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredWorkers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-textSecondary">
                      ÐÑÐ¼Ð° Ð½Ð°Ð¼ÐµÑ€ÐµÐ½Ð¸ Ñ€Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ñ†Ð¸
                    </td>
                  </tr>
                ) : (
                  filteredWorkers.map((worker) => {
                    const isLeft = worker.membershipStatus === 'INACTIVE' && worker.leftAt;
                    const isPending = worker.membershipStatus === 'PENDING';
                    const isClickable = !isLeft && !isPending;

                    return (
                    <tr
                      key={worker.id}
                      className={`border-b ${isClickable ? 'hover:bg-mainBg cursor-pointer' : ''} ${isLeft ? 'opacity-60' : ''}`}
                      onClick={isClickable ? () => navigate(`/admin/workers/${worker.id}`) : undefined}
                    >
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base font-medium">
                        {worker.firstName} {worker.lastName}
                      </td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{worker.phone}</td>
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">{worker.user.email}</td>

                      
                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">
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

                      <td className="px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base">
                        {worker.membershipStatus === 'PENDING' ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Ð˜Ð·Ñ‡Ð°ÐºÐ²Ð° Ð¾Ð´Ð¾Ð±Ñ€ÐµÐ½Ð¸Ðµ
                          </span>
                        ) : worker.membershipStatus === 'INACTIVE' && worker.leftAt ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            ÐÐ°Ð¿ÑƒÑÐ½Ð°Ð»
                          </span>
                        ) : worker.isActive ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ÐÐºÑ‚Ð¸Ð²ÐµÐ½
                          </span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            ÐÐµÐ°ÐºÑ‚Ð¸Ð²ÐµÐ½
                          </span>
                        )}
                      </td>

                      <td
                        className="px-3 sm:px-4 py-3 sm:py-4 text-right text-sm sm:text-base"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-end gap-2">
                          
                          {worker.membershipStatus === 'INACTIVE' && worker.leftAt ? (
                            <button
                              type="button"
                              aria-label="Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ Ð½Ð°Ð¿ÑŠÐ»Ð½Ð¾"
                              onClick={() =>
                                handlePermanentDelete(
                                  worker.id,
                                  `${worker.firstName} ${worker.lastName}`
                                )
                              }
                              className="p-2 rounded-lg hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          ) : worker.membershipStatus === 'PENDING' ? (

                            <button
                              type="button"
                              aria-label="Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ Ñ€Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ðº"
                              onClick={() =>
                                handleDeleteFromService(
                                  worker.id,
                                  `${worker.firstName} ${worker.lastName}`
                                )
                              }
                              className="p-2 rounded-lg hover:bg-gray-100"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          ) : (

                            <>
                              
                              <button
                                type="button"
                                aria-label={worker.isActive ? "Ð”ÐµÐ°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹ Ñ€Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ðº" : "ÐÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð¹ Ñ€Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ðº"}
                                onClick={() =>
                                  handleToggleActive(
                                    worker.id,
                                    `${worker.firstName} ${worker.lastName}`,
                                    worker.isActive
                                  )
                                }
                                className="p-2 rounded-lg hover:bg-gray-100"
                              >
                                {worker.isActive ? (
                                  <UserX className="w-4 h-4 text-orange-600" />
                                ) : (
                                  <UserCheck className="w-4 h-4 text-green-600" />
                                )}
                              </button>

                              
                              <button
                                type="button"
                                aria-label="Ð˜Ð·Ñ‚Ñ€Ð¸Ð¹ Ñ€Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ðº"
                                onClick={() =>
                                  handleDeleteFromService(
                                    worker.id,
                                    `${worker.firstName} ${worker.lastName}`
                                  )
                                }
                                className="p-2 rounded-lg hover:bg-gray-100"
                              >
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </button>
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

      {/* Reassign Worker Modal */}
      {showReassignModal && workerToDelete && (
        <ReassignWorkerModal
          isOpen={showReassignModal}
          onClose={() => {
            setShowReassignModal(false);
            setWorkerToDelete(null);
          }}
          onSuccess={handleReassignSuccess}
          workerId={workerToDelete.id}
          workerName={workerToDelete.name}
          tasksData={workerToDelete.tasksData}
        />
      )}
    </MainLayout>
  );
};

export default Workers;


