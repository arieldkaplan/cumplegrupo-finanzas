"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Baby,
  Calendar,
  Wallet,
  Gift,
  Settings,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/grupos", label: "Grupos", icon: Users },
  { href: "/ninos", label: "Niños", icon: Baby },
  { href: "/calendario", label: "Calendario", icon: Calendar },
  { href: "/aportes", label: "Aportes", icon: Wallet },
  { href: "/regalos", label: "Regalos", icon: Gift },
  { href: "/configuracion", label: "Configuración", icon: Settings },
] as const;

function NavLinks({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            onClick={onLinkClick}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="size-5 shrink-0" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Navegación principal: sidebar en md+, drawer en móvil (mobile-first). */
export function AppNav() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Abrir menú">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="border-b p-4 text-left">
              <SheetTitle>CumpleGrupo</SheetTitle>
            </SheetHeader>
            <div className="p-4">
              <NavLinks onLinkClick={() => setOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <aside className="hidden w-56 shrink-0 flex-col border-r bg-card md:flex">
        <div className="flex h-14 items-center border-b px-4 font-semibold">
          CumpleGrupo
        </div>
        <div className="flex-1 overflow-auto p-3">
          <NavLinks />
        </div>
      </aside>
    </>
  );
}
