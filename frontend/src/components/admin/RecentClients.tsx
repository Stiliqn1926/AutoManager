import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserCircle } from 'lucide-react';
import api from '../../services/api';
import toast from 'react-hot-toast';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

const RecentClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await api.get('/clients?limit=5');
        setClients(response.data.clients || []);
      } catch  {
        toast.error('Грешка при зареждане на клиенти');
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-cardBg rounded-2xl shadow-card p-6">
        <h2 className="text-lg font-semibold text-textPrimary mb-4">Последно добавени клиенти</h2>
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-cardBg rounded-2xl shadow-card p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-textPrimary">Последно добавени клиенти</h2>
        <button
          onClick={() => navigate('/admin/clients')}
          className="text-sm text-primary hover:text-primary-700 font-medium"
        >
          Виж всички →
        </button>
      </div>

      {clients.length === 0 ? (
        <p className="text-textSecondary text-center py-8">Няма клиенти</p>
      ) : (
        <div className="space-y-2">
          {clients.map((client) => (
            <div
              key={client.id}
              onClick={() => navigate(`/admin/clients/${client.id}`)}
              className="flex items-center gap-3 p-3 bg-mainBg rounded-xl hover:bg-gray-100 cursor-pointer transition-colors"
            >
              <div className="bg-green-500 p-2 rounded-lg">
                <UserCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-textPrimary text-sm">
                  {client.firstName} {client.lastName}
                </p>
                <p className="text-xs text-textMuted">{client.phone}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentClients;