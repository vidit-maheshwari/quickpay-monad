import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import WagmiProvider from "@/providers/WagmiProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: 'QuickPay - Web3 Payments',
  description: 'Send cryptocurrency with natural language commands',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WagmiProvider>
          {children}
        </WagmiProvider>
      </body>
    </html>
  );
}
