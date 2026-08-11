"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, Map, ArrowLeftRight, Users } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Figma "Bottom Nav" instance: bg matches canvas exactly. A near-invisible
 * 4%-opacity white hairline sits on top, just enough to separate the tab bar
 * from scrolled content without reading as a hard divider.
 * Icons per the extracted component names: IconHomeLine, IconWallet3 (not a
 * receipt), IconMap, IconArrowLeftRight, IconPeople2 (two people, not one).
 */
const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/spending", label: "Spending", icon: Wallet },
  { href: "/trip", label: "Trip", icon: Map },
  { href: "/exchange", label: "Exchange", icon: ArrowLeftRight },
  { href: "/me", label: "Me", icon: Users },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px] border-t border-white/[0.08] bg-canvas pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="flex items-stretch">
        {TABS.map((tab) => {
          // "/" must match exactly, or every route lights up Home.
          const active =
            tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-1 transition-colors",
                  active ? "text-ink" : "text-ink-5 active:text-ink-3",
                )}
              >
                <Icon size={20} strokeWidth={active ? 2.4 : 1.9} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
