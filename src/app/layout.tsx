import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "1·2·3 런 | 학교 운동장 마일리지",
  description:
    "유치원~6학년·희망 교직원이 학교 운동장 바퀴로 마일리지를 쌓는 비경쟁 런 프로젝트",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1f6b4a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
