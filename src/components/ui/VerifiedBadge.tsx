import { memo } from 'react';

interface VerifiedBadgeProps {
    /** Tamanho em pixels (default = 16). O badge mantém aspect-ratio 1:1. */
    size?: number;
    className?: string;
}

/**
 * Selo de verificação premium — estilo Instagram / Twitter / X.
 *
 * Diferenças do "achatado" anterior:
 * - viewBox 24×24 (quadrado perfeito) → sem distorção em qualquer `size`
 * - Gradiente radial azul (não flat color) → sensação 3D
 * - drop-shadow CSS (não feGaussianBlur SVG) → mais nítido em mobile
 * - `aspect-ratio: 1` garante que nunca esmaga
 */
export const VerifiedBadge = memo(function VerifiedBadge({
    size = 16,
    className = '',
}: VerifiedBadgeProps) {
    return (
        <span
            title="Conta Verificada"
            aria-label="Verificado"
            role="img"
            className={`verified-badge inline-flex items-center justify-center shrink-0 ${className}`}
            style={{
                width: size,
                height: size,
                aspectRatio: '1 / 1',
                /* drop-shadow leve — fica premium sem parecer blur */
                filter: 'drop-shadow(0 0 1.5px rgba(29,155,240,0.45))',
            }}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                width="100%"
                height="100%"
                style={{ display: 'block' }}
            >
                <defs>
                    {/* Gradiente radial: dá profundidade ao azul */}
                    <linearGradient id="vb-grad" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#2AA3F0" />
                        <stop offset="100%" stopColor="#1A8CD8" />
                    </linearGradient>
                </defs>

                {/* Badge shape — estrela hexagonal (caminho oficial Twitter) */}
                <path
                    d="M22.25 12c0-.74-.4-1.43-1.04-1.8l-.72-.42.21-.81c.2-.76-.04-1.57-.6-2.04l-.66-.56.01-.87c0-.77-.49-1.46-1.23-1.71l-.8-.28-.37-.77c-.34-.66-1.07-1.05-1.82-.96l-.87.1-.68-.56c-.6-.49-1.44-.49-2.04 0l-.68.57-.87-.1c-.75-.09-1.48.3-1.82.96l-.37.77-.8.28c-.74.25-1.23.94-1.23 1.71l.01.87-.66.56c-.56.47-.8 1.28-.6 2.04l.21.81-.72.42A2.07 2.07 0 001.75 12c0 .74.4 1.43 1.04 1.8l.72.42-.21.81c-.2.76.04 1.57.6 2.04l.66.56-.01.87c0 .77.49 1.46 1.23 1.71l.8.28.37.77c.34.66 1.07 1.05 1.82.96l.87-.1.68.57c.6.49 1.44.49 2.04 0l.68-.57.87.1c.75.09 1.48-.3 1.82-.96l.37-.77.8-.28c.74-.25 1.23-.94 1.23-1.71l-.01-.87.66-.56c.56-.47.8-1.28.6-2.04l-.21-.81.72-.42A2.07 2.07 0 0022.25 12Z"
                    fill="url(#vb-grad)"
                />

                {/* Check mark — traço arredondado */}
                <path
                    d="M9.5 15.25a.75.75 0 01-.53-.22l-2.5-2.5a.75.75 0 111.06-1.06L9.5 13.44l5.47-5.47a.75.75 0 111.06 1.06l-6 6a.75.75 0 01-.53.22Z"
                    fill="#fff"
                />
            </svg>
        </span>
    );
});
