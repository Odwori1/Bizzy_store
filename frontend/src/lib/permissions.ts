// Utility function for RBAC permission checks
export const hasPermission = (requiredPermission: string, userPermissions: string[]): boolean => {
  return userPermissions.includes(requiredPermission);
};
