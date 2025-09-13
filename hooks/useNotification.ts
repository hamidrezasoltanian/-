// This file was renamed to useNotification.js to fix MIME type issues on static hosting.
import React, { useState, useCallback } from 'react';

export const useNotification = () => {
  const [notification, setNotification] = useState({ message: '', type: 'success', visible: false });

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  const NotificationComponent = () => {
    if (!notification.visible) return null;

    const baseClasses = 'fixed top-5 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-2xl z-[1000] text-white transition-all duration-300';
    const typeClasses = notification.type === 'error' ? 'bg-red-500' : 'bg-green-500';
    const animationClasses = notification.visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-5';

    return React.createElement(
      'div',
      { className: `${baseClasses} ${typeClasses} ${animationClasses}` },
      notification.message
    );
  };

  return { showNotification, NotificationComponent };
};
