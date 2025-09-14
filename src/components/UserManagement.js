import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import InviteUser from './InviteUser';
import api from '../services/api';
import { 
  UserPlusIcon, 
  TrashIcon, 
  ClockIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const UserManagement = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  
  const { handleApiError } = useAuth();
  const { showSuccess, showError } = useNotification();

  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getInvitations();
      if (response.success) {
        setInvitations(response.data.invitations);
      }
    } catch (error) {
      // Check if it's an auth error
      if (!handleApiError(error)) {
        showError('Failed to fetch invitations');
      }
    } finally {
      setLoading(false);
    }
  }, [handleApiError, showError]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  const handleCancelInvitation = async (invitationId) => {
    try {
      const response = await api.cancelInvitation(invitationId);
      if (response.success) {
        showSuccess('Invitation cancelled');
        fetchInvitations();
      }
    } catch (error) {
      // Check if it's an auth error
      if (!handleApiError(error)) {
        const message = error.response?.data?.message || 'Failed to cancel invitation';
        showError(message);
      }
    }
  };

  const handleInvitationSent = () => {
    console.log('Invitation sent callback triggered');
    fetchInvitations();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRemainingTime = (expiresAt) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <UserIcon className="h-6 w-6 mr-2" />
            User Management
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Invite new users to your tenant and manage pending invitations
          </p>
        </div>
        
        <button
          onClick={() => setShowInviteForm(true)}
          className="btn-primary"
        >
          <UserPlusIcon className="h-5 w-5 mr-2" />
          Invite User
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">
          📧 How to test invitations:
        </h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Use test emails: <code className="bg-blue-100 px-1 rounded">john.doe@example.com</code> or <code className="bg-blue-100 px-1 rounded">jane.smith@example.com</code></li>
          <li>• Copy the invitation link from the invitation list</li>
          <li>• Open the link in a new browser tab/incognito to accept the invitation</li>
        </ul>
      </div>

      {/* Pending Invitations */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <ClockIcon className="h-5 w-5 mr-2" />
          Pending Invitations ({invitations.length})
        </h3>
        
        {invitations.length === 0 ? (
          <div className="text-center py-8">
            <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h4 className="mt-2 text-sm font-medium text-gray-900">No pending invitations</h4>
            <p className="mt-1 text-sm text-gray-500">
              Invite users to start collaborating on notes
            </p>
            <div className="mt-6">
              <button 
                onClick={() => setShowInviteForm(true)}
                className="btn-primary"
              >
                <UserPlusIcon className="h-5 w-5 mr-2" />
                Send First Invitation
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {invitations.map((invitation) => (
              <div 
                key={invitation.id} 
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {invitation.email}
                      </p>
                      <p className="text-xs text-gray-500">
                        Role: <span className="font-medium">{invitation.role}</span> • 
                        Invited by: {invitation.invitedBy} • 
                        {getRemainingTime(invitation.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-xs text-gray-600">
                      Sent: {formatDate(invitation.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleCancelInvitation(invitation.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Cancel invitation"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite User Modal */}
      {showInviteForm && (
        <InviteUser
          onInvite={handleInvitationSent}
          onCancel={() => setShowInviteForm(false)}
        />
      )}
    </div>
  );
};

export default UserManagement;
