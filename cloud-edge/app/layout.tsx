import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart G-ID | Public Livestock Directory",
  description:
    "Browse verified livestock profiles direct from local farmers with certified digital scale weights. Contact farmers directly with zero middleman fees.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans bg-white text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
