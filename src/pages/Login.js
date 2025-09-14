import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import NotificationContainer from '../components/NotificationContainer';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAccount, setSelectedAccount] = useState('');
  
  const { login, loading, isAuthenticated, error, clearError } = useAuth();
  const { showError, showSuccess } = useNotification();

  const testAccounts = [
    { email: 'admin@acme.test', label: 'Acme Admin', role: 'Admin', tenant: 'Acme' },
    { email: 'user@acme.test', label: 'Acme Member', role: 'Member', tenant: 'Acme' },
    { email: 'admin@globex.test', label: 'Globex Admin', role: 'Admin', tenant: 'Globex' },
    { email: 'user@globex.test', label: 'Globex Member', role: 'Member', tenant: 'Globex' }
  ];

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!email || !password) {
      showError('Please enter both email and password');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      showSuccess('Login successful!');
    } else {
      showError(result.message || 'Login failed');
    }
  };

  const handleTestAccountSelect = (testEmail) => {
    setEmail(testEmail);
    setPassword('password');
    setSelectedAccount(testEmail);
  };

  return (
    <div className="min-h-screen glass relative flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="absolute inset-0 animated-gradient opacity-20"></div>
      <NotificationContainer />
      
      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-4xl font-bold text-gradient">
          Sign in to Notes SaaS
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: 'var(--text-secondary)' }}>
          Multi-tenant Notes Application
        </p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="glass-light rounded-2xl p-8 shadow-glow fade-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {error && (
              <div className="notification error scale-in">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

            <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t" style={{ borderColor: 'var(--border-primary)' }} />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 glass-light rounded-md" style={{ color: 'var(--text-secondary)' }}>Test Accounts</span>
              </div>
            </div>            <div className="mt-6">
              <div className="grid grid-cols-1 gap-3">
                {testAccounts.map((account) => (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleTestAccountSelect(account.email)}
                    className={`w-full flex justify-between items-center px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 glow-hover ${
                      selectedAccount === account.email
                        ? 'border-gradient bg-gradient-primary text-white shadow-glow'
                        : 'glass-light hover:border-gradient'
                    }`}
                    style={{ 
                      color: selectedAccount === account.email ? 'white' : 'var(--text-primary)',
                      border: selectedAccount === account.email ? 'none' : '1px solid var(--border-primary)'
                    }}
                  >
                    <span>{account.label}</span>
                    <span className="text-xs opacity-70">
                      {account.role} • {account.tenant}
                    </span>
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-center" style={{ color: 'var(--text-muted)' }}>
                All test accounts use password: <code style={{ 
                  background: 'var(--bg-secondary)', 
                  color: 'var(--accent-primary)',
                  padding: '2px 6px',
                  borderRadius: '4px'
                }}>password</code>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
