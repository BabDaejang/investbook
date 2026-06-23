import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchTOCFromAladin } from '@/lib/aladin';
import { checkIsAdmin } from '@/lib/auth';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const book = await prisma.book.findUnique({
      where: { id: resolvedParams.id },
      include: {
        categories: {
          include: { category: true }
        },
        curationNotes: {
          orderBy: { createdAt: 'desc' }
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
    const { categoryIds, toc, scrapeToc } = body;

    const dataToUpdate: any = {};
    if (toc !== undefined) dataToUpdate.toc = toc;
    
    if (scrapeToc) {
      const existingBook = await prisma.book.findUnique({
        where: { id: resolvedParams.id },
        select: { isbn: true }
      });
      if (existingBook?.isbn) {
        console.log(`Dynamic scraping TOC for ISBN: ${existingBook.isbn}`);
        const scrapedToc = await fetchTOCFromAladin(existingBook.isbn);
        if (scrapedToc) {
          dataToUpdate.toc = scrapedToc;
        } else {
          dataToUpdate.toc = '목차 정보가 없습니다.';
        }
      }
    }
    
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
    const bookId = resolvedParams.id;

    // 1. 관리자 여부 확인
    const isAdmin = await checkIsAdmin();

    if (!isAdmin) {
      // 2. 일반 사용자일 경우 비밀번호 확인
      const clientPassword = request.headers.get('x-book-password');
      
      const book = await prisma.book.findUnique({
        where: { id: bookId },
        select: { password: true }
      });

      if (!book) {
        return NextResponse.json({ error: 'Book not found' }, { status: 404 });
      }

      if (!clientPassword || book.password !== clientPassword) {
        return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
      }
    }

    await prisma.book.delete({ where: { id: bookId } });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to delete book' }, { status: 500 });
  }
}
