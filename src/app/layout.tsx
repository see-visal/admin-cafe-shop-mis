import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/components/ReduxProvider";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

export const metadata: Metadata = {
  title: { default: "SalSee Admin", template: "%s | SalSee Admin" },
  description: "SalSee coffee shop admin dashboard",
  icons: {
    icon: "/salsee.png",
    apple: "/salsee.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('admin-theme');
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geist.variable} font-sans antialiased`}>
        <ReduxProvider>{children}</ReduxProvider>
      </body>
    </html>
  );
}

