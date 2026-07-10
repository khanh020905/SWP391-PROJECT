import { ReactNode } from "react";
import { getLocale } from "next-intl/server";

// The root layout.tsx outside [locale] should only have <html> and <body> with no content.
export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
