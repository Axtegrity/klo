"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserMenu from "@/components/layout/UserMenu";

interface NavLink {
  label: string;
  href: string;
}

const navLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "AI Advisor", href: "/advisor" },
  { label: "Assessments", href: "/assessments" },
  { label: "Vault", href: "/vault" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Strategy Rooms", href: "/strategy-rooms" },
  { label: "Booking", href: "/booking" },
];

export default function TopNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const isActive = (href: string): boolean => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  const toggleMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMenu = () => setMobileMenuOpen(false);

  // Focus trap for mobile menu
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!mobileMenuOpen) return;

      if (e.key === "Escape") {
        closeMenu();
        hamburgerRef.current?.focus();
        return;
      }

      if (e.key === "Tab" && mobileMenuRef.current) {
        const focusableElements = mobileMenuRef.current.querySelectorAll<HTMLElement>(
          'a[href], button, [tabindex]:not([tabindex="-1"])'
        );
        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl?.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl?.focus();
        }
      }
    },
    [mobileMenuOpen]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Focus first link when menu opens
  useEffect(() => {
    if (mobileMenuOpen && mobileMenuRef.current) {
      const firstLink = mobileMenuRef.current.querySelector<HTMLElement>("a[href]");
      firstLink?.focus();
    }
  }, [mobileMenuOpen]);

  return (
    <>
      <nav
        aria-label="Primary navigation"
        className="fixed top-0 left-0 right-0 z-50 h-16 bg-klo-navy/95 backdrop-blur-md border-b border-klo-slate flex items-center justify-between px-6"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <Image
            src="/logo-white.png"
            alt="KLO - Keith L. Odom"
            width={160}
            height={40}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={`relative text-sm font-medium transition-colors duration-200 pb-1 ${
                  isActive(link.href)
                    ? "text-klo-gold"
                    : "text-klo-text hover:text-klo-gold"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-klo-gold rounded-full"
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side: UserMenu + Mobile hamburger */}
        <div className="flex items-center gap-4">
          <UserMenu />

          {/* Mobile hamburger button */}
          <button
            ref={hamburgerRef}
            onClick={toggleMenu}
            className="md:hidden text-klo-text hover:text-klo-gold transition-colors duration-200"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile full-screen overlay menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            id="mobile-nav-menu"
            ref={mobileMenuRef}
            role="dialog"
            aria-label="Mobile navigation menu"
            initial={{ y: "-100%" }}
            animate={{ y: 0 }}
            exit={{ y: "-100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="fixed inset-0 z-40 bg-klo-navy/98 backdrop-blur-lg pt-20 px-8 md:hidden"
          >
            <ul className="flex flex-col gap-6">
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.07 }}
                >
                  <Link
                    href={link.href}
                    onClick={closeMenu}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={`block text-xl font-medium py-2 border-b border-klo-slate/30 transition-colors duration-200 ${
                      isActive(link.href)
                        ? "text-klo-gold border-klo-gold/50"
                        : "text-klo-text hover:text-klo-gold"
                    }`}
                  >
                    {link.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
