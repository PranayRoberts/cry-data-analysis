import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Lock, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuth();

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Basic validation
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password');
      setIsLoading(false);
      return;
    }

    // Simulate network delay for better UX
    await new Promise(resolve => setTimeout(resolve, 500));

    const success = login(username, password);
    
    if (!success) {
      setError('Invalid credentials. Please try again.');
      setPassword(''); // Clear password on failed attempt
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-red-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-0">
            Analytics Dashboard
          </h1>
        </div>

        {/* Login Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
              <ShieldCheck className="text-yellow-600 dark:text-yellow-400" size={32} />
            </div>
          </div>

          <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-white mb-6">
            Sign In
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400 text-center">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                </div>
                {/* Inline style required: Overrides global dark mode CSS that incorrectly applies white text to all inputs */}
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500 transition shadow-sm"
                  style={{ color: '#111827' }}
                  placeholder="Enter username"
                  autoComplete="username"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                </div>
                {/* Inline style required: Overrides global dark mode CSS that incorrectly applies white text to all inputs */}
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 bg-white dark:bg-gray-900 placeholder-gray-400 dark:placeholder-gray-500 transition shadow-sm"
                  style={{ color: '#111827' }}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  disabled={isLoading}
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition mt-2">
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ml-2"
                    disabled={isLoading}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={22} />}
                  </button>
                </div>
              </div>
            </div>
            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold py-3.5 px-4 rounded-lg transition duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <span className="inline-flex items-center justify-center space-x-2 text-base">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Security Notice */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center space-y-3 text-xs text-gray-500 dark:text-gray-400">
              <p className="leading-relaxed max-w-prose">
                <span className="inline-block mr-2 align-middle"><Lock size={16} /></span>
                This is a secure system. Your session will automatically expire after 2 hours of inactivity. After 5 failed login attempts, access will be temporarily locked.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p className="text-center">
            © 2025 CRY. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
