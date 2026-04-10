import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import MainLayout from '../../components/layout/MainLayout';
import SetupWizard from '../../components/admin/SetupWizard';
import StatsDashboard from '../../components/admin/StatsDashboard';
import OrdersCalendar from '../../components/admin/OrdersCalendar';
import RecentOrders from '../../components/admin/RecentOrders';
import WorkersList from '../../components/admin/WorkersList';
import RecentClients from '../../components/admin/RecentClients';
import FinanceChart from '../../components/admin/FinanceChart';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { POLLING_INTERVALS } from '../../config/polling';

interface Order {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
  clientName: string;
  status: string;
  createdAt: string;
  amount: number;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  };
  client: {
    firstName: string;
    lastName: string;
  };
}

interface Schedule {
  id: string;
  title: string;
  date: string;
  time: string;
  workerId: string;
}

interface DashboardData {
  stats: {
    totalOrders: number;
    activeOrders: number;
    totalRevenue: number;
    totalExpenses: number;
    totalClients: number;
    totalWorkers: number;
    pendingRequests: number;
  };
  recentOrders: Order[];
  todaySchedules: Schedule[];
}

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const activeRequestRef = useRef<AbortController | null>(null);
  const requestSeqRef = useRef(0);

  const fetchDashboard = useCallback(async (options?: { silent?: boolean }) => {
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
      const response = await api.get('/dashboard/overview', {
        signal: controller.signal,
      });

      if (requestSeq !== requestSeqRef.current) {
        return;
      }

      setDashboardData(response.data);
    } catch (error: unknown) {
      if (
        axios.isCancel(error) ||
        (error instanceof Error && error.name === 'AbortError')
      ) {
        return;
      }

      if (!silent) {
        toast.error('Възникна грешка при зареждане на таблото');
      }
    } finally {
      if (requestSeq === requestSeqRef.current) {
        if (!silent) {
          setIsLoading(false);
        }

        if (activeRequestRef.current === controller) {
          activeRequestRef.current = null;
        }
      }
    }
  }, []);


  useEffect(() => {
    void fetchDashboard();

    const refreshSilently = () => {
      if (document.visibilityState === 'visible') {
        void fetchDashboard({ silent: true });
      }
    };

    const intervalId = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void fetchDashboard({ silent: true });
      }
    }, POLLING_INTERVALS.dashboard);

    window.addEventListener('focus', refreshSilently);
    document.addEventListener('visibilitychange', refreshSilently);

    return () => {
      activeRequestRef.current?.abort();
      window.clearInterval(intervalId);
      window.removeEventListener('focus', refreshSilently);
      document.removeEventListener('visibilitychange', refreshSilently);
    };
  }, [fetchDashboard]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary mb-4">Грешка при зареждане на данни</p>
          <button
            onClick={() => void fetchDashboard()}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-700"
          >
            Опитай отново
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 md:space-y-8">
        {/* Onboarding / Setup */}
        <SetupWizard />

        
        <StatsDashboard stats={dashboardData.stats} />

        {/* Main work area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          
          <div className="xl:col-span-2 h-full">
            <OrdersCalendar />
          </div>

          
          <div className="h-full">
            <RecentOrders
              orders={dashboardData.recentOrders.map((order) => ({
                ...order,
                displayOrderNumber: order.displayOrderNumber ?? null,
              }))}
            />
          </div>
        </div>

        {
        /* Supporting lists */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          <WorkersList />
          <RecentClients />
        </div>

        {/* Analytics */}
        <FinanceChart />
      </div>
    </MainLayout>
  );
};

export default AdminDashboard;

