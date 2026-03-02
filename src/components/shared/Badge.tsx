type BadgeVariant = "gold" | "cyan" | "blue" | "green" | "lime" | "muted" | "purple" | "magenta";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  gold: "bg-[#C8A84E]/15 text-[#C8A84E] border-[#C8A84E]/30",
  cyan: "bg-[#21B8CD]/15 text-[#21B8CD] border-[#21B8CD]/30",
  blue: "bg-[#2764FF]/15 text-[#2764FF] border-[#2764FF]/30",
  green: "bg-[#6ECF55]/15 text-[#6ECF55] border-[#6ECF55]/30",
  lime: "bg-[#6ECF55]/15 text-[#6ECF55] border-[#6ECF55]/30",
  muted: "bg-white/5 text-[#8B949E] border-white/10",
  purple: "bg-[#8840FF]/15 text-[#8840FF] border-[#8840FF]/30",
  magenta: "bg-[#F77A81]/15 text-[#F77A81] border-[#F77A81]/30",
};

export default function Badge({
  variant = "gold",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full border ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
