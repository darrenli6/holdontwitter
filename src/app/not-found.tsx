"use client";

import Link from "next/link";

import { useT } from "@/lib/i18n";

export default function NotFound() {
  const t = useT();
  return (
    <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-4 px-6 text-center">
      <p className="font-display text-7xl">404</p>
      <Link href="/" className="press rounded-pill bg-fg px-5 py-3 font-semibold text-bg">
        {t.notFoundBack}
      </Link>
    </main>
  );
}
