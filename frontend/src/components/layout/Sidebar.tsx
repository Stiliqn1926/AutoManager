import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useActiveService } from '../../hooks/useActiveService';
import {
  Home,
  Users,
  Car,
  ClipboardList,
  Bell,
  Calendar,
  Truck,
  DollarSign,
  Settings,
  User,
  Building2,
  Lock,
  FileText,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { UserRole } from '../../types';
import toast from 'react-hot-toast';

interface MenuItem {
  path: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
  requiresService?: boolean;
}

const Sidebar = () => {
  const { user } = useAuth();
  const { hasActiveService } = useActiveService();
  const navigate = useNavigate();

  const getMenuItems = (): MenuItem[] => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return [
          { path: '/admin/dashboard', icon: Home, label: 'Начало' },
          { path: '/admin/workers', icon: Users, label: 'Работници' },
          { path: '/admin/clients', icon: Users, label: 'Клиенти' },
          { path: '/admin/vehicles', icon: Car, label: 'Автомобили' },
          { path: '/admin/orders', icon: ClipboardList, label: 'Поръчки' },
          { path: '/admin/schedules', icon: Calendar, label: 'График' },
          { path: '/admin/suppliers', icon: Truck, label: 'Доставчици' },
          { path: '/admin/finances', icon: DollarSign, label: 'Финанси' },
          { path: '/admin/settings', icon: Settings, label: 'Настройки' },
        ];

      case UserRole.MECHANIC:
        return [
          { path: '/mechanic/dashboard', icon: Home, label: 'Начало' },
          { path: '/mechanic/clients', icon: Users, label: 'Клиенти', requiresService: true },
          { path: '/mechanic/vehicles', icon: Car, label: 'Автомобили', requiresService: true },
          { path: '/mechanic/orders', icon: ClipboardList, label: 'Поръчки', requiresService: true },
          { path: '/mechanic/schedule', icon: Calendar, label: 'График', requiresService: true },
          { path: '/mechanic/service-settings', icon: Building2, label: 'Сервиз' },
          { path: '/mechanic/profile', icon: User, label: 'Профил' },
        ];

      case UserRole.CLIENT:
        return [
          { path: '/client/dashboard', icon: Home, label: 'Начало' },
          { path: '/client/service-companies', icon: Building2, label: 'Моите сервизи' },
          { path: '/client/vehicles', icon: Car, label: 'Моите автомобили' },
          { path: '/client/orders', icon: ClipboardList, label: 'Активни поръчки' },
          { path: '/client/invoices', icon: FileText, label: 'Фактури' },
          { path: '/client/notifications', icon: Bell, label: 'Известия' },
          { path: '/client/profile', icon: User, label: 'Профил' },



        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const handleClick = (item: MenuItem, e: React.MouseEvent) => {
    if (item.requiresService && !hasActiveService) {
      e.preventDefault();
      toast.error('За достъп до този модул, първо избери активен сервиз');
      navigate('/mechanic/service-settings');
    }
  };

  return (
    <div className="w-64 bg-sidebar h-full flex flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">
          Auto<span className="text-primary">Manager</span>
        </h1>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isDisabled = item.requiresService && !hasActiveService;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={(e) => handleClick(item, e)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                  isDisabled
                    ? 'text-gray-500 cursor-not-allowed opacity-50'
                    : isActive
                    ? 'bg-gray-800 text-white font-semibold'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !isDisabled && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                  )}

                  {isDisabled ? (
                    <Lock className="w-5 h-5" />
                  ) : (
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                  )}
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
