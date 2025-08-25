import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // CORRECT WAY: Use a selector to subscribe to specific state pieces
  const { login, verify2FA, clear2FA } = useAuthStore();
  const requires2FA = useAuthStore((state) => state.requires2FA);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const authLoading = useAuthStore((state) => state.isLoading);
  const navigate = useNavigate();

  // NEW: This is the correct way to handle navigation based on auth state
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Redirect if authenticated (for non-2FA users)
    }
  }, [isAuthenticated, navigate]);

  // Reset the form if the user comes back to the login page after 2FA was required
  //useEffect(() => {
    //if (requires2FA) {
      //clear2FA();
    //}
  //}, [clear2FA, requires2FA]);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login({ identifier, password });
      // DO NOT check state here. Let the useEffect above handle navigation.
      // The store update (isAuthenticated=true OR requires2FA=true) will trigger a re-render.
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handle2FALogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit code');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      await verify2FA(verificationCode);
      // navigation will be handled by the useEffect watching isAuthenticated
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  const useTestCredentials = () => {
    setIdentifier('cashier1');
    setPassword('cashier123');
  };

  const useTestEmailCredentials = () => {
    setIdentifier('cashier@example.com');
    setPassword('cashier123');
  };

  // If 2FA is required, show the code input form
  if (requires2FA) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Two-Factor Verification
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handle2FALogin}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="verificationCode" className="sr-only">
                Verification Code
              </label>
              <input
                id="verificationCode"
                name="verificationCode"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => {
                  const onlyNums = e.target.value.replace(/\D/g, '');
                  setVerificationCode(onlyNums.slice(0, 6));
                }}
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? 'Verifying...' : 'Verify'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={clear2FA}
                className="text-blue-600 hover:text-blue-500 text-sm"
              >
                ← Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Original Login Form (shown if requires2FA is false)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
            Sign in to Bizzy POS
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Use your email address or username
          </p>

          <div className="mt-4 text-center space-x-4">
            <button
              onClick={useTestCredentials}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Use Test Username
            </button>
            <button
              onClick={useTestEmailCredentials}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Use Test Email
            </button>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="identifier" className="sr-only">
                Email or Username
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email or Username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || authLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>

          <div className="text-center mt-4">
            <Link
              to="/forgot-password"
              className="text-blue-600 hover:text-blue-500 text-sm"
            >
              Forgot your password?
            </Link>
	    <Link
    	      to="/register"
    	      className="text-blue-600 hover:text-blue-500 text-sm block"
            >
    	      Create new account
  	    </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
