// ============================================
// MECHANIC DASHBOARD TYPES
// ============================================

export interface MechanicWorker {
  id: string;
  name: string;
  specialization: string | null;
  isActive?: boolean; // ✅ Добавено - true = одобрен, false = чака одобрение
}


export interface MechanicOrder {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
  status: string;
  description: string;
  priority: string;
  createdAt: string;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  };
}

export interface MechanicSchedule {
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

export interface MechanicDashboardData {
  worker: MechanicWorker;
  hasActiveService: boolean;
  statistics: MechanicStatistics;
  activeOrders: MechanicOrder[];
  todaySchedule: MechanicSchedule[];
  upcomingSchedule: MechanicSchedule[];
}

// ============================================
// MECHANIC CLIENTS TYPES
// ============================================

export interface MechanicClientVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string | null;
  orders?: {
    id: string;
    status: string;
  }[];
}

export interface MechanicClientOrder {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
  status: string;
  description: string;
  priority: string;
  createdAt: string;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  };
}

export interface MechanicClient {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  activeOrdersCount: number;
  lastOrderDate: string | null;
  vehicles: MechanicClientVehicle[];
  orders?: MechanicClientOrder[];
  user: {
    email: string;
  } | null;
  _count: {
    vehicles: number;
    orders: number;
  };
}

export interface MechanicClientDetails {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  address: string | null;
  user: {
    email: string;
  } | null;
  vehicles: MechanicClientVehicle[];
  orders: MechanicClientOrder[];
}

export interface MechanicClientsResponse {
  clients: MechanicClient[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

// ============================================
// MECHANIC VEHICLES TYPES
// ============================================

export interface MechanicVehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  fuelType: string | null;
  engineType: string | null;
  hasActiveOrder: boolean;
  activeOrdersCount: number;
  lastOrderDate: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  orders?: {
    id: string;
    status: string;
    createdAt: string;
  }[];
  _count: {
    orders: number;
  };
}

export interface MechanicVehicleOrderItem {
  id: string;
  type: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface MechanicVehicleOrder {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
  status: string;
  description: string;
  priority: string;
  createdAt: string;
  completedDate: string | null;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    licensePlate: string;
  };
  orderItems: MechanicVehicleOrderItem[];
}

export interface MechanicVehicleDetails {
  id: string;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  vin: string | null;
  color: string | null;
  mileage: number | null;
  fuelType: string | null;
  engineType: string | null;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
  orders: MechanicVehicleOrder[];
}

export interface MechanicVehiclesResponse {
  vehicles: MechanicVehicle[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

// ============================================
// MECHANIC ORDERS TYPES
// ============================================

export interface MechanicOrderItem {
  id: string;
  type: string;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface MechanicOrderDetails {
  id: string;
  orderNumber: string;
  displayOrderNumber?: string | null;
  status: string;
  description: string;
  priority: string;
  createdAt: string;
  completedDate: string | null;
  totalPrice: number | null;
  diagnosticNotes: string | null;
  vehicle: {
    id: string;
    brand: string;
    model: string;
    year: number;
    licensePlate: string;
  };
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email: string | null;
  };
  worker: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  orderItems: MechanicOrderItem[];
}

export interface MechanicOrdersResponse {
  orders: MechanicOrder[];
  pagination: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
    itemsPerPage: number;
  };
}

// ============================================
// MECHANIC SCHEDULE TYPES
// ============================================

export interface MechanicScheduleItem {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  priority: string;
  estimatedDuration: number | null;
  notes: string | null;
  isCompleted: boolean;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  order: {
    id: string;
    orderNumber: string;
  displayOrderNumber?: string | null;
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
    client: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

export interface MechanicScheduleResponse {
  schedules: MechanicScheduleItem[];
}

export interface MechanicScheduleDetails {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  priority: string;
  estimatedDuration: number | null;
  notes: string | null;
  isCompleted: boolean;
  worker: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  } | null;
  order: {
    id: string;
    orderNumber: string;
  displayOrderNumber?: string | null;
    client: {
      firstName: string;
      lastName: string;
    };
    vehicle: {
      brand: string;
      model: string;
      licensePlate: string;
    };
  } | null;
} 

// ============================================
// MECHANIC PROFILE TYPES
// ============================================

export interface MechanicProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  specialization: string | null;
  skills: string | null;
  isActive: boolean;
  createdAt: string;
  user: {
    email: string;
    isActive: boolean;
  };
}

export interface MechanicStatistics {
  totalOrders: number;
  completedOrders: number;
  activeOrders: number;
  todayTasks: number;
  lastCompletedOrder: {
    id: string;
    orderNumber: string;
  displayOrderNumber?: string | null;
    completedDate: string;
  } | null;
  ordersToday: number;
  ordersThisWeek: number;
  upcomingTasks: number;
}

export interface MechanicProfileResponse {
  worker: MechanicProfile;
}

export interface MechanicStatisticsResponse {
  statistics: MechanicStatistics;
} 

// ============================================
// MECHANIC SERVICE COMPANY TYPES
// ============================================

export interface MechanicServiceCompany {
  id: string;
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';
  joinedAt: string;
  leftAt: string | null;
  serviceCompany: {
    id: string;
    name: string;
    address: string | null;
    phone: string;
    email: string;
    uniqueCode: string;
  };
}

export interface MechanicServiceCompaniesResponse {
  serviceCompanies: MechanicServiceCompany[];
}

export interface ActiveServiceCompanyResponse {
  serviceCompany: {
    id: string;
    name: string;
    address: string | null;
    phone: string;
    email: string;
    uniqueCode: string;
  };
}

export interface RequestServiceCompanyResponse {
  message: string;
  membership: {
    id: string;
    status: 'PENDING';
    serviceCompany: {
      id: string;
      name: string;
      address: string | null;
      phone: string;
      email: string;
    };
  };
}

export interface SwitchServiceCompanyResponse {
  message: string;
  serviceCompanyId: string;
}

export interface LeaveServiceCompanyResponse {
  message: string;
}