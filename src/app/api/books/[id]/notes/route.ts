import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { curator, note } = body;

    if (!curator || !note) {
      return NextResponse.json({ error: 'Name and content are required' }, { status: 400 });
    }

    const curationNote = await prisma.curationNote.create({
      data: {
        bookId: resolvedParams.id,
        curator: curator.trim(),
        note: note.trim(),
      },
    });

    return NextResponse.json(curationNote, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to create curation note' }, { status: 500 });
  }
}
