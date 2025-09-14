import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';
import { ArrowUpIcon } from '@heroicons/react/24/outline';

const TenantUpgrade = ({ tenant, onUpgrade }) => {
  const [loading, setLoading] = useState(false);
  const { showSuccess, showError } = useNotification();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const response = await api.upgradeTenant(tenant.slug);
      if (response.success) {
        showSuccess('Successfully upgraded to Pro plan!');
        onUpgrade && onUpgrade();
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to upgrade tenant';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Upgrade to Pro</h3>
          <p className="text-sm text-gray-600 mt-1">
            Unlock unlimited notes and advanced features for your team.
          </p>
        </div>
        <button
          onClick={handleUpgrade}
          disabled={loading}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowUpIcon className="h-5 w-5 mr-2" />
          {loading ? 'Upgrading...' : 'Upgrade Now'}
        </button>
      </div>
      
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-900">Free Plan</h4>
          <ul className="mt-2 text-sm text-gray-600 space-y-1">
            <li>• Up to 3 notes</li>
            <li>• Basic features</li>
            <li>• Limited storage</li>
          </ul>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900">Pro Plan</h4>
          <ul className="mt-2 text-sm text-blue-800 space-y-1">
            <li>• Unlimited notes</li>
            <li>• Advanced features</li>
            <li>• Priority support</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TenantUpgrade;
