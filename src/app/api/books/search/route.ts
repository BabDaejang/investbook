import { NextResponse } from 'next/server';
import { searchBooks } from '@/lib/kakao';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Missing query parameter' }, { status: 400 });
  }

  try {
    const results = await searchBooks(query);
    return NextResponse.json({ items: results, totalResults: results.length });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Book search is temporarily unavailable' }, { status: 500 });
  }
}
