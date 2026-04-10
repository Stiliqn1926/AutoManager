import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { ShieldX } from 'lucide-react';

const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mainBg flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <ShieldX className="w-12 h-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-textPrimary mb-4">
          Нямате достъп
        </h1>

        <p className="text-textSecondary mb-6">
          Нямате необходимите права за достъп до тази страница. Моля свържете се с администратора.
        </p>

        <div className="space-y-3">
          <Button onClick={() => navigate(-1)} fullWidth variant="secondary">
            Назад
          </Button>
          <Button onClick={() => navigate('/')} fullWidth>
            Към началната страница
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

