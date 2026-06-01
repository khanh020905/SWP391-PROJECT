import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://quali-ielts.com"),
  title: "Quali IELTS | Nền tảng Luyện thi IELTS AI thế hệ mới",
  description: "Quali IELTS - Nền tảng luyện thi IELTS AI thế hệ mới, đầy đủ tài liệu, bài luyện, phương pháp giúp bạn chinh phục IELTS dễ dàng hơn mỗi ngày.",
  icons: {
    icon: "/icon.png",
  },
  openGraph: {
    title: "Quali IELTS | Nền tảng Luyện thi IELTS AI thế hệ mới",
    description: "Quali IELTS - Nền tảng luyện thi IELTS AI thế hệ mới, đầy đủ tài liệu, bài luyện, phương pháp giúp bạn chinh phục IELTS dễ dàng hơn mỗi ngày.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 512,
        height: 512,
        alt: "Quali IELTS Logo",
      },
    ],
    type: "website",
  },
};

export default async function LocaleLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const resolvedParams = await params;
  const messages = await getMessages({ locale: resolvedParams.locale });

  return (
    <div
      lang={resolvedParams.locale}
      className={`${geistSans.variable} ${geistMono.variable} min-h-full flex flex-col h-full antialiased`}
    >
      <NextIntlClientProvider locale={resolvedParams.locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </div>
  );
}
