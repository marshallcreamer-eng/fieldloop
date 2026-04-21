import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FieldLoop — RYOBI Advanced Engineering",
  description: "Beta tester research platform for RYOBI Advanced Engineering",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-ryobi-offwhite text-ryobi-dark">
        {children}
      </body>
    </html>
  );
}
