import { type ReactNode } from 'react';

interface GlassCardProps {
    children: ReactNode;
    className?: string;
    onClick?: () => void;
}

export function GlassCard({ children, className = '', onClick }: GlassCardProps) {
    return (
        <div
            onClick={onClick}
            className={`
        glass rounded-[16px] p-4
        transition-all duration-[250ms]
        hover:bg-white/[0.14] hover:scale-[1.01]
        active:scale-[0.99]
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
