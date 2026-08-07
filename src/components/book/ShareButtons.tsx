'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Link as LinkIcon, MessageCircle } from 'lucide-react';

interface ShareButtonsProps {
  title: string;
  description?: string;
  thumbnail?: string;
}

export function ShareButtons({ title, description, thumbnail }: ShareButtonsProps) {
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 복사되었습니다.');
    } catch {
      toast.error('링크 복사에 실패했습니다.');
    }
  };

  const shareKakao = () => {
    const Kakao = (window as any).Kakao;
    const jsKey = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
    if (!Kakao || !jsKey) {
      toast.error('카카오톡 공유를 사용할 수 없습니다. (SDK 또는 키 미설정)');
      return;
    }
    if (!Kakao.isInitialized()) {
      Kakao.init(jsKey);
    }
    const url = window.location.href;
    Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description: description || '',
        imageUrl: thumbnail || `${window.location.origin}/og-image.png`,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        { title: '자세히 보기', link: { mobileWebUrl: url, webUrl: url } },
      ],
    });
  };

  return (
    <div className="grid grid-cols-2 gap-1.5 mb-3">
      <Button size="sm" variant="outline" className="w-full text-slate-600 border-slate-200 hover:bg-slate-50 text-xs" onClick={copyLink}>
        <LinkIcon className="w-3 h-3 mr-1" /> 링크 복사
      </Button>
      <Button size="sm" className="w-full bg-[#FEE500] hover:bg-[#FEE500]/90 text-[#191919] border-none text-xs" onClick={shareKakao}>
        <MessageCircle className="w-3 h-3 mr-1" /> 카톡 공유
      </Button>
    </div>
  );
}
