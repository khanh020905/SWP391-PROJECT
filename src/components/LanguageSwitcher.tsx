"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  // Toggle between 'vi' and 'en'
  const nextLocale = locale === "vi" ? "en" : "vi";
  const displayLabel = locale === "vi" ? "EN" : "VI"; // as per user spec nav.switchLang, but it's simpler to just show what they switch to or the current one.
  // Wait, user specifies:
  // nav.switchLang: EN for Vietnamese (switch to EN), VI for English (switch to VI)

  return (
    <Link
      href={pathname}
      locale={nextLocale}
      className="text-sm font-bold text-[#1b3d1e] hover:text-[#3B5C37] transition-colors cursor-pointer select-none px-2"
    >
      {displayLabel}
    </Link>
  );
}
