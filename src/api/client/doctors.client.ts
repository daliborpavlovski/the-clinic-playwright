import { BaseClient } from './base.client';
import type { DoctorProfile, DoctorSlotAvailability, PaginatedResponse } from '../../types/api.types';

export interface DoctorSlot {
  start_time: string;
  end_time: string;
  available: boolean;
}

export class DoctorsClient extends BaseClient {
  async list(page = 1, size = 20) {
    return this.get<{ items: DoctorProfile[]; total: number; page: number; size: number; pages: number }>(
      'doctors',
      { params: { page, size } }
    );
  }

  async getById(id: number) {
    return this.get<DoctorProfile>(`doctors/${id}`);
  }

  async getSlots(id: number, fromDate?: string, toDate?: string) {
    const params: Record<string, string> = {};
    if (fromDate) params['from_date'] = fromDate;
    if (toDate) params['to_date'] = toDate;
    return this.get<DoctorSlot[]>(`doctors/${id}/slots`, { params });
  }

  async updateProfile(
    id: number,
    payload: {
      specialty?: string;
      bio?: string;
      available_slots?: DoctorSlotAvailability[];
      slot_duration_minutes?: number;
    }
  ) {
    return this.put<DoctorProfile>(`doctors/${id}/profile`, payload);
  }
}
