import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../hooks/useAuth';
import { authService } from '../services/auth';

// Common currency options for the system
const CURRENCY_OPTIONS = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
];

const Register: React.FC = () => {
  const [isBusinessRegistration, setIsBusinessRegistration] = useState(true);
  const [formData, setFormData] = useState({
    // Business fields
    businessName: '',
    currencyCode: '', // Empty default - user must select
    // Owner fields
    email: '',
    username: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user: currentUser } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Validate currency selection for business registration
    if (isBusinessRegistration && !formData.currencyCode) {
      setError('Please select a currency for your business');
      setIsLoading(false);
      return;
    }

    try {
      if (isBusinessRegistration) {
        // Business registration flow - USING THE NEW ENDPOINT
        await authService.registerBusiness(
          {
            name: formData.businessName,
            currency_code: formData.currencyCode,
          },
          {
            email: formData.email,
            username: formData.username,
            password: formData.password,
          }
        );
        
        // Redirect to dashboard on successful registration
        navigate('/');
        window.location.reload(); // Refresh to load new business context
      } else {
        // Individual user registration (keep existing disabled behavior)
        setError('User registration is currently only available to administrators.');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // If user is already logged in, redirect to dashboard
  if (currentUser) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            {isBusinessRegistration ? 'Create Business Account' : 'Create User Account'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              sign in to existing account
            </Link>
          </p>
        </div>

        {/* Registration type toggle */}
        <div className="flex justify-center space-x-4">
          <button
            type="button"
            onClick={() => setIsBusinessRegistration(true)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              isBusinessRegistration
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            New Business
          </button>
          <button
            type="button"
            onClick={() => setIsBusinessRegistration(false)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              !isBusinessRegistration
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Join Existing
          </button>
        </div>

        {!isBusinessRegistration && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
            <p className="text-sm text-yellow-700">
              <strong>Registration Update:</strong> User registration for existing businesses is currently being updated for the new security system. Please contact an administrator for account creation.
            </p>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="space-y-4">
            {isBusinessRegistration && (
              <>
                <div>
                  <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                    Business Name *
                  </label>
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    placeholder="Enter your business name"
                  />
                </div>

                <div>
                  <label htmlFor="currencyCode" className="block text-sm font-medium text-gray-700">
                    Business Currency *
                  </label>
                  <select
                    id="currencyCode"
                    name="currencyCode"
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    value={formData.currencyCode}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Currency</option>
                    {CURRENCY_OPTIONS.map(currency => (
                      <option key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name} ({currency.symbol})
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="owner@yourbusiness.com"
              />
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Create a secure password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>

          {isBusinessRegistration && (
            <div className="text-center">
              <p className="text-sm text-gray-600">
                By creating an account, you'll be the owner administrator of your new business.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Register;
