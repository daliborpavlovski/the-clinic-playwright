export type UserRole = 'admin' | 'doctor' | 'patient';
export type AppointmentStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface User {
  id: number;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  doctor_id: number;
  start_time: string;
  end_time: string;
  status: AppointmentStatus;
  reason: string | null;
  notes: string | null;
  created_at: string;
}

export interface DoctorSlotAvailability {
  day: number;
  start: string;
  end: string;
}

export interface DoctorProfile {
  id: number;
  user_id: number;
  specialty: string;
  bio: string | null;
  available_slots: DoctorSlotAvailability[];
  slot_duration_minutes: number;
  doctor_name: string | null;
  doctor_email: string | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
}
