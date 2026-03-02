import Link from "next/link";
import { forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "gold";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonBaseProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
  className?: string;
  href?: string;
}

type ButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonBaseProps>;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-[#2764FF] to-[#21B8CD] text-white font-bold uppercase tracking-wider rounded-lg hover:shadow-[0_0_30px_rgba(39,100,255,0.25)] active:brightness-95 shadow-lg shadow-[#2764FF]/20",
  secondary:
    "border border-[#21262D] bg-[#161B22] text-[#E6EDF3] rounded-lg uppercase tracking-wider hover:bg-[#1C2128] hover:border-[#2764FF]/30 active:bg-[#21262D]",
  ghost:
    "text-[#E6EDF3] bg-transparent rounded-lg uppercase tracking-wider hover:bg-white/5 active:bg-white/10",
  gold:
    "bg-[#C8A84E] text-[#0D1117] font-bold uppercase tracking-wider rounded-lg hover:brightness-110 active:brightness-95 shadow-lg shadow-[#C8A84E]/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-8 py-3.5 text-sm rounded-lg",
  lg: "px-10 py-4.5 text-base rounded-lg",
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      children,
      className = "",
      href,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#2764FF] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const combinedStyles = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`;

    if (href) {
      return (
        <Link href={href} className={combinedStyles}>
          {children}
        </Link>
      );
    }

    return (
      <button ref={ref} className={combinedStyles} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
