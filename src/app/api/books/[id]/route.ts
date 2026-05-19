import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const book = await prisma.book.findUnique({
      where: { id: resolvedParams.id },
      include: {
        categories: {
          include: { category: true }
        }
      }
    });
    
    if (!book) return NextResponse.json({ error: 'Book not found' }, { status: 404 });
    return NextResponse.json(book);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch book' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { categoryIds, note } = body;

    const dataToUpdate: any = {};
    if (note !== undefined) dataToUpdate.note = note;
    
    if (categoryIds !== undefined) {
      dataToUpdate.categories = {
        deleteMany: {},
        create: categoryIds.map((id: string) => ({
          category: { connect: { id } }
        }))
      };
    }

    const book = await prisma.book.update({
      where: { id: resolvedParams.id },
      data: dataToUpdate,
      include: {
        categories: { include: { category: true } }
      }
    });
    return NextResponse.json(book);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update book' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.book.delete({ where: { id: resolvedParams.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
