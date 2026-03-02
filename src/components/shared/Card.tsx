interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  accentBar?: boolean;
}

export default function Card({
  children,
  className = "",
  hoverable = false,
  accentBar = false,
}: CardProps) {
  return (
    <div
      className={`bg-[#161B22] border border-[#21262D] rounded-xl p-8 ${
        accentBar ? "border-l-2 border-l-[#2764FF]" : ""
      } ${
        hoverable
          ? "transition-all duration-300 hover:-translate-y-2 hover:border-[#2764FF]/30 hover:shadow-[0_0_30px_rgba(39,100,255,0.1)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
