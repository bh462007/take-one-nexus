'use server';

import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(2, 'Name is too short'),
  email: z.string().email('Invalid email address'),
  role: z.string().min(1, 'Role is required'),
  college: z.string().optional(),
  city: z.string().optional(),
  bio: z.string().optional(),
});

function generatePassword(length = 8) {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let retVal = "";
  // Ensure at least one upper, one lower, and one number
  retVal += "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[Math.floor(Math.random() * 26)];
  retVal += "abcdefghijklmnopqrstuvwxyz"[Math.floor(Math.random() * 26)];
  retVal += "0123456789"[Math.floor(Math.random() * 10)];
  
  for (let i = 3; i < length; ++i) {
    retVal += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  // Shuffle the password
  return retVal.split('').sort(() => 0.5 - Math.random()).join('');
}

export async function addUser(formData: any) {
  try {
    const validated = userSchema.parse(formData);
    
    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: validated.email }
    });
    
    if (existing) {
      return { success: false, error: 'Email already registered' };
    }

    const rawPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    const newUser = await prisma.user.create({
      data: {
        ...validated,
        password: hashedPassword,
      }
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');
    
    return { success: true, password: rawPassword, user: newUser };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: error.message || 'Failed to create user' };
  }
}

export async function deleteUser(id: number) {
  try {
    // Prevent self-deletion would be good, but we don't have current user ID here easily 
    // unless we get it from session. For now we just delete.
    
    await prisma.user.delete({
      where: { id }
    });

    revalidatePath('/admin/users');
    revalidatePath('/admin');
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to delete user' };
  }
}
