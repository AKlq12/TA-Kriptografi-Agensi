import "./globals.css";
// Impor font "Roboto Mono"
import { Roboto_Mono } from "next/font/google";

// Konfigurasi font
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  weight: ["400", "700"], // Ambil ketebalan reguler dan bold
});

export const metadata = {
  title: "Aplikasi Kriptografi TA",
  description: "Project TA by User",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      {/* Terapkan font-mono dan latar belakang baru */}
      <body className={`${robotoMono.className} font-mono bg-gray-950 text-gray-200 min-h-screen`}>
        {children}
      </body>
    </html>
  );
}