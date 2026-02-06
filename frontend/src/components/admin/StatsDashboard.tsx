import StatsCard from './StatsCard';
import { ClipboardList, TrendingDown, TrendingUp } from 'lucide-react';

interface Stats {
  totalOrders: number;
  activeOrders: number;
  totalRevenue: number;
  totalExpenses: number;
  totalClients?: number;
  totalWorkers?: number;
}

interface StatsDashboardProps {
  stats: Stats;
}

const StatsDashboard = ({ stats }: StatsDashboardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      <StatsCard
        icon={ClipboardList}
        label="Общо поръчки"
        value={stats.totalOrders}
        subtitle="Всички"
      />

      <StatsCard
        icon={ClipboardList}
        label="Активни поръчки"
        value={stats.activeOrders}
        subtitle="В процес"
      />

      <StatsCard
        icon={TrendingUp}
        label="Приходи"
        value={`${stats.totalRevenue.toLocaleString()} €`}
        subtitle="Общо"
        trend="up"
      />

      <StatsCard
        icon={TrendingDown}
        label="Разходи"
        value={`${stats.totalExpenses.toLocaleString()} €`}
        subtitle="Общо"
        trend="down"
      />
    </div>
  );
};

export default StatsDashboard;
