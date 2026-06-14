import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/AuthContext";
import NotificationHandler from '@/components/NotificationHandler';
import BildirimAc from '@/components/BildirimAc'; // Butonu içeri al

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});


export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        {/* BUTON BURADA GÖRÜNECEK */}
        <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999 }}>
          <BildirimAc />
        </div>
        
        {children}
      </body>
    </html>
  );
}
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body>
        <NotificationHandler /> {/* Bu satırı ekledik */}
        {children}
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  title: "NEAL ZİL - Öğretmen Ders Programı & Alarm Sistemi",
  description: "Öğretmenler için kişiselleştirilmiş ders programı takibi ve ders zili alarmı.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className={openSans.variable}>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
