import type { Metadata } from "next";
import "./globals.css";
import CookieConsent from "@/components/ui/CookieConsent";
import QuickForm from "@/components/ui/QuickForm";

export const metadata: Metadata = {
  title: "SIS Global Workforce Solutions | Empowering Employers",
  description: "SIS Global Workforce Solutions connects businesses with skilled, verified and reliable workforce across industries.",
  keywords: "workforce solutions, staffing, recruitment, manpower, SIS Global",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <CookieConsent/>
        <QuickForm />

      </body>
    </html>
  );
}
