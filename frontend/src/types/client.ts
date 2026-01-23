// ============================================
// CLIENT DASHBOARD TYPES
// ============================================

export interface ClientInfo {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
}

export interface ClientStatistics {
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  upcomingAppointments: number;
  lastOrderDate: {
    id: string;
    orderNumber: string;
  displayOrderNumber?: string | null;
    completedDate: string;
  } | null;
}

export interface ClientOrder {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
  status: string;
  description: string;
  priority: string;
  createdAt: string;
  completedDate: string | null;
  totalPrice: string | null;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  };
  worker: {
    firstName: string;
    lastName: string;
  } | null;
}

export interface ClientAppointment {
  id: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  status: string;
  order: {
    orderNumber: string;
  displayOrderNumber?: string | null;
    status: string;
  } | null;
}

export interface ClientDashboardData {
  client: ClientInfo;
  hasActiveService: boolean;
  statistics: ClientStatistics;
  activeOrders: ClientOrder[];
  upcomingAppointments: ClientAppointment[];
  recentActivity: {
    id: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    orderNumber: string | null;
  }[];
}

// ============================================
// CLIENT SERVICE COMPANY TYPES
// ============================================

export interface ClientServiceCompany {
  clientId: string;
  status: 'ACTIVE' | 'PENDING';
  joinedAt: string;
  serviceCompany: {
    id: string;
    name: string;
    address: string | null;
    phone: string;
    email: string;
    uniqueCode: string;
  };
}

export interface ClientServiceCompaniesResponse {
  serviceCompanies: ClientServiceCompany[];
}

export interface ClientPendingRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  serviceCompany: {
    id: string;
    name: string;
  };
  createdAt: string;
}

export interface ClientPendingRequestsResponse {
  pendingRequests: ClientPendingRequest[];
}
