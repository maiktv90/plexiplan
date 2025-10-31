// Clean Architecture - Configuration Service Layer
import { configApiClient } from '@/api';

export interface ToolConfig {
  id: string;
  name: string;
  enabled: boolean;
  settings: Record<string, unknown>;
  clientRegistrationId: string;
}

export interface CreateConfigParams {
  name: string;
  settings: Record<string, unknown>;
  clientRegistrationId: string;
}

export interface UpdateConfigParams {
  clientRegistrationId: string;
  settings: Record<string, unknown>;
  enabled?: boolean;
}

export class ConfigService {
  static async getToolConfig(clientRegistrationId: string) {
    return await configApiClient.get<ToolConfig>(`/${clientRegistrationId}`);
  }

  static async createConfig(params: CreateConfigParams) {
    return await configApiClient.post<ToolConfig>('/', params);
  }

  static async updateConfig(params: UpdateConfigParams) {
    const { clientRegistrationId, ...updateData } = params;
    return await configApiClient.put<ToolConfig>(`/${clientRegistrationId}`, updateData);
  }

  static async deleteConfig(clientRegistrationId: string) {
    return await configApiClient.delete(`/${clientRegistrationId}`);
  }

  static async getAllConfigs() {
    return await configApiClient.get<ToolConfig[]>('/');
  }

  static async toggleConfigStatus(clientRegistrationId: string, enabled: boolean) {
    return await configApiClient.patch(`/${clientRegistrationId}/toggle`, { enabled });
  }

  static async resetConfig(clientRegistrationId: string) {
    return await configApiClient.post(`/${clientRegistrationId}/reset`);
  }

  static async validateConfig(clientRegistrationId: string, settings: Record<string, unknown>) {
    return await configApiClient.post<{ valid: boolean; errors?: string[] }>(`/${clientRegistrationId}/validate`, { settings });
  }
}