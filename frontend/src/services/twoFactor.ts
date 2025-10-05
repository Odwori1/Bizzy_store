import { api } from './api';

export interface TwoFactorSetupResponse {
  qr_code_url: string;
  secret_key: string;
  backup_codes: string[];
}

export interface TwoFactorStatusResponse {
  is_enabled: boolean;
}

export const twoFactorService = {
  setup: async (): Promise<TwoFactorSetupResponse> => {
    const response = await api.post<TwoFactorSetupResponse>('/api/2fa/setup');
    return response.data;
  },

  verify: async (code: string): Promise<TwoFactorStatusResponse> => {
    const response = await api.post<TwoFactorStatusResponse>('/api/2fa/verify', {
      code
    });
    return response.data;
  },

  disable: async (code: string): Promise<TwoFactorStatusResponse> => {
    const response = await api.post<TwoFactorStatusResponse>('/api/2fa/disable', {
      code
    });
    return response.data;
  },

  getStatus: async (): Promise<TwoFactorStatusResponse> => {
    const response = await api.get<TwoFactorStatusResponse>('/api/2fa/status');
    return response.data;
  },

  verifyBackupCode: async (backupCode: string): Promise<TwoFactorStatusResponse> => {
    const response = await api.post<TwoFactorStatusResponse>('/api/2fa/backup-verify', {
      backup_code: backupCode
    });
    return response.data;
  }
};
