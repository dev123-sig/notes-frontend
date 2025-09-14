import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import api from '../services/api';

const AcceptInvitation = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, user } = useAuth();
  const { showSuccess, showError } = useNotification();
  
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [invitation, setInvitation] = useState(null);
  const [validationError, setValidationError] = useState(null);

  const handleAutoAcceptForLoggedInUser = React.useCallback(async () => {
    try {
      showSuccess('You are already logged in. Accepting invitation...');
      
      // For existing users, we just need to mark the invitation as accepted
      const response = await api.acceptInvitation(token, {
        name: user.name || 'User', // Use existing user name or default
        password: 'existing-user', // Placeholder since user already exists
        confirmPassword: 'existing-user'
      });

      if (response.success) {
        showSuccess('Invitation accepted successfully!');
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to accept invitation';
      showError(message);
    }
  }, [token, user, showSuccess, showError, navigate]);

  const validateToken = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.validateInvitationToken(token);
      if (response.success) {
        setInvitation(response.data.invitation);
        
        // If user is already logged in and the invitation is for the same email
        if (isAuthenticated && user?.email === response.data.invitation.email) {
          // Auto-accept the invitation for already logged-in users
          await handleAutoAcceptForLoggedInUser();
          return;
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Invalid or expired invitation link';
      setValidationError(message);
    } finally {
      setIsLoading(false);
    }
  }, [token, isAuthenticated, user?.email, handleAutoAcceptForLoggedInUser]);

  React.useEffect(() => {
    // Validate token on component mount
    validateToken();
  }, [validateToken]);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      showError('Password must be at least 6 characters long');
      return;
    }

    if (!formData.name.trim()) {
      showError('Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await api.acceptInvitation(token, {
        name: formData.name.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword
      });

      if (response.success) {
        showSuccess('Account created successfully! Logging you in...');
        
        // Auto-login the user
        const { user, token: authToken } = response.data;
        await login(user, authToken);
        
        navigate('/dashboard');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create account';
      showError(message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Invalid Invitation</h3>
            <p className="mt-2 text-sm text-gray-500">{validationError}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/login')}
                className="btn-primary"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is logged in but invitation is for different email
  if (isAuthenticated && invitation && user?.email !== invitation.email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Different Account Required</h3>
            <p className="mt-2 text-sm text-gray-500">
              This invitation is for <strong>{invitation.email}</strong> but you're logged in as <strong>{user.email}</strong>
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={() => navigate('/login')}
                className="w-full btn-primary"
              >
                Switch Account
              </button>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full btn-secondary"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Accept Invitation
          </h2>
          {invitation && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                You've been invited to join <span className="font-medium">{invitation.tenantSlug}</span>
              </p>
              <p className="text-sm text-gray-600">
                Email: <span className="font-medium">{invitation.email}</span>
              </p>
              <p className="text-sm text-gray-600">
                Role: <span className="font-medium">{invitation.role}</span>
              </p>
            </div>
          )}
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Choose a password (min 6 characters)"
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
          
          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              Already have an account? Sign in
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvitation;
