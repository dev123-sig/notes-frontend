import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import NotificationContainer from '../components/NotificationContainer';
import NotesManager from '../components/NotesManager';
import TenantUpgrade from '../components/TenantUpgrade';
import UserManagement from '../components/UserManagement';
import MyInvitations from '../components/MyInvitations';
import api from '../services/api';
import { 
  DocumentTextIcon, 
  UserIcon, 
  ArrowRightOnRectangleIcon,
  ChartBarIcon,
  UsersIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const { showError } = useNotification();
  const location = useLocation();
  
  const [tenantStats, setTenantStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTenantStats();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchTenantStats = async () => {
    try {
      const response = await api.getTenantStats();
      if (response.success) {
        setTenantStats(response.data);
      }
    } catch (error) {
      showError('Failed to fetch tenant statistics');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const navigation = [
    { name: 'Notes', href: '/dashboard', icon: DocumentTextIcon, current: location.pathname === '/dashboard' },
    { name: 'Statistics', href: '/dashboard/stats', icon: ChartBarIcon, current: location.pathname === '/dashboard/stats' },
    { name: 'Invitations', href: '/dashboard/invitations', icon: EnvelopeIcon, current: location.pathname === '/dashboard/invitations' },
  ];

  // Add Users tab for admin users
  if (user?.role === 'admin') {
    navigation.push({
      name: 'Users', 
      href: '/dashboard/users', 
      icon: UsersIcon, 
      current: location.pathname === '/dashboard/users'
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen glass flex items-center justify-center">
        <div className="spinner scale-in" style={{ width: '48px', height: '48px' }}></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <NotificationContainer />
      
      {/* Header */}
      <header className="glass-light shadow-glow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gradient">Notes SaaS</h1>
              {tenantStats && (
                <div className="ml-4 flex items-center space-x-4">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-primary text-white">
                    {tenantStats.tenant.name}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    tenantStats.tenant.plan === 'pro' 
                      ? 'bg-gradient-accent text-white' 
                      : 'bg-gradient-secondary text-white'
                  }`}>
                    {tenantStats.tenant.plan.toUpperCase()} Plan
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <UserIcon className="h-5 w-5" style={{ color: 'var(--text-secondary)' }} />
                <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{user?.email}</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium glass-light" style={{ color: 'var(--text-primary)' }}>
                  {user?.role}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-secondary glow-hover"
              >
                <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <nav className="flex space-x-8 mb-8">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${
                  item.current
                    ? 'border-gradient text-gradient'
                    : 'border-transparent hover:border-gradient'
                } whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm flex items-center transition-all duration-300 glow-hover rounded-t-lg`}
                style={{ 
                  color: item.current ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  background: item.current ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
                }}
              >
                <Icon className="h-5 w-5 mr-2" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Content */}
        <Routes>
          <Route 
            path="/" 
            element={
              <NotesManager 
                tenantStats={tenantStats} 
                onStatsUpdate={fetchTenantStats} 
              />
            } 
          />
          <Route 
            path="/stats" 
            element={
              <div className="space-y-6 fade-in">
                <div className="card glow-hover">
                  <h3 className="text-lg font-medium mb-4" style={{ color: 'var(--text-primary)' }}>Tenant Statistics</h3>
                  {tenantStats && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="glass-light p-4 rounded-lg glow-hover">
                        <dt className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Tenant</dt>
                        <dd className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{tenantStats.tenant.name}</dd>
                      </div>
                      <div className="glass-light p-4 rounded-lg glow-hover">
                        <dt className="text-sm font-medium" style={{ color: 'var(--accent-success)' }}>Plan</dt>
                        <dd className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{tenantStats.tenant.plan.toUpperCase()}</dd>
                      </div>
                      <div className="glass-light p-4 rounded-lg glow-hover">
                        <dt className="text-sm font-medium" style={{ color: 'var(--accent-secondary)' }}>Notes Created</dt>
                        <dd className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{tenantStats.noteCount}</dd>
                      </div>
                      <div className="glass-light p-4 rounded-lg glow-hover">
                        <dt className="text-sm font-medium" style={{ color: 'var(--accent-warning)' }}>Note Limit</dt>
                        <dd className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                          {tenantStats.noteLimit ? tenantStats.noteLimit : 'Unlimited'}
                        </dd>
                      </div>
                    </div>
                  )}
                </div>
                
                {user?.role === 'admin' && tenantStats?.tenant.plan === 'free' && (
                  <TenantUpgrade 
                    tenant={tenantStats.tenant} 
                    onUpgrade={fetchTenantStats} 
                  />
                )}
              </div>
            } 
          />
          <Route 
            path="/invitations" 
            element={<MyInvitations />} 
          />
          {user?.role === 'admin' && (
            <Route 
              path="/users" 
              element={<UserManagement />} 
            />
          )}
        </Routes>
      </div>
    </div>
  );
};

export default Dashboard;
