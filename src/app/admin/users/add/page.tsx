import React from 'react';
import AddUserForm from '@/components/AddUserForm';

export default function AddUserPage() {
  return (
    <div>
      <div className="admin-page-header">
        <h1 className="page-title" style={{ fontFamily: 'var(--font-title)', fontSize: '3rem', margin: '0 0 10px 0' }}>Add New Creator</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>Manually onboard a new member to the TAKE ONE ecosystem</p>
      </div>

      <AddUserForm />
    </div>
  );
}
