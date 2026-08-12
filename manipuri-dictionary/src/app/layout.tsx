import type { Metadata } from "next";
import { Inter, Noto_Sans_Meetei_Mayek } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const meetei = Noto_Sans_Meetei_Mayek({
  variable: "--font-meetei-mayek",
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100"),
  title: {
    default: "Manipuri Dictionary — English ↔ Meitei Mayek",
    template: "%s | Manipuri Dictionary",
  },
  description:
    "A modern digital dictionary for the Manipuri language. Search English words and discover their Meitei Mayek translations, definitions, and examples.",
  keywords: ["manipuri", "meitei", "meitei mayek", "dictionary", "english to manipuri"],
  openGraph: {
    title: "Manipuri Dictionary",
    description:
      "A modern digital dictionary for the Manipuri language. Search English words and discover their Meitei Mayek translations.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${meetei.variable} font-sans antialiased min-h-screen flex flex-col bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}