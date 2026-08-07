import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://investbook-sage.vercel.app'),
  title: {
    default: "세종 금융경제교육 교사연구회 도서 탐색기",
    template: "%s | 세종 금융경제교육 교사연구회 도서 탐색기",
  },
  description: "금융 및 경제 도서를 체계적으로 탐색하고 큐레이션하는 플랫폼",
  openGraph: {
    type: "website",
    siteName: "세종 금융경제교육 교사연구회 도서 탐색기",
    title: "세종 금융경제교육 교사연구회 도서 탐색기",
    description: "금융 및 경제 도서를 체계적으로 탐색하고 큐레이션하는 플랫폼",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans">
        <Script src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js" strategy="afterInteractive" />
        <QueryProvider>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
