import React from 'react';
import AddUserForm from '@/components/AddUserForm';

export default function AddUserPage() {
  return (
    <div>
      <div className="admin-page-header">
        <h1 className="page-title">New Crew Signal</h1>
        <p className="page-subtitle">Onboarding New Creator Designation to Control Room</p>
      </div>

      <AddUserForm />
    </div>
  );
}
