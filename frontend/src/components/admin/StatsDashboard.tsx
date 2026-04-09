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
        label="ÐžÐ±Ñ‰Ð¾ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸"
        value={stats.totalOrders}
        subtitle="Ð’ÑÐ¸Ñ‡ÐºÐ¸"
      />

      <StatsCard
        icon={ClipboardList}
        label="ÐÐºÑ‚Ð¸Ð²Ð½Ð¸ Ð¿Ð¾Ñ€ÑŠÑ‡ÐºÐ¸"
        value={stats.activeOrders}
        subtitle="Ð’ Ð¿Ñ€Ð¾Ñ†ÐµÑ"
      />

      <StatsCard
        icon={TrendingUp}
        label="ÐŸÑ€Ð¸Ñ…Ð¾Ð´Ð¸"
        value={`${stats.totalRevenue.toLocaleString()} â‚¬`}
        subtitle="ÐžÐ±Ñ‰Ð¾"
        trend="up"
      />

      <StatsCard
        icon={TrendingDown}
        label="Ð Ð°Ð·Ñ…Ð¾Ð´Ð¸"
        value={`${stats.totalExpenses.toLocaleString()} â‚¬`}
        subtitle="ÐžÐ±Ñ‰Ð¾"
        trend="down"
      />
    </div>
  );
};

export default StatsDashboard;

