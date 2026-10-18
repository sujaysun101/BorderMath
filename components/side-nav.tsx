"use client";

import {
  Bell,
  CalendarRange,
  Compass,
  Landmark,
  LayoutDashboard,
  Sparkles,
  WalletCards,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/trips", label: "Trips", icon: Compass },
  { href: "/timeline", label: "Timeline", icon: CalendarRange },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/fx", label: "Currency", icon: WalletCards },
  { href: "/vault", label: "Vault", icon: Landmark },
  { href: "/brief", label: "Brief", icon: Sparkles },
];

export function SideNav({ basePath }: { basePath: string }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1" aria-label="Primary">
      {LINKS.map((link) => {
        const href = `${basePath}${link.href}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
              active ? "bg-primary text-primary-foreground" : "text-foreground/80 hover:bg-muted",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
