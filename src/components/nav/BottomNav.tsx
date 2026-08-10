"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Map, ArrowLeftRight, User } from "lucide-react";
import { cn } from "@/lib/cn";

const TABS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/spending", label: "Spending", icon: Receipt },
  { href: "/trip", label: "Trip", icon: Map },
  { href: "/exchange", label: "Exchange", icon: ArrowLeftRight },
  { href: "/me", label: "Me", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 mx-auto w-full max-w-[430px]",
        "border-t border-line bg-canvas/95 backdrop-blur-lg",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="flex items-stretch">
        {TABS.map((tab) => {
          // "/" must match exactly, or every route would light up Home.
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
                  active ? "text-accent" : "text-ink-faint active:text-ink-muted",
                )}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 1.9} />
                <span className="text-[10px] font-medium leading-none">{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
