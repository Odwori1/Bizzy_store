import React, { useEffect, useState } from 'react';
import { useUsersStore } from '../hooks/useUsers';
import { useAuthStore } from '../hooks/useAuth';
import { User, UserCreate } from '../types';
// NEW: Import 2FA service and modal
import { twoFactorService, TwoFactorStatusResponse } from '../services/twoFactor';
import TwoFactorSetupModal from '../components/TwoFactorSetupModal';
// END NEW

// Component for the form (used in Create and Edit)
const UserForm: React.FC<{
  initialData?: Partial<UserCreate>;
  onSubmit: (data: UserCreate) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  title: string;
}> = ({ initialData, onSubmit, onCancel, isLoading, title }) => {
  const [formData, setFormData] = useState<UserCreate>({
    email: initialData?.email || '',
    username: initialData?.username || '',
    password: initialData?.password || '',
    role: initialData?.role || 'cashier',
  } as UserCreate);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">{title}</h3>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email *
        </label>
        <input
          type="email"
          id="email"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          username *
        </label>
        <input
          type="text"
          id="username"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.username}
          onChange={(e) => setFormData({ ...formData, username: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password {initialData ? '(Leave blank to keep unchanged)' : '*'}
        </label>
        <input
          type="password"
          id="password"
          required={!initialData}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700">
          Role *
        </label>
        <select
          id="role"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'manager' | 'cashier' })}
        >
          <option value="cashier">Cashier</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save User'}
        </button>
      </div>
    </form>
  );
};

// Main Page Component
const UserManagement: React.FC = () => {
  const { users, isLoading, error, fetchUsers, createUser, deleteUser, toggleUserStatus, clearError } = useUsersStore();
  const { user: currentUser } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  // NEW: State for 2FA modal and status
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [user2FAStatus, setUser2FAStatus] = useState<Record<number, boolean>>({});
  // END NEW

  useEffect(() => {
    if (currentUser !== undefined) {
      setIsAuthChecked(true);
      if (currentUser?.role && ['admin', 'manager'].includes(currentUser.role)) {
        fetchUsers();
        // Fetch 2FA status for the current user only (admin/manager)
        fetch2FAStatus(currentUser.id);
      }
    }
  }, [currentUser, fetchUsers]);

  const handleCreateUser = async (userData: UserCreate) => {
    try {
      await createUser(userData);
      setIsCreateModalOpen(false);
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteUser = (user: User) => {
    if (window.confirm(`Are you sure you want to delete user "${user.username}"? This action cannot be undone.`)) {
      deleteUser(user.id).catch(console.error);
    }
  };

  const handleToggleStatus = (user: User) => {
    if (window.confirm(`Are you sure you want to ${user.is_active ? 'disable' : 'enable'} user "${user.username}"?`)) {
      toggleUserStatus(user.id).catch(console.error);
    }
  };

  // NEW: Function to fetch 2FA status for the current user (admin/manager only)
  const fetch2FAStatus = async (userId: number) => {
    try {
      const statusResponse: TwoFactorStatusResponse = await twoFactorService.getStatus();
      setUser2FAStatus(prev => ({ ...prev, [userId]: statusResponse.is_enabled }));
    } catch (error) {
      console.error('Failed to fetch 2FA status for user:', userId, error);
    }
  };

  if (!isAuthChecked) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">Loading user information...</div>
      </div>
    );
  }

  if (!currentUser || !['admin', 'manager'].includes(currentUser.role)) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Access Denied.</strong> You must be an administrator or manager to view this page.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Current user: {currentUser ? `${currentUser.username} (${currentUser.role})` : 'Not loaded'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div className="flex-1 min-w-0">
          <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
            User Management
          </h2>
        </div>
        <div className="mt-4 flex md:mt-0 md:ml-4">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(true)}
            className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add User
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          <span className="block sm:inline">{error}</span>
          <button onClick={clearError} className="absolute top-0 right-0 p-3">
            <span className="text-red-700">&times;</span>
          </button>
        </div>
      )}

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          {/* Added max-h-screen and overflow-y-auto for scrolling */}
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white max-h-[90vh] overflow-y-auto">
            <UserForm
              onSubmit={handleCreateUser}
              onCancel={() => setIsCreateModalOpen(false)}
              isLoading={isLoading}
              title="Add New User"
            />
          </div>
        </div>
      )}
      {/* NEW: 2FA Setup Modal */}
      <TwoFactorSetupModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        onSetupComplete={() => {
          if (currentUser) {
            fetch2FAStatus(currentUser.id); // Refresh status after setup
          }
          setIs2FAModalOpen(false);
        }}
      />
      {/* END NEW */}

      {/* REPLACED: JSX block with overflow-x-auto for horizontal scrolling */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg overflow-x-auto">
        {isLoading && users.length === 0 ? (
          <div className="p-6 text-center">Loading users...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                {/* 2FA Status Column - Only show for current user */}
                {currentUser && (
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">2FA</th>
                )}
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 
                        user.role === 'manager' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {/* 2FA Status Cell - Only show for current user */}
                  {currentUser && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.id === currentUser.id ? (
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${user2FAStatus[user.id] ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                          {user2FAStatus[user.id] ? 'Enabled' : 'Disabled'}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`mr-3 px-3 py-1 text-xs font-medium rounded-md ${
                        user.is_active
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                      disabled={user.id === currentUser?.id}
                      title={user.id === currentUser?.id ? "Cannot change your own status" : user.is_active ? "Disable user" : "Enable user"}
                    >
                      {user.is_active ? 'Disable' : 'Enable'}
                    </button>
                    {/* 2FA Button (only shown for the current user) */}
                    {user.id === currentUser?.id && (
                      <button
                        onClick={() => setIs2FAModalOpen(true)}
                        className={`mr-3 px-3 py-1 text-xs font-medium rounded-md ${
                          user2FAStatus[user.id]
                            ? 'bg-red-100 text-red-800 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                        }`}
                        title={user2FAStatus[user.id] ? "Disable 2FA" : "Enable 2FA"}
                      >
                        {user2FAStatus[user.id] ? 'Disable 2FA' : 'Enable 2FA'}
                      </button>
                    )}
                    {/* Delete Button */}
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      disabled={user.id === currentUser?.id}
                      title={user.id === currentUser?.id ? "You cannot delete your own account" : "Delete user"}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
