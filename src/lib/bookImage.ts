/**
 * 카카오 썸네일 URL(저해상도 축소판)을 원본 고해상도 이미지 URL로 변환한다.
 * - kakaocdn 썸네일이면 fname 파라미터의 원본 URL을 반환 (http는 https로 교체)
 * - 그 외 URL(네이버 pstatic 등)은 그대로 반환
 */
export function getHighResThumbnail(url?: string | null): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('kakaocdn.net') && u.pathname.startsWith('/thumb/')) {
      const fname = u.searchParams.get('fname');
      if (fname) {
        return fname.replace(/^http:\/\//, 'https://');
      }
    }
  } catch {
    // URL 파싱 실패 시 원본 그대로 반환
  }
  return url;
}
