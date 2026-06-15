import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please login.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const title = String(body?.title || '').trim();

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Project title is required' },
        { status: 400 }
      );
    }

    const script = await prisma.script.create({
      data: {
        user_id: user.id,
        title,
        genre: body?.genre ? String(body.genre).trim() : null,
        synopsis: body?.synopsis ? String(body.synopsis).trim() : null,
        roles_needed: body?.roles_needed ? String(body.roles_needed).trim() : null,
        work_type: body?.work_type ? String(body.work_type).trim() : 'Script',
        media_links: body?.media_links ? String(body.media_links).trim() : null,
        role_data: body?.role_data ? String(body.role_data) : null,
        poster_url: body?.poster_url ? String(body.poster_url).trim() : null,
        status: 'Portfolio Item',
        payment_status: 'portfolio',
        payment_verified: false,
        approval_status: 'portfolio',
        moderation_notes: 'Portfolio item - exempt from moderation queue',
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Portfolio item added successfully',
        data: script,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Portfolio insert error:', error);
    return NextResponse.json(
      { success: false, message: 'Could not add portfolio item' },
      { status: 500 }
    );
  }
}
