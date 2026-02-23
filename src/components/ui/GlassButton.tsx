import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface GlassButtonProps {
    children?: ReactNode;
    variant?: ButtonVariant;
    isLoading?: boolean;
    className?: string;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    onClick?: () => void;
    title?: string;
    style?: React.CSSProperties;
}

const variants: Record<ButtonVariant, string> = {
    primary:
        'bg-[#007AFF]/80 hover:bg-[#0A84FF] text-white shadow-[0_0_20px_rgba(0,122,255,0.15)]',
    secondary:
        'bg-white/8 hover:bg-white/14 text-white/90 border border-white/15',
    danger:
        'bg-[#FF3B30]/70 hover:bg-[#FF3B30] text-white',
    ghost:
        'bg-transparent hover:bg-white/8 text-white/70',
};

const springTransition = {
    type: 'spring' as const,
    stiffness: 500,
    damping: 30,
};

export function GlassButton({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    disabled,
    type = 'button',
    onClick,
    title,
    style,
}: GlassButtonProps) {
    return (
        <motion.button
            whileHover={!disabled && !isLoading ? { scale: 1.02 } : undefined}
            whileTap={!disabled && !isLoading ? { scale: 0.97 } : undefined}
            transition={springTransition}
            disabled={disabled || isLoading}
            type={type}
            onClick={onClick}
            title={title}
            style={style}
            className={`
                min-h-[44px] min-w-[44px] px-5 py-2.5
                rounded-[10px] font-semibold text-sm
                backdrop-blur-xl
                transition-colors duration-150
                disabled:opacity-40 disabled:cursor-not-allowed
                cursor-pointer
                ${variants[variant]}
                ${className}
            `}
        >
            {isLoading ? (
                <span className="inline-flex items-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span className="text-white/60">Carregando...</span>
                </span>
            ) : (
                children
            )}
        </motion.button>
    );
}
