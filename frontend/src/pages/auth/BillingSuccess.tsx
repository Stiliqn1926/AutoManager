import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { getAdminRegistrationStatus } from '../../services/billingService';

const BillingSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const flow = searchParams.get('flow');
  const email = searchParams.get('email') || '';
  const isAdminRegisterFlow = flow === 'admin-register' && Boolean(email);

  const [isChecking, setIsChecking] = useState(isAdminRegisterFlow);
  const [isReady, setIsReady] = useState(!isAdminRegisterFlow);

  useEffect(() => {
    if (!isAdminRegisterFlow) return;

    let isCancelled = false;
    const startedAt = Date.now();

    const pollStatus = async () => {
      try {
        const status = await getAdminRegistrationStatus(email);
        if (status.isCompleted) {
          if (!isCancelled) {
            setIsReady(true);
            setIsChecking(false);
          }
          return;
        }
      } catch {
        // Silent retry while webhook finalizes registration.
      }

      const isTimedOut = Date.now() - startedAt > 60_000;
      if (isTimedOut) {
        if (!isCancelled) {
          setIsChecking(false);
        }
        return;
      }

      if (!isCancelled) {
        window.setTimeout(() => {
          void pollStatus();
        }, 3000);
      }
    };

    void pollStatus();

    return () => {
      isCancelled = true;
    };
  }, [email, isAdminRegisterFlow]);

  return (
    <div className="min-h-screen bg-mainBg flex">
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar text-white p-12 flex-col justify-center shadow-sidebar">
        <h1 className="text-5xl font-bold mb-6">
          Auto<span className="text-primary">Manager</span>
        </h1>
        <h2 className="text-2xl sm:text-3xl font-semibold mb-4">
          ÐŸÐ»Ð°Ñ‰Ð°Ð½ÐµÑ‚Ð¾ Ðµ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          {isAdminRegisterFlow
            ? 'ÐŸÐ¾Ð»ÑƒÑ‡Ð¸Ñ…Ð¼Ðµ Ð¿Ð»Ð°Ñ‰Ð°Ð½ÐµÑ‚Ð¾. Ð¤Ð¸Ð½Ð°Ð»Ð¸Ð·Ð¸Ñ€Ð°Ð¼Ðµ Ñ€ÐµÐ³Ð¸ÑÑ‚Ñ€Ð°Ñ†Ð¸ÑÑ‚Ð° Ð½Ð° Ð²Ð°ÑˆÐ¸Ñ ÑÐµÑ€Ð²Ð¸Ð·.'
            : 'ÐÐ±Ð¾Ð½Ð°Ð¼ÐµÐ½Ñ‚ÑŠÑ‚ Ðµ Ð°ÐºÑ‚Ð¸Ð²Ð¸Ñ€Ð°Ð½ ÑƒÑÐ¿ÐµÑˆÐ½Ð¾. ÐœÐ¾Ð¶Ðµ Ð´Ð° Ð¿Ñ€Ð¾Ð´ÑŠÐ»Ð¶Ð¸Ñ‚Ðµ ÐºÑŠÐ¼ ÑÐ¸ÑÑ‚ÐµÐ¼Ð°Ñ‚Ð°.'}
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              {isAdminRegisterFlow ? 'ÐŸÐ»Ð°Ñ‰Ð°Ð½ÐµÑ‚Ð¾ Ðµ Ð¿Ñ€Ð¸ÐµÑ‚Ð¾' : 'ÐÐ±Ð¾Ð½Ð°Ð¼ÐµÐ½Ñ‚ÑŠÑ‚ Ðµ Ð°ÐºÑ‚Ð¸Ð²ÐµÐ½'}
            </h2>
            <p className="text-textSecondary">
              {isAdminRegisterFlow
                ? 'Ð©Ðµ Ð¼Ð¾Ð¶ÐµÑ‚Ðµ Ð´Ð° Ð²Ð»ÐµÐ·ÐµÑ‚Ðµ Ð²ÐµÐ´Ð½Ð°Ð³Ð° ÑÐ»ÐµÐ´ ÐºÐ°Ñ‚Ð¾ ÑÑŠÐ·Ð´Ð°Ð´ÐµÐ¼ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ð°.'
                : 'Ð‘Ð»Ð°Ð³Ð¾Ð´Ð°Ñ€Ð¸Ð¼ Ð²Ð¸! Ð’ÐµÑ‡Ðµ Ð¼Ð¾Ð¶Ðµ Ð´Ð° Ð¸Ð·Ð¿Ð¾Ð»Ð·Ð²Ð°Ñ‚Ðµ AutoManager.'}
            </p>
          </div>

          <div className="space-y-3">
            <Button
              fullWidth
              disabled={isAdminRegisterFlow && !isReady}
              onClick={() =>
                navigate(isAdminRegisterFlow ? '/login?role=admin' : '/')
              }
            >
              {isAdminRegisterFlow
                ? isReady
                  ? 'ÐšÑŠÐ¼ Ð²Ñ…Ð¾Ð´ Ð·Ð° Ð°Ð´Ð¼Ð¸Ð½Ð¸ÑÑ‚Ñ€Ð°Ñ‚Ð¾Ñ€'
                  : isChecking
                    ? 'Ð¡ÑŠÐ·Ð´Ð°Ð²Ð°Ð¼Ðµ Ð¿Ñ€Ð¾Ñ„Ð¸Ð»Ð°...'
                    : 'ÐžÐ¿Ð¸Ñ‚Ð°Ð¹ Ð²Ñ…Ð¾Ð´'
                : 'ÐŸÑ€Ð¾Ð´ÑŠÐ»Ð¶Ð¸ ÐºÑŠÐ¼ ÑÐ¸ÑÑ‚ÐµÐ¼Ð°Ñ‚Ð°'}
            </Button>
            <Button fullWidth variant="outline" onClick={() => navigate('/')}>
              ÐšÑŠÐ¼ Ð½Ð°Ñ‡Ð°Ð»Ð½Ð° ÑÑ‚Ñ€Ð°Ð½Ð¸Ñ†Ð°
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccess;

