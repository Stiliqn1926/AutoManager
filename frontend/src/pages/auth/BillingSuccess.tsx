import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';

const BillingSuccess = () => {
  const navigate = useNavigate();

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
          Абонаментът е активиран успешно. Може да продължите към системата.
        </p>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-8">
        <div className="max-w-md w-full bg-cardBg rounded-2xl shadow-card p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-textPrimary mb-2">
              Абонаментът е активен
            </h2>
            <p className="text-textSecondary">
              Благодарим ви! Вече може да използвате AutoManager.
            </p>
          </div>

          <div className="space-y-3">
            <Button fullWidth onClick={() => navigate('/')}>
              Продължи към системата
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
