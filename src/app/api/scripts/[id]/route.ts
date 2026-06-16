import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import prisma from '@/lib/prisma';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isPortfolioScript(script: {
  status?: string | null;
  payment_status?: string | null;
  approval_status?: string | null;
}) {
  return String(script.payment_status || '').toLowerCase() === 'portfolio' ||
    String(script.approval_status || '').toLowerCase() === 'portfolio' ||
    String(script.status || '').toLowerCase() === 'portfolio item';
}

async function getOwnedScript(scriptId: number, userId: number) {
  const script = await prisma.script.findUnique({ where: { id: scriptId } });

  if (!script) {
    return { error: NextResponse.json({ success: false, message: 'Script not found' }, { status: 404 }) };
  }

  if (Number(script.user_id) !== Number(userId)) {
    return {
      error: NextResponse.json(
        { success: false, message: 'Unauthorized to edit this script' },
        { status: 403 }
      ),
    };
  }

  return { script };
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please login.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const scriptId = Number(id);
    if (!Number.isFinite(scriptId)) {
      return NextResponse.json({ success: false, message: 'Invalid script id' }, { status: 400 });
    }

    const owned = await getOwnedScript(scriptId, user.id);
    if (owned.error) return owned.error;

    if (!user.email_verified && owned.script && !isPortfolioScript(owned.script)) {
      return NextResponse.json(
        { success: false, message: 'Email verification required to edit submitted scripts.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const title = String(body?.title || '').trim();

    if (!title) {
      return NextResponse.json(
        { success: false, message: 'Script title is required' },
        { status: 400 }
      );
    }

    const script = await prisma.script.update({
      where: { id: scriptId },
      data: {
        title,
        genre: body?.genre ? String(body.genre).trim() : null,
        synopsis: body?.synopsis ? String(body.synopsis).trim() : null,
        roles_needed: body?.roles_needed ? String(body.roles_needed).trim() : null,
        status: body?.status ? String(body.status).trim() : 'Open for collaboration',
        work_type: body?.work_type ? String(body.work_type).trim() : 'Script',
        media_links: body?.media_links ? String(body.media_links).trim() : null,
        role_data: body?.role_data ? String(body.role_data) : null,
        poster_url: body?.poster_url ? String(body.poster_url).trim() : null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Script updated successfully',
      data: script,
    });
  } catch (error) {
    console.error('Script update error:', error);
    return NextResponse.json(
      { success: false, message: 'Could not update script' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required. Please login.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const scriptId = Number(id);
    if (!Number.isFinite(scriptId)) {
      return NextResponse.json({ success: false, message: 'Invalid script id' }, { status: 400 });
    }

    const owned = await getOwnedScript(scriptId, user.id);
    if (owned.error) return owned.error;

    if (!user.email_verified && owned.script && !isPortfolioScript(owned.script)) {
      return NextResponse.json(
        { success: false, message: 'Email verification required to delete submitted scripts.' },
        { status: 403 }
      );
    }

    await prisma.collaborationRequest.deleteMany({ where: { script_id: scriptId } });
    await prisma.script.delete({ where: { id: scriptId } });

    return NextResponse.json({
      success: true,
      message: 'Script deleted successfully',
    });
  } catch (error) {
    console.error('Script deletion error:', error);
    return NextResponse.json(
      { success: false, message: 'Could not delete script' },
      { status: 500 }
    );
  }
}
