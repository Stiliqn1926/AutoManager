import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthProvider';
import { ServiceCompanyProvider } from './context/ServiceCompanyProvider';
import { ActiveServiceProvider } from './context/ActiveServiceProvider';
import { AppRoutes } from './routes/AppRoutes';
import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ServiceCompanyProvider>
          <ActiveServiceProvider>
            <AppRoutes />
            <Toaster position="top-right" />
          </ActiveServiceProvider>
        </ServiceCompanyProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
