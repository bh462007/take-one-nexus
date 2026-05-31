'use client';

import { useEmailVerificationReminder } from '@/lib/useEmailVerificationReminder';

/**
 * Client wrapper component to initialize email verification reminder triggers
 * This component uses the hook to manage popup triggers for login, register, profile, and periodic checks
 */
export default function EmailVerificationReminderWrapper() {
  useEmailVerificationReminder();
  return null;
}
