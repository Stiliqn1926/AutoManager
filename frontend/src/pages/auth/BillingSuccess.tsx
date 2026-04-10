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
          Плащането е успешно
        </h2>
        <p className="text-xl text-gray-300 leading-relaxed">
          {isAdminRegisterFlow
            ? 'Получихме плащането. Финализираме регистрацията на вашия сервиз.'
            : 'Абонаментът е активиран успешно. Може да продължите към системата.'}
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              {isAdminRegisterFlow ? 'Плащането е прието' : 'Абонаментът е активен'}
            </h2>
            <p className="text-textSecondary">
              {isAdminRegisterFlow
                ? 'Ще можете да влезете веднага след като създадем профила.'
                : 'Благодарим ви! Вече може да използвате AutoManager.'}
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
                  ? 'Към вход за администратор'
                  : isChecking
                    ? 'Създаваме профила...'
                    : 'Опитай вход'
                : 'Продължи към системата'}
            </Button>
            <Button fullWidth variant="outline" onClick={() => navigate('/')}>
              Към начална страница
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BillingSuccess;

