import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: boolean;
  children: React.ReactNode;
}

const GlassCard = ({ className, glow = false, children, ...props }: GlassCardProps) => {
  return (
    <div
      className={cn(
        "glass glass-highlight rounded-2xl p-6 transition-all duration-300",
        glow && "hover:shadow-[0_0_40px_hsl(217_91%_60%/0.15)]",
        "hover:border-[hsl(0_0%_100%/0.12)] hover:scale-[1.02]",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

export default GlassCard;
