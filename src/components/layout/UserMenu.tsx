"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { User, Settings, LogOut } from "lucide-react";

export default function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="w-8 h-8 rounded-full bg-klo-slate animate-pulse" />
    );
  }

  if (!session) {
    return (
      <Link
        href="/auth/signin"
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-klo-gold text-klo-gold hover:bg-klo-gold/10 active:bg-klo-gold/20 transition-colors duration-200"
      >
        Sign In
      </Link>
    );
  }

  const initials = session.user?.name
    ? session.user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : session.user?.email?.[0]?.toUpperCase() ?? "U";

  const menuItems = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/profile", icon: Settings },
  ];

  return (
    <div ref={menuRef} className="relative">
      {/* Avatar button */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="w-9 h-9 rounded-full bg-klo-gold/15 border border-klo-gold/40 flex items-center justify-center text-klo-gold text-sm font-semibold hover:bg-klo-gold/25 transition-colors duration-200 cursor-pointer"
        aria-label="User menu"
      >
        {session.user?.image ? (
          <Image
            src={session.user.image}
            alt=""
            width={36}
            height={36}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-0 mt-2 w-56 bg-klo-dark border border-klo-slate rounded-xl shadow-xl overflow-hidden z-50"
          >
            {/* User info */}
            <div className="px-4 py-3 border-b border-klo-slate">
              <p className="text-sm font-medium text-klo-text truncate">
                {session.user?.name ?? "User"}
              </p>
              <p className="text-xs text-klo-muted truncate">
                {session.user?.email}
              </p>
            </div>

            {/* Menu items */}
            <div className="py-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-klo-text hover:bg-white/5 transition-colors"
                >
                  <item.icon size={16} className="text-klo-muted" />
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Sign out */}
            <div className="border-t border-klo-slate py-1">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-white/5 transition-colors cursor-pointer"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
