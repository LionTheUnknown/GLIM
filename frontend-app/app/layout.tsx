import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import PlasmaBackground from "../components/PlasmaBackground";
import PrimeReactProviderWrapper from "../components/PrimeReactProvider";
import Header from "../components/Header";
import Footer from "../components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GLIM - Candle-type Messages",
  description: "A candle-type message platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
      >
        <PrimeReactProviderWrapper>
        <PlasmaBackground />
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <main className="app-content">
          {children}
            </main>
            <Footer />
        </div>
        </PrimeReactProviderWrapper>
      </body>
    </html>
  );
}
