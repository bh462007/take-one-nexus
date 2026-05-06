import React from 'react';
import prisma from '@/lib/prisma';
import UserManagement from '@/components/UserManagement';

export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { created_at: 'desc' }
  });

  // Convert Date objects to strings if needed for client component, 
  // but Next.js handles Dates in props for Server Components to Client Components now (partially).
  // Actually, we'll just pass them as they are.

  return (
    <div>
      <div className="admin-page-header">
        <h1 className="page-title" style={{ fontFamily: 'var(--font-title)', fontSize: '3rem', margin: '0 0 10px 0' }}>User Management</h1>
        <p className="page-subtitle" style={{ color: 'var(--text-dim)', marginBottom: '30px' }}>View, Filter and Manage TAKE ONE Creators</p>
      </div>

      <UserManagement initialUsers={users} />
    </div>
  );
}
