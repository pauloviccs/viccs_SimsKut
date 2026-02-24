interface AvatarProps {
    src?: string | null;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
}

const sizes: Record<string, string> = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base',
    xl: 'w-20 h-20 text-lg',
    '2xl': 'w-32 h-32 text-2xl',
};

export function Avatar({ src, alt = 'Avatar', size = 'md', className = '' }: AvatarProps) {
    const initials = alt
        .split(' ')
        .map((word) => word[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    if (src) {
        return (
            <img
                src={src}
                alt={alt}
                className={`
          ${sizes[size]} rounded-full object-cover
          border-2 border-white/20
          ${className}
        `}
            />
        );
    }

    return (
        <div
            className={`
        ${sizes[size]} rounded-full
        bg-gradient-to-br from-[#007AFF]/60 to-[#34C759]/40
        border-2 border-white/20
        flex items-center justify-center
        font-semibold text-white/90
        ${className}
      `}
            aria-label={alt}
        >
            {initials}
        </div>
    );
}
