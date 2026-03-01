import { motion } from 'framer-motion';

interface EAItemCardProps {
    item: {
        ea_original_id: string;
        title: string;
        thumbnail_url: string | null;
        download_count: number | null;
    };
    selected: boolean;
    onClick: () => void;
}

export function EAItemCard({ item, selected, onClick }: EAItemCardProps) {
    return (
        <motion.div
            layoutId={`ea-card-${item.ea_original_id}`}
            whileHover={{ y: -5, scale: 1.02 }}
            onClick={onClick}
            className="relative group cursor-pointer rounded-2xl overflow-hidden h-64 border border-white/10 shadow-[0_8px_32px_0_rgba(31,38,135,0.07)]"
        >
            {/* Imagem de Fundo puxada da API da EA */}
            {item.thumbnail_url ? (
                <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                />
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#007AFF]/40 via-[#5865F2]/30 to-[#34C759]/40" />
            )}

            {/* Overlay de seleção */}
            <div
                className={`absolute inset-0 pointer-events-none transition-colors duration-200 ${
                    selected ? 'bg-[#34C759]/20' : 'bg-black/0 group-hover:bg-black/10'
                }`}
            />

            {/* Componente Liquid Glass Inferior */}
            <div className="absolute bottom-0 w-full p-4 bg-white/10 backdrop-blur-md border-t border-white/20">
                <h3 className="text-white font-medium drop-shadow-md truncate">
                    {item.title}
                </h3>
                <p className="text-white/70 text-sm">
                    {item.download_count != null ? `${item.download_count} downloads` : 'Downloads desconhecidos'}
                </p>
            </div>

            {/* Marca de seleção */}
            {selected && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#34C759] flex items-center justify-center text-[10px] font-bold text-black shadow-lg">
                    ✔
                </div>
            )}
        </motion.div>
    );
}

