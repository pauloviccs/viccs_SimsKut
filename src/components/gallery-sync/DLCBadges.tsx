interface DLCBadgesProps {
    packs: any;
}

// Mapeia IDs conhecidos de expansões para rótulos amigáveis.
const PACK_LABELS: Record<string, string> = {
    base_game: 'Base Game',
    seasons: 'Seasons',
    cats_dogs: 'Cats & Dogs',
    city_living: 'City Living',
};

export function DLCBadges({ packs }: DLCBadgesProps) {
    if (!packs) return null;

    const arr: string[] = Array.isArray(packs)
        ? packs.map((p) => (typeof p === 'string' ? p : String(p.id ?? '')))
        : typeof packs === 'object'
        ? Object.keys(packs)
        : [];

    if (arr.length === 0) return null;

    return (
        <div className="flex flex-wrap gap-1 mt-2">
            {arr.slice(0, 6).map((id) => (
                <span
                    key={id}
                    className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/12 text-white/80 backdrop-blur-md border border-white/20"
                >
                    {PACK_LABELS[id] ?? id}
                </span>
            ))}
        </div>
    );
}

