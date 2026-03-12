import { memo } from 'react';

interface VerifiedBadgeProps {
    size?: number;
    className?: string;
}

/**
 * Selo de verificação premium.
 * SVG puro com proporções perfeitas. Uma estrela suave ("rosette") com check suave, 
 * remetendo a padrões premium (iOS/Instagram/Substack).
 */
export const VerifiedBadge = memo(function VerifiedBadge({
    size = 16,
    className = '',
}: VerifiedBadgeProps) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            width={size}
            height={size}
            aria-label="Verificado"
            role="img"
            title="Conta Verificada"
            className={`shrink-0 text-[#1d9bf0] ${className}`}
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                minWidth: size,
                minHeight: size,
                verticalAlign: 'text-bottom', // Melhora o alinhamento com o texto
            }}
        >
            {/* Roseta - A forma de estrela suave */}
            <path
                d="M10.16 2.50201C11.1963 1.25828 13.1257 1.25828 14.162 2.50201L14.7176 3.16879C15.2016 3.74966 15.9529 4.05315 16.7196 3.98774L17.5878 3.91369C19.2483 3.772 20.6128 5.13653 20.4711 6.79701L20.3971 7.66521C20.3316 8.43195 20.6351 9.18321 21.216 9.66723L21.8828 10.2228C23.1265 11.2591 23.1265 13.1885 21.8828 14.2248L21.216 14.7804C20.6351 15.2644 20.3316 16.0157 20.3971 16.7824L20.4711 17.6506C20.6128 19.3111 19.2483 20.6756 17.5878 20.5339L16.7196 20.4599C15.9529 20.3945 15.2016 20.698 14.7176 21.2788L14.162 21.9456C13.1257 23.1893 11.1963 23.1893 10.16 21.9456L9.60443 21.2788C9.1204 20.698 8.36908 20.3945 7.60235 20.4599L6.73416 20.5339C5.07368 20.6756 3.70915 19.3111 3.85084 17.6506L3.92489 16.7824C3.9903 16.0157 3.68681 15.2644 3.10594 14.7804L2.43916 14.2248C1.19543 13.1885 1.19543 11.2591 2.43916 10.2228L3.10594 9.66723C3.68681 9.18321 3.9903 8.43195 3.92489 7.66521L3.85084 6.79701C3.70915 5.13653 5.07368 3.772 6.73416 3.91369L7.60235 3.98774C8.36908 4.05315 9.1204 3.74966 9.60443 3.16879L10.16 2.50201Z"
                fill="currentColor"
            />
            {/* Checkmark */}
            <path
                d="M10.7411 15.542L7.33045 12.1313C6.96574 11.7666 6.96574 11.1752 7.33045 10.8105C7.69516 10.4457 8.28659 10.4457 8.6513 10.8105L10.7411 12.9003L15.6708 7.9706C16.0355 7.60589 16.6269 7.60589 16.9916 7.9706C17.3563 8.3353 17.3563 8.92674 16.9916 9.29144L10.7411 15.542Z"
                fill="white"
            />
        </svg>
    );
});

