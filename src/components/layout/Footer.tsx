import Link from "next/link";
import Image from "next/image";

const socialLinks = [
  { label: "LinkedIn", href: "https://linkedin.com" },
  { label: "Twitter", href: "https://twitter.com" },
  { label: "Instagram", href: "https://instagram.com" },
  { label: "YouTube", href: "https://youtube.com" },
];

const quickLinks = [
  { label: "About", href: "/about" },
  { label: "AI Advisor", href: "/advisor" },
  { label: "Assessments", href: "/assessments" },
  { label: "Vault", href: "/vault" },
  { label: "Booking", href: "/booking" },
  { label: "Conference", href: "/conference" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block bg-klo-dark border-t border-klo-slate">
      {/* Gold accent line */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-klo-gold to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Branding */}
          <div className="space-y-4">
            <Image
              src="/logo-white.png"
              alt="KLO - Keith L. Odom"
              width={160}
              height={40}
              className="h-8 w-auto"
            />
            <p className="text-klo-muted text-sm leading-relaxed">
              Keith L. Odom — Technology Innovator, Speaker &amp; Pastor.
              Empowering transformation through faith, leadership, and innovation.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-klo-text font-semibold text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-klo-muted text-sm hover:text-klo-gold transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-klo-text font-semibold text-sm uppercase tracking-wider">
              Connect
            </h4>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-klo-muted text-sm hover:text-klo-gold transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-klo-slate/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-klo-muted text-xs">
            &copy; {currentYear} Keith L. Odom. All rights reserved.
          </p>
          <p className="text-klo-muted/60 text-xs">
            Powered by KLO Platform
          </p>
        </div>
      </div>
    </footer>
  );
}
