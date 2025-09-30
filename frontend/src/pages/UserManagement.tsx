import React, { useEffect, useState } from 'react';
import { useUsersStore } from '../hooks/useUsers';
import { useAuthStore } from '../hooks/useAuth';
import { User, UserCreate } from '../types';
import BackButton from '../components/BackButton';
import { twoFactorService, TwoFactorStatusResponse } from '../services/twoFactor';
import TwoFactorSetupModal from '../components/TwoFactorSetupModal';
import UserForm from "../components/UserForm";
import { rolesService, Role } from '../services/roles';

const UserManagement: React.FC = () => {
  const { users, isLoading, error, fetchUsers, createUser, deleteUser, clearError, toggleUserStatus } = useUsersStore();
  const { user: currentUser, hasPermission } = useAuthStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [assigningRole, setAssigningRole] = useState<number | null>(null);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [user2FAStatus, setUser2FAStatus] = useState<Record<number, boolean>>({});

  useEffect(() => {
    if (currentUser !== undefined) {
      setIsAuthChecked(true);
      if (currentUser && hasPermission('user:read')) {
        fetchUsers();
        fetch2FAStatus(currentUser.id);
      }
      if (currentUser && hasPermission('role:manage')) {
        fetchRoles();
      }
    }
  }, [currentUser, fetchUsers, hasPermission]);

  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const rolesData = await rolesService.getRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

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

  // ✅ FIXED: Updated to match the store function signature
  const handleToggleStatus = async (user: User) => {
    if (window.confirm(`Are you sure you want to ${user.is_active ? 'disable' : 'enable'} user "${user.username}"?`)) {
      try {
        await toggleUserStatus(user.id);
        // No need to refresh - the store already updates the local state
      } catch (error) {
        console.error('Failed to toggle user status:', error);
        // Error is already handled in the store
      }
    }
  };

  const handleRoleChange = async (userId: number, roleId: number) => {
    setAssigningRole(userId);
    try {
      await rolesService.assignRoleToUser(userId, roleId);
      await fetchUsers();
    } catch (error) {
      console.error('Failed to assign role:', error);
      alert('Failed to assign role. Please try again.');
    } finally {
      setAssigningRole(null);
    }
  };

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

  if (!currentUser || !hasPermission('user:read')) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                <strong>Access Denied.</strong> You need the 'user:read' permission to view this page.
              </p>
              <p className="text-xs text-yellow-600 mt-1">
                Current user: {currentUser ? currentUser.username : 'Not loaded'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
        <div className="mb-4">
          <BackButton />
        </div>
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

      <TwoFactorSetupModal
        isOpen={is2FAModalOpen}
        onClose={() => setIs2FAModalOpen(false)}
        onSetupComplete={() => {
          if (currentUser) {
            fetch2FAStatus(currentUser.id);
          }
          setIs2FAModalOpen(false);
        }}
      />

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
                    {hasPermission('role:manage') ? (
                      isLoadingRoles || assigningRole === user.id ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        <select
                          className="text-xs border rounded p-1 bg-white"
                          value={roles.find(r => r.name === user.role_name)?.id || ''}
                          onChange={(e) => handleRoleChange(user.id, parseInt(e.target.value))}
                          disabled={assigningRole !== null}
                        >
                          <option value="">Select Role</option>
                          {roles.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.name}
                            </option>
                          ))}
                        </select>
                      )
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        {user.role_name || 'N/A'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
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
                    {/* ✅ FIXED: Status toggle button now works */}
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
