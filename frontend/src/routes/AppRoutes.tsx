import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { UserRole } from '../types';

// ================= AUTH PAGES =================
import LandingPage from '../pages/auth/LandingPage';
import RoleSelection from '../pages/auth/RoleSelection';
import RegisterSelection from '../pages/auth/RegisterSelection';
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import RegisterMechanic from '../pages/auth/RegisterMechanic';
import RegisterClient from '../pages/auth/RegisterClient';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import TermsAndConditions from '../pages/TermsAndConditions';

// ================= ADMIN PAGES =================
import AdminDashboard from '../pages/admin/Dashboard';

// Workers
import Workers from '../pages/admin/Workers';
import WorkerDetails from '../pages/admin/WorkerDetails';

// Clients
import Clients from '../pages/admin/Clients';
import ClientDetails from '../pages/admin/ClientDetails';

// Vehicles
import Vehicles from '../pages/admin/Vehicles';
import VehicleCreate from '../pages/admin/VehicleCreate';
import VehicleDetails from '../pages/admin/VehicleDetails';
import VehicleEdit from '../pages/admin/VehicleEdit';

// Orders
import Orders from '../pages/admin/Orders';
import OrderCreate from '../pages/admin/OrderCreate';
import OrderDetails from '../pages/admin/OrderDetails';
import OrderEdit from '../pages/admin/OrderEdit';

// Schedules
import Schedules from '../pages/admin/Schedules';
import ScheduleCreate from '../pages/admin/ScheduleCreate';
import ScheduleWeekly from '../pages/admin/ScheduleWeekly';
import ScheduleDaily from '../pages/admin/ScheduleDaily';
import ScheduleMonthly from '../pages/admin/ScheduleMonthly';
import ScheduleDetails from '../pages/admin/ScheduleDetails';
import ScheduleEdit from '../pages/admin/ScheduleEdit';

// Suppliers
import Suppliers from '../pages/admin/Suppliers';
import SupplierCreate from '../pages/admin/SupplierCreate';
import SupplierDetails from '../pages/admin/SupplierDetails';
import SupplierEdit from '../pages/admin/SupplierEdit';

// Finances
import FinanceDashboard from '../pages/admin/FinanceDashboard';
import Finances from '../pages/admin/Finances';
import FinanceCreate from '../pages/admin/FinanceCreate';

// Settings
import Settings from '../pages/admin/Settings';

// ================= MECHANIC PAGES =================
import MechanicDashboard from '../pages/mechanic/Dashboard';
import MechanicClients from '../pages/mechanic/Clients';
import MechanicClientDetails from '../pages/mechanic/ClientDetails';
import MechanicVehicles from '../pages/mechanic/Vehicles';
import MechanicVehicleDetails from '../pages/mechanic/VehicleDetails';
import MechanicOrders from '../pages/mechanic/Orders';
import MechanicOrderDetails from '../pages/mechanic/OrderDetails';
import MechanicSchedule from '../pages/mechanic/Schedule';
import MechanicProfile from '../pages/mechanic/Profile';
import ServiceSettings from '../pages/mechanic/ServiceSettings';

// ================= CLIENT PAGES =================
import ClientDashboard from '../pages/client/Dashboard';
import ServiceCompanies from '../pages/client/ServiceCompanies';
import ClientVehicles from '../pages/client/Vehicles';
import ClientVehicleDetails from '../pages/client/VehicleDetails';
import ClientOrders from '../pages/client/Orders';
import ClientOrderDetails from '../pages/client/OrderDetails';
import ClientInvoices from '../pages/client/Invoices';
import ClientNotifications from '../pages/client/Notifications';
import ClientProfile from '../pages/client/Profile';


// ================= NOT FOUND =================
import NotFound from '../pages/NotFound';
import Unauthorized from '../pages/Unauthorized';

