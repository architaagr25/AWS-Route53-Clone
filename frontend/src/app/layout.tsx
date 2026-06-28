// Root layout: global metadata, fonts, and the app-wide providers
// (theme, auth, toasts). The inline themeScript runs before paint to avoid a
// flash of the wrong theme.
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/shell/ToastProvider";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/shell/ThemeProvider";

// Runs before paint to apply the saved theme and avoid a flash of the wrong one.
const themeScript = `
try {
  var t = localStorage.getItem('r53_theme');
  if (t === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (e) {}
`;

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Route 53 Management Console",
    template: "%s | Route 53",
  },
  description: "A clone of the AWS Route 53 console for managing hosted zones and DNS records.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>{children}</ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
