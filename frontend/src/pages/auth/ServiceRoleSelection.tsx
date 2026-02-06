import { useNavigate } from 'react-router-dom';

const ServiceRoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mainBg flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-textPrimary mb-4">
            Auto<span className="text-primary">Manager</span>
          </h1>
          <p className="text-base sm:text-lg text-textSecondary max-w-xl mx-auto">
            Изберете ролята, с която ще влезете в системата на сервиза.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          {/* Admin */}
          <button
            onClick={() => navigate('/login?role=admin')}
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg focus:outline-none"
          >
            <div className="flex items-start">
              <div>
                <h2 className="text-2xl font-semibold text-textPrimary mb-2">
                  Администратор
                </h2>
                <p className="text-textSecondary leading-relaxed">
                  Достъп до управление на сервиза, потребители, ремонти,
                  автомобили и системни настройки.
                </p>

                <span className="inline-block mt-4 text-primary font-medium group-hover:underline">
                  Вход →
                </span>
              </div>
            </div>
          </button>

          {/* Mechanic */}
          <button
            onClick={() => navigate('/login?role=mechanic')}
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg focus:outline-none"
          >
            <div className="flex items-start">
              <div>
                <h2 className="text-2xl font-semibold text-textPrimary mb-2">
                  Механик
                </h2>
                <p className="text-textSecondary leading-relaxed">
                  Достъп до възложени задачи, ремонти, сервизна история
                  и техническа информация.
                </p>

                <span className="inline-block mt-4 text-primary font-medium group-hover:underline">
                  Вход →
                </span>
              </div>
            </div>
          </button>
        </div>

        {/* Back */}
        <div className="text-center mt-14">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-textMuted hover:text-textSecondary hover:underline transition-colors"
          >
            ← Назад
          </button>
        </div>
      </div>
    </div>
  );
};

export default ServiceRoleSelection;

