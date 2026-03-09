import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import TopNav from "@/components/layout/TopNav";
import BottomNav from "@/components/layout/BottomNav";
import Footer from "@/components/layout/Footer";
import AuthProvider from "@/components/layout/AuthProvider";
import SkipLink from "@/components/layout/SkipLink";
import ServiceWorkerRegister from "@/components/layout/ServiceWorkerRegister";
import CapacitorInit from "@/components/layout/CapacitorInit";
import TitleFade from "@/components/layout/TitleFade";
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
  metadataBase: new URL("https://klo-app.vercel.app"),
  alternates: {
    canonical: "https://klo-app.vercel.app",
  },
  title: "Keith L. Odom | AI Strategist, Leadership Speaker & Executive Advisor",
  description:
    "Access AI-powered advisory, leadership assessments, exclusive content vault, and personal booking from Keith L. Odom — all in one premium experience.",
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
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.webp", sizes: "192x192", type: "image/webp" },
    ],
    apple: "/apple-touch-icon.png",
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
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  var cap=window.Capacitor;
  if(!cap||!cap.isNativePlatform||!cap.isNativePlatform())return;
  var _f=window.fetch.bind(window);
  window.fetch=function(input,init){
    if(typeof input==='string'){
      if(input.startsWith('/api/')||input.startsWith('/api?')){
        input='https://keithlodom.ai'+input;
        init=Object.assign({},init||{},{credentials:'include'});
      }
    }else if(input instanceof Request){
      var u=new URL(input.url);
      if((u.hostname==='localhost'||u.protocol==='capacitor:')&&u.pathname.startsWith('/api/')){
        var newUrl='https://keithlodom.ai'+u.pathname+u.search;
        input=new Request(newUrl,input);
        init=Object.assign({},init||{},{credentials:'include'});
      }
    }
    return _f(input,init);
  };
})();`,
          }}
        />
      </head>
      <body className="font-body antialiased bg-[#0D1117] text-klo-text no-overscroll">
        <AuthProvider>
          <SkipLink />
          <TopNav />
          <main
            id="main-content"
            className="min-h-screen md:pb-0"
            style={{
              paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
              paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            {children}
          </main>
          <BottomNav />
          <Footer />
        </AuthProvider>
        <TitleFade />
        <CapacitorInit />
        <ServiceWorkerRegister />
        <JsonLd data={personJsonLd()} />
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
      </body>
    </html>
  );
}
