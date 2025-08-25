import React from 'react';
import { useAuthStore } from '../hooks/useAuth';

const DebugAuth: React.FC = () => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  
  return (
    <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-md text-xs z-50">
      <h3 className="font-bold mb-2">Auth Debug:</h3>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>Loading: {isLoading ? 'Yes' : 'No'}</p>
      <p>User: {user ? `${user.username} (${user.role})` : 'None'}</p>
      <p>Token: {localStorage.getItem('auth_token') ? 'Exists' : 'Missing'}</p>
    </div>
  );
};

export default DebugAuth;
