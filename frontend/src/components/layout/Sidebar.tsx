import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  Home,
  Users,
  Car,
  ClipboardList,
  Calendar,
  Truck,
  DollarSign,
  Settings,
  User,
  Mail,
} from 'lucide-react';
import { UserRole } from '../../types';

const Sidebar = () => {
  const { user } = useAuth();

  // Меню според роля
  const getMenuItems = () => {
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
          { path: '/mechanic/clients', icon: Users, label: 'Клиенти' },
          { path: '/mechanic/vehicles', icon: Car, label: 'Автомобили' },
          { path: '/mechanic/orders', icon: ClipboardList, label: 'Поръчки' },
          { path: '/mechanic/schedule', icon: Calendar, label: 'График' },
          { path: '/mechanic/profile', icon: User, label: 'Профил' },
        ];

      case UserRole.CLIENT:
        return [
          { path: '/client/dashboard', icon: Home, label: 'Начало' },
          { path: '/client/vehicles', icon: Car, label: 'Моите автомобили' },
          { path: '/client/orders', icon: ClipboardList, label: 'Активни поръчки' },
          { path: '/client/messages', icon: Mail, label: 'Поща' },
          { path: '/client/profile', icon: User, label: 'Профил' },
        ];

      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  return (
    <div className="w-64 bg-sidebar h-full flex flex-col">
      {/* Logo Section */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white">
          Auto<span className="text-primary">Manager</span>
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative ${
                isActive
                  ? 'bg-gray-800 text-white font-semibold'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {/* Active indicator - оранжева линия отляво */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r" />
                )}

                <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : ''}`} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;
