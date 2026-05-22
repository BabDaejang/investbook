import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { curator, note } = body;

    const dataToUpdate: any = {};
    if (curator !== undefined) dataToUpdate.curator = curator.trim();
    if (note !== undefined) dataToUpdate.note = note.trim();

    const curationNote = await prisma.curationNote.update({
      where: { id: resolvedParams.noteId },
      data: dataToUpdate,
    });

    return NextResponse.json(curationNote);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update curation note' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ noteId: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.curationNote.delete({
      where: { id: resolvedParams.noteId },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete curation note' }, { status: 500 });
  }
}
