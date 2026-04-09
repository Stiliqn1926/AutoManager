import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/common/Button';
import { createCheckoutSession } from '../../services/billingService';

const BillingCancel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      const checkoutData = await createCheckoutSession();
      window.location.href = checkoutData.checkoutUrl;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Неуспешно стартиране на плащането');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-mainBg flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
          Плащането е прекъснато
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          Няма активирано плащане. Може да опитате отново по всяко време.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              Плащането не е завършено
            </h2>
            <p className="text-textSecondary">
              Може да стартирате плащането отново, когато сте готови.
            </p>
          </div>

          <div className="space-y-3">
            <Button fullWidth isLoading={isLoading} onClick={handleRetry}>
              Опитай плащане отново
            </Button>
            <Button
              fullWidth
              variant="outline"
              onClick={() => navigate('/login?role=admin')}
            >
              Към вход за администратор
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingCancel;
