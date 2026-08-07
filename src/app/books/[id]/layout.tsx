import type { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { getHighResThumbnail } from '@/lib/bookImage';

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  try {
    const book = await prisma.book.findUnique({ where: { id } });
    if (!book) return {};

    let authors = '';
    try {
      authors = JSON.parse(book.authors || '[]').join(', ');
    } catch {
      authors = '';
    }

    const description =
      [authors, book.publisher].filter(Boolean).join(' · ') ||
      book.description?.slice(0, 100) ||
      '도서 상세 정보';
    const image = book.thumbnail ? getHighResThumbnail(book.thumbnail) : '/og-image.png';

    return {
      title: book.title,
      description,
      openGraph: {
        type: 'article',
        title: book.title,
        description,
        images: [{ url: image }],
      },
    };
  } catch {
    return {};
  }
}

export default function BookDetailLayout({ children }: { children: React.ReactNode }) {
  return children;
}
