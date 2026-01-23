import { useSearchParams } from 'react-router-dom';

const TermsAndConditions = () => {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/';

  const getReturnButtonText = () => {
    if (returnTo.includes('register-client')) return 'Назад към регистрация';
    if (returnTo.includes('register-mechanic')) return 'Назад към регистрация';
    if (returnTo.includes('register')) return 'Назад към регистрация';
    return 'Назад към начало';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-orange-100 py-12 px-4 overflow-x-hidden">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8 mb-0">
        <h1 className="text-4xl font-bold text-primary-600 mb-6">
          Общи условия и Поверителност
        </h1>
        
        <div className="prose max-w-none">
          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            1. Общи разпоредби
          </h2>
          <p className="text-gray-700 mb-4">
            Настоящите общи условия уреждат отношенията между AutoManager и потребителите на системата за управление на автосервизи. Използването на платформата означава пълно и безусловно приемане на настоящите условия.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            2. Регистрация и акаунти
          </h2>
          <p className="text-gray-700 mb-4">
            <strong>2.1.</strong> Регистрацията в системата е безплатна и достъпна за три типа потребители: администратори на автосервизи, механици и клиенти.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>2.2.</strong> Администраторите на автосервизи се регистрират със данни за своята фирма (име, адрес, БУЛСТАТ, ДДС номер) и създават администраторски акаунт. След регистрация получават уникален код, с който могат да добавят механици към своя автосервиз.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>2.3.</strong> Механиците се регистрират чрез уникален код, предоставен от администратора на автосервиза. Регистрацията им изисква одобрение от администратор преди да получат достъп до системата.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>2.4.</strong> Клиентите се регистрират свободно със своите лични данни (име, телефон, имейл) и получават незабавен достъп до системата.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>2.5.</strong> Потребителите са длъжни да предоставят верни и актуални данни при регистрация.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>2.6.</strong> Всеки потребител носи отговорност за запазване в тайна на своята парола и за всички действия, извършени чрез неговия акаунт.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            3. Права и задължения на потребителите
          </h2>
          <p className="text-gray-700 mb-4">
            <strong>3.1. Администратори:</strong>
          </p>
          <ul className="list-disc pl-8 mb-4 text-gray-700">
            <li>Имат пълен достъп до управлението на своя автосервиз</li>
            <li>Създават уникален код за добавяне на механици към автосервиза</li>
            <li>Одобряват или отхвърлят регистрации на механици</li>
            <li>Управляват клиенти, автомобили, поръчки, график и финанси</li>
            <li>Създават, редактират и финализират поръчки</li>
            <li>Генерират и изпращат фактури към клиенти</li>
            <li>Носят отговорност за коректността на издаваните фактури и въведените данни</li>
            <li>Управляват настройките на автосервиза (име, адрес, данъци и др.)</li>
          </ul>

          <p className="text-gray-700 mb-4">
            <strong>3.2. Механици:</strong>
          </p>
          <ul className="list-disc pl-8 mb-4 text-gray-700">
            <li>Създават и редактират поръчки за ремонт</li>
            <li>Имат достъп до информация за клиенти и автомобили (само за четене)</li>
            <li>Следят своя работен график и планирани задачи</li>
            <li>Обновяват статуса на поръчките и добавят части и услуги</li>
            <li>Нямат достъп до финансова информация и фактури</li>
            <li>Не могат да одобряват или деактивират клиенти</li>
          </ul>

          <p className="text-gray-700 mb-4">
            <strong>3.3. Клиенти:</strong>
          </p>
          <ul className="list-disc pl-8 mb-4 text-gray-700">
            <li>Проследяват в реално време статуса на своите ремонти и поръчки</li>
            <li>Имат достъп до пълната сервизна история на регистрираните си автомобили</li>
            <li>Преглеждат издадени фактури и детайли за извършените услуги</li>
            <li>Управляват своя профил и данни за автомобилите си</li>
            <li>Получават известия при промяна на статус на поръчка или график</li>
          </ul>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            4. Поверителност на данните
          </h2>
          <p className="text-gray-700 mb-4">
            <strong>4.1.</strong> AutoManager се задължава да пазим поверителността на личните данни на потребителите в съответствие с българското и европейското законодателство (GDPR).
          </p>
          <p className="text-gray-700 mb-4">
            <strong>4.2.</strong> Събираните данни включват: имейл адрес, имена, телефонен номер, данни за фирми (име, адрес, БУЛСТАТ, ДДС номер), данни за автомобили (марка, модел, регистрационен номер, VIN), история на поръчки, издадени фактури и детайли за извършени услуги.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>4.3.</strong> Данните се използват единствено за функционирането на системата и не се споделят с трети страни без съгласието на потребителя.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>4.4.</strong> Потребителите имат право на достъп, коригиране и изтриване на своите лични данни при поискване.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            5. Сигурност
          </h2>
          <p className="text-gray-700 mb-4">
            <strong>5.1.</strong> Всички пароли се съхраняват в криптиран вид (bcrypt хеширане).
          </p>
          <p className="text-gray-700 mb-4">
            <strong>5.2.</strong> Комуникацията между браузъра и сървъра се осъществява чрез защитени протоколи.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>5.3.</strong> При подозрение за неоторизиран достъп, потребителят следва незабавно да промени паролата си.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            6. Отговорност
          </h2>
          <p className="text-gray-700 mb-4">
            <strong>6.1.</strong> AutoManager не носи отговорност за евентуални загуби, произтичащи от неправилно използване на системата от страна на потребителите.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>6.2.</strong> Администраторите на автосервизи носят пълна отговорност за точността на въведената информация относно поръчки, фактури и финанси.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>6.3.</strong> AutoManager не носи отговорност за качеството на услугите, предоставяни от автосервизите.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            7. Прекратяване на достъп
          </h2>
          <p className="text-gray-700 mb-4">
            <strong>7.1.</strong> AutoManager си запазва правото да деактивира акаунт при нарушение на настоящите условия.
          </p>
          <p className="text-gray-700 mb-4">
            <strong>7.2.</strong> Потребителите могат по всяко време да поискат изтриване на своя акаунт.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            8. Промени в условията
          </h2>
          <p className="text-gray-700 mb-4">
            AutoManager си запазва правото да променя настоящите общи условия. При съществени промени потребителите ще бъдат уведомени чрез имейл или известие в системата.
          </p>

          <h2 className="text-2xl font-semibold text-gray-800 mt-8 mb-4">
            9. Контакти
          </h2>
          <p className="text-gray-700 mb-4">
            За въпроси относно общите условия и поверителността, моля свържете се с нас на: support@automanager.bg
          </p>

          <p className="text-gray-600 text-sm mt-8">
            Последна актуализация: Януари 2025
          </p>
        </div>

        <div className="mt-8 text-center">
          <a
            href={returnTo}
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors"
          >
            {getReturnButtonText()}
          </a>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditions;