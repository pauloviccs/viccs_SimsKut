import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
    /** Variante premium com specular highlight */
    variant?: 'default' | 'premium';
}

const springTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 30,
    mass: 1,
};

export function GlassCard({
    children,
    className = '',
    onClick,
    variant = 'default',
}: GlassCardProps) {
    const baseClasses = variant === 'premium' ? 'glass-card' : 'glass';

    return (
        <motion.div
            onClick={onClick}
            whileHover={onClick ? { scale: 1.01 } : undefined}
            whileTap={onClick ? { scale: 0.99 } : undefined}
            transition={springTransition}
            className={`
                ${baseClasses}
                rounded-[var(--radius-md)] p-4
                transition-colors duration-[var(--duration-normal)]
                hover:bg-white/[0.10]
                ${onClick ? 'cursor-pointer' : ''}
                ${className}
            `}
        >
            {children}
        </motion.div>
    );
}
