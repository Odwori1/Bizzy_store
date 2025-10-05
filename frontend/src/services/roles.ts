import { api } from './api';

// Define what a Role object looks like from the backend
export interface Role {
  id: number;
  name: string;
  description?: string;
  permissions: string[]; // List of permission strings
  is_default: boolean;
}

export const rolesService = {
  // Get all available roles
  getRoles: async (): Promise<Role[]> => {
    const response = await api.get<Role[]>('/api/roles/');
    return response.data;
  },

  // Assign a role to a user
  assignRoleToUser: async (userId: number, roleId: number): Promise<void> => {
    await api.put(`/api/users/${userId}/role`, { role_id: roleId });
  },
};
