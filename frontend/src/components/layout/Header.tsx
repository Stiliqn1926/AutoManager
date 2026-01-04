import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { UserRole } from '../../types';
import { useState, useEffect } from 'react';
import api from '../../services/api';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await api.get('/pending-requests');
        setPendingCount(response.data.requests?.length || 0);
      } catch {
        setPendingCount(0);
      }
    };

    if (user?.role === UserRole.ADMIN) {
      fetchPendingCount();
      // ✅ Refresh само на 2 минути (120 000 ms) - не на всеки 30 секунди
      const interval = setInterval(fetchPendingCount, 120000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
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
      <div className="flex items-center justify-between p-6">
        {/* Лява част – умишлено празна */}
        <div />

        {/* Дясна част – User info + Settings + Logout */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-medium text-textPrimary">{user?.email}</p>
            </div>
            {getRoleBadge()}
          </div>

          {/* Settings Button (само за ADMIN) */}
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