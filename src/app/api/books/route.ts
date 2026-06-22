import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { fetchTOCFromAladin } from '@/lib/aladin';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const categoryIds = searchParams.get('categoryIds');
  const sort = searchParams.get('sort');
  const q = searchParams.get('q');

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'publishedDate_desc') orderBy = { publishedDate: 'desc' };
  else if (sort === 'title_asc') orderBy = { title: 'asc' };

  try {
    // AND 조건을 위해 categoryIds가 콤마로 구분되어 들어올 경우 처리
    const categoryIdArray = categoryIds ? categoryIds.split(',') : [];
    
    // AND 로직: 모든 선택된 카테고리를 포함해야 함
    const categoryFilters = categoryIdArray.map(id => ({
      categories: {
        some: { categoryId: id }
      }
    }));

    const books = await prisma.book.findMany({
      where: {
        ...(q ? { title: { contains: q } } : {}),
        ...(categoryFilters.length > 0 ? { AND: categoryFilters } : {}),
      },
      include: {
        categories: {
          include: { category: true }
        }
      },
      orderBy,
    });
    return NextResponse.json(books);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to fetch books' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { isbn13, title, authors, publisher, publishedDate, description, thumbnail, naverUrl, categoryIds, note, curator, toc, password } = body;

    // 알라딘에서 목차(TOC) 정보 자동 스크래핑 시도
    let finalToc = toc;
    if (!finalToc && isbn13) {
      console.log(`Attempting to automatically scrape TOC for ISBN ${isbn13} (${title})...`);
      const scrapedToc = await fetchTOCFromAladin(isbn13);
      if (scrapedToc) {
        finalToc = scrapedToc;
      }
    }

    const book = await prisma.book.create({
      data: {
        isbn: isbn13,
        title,
        authors: JSON.stringify(authors || []),
        publisher,
        publishedDate,
        description,
        thumbnail,
        naverUrl,
        toc: finalToc,
        password: password || '0000',
        categories: {
          create: (categoryIds || []).map((id: string) => ({
            category: { connect: { id } }
          }))
        },
        ...(note || curator ? {
          curationNotes: {
            create: {
              note: note || '',
              curator: curator || '연구원'
            }
          }
        } : {})
      },
      include: {
        categories: { include: { category: true } }
      }
    });
    return NextResponse.json(book, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Failed to save book' }, { status: 500 });
  }
}

