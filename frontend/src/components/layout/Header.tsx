import { useAuth } from '../../hooks/useAuth';
import { useServiceCompany } from '../../hooks/useServiceCompany';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, ChevronDown, Bell, Menu, Moon, Sun } from 'lucide-react';
import { UserRole } from '../../types';
import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  onOpenSidebar?: () => void;
}

const Header = ({ onOpenSidebar }: HeaderProps) => {
  const { user, logout } = useAuth();
  const { 
    serviceCompanies, 
    selectedServiceCompany, 
    setSelectedServiceCompany, 
    isLoading: isLoadingCompanies 
  } = useServiceCompany();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const { theme, toggleTheme } = useTheme();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const fetchPendingCount = async (signal?: AbortSignal) => {
      try {
        const response = await api.get('/pending-requests', { signal });
        setPendingCount(response.data.requests?.length || 0);
      } catch (error: unknown) {
        // Ignore abort errors (component unmounted)
        if (error instanceof Error && error.name === 'AbortError') {
          return;
        }
        setPendingCount(0);
      }
    };

    if (user?.role === UserRole.ADMIN) {
      fetchPendingCount(controller.signal);

      const interval = setInterval(() => fetchPendingCount(controller.signal), 120000);
      return () => {
        clearInterval(interval);
        controller.abort();
      };
    }

    return () => {
      controller.abort();
    };
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();

    const fetchUnreadNotifications = async (signal?: AbortSignal) => {
      if (user?.role === UserRole.CLIENT) {
        try {
          const response = await api.get('/client/notifications', { signal });
          setUnreadNotifications(response.data.unreadCount || 0);
        } catch (error: unknown) {
          if (error instanceof Error && error.name === 'AbortError') {
            return;
          }
          setUnreadNotifications(0);
        }
      }
    };

    if (user?.role === UserRole.CLIENT) {
      fetchUnreadNotifications(controller.signal);
      const interval = setInterval(() => fetchUnreadNotifications(controller.signal), 120000);
      return () => {
        clearInterval(interval);
        controller.abort();
      };
    }

    return () => {
      controller.abort();
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleServiceCompanyChange = (companyId: string) => {
    setSelectedServiceCompany(companyId);
    setIsDropdownOpen(false);
  };

  const getRoleBadge = () => {
    switch (user?.role) {
      case UserRole.ADMIN:
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full border border-primary text-primary bg-primary/10">
            Администратор
          </span>
        );
      case UserRole.MECHANIC:
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full border border-success text-success bg-success/10">
            Механик
          </span>
        );
      case UserRole.CLIENT:
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full border border-gray-400 text-gray-600 bg-gray-100">
            Клиент
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between p-4 sm:p-6">
        
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
            aria-label="Отвори меню"
          >
            <Menu className="w-5 h-5" />
          </button>
          {user?.role === UserRole.CLIENT && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                disabled={isLoadingCompanies || serviceCompanies.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingCompanies ? (
                  <span className="text-sm text-gray-600">Зареждане...</span>
                ) : selectedServiceCompany ? (
                  <>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedServiceCompany.name}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </>
                ) : (
                  <span className="text-sm text-gray-600">Няма сервизи</span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && serviceCompanies.length > 0 && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="p-2">
                    <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase">
                      Изберете сервиз
                    </div>
                    {serviceCompanies.map(({ serviceCompany }) => (
                      <button
                        key={serviceCompany.id}
                        onClick={() => handleServiceCompanyChange(serviceCompany.id)}
                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                          selectedServiceCompany?.id === serviceCompany.id
                            ? 'bg-primary/10 border border-primary'
                            : ''
                        }`}
                      >
                        <div className="font-medium text-sm text-gray-900">
                          {serviceCompany.name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {serviceCompany.address || 'Няма адрес'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {serviceCompany.phone}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-textPrimary">{user?.email}</p>
            </div>
            {getRoleBadge()}
          </div>

          {user?.role === UserRole.CLIENT && (
            <button
              onClick={() => navigate('/client/notifications')}
              className="relative p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
              title="Известия"
            >
              <Bell className="w-5 h-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
          )}

          
          {user?.role === UserRole.ADMIN && (
            <button
              onClick={() => navigate('/admin/settings')}
              className="relative p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
              title="Настройки"
            >
              <Settings className="w-5 h-5" />
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          )}

          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
            title={theme === 'dark' ? 'Светла тема' : 'Тъмна тема'}
            aria-label={theme === 'dark' ? 'Светла тема' : 'Тъмна тема'}
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-gray-600 hover:text-primary hover:bg-gray-100 transition-colors"
            title="Изход"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;

