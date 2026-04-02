import Link from "next/link";
import Image from "next/image";

const socialLinks = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/keithlodom/" },
  { label: "X (Twitter)", href: "https://twitter.com/keithlodom" },
  { label: "Instagram", href: "https://www.instagram.com/pastorkeithodom/" },
];

const quickLinks = [
  { label: "About", href: "/about" },
  { label: "KLO Intelligence", href: "/advisor" },
  { label: "Assessments", href: "/assessments" },
  { label: "Vault", href: "/vault" },
  { label: "Invite Keith To Speak", href: "/booking" },
  { label: "Book A Consultation", href: "/consult" },
  { label: "Events", href: "/events" },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="hidden md:block bg-[#0D1117] border-t border-[#21262D]">
      {/* Accent line - blue to cyan gradient */}
      <div className="h-0.5 bg-gradient-to-r from-transparent via-[#2764FF] to-[#21B8CD]" />

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
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
            <h4 className="text-klo-gold font-semibold text-sm uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-klo-muted text-sm hover:text-[#2764FF] transition-colors duration-200 inline-block py-1 min-h-[44px] leading-[44px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social */}
          <div className="space-y-4">
            <h4 className="text-klo-gold font-semibold text-sm uppercase tracking-wider">
              Connect
            </h4>
            <ul className="space-y-2">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-klo-muted text-sm hover:text-[#2764FF] transition-colors duration-200 inline-block py-1 min-h-[44px] leading-[44px]"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Download App */}
          <div className="space-y-4">
            <h4 className="text-klo-gold font-semibold text-sm uppercase tracking-wider">
              Get the App
            </h4>
            <div className="flex flex-col gap-3">
              {/* Apple App Store Badge */}
              <a
                href="https://apps.apple.com/us/app/keith-l-odom/id6760355336"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download on the App Store"
                className="inline-block hover:opacity-80 transition-opacity"
              >
                <svg width="135" height="40" viewBox="0 0 135 40" xmlns="http://www.w3.org/2000/svg">
                  <rect width="135" height="40" rx="5" fill="#000" />
                  <rect x="0.5" y="0.5" width="134" height="39" rx="4.5" stroke="#A6A6A6" fill="none" />
                  <text x="42" y="13" fill="#FFF" fontSize="8" fontFamily="system-ui, sans-serif">Download on the</text>
                  <text x="42" y="28" fill="#FFF" fontSize="16" fontWeight="600" fontFamily="system-ui, sans-serif">App Store</text>
                  <g transform="translate(10, 6)" fill="#FFF">
                    <path d="M18.9 20.2c-.5 1.1-1.1 2.1-1.9 3-.7.8-1.3 1.3-1.8 1.6-.7.4-1.5.7-2.3.7-.6 0-1.3-.2-2.1-.5-.8-.3-1.5-.5-2.1-.5-.7 0-1.4.2-2.2.5-.8.3-1.4.5-1.9.5-.8 0-1.6-.3-2.4-.8-.8-.6-1.4-1.3-2-2.4-1.3-2.1-2-4.7-2-7.6 0-2.5.5-4.5 1.6-6.1.8-1.3 1.9-2.3 3.3-3C4.4 4.5 5.9 4 7.5 4c.7 0 1.5.2 2.6.6 1 .4 1.7.6 2 .6.2 0 1-.2 2.2-.7 1.1-.4 2.1-.6 2.8-.5 2.1.2 3.7 1 4.7 2.6-1.9 1.1-2.8 2.7-2.7 4.8 0 1.6.6 2.9 1.7 4 .5.5 1.1.9 1.7 1.2-.1.4-.3.8-.5 1.2zM15.4 1c0 1.3-.5 2.4-1.3 3.5-1.1 1.3-2.4 2-3.8 1.9 0-.1 0-.3 0-.5 0-1.2.5-2.5 1.4-3.5.5-.5 1-.9 1.7-1.3.7-.3 1.3-.5 1.9-.5 0 .1 0 .3.1.4z" />
                  </g>
                </svg>
              </a>
              {/* Google Play Badge */}
              <div
                aria-label="Get it on Google Play — Coming soon"
                className="inline-block opacity-50 cursor-default"
              >
                <svg width="135" height="40" viewBox="0 0 135 40" xmlns="http://www.w3.org/2000/svg">
                  <rect width="135" height="40" rx="5" fill="#000" />
                  <rect x="0.5" y="0.5" width="134" height="39" rx="4.5" stroke="#A6A6A6" fill="none" />
                  <text x="47" y="13" fill="#FFF" fontSize="8" fontFamily="system-ui, sans-serif" textAnchor="start">GET IT ON</text>
                  <text x="47" y="28" fill="#FFF" fontSize="15" fontWeight="600" fontFamily="system-ui, sans-serif" textAnchor="start">Google Play</text>
                  <g transform="translate(10, 5)">
                    <path d="M7 2L22 15L7 28V2Z" fill="#4285F4" />
                    <path d="M7 2L18 10L7 2Z" fill="#2196F3" />
                    <path d="M7 2L18 10L22 7L7 2Z" fill="#00BCD4" />
                    <path d="M22 7L18 10L22 15L26 12L22 7Z" fill="#FFC107" />
                    <path d="M22 15L18 10L7 2V28L18 20L22 15Z" fill="none" />
                    <path d="M7 28L18 20L22 23L7 28Z" fill="#F44336" />
                    <path d="M22 23L18 20L22 15L26 18L22 23Z" fill="#FF5722" />
                    <path d="M7 2V28L18 20V10L7 2Z" fill="url(#playGrad)" opacity="0.2" />
                    <defs>
                      <linearGradient id="playGrad" x1="7" y1="2" x2="7" y2="28">
                        <stop offset="0" stopColor="#FFF" />
                        <stop offset="1" stopColor="#FFF" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </g>
                </svg>
              </div>
            </div>
            <p className="text-klo-muted/60 text-xs">
              Coming soon to iOS and Android
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-[#21262D]/50 flex flex-col md:flex-row items-center justify-between gap-4">
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
