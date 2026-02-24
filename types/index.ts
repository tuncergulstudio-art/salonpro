export interface Client {
    id: string;
    full_name: string;
    phone?: string;
  }
  
  export interface Service {
    id: string;
    name: string;
    price: number;
    duration: number;
  }
  
  export interface Profile {
    id: string;
    full_name: string;
    role?: string;
  }
  
  export interface Appointment {
    id: string;
    client_id: string;
    profile_id: string;
    start_time: string;
    end_time: string;
    total_price: number;
    status: string;
    client?: Client;
    profile?: Profile;
  }
  
  export interface DashboardStats {
    totalAppointments: number;
    totalRevenue: number;
    activeStaff: number;
    occupancyRate: number;
  }