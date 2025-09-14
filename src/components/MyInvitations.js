import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';
import { 
  EnvelopeIcon, 
  ClockIcon,
  UserIcon,
  UserGroupIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

const MyInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { user, handleApiError } = useAuth();
  const { showSuccess, showError } = useNotification();

  const fetchMyInvitations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.getMyInvitations();
      if (response.success) {
        setInvitations(response.data.invitations);
      }
    } catch (error) {
      if (!handleApiError(error)) {
        showError('Failed to fetch invitations');
      }
    } finally {
      setLoading(false);
    }
  }, [handleApiError, showError]);

  useEffect(() => {
    fetchMyInvitations();
  }, [fetchMyInvitations]);

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
    const expires = new Date(expiresAt);
    const diffInHours = Math.ceil((expires - now) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Expires soon';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours === 1 ? '' : 's'} left`;
    } else {
      const diffInDays = Math.ceil(diffInHours / 24);
      return `${diffInDays} day${diffInDays === 1 ? '' : 's'} left`;
    }
  };

  const handleAcceptInvitation = (acceptLink) => {
    // Open the invitation link in a new tab
    window.open(acceptLink, '_blank');
    showSuccess('Opening invitation link in new tab');
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <EnvelopeIcon className="h-6 w-6 mr-2" />
            My Invitations
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            Invitations sent to your email address ({user?.email})
          </p>
        </div>
      </div>

      {invitations.length === 0 ? (
        <div className="text-center py-12">
          <EnvelopeIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No invitations</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have any pending invitations at the moment.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {invitations.map((invitation) => (
              <li key={invitation.id}>
                <div className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserGroupIcon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-sm font-medium text-gray-900">
                          {invitation.tenant.name}
                        </p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          invitation.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {invitation.role}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 space-x-4">
                        <div className="flex items-center">
                          <UserIcon className="h-4 w-4 mr-1" />
                          Invited by {invitation.invitedBy}
                        </div>
                        <div className="flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1" />
                          {getRemainingTime(invitation.expiresAt)}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-400 mt-1">
                        Received {formatDate(invitation.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleAcceptInvitation(invitation.acceptLink)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                      <ArrowTopRightOnSquareIcon className="h-4 w-4 mr-1" />
                      Accept
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {invitations.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                How to accept invitations
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  Click "Accept" to open the invitation link in a new tab. You'll be able to create 
                  an account or join the organization if you don't already have access.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyInvitations;
