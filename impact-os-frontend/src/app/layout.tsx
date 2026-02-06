import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { PermissionsProvider } from "@/contexts/PermissionsContext";

export const metadata: Metadata = {
  metadataBase: new URL("https://app.cycle28.org"),
  icons: {
    icon: "/cycle28-logo.png",
    apple: "/cycle28-logo.png",
  },
  title: {
    default: "Impact OS",
    template: "%s | Impact OS",
  },
  description: "Behavioral Operating System for Economic Transformation",
  openGraph: {
    title: {
      default: "Impact OS",
      template: "%s | Impact OS",
    },
    description: "Behavioral Operating System for Economic Transformation",
    siteName: "Impact OS",
    images: [
      {
        url: "/cycle28-logo.png",
        width: 1200,
        height: 630,
        alt: "Cycle 28 - Impact OS",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: "Impact OS",
      template: "%s | Impact OS",
    },
    description: "Behavioral Operating System for Economic Transformation",
    images: ["/cycle28-logo.png"],
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
      <body>
        <AuthProvider>
          <PermissionsProvider>
            {children}
          </PermissionsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
