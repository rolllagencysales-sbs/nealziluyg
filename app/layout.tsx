import type { Metadata } from "next";
import { Open_Sans } from "next/font/google";
import "./globals.css";
// Dosya yollarını @/ yerine ../ ile güncelledik
import { AuthProvider } from "../context/AuthContext"; 
import NotificationHandler from "../components/NotificationHandler";

const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
});

export const metadata: Metadata = {
  title: "NEAL ZİL - Öğretmen Ders Programı & Alarm Sistemi",
  description: "Öğretmenler için otomatik ders zili ve bildirim sistemi",
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
          <NotificationHandler />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}