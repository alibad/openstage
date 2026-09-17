"use client";

import { useRouter, usePathname } from "next/navigation";
import { Printer } from "lucide-react";

export function PrintButton() {
  const router = useRouter();
  const pathname = usePathname();

  const handlePrint = () => {
    router.push(`${pathname}?print`);
    setTimeout(() => window.print(), 1500);
  };

  return (
    <button
      onClick={handlePrint}
      className="fixed top-6 right-6 z-[100] flex items-center gap-2 px-4 py-2.5 rounded-lg bg-bg-dark/80 backdrop-blur-md border border-white/10 text-white text-sm font-semibold shadow-lg hover:bg-bg-dark transition-all print-hidden"
    >
      <Printer className="w-4 h-4" />
      <span>Print</span>
    </button>
  );
}
