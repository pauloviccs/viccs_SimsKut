import { memo } from 'react';

interface VerifiedBadgeProps {
    size?: number;
    className?: string;
}

/**
 * Selo de verificação azul — estilo Twitter/X.
 * Renderiza um SVG de ✓ dentro de círculo azul com brilho sutil.
 */
export const VerifiedBadge = memo(function VerifiedBadge({ size = 16, className = '' }: VerifiedBadgeProps) {
    return (
        <span
            title="Conta Verificada"
            className={`inline-flex items-center shrink-0 ${className}`}
            style={{ width: size, height: size }}
        >
            <svg
                viewBox="0 0 22 22"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width={size}
                height={size}
                aria-label="Verificado"
                role="img"
            >
                {/* Glow filter */}
                <defs>
                    <filter id="verified-glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="1" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>
                {/* Badge shape — hexagonal star like Twitter */}
                <path
                    d="M20.396 11c.003-.34-.184-.66-.47-.82l-1.725-1.038.452-1.924c.08-.34-.04-.7-.3-.9l-1.595-1.23.024-2.005c0-.35-.22-.66-.55-.78L14.8 1.61l-.913-1.792a.834.834 0 0 0-.91-.378L11 .153 9.023-.56a.834.834 0 0 0-.91.378L7.2 1.61l-1.934.693c-.33.12-.55.43-.55.78l.025 2.004-1.595 1.23c-.26.2-.38.56-.3.9l.453 1.925-1.726 1.037a.88.88 0 0 0-.47.82c.003.34.19.66.476.82l1.725 1.038-.452 1.924c-.08.34.04.7.3.9l1.595 1.228-.024 2.006c0 .35.22.66.55.78l1.932.693.913 1.79c.17.33.54.5.91.38L11 21.847l1.978.713c.37.12.74-.05.91-.378l.913-1.79 1.933-.694c.33-.12.55-.43.55-.78l-.025-2.005 1.595-1.23c.26-.2.38-.558.3-.898l-.453-1.925 1.726-1.037a.88.88 0 0 0 .47-.82Z"
                    fill="#1D9BF0"
                    filter="url(#verified-glow)"
                />
                {/* Check mark */}
                <path
                    d="M9.585 14.929a.96.96 0 0 1-.68-.282L6.27 12.012a.96.96 0 0 1 1.358-1.358l1.957 1.957 4.786-4.786a.96.96 0 0 1 1.358 1.358l-5.466 5.466a.96.96 0 0 1-.678.28Z"
                    fill="#fff"
                />
            </svg>
        </span>
    );
});