export const AppRoutes = () => {
  const { isAuthenticated, user } = useAuth();

  const getDefaultRedirect = () => {
    if (!user) return '/';

    switch (user.role) {
      case UserRole.ADMIN:
        return '/admin/dashboard';
      case UserRole.MECHANIC:
        return '/mechanic/dashboard';
      case UserRole.CLIENT:
        return '/client/dashboard';
      default:
        return '/';
    }
  };

  return (
    <Routes>
      {/* ================= ROOT ================= */}
      <Route
        path="/"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRedirect()} replace />
          ) : (
            <LandingPage />
          )
        }
      />

      {/* ================= AUTH ================= */}
      <Route
        path="/auth/service-role"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRedirect()} replace />
          ) : (
            <RoleSelection />
          )
        }
      />

      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRedirect()} replace />
          ) : (
            <Login />
          )
        }
      />

      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRedirect()} replace />
          ) : (
            <RegisterSelection />
          )
        }
      />

      <Route
        path="/register-admin"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRedirect()} replace />
          ) : (
            <Register />
          )
        }
      />

      <Route
        path="/register-mechanic"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRedirect()} replace />
          ) : (
            <RegisterMechanic />
          )
        }
      />

      <Route
        path="/register-client"
        element={
          isAuthenticated ? (
            <Navigate to={getDefaultRedirect()} replace />
          ) : (
            <RegisterClient />
          )
        }
      />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/terms" element={<TermsAndConditions />} />

      {/* ================= ADMIN ================= */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* -------- Workers -------- */}
      <Route
        path="/admin/workers"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Workers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/workers/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <WorkerDetails />
          </ProtectedRoute>
        }
      />

      {/* -------- Clients -------- */}
      <Route
        path="/admin/clients"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Clients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clients/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ClientDetails />
          </ProtectedRoute>
        }
      />

      {/* -------- Vehicles -------- */}
      <Route
        path="/admin/vehicles"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Vehicles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/create"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <VehicleCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <VehicleDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/vehicles/:id/edit"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <VehicleEdit />
          </ProtectedRoute>
        }
      />

      {/* -------- Orders -------- */}
      <Route
        path="/admin/orders"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders/create"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <OrderCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <OrderDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/orders/:id/edit"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <OrderEdit />
          </ProtectedRoute>
        }
      />

      {/* -------- Schedules -------- */}
      <Route
        path="/admin/schedules"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Schedules />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedules/create"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ScheduleCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedules/weekly"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ScheduleWeekly />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedules/daily"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ScheduleDaily />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedules/monthly"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ScheduleMonthly />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedules/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ScheduleDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/schedules/:id/edit"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <ScheduleEdit />
          </ProtectedRoute>
        }
      />

      {/* -------- Suppliers -------- */}
      <Route
        path="/admin/suppliers"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Suppliers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/suppliers/create"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <SupplierCreate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/suppliers/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <SupplierDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/suppliers/:id/edit"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <SupplierEdit />
          </ProtectedRoute>
        }
      />

      {/* -------- Finances -------- */}
      <Route
        path="/admin/finances/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <FinanceDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/finances"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Finances />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/finances/create"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <FinanceCreate />
          </ProtectedRoute>
        }
      />

      {/* -------- Settings -------- */}
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* ================= MECHANIC ================= */}
      <Route
        path="/mechanic/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <MechanicDashboard />
          </ProtectedRoute>
        }
      />

      {/* -------- Clients -------- */}
      <Route
        path="/mechanic/clients"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <MechanicClients />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mechanic/clients/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <MechanicClientDetails />
          </ProtectedRoute>
        }
      />

      {/* -------- Vehicles -------- */}
      <Route
        path="/mechanic/vehicles"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <MechanicVehicles />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mechanic/vehicles/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <MechanicVehicleDetails />
          </ProtectedRoute>
        }
      />

      {/* -------- Orders -------- */}
      <Route
        path="/mechanic/orders"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <MechanicOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mechanic/orders/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <MechanicOrderDetails />
          </ProtectedRoute>
        }
      />

      {/* -------- Schedule -------- */}
      <Route
        path="/mechanic/schedule"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <MechanicSchedule />
          </ProtectedRoute>
        }
      />

      {/* -------- Profile -------- */}
      <Route
        path="/mechanic/profile"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <MechanicProfile />
          </ProtectedRoute>
        }
      />

      {/* -------- Service Settings -------- */}
      <Route
        path="/mechanic/service-settings"
        element={
          <ProtectedRoute allowedRoles={[UserRole.MECHANIC]}>
            <ServiceSettings />
          </ProtectedRoute>
        }
      />

      {/* ================= CLIENT ================= */}
      <Route
        path="/client/dashboard"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ClientDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/service-companies"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ServiceCompanies />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/vehicles"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ClientVehicles />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/vehicles/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ClientVehicleDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/orders"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ClientOrders />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/orders/:id"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ClientOrderDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/invoices"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ClientInvoices />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/notifications"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ClientNotifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/client/profile"
        element={
          <ProtectedRoute allowedRoles={[UserRole.CLIENT]}>
            <ClientProfile />
          </ProtectedRoute>
        }
      />

      {/* ================= UNAUTHORIZED ================= */}
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* ================= 404 ================= */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};
