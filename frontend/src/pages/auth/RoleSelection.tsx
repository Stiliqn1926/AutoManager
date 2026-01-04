import { useNavigate } from 'react-router-dom';

const RoleSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-mainBg flex items-center justify-center px-6">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-5xl font-bold text-textPrimary mb-4">
            Auto<span className="text-primary">Manager</span>
          </h1>
          <p className="text-lg text-textSecondary max-w-2xl mx-auto">
            Професионална система за управление на автосервизи, клиенти и сервизни процеси.
          </p>
        </div>

        {/* Role Cards */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Service */}
          <button
            onClick={() => navigate('/auth/service-role')}
            className="group bg-cardBg border border-borderSubtle rounded-2xl p-10 text-left shadow-card transition-all hover:border-primary hover:shadow-lg focus:outline-none"
          >
            <div className="flex items-start gap-5">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-50 text-primary">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14.7 6.3a1 1 0 010 1.4l-1.4 1.4a1 1 0 01-1.4 0L9.3 7.7a1 1 0 010-1.4l1.4-1.4a1 1 0 011.4 0l2.6 2.6zM7 21h10a2 2 0 002-2v-7l-5-5H7a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>

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
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-primary-50 text-primary">
                <svg
                  className="w-7 h-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5.121 17.804A9 9 0 1118.364 4.56 9 9 0 015.12 17.804z"
                  />
                </svg>
              </div>

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

        {/* Footer */}
        <div className="text-center mt-14 text-sm text-textMuted">
          © {new Date().getFullYear()} AutoManager. Всички права запазени.
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
