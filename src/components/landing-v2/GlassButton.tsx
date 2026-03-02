import { cn } from "@/lib/utils";

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'lg';
}

const GlassButton = ({ className, variant = 'primary', size = 'default', children, ...props }: GlassButtonProps) => {
  const variants = {
    primary: "gradient-box text-primary-foreground font-semibold shadow-lg hover:shadow-[0_0_30px_hsl(217_91%_60%/0.4)] hover:scale-105",
    secondary: "glass text-foreground font-medium hover:bg-[hsl(0_0%_100%/0.08)] hover:scale-105",
    ghost: "bg-transparent text-muted-foreground hover:text-foreground hover:bg-[hsl(0_0%_100%/0.05)]",
  };

  const sizes = {
    default: "px-6 py-3 text-sm",
    lg: "px-8 py-4 text-base",
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-300 cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlassButton;
