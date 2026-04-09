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
          ÐÑÐ¼Ð°Ñ‚Ðµ Ð´Ð¾ÑÑ‚ÑŠÐ¿
        </h1>

        <p className="text-textSecondary mb-6">
          ÐÑÐ¼Ð°Ñ‚Ðµ Ð½ÐµÐ¾Ð±Ñ…Ð¾Ð´Ð¸Ð¼Ð¸Ñ‚Ðµ Ð¿Ñ€Ð°Ð²Ð° Ð·Ð° Ð´Ð¾ÑÑ‚ÑŠÐ¿ Ð´Ð¾ Ñ‚Ð°Ð·Ð¸ ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ð°. ÐœÐ¾Ð»Ñ ÑÐ²ÑŠÑ€Ð¶ÐµÑ‚Ðµ ÑÐµ Ñ Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€Ð°.
        </p>

        <div className="space-y-3">
          <Button onClick={() => navigate(-1)} fullWidth variant="secondary">
            ÐÐ°Ð·Ð°Ð´
          </Button>
          <Button onClick={() => navigate('/')} fullWidth>
            ÐšÑŠÐ¼ Ð½Ð°Ñ‡Ð°Ð»Ð½Ð°Ñ‚Ð° ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ð°
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;

