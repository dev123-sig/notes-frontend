import React, { useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { XMarkIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

const InviteUser = ({ onInvite, onCancel }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'member'
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  const { showSuccess, showError } = useNotification();

  // Predefined test emails for easy testing
  const testEmails = [
    'john.doe@example.com',
    'jane.smith@example.com'
  ];

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      console.log('Sending invitation with data:', {
        email: formData.email.trim(),
        role: formData.role
      });
      
      const response = await api.inviteUser({
        email: formData.email.trim(),
        role: formData.role
      });

      console.log('Invitation response:', response);

      if (response.success) {
        showSuccess(`Invitation sent to ${formData.email}`);
        onInvite && onInvite(response.data.invitation);
        setFormData({ email: '', role: 'member' });
        onCancel && onCancel();
      } else {
        showError(response.message || 'Failed to send invitation');
      }
    } catch (error) {
      console.error('Invitation error:', error);
      const message = error.response?.data?.message || error.message || 'Failed to send invitation';
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleTestEmailSelect = (email) => {
    setFormData(prev => ({ ...prev, email }));
    setErrors(prev => ({ ...prev, email: null }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white m-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Invite User
          </h3>
          <button
            onClick={onCancel}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={`input-field ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter email address..."
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => handleInputChange('role', e.target.value)}
              className="input-field"
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {/* Test Email Quick Select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Select Test Emails
            </label>
            <div className="grid grid-cols-1 gap-2">
              {testEmails.map((email) => (
                <button
                  key={email}
                  type="button"
                  onClick={() => handleTestEmailSelect(email)}
                  className="text-left px-3 py-2 text-sm bg-gray-50 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                >
                  {email}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.email.trim()}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InviteUser;
