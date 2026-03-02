import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import TopNav from "@/components/layout/TopNav";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/layout/AuthProvider";
import SkipLink from "@/components/layout/SkipLink";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import JsonLd, {
  personJsonLd,
  organizationJsonLd,
  websiteJsonLd,
} from "@/components/shared/JsonLd";
import "./globals.css";

const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://keithlodom.io"),
  title: "KLO | Keith L. Odom — Technology Innovator, Speaker & Pastor",
  description:
    "The official platform of Keith L. Odom. Access AI-powered advisory, leadership assessments, exclusive content vault, and personal booking — all in one premium experience.",
  manifest: "/manifest.json",
  openGraph: {
    title: "KLO | Keith L. Odom — Technology Innovator, Speaker & Pastor",
    description:
      "AI-powered advisory, leadership assessments, exclusive content vault, and personal booking — all in one premium experience.",
    url: "https://keithlodom.io",
    siteName: "KLO | Keith L. Odom",
    images: [
      {
        url: "/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "KLO | Keith L. Odom",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KLO | Keith L. Odom — Technology Innovator, Speaker & Pastor",
    description:
      "AI-powered advisory, leadership assessments, exclusive content vault, and personal booking.",
    images: ["/images/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/images/icon-192.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfairDisplay.variable} ${dmSans.variable}`}>
      <head>
        <meta name="theme-color" content="#0D1117" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </head>
      <body className="font-body antialiased bg-[#0D1117] text-klo-text">
        <AuthProvider>
          <SkipLink />
          <TopNav />
          <main id="main-content" className="min-h-screen pt-[72px] pb-[72px] md:pb-0">
            {children}
          </main>
          <BottomNav />
          <Footer />
        </AuthProvider>
        <ServiceWorkerRegister />
        <JsonLd data={personJsonLd()} />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  );
}
