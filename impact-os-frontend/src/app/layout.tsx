import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Impact OS | Dashboard",
  description: "Behavioral Operating System for Economic Transformation",
  openGraph: {
    title: "Impact OS",
    description: "Behavioral Operating System for Economic Transformation",
    images: [
      {
        url: "/triad.webp",
        width: 1200,
        height: 630,
        alt: "Impact OS - Skill Triad",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Impact OS",
    description: "Behavioral Operating System for Economic Transformation",
    images: ["/triad.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Jost:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
