import { ReactNode } from "react";

// The root layout.tsx outside [locale] should only have <html> and <body> with no content.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html>
      <body>{children}</body>
    </html>
  );
}
