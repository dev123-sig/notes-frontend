import React from 'react';
import { useNotification } from '../contexts/NotificationContext';
import { XMarkIcon } from '@heroicons/react/24/outline';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  const getNotificationStyles = (type) => {
    const baseStyles = "mb-3 p-4 rounded-md border flex items-center justify-between animate-fade-in";
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-50 border-green-200 text-green-800`;
      case 'error':
        return `${baseStyles} bg-red-50 border-red-200 text-red-800`;
      case 'warning':
        return `${baseStyles} bg-yellow-50 border-yellow-200 text-yellow-800`;
      default:
        return `${baseStyles} bg-blue-50 border-blue-200 text-blue-800`;
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-full">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={getNotificationStyles(notification.type)}
        >
          <span className="flex-1 text-sm font-medium">{notification.message}</span>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export default NotificationContainer;
