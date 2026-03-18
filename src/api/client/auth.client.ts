import { BaseClient } from './base.client';
import type { TokenResponse, User } from '../../types/api.types';

export class AuthClient extends BaseClient {
  async register(payload: {
    email: string;
    password: string;
    full_name: string;
    role?: string;
  }) {
    return this.post<User>('auth/register', payload);
  }

  async login(email: string, password: string) {
    return this.post<TokenResponse>('auth/login', { email, password });
  }

  async logout() {
    return this.post<null>('auth/logout', {});
  }

  async refresh(refreshToken: string) {
    return this.post<TokenResponse>('auth/refresh', { refresh_token: refreshToken });
  }

  /**
   * Convenience: login and set access token on this client.
   * Returns the full token response.
   */
  async loginAndSetToken(email: string, password: string): Promise<TokenResponse> {
    const { response, body } = await this.login(email, password);
    this.assertStatus(response, 200);
    this.setToken(body.access_token);
    return body;
  }
}
