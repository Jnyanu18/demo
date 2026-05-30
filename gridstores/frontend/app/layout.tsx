import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "Grid Stores — Everything. Delivered.", template: "%s | Grid Stores" },
  description: "Grid Stores is India's modern multi-category online shopping destination. Shop Fashion, Electronics, Home & Living, Beauty, Sports and Groceries.",
  keywords: ["online shopping", "ecommerce", "fashion", "electronics", "Grid Stores", "India"],
  openGraph: {
    siteName: "Grid Stores",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakarta.variable}>
      <body className="font-sans bg-brand-bg text-brand-text-primary antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: { fontFamily: "var(--font-plus-jakarta)", fontSize: "14px", borderRadius: "10px", border: "1px solid #E5E7EB", boxShadow: "0 8px 24px rgba(0,0,0,0.08)" },
            success: { iconTheme: { primary: "#10B981", secondary: "#fff" } },
            error: { iconTheme: { primary: "#EF4444", secondary: "#fff" } },
          }}
        />
      </body>
    </html>
  );
}
