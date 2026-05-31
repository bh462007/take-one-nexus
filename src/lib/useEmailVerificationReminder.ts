'use client';

import { useEffect, useRef } from 'react';

/**
 * Hook to manage email verification reminder popup triggers
 * Shows popup after login, registration, profile access, and periodically during sessions
 */
export function useEmailVerificationReminder() {
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastCheckRef = useRef<number>(0);

  useEffect(() => {
    // Function to trigger popup check
    const triggerPopupCheck = (trigger: 'login' | 'register' | 'profile' | 'periodic') => {
      // Dispatch custom event that EmailVerificationReminderPopup listens to
      window.dispatchEvent(new CustomEvent('email-verification-reminder', { 
        detail: { trigger } 
      }));
    };

    // Check for URL parameters indicating login/register
    const urlParams = new URLSearchParams(window.location.search);
    const authParam = urlParams.get('auth');

    if (authParam === 'login') {
      // Trigger after successful login (delay to allow login to complete)
      setTimeout(() => triggerPopupCheck('login'), 2000);
    } else if (authParam === 'register') {
      // Trigger after successful registration
      setTimeout(() => triggerPopupCheck('register'), 2000);
    }

    // Check if on profile page
    if (window.location.pathname === '/profile') {
      setTimeout(() => triggerPopupCheck('profile'), 1500);
    }

    // Periodic check during active sessions (every 30 minutes)
    const startPeriodicCheck = () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }

      checkIntervalRef.current = setInterval(() => {
        const now = Date.now();
        const timeSinceLastCheck = now - lastCheckRef.current;
        
        // Only check if 30 minutes have passed since last check
        if (timeSinceLastCheck > 30 * 60 * 1000) {
          lastCheckRef.current = now;
          triggerPopupCheck('periodic');
        }
      }, 5 * 60 * 1000); // Check every 5 minutes, but only trigger if 30 mins have passed
    };

    startPeriodicCheck();

    // Listen for successful login events (if your app dispatches them)
    const handleLoginSuccess = () => {
      setTimeout(() => triggerPopupCheck('login'), 1500);
    };

    const handleRegistrationSuccess = () => {
      setTimeout(() => triggerPopupCheck('register'), 1500);
    };

    window.addEventListener('login-success', handleLoginSuccess);
    window.addEventListener('registration-success', handleRegistrationSuccess);

    // Cleanup
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
      window.removeEventListener('login-success', handleLoginSuccess);
      window.removeEventListener('registration-success', handleRegistrationSuccess);
    };
  }, []);

  return null;
}
