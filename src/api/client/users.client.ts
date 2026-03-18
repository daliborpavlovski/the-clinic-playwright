import { BaseClient } from './base.client';
import type { User, PaginatedResponse } from '../../types/api.types';

export class UsersClient extends BaseClient {
  async getMe() {
    return this.get<User>('users/me');
  }

  async updateMe(payload: { full_name?: string; email?: string }) {
    return this.put<User>('users/me', payload);
  }

  async list(page = 1, size = 20) {
    return this.get<PaginatedResponse<User>>('users', { params: { page, size } });
  }

  async deleteUser(id: number) {
    return super.delete<null>(`users/${id}`);
  }
}
