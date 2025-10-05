import React from 'react';
import { useAuthStore } from '../hooks/useAuth';

const DebugAuth: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-md text-xs z-50 max-w-sm">
      <h3 className="font-bold mb-2">Auth Debug:</h3>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      {/* CHANGED: Removed role, added user info */}
      <p>User: {user ? user.username : 'None'}</p>
      <p>Permissions: {user?.permissions ? user.permissions.length : 0}</p>
      {/* NEW: Dropdown to view permissions */}
      {user?.permissions && (
        <details>
          <summary className="cursor-pointer mt-1">View Permissions</summary>
          <ul className="mt-1 pl-4">
            {user.permissions.map((perm, index) => (
              <li key={index} className="truncate">{perm}</li>
            ))}
          </ul>
        </details>
      )}
      <p>Token: {localStorage.getItem('auth_token') ? 'Exists' : 'Missing'}</p>
    </div>
  );
};

export default DebugAuth;
