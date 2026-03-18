import { BaseClient } from './base.client';
import type { Appointment, AppointmentStatus, PaginatedResponse } from '../../types/api.types';

export interface CreateAppointmentPayload {
  doctor_id: number;
  start_time: string;
  end_time: string;
  reason?: string;
}

export class AppointmentsClient extends BaseClient {
  async list(page = 1, size = 20) {
    return this.get<PaginatedResponse<Appointment>>('appointments', {
      params: { page, size },
    });
  }

  async create(payload: CreateAppointmentPayload) {
    return this.post<Appointment>('appointments', payload);
  }

  async getById(id: number) {
    return this.get<Appointment>(`appointments/${id}`);
  }

  async update(id: number, payload: { notes?: string; reason?: string }) {
    return this.put<Appointment>(`appointments/${id}`, payload);
  }

  async deleteAppointment(id: number) {
    return super.delete<null>(`appointments/${id}`);
  }

  async updateStatus(id: number, status: AppointmentStatus) {
    return this.patch<Appointment>(`appointments/${id}/status`, { status });
  }
}
