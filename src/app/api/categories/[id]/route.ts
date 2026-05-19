import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { name, group, color, order } = body;

    const category = await prisma.category.update({
      where: { id: resolvedParams.id },
      data: { name, group, color, order }
    });
    return NextResponse.json(category);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    await prisma.category.delete({ where: { id: resolvedParams.id } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
