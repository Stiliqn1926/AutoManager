import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mainBg flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-textPrimary mb-4">
            Auto<span className="text-primary">Manager</span>
          </h1>
          <p className="text-base sm:text-lg text-textSecondary max-w-2xl mx-auto">
            Професионална система за управление на автосервизи, клиенти и сервизни процеси.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
          {/* Service */}
          <button
            onClick={() => navigate('/auth/service-role')}
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg focus:outline-none"
          >
            <div className="flex items-start gap-5">
              <div>
                <h2 className="text-2xl font-semibold text-textPrimary mb-2">
                  Вход за Сервиз
                </h2>
                <p className="text-textSecondary leading-relaxed">
                  Управлявайте механици, автомобили, ремонти, части, фактури и клиенти
                  от едно централизирано място.
                </p>

                <span className="inline-block mt-4 text-primary font-medium group-hover:underline">
                  Продължи →
                </span>
              </div>
            </div>
          </button>

          {/* Client */}
          <button
            onClick={() => navigate('/login?role=client')}
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg focus:outline-none"
          >
            <div className="flex items-start gap-5">
              <div>
                <h2 className="text-2xl font-semibold text-textPrimary mb-2">
                  Вход за Клиент
                </h2>
                <p className="text-textSecondary leading-relaxed">
                  Следете статус на ремонти, сервизна история, фактури и
                  комуникация със сервиза.
                </p>

                <span className="inline-block mt-4 text-primary font-medium group-hover:underline">
                  Продължи →
                </span>
              </div>
            </div>
          </button>
        </div>

      </div>
    </div>
  );
};

export default RoleSelection;

