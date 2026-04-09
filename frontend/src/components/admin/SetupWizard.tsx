import { Users, Car, ClipboardList, DollarSign, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SetupWizard = () => {
  const navigate = useNavigate();

  const shortcuts = [
    { icon: Users, label: 'Ð Ð°Ð±Ð¾Ñ‚Ð½Ð¸Ñ†Ð¸', path: '/admin/workers', color: 'bg-blue-500' },
    { icon: Users, label: 'ÐšÐ»Ð¸ÐµÐ½Ñ‚Ð¸', path: '/admin/clients', color: 'bg-green-500' },
    { icon: Car, label: 'ÐÐ²Ñ‚Ð¾Ð¼Ð¾Ð±Ð¸Ð»Ð¸', path: '/admin/vehicles', color: 'bg-purple-500' },
    { icon: ClipboardList, label: 'ÐŸÐ¾Ñ€ÑŠÑ‡ÐºÐ¸', path: '/admin/orders', color: 'bg-primary' },
    { icon: DollarSign, label: 'Ð¤Ð¸Ð½Ð°Ð½ÑÐ¸', path: '/admin/finances', color: 'bg-yellow-500' },
    { icon: Settings, label: 'ÐÐ°ÑÑ‚Ñ€Ð¾Ð¹ÐºÐ¸', path: '/admin/settings', color: 'bg-gray-500' },
  ];

  return (
    <div className="bg-cardBg rounded-2xl shadow-card p-4 sm:p-6 mb-6">
      <h2 className="text-lg font-semibold text-textPrimary mb-4">Ð‘ÑŠÑ€Ð· Ð”Ð¾ÑÑ‚ÑŠÐ¿</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {shortcuts.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl bg-mainBg hover:bg-gray-100 transition-all hover:shadow-md group"
          >
            <div className={`${item.color} p-2.5 sm:p-3 rounded-lg mb-2 group-hover:scale-110 transition-transform`}>
              <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <span className="text-xs sm:text-sm font-medium text-textPrimary">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SetupWizard;

