"use client";

import { usePathname, Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  // Toggle between 'vi' and 'en'
  const nextLocale = locale === "vi" ? "en" : "vi";
  const displayLabel = locale === "vi" ? "EN" : "VI";

  const isTedPage = pathname.includes("/speaking/ted");
  const colorClass = isTedPage
    ? "text-[#b5a9a9] hover:text-[#E62B1E]"
    : "text-[#1b3d1e] hover:text-[#3B5C37]";

  return (
    <Link
      href={pathname}
      locale={nextLocale}
      className={`text-sm font-bold transition-colors cursor-pointer select-none px-2 ${colorClass}`}
    >
      {displayLabel}
    </Link>
  );
}
