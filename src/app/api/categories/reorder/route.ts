import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    const updatePromises = body.map((item) =>
      prisma.category.update({
        where: { id: item.id },
        data: { order: item.order }
      })
    );

    await prisma.$transaction(updatePromises);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to reorder categories' }, { status: 500 });
  }
}
