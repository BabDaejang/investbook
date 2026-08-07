const USE_MOCK = !process.env.KAKAO_REST_API_KEY;

export interface NormalizedBook {
  isbn13: string;
  title: string;
  authors: string[];
  publisher: string;
  publishedDate: string;
  description: string;
  thumbnail: string;
  naverUrl: string; // 도서 상세 페이지 URL. (DB 호환을 위해 필드명 유지 — 현재는 다음/카카오 책 페이지 링크가 저장됨)
}

export async function searchBooks(query: string): Promise<NormalizedBook[]> {
  if (USE_MOCK) return getMockBooks(query);

  const url = `https://dapi.kakao.com/v3/search/book?query=${encodeURIComponent(query)}&size=12`;
  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${process.env.KAKAO_REST_API_KEY}`,
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch from Kakao API (status ${response.status})`);
  }

  const data = await response.json();

  return data.documents.map((item: any) => {
    // 카카오 isbn은 "ISBN10 ISBN13" 처럼 공백으로 구분되어 올 수 있음 → 13자리 우선 사용
    const isbnParts: string[] = item.isbn ? item.isbn.split(' ').filter(Boolean) : [];
    const isbn13 = isbnParts.find((p) => p.length === 13) || isbnParts[0] || '';

    // datetime: ISO 8601 (예: "2021-01-13T00:00:00.000+09:00") → 기존 데이터와 동일한 YYYYMMDD 형식으로 변환
    const publishedDate = item.datetime ? item.datetime.slice(0, 10).replace(/-/g, '') : '';

    return {
      isbn13,
      title: item.title || '',
      authors: item.authors || [], // 카카오는 저자를 배열로 제공
      publisher: item.publisher || '',
      publishedDate,
      description: item.contents || '',
      thumbnail: item.thumbnail || '',
      naverUrl: item.url || '', // 다음(Daum) 책 상세 페이지 URL
    };
  });
}

function getMockBooks(query: string): NormalizedBook[] {
  const match = query.toLowerCase();
  const results = MOCK_BOOKS.filter(b =>
    b.title.toLowerCase().includes(match) ||
    b.authors.some(a => a.toLowerCase().includes(match))
  );

  // 목업 데이터에 정확히 일치하는 검색어가 없더라도,
  // UI 테스트가 가능하도록 기본적으로 3권 정도를 임의로 보여줍니다.
  if (results.length === 0) {
    return MOCK_BOOKS.slice(0, 3);
  }

  return results.slice(0, 12);
}

const MOCK_BOOKS: NormalizedBook[] = [
  {
    isbn13: '9788934967355',
    title: '현명한 투자자',
    authors: ['벤저민 그레이엄'],
    publisher: '국일증권경제연구소',
    publishedDate: '20160601',
    description: '가치투자의 바이블. 워런 버핏이 극찬한 투자 고전.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3244225/32442259160.20221019114631.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9788934967355',
  },
  {
    isbn13: '9788970908864',
    title: '전설로 떠나는 월가의 영웅',
    authors: ['피터 린치', '존 로스차일드'],
    publisher: '국일증권경제연구소',
    publishedDate: '20170415',
    description: '개인투자자들이 주식 시장에서 승리할 수 있는 방법.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3244589/32445890250.20221019121935.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9788970908864',
  },
  {
    isbn13: '9788959896837',
    title: '돈의 심리학',
    authors: ['모건 하우절'],
    publisher: '인플루엔셜',
    publishedDate: '20210113',
    description: '당신은 왜 부자가 되지 못했는가? 부와 탐욕, 행복에 관한 20가지 이야기.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3246830/32468305634.20230207163013.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9788959896837',
  },
  {
    isbn13: '9791165341909',
    title: '부자 아빠 가난한 아빠 1',
    authors: ['로버트 기요사키'],
    publisher: '민음인',
    publishedDate: '20180222',
    description: '돈에 대한 철학을 바꿔주는 경제 금융 필독서.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3246726/32467261456.20221019124956.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9791165341909',
  },
  {
    isbn13: '9788998599420',
    title: '환율과 금리로 보는 앞으로 3년 경제전쟁의 미래',
    authors: ['오건영'],
    publisher: '지식노마드',
    publishedDate: '20190820',
    description: '환율과 금리의 움직임으로 읽는 거시 경제의 흐름.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3243831/32438315579.20221019114757.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9788998599420',
  },
  {
    isbn13: '9788934986615',
    title: '코스톨라니의 투자 총서 (전3권)',
    authors: ['앙드레 코스톨라니'],
    publisher: '미래엔',
    publishedDate: '20150930',
    description: '투자의 대부 코스톨라니가 남긴 지혜.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3245464/32454644673.20221019114731.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9788934986615',
  },
  {
    isbn13: '9788997396600',
    title: '재무제표 모르면 주식투자 절대로 하지마라',
    authors: ['사경인'],
    publisher: '베가북스',
    publishedDate: '20200210',
    description: '실전 투자를 위한 재무제표 분석법.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3246618/32466185618.20221019124806.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9788997396600',
  },
  {
    isbn13: '9791197125301',
    title: '주식투자 무작정 따라하기',
    authors: ['윤재수'],
    publisher: '길벗',
    publishedDate: '20210101',
    description: '주식투자 입문자를 위한 바이블.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3244243/32442434316.20221019114631.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9791197125301',
  },
  {
    isbn13: '9788959896943',
    title: '메타버스 새로운 기회',
    authors: ['김상균'],
    publisher: '베가북스',
    publishedDate: '20210330',
    description: '메타버스가 바꾸는 미래의 경제.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3246663/32466636778.20230207163013.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9788959896943',
  },
  {
    isbn13: '9788959897001',
    title: '부의 시나리오',
    authors: ['오건영'],
    publisher: '페이지2북스',
    publishedDate: '20210604',
    description: '불확실성의 시대, 투자 생존법.',
    thumbnail: 'https://shopping-phinf.pstatic.net/main_3246830/32468301234.20230207163013.jpg',
    naverUrl: 'https://search.daum.net/search?w=book&q=9788959897001',
  }
];
