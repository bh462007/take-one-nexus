import React from 'react';
import prisma from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' }
  });

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="page-title">Crew Database</h1>
        <p className="page-subtitle">Accessing Encrypted Creator Profiles & Designations</p>
      </div>

      <UserManagement initialUsers={users} />
    </div>
  );
}
