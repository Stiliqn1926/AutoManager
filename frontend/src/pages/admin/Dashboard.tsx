import { useState, useEffect } from 'react';
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

  // ✅ САМО ЕДНА заявка, САМО веднъж
  useEffect(() => {
    fetchDashboard();
  }, []); // НИКОГА без [] - това предотвратява infinite loop

  const fetchDashboard = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/dashboard/overview');
      setDashboardData(response.data);
    } catch {
      toast.error('Грешка при зареждане на dashboard');
    } finally {
      setIsLoading(false);
    }
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

  if (!dashboardData) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-textSecondary mb-4">Грешка при зареждане на данни</p>
          <button
            onClick={fetchDashboard}
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
      <div className="space-y-8">
        {/* Onboarding / Setup */}
        <SetupWizard />

        {/* KPI Statistics - подаваме данни като prop */}
        <StatsDashboard stats={dashboardData.stats} />

        {/* Main work area */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Calendar – primary focus */}
          <div className="xl:col-span-2 h-full">
            <OrdersCalendar />
          </div>

          {/* Recent Orders – secondary focus */}
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
