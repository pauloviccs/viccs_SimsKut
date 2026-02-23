import { type ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    isLoading?: boolean;
}

const variants: Record<ButtonVariant, string> = {
    primary: 'bg-[#007AFF]/80 hover:bg-[#007AFF] text-white',
    secondary: 'bg-white/10 hover:bg-white/20 text-white/90',
    danger: 'bg-[#FF3B30]/70 hover:bg-[#FF3B30] text-white',
    ghost: 'bg-transparent hover:bg-white/10 text-white/70',
};

export function GlassButton({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    disabled,
    ...props
}: GlassButtonProps) {
    return (
        <button
            disabled={disabled || isLoading}
            className={`
        min-h-[44px] min-w-[44px] px-5 py-2.5
        rounded-[10px] font-medium text-sm
        backdrop-blur-xl border border-white/20
        transition-all duration-[150ms]
        active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
            {...props}
        >
            {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                children
            )}
        </button>
    );
}
