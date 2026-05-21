/**
 * 알라딘 상세 페이지에서 도서 목차(TOC) 정보를 자동으로 스크래핑하는 헬퍼 함수
 */

function cleanTOC(tocHtml: string): string {
  // 1. <br> or <br/> or <BR> 태그를 뉴라인(\n)으로 치환
  let text = tocHtml.replace(/<br\s*\/?>/gi, '\n');
  // 2. 모든 HTML 태그 제거
  text = text.replace(/<[^>]+>/g, '');
  // 3. 접기 버튼 등 알라딘 UI 관련 텍스트 제거
  text = text.replace(/접기\s*$/i, '');
  // 4. 각 줄을 다듬고 빈 줄은 완전히 제거하여 촘촘하게 만듦
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(line => line !== '')
    .join('\n');
}

export async function fetchTOCFromAladin(isbn: string): Promise<string | null> {
  if (!isbn) return null;
  
  // 하이픈 등 숫자 이외의 문자 제거
  const cleanIsbn = isbn.replace(/[^0-9]/g, '');
  if (!cleanIsbn) return null;

  try {
    const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

    // 1단계: 알라딘 검색 페이지 호출하여 ItemId 찾기
    const searchUrl = `https://www.aladin.co.kr/search/wsearchresult.aspx?SearchWord=${cleanIsbn}`;
    const searchRes = await fetch(searchUrl, {
      headers: { 'User-Agent': userAgent }
    });
    
    if (!searchRes.ok) {
      console.warn(`Aladin search failed for ISBN: ${cleanIsbn}, status: ${searchRes.status}`);
      return null;
    }
    
    const searchHtml = await searchRes.text();
    
    // 본문 검색 리스트 영역에서 ItemId 추출 시도 (광고 배너 제외하기 위해 bo3 클래스나 cover_area 영역 타겟)
    let itemId: string | null = null;
    
    // 패턴 A: bo3 클래스를 가진 상세 링크
    const bo3Match = searchHtml.match(/class=["']bo3["'][^>]*href=["'][^"']*ItemId=(\d+)/i) ||
                     searchHtml.match(/href=["'][^"']*ItemId=(\d+)[^"']*["'][^>]*class=["']bo3["']/i);
    
    if (bo3Match) {
      itemId = bo3Match[1];
    } else {
      // 패턴 B: 검색 결과 본문의 일반 wproduct 링크 중 첫 매칭 (배너 광고 패턴이 아닌 경우)
      const matches = searchHtml.matchAll(/wproduct\.aspx\?ItemId=(\d+)/gi);
      for (const m of matches) {
        const matchedId = m[1];
        // 간단한 광고 거르기 검증 (예: banner가 포함된 줄이 아니면 선택)
        const idx = searchHtml.indexOf(m[0]);
        const context = searchHtml.substring(Math.max(0, idx - 150), Math.min(searchHtml.length, idx + 150));
        if (!context.includes('banner') && !context.includes('arrival_hlayer')) {
          itemId = matchedId;
          break;
        }
      }
    }

    if (!itemId) {
      console.warn(`ItemId not found in Aladin search for ISBN: ${cleanIsbn}`);
      return null;
    }
    
    console.log(`Aladin ItemId found: ${itemId} for ISBN: ${cleanIsbn}`);

    // 2단계: 도서 상세 페이지 호출하여 내부 Product Code 추출하기
    const detailUrl = `https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=${itemId}`;
    const detailRes = await fetch(detailUrl, {
      headers: { 'User-Agent': userAgent }
    });

    if (!detailRes.ok) {
      console.warn(`Aladin detail page load failed for ItemId: ${itemId}`);
      return null;
    }

    const detailHtml = await detailRes.text();
    
    // Introduce placeholder div의 ID에서 내부 식별코드(예: K192034444) 추출
    const introduceMatch = detailHtml.match(/id=["']([a-zA-Z0-9]+)_Introduce["']/i);
    if (!introduceMatch) {
      console.warn(`Introduce placeholder ID not found on page for ItemId: ${itemId}`);
      return null;
    }

    const productCode = introduceMatch[1];
    console.log(`Aladin Product Code extracted: ${productCode}`);

    // 3단계: getContents AJAX API 호출하여 목차(TOC) 가져오기
    const contentsUrl = `https://www.aladin.co.kr/shop/product/getContents.aspx?ISBN=${productCode}&name=Introduce&type=0`;
    const contentsRes = await fetch(contentsUrl, {
      headers: { 
        'User-Agent': userAgent,
        'Referer': detailUrl // 중요: 알라딘에서 비동기 요청 시 리퍼러 체크를 할 수 있음
      }
    });

    if (!contentsRes.ok) {
      console.warn(`Aladin getContents AJAX failed for Product Code: ${productCode}`);
      return null;
    }

    const contentsHtml = await contentsRes.text();

    // 4단계: HTML에서 div_TOC_All 또는 div_TOC_Short 영역 매칭
    const tocAllMatch = contentsHtml.match(/id=["']div_TOC_All["'][^>]*>([\s\S]*?)<\/div>/i);
    const tocShortMatch = contentsHtml.match(/id=["']div_TOC_Short["'][^>]*>([\s\S]*?)<\/div>/i);

    let rawTOC = '';
    if (tocAllMatch) {
      rawTOC = tocAllMatch[1];
    } else if (tocShortMatch) {
      rawTOC = tocShortMatch[1];
    } else {
      // 목차 div가 직접 없고 텍스트만 들어있는 드문 케이스 대응
      const mockchaIndex = contentsHtml.indexOf('목차');
      if (mockchaIndex !== -1) {
        rawTOC = contentsHtml.substring(mockchaIndex);
      }
    }

    if (!rawTOC) {
      console.warn(`TOC container not found in AJAX response for Product Code: ${productCode}`);
      return null;
    }

    // 5단계: 정제 함수를 거쳐 깔끔한 텍스트 목차 반환
    const cleanedTOC = cleanTOC(rawTOC);
    console.log(`Successfully fetched TOC from Aladin for ISBN: ${cleanIsbn} (${cleanedTOC.length} chars)`);
    return cleanedTOC;

  } catch (error: any) {
    console.error(`Error scraping Aladin TOC for ISBN: ${cleanIsbn}:`, error.message || error);
    return null;
  }
}
