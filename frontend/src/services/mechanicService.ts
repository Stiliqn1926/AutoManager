import api from './api';
import axios from 'axios';
import type { 
  MechanicDashboardData, 
  MechanicClientsResponse, 
  MechanicClientDetails,
  MechanicVehiclesResponse,
  MechanicVehicleDetails,
  MechanicOrdersResponse,
  MechanicOrderDetails,
  MechanicOrderItem,
  MechanicScheduleResponse,
  MechanicScheduleDetails,
  MechanicProfileResponse,
  MechanicStatisticsResponse,
  MechanicServiceCompaniesResponse,
  ActiveServiceCompanyResponse,
  RequestServiceCompanyResponse,
  SwitchServiceCompanyResponse,
  LeaveServiceCompanyResponse
} from '../types/mechanic';

export const getMechanicDashboard = async (signal?: AbortSignal): Promise<MechanicDashboardData> => {
  const response = await api.get('/dashboard/mechanic', { signal });
  return response.data;
}; 

// ============================================
// MECHANIC CLIENTS API
// ============================================

export const getMechanicClients = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
  signal?: AbortSignal;
}): Promise<MechanicClientsResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.activeOnly) queryParams.append('activeOnly', 'true');

  try {
    const response = await api.get(`/clients/mechanic?${queryParams.toString()}`, {
      signal: params?.signal,
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      return {
        clients: [],
        pagination: {
          totalItems: 0,
          totalPages: 1,
          currentPage: params?.page ?? 1,
          itemsPerPage: params?.limit ?? 20,
        },
      };
    }
    throw error;
  }
};

export const getMechanicClientById = async (id: string): Promise<{ client: MechanicClientDetails }> => {
  const response = await api.get(`/clients/mechanic/${id}`);
  return response.data;
}; 

// ============================================
// MECHANIC VEHICLES API
// ============================================

export const getMechanicVehicles = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  activeOnly?: boolean;
  signal?: AbortSignal;
}): Promise<MechanicVehiclesResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.search) queryParams.append('search', params.search);
  if (params?.activeOnly) queryParams.append('activeOnly', 'true');

  const response = await api.get(`/vehicles/mechanic?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response.data;
};

export const getMechanicVehicleById = async (id: string): Promise<{ vehicle: MechanicVehicleDetails }> => {
  const response = await api.get(`/vehicles/mechanic/${id}`);
  return response.data;
}; 

// ============================================
// MECHANIC ORDERS API
// ============================================

export const getMechanicOrders = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  signal?: AbortSignal;
}): Promise<MechanicOrdersResponse> => {
  const queryParams = new URLSearchParams();

  if (params?.page) queryParams.append('page', params.page.toString());
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.status) queryParams.append('status', params.status);

  const response = await api.get(`/orders?${queryParams.toString()}`, {
    signal: params?.signal,
  });
  return response.data;
};

export const getMechanicOrderById = async (
  id: string,
  signal?: AbortSignal
): Promise<{ order: MechanicOrderDetails }> => {
  const response = await api.get(`/orders/${id}`, { signal });
  return response.data;
};

export const updateMechanicOrderStatus = async (
  id: string,
  status: string
): Promise<{ message: string; order: MechanicOrderDetails }> => {
  const response = await api.patch(`/orders/${id}/status`, { status });
  return response.data;
};

export const addMechanicOrderItem = async (
  orderId: string,
  item: {
    type: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }
): Promise<{ message: string; orderItem: MechanicOrderItem }> => {
  const response = await api.post(`/order-items/${orderId}`, item);
  return response.data;
};

export const updateMechanicOrderItem = async (
  itemId: string,
  item: {
    type: string;
    name: string;
    description?: string;
    quantity: number;
    unitPrice: number;
  }
): Promise<{ message: string; orderItem: MechanicOrderItem }> => {
  const response = await api.put(`/order-items/${itemId}`, item);
  return response.data;
};

export const deleteMechanicOrderItem = async (itemId: string): Promise<{ message: string }> => {
  const response = await api.delete(`/order-items/${itemId}`);
  return response.data;
};

export const updateMechanicOrder = async (
  orderId: string,
  data: {
    description?: string;
    diagnosis?: string;
  }
): Promise<{ message: string; order: MechanicOrderDetails }> => {
  const response = await api.put(`/orders/${orderId}`, data);
  return response.data;
}; 

// ============================================
// MECHANIC SCHEDULE API
// ============================================

export const getMechanicDailySchedule = async (date: string, signal?: AbortSignal): Promise<MechanicScheduleResponse> => {
  const response = await api.get(`/schedules/daily?date=${date}`, { signal });
  return response.data;
};

export const getMechanicWeeklySchedule = async (weekStart: string): Promise<MechanicScheduleResponse> => {
  const response = await api.get(`/schedules/weekly?weekStart=${weekStart}`);
  return response.data;
};

export const getMechanicMonthlySchedule = async (
  year: number,
  month: number
): Promise<MechanicScheduleResponse> => {
  const response = await api.get(`/schedules/monthly?year=${year}&month=${month}`);
  return response.data;
};

export const getMechanicScheduleById = async (id: string): Promise<{ schedule: MechanicScheduleDetails }> => {
  const response = await api.get(`/schedules/${id}`);
  return response.data;
}; 

// ============================================
// MECHANIC PROFILE API
// ============================================

export const getMechanicProfile = async (): Promise<MechanicProfileResponse> => {
  const response = await api.get('/workers/profile');
  return response.data;
};

export const updateMechanicProfile = async (data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  specialization?: string;
  skills?: string;
}): Promise<MechanicProfileResponse> => {
  const response = await api.put('/workers/profile', data);
  return response.data;
};

export const getMechanicStatistics = async (): Promise<MechanicStatisticsResponse> => {
  const response = await api.get('/workers/statistics');
  return response.data;
};

// ============================================
// MECHANIC SERVICE COMPANY API
// ============================================

export const getMechanicServiceCompanies = async (): Promise<MechanicServiceCompaniesResponse> => {
  const response = await api.get('/workers/service-companies');
  return response.data;
};

export const getActiveServiceCompany = async (): Promise<ActiveServiceCompanyResponse> => {
  // 🆕 ВАЖНО: skipAutoLogout: true предотвратява автоматичен logout при 403
  // Този endpoint проверява за активен сервиз и очакваме 403 когато няма
  const response = await api.get('/workers/service-companies/active', { skipAutoLogout: true });
  return response.data;
};

export const requestServiceCompany = async (uniqueCode: string): Promise<RequestServiceCompanyResponse> => {
  const response = await api.post('/workers/service-companies/request', { uniqueCode });
  return response.data;
};

export const switchServiceCompany = async (serviceCompanyId: string): Promise<SwitchServiceCompanyResponse> => {
  const response = await api.put('/workers/service-companies/switch', { serviceCompanyId });
  return response.data;
};

export const cancelPendingRequest = async (membershipId: string): Promise<{ message: string }> => {
  const response = await api.post(`/workers/service-companies/${membershipId}/cancel`);
  return response.data;
};

export const leaveServiceCompany = async (membershipId: string): Promise<LeaveServiceCompanyResponse> => {
  const response = await api.delete(`/workers/service-companies/${membershipId}`);
  return response.data;
};
