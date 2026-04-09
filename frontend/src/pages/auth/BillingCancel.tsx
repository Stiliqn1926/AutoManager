import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Button } from '../../components/common/Button';
import {
  createAdminRegistrationCheckoutSession,
  createCheckoutSession,
} from '../../services/billingService';

const BillingCancel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flow = searchParams.get('flow');
  const email = searchParams.get('email') || '';
  const isAdminRegisterFlow = flow === 'admin-register' && Boolean(email);

  const handleRetry = async () => {
    setIsLoading(true);
    try {
      const checkoutData = isAdminRegisterFlow
        ? await createAdminRegistrationCheckoutSession(email)
        : await createCheckoutSession();
      window.location.href = checkoutData.checkoutUrl;
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'ÐÐµÑƒÑÐ¿ÐµÑˆÐ½Ð¾ ÑÑ‚Ð°Ñ€Ñ‚Ð¸Ñ€Ð°Ð½Ðµ Ð½Ð° Ð¿Ð»Ð°Ñ‰Ð°Ð½ÐµÑ‚Ð¾');
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
          ÐŸÐ»Ð°Ñ‰Ð°Ð½ÐµÑ‚Ð¾ Ðµ Ð¿Ñ€ÐµÐºÑŠÑÐ½Ð°Ñ‚Ð¾
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          ÐÑÐ¼Ð° Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½Ð¾ Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ. ÐœÐ¾Ð¶Ðµ Ð´Ð° Ð¾Ð¿Ð¸Ñ‚Ð°Ñ‚Ðµ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾ Ð¿Ð¾ Ð²ÑÑÐºÐ¾ Ð²Ñ€ÐµÐ¼Ðµ.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              ÐŸÐ»Ð°Ñ‰Ð°Ð½ÐµÑ‚Ð¾ Ð½Ðµ Ðµ Ð·Ð°Ð²ÑŠÑ€ÑˆÐµÐ½Ð¾
            </h2>
            <p className="text-textSecondary">
              ÐœÐ¾Ð¶Ðµ Ð´Ð° ÑÑ‚Ð°Ñ€Ñ‚Ð¸Ñ€Ð°Ñ‚Ðµ Ð¿Ð»Ð°Ñ‰Ð°Ð½ÐµÑ‚Ð¾ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾, ÐºÐ¾Ð³Ð°Ñ‚Ð¾ ÑÑ‚Ðµ Ð³Ð¾Ñ‚Ð¾Ð²Ð¸.
            </p>
          </div>

          <div className="space-y-3">
            <Button fullWidth isLoading={isLoading} onClick={handleRetry}>
              ÐžÐ¿Ð¸Ñ‚Ð°Ð¹ Ð¿Ð»Ð°Ñ‰Ð°Ð½Ðµ Ð¾Ñ‚Ð½Ð¾Ð²Ð¾
            </Button>
            <Button
              fullWidth
              variant="outline"
              onClick={() =>
                navigate(isAdminRegisterFlow ? '/register-admin' : '/login?role=admin')
              }
            >
              {isAdminRegisterFlow ? 'ÐšÑŠÐ¼ Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸Ñ' : 'ÐšÑŠÐ¼ Ð²Ñ…Ð¾Ð´ Ð·Ð° Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingCancel;

