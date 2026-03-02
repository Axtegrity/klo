"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, MessageSquare, ClipboardCheck, BookOpen, Users, User } from "lucide-react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { label: "Home", href: "/", icon: Home },
  { label: "Advisor", href: "/advisor", icon: MessageSquare },
  { label: "Assess", href: "/assessments", icon: ClipboardCheck },
  { label: "Vault", href: "/vault", icon: BookOpen },
  { label: "Rooms", href: "/strategy-rooms", icon: Users },
  { label: "Profile", href: "/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 h-[72px] bg-klo-navy/95 backdrop-blur-md border-t border-klo-slate md:hidden"
    >
      <ul className="flex items-center justify-around h-full px-2">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex flex-col items-center gap-1"
                aria-current={active ? "page" : undefined}
              >
                <motion.div
                  whileTap={{ scale: 0.85 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  className="flex flex-col items-center gap-1"
                >
                  <Icon
                    size={22}
                    aria-hidden="true"
                    className={`transition-colors duration-200 ${
                      active ? "text-klo-gold" : "text-klo-muted"
                    }`}
                  />
                  <span
                    className={`text-[10px] font-medium transition-colors duration-200 ${
                      active ? "text-klo-gold" : "text-klo-muted"
                    }`}
                  >
                    {item.label}
                  </span>
                </motion.div>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
