interface GlassDividerProps {
    text?: string;
}

export function GlassDivider({ text = 'ou' }: GlassDividerProps) {
    return (
        <div className="flex items-center gap-[16px] my-[32px]">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
            <span className="text-xs text-white/30 uppercase tracking-wider font-medium">
                {text}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        </div>
    );
}
